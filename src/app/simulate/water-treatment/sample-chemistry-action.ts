'use server'

import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawn } from 'node:child_process'

const PHREEQC_BIN = join(process.cwd(), 'tools', 'research', 'phreeqc-pin', '3.8.6-17100', 'bin', 'phreeqc.exe')
const PHREEQC_DATABASE = join(process.cwd(), 'tools', 'research', 'phreeqc-pin', '3.8.6-17100', 'database', 'minteq.v4.dat')
const DATABASE_NAME = 'minteq.v4.dat'
const ENGINE = 'PHREEQC 3.8.6-17100' as const
const ATOMIC_MASS = { Fe: 55.845, Zn: 65.38, Pb: 207.2 } as const

export type SolidPhaseName = 'Ferrihydrite' | 'Zn(OH)2(am)' | 'Pb(OH)2'
export type SolidPhaseStatus = 'undersaturated' | 'saturated' | 'supersaturated' | 'unavailable'
export type SolidFormationStatus = 'not_configured' | 'configured_zero' | 'configured_positive' | 'configured_unknown'
export type SolidPhaseDiagnostic = {
  readonly phase: SolidPhaseName
  readonly configured: boolean
  readonly si: number | null
  readonly saturation: SolidPhaseStatus
  readonly precipitatedMoles: number | null
  readonly precipitateMassMg: number | null
  readonly formation: SolidFormationStatus
  readonly molecularMassGPerMol: number
}

export type SampleChemistryInput = {
  readonly targetVolumeMl: number
  readonly feAddedMl: number
  readonly znAddedMl: number
  readonly pbAddedMl: number
  readonly sourceMgL?: number
  readonly initialPh?: number
  readonly solidPhases?: readonly SolidPhaseName[]
}

export type SampleChemistryResult = {
  readonly pH: number
  readonly totalVolumeMl: number
  readonly inputMassMg: { fe: number; zn: number; pb: number }
  readonly dissolvedMgL: { fe: number; zn: number; pb: number }
  readonly dissolvedMassMg: { fe: number; zn: number; pb: number }
  readonly precipitateMg: { fe: number; zn: number; pb: number }
  readonly totalPrecipitateMg: number
  readonly diagnostics: readonly SolidPhaseDiagnostic[]
  readonly database: string
  readonly configuredPhases: readonly SolidPhaseName[]
  readonly convergence: { readonly converged: boolean; readonly iterations: number | null }
  readonly massBalance: { readonly elements: Record<'fe' | 'zn' | 'pb', { readonly inputMg: number; readonly dissolvedMg: number; readonly solidElementMg: number; readonly residualMg: number }> }
  readonly engine: typeof ENGINE
}

const PHASES: readonly { name: SolidPhaseName; molarMassGPerMol: number }[] = [
  { name: 'Ferrihydrite', molarMassGPerMol: 106.867 },
  { name: 'Zn(OH)2(am)', molarMassGPerMol: 99.394 },
  { name: 'Pb(OH)2', molarMassGPerMol: 241.214 },
]

function runProcess(args: string[], cwd: string) {
  return new Promise<{ code: number; stderr: string }>((resolve, reject) => {
    const child = spawn(PHREEQC_BIN, args, { cwd, windowsHide: true })
    let stderr = ''
    child.stderr.on('data', (chunk) => { stderr += String(chunk) })
    child.once('error', reject)
    child.once('close', (code) => resolve({ code: code ?? -1, stderr }))
  })
}

function parseSelectedOutput(text: string) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0 && !line.startsWith('#'))
  if (lines.length < 2) throw new Error('PHREEQC không trả về SELECTED_OUTPUT.')
  const headers = lines[0]!.trim().split(/\s+/)
  const values = lines[1]!.trim().split(/\s+/).map(Number)
  const row = new Map(headers.map((header, index) => [header, values[index]]))
  const required = ['pH', 'Fe', 'Zn', 'Pb']
  if (required.some((key) => !Number.isFinite(row.get(key)))) throw new Error('SELECTED_OUTPUT của PHREEQC thiếu pH hoặc tổng Fe/Zn/Pb.')
  return row as Map<string, number>
}

