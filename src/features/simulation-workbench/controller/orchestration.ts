import type { UUID } from '@/domain/process/contracts.js'
import type { AcidSetupParams } from '@/domain/experiments/acid-neutralization/setup.js'
import type {
  AcidSession,
  AcidSessionState,
  SessionActionResult,
  WriteRefusal,
} from '@/application/simulation/acid-session.js'
import type {
  ControllerError,
  InteractionAcknowledgement,
  OperationStage,
  OrchestrationResult,
} from './types.js'

/**
 * Build a lightweight interaction acknowledgement token from a committed session state.
 */
export function createAcknowledgement(
  actionType: string,
  state: AcidSessionState,
): InteractionAcknowledgement {
  return {
    actionType,
    sequence: state.lastSequence,
    revision: state.revision,
    occurredAt: new Date(),
  }
}

/**
 * Reconstruct authoritative setup parameters from a committed session state.
 */
export function getAttemptSetupParams(state: AcidSessionState): AcidSetupParams {
  if (
    state.projection.initialAcidVolumeMl !== undefined &&
    state.projection.initialAcidConcentrationMolL !== undefined
  ) {
    return {
      acidVolumeL: state.projection.initialAcidVolumeMl / 1000,
      acidConcentrationMolL: state.projection.initialAcidConcentrationMolL,
    }
  }

  const initialVol = Math.max(
    0.025,
    state.domain.totalVolumeL -
      state.domain.baseVolumeL -
      state.domain.correctionAcidVolumeL,
  )
  const initialConc =
    initialVol > 0 && state.domain.chlorideMoles > 0
      ? (state.domain.chlorideMoles - state.domain.correctionAcidVolumeL * 0.01) / initialVol
      : 0.01

  return {
    acidVolumeL: Math.round(initialVol * 1e9) / 1e9,
    acidConcentrationMolL: Math.round(initialConc * 1e9) / 1e9,
  }
}

/**
 * Map domain and store refusals into structured controller errors.
 * Automatically recovers from revision conflicts by reloading authoritative state.
 */
export async function handleSessionRefusal(
  result: Exclude<SessionActionResult, { ok: true }>,
  session: AcidSession,
  attemptId: UUID,
  stage: OperationStage,
): Promise<ControllerError & { reloadedState?: AcidSessionState | undefined }> {
  // Domain refusal: engine evaluated the action and declined it
  if (!('outcome' in result)) {
    return {
      code: result.error.code,
      message: result.error.messageKey,
      category: result.error.category,
      stage,
      recoverable: true,
      data: result.error.data as Record<string, unknown>,
    }
  }

  // Store refusal: persistence layer declined the write
  const refusal = result as WriteRefusal
  switch (refusal.outcome) {
    case 'revision_conflict': {
      // Concurrency conflict: reload authoritative attempt state from the store
      const loaded = await session.load(attemptId)
      return {
        code: 'REVISION_CONFLICT',
        message: 'errors.revisionConflict',
        stage,
        recoverable: true,
        reloadedState: loaded !== null && loaded.ok ? loaded.state : undefined,
      }
    }
    case 'idempotency_conflict': {
      return {
        code: 'IDEMPOTENCY_CONFLICT',
        message: 'errors.idempotencyConflict',
        stage,
        recoverable: false,
        data: { existingSequence: refusal.existingSequence },
      }
    }
    case 'not_in_progress': {
      return {
        code: 'NOT_IN_PROGRESS',
        message: 'errors.notInProgress',
        stage,
        recoverable: false,
        data: { status: refusal.status },
      }
    }
    case 'event_ceiling': {
      return {
        code: 'EVENT_CEILING',
        message: 'errors.eventCeiling',
        stage,
        recoverable: false,
        data: { maxEvents: refusal.maxEvents },
      }
    }
    case 'undo_invalid': {
      return {
        code: 'UNDO_INVALID',
        message: 'errors.undoInvalid',
        stage,
        recoverable: true,
        data: { undoOfSequence: refusal.undoOfSequence },
      }
    }
    case 'not_found': {
      return {
        code: 'NOT_FOUND',
        message: 'errors.attemptNotFound',
        stage,
        recoverable: false,
      }
    }
    case 'error': {
      return {
        code: refusal.error.code,
        message: refusal.error.messageKey,
        stage,
        recoverable: false,
      }
    }
  }
}

/**
 * Execute a single guided domain action and return an orchestration result.
 */
export async function executeGuidedAction(
  session: AcidSession,
  attemptId: UUID,
  actionType: string,
  parameters: Record<string, number | string | boolean> = {},
  stage: OperationStage = 'idle',
): Promise<OrchestrationResult> {
  const result = await session.apply(attemptId, actionType, parameters)
  if (result.ok) {
    return {
      ok: true,
      state: result.state,
      stage,
      acknowledgement: createAcknowledgement(actionType, result.state),
    }
  }

  const error = await handleSessionRefusal(result, session, attemptId, stage)
  return {
    ok: false,
    error,
    stage,
    state: error.reloadedState,
  }
}

/**
 * Orchestrate EXPLORE start:
 * 1. session.start(setup) -> creates attempt (stage 'starting')
 * 2. session.apply('select_route', { route: 'naoh' }) -> selects fixed route (stage 'selecting_route')
 * 3. session.apply('calibrate_meter') -> calibrates meter (stage 'calibrating')
 *
 * If step 2 or 3 fails, orchestration stops, committed prior actions are preserved,
 * and the exact failure stage is exposed without pretending atomic rollback occurred.
 */
