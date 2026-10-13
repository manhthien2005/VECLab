import type {
  DomainError, DomainModule, GoalStatus, ResourceDelta, ResourceLedger,
  SimulationAction, SimulationContext, SimulationResult,
} from '@/domain/process/contracts.js'
import { invalidInput, preconditionFailed } from '@/shared/errors/domain-errors.js'
import {
  JAR_CUP_IDS, JAR_PROFILE, createInitialJarState, isJarCupId,
  measuredJarRemoval, predictJarRemoval,
  type JarCup, type JarState,
} from './model.js'

export { predictJarRemoval, JAR_PROFILE } from './model.js'
export type { JarProfile, JarState } from './model.js'

export const JAR_ACTION_TYPES = [
  'prepare_cup', 'measure_initial', 'add_coagulant', 'run_phase',
  'measure_final', 'record_result', 'select_result', 'complete',
] as const

const EMPTY_DELTA: ResourceDelta = {
  reagents: {}, waterLiters: 0, operationCount: 1,
  relativeCostIndexDelta: null, safetyPenalties: [], secondaryWaste: {},
}

function rejected(code: string, data: DomainError['data'] = {}): DomainError {
  return preconditionFailed(code, 'errors.jar.' + code, data)
}

function badInput(code: string, data: DomainError['data'] = {}): DomainError {
  return invalidInput(code, 'errors.jar.' + code, data)
}

const KEYS: Record<string, readonly string[]> = {
  prepare_cup: ['cupId', 'initialPh'],
  measure_initial: [],
  add_coagulant: ['cupId', 'incrementMgL'],
  run_phase: ['phase'],
  measure_final: ['cupId'],
  record_result: ['cupId', 'removalPercent'],
  select_result: ['cupId'],
  complete: [],
}

function cupFor(state: JarState, id: unknown): JarCup | null {
  return isJarCupId(id) ? state.cups[id] ?? null : null
}

function canDose(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) &&
    value > 0 && Number.isInteger(value / JAR_PROFILE.doseStepMgL)
}

/** Validate exactly the flat action contract. Never ignore rpm/time overrides. */
function validateJarAction(state: JarState, action: SimulationAction): DomainError | null {
  const allowed = KEYS[action.actionType]
  if (allowed === undefined) return rejected('UNKNOWN_ACTION_TYPE', { actionType: action.actionType })
  if (state.phase === 'completed') return rejected('ATTEMPT_COMPLETED')
  const p = action.parameters
  for (const key of Object.keys(p)) {
    if (!allowed.includes(key)) return badInput('UNEXPECTED_PARAMETER', { parameter: key })
  }
  for (const [key, unit] of Object.entries(action.unitSelections)) {
    if (key !== 'incrementMgL' || action.actionType !== 'add_coagulant') {
      return badInput('UNDECLARED_PARAMETER_UNIT', { parameter: key, unit })
    }
    if (unit !== 'mg/L') return badInput('UNIT_QUANTITY_MISMATCH', { parameter: key, unit })
  }

  if (action.actionType === 'prepare_cup') {
    if (state.phase !== 'setup') return rejected('CUPS_LOCKED')
    if (!isJarCupId(p.cupId)) return badInput('INVALID_CUP_ID')
    if (state.cups[p.cupId]) return rejected('CUP_ALREADY_PREPARED', { cupId: p.cupId })
    if (Object.keys(state.cups).length >= JAR_CUP_IDS.length) return rejected('MAX_CUPS_REACHED')
    if (typeof p.initialPh !== 'number' || !Number.isFinite(p.initialPh) ||
      !JAR_PROFILE.availableInitialPh.some((ph) => ph === p.initialPh)) {
      return badInput('INITIAL_PH_OUT_OF_PROFILE')
    }
  }
  if (action.actionType === 'measure_initial') {
    if (state.phase !== 'setup') return rejected('INITIAL_MEASUREMENT_LOCKED')
    if (state.initialMeasurement !== null) return rejected('INITIAL_ALREADY_MEASURED')
  }
  if (action.actionType === 'add_coagulant') {
    if (state.phase !== 'setup') return rejected('DOSE_LOCKED')
    const cup = cupFor(state, p.cupId)
    if (!cup) return badInput('CUP_NOT_PREPARED')
    if (!canDose(p.incrementMgL)) return badInput('INVALID_DOSE_INCREMENT')
    if (cup.totalDoseMgL + p.incrementMgL > JAR_PROFILE.maxDoseMgL) {
      return rejected('TOTAL_DOSE_EXCEEDED', { cupId: cup.id, maxMgL: JAR_PROFILE.maxDoseMgL })
    }
  }
  if (action.actionType === 'run_phase') {
    const next: Record<'setup' | 'rapid' | 'slow', string> = {
      setup: 'rapid', rapid: 'slow', slow: 'settling',
    }
    if (p.phase !== next[state.phase as keyof typeof next] ||
      !['setup', 'rapid', 'slow'].includes(state.phase)) {
      return rejected('PHASE_OUT_OF_ORDER')
    }
    if (state.phase === 'setup') {
      if (state.initialMeasurement?.valid !== true) return rejected('INITIAL_NOT_MEASURED')
      const cups = Object.values(state.cups)
      if (cups.length === 0 || cups.some((cup) => cup.totalDoseMgL < JAR_PROFILE.minDoseMgL)) {
        return rejected('CUPS_NOT_READY')
      }
    }
  }
  if (action.actionType === 'measure_final' ||
      action.actionType === 'record_result' ||
      action.actionType === 'select_result') {
    if (!cupFor(state, p.cupId)) return badInput('CUP_NOT_PREPARED')
  }
  if (action.actionType === 'record_result' &&
    (typeof p.removalPercent !== 'number' || !Number.isFinite(p.removalPercent))) {
    return badInput('INVALID_SUBMITTED_RESULT')
  }
  return null
}