function parseReport(text: string) {
  const iterations = text.match(/Iterations\s*=\s*([0-9]+)/i)?.[1]
  const convergence = !/did not converge|convergence failure|calculations terminating|input errors/i.test(text)
  const phaseRows = new Map<SolidPhaseName, { si: number; finalMoles: number }>()
  const phasePattern = /^\s*(Ferrihydrite|Pb\(OH\)2|Zn\(OH\)2\(am\))\s+([-+0-9.eE]+)\s+([-+0-9.eE]+)\s+([-+0-9.eE]+)\s+([-+0-9.eE]+)\s+([-+0-9.eE]+)\s+([-+0-9.eE]+)\s*$/gm
  for (const match of text.matchAll(phasePattern)) {
    const phase = match[1] as SolidPhaseName
    const numbers = match.slice(2).map(Number)
    if (numbers.every(Number.isFinite)) phaseRows.set(phase, { si: numbers[0]!, finalMoles: numbers[4]! })
  }
  return { phaseRows, converged: convergence, iterations: iterations ? Number(iterations) : null }
}

function phaseStatus(si: number | null): SolidPhaseStatus {
  if (si === null || !Number.isFinite(si)) return 'unavailable'
  if (Math.abs(si) <= 1e-6) return 'saturated'
  return si < 0 ? 'undersaturated' : 'supersaturated'
}

function solutionInput(input: SampleChemistryInput, outputPath: string) {
  const sourceMgL = input.sourceMgL ?? 100
  const totalVolumeMl = input.targetVolumeMl + input.feAddedMl + input.znAddedMl + input.pbAddedMl
  const totalVolumeL = totalVolumeMl / 1000
  const molar = {
    Fe: (sourceMgL * input.feAddedMl / 1000) / ATOMIC_MASS.Fe / totalVolumeL,
    Zn: (sourceMgL * input.znAddedMl / 1000) / ATOMIC_MASS.Zn / totalVolumeL,
    Pb: (sourceMgL * input.pbAddedMl / 1000) / ATOMIC_MASS.Pb / totalVolumeL,
  }
  const configuredPhases = input.solidPhases ?? PHASES.map(({ name }) => name)
  const equilibriumPhases = configuredPhases.length === 0
    ? ''
    : `USE solution 1\nEQUILIBRIUM_PHASES 1\n${configuredPhases.map((phase) => `    ${phase} 0 0`).join('\n')}\nEND\n`
  return `TITLE VECLab sample preparation\n\nSELECTED_OUTPUT 1\n    -high_precision true\n    -file ${outputPath}\n    -reset true\n    -pH true\n    -totals Fe Zn Pb\n    -si Ferrihydrite Zn(OH)2(am) Pb(OH)2\nEND\n\nSOLUTION 1\n    -temp 25\n    pH ${input.initialPh ?? 7} charge\n    Fe(3) ${molar.Fe}\n    Zn ${molar.Zn}\n    Pb ${molar.Pb}\n    Cl ${3 * molar.Fe}\n    S(6) ${molar.Zn}\n    N ${2 * molar.Pb}\nEND\n\n${equilibriumPhases}`
}

