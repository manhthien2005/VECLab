'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { UUID } from '@/domain/process/contracts.js'
import type { AcidSetupParams } from '@/domain/experiments/acid-neutralization/setup.js'
import {
  benchmarkSetupParams,
  validateSetupParams,
} from '@/domain/experiments/acid-neutralization/setup.js'
import { PERMITTED_ALIQUOTS_L } from '@/domain/experiments/acid-neutralization/constants.js'
import {
  probeAvailableActions,
  type AcidSessionState,
  type ActionAvailability,
} from '@/application/simulation/acid-session.js'
import { parseUUID } from '@/shared/ids.js'
import type {
  ControllerError,
  InteractionAcknowledgement,
  OperationStage,
  OrchestrationResult,
  SaveStatus,
  WorkbenchController,
  WorkbenchControllerOptions,
  WorkbenchMode,
} from './types.js'
import {
  createAcknowledgement,
  executeGuidedAction,
  getAttemptSetupParams,
  orchestrateComplete,
  orchestrateDispenseAndMeasure,
  orchestrateExploreStart,
  orchestrateUndo,
} from './orchestration.js'

/** Default visual stirrer RPM. Operational telemetry only; does not affect chemistry. */
const DEFAULT_STIRRER_RPM = 300

/** Default aliquot size: 1.00 mL (0.001 L). */
const DEFAULT_ALIQUOT_L = PERMITTED_ALIQUOTS_L[3] ?? 0.001

