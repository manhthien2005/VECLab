/**
 * Cold-process soap teaching profile.
 *
 * SAP midpoints, oil densities, thermal and curing coefficients are game-locked
 * assumptions. They are not experimental validation. See content/evidence/soap.ts.
 */

export const SOAP_OILS = ['olive', 'coconut', 'palm'] as const
export type SoapOil = (typeof SOAP_OILS)[number]

export const SOAP_VESSEL_IDS = ['W', 'O', 'M', 'D'] as const
export type SoapVesselId = (typeof SOAP_VESSEL_IDS)[number]

export const SOAP_PROFILE = {
  id: 'cold-process-soap-cp-v2',
  version: '0.2.0',
  releaseId: 'cold-process-soap@0.2.0',
  modelSpecVersion: 'soap-cp-game-assumptions-0.2',
  roomTemperatureC: 25,
  oilTemperatureC: 45,
  naohMolarMassGPerMol: 40,
  dissolutionEnthalpyJPerMol: 44500,
  waterHeatCapacityJPerGPerK: 4.18,
  heatRetentionEta: 0.6,
  coolTimeConstantMin: 25,
  cureTimeConstantMin: 13460,
  residualWaterFraction: 0.2,
  waterDensityGPerMl: 1,
  naohDensityGPerMl: 2.13,
  lyePourWarnC: 50,
  seizingMixtureC: 55,
  seizingMachineMin: 10,
  machineStirMin: 12,
  handStirMin: 5,
  machineTraceMin: 3,
  handTraceMin: 30,
  gelHours: 24,
  cureWeeks: 4,
  maxSamples: 3,
  /** Two lye solutions are "similar" when their NaOH fractions differ by at most this. */
  lyeSimilarityTolerance: 0.01,
  volumeToleranceMl: 0.05,
  requirements: {
    lyeConcentration: { min: 0.24, max: 0.33 },
    lyeTemperatureMaxC: 50,
    deltaTMaxC: 15,
    superfat: { min: 0.01, max: 0.10 },
    ph: { min: 9, max: 10 },
  },
  oils: {
    olive: { densityGPerMl: 0.91 },
    coconut: { densityGPerMl: 0.92 },
    palm: { densityGPerMl: 0.91 },
  },
  sap: {
    olive: { min: 0.131, mid: 0.136, max: 0.14, sapKohMin: 184, sapKohMid: 190, sapKohMax: 196 },
    coconut: { min: 0.177, mid: 0.183, max: 0.189, sapKohMin: 248, sapKohMid: 256.5, sapKohMax: 265 },
    palm: { min: 0.136, mid: 0.142, max: 0.149, sapKohMin: 190, sapKohMid: 199.5, sapKohMax: 209 },
  },
} as const

export type SoapPhase = 'working' | 'hazard' | 'completed'
export type SoapFailure = 'WATER_INTO_NAOH'
export type SoapMoldStage = 'empty' | 'poured' | 'gelled' | 'unmolded' | 'cured'
export type SoapGrade = 'pass' | 'fail' | 'danger' | 'incomplete'
export type SoapStirMode = 'machine' | 'hand'

export type SoapVessel = {
  id: SoapVesselId
  waterG: number
  naohSolidG: number
  naohDissolvedG: number
  oilG: number
  temperatureC: number
}

export type SoapMix = {
  stirred: boolean
  traced: boolean
  seized: boolean
  stirMode: SoapStirMode | null
  machineMinutes: number
  handMinutes: number
  /** Hottest lye poured into the mixing cup; null while no lye is in it. */
  lyeMaxTempC: number | null
}

export type SoapMoldSnapshot = {
  oilType: SoapOil
  waterG: number
  naohG: number
  oilG: number
  mixtureTempC: number
  lyeMaxTempC: number | null
  stirMode: SoapStirMode | null
  pouredBeforeTrace: boolean
}

export type SoapMold = { stage: SoapMoldStage; snapshot: SoapMoldSnapshot | null }