function updatedCup(state: JarState, cup: JarCup): JarState {
  return { ...state, cups: { ...state.cups, [cup.id]: cup } }
}

function transition(
  state: JarState, action: SimulationAction, sequence: number,
): SimulationResult<JarState> {
  const p = action.parameters
  let next: JarState = state
  let resourceDelta: ResourceDelta = { ...EMPTY_DELTA, reagents: {} }
  let calculationTrace: SimulationResult<JarState>['calculationTrace'] = []

  switch (action.actionType) {
    case 'prepare_cup': {
      const id = p.cupId as JarCup['id'] // validated before transition
      next = updatedCup(state, {
        id, initialPh: p.initialPh as number, totalDoseMgL: 0,
        compositionRevision: 0, measurements: [], submittedRemovalPercent: null,
      })
      resourceDelta = { ...resourceDelta, waterLiters: JAR_PROFILE.aliquotVolumeL }
      break
    }
    case 'measure_initial': {
      next = {
        ...state,
        initialMeasurement: {
          id: 'initial-' + sequence, cupId: null, kind: 'initial', sequence,
          elapsedSeconds: state.elapsedSeconds, compositionRevision: 0,
          valueNtu: JAR_PROFILE.initialNtu, valid: true, invalidReason: null,
        },
      }
      break
    }
    case 'add_coagulant': {
      const cup = cupFor(state, p.cupId) as JarCup
      const incrementMgL = p.incrementMgL as number
      next = updatedCup(state, {
        ...cup, totalDoseMgL: cup.totalDoseMgL + incrementMgL,
        compositionRevision: cup.compositionRevision + 1,
      })
      // mg/L * L -> mg; /1000 -> grams. Never charge rejected additions.
      resourceDelta = {
        ...resourceDelta,
        reagents: {
          alum: { amount: incrementMgL * JAR_PROFILE.aliquotVolumeL / 1000, unit: 'g' },
        },
      }
      calculationTrace = [{
        equationKey: 'jar.alum.mass',
        inputs: { incrementMgL, aliquotVolumeL: JAR_PROFILE.aliquotVolumeL },
        outputs: { massG: incrementMgL * JAR_PROFILE.aliquotVolumeL / 1000 },
        sourceKeys: ['jar-profile-0.1.0-volume-convention'],
      }]
      break
    }
    case 'run_phase': {
      const phase = p.phase as 'rapid' | 'slow' | 'settling'
      const durationSeconds = JAR_PROFILE.phases[phase].durationSeconds
      next = { ...state, phase, elapsedSeconds: state.elapsedSeconds + durationSeconds }
      break
    }
    case 'measure_final': {
      const cup = cupFor(state, p.cupId) as JarCup
      const valid = state.phase === 'settling' && state.initialMeasurement?.valid === true
      const reduction = valid ? predictJarRemoval(cup.initialPh, cup.totalDoseMgL) : null
      const valueNtu = reduction === null ? null : JAR_PROFILE.initialNtu * (1 - reduction / 100)
      next = updatedCup(state, {
        ...cup,
        measurements: [...cup.measurements, {
          id: cup.id + '-final-' + sequence, cupId: cup.id,
          kind: 'final', sequence, elapsedSeconds: state.elapsedSeconds,
          compositionRevision: cup.compositionRevision,
          valueNtu, valid, invalidReason: valid ? null : 'PROTOCOL_INCOMPLETE',
        }],
      })
      if (valid && reduction !== null && valueNtu !== null) {
        calculationTrace = [{
          equationKey: 'jar.alateef-2024.equation-3',
          inputs: { initialNtu: JAR_PROFILE.initialNtu, initialPh: cup.initialPh,
            doseMgL: cup.totalDoseMgL },
          outputs: { removalPercent: reduction, finalNtu: valueNtu },
          sourceKeys: [JAR_PROFILE.sourceDoi],
        }]
      }
      break
    }
    case 'record_result': {
      const cup = cupFor(state, p.cupId) as JarCup
      next = updatedCup(state, { ...cup, submittedRemovalPercent: p.removalPercent as number })
      break
    }
    case 'select_result':
      next = { ...state, submission: { selectedCupId: p.cupId as JarCup['id'] } }
      break
    case 'complete':
      next = { ...state, phase: 'completed' }
      break
  }
  return {
    nextState: { ...next, revision: state.revision + 1 },
    observations: [], calculationTrace, warnings: [], resourceDelta,
  }
}

