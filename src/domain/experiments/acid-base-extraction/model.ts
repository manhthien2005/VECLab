/** Idealised A/B/N teaching profile. Constants are conventions, not measured chemical data. */
export const LEGACY_EXTRACTION_PROFILE = Object.freeze({
  id: 'extraction-teaching-abn', version: '1', releaseId: 'acid-base-extraction@0.1.0', modelSpecVersion: 'teaching-equilibrium-1',
  temperatureC: 25, initialMoles: .001, molarMass: 100, initialOrganicMl: 40, capacityMl: 250,
  acidMolarity: .1, baseMolarity: .1, cakeHoldUpMl: .5, targetRecovery: 80, targetPurity: 90,
})
export const EXTRACTION_PROFILE = Object.freeze({...LEGACY_EXTRACTION_PROFILE,version:'2',releaseId:'acid-base-extraction@0.2.0'})
export type ExtractionProfile = typeof EXTRACTION_PROFILE | typeof LEGACY_EXTRACTION_PROFILE
export function resolveExtractionProfile(releaseId:string):ExtractionProfile|null {
  return releaseId===EXTRACTION_PROFILE.releaseId?EXTRACTION_PROFILE:releaseId===LEGACY_EXTRACTION_PROFILE.releaseId?LEGACY_EXTRACTION_PROFILE:null
}
export function profileForExtraction(state:ExtractionState):ExtractionProfile {
  if(state.profileVersion===EXTRACTION_PROFILE.version)return EXTRACTION_PROFILE
  if(state.profileVersion===LEGACY_EXTRACTION_PROFILE.version)return LEGACY_EXTRACTION_PROFILE
  throw new Error('Unsupported extraction profile')
}
export const COMPONENTS = ['A', 'B', 'N'] as const
export type Component = typeof COMPONENTS[number]
export const VESSEL_IDS = ['S', 'F', 'R1', 'R2', 'R3', 'W'] as const
export type VesselId = typeof VESSEL_IDS[number]
export type Amounts = Record<Component, number>
const PROPERTIES = Object.freeze({ A: { partition: 50, pKa: 4.2, solubility: .001 }, B: { partition: 30, pKa: 5, solubility: .001 }, N: { partition: 100, pKa: null, solubility: .0005 } })
export const zeroAmounts = (): Amounts => ({ A: 0, B: 0, N: 0 })
export type Vessel = { id: VesselId; waterMl: number; organicMl: number; acidEq: number; moles: Amounts; separated: boolean; vented: boolean; dry: boolean; needsMix?:boolean }
export type Reading = { sequence: number; vesselId: VesselId; kind: 'ph' | 'mass'; value: number | null; valid: boolean }
export type ExtractionState = {
  profileId: string; profileVersion: string; phase: 'working' | 'completed';
  vessels: Record<VesselId, Vessel>; readings: Reading[];
  submissions: Partial<Record<Component, { vesselId: VesselId; answer: number }>>;
  history: { sequence: number; actionType: string; from: string; to: string; moved: Amounts }[];
  protocolIssues?: {sequence:number;vesselId:VesselId}[];
}
export function createInitialExtractionState(profile:ExtractionProfile=EXTRACTION_PROFILE): ExtractionState {
  const vessels = Object.fromEntries(VESSEL_IDS.map(id => [id, { id, waterMl: 0, organicMl: id === 'S' ? 40 : 0, acidEq: 0, moles: id === 'S' ? { A: .001, B: .001, N: .001 } : zeroAmounts(), separated: true, vented: true, dry: false }])) as Record<VesselId, Vessel>
  const state:ExtractionState={ profileId: profile.id, profileVersion: profile.version, phase: 'working', vessels, readings: [], submissions: {}, history: [] }
  if(profile.version==='2'){state.protocolIssues=[];for(const vessel of Object.values(vessels))vessel.needsMix=false}
  return state
}
export const partitionFraction = (distribution: number, organicMl: number, waterMl: number) => organicMl * distribution / (waterMl + organicMl * distribution)
export type Equilibrium = { ph: number | null; aqueous: Amounts; organic: Amounts; solid: Amounts }
export function equilibrate(v: Vessel): Equilibrium {
  const aqueous = zeroAmounts(), organic = zeroAmounts(), solid = zeroAmounts()
  const va = v.waterMl / 1000, vo = v.organicMl / 1000
  function at(h: number, save = false) {
    let charge = (h - 1e-14 / h) * va - v.acidEq
    for (const id of COMPONENTS) {
      const p = PROPERTIES[id]
      const ionRatio = id === 'A' ? 10 ** -p.pKa! / h : id === 'B' ? h / 10 ** -p.pKa! : 0
      const capacity = va * (1 + ionRatio) + vo * p.partition
      const neutral = capacity > 0 ? Math.min(v.moles[id] / capacity, p.solubility) : 0
      const aq = Math.min(v.moles[id], neutral * va * (1 + ionRatio))
      const org = Math.min(v.moles[id] - aq, neutral * vo * p.partition)
      charge += (id === 'B' ? 1 : id === 'A' ? -1 : 0) * neutral * va * ionRatio
      if (save) { aqueous[id] = aq; organic[id] = org; solid[id] = Math.max(0, v.moles[id] - aq - org) }
    }
    return charge
  }
  let ph: number | null = null
  if (va > 0) {
    let lower = -14, upper = 1
    for (let i = 0; i < 90; i++) { const middle = (lower + upper) / 2; if (at(10 ** middle) > 0) upper = middle; else lower = middle }
    const logH = (lower + upper) / 2
    ph = -logH; at(10 ** logH, true)
  } else {
    for (const id of COMPONENTS) { organic[id] = Math.min(v.moles[id], vo * PROPERTIES[id].partition * PROPERTIES[id].solubility); solid[id] = Math.max(0, v.moles[id] - organic[id]) }
  }
  return { ph, aqueous, organic, solid }
}
/** Balance reading is a model mass of tracked A/B/N plus retained liquids; salts are outside this teaching profile. */
export function teachingMassMg(v: Vessel): number { return COMPONENTS.reduce((sum, id) => sum + v.moles[id] * 100_000, 0) + v.waterMl * 1000 + v.organicMl * 710 }
export function inventories(state: ExtractionState): Amounts { return Object.fromEntries(COMPONENTS.map(id => [id, VESSEL_IDS.reduce((sum, vessel) => sum + state.vessels[vessel].moles[id], 0)])) as Amounts }
