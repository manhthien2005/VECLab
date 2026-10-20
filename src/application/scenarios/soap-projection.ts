import type { ResourceLedger } from '@/domain/process/contracts.js'
import type { StoredAttemptEventRecord } from '@/application/attempts/repository.js'
import {
  SOAP_PROFILE, actualSuperfat, classifySoap, cupCapacityMl, hasLyeIn, hasOilIn, lyeConcentration,
  vesselVolumeMl,
  type SoapFailure, type SoapGrade, type SoapMoldStage, type SoapOil, type SoapPhase,
  type SoapSample, type SoapState, type SoapStirMode, type SoapVessel, type SoapVesselId,
} from '@/domain/experiments/soap/model.js'

export const SOAP_PROJECTION_VERSION = 2
export const SOAP_REPORT_SCHEMA_VERSION = 2

export type SoapVesselView = {
  id: SoapVesselId
  volumeMl: number
  lyeMl: number
  oilMl: number
  capacityMl: number
  fill: number
  temperatureC: number
  waterG: number
  naohG: number
  oilG: number
  hasWater: boolean
  hasLye: boolean
  hasOil: boolean
  hasSolidNaoh: boolean
  lyeConcentration: number | null
  broken: boolean
}

export type SoapMixView = {
  hasBoth: boolean
  needsStir: boolean
  stirred: boolean
  traced: boolean
  seized: boolean
  stirMode: SoapStirMode | null
  superfat: number | null
  lyeConcentration: number | null
  deltaTC: number | null
  mixtureTempC: number
}

export type SoapProjection = {
  scenarioKey: 'cold-process-soap'
  scenarioReleaseId: string
  projectionVersion: number
  phase: SoapPhase
  failure: SoapFailure | null
  elapsedMinutes: number
  oilType: SoapOil
  oilInCup: boolean
  lyeHot: boolean
  vessels: SoapVesselView[]
  mix: SoapMixView
  moldStage: SoapMoldStage
  samples: SoapSample[]
  canStartSample: boolean
  canComplete: boolean
  notices: string[]
  grade: SoapGrade
}

function viewVessel(state: SoapState, vessel: SoapVessel): SoapVesselView {
  const capacityMl = cupCapacityMl(vessel.id)
  const volumeMl = vesselVolumeMl(vessel, state.oilType)
  const oilMl = vessel.oilG / SOAP_PROFILE.oils[state.oilType].densityGPerMl
  return {
    id: vessel.id,
    volumeMl,
    lyeMl: volumeMl - oilMl,
    oilMl,
    capacityMl,
    fill: Math.min(1, volumeMl / capacityMl),
    temperatureC: vessel.temperatureC,
    waterG: vessel.waterG,
    naohG: vessel.naohSolidG + vessel.naohDissolvedG,
    oilG: vessel.oilG,
    hasWater: vessel.waterG > 1e-9,
    hasLye: hasLyeIn(vessel),
    hasOil: hasOilIn(vessel),
    hasSolidNaoh: vessel.naohSolidG > 1e-9,
    lyeConcentration: lyeConcentration(vessel),
    broken: vessel.id === 'W' && state.failure === 'WATER_INTO_NAOH',
  }
}

function viewMix(state: SoapState): SoapMixView {
  const mixing = state.vessels.M
  const hasBoth = hasLyeIn(mixing) && hasOilIn(mixing)
  const lyeMaxTempC = state.mix.lyeMaxTempC
  return {
    hasBoth,
    needsStir: hasBoth && !state.mix.stirred,
    stirred: state.mix.stirred,
    traced: state.mix.traced,
    seized: state.mix.seized,
    stirMode: state.mix.stirMode,
    superfat: hasBoth ? actualSuperfat(mixing.naohDissolvedG, mixing.oilG, state.oilType) : null,
    lyeConcentration: lyeConcentration(mixing),
    deltaTC: lyeMaxTempC === null ? null : Math.abs(lyeMaxTempC - SOAP_PROFILE.oilTemperatureC),
    mixtureTempC: mixing.temperatureC,
  }
}

export function projectSoap(state: SoapState): SoapProjection {
  const lye = state.vessels.W
  const active = state.phase === 'working'
  return {
    scenarioKey: 'cold-process-soap',
    scenarioReleaseId: SOAP_PROFILE.releaseId,
    projectionVersion: SOAP_PROJECTION_VERSION,
    phase: state.phase,
    failure: state.failure,
    elapsedMinutes: state.elapsedMinutes,
    oilType: state.oilType,
    oilInCup: hasOilIn(state.vessels.O) || hasOilIn(state.vessels.M),
    lyeHot: hasLyeIn(lye) && lye.temperatureC > SOAP_PROFILE.lyePourWarnC,
    vessels: (['W', 'O', 'M', 'D'] as const).map((id) => viewVessel(state, state.vessels[id])),
    mix: viewMix(state),
    moldStage: state.mold.stage,
    samples: state.samples,
    canStartSample: active && state.mold.stage === 'empty' && state.samples.length < SOAP_PROFILE.maxSamples,
    canComplete: state.phase === 'hazard' ? state.failure !== null : active && state.samples.length > 0,
    notices: state.warnings,
    grade: classifySoap(state),
  }
}

export type SoapReportSnapshot = {
  schemaVersion: number
  scenarioKey: 'cold-process-soap'
  releaseId: string
  generatedAt: Date
  grade: SoapGrade
  projection: SoapProjection
  diagnostics: string[]
}

export function buildSoapReport(
  state: SoapState,
  _ledger: ResourceLedger,
  _records: readonly StoredAttemptEventRecord<SoapState>[],
  generatedAt: Date,
): SoapReportSnapshot {
  const projection = projectSoap(state)
  return {
    schemaVersion: SOAP_REPORT_SCHEMA_VERSION,
    scenarioKey: 'cold-process-soap',
    releaseId: SOAP_PROFILE.releaseId,
    generatedAt,
    grade: classifySoap(state),
    projection,
    diagnostics: state.warnings,
  }
}

export function isSoapReport(value: unknown): value is SoapReportSnapshot {
  if (value === null || typeof value !== 'object') return false
  const report = value as Partial<SoapReportSnapshot>
  return report.schemaVersion === SOAP_REPORT_SCHEMA_VERSION &&
    report.scenarioKey === 'cold-process-soap' &&
    report.releaseId === SOAP_PROFILE.releaseId &&
    report.generatedAt instanceof Date &&
    report.projection?.scenarioKey === 'cold-process-soap'
}