export type SoapCriterionKey =
  | 'lye_concentration' | 'lye_cooled' | 'delta_t' | 'superfat' | 'thickened_before_mold' | 'ph'

export type SoapCriterion = { key: SoapCriterionKey; met: boolean; actual: number | boolean | null }

export type SoapSample = {
  index: number
  oilType: SoapOil
  lye: { concentration: number | null; maxTempC: number | null; naohG: number; waterG: number }
  oil: { massG: number; temperatureC: number }
  mix: {
    superfat: number | null
    deltaTC: number | null
    mixtureTempC: number
    stirMode: SoapStirMode | null
    pouredBeforeTrace: boolean
  }
  soap: { ph: number; massG: number }
  criteria: SoapCriterion[]
  passed: boolean
}

export type SoapState = {
  profileId: string
  profileVersion: string
  revision: number
  phase: SoapPhase
  failure: SoapFailure | null
  elapsedMinutes: number
  oilType: SoapOil
  vessels: Record<SoapVesselId, SoapVessel>
  mix: SoapMix
  mold: SoapMold
  samples: SoapSample[]
  warnings: string[]
}

const EPS = 1e-9

export function isSoapOil(value: unknown): value is SoapOil {
  return SOAP_OILS.some((id) => id === value)
}

export function emptyVessel(id: SoapVesselId): SoapVessel {
  return {
    id, waterG: 0, naohSolidG: 0, naohDissolvedG: 0, oilG: 0,
    temperatureC: SOAP_PROFILE.roomTemperatureC,
  }
}

export function emptyMix(): SoapMix {
  return {
    stirred: false, traced: false, seized: false, stirMode: null,
    machineMinutes: 0, handMinutes: 0, lyeMaxTempC: null,
  }
}

export function createInitialSoapState(): SoapState {
  return {
    profileId: SOAP_PROFILE.id,
    profileVersion: SOAP_PROFILE.version,
    revision: 0,
    phase: 'working',
    failure: null,
    elapsedMinutes: 0,
    oilType: 'olive',
    vessels: {
      W: emptyVessel('W'),
      O: emptyVessel('O'),
      M: emptyVessel('M'),
      D: emptyVessel('D'),
    },
    mix: emptyMix(),
    mold: { stage: 'empty', snapshot: null },
    samples: [],
    warnings: [],
  }
}

export function theoreticalNaohG(oilType: SoapOil, oilMassG: number, superfat: number): number {
  return oilMassG * SOAP_PROFILE.sap[oilType].mid * (1 - superfat)
}

/** Temperature rise after dissolving NaOH; eta is a game correction, not a lab constant. */
export function lyeTemperatureRiseC(naohG: number, waterG: number): number {
  if (waterG <= 0) return 0
  const moles = naohG / SOAP_PROFILE.naohMolarMassGPerMol
  const heatJ = moles * SOAP_PROFILE.dissolutionEnthalpyJPerMol
  return SOAP_PROFILE.heatRetentionEta * heatJ / (waterG * SOAP_PROFILE.waterHeatCapacityJPerGPerK)
}

export function lyeTemperatureC(naohG: number, waterG: number, roomC: number): number {
  return roomC + lyeTemperatureRiseC(naohG, waterG)
}

export function minutesToCoolLye(startC: number, targetC: number): number {
  if (startC <= targetC) return 0
  const room = SOAP_PROFILE.roomTemperatureC
  const ratio = (targetC - room) / (startC - room)
  if (ratio <= 0) return SOAP_PROFILE.coolTimeConstantMin * 4
  return -SOAP_PROFILE.coolTimeConstantMin * Math.log(ratio)
}

export function residualWaterG(initialWaterG: number, elapsedMin: number): number {
  const f = SOAP_PROFILE.residualWaterFraction
  return initialWaterG * (f + (1 - f) * Math.exp(-elapsedMin / SOAP_PROFILE.cureTimeConstantMin))
}

export function vesselMassG(vessel: SoapVessel): number {
  return vessel.waterG + vessel.naohSolidG + vessel.naohDissolvedG + vessel.oilG
}