export async function runSampleChemistry(input: SampleChemistryInput): Promise<SampleChemistryResult> {
  const values = [input.targetVolumeMl, input.feAddedMl, input.znAddedMl, input.pbAddedMl]
  if (values.some((value) => !Number.isFinite(value) || value < 0) || input.targetVolumeMl <= 0) throw new Error('Thông số thể tích mẫu không hợp lệ.')
  const tempDir = await mkdtemp(join(tmpdir(), 'veclab-phreeqc-'))
  const inputPath = join(tempDir, 'sample.pqi')
  const outputPath = join(tempDir, 'selected.out')
  const reportPath = join(tempDir, 'report.out')
  try {
    await writeFile(inputPath, solutionInput(input, outputPath), 'utf8')
    const process = await runProcess([inputPath, reportPath, PHREEQC_DATABASE], tempDir)
    if (process.code !== 0) throw new Error(`PHREEQC không chạy thành công: ${process.stderr.trim()}`)
    const [selected, report] = await Promise.all([readFile(outputPath, 'utf8'), readFile(reportPath, 'utf8')])
    const values = parseSelectedOutput(selected)
    const reportData = parseReport(report)
    const totalVolumeMl = input.targetVolumeMl + input.feAddedMl + input.znAddedMl + input.pbAddedMl
    const volumeL = totalVolumeMl / 1000
    const inputMassMg = { fe: (input.sourceMgL ?? 100) * input.feAddedMl / 1000, zn: (input.sourceMgL ?? 100) * input.znAddedMl / 1000, pb: (input.sourceMgL ?? 100) * input.pbAddedMl / 1000 }
    const configuredPhases = input.solidPhases ?? PHASES.map(({ name }) => name)
    const diagnostics = PHASES.map(({ name, molarMassGPerMol }) => {
      const row = reportData.phaseRows.get(name)
      const si = values.get(`si_${name}`) ?? row?.si ?? null
      const configured = configuredPhases.includes(name)
      const precipitatedMoles = configured ? (row?.finalMoles ?? null) : null
      const positive = precipitatedMoles !== null && precipitatedMoles > 1e-12
      return { phase: name, configured, si, saturation: phaseStatus(si), precipitatedMoles, precipitateMassMg: precipitatedMoles === null ? null : precipitatedMoles * molarMassGPerMol * 1000, formation: !configured ? 'not_configured' : positive ? 'configured_positive' : precipitatedMoles === null ? 'configured_unknown' : 'configured_zero', molecularMassGPerMol: molarMassGPerMol } satisfies SolidPhaseDiagnostic
    })
    const phaseElementMg = {
      fe: (diagnostics.find(({ phase }) => phase === 'Ferrihydrite')?.precipitatedMoles ?? 0) * ATOMIC_MASS.Fe * 1000,
      zn: (diagnostics.find(({ phase }) => phase === 'Zn(OH)2(am)')?.precipitatedMoles ?? 0) * ATOMIC_MASS.Zn * 1000,
      pb: (diagnostics.find(({ phase }) => phase === 'Pb(OH)2')?.precipitatedMoles ?? 0) * ATOMIC_MASS.Pb * 1000,
    }
    // PHREEQC totals include all aqueous species. Subtract configured solid-phase
    // element mass before converting the remaining aqueous total to mg/L.
    const precipitateMg = {
      fe: Math.min(inputMassMg.fe, Math.max(0, phaseElementMg.fe)),
      zn: Math.min(inputMassMg.zn, Math.max(0, phaseElementMg.zn)),
      pb: Math.min(inputMassMg.pb, Math.max(0, phaseElementMg.pb)),
    }
    const dissolvedMassMg = {
      fe: Math.max(0, inputMassMg.fe - precipitateMg.fe),
      zn: Math.max(0, inputMassMg.zn - precipitateMg.zn),
      pb: Math.max(0, inputMassMg.pb - precipitateMg.pb),
    }
    const dissolvedMgL = { fe: dissolvedMassMg.fe / volumeL, zn: dissolvedMassMg.zn / volumeL, pb: dissolvedMassMg.pb / volumeL }
    const massBalance = { elements: { fe: { inputMg: inputMassMg.fe, dissolvedMg: dissolvedMassMg.fe, solidElementMg: precipitateMg.fe, residualMg: inputMassMg.fe - dissolvedMassMg.fe - precipitateMg.fe }, zn: { inputMg: inputMassMg.zn, dissolvedMg: dissolvedMassMg.zn, solidElementMg: precipitateMg.zn, residualMg: inputMassMg.zn - dissolvedMassMg.zn - precipitateMg.zn }, pb: { inputMg: inputMassMg.pb, dissolvedMg: dissolvedMassMg.pb, solidElementMg: precipitateMg.pb, residualMg: inputMassMg.pb - dissolvedMassMg.pb - precipitateMg.pb } } }
    return { pH: values.get('pH')!, totalVolumeMl, inputMassMg, dissolvedMgL, dissolvedMassMg, precipitateMg, totalPrecipitateMg: precipitateMg.fe + precipitateMg.zn + precipitateMg.pb, diagnostics, database: DATABASE_NAME, configuredPhases, convergence: { converged: reportData.converged, iterations: reportData.iterations }, massBalance, engine: ENGINE }
  } finally { await rm(tempDir, { recursive: true, force: true }) }
}