/**
 * A valid cup measurement is a model output. Learner arithmetic is separately
 * checked within 0.5 percentage points; neither changes that measurement.
 * Aggregate success needs a selected, measured cup AND submitted calculation.
 */
function evaluateJarGoal(state: JarState, _resources: ResourceLedger): GoalStatus {
  if (state.phase !== 'completed') {
    return { evaluable: false, goalMet: false, primaryCriteria: [],
      efficiencyCriteria: [], achievementPercent: 0 }
  }
  const cups = Object.values(state.cups)
  const primaryCriteria = cups.map((cup) => {
    const removal = measuredJarRemoval(state, cup)
    return {
      key: 'jar.cup.' + cup.id + '.removal',
      evaluable: removal !== null,
      met: removal !== null && removal >= JAR_PROFILE.goalRemovalPercent,
      actual: removal, target: JAR_PROFILE.goalRemovalPercent, unit: '%',
    }
  })
  const efficiencyCriteria = cups.map((cup) => {
    const removal = measuredJarRemoval(state, cup)
    const submitted = cup.submittedRemovalPercent
    return {
      key: 'jar.cup.' + cup.id + '.arithmetic',
      evaluable: removal !== null && submitted !== null,
      met: removal !== null && submitted !== null &&
        Math.abs(submitted - removal) <= JAR_PROFILE.answerTolerancePercentagePoints,
      actual: submitted, target: 'within 0.5 percentage points of measured removal',
      unit: 'percentage_points',
    }
  })
  const chosen = cups.find((cup) => cup.id === state.submission.selectedCupId)
  const chosenRemoval = chosen ? measuredJarRemoval(state, chosen) : null
  const evaluable = chosen !== undefined && chosenRemoval !== null &&
    chosen.submittedRemovalPercent !== null
  const arithmeticCorrect = evaluable && Math.abs(
    (chosen.submittedRemovalPercent as number) - (chosenRemoval as number),
  ) <= JAR_PROFILE.answerTolerancePercentagePoints
  return {
    evaluable,
    goalMet: evaluable && arithmeticCorrect &&
      (chosenRemoval as number) >= JAR_PROFILE.goalRemovalPercent,
    primaryCriteria, efficiencyCriteria,
    achievementPercent: evaluable
      ? Math.max(0, Math.min(100, (chosenRemoval as number) /
          JAR_PROFILE.goalRemovalPercent * 100))
      : 0,
  }
}

export function createJarModule(): DomainModule<JarState> {
  return {
    manifest: {
      scenarioKey: 'jar-test',
      releaseId: JAR_PROFILE.releaseId,
      modelSpecVersion: JAR_PROFILE.modelSpecVersion,
      scoringVersion: JAR_PROFILE.version,
      stateSchemaVersion: JAR_PROFILE.version,
      contentVersion: JAR_PROFILE.version,
      evidenceRegisterVersion: JAR_PROFILE.version,
      projectionVersion: 1,
    },
    createInitialState: createInitialJarState,
    actionTypes: JAR_ACTION_TYPES,
    parameterQuantities: { incrementMgL: 'mass_concentration' },
    validateAction(context: SimulationContext<JarState>, action: SimulationAction): DomainError | null {
      return validateJarAction(context.state, action)
    },
    run(context: SimulationContext<JarState>, action: SimulationAction):
      SimulationResult<JarState> | DomainError {
      const error = validateJarAction(context.state, action)
      return error ?? transition(context.state, action, context.sequence)
    },
    evaluateGoalStatus: evaluateJarGoal,
  }
}