export async function orchestrateExploreStart(
  session: AcidSession,
  setup?: AcidSetupParams,
): Promise<OrchestrationResult> {
  let currentState: AcidSessionState

  // Step 1: Start attempt
  try {
    currentState = await session.start(setup)
  } catch (err) {
    return {
      ok: false,
      error: {
        code: 'START_FAILED',
        message: err instanceof Error ? err.message : 'Failed to start attempt',
        stage: 'starting',
        recoverable: true,
      },
      stage: 'starting',
    }
  }

  const attemptId = currentState.attemptId

  // Step 2: Select NaOH route
  const routeResult = await session.apply(attemptId, 'select_route', { route: 'naoh' })
  if (!routeResult.ok) {
    const error = await handleSessionRefusal(routeResult, session, attemptId, 'selecting_route')
    return {
      ok: false,
      error,
      stage: 'selecting_route',
      state: error.reloadedState ?? currentState,
    }
  }
  currentState = routeResult.state

  // Step 3: Calibrate meter
  const calResult = await session.apply(attemptId, 'calibrate_meter')
  if (!calResult.ok) {
    const error = await handleSessionRefusal(calResult, session, attemptId, 'calibrating')
    return {
      ok: false,
      error,
      stage: 'calibrating',
      state: error.reloadedState ?? currentState,
    }
  }
  currentState = calResult.state

  return {
    ok: true,
    state: currentState,
    stage: 'calibrating',
    acknowledgement: createAcknowledgement('calibrate_meter', currentState),
  }
}

/**
 * Orchestrate EXPLORE Dispense & Measure:
 * Strictly sequential:
 * 1. add_base (stage 'dispensing')
 * 2. mix (stage 'mixing')
 * 3. wait_for_stable_reading (stage 'stabilizing')
 * 4. measure_ph (stage 'measuring')
 *
 * Awaits each command sequentially. If any step fails, already committed steps
 * remain committed and orchestration halts immediately.
 */
export async function orchestrateDispenseAndMeasure(
  session: AcidSession,
  attemptId: UUID,
  aliquotL: number,
): Promise<OrchestrationResult> {
  // Step 1: add_base
  const addResult = await session.apply(attemptId, 'add_base', { volumeL: aliquotL })
  if (!addResult.ok) {
    const error = await handleSessionRefusal(addResult, session, attemptId, 'dispensing')
    return {
      ok: false,
      error,
      stage: 'dispensing',
      state: error.reloadedState,
    }
  }

  let currentState = addResult.state

  // Step 2: mix
  const mixResult = await session.apply(attemptId, 'mix')
  if (!mixResult.ok) {
    const error = await handleSessionRefusal(mixResult, session, attemptId, 'mixing')
    return {
      ok: false,
      error,
      stage: 'mixing',
      state: error.reloadedState ?? currentState,
    }
  }
  currentState = mixResult.state

  // Step 3: wait_for_stable_reading
  const waitResult = await session.apply(attemptId, 'wait_for_stable_reading')
  if (!waitResult.ok) {
    const error = await handleSessionRefusal(waitResult, session, attemptId, 'stabilizing')
    return {
      ok: false,
      error,
      stage: 'stabilizing',
      state: error.reloadedState ?? currentState,
    }
  }
  currentState = waitResult.state

  // Step 4: measure_ph
  const measureResult = await session.apply(attemptId, 'measure_ph')
  if (!measureResult.ok) {
    const error = await handleSessionRefusal(measureResult, session, attemptId, 'measuring')
    return {
      ok: false,
      error,
      stage: 'measuring',
      state: error.reloadedState ?? currentState,
    }
  }
  currentState = measureResult.state

  return {
    ok: true,
    state: currentState,
    stage: 'measuring',
    acknowledgement: createAcknowledgement('measure_ph', currentState),
  }
}

/**
 * Orchestrate undo of the last reversible action.
 */
export async function orchestrateUndo(
  session: AcidSession,
  attemptId: UUID,
): Promise<OrchestrationResult> {
  const result = await session.undo(attemptId)
  if (result.ok) {
    return {
      ok: true,
      state: result.state,
      stage: 'undoing',
      acknowledgement: createAcknowledgement('undo_last', result.state),
    }
  }

  const error = await handleSessionRefusal(result, session, attemptId, 'undoing')
  return {
    ok: false,
    error,
    stage: 'undoing',
    state: error.reloadedState,
  }
}

/**
 * Orchestrate attempt completion.
 */
export async function orchestrateComplete(
  session: AcidSession,
  attemptId: UUID,
): Promise<OrchestrationResult> {
  const result = await session.complete(attemptId)
  if (result.ok) {
    return {
      ok: true,
      state: result.state,
      stage: 'completing',
      acknowledgement: createAcknowledgement('complete', result.state),
    }
  }

  // Complete outcome refusal handling
  if (!('outcome' in result)) {
    return {
      ok: false,
      error: {
        code: result.error.code,
        message: result.error.messageKey,
        category: result.error.category,
        stage: 'completing',
        recoverable: true,
        data: result.error.data as Record<string, unknown>,
      },
      stage: 'completing',
    }
  }

  const error = await handleSessionRefusal(result as WriteRefusal, session, attemptId, 'completing')
  return {
    ok: false,
    error,
    stage: 'completing',
    state: error.reloadedState,
  }
}
