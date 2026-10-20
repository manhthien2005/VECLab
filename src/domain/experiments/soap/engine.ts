import type {
  DomainError, DomainModule, GoalStatus, ResourceDelta, ResourceLedger,
  SimulationAction, SimulationContext, SimulationResult,
} from '@/domain/process/contracts.js'
import { invalidInput, preconditionFailed } from '@/shared/errors/domain-errors.js'
import {
  SOAP_PROFILE, actualSuperfat, classifySoap, createInitialSoapState, cupCapacityMl,
  cureMassG, emptyMix, emptyVessel, evaluateSample, hasLyeIn, hasOilIn, isSoapOil,
  isVesselEmpty, lyeConcentration, lyeTemperatureRiseC, minutesToCoolLye, modelPh, traceMinutes,
  vesselMassG, vesselVolumeMl, wouldSeize,
  type SoapMoldSnapshot, type SoapSample, type SoapState, type SoapStirMode, type SoapVessel,
  type SoapVesselId,
} from './model.js'

export { SOAP_PROFILE } from './model.js'
export type { SoapState } from './model.js'

export const SOAP_ACTION_TYPES = [
  'set_oil', 'discard_oil', 'pour_water', 'pour_naoh', 'cool_lye', 'reset_lye',
  'pour_oil', 'pour_to_mix', 'return_to_source', 'discard_mix', 'stir', 'advance_trace',
  'pour_to_mold', 'advance_gel', 'unmold', 'advance_cure', 'measure_sample', 'complete',
] as const

const EPS = 1e-9

const EMPTY_DELTA: ResourceDelta = {
  reagents: {}, waterLiters: 0, operationCount: 1,
  relativeCostIndexDelta: null, safetyPenalties: [], secondaryWaste: {},
}

function rejected(code: string, data: DomainError['data'] = {}): DomainError {
  return preconditionFailed(code, 'errors.soap.' + code, data)
}

function badInput(code: string, data: DomainError['data'] = {}): DomainError {
  return invalidInput(code, 'errors.soap.' + code, data)
}

const KEYS: Record<string, readonly string[]> = {
  set_oil: ['oilType'],
  discard_oil: [],
  pour_water: ['waterVolumeL'],
  pour_naoh: ['naohMassG'],
  cool_lye: [],
  reset_lye: [],
  pour_oil: ['oilVolumeL'],
  pour_to_mix: ['from', 'volumeL'],
  return_to_source: ['to', 'volumeL'],
  discard_mix: [],
  stir: ['mode'],
  advance_trace: [],
  pour_to_mold: [],
  advance_gel: [],
  unmold: [],
  advance_cure: [],
  measure_sample: [],
  complete: [],
}

type Parts = Pick<SoapVessel, 'waterG' | 'naohSolidG' | 'naohDissolvedG' | 'oilG'>

function mlFromLiters(liters: number): number {
  return Number((liters * 1000).toFixed(6))
}