export function vesselVolumeMl(vessel: SoapVessel, oilType: SoapOil): number {
  return vessel.waterG / SOAP_PROFILE.waterDensityGPerMl +
    (vessel.naohSolidG + vessel.naohDissolvedG) / SOAP_PROFILE.naohDensityGPerMl +
    vessel.oilG / SOAP_PROFILE.oils[oilType].densityGPerMl
}

export function hasLyeIn(vessel: SoapVessel): boolean {
  return vessel.waterG > EPS && vessel.naohDissolvedG > EPS
}

export function hasOilIn(vessel: SoapVessel): boolean {
  return vessel.oilG > EPS
}

export function isVesselEmpty(vessel: SoapVessel): boolean {
  return vesselMassG(vessel) <= EPS
}

/** NaOH mass fraction of the lye solution, or null when nothing is dissolved. */
export function lyeConcentration(vessel: SoapVessel): number | null {
  const total = vessel.waterG + vessel.naohDissolvedG
  if (total <= EPS || vessel.naohDissolvedG <= EPS) return null
  return vessel.naohDissolvedG / total
}

/** Actual superfat from the amounts really in the batch; negative means excess NaOH. */
export function actualSuperfat(naohG: number, oilG: number, oilType: SoapOil): number | null {
  if (oilG <= EPS) return null
  return 1 - naohG / (oilG * SOAP_PROFILE.sap[oilType].mid)
}

/** Fixed cup sizes for the teaching bench. */
export function cupCapacityMl(id: SoapVesselId): number {
  const table: Record<SoapVesselId, number> = {
    W: 750, O: 750, M: 1200, D: 1000,
  }
  return table[id]
}

export function traceMinutes(mode: SoapStirMode): number {
  return mode === 'hand' ? SOAP_PROFILE.handTraceMin : SOAP_PROFILE.machineTraceMin
}

export function wouldSeize(mixtureTempC: number, machineMinutes: number): boolean {
  return mixtureTempC >= SOAP_PROFILE.seizingMixtureC &&
    machineMinutes > SOAP_PROFILE.seizingMachineMin
}

export function modelPh(superfat: number): number {
  if (superfat <= 0) return 11.2
  return Math.max(8, 9.4 + (0.05 - superfat) * 8)
}

export function cureMassG(snapshot: SoapMoldSnapshot): number {
  const water = residualWaterG(snapshot.waterG, SOAP_PROFILE.cureWeeks * 7 * 24 * 60)
  return snapshot.naohG + snapshot.oilG + water
}

function within(value: number | null, range: { min: number; max: number }): boolean {
  return value !== null && value >= range.min && value <= range.max
}

export function evaluateSample(input: {
  concentration: number | null
  lyeMaxTempC: number | null
  superfat: number | null
  deltaTC: number | null
  pouredBeforeTrace: boolean
  ph: number
}): SoapCriterion[] {
  const req = SOAP_PROFILE.requirements
  return [
    { key: 'lye_concentration', met: within(input.concentration, req.lyeConcentration), actual: input.concentration },
    {
      key: 'lye_cooled',
      met: input.lyeMaxTempC !== null && input.lyeMaxTempC <= req.lyeTemperatureMaxC + EPS,
      actual: input.lyeMaxTempC,
    },
    { key: 'delta_t', met: input.deltaTC !== null && input.deltaTC <= req.deltaTMaxC + EPS, actual: input.deltaTC },
    { key: 'superfat', met: within(input.superfat, req.superfat), actual: input.superfat },
    { key: 'thickened_before_mold', met: !input.pouredBeforeTrace, actual: !input.pouredBeforeTrace },
    { key: 'ph', met: within(input.ph, req.ph), actual: input.ph },
  ]
}

export function classifySoap(state: SoapState): SoapGrade {
  if (state.phase === 'hazard') return 'danger'
  if (state.samples.length === 0) return 'incomplete'
  return state.samples.some((sample) => sample.passed) ? 'pass' : 'fail'
}
