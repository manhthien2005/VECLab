import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { runSampleChemistry } from '@/app/simulate/water-treatment/sample-chemistry-action.js'

describe('runSampleChemistry solid-phase diagnostics', () => {
  it('ships the pinned binaries and unchanged scientific database', async () => {
    const root = join(process.cwd(), 'tools/research/phreeqc-pin/3.8.6-17100')
    const pin = JSON.parse(await readFile(join(root, 'PIN.json'), 'utf8'))
    for (const asset of [pin.executable, pin.linuxExecutable, pin.databaseFiles.find((file: { name: string }) => file.name === 'minteq.v4.dat')]) {
      const bytes = await readFile(join(root, asset.relativePath))
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(asset.sha256.toLowerCase())
    }
  })

  it.each([
    { sourceMgL: Number.NaN },
    { sourceMgL: -1 },
    { initialPh: 15 },
    { targetVolumeMl: 1e20 },
    { solidPhases: ['Ferrihydrite\nEND\nSOLUTION 99'] },
    { solidPhases: ['Ferrihydrite', 'Ferrihydrite'] },
  ])('rejects invalid runtime input before invoking PHREEQC: %j', async (invalid) => {
    await expect(runSampleChemistry({ targetVolumeMl: 1000, feAddedMl: 0, znAddedMl: 0, pbAddedMl: 0, ...invalid } as Parameters<typeof runSampleChemistry>[0])).rejects.toThrow(/không hợp lệ/)
  })

  it('reports configured phases and real final phase moles for a precipitating sample', async () => {
    const result = await runSampleChemistry({
      targetVolumeMl: 1000,
      feAddedMl: 50,
      znAddedMl: 50,
      pbAddedMl: 5,
      sourceMgL: 100,
      initialPh: 9,
    })

    expect(result.database).toBe('minteq.v4.dat')
    // Regression values from the original pinned Windows executable, not a
    // claim of empirical validation. The Linux runtime must preserve them.
    expect(result.pH).toBeCloseTo(3.83789101992, 8)
    expect(result.precipitateMg.fe).toBeCloseTo(3.41045415, 8)
    expect(result.dissolvedMgL.fe).toBeCloseTo(1.4385030316742085, 8)
    expect(result.configuredPhases).toEqual(['Ferrihydrite', 'Zn(OH)2(am)', 'Pb(OH)2'])
    expect(result.convergence.converged).toBe(true)
    expect(result.diagnostics).toHaveLength(3)
    expect(result.diagnostics.every((diagnostic) => diagnostic.configured)).toBe(true)
    expect(result.diagnostics.some((diagnostic) => (diagnostic.precipitatedMoles ?? 0) > 0)).toBe(true)
    expect(result.diagnostics.some((diagnostic) => (diagnostic.precipitateMassMg ?? 0) > 0)).toBe(true)
    expect(Math.abs(result.massBalance.elements.fe.residualMg)).toBeLessThan(5)
  })

  it('distinguishes SI from formation when no equilibrium phase is configured', async () => {
    const result = await runSampleChemistry({
      targetVolumeMl: 1000,
      feAddedMl: 1,
      znAddedMl: 1,
      pbAddedMl: 1,
      solidPhases: [],
    })

    expect(result.configuredPhases).toEqual([])
    expect(result.diagnostics.every((diagnostic) => diagnostic.formation === 'not_configured')).toBe(true)
    expect(result.diagnostics.every((diagnostic) => diagnostic.precipitatedMoles === null)).toBe(true)
    expect(result.diagnostics.every((diagnostic) => diagnostic.precipitateMassMg === null)).toBe(true)
    expect(result.diagnostics.some((diagnostic) => diagnostic.si !== null)).toBe(true)
  })

  it('reports configured zero separately from a rounded display value', async () => {
    const result = await runSampleChemistry({
      targetVolumeMl: 1000,
      feAddedMl: 0,
      znAddedMl: 0,
      pbAddedMl: 0,
    })

    expect(result.diagnostics.every((diagnostic) => diagnostic.configured)).toBe(true)
    expect(result.diagnostics.some((diagnostic) => diagnostic.formation === 'configured_zero' || diagnostic.formation === 'configured_unknown')).toBe(true)
    expect(result.diagnostics.every((diagnostic) => diagnostic.precipitatedMoles === null || diagnostic.precipitatedMoles === 0)).toBe(true)
  })
})