function positive(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

function volumeOf(state: SoapState, vessel: SoapVessel): number {
  return vesselVolumeMl(vessel, state.oilType)
}

function overflow(state: SoapState, id: SoapVesselId, addedMl: number): DomainError | null {
  const volume = volumeOf(state, state.vessels[id]) + addedMl
  const capacity = cupCapacityMl(id)
  if (volume > capacity + SOAP_PROFILE.volumeToleranceMl) {
    return rejected('ERR_OVERFLOW', { volumeMl: volume, capacityMl: capacity, vessel: id })
  }
  return null
}

function terminal(state: SoapState): boolean {
  return state.phase === 'completed' || state.phase === 'hazard'
}

function waterHitsSolidNaoh(state: SoapState): boolean {
  const lye = state.vessels.W
  return lye.naohSolidG > EPS && lye.waterG <= EPS
}

/** Fraction of a source vessel taken by a poured volume; 1 when the whole content goes. */
function pouredFraction(state: SoapState, source: SoapVessel, volumeMl: number): number {
  const total = volumeOf(state, source)
  if (total <= EPS) return 0
  return volumeMl >= total - SOAP_PROFILE.volumeToleranceMl ? 1 : volumeMl / total
}

function exceedsSource(state: SoapState, source: SoapVessel, volumeMl: number): DomainError | null {
  const total = volumeOf(state, source)
  if (volumeMl > total + SOAP_PROFILE.volumeToleranceMl) {
    return rejected('EXCEEDS_SOURCE', { volumeMl, availableMl: total })
  }
  return null
}

function scaled(parts: Parts, fraction: number): Parts {
  return {
    waterG: parts.waterG * fraction,
    naohSolidG: parts.naohSolidG * fraction,
    naohDissolvedG: parts.naohDissolvedG * fraction,
    oilG: parts.oilG * fraction,
  }
}

function clean(value: number): number {
  return value < EPS ? 0 : value
}

/** Moves a fraction of `from` into `to`; temperature follows the mass-weighted mean. */
function transfer(from: SoapVessel, to: SoapVessel, fraction: number): { from: SoapVessel; to: SoapVessel } {
  const moved = scaled(from, fraction)
  const movedMass = vesselMassG({ ...from, ...moved })
  const toMass = vesselMassG(to)
  const temperatureC = movedMass + toMass <= EPS ? to.temperatureC :
    (from.temperatureC * movedMass + to.temperatureC * toMass) / (movedMass + toMass)
  const rest = fraction >= 1 ? emptyVessel(from.id) : {
    ...from,
    waterG: clean(from.waterG - moved.waterG),
    naohSolidG: clean(from.naohSolidG - moved.naohSolidG),
    naohDissolvedG: clean(from.naohDissolvedG - moved.naohDissolvedG),
    oilG: clean(from.oilG - moved.oilG),
  }
  return {
    from: rest,
    to: {
      ...to,
      waterG: to.waterG + moved.waterG,
      naohSolidG: to.naohSolidG + moved.naohSolidG,
      naohDissolvedG: to.naohDissolvedG + moved.naohDissolvedG,
      oilG: to.oilG + moved.oilG,
      temperatureC,
    },
  }
}

function withVessel(state: SoapState, vessel: SoapVessel): SoapState {
  return { ...state, vessels: { ...state.vessels, [vessel.id]: vessel } }
}

function note(state: SoapState, code: string): SoapState {
  if (state.warnings.includes(code)) return state
  return { ...state, warnings: [...state.warnings, code] }
}

function lyesDiffer(a: SoapVessel, b: SoapVessel): boolean {
  const first = lyeConcentration(a)
  const second = lyeConcentration(b)
  if (first === null || second === null) return false
  return Math.abs(first - second) > SOAP_PROFILE.lyeSimilarityTolerance
}

function validatePour(state: SoapState, action: SimulationAction): DomainError | null {
  const p = action.parameters
  const vessels = state.vessels
  switch (action.actionType) {
    case 'pour_water': {
      if (!positive(p.waterVolumeL)) return badInput('INVALID_AMOUNT')
      return waterHitsSolidNaoh(state) ? null : overflow(state, 'W', mlFromLiters(p.waterVolumeL))
    }
    case 'pour_naoh': {
      if (!positive(p.naohMassG)) return badInput('INVALID_AMOUNT')
      return overflow(state, 'W', p.naohMassG / SOAP_PROFILE.naohDensityGPerMl)
    }
    case 'pour_oil': {
      if (!positive(p.oilVolumeL)) return badInput('INVALID_AMOUNT')
      return overflow(state, 'O', mlFromLiters(p.oilVolumeL))
    }
    case 'pour_to_mix': {
      if (p.from !== 'W' && p.from !== 'O') return badInput('INVALID_VESSEL')
      if (!positive(p.volumeL)) return badInput('INVALID_AMOUNT')
      const ml = mlFromLiters(p.volumeL)
      const source = vessels[p.from]
      if (p.from === 'W' && (!hasLyeIn(source) || source.naohSolidG > EPS)) return rejected('LYE_NOT_READY')
      if (p.from === 'O' && !hasOilIn(source)) return rejected('EMPTY_SOURCE')
      if (state.mix.seized) return rejected('ERR_SEIZING')
      if (state.mix.traced) return rejected('MIX_ALREADY_THICK')
      const tooMuch = exceedsSource(state, source, ml)
      if (tooMuch) return tooMuch
      if (p.from === 'W' && lyesDiffer(source, vessels.M)) return rejected('LYE_INDEX_MISMATCH')
      return overflow(state, 'M', ml)
    }
    case 'return_to_source': {
      if (p.to !== 'W' && p.to !== 'O') return badInput('INVALID_VESSEL')
      if (!positive(p.volumeL)) return badInput('INVALID_AMOUNT')
      const ml = mlFromLiters(p.volumeL)
      const mixing = vessels.M
      const lye = mixing.waterG > EPS || mixing.naohDissolvedG > EPS
      const oil = hasOilIn(mixing)
      if (lye === oil) return rejected(lye ? 'RETURN_NOT_ALLOWED' : 'EMPTY_SOURCE')
      if ((p.to === 'W') !== lye) return rejected('RETURN_WRONG_TARGET')
      const tooMuch = exceedsSource(state, mixing, ml)
      if (tooMuch) return tooMuch
      if (p.to === 'W' && lyesDiffer(mixing, vessels.W)) return rejected('LYE_INDEX_MISMATCH')
      return overflow(state, p.to, ml)
    }
    default:
      return null
  }
}

function validateSoapAction(state: SoapState, action: SimulationAction): DomainError | null {
  if (!Object.hasOwn(KEYS, action.actionType)) {
    return rejected('UNKNOWN_ACTION_TYPE', { actionType: action.actionType })
  }
  const allowed = KEYS[action.actionType] as readonly string[]
  if (terminal(state) && action.actionType !== 'complete') return rejected('ATTEMPT_COMPLETED')
  const p = action.parameters
  for (const key of Object.keys(p)) {
    if (!allowed.includes(key)) return badInput('UNEXPECTED_PARAMETER', { parameter: key })
  }
  const { vessels, mix, mold } = state

  switch (action.actionType) {
    case 'set_oil': {
      if (!isSoapOil(p.oilType)) return badInput('INVALID_OIL')
      if (p.oilType === state.oilType) return null
      return hasOilIn(vessels.O) || hasOilIn(vessels.M) ? rejected('OIL_IN_CUP') : null
    }
    case 'discard_oil':
      return hasOilIn(vessels.O) ? null : rejected('NOTHING_TO_DISCARD')
    case 'pour_water': case 'pour_naoh': case 'pour_oil': case 'pour_to_mix': case 'return_to_source':
      return validatePour(state, action)
    case 'cool_lye':
      if (!hasLyeIn(vessels.W) || vessels.W.naohSolidG > EPS) return rejected('LYE_NOT_READY')
      return vessels.W.temperatureC <= SOAP_PROFILE.lyePourWarnC ? rejected('ALREADY_COOL') : null
    case 'reset_lye':
      return isVesselEmpty(vessels.W) ? rejected('NOTHING_TO_DISCARD') : null
    case 'discard_mix':
      return isVesselEmpty(vessels.M) ? rejected('NOTHING_TO_DISCARD') : null
    case 'stir': {
      if (p.mode !== 'machine' && p.mode !== 'hand') return badInput('INVALID_STIR_MODE')
      if (mix.seized) return rejected('ERR_SEIZING')
      if (!hasLyeIn(vessels.M) || !hasOilIn(vessels.M)) return rejected('STIR_NEEDS_BOTH')
      return mix.stirred ? rejected('ALREADY_STIRRED') : null
    }
    case 'advance_trace':
      if (mix.seized) return rejected('ERR_SEIZING')
      if (!mix.stirred) return rejected('STIR_REQUIRED')
      return mix.traced ? rejected('ALREADY_TRACED') : null
    case 'pour_to_mold': {
      if (mold.stage !== 'empty') return rejected('MOLD_IN_USE')
      if (state.samples.length >= SOAP_PROFILE.maxSamples) return rejected('MAX_SAMPLES')
      if (mix.seized) return rejected('ERR_SEIZING')
      if (!hasLyeIn(vessels.M) || !hasOilIn(vessels.M)) return rejected('EMPTY_SOURCE')
      if (!mix.stirred) return rejected('STIR_REQUIRED_BEFORE_MOLD')
      return overflow(state, 'D', volumeOf(state, vessels.M))
    }
    case 'advance_gel':
      return mold.stage === 'poured' ? null : rejected('NOT_IN_MOLD')
    case 'unmold':
      return mold.stage === 'gelled' ? null : rejected('GEL_INCOMPLETE')
    case 'advance_cure':
      return mold.stage === 'unmolded' ? null : rejected('NOT_UNMOLDED')
    case 'measure_sample':
      return mold.stage === 'cured' ? null : rejected('NOT_CURED')
    case 'complete':
      return state.phase === 'hazard' || state.samples.length > 0 ? null : rejected('NO_SAMPLE')
    default:
      return null
  }
}

function buildSample(state: SoapState, snapshot: SoapMoldSnapshot): SoapSample {
  const concentration = snapshot.naohG + snapshot.waterG > EPS
    ? snapshot.naohG / (snapshot.naohG + snapshot.waterG) : null
  const superfat = actualSuperfat(snapshot.naohG, snapshot.oilG, snapshot.oilType)
  const deltaTC = snapshot.lyeMaxTempC === null
    ? null : Math.abs(snapshot.lyeMaxTempC - SOAP_PROFILE.oilTemperatureC)
  const ph = modelPh(superfat ?? 0)
  const criteria = evaluateSample({
    concentration, lyeMaxTempC: snapshot.lyeMaxTempC, superfat, deltaTC,
    pouredBeforeTrace: snapshot.pouredBeforeTrace, ph,
  })
  return {
    index: state.samples.length + 1,
    oilType: snapshot.oilType,
    lye: { concentration, maxTempC: snapshot.lyeMaxTempC, naohG: snapshot.naohG, waterG: snapshot.waterG },
    oil: { massG: snapshot.oilG, temperatureC: SOAP_PROFILE.oilTemperatureC },
    mix: {
      superfat, deltaTC, mixtureTempC: snapshot.mixtureTempC,
      stirMode: snapshot.stirMode, pouredBeforeTrace: snapshot.pouredBeforeTrace,
    },
    soap: { ph, massG: cureMassG(snapshot) },
    criteria,
    passed: criteria.every((item) => item.met),
  }
}

type Outcome = {
  next: SoapState
  warnings: SimulationResult<SoapState>['warnings']
  resourceDelta: ResourceDelta
  calculationTrace: SimulationResult<SoapState>['calculationTrace']
}

function pourIntoLye(state: SoapState, action: SimulationAction): Outcome {
  const p = action.parameters
  const lye = state.vessels.W
  const warnings: Outcome['warnings'] = []
  let calculationTrace: Outcome['calculationTrace'] = []
  let resourceDelta: ResourceDelta = { ...EMPTY_DELTA, reagents: {} }
  if (action.actionType === 'pour_water') {
    const liters = p.waterVolumeL as number
    const addedG = mlFromLiters(liters) * SOAP_PROFILE.waterDensityGPerMl
    resourceDelta = { ...resourceDelta, waterLiters: liters }
    if (waterHitsSolidNaoh(state)) {
      return {
        next: { ...withVessel(state, { ...lye, waterG: addedG }), phase: 'hazard', failure: 'WATER_INTO_NAOH' },
        warnings, resourceDelta, calculationTrace,
      }
    }
    const solution = lye.waterG + lye.naohDissolvedG
    const temperatureC = solution > EPS
      ? (lye.temperatureC * solution + SOAP_PROFILE.roomTemperatureC * addedG) / (solution + addedG)
      : SOAP_PROFILE.roomTemperatureC
    return { next: withVessel(state, { ...lye, waterG: lye.waterG + addedG, temperatureC }), warnings, resourceDelta, calculationTrace }
  }
  const naohG = p.naohMassG as number
  resourceDelta = { ...resourceDelta, reagents: { naoh: { amount: naohG, unit: 'g' } } }
  if (lye.waterG <= EPS) {
    return { next: withVessel(state, { ...lye, naohSolidG: lye.naohSolidG + naohG }), warnings, resourceDelta, calculationTrace }
  }
  const temperatureC = lye.temperatureC + lyeTemperatureRiseC(naohG, lye.waterG)
  calculationTrace = [{
    equationKey: 'soap.lye.temperature',
    inputs: { naohG, waterG: lye.waterG, eta: SOAP_PROFILE.heatRetentionEta },
    outputs: { temperatureC },
    sourceKeys: ['soap-heat-retention-eta-game'],
  }]
  if (temperatureC > SOAP_PROFILE.lyePourWarnC) {
    warnings.push({
      code: 'HOT_LYE', severity: 'warning', messageKey: 'warnings.soap.HOT_LYE', data: { temperatureC },
    })
  }
  return {
    next: withVessel(state, { ...lye, naohDissolvedG: lye.naohDissolvedG + naohG, temperatureC }),
    warnings, resourceDelta, calculationTrace,
  }
}

function pourIntoMix(state: SoapState, action: SimulationAction): Outcome {
  const p = action.parameters
  const fromId = p.from as 'W' | 'O'
  const source = state.vessels[fromId]
  const fraction = pouredFraction(state, source, mlFromLiters(p.volumeL as number))
  const moved = transfer(source, state.vessels.M, fraction)
  const warnings: Outcome['warnings'] = []
  const lyeMaxTempC = fromId === 'W'
    ? Math.max(state.mix.lyeMaxTempC ?? -Infinity, source.temperatureC) : state.mix.lyeMaxTempC
  if (fromId === 'W' && source.temperatureC > SOAP_PROFILE.lyePourWarnC) {
    warnings.push({
      code: 'HOT_LYE_POUR', severity: 'warning', messageKey: 'warnings.soap.HOT_LYE',
      data: { temperatureC: source.temperatureC },
    })
  }
  const next = {
    ...state,
    vessels: { ...state.vessels, [fromId]: moved.from, M: moved.to },
    mix: { ...state.mix, stirred: false, lyeMaxTempC },
  }
  return { next, warnings, resourceDelta: { ...EMPTY_DELTA, reagents: {} }, calculationTrace: [] }
}

function returnToSource(state: SoapState, action: SimulationAction): Outcome {
  const p = action.parameters
  const toId = p.to as 'W' | 'O'
  const mixing = state.vessels.M
  const fraction = pouredFraction(state, mixing, mlFromLiters(p.volumeL as number))
  const moved = transfer(mixing, state.vessels[toId], fraction)
  const emptied = isVesselEmpty(moved.from)
  const lyeLeft = moved.from.waterG > EPS || moved.from.naohDissolvedG > EPS
  const next = {
    ...state,
    vessels: { ...state.vessels, M: moved.from, [toId]: moved.to },
    mix: emptied ? emptyMix() : { ...state.mix, stirred: false, lyeMaxTempC: lyeLeft ? state.mix.lyeMaxTempC : null },
  }
  return { next, warnings: [], resourceDelta: { ...EMPTY_DELTA, reagents: {} }, calculationTrace: [] }
}

function stirMix(state: SoapState, mode: SoapStirMode): Outcome {
  const add = mode === 'machine' ? SOAP_PROFILE.machineStirMin : SOAP_PROFILE.handStirMin
  const machineMinutes = state.mix.machineMinutes + (mode === 'machine' ? add : 0)
  const handMinutes = state.mix.handMinutes + (mode === 'hand' ? add : 0)
  const seized = mode === 'machine' && wouldSeize(state.vessels.M.temperatureC, machineMinutes)
  let next: SoapState = {
    ...state,
    elapsedMinutes: state.elapsedMinutes + add,
    mix: { ...state.mix, stirred: true, stirMode: mode, machineMinutes, handMinutes, seized },
  }
  const lyeTemp = state.mix.lyeMaxTempC
  if (lyeTemp !== null && Math.abs(lyeTemp - SOAP_PROFILE.oilTemperatureC) > SOAP_PROFILE.requirements.deltaTMaxC) {
    next = note(next, 'PHASE_SEP_RISK')
  }
  return { next, warnings: [], resourceDelta: { ...EMPTY_DELTA, reagents: {} }, calculationTrace: [] }
}

function transition(
  state: SoapState, action: SimulationAction,
): SimulationResult<SoapState> {
  const p = action.parameters
  let outcome: Outcome = {
    next: state, warnings: [], resourceDelta: { ...EMPTY_DELTA, reagents: {} }, calculationTrace: [],
  }
  const apply = (next: SoapState): void => { outcome = { ...outcome, next } }

  switch (action.actionType) {
    case 'set_oil':
      apply({ ...state, oilType: p.oilType as SoapState['oilType'] })
      break
    case 'discard_oil':
      apply(withVessel(state, emptyVessel('O')))
      break
    case 'pour_oil': {
      const addedG = mlFromLiters(p.oilVolumeL as number) * SOAP_PROFILE.oils[state.oilType].densityGPerMl
      apply(withVessel(state, {
        ...state.vessels.O, oilG: state.vessels.O.oilG + addedG, temperatureC: SOAP_PROFILE.oilTemperatureC,
      }))
      break
    }
    case 'pour_water': case 'pour_naoh':
      outcome = pourIntoLye(state, action)
      break
    case 'cool_lye': {
      const lye = state.vessels.W
      const minutes = minutesToCoolLye(lye.temperatureC, SOAP_PROFILE.lyePourWarnC)
      apply(withVessel({ ...state, elapsedMinutes: state.elapsedMinutes + minutes }, {
        ...lye, temperatureC: Math.min(lye.temperatureC, SOAP_PROFILE.lyePourWarnC),
      }))
      break
    }
    case 'reset_lye':
      apply(withVessel(state, emptyVessel('W')))
      break
    case 'pour_to_mix':
      outcome = pourIntoMix(state, action)
      break
    case 'return_to_source':
      outcome = returnToSource(state, action)
      break
    case 'discard_mix':
      apply({ ...withVessel(state, emptyVessel('M')), mix: emptyMix() })
      break
    case 'stir':
      outcome = stirMix(state, p.mode as SoapStirMode)
      break
    case 'advance_trace': {
      const mode = state.mix.stirMode ?? 'machine'
      const done = mode === 'machine' ? state.mix.machineMinutes : state.mix.handMinutes
      const target = traceMinutes(mode)
      apply({
        ...state,
        elapsedMinutes: state.elapsedMinutes + Math.max(0, target - done),
        mix: { ...state.mix, traced: true },
      })
      break
    }
    case 'pour_to_mold': {
      const mixing = state.vessels.M
      const snapshot: SoapMoldSnapshot = {
        oilType: state.oilType,
        waterG: mixing.waterG,
        naohG: mixing.naohDissolvedG,
        oilG: mixing.oilG,
        mixtureTempC: mixing.temperatureC,
        lyeMaxTempC: state.mix.lyeMaxTempC,
        stirMode: state.mix.stirMode,
        pouredBeforeTrace: !state.mix.traced,
      }
      const moved = transfer(mixing, state.vessels.D, 1)
      const next = {
        ...state,
        vessels: { ...state.vessels, M: moved.from, D: moved.to },
        mix: emptyMix(),
        mold: { stage: 'poured' as const, snapshot },
      }
      apply(snapshot.pouredBeforeTrace ? note(next, 'POURED_BEFORE_TRACE') : next)
      break
    }
    case 'advance_gel':
      apply({
        ...state, mold: { ...state.mold, stage: 'gelled' },
        elapsedMinutes: state.elapsedMinutes + SOAP_PROFILE.gelHours * 60,
      })
      break
    case 'unmold':
      apply({ ...state, mold: { ...state.mold, stage: 'unmolded' } })
      break
    case 'advance_cure':
      apply({
        ...state, mold: { ...state.mold, stage: 'cured' },
        elapsedMinutes: state.elapsedMinutes + SOAP_PROFILE.cureWeeks * 7 * 24 * 60,
      })
      break
    case 'measure_sample': {
      const snapshot = state.mold.snapshot as SoapMoldSnapshot
      apply({
        ...withVessel(state, emptyVessel('D')),
        mold: { stage: 'empty', snapshot: null },
        samples: [...state.samples, buildSample(state, snapshot)],
      })
      break
    }
    case 'complete':
      apply({ ...state, phase: state.phase === 'hazard' ? 'hazard' : 'completed' })
      break
  }

  return {
    nextState: { ...outcome.next, revision: state.revision + 1 },
    observations: [],
    calculationTrace: outcome.calculationTrace,
    warnings: outcome.warnings,
    resourceDelta: outcome.resourceDelta,
  }
}

function evaluateSoapGoal(state: SoapState, _resources: ResourceLedger): GoalStatus {
  if (state.phase !== 'completed' && state.phase !== 'hazard') {
    return { evaluable: false, goalMet: false, primaryCriteria: [], efficiencyCriteria: [], achievementPercent: 0 }
  }
  const grade = classifySoap(state)
  const best = state.samples.find((sample) => sample.passed) ?? state.samples.at(-1)
  return {
    evaluable: true,
    goalMet: grade === 'pass',
    primaryCriteria: (best?.criteria ?? []).map((item) => ({
      key: 'soap.' + item.key,
      evaluable: true,
      met: item.met,
      actual: typeof item.actual === 'boolean' ? (item.actual ? 'ok' : 'early') : item.actual,
      target: 'see requirements',
      unit: null,
    })),
    efficiencyCriteria: [],
    achievementPercent: grade === 'pass' ? 100 : 0,
  }
}

export function createSoapModule(): DomainModule<SoapState> {
  return {
    manifest: {
      scenarioKey: 'cold-process-soap',
      releaseId: SOAP_PROFILE.releaseId,
      modelSpecVersion: SOAP_PROFILE.modelSpecVersion,
      scoringVersion: SOAP_PROFILE.version,
      stateSchemaVersion: SOAP_PROFILE.version,
      contentVersion: SOAP_PROFILE.version,
      evidenceRegisterVersion: SOAP_PROFILE.version,
      projectionVersion: 2,
    },
    createInitialState: createInitialSoapState,
    actionTypes: SOAP_ACTION_TYPES,
    parameterQuantities: {
      naohMassG: 'mass', waterVolumeL: 'volume', oilVolumeL: 'volume', volumeL: 'volume',
    },
    validateAction(context: SimulationContext<SoapState>, action: SimulationAction) {
      return validateSoapAction(context.state, action)
    },
    run(context: SimulationContext<SoapState>, action: SimulationAction) {
      const error = validateSoapAction(context.state, action)
      if (error) return error
      return transition(context.state, action)
    },
    evaluateGoalStatus: evaluateSoapGoal,
  }
}