export function useWorkbenchController({
  session,
  initialAttemptId = null,
  defaultMode = 'GUIDED',
  defaultAliquotL = DEFAULT_ALIQUOT_L,
  defaultStirrerRpm = DEFAULT_STIRRER_RPM,
}: WorkbenchControllerOptions): WorkbenchController {
  // --- Authoritative Session State ---
  const [sessionState, setSessionState] = useState<AcidSessionState | null>(null)

  // --- Allowed Local Operational State ---
  const [mode, setModeState] = useState<WorkbenchMode>(defaultMode)
  const [setupDraft, setSetupDraft] = useState<AcidSetupParams>(benchmarkSetupParams())
  const [selectedAliquotL, setSelectedAliquot] = useState<number>(defaultAliquotL)
  const [stirrerRpm, setStirrerRpm] = useState<number>(defaultStirrerRpm)
  const [busy, setBusy] = useState<boolean>(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [operationStage, setOperationStage] = useState<OperationStage>('idle')
  const [lastError, setLastError] = useState<ControllerError | null>(null)
  const [lastSuccessfulInteraction, setLastSuccessfulInteraction] =
    useState<InteractionAcknowledgement | null>(null)

  // Track mounted status to avoid setting state after unmount
  const isMountedRef = useRef(true)
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Ref to sessionState so asynchronous operations always read current state
  const sessionStateRef = useRef<AcidSessionState | null>(sessionState)
  useEffect(() => {
    sessionStateRef.current = sessionState
  }, [sessionState])

  // --- Load Initial Attempt if Provided ---
  useEffect(() => {
    let cancelled = false
    const parsedId = initialAttemptId ? parseUUID(initialAttemptId) : null
    if (!parsedId) return

    void (async () => {
      setBusy(true)
      setSaveStatus('saving')
      setOperationStage('reloading')
      try {
        const loaded = await session.load(parsedId)
        if (cancelled || !isMountedRef.current) return

        if (loaded !== null && loaded.ok) {
          setSessionState(loaded.state)
          setSaveStatus('saved')
          setLastError(null)
        } else {
          setSaveStatus('error')
          setLastError({
            code: loaded === null ? 'NOT_FOUND' : loaded.error.code,
            message: loaded === null ? 'errors.attemptNotFound' : loaded.error.messageKey,
            stage: 'reloading',
            recoverable: false,
          })
        }
      } catch (err) {
        if (cancelled || !isMountedRef.current) return
        setSaveStatus('error')
        setLastError({
          code: 'LOAD_ERROR',
          message: err instanceof Error ? err.message : 'Failed to load attempt',
          stage: 'reloading',
          recoverable: false,
        })
      } finally {
        if (!cancelled && isMountedRef.current) {
          setBusy(false)
          setOperationStage('idle')
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [initialAttemptId, session])

  /**
   * Safe mutation execution wrapper enforcing single-in-flight concurrency,
   * save status transitions, operation stages, and error handling.
   */
  const runMutatingOperation = useCallback(
    async (
      stage: OperationStage,
      operation: () => Promise<OrchestrationResult>,
    ): Promise<OrchestrationResult> => {
      if (busy) {
        return {
          ok: false,
          error: {
            code: 'BUSY',
            message: 'errors.controllerBusy',
            stage,
            recoverable: true,
          },
          stage,
          state: sessionStateRef.current ?? undefined,
        }
      }

      setBusy(true)
      setSaveStatus('saving')
      setOperationStage(stage)
      setLastError(null)

      try {
        const result = await operation()
        if (!isMountedRef.current) return result

        if (result.ok) {
          setSessionState(result.state)
          setSaveStatus('saved')
          setLastSuccessfulInteraction(result.acknowledgement)
        } else {
          setSaveStatus('error')
          setLastError(result.error)
          if (result.state) {
            setSessionState(result.state)
          }
        }
        return result
      } catch (err) {
        const error: ControllerError = {
          code: 'UNEXPECTED_ERROR',
          message: err instanceof Error ? err.message : String(err),
          stage,
          recoverable: true,
        }
        if (isMountedRef.current) {
          setSaveStatus('error')
          setLastError(error)
        }
        return { ok: false, error, stage }
      } finally {
        if (isMountedRef.current) {
          setBusy(false)
          setOperationStage('idle')
        }
      }
    },
    [busy],
  )

  // --- Commands ---

  const startRun = useCallback(
    async (
      setup?: AcidSetupParams,
      targetMode?: WorkbenchMode,
    ): Promise<OrchestrationResult> => {
      const activeMode = targetMode ?? mode
      if (targetMode) {
        setModeState(targetMode)
      }

      const candidateSetup = setup ?? setupDraft
      const validation = validateSetupParams(candidateSetup)
      if (!validation.ok) {
        const error: ControllerError = {
          code: validation.error.code,
          message: validation.error.messageKey,
          stage: 'starting',
          recoverable: true,
          data: validation.error.data as Record<string, unknown>,
        }
        setLastError(error)
        setSaveStatus('error')
        return { ok: false, error, stage: 'starting' }
      }

      const validSetup = validation.params

      return runMutatingOperation('starting', async () => {
        if (activeMode === 'EXPLORE') {
          return orchestrateExploreStart(session, validSetup)
        }

        // GUIDED: Start attempt only; no automated route selection or calibration
        const startState = await session.start(validSetup)
        return {
          ok: true,
          state: startState,
          stage: 'starting',
          acknowledgement: createAcknowledgement('start', startState),
        }
      })
    },
    [mode, runMutatingOperation, session, setupDraft],
  )

  const loadRun = useCallback(
    async (attemptId: UUID): Promise<OrchestrationResult> => {
      return runMutatingOperation('reloading', async () => {
        const loaded = await session.load(attemptId)
        if (loaded !== null && loaded.ok) {
          return {
            ok: true,
            state: loaded.state,
            stage: 'reloading',
            acknowledgement: createAcknowledgement('load', loaded.state),
          }
        }
        return {
          ok: false,
          error: {
            code: loaded === null ? 'NOT_FOUND' : loaded.error.code,
            message: loaded === null ? 'errors.attemptNotFound' : loaded.error.messageKey,
            stage: 'reloading',
            recoverable: false,
          },
          stage: 'reloading',
        }
      })
    },
    [runMutatingOperation, session],
  )

  const requireActiveAttempt = useCallback(
    (stage: OperationStage): { ok: true; attemptId: UUID } | { ok: false; result: OrchestrationResult } => {
      const current = sessionStateRef.current
      if (!current) {
        const error: ControllerError = {
          code: 'NO_ACTIVE_ATTEMPT',
          message: 'errors.noActiveAttempt',
          stage,
          recoverable: true,
        }
        return { ok: false, result: { ok: false, error, stage } }
      }
      return { ok: true, attemptId: current.attemptId }
    },
    [],
  )

  const selectNaohRoute = useCallback(async (): Promise<OrchestrationResult> => {
    const check = requireActiveAttempt('selecting_route')
    if (!check.ok) return check.result

    return runMutatingOperation('selecting_route', () =>
      executeGuidedAction(session, check.attemptId, 'select_route', { route: 'naoh' }, 'selecting_route'),
    )
  }, [requireActiveAttempt, runMutatingOperation, session])

  const calibrateMeter = useCallback(async (): Promise<OrchestrationResult> => {
    const check = requireActiveAttempt('calibrating')
    if (!check.ok) return check.result

    return runMutatingOperation('calibrating', () =>
      executeGuidedAction(session, check.attemptId, 'calibrate_meter', {}, 'calibrating'),
    )
  }, [requireActiveAttempt, runMutatingOperation, session])

  const addBase = useCallback(
    async (aliquotL?: number): Promise<OrchestrationResult> => {
      const check = requireActiveAttempt('dispensing')
      if (!check.ok) return check.result
      const volumeL = typeof aliquotL === 'number' ? aliquotL : selectedAliquotL

      return runMutatingOperation('dispensing', () =>
        executeGuidedAction(session, check.attemptId, 'add_base', { volumeL }, 'dispensing'),
      )
    },
    [requireActiveAttempt, runMutatingOperation, selectedAliquotL, session],
  )

  const mixSample = useCallback(async (): Promise<OrchestrationResult> => {
    const check = requireActiveAttempt('mixing')
    if (!check.ok) return check.result

    return runMutatingOperation('mixing', () =>
      executeGuidedAction(session, check.attemptId, 'mix', {}, 'mixing'),
    )
  }, [requireActiveAttempt, runMutatingOperation, session])

  const waitForStableReading = useCallback(async (): Promise<OrchestrationResult> => {
    const check = requireActiveAttempt('stabilizing')
    if (!check.ok) return check.result

    return runMutatingOperation('stabilizing', () =>
      executeGuidedAction(session, check.attemptId, 'wait_for_stable_reading', {}, 'stabilizing'),
    )
  }, [requireActiveAttempt, runMutatingOperation, session])

  const measurePh = useCallback(async (): Promise<OrchestrationResult> => {
    const check = requireActiveAttempt('measuring')
    if (!check.ok) return check.result

    return runMutatingOperation('measuring', () =>
      executeGuidedAction(session, check.attemptId, 'measure_ph', {}, 'measuring'),
    )
  }, [requireActiveAttempt, runMutatingOperation, session])

  const addCorrectionAcid = useCallback(
    async (aliquotL?: number): Promise<OrchestrationResult> => {
      const check = requireActiveAttempt('dispensing')
      if (!check.ok) return check.result
      const volumeL = typeof aliquotL === 'number' ? aliquotL : selectedAliquotL

      return runMutatingOperation('dispensing', () =>
        executeGuidedAction(
          session,
          check.attemptId,
          'add_correction_acid',
          { volumeL },
          'dispensing',
        ),
      )
    },
    [requireActiveAttempt, runMutatingOperation, selectedAliquotL, session],
  )

  const dispenseAndMeasure = useCallback(
    async (aliquotL?: number): Promise<OrchestrationResult> => {
      const check = requireActiveAttempt('dispensing')
      if (!check.ok) return check.result
      const volumeL = typeof aliquotL === 'number' ? aliquotL : selectedAliquotL

      return runMutatingOperation('dispensing', () =>
        orchestrateDispenseAndMeasure(session, check.attemptId, volumeL),
      )
    },
    [requireActiveAttempt, runMutatingOperation, selectedAliquotL, session],
  )

  const undoLastAction = useCallback(async (): Promise<OrchestrationResult> => {
    const check = requireActiveAttempt('undoing')
    if (!check.ok) return check.result

    return runMutatingOperation('undoing', () => orchestrateUndo(session, check.attemptId))
  }, [requireActiveAttempt, runMutatingOperation, session])

  const completeRun = useCallback(async (): Promise<OrchestrationResult> => {
    const check = requireActiveAttempt('completing')
    if (!check.ok) return check.result

    return runMutatingOperation('completing', () => orchestrateComplete(session, check.attemptId))
  }, [requireActiveAttempt, runMutatingOperation, session])

  const restartSameSetup = useCallback(async (): Promise<OrchestrationResult> => {
    const current = sessionStateRef.current
    const targetSetup = current ? getAttemptSetupParams(current) : setupDraft
    return startRun(targetSetup, mode)
  }, [mode, startRun, setupDraft])

  const beginNewSetup = useCallback((): void => {
    setSessionState(null)
    setSaveStatus('idle')
    setOperationStage('idle')
    setLastError(null)
    setLastSuccessfulInteraction(null)
  }, [])

  const setMode = useCallback((newMode: WorkbenchMode): void => {
    setModeState(newMode)
  }, [])

  const clearError = useCallback((): void => {
    setLastError(null)
  }, [])

  // --- Authoritative Read Models ---
  const domain = sessionState?.domain ?? null
  const projection = sessionState?.projection ?? null
  const attemptId = sessionState?.attemptId ?? null
  const status = sessionState?.status ?? null
  const isPreStart = sessionState === null

  const activeSetup = useMemo<AcidSetupParams | null>(() => {
    return sessionState ? getAttemptSetupParams(sessionState) : null
  }, [sessionState])

  const availableActions = useMemo<readonly ActionAvailability[]>(() => {
    if (!domain || !sessionState) return []
    return probeAvailableActions(domain, sessionState.lastSequence + 1)
  }, [domain, sessionState])

  const isExploreDispenseAvailable = useMemo<boolean>(() => {
    if (!domain || !sessionState || sessionState.status !== 'in_progress') return false
    if (domain.route === null || !domain.meterCalibrated) return false
    const addAction = availableActions.find((a) => a.actionType === 'add_base')
    return addAction?.available ?? false
  }, [availableActions, domain, sessionState])

  const isUndoAvailable = useMemo<boolean>(() => {
    if (!domain || !sessionState || sessionState.status !== 'in_progress') return false
    // Only select_route is undoable, and only before any base is added
    return domain.route !== null && domain.baseVolumeL === 0
  }, [domain, sessionState])

  const isCompleteAvailable = useMemo<boolean>(() => {
    if (!sessionState || sessionState.status !== 'in_progress') return false
    const compAction = availableActions.find((a) => a.actionType === 'complete')
    return compAction?.available ?? false
  }, [availableActions, sessionState])

  return {
    // Authoritative Domain Read Models
    sessionState,
    domain,
    projection,
    attemptId,
    status,
    activeSetup,
    availableActions,
    isPreStart,
    isExploreDispenseAvailable,
    isUndoAvailable,
    isCompleteAvailable,

    // Local Operational UI State
    mode,
    setupDraft,
    selectedAliquotL,
    stirrerRpm,
    busy,
    saveStatus,
    operationStage,
    lastError,
    lastSuccessfulInteraction,

    // Actions
    startRun,
    loadRun,
    restartSameSetup,
    beginNewSetup,
    selectNaohRoute,
    calibrateMeter,
    addBase,
    mixSample,
    waitForStableReading,
    measurePh,
    addCorrectionAcid,
    dispenseAndMeasure,
    undoLastAction,
    completeRun,
    setMode,
    setSetupDraft,
    setSelectedAliquot,
    setStirrerRpm,
    clearError,
  }
}
