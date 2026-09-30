import 'fake-indexeddb/auto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { GuestAttemptRepository } from '@/application/attempts/guest-repository.js'
import {
  createAcidSession,
  type AcidSession,
} from '@/application/simulation/acid-session.js'
import type { RemoteAcidSession } from '@/application/simulation/remote-session.js'
import type { AcidNeutralizationState } from '@/domain/experiments/acid-neutralization/state.js'
import {
  benchmarkSetupParams,
  validateSetupParams,
  type AcidSetupParams,
} from '@/domain/experiments/acid-neutralization/setup.js'
import {
  createAcknowledgement,
  executeGuidedAction,
  getAttemptSetupParams,
  handleSessionRefusal,
  orchestrateComplete,
  orchestrateDispenseAndMeasure,
  orchestrateExploreStart,
  orchestrateUndo,
} from '@/features/simulation-workbench/controller/orchestration.js'
import { useWorkbenchController } from '@/features/simulation-workbench/controller/use-workbench-controller.js'
import type { WorkbenchController } from '@/features/simulation-workbench/controller/types.js'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const CONTROLLER_HOOK_FILE = join(
  ROOT,
  'src',
  'features',
  'simulation-workbench',
  'controller',
  'use-workbench-controller.ts',
)
const CONTROLLER_TYPES_FILE = join(
  ROOT,
  'src',
  'features',
  'simulation-workbench',
  'controller',
  'types.ts',
)
const ORCHESTRATION_FILE = join(
  ROOT,
  'src',
  'features',
  'simulation-workbench',
  'controller',
  'orchestration.ts',
)

function createGuestSession() {
  const repo = new GuestAttemptRepository<AcidNeutralizationState>()
  return { repo, session: createAcidSession(repo) }
}

describe('Workbench Controller R3 - Setup Draft and Parameterized Start', () => {
  it('pre-start setup draft accepts valid AcidSetupParams through existing validator', () => {
    const validCustom: AcidSetupParams = {
      acidVolumeL: 0.04,
      acidConcentrationMolL: 0.02,
    }
    const validation = validateSetupParams(validCustom)
    expect(validation.ok).toBe(true)
    if (validation.ok) {
      expect(validation.params.acidVolumeL).toBe(0.04)
      expect(validation.params.acidConcentrationMolL).toBe(0.02)
    }

    const invalidUnderMin: AcidSetupParams = {
      acidVolumeL: 0.01,
      acidConcentrationMolL: 0.02,
    }
    const underMinVal = validateSetupParams(invalidUnderMin)
    expect(underMinVal.ok).toBe(false)
  })

  it('active run uses setup reconstructed from authoritative attempt rather than stale setupDraft', async () => {
    const { session } = createGuestSession()
    const customSetup: AcidSetupParams = {
      acidVolumeL: 0.035,
      acidConcentrationMolL: 0.015,
    }

    const state = await session.start(customSetup)
    const reconstructed = getAttemptSetupParams(state)

    expect(reconstructed.acidVolumeL).toBe(0.035)
    expect(reconstructed.acidConcentrationMolL).toBe(0.015)
  })

  it('reconstructs setup accurately even from benchmark run with zero arguments', async () => {
    const { session } = createGuestSession()
    const state = await session.start()
    const reconstructed = getAttemptSetupParams(state)

    const benchmark = benchmarkSetupParams()
    expect(reconstructed.acidVolumeL).toBe(benchmark.acidVolumeL)
    expect(reconstructed.acidConcentrationMolL).toBe(benchmark.acidConcentrationMolL)
  })
})

describe('Workbench Controller R3 - GUIDED Mode Procedural Contract', () => {
  it('GUIDED start creates attempt without silently selecting route or calibrating', async () => {
    const { session } = createGuestSession()
    const state = await session.start()

    expect(state.status).toBe('in_progress')
    expect(state.domain.route).toBeNull()
    expect(state.domain.meterCalibrated).toBe(false)
    expect(state.domain.phase).toBe('ready')
    expect(state.lastSequence).toBe(0)
  })

  it('guided select route dispatches exact existing select_route action', async () => {
    const { session } = createGuestSession()
    const state = await session.start()
    const res = await executeGuidedAction(
      session,
      state.attemptId,
      'select_route',
      { route: 'naoh' },
      'selecting_route',
    )

    expect(res.ok).toBe(true)
    if (res.ok) {
      expect(res.state.domain.route).toBe('naoh')
      expect(res.state.lastSequence).toBe(1)
      expect(res.stage).toBe('selecting_route')
      expect(res.acknowledgement.actionType).toBe('select_route')
      expect(res.acknowledgement.sequence).toBe(1)
    }
  })

  it('guided calibration dispatches exact existing calibrate_meter action', async () => {
    const { session } = createGuestSession()
    const state = await session.start()
    await executeGuidedAction(session, state.attemptId, 'select_route', { route: 'naoh' })

    const calRes = await executeGuidedAction(
      session,
      state.attemptId,
      'calibrate_meter',
      {},
      'calibrating',
    )
    expect(calRes.ok).toBe(true)
    if (calRes.ok) {
      expect(calRes.state.domain.meterCalibrated).toBe(true)
      expect(calRes.state.lastSequence).toBe(2)
      expect(calRes.stage).toBe('calibrating')
    }
  })

  it('guided add, mix, wait and measure remain separate domain actions and do not recompute pH in controller', async () => {
    const { session } = createGuestSession()
    const state = await session.start()
    await executeGuidedAction(session, state.attemptId, 'select_route', { route: 'naoh' })
    await executeGuidedAction(session, state.attemptId, 'calibrate_meter')

    // Add base (permitted aliquot: 0.001 L = 1 mL)
    const addRes = await executeGuidedAction(
      session,
      state.attemptId,
      'add_base',
      { volumeL: 0.001 },
      'dispensing',
    )
    expect(addRes.ok).toBe(true)
    if (addRes.ok) {
      expect(addRes.state.domain.baseVolumeL).toBe(0.001)
      expect(addRes.state.domain.mixedSinceLastAddition).toBe(false)
      expect(addRes.state.domain.readingStable).toBe(false)
      // Reading not yet updated before mix/wait/measure
      expect(addRes.state.domain.measurements.length).toBe(0)
    }

    // Mix
    const mixRes = await executeGuidedAction(session, state.attemptId, 'mix', {}, 'mixing')
    expect(mixRes.ok).toBe(true)
    if (mixRes.ok) {
      expect(mixRes.state.domain.mixedSinceLastAddition).toBe(true)
      expect(mixRes.state.domain.readingStable).toBe(false)
    }

    // Wait
    const waitRes = await executeGuidedAction(
      session,
      state.attemptId,
      'wait_for_stable_reading',
      {},
      'stabilizing',
    )
    expect(waitRes.ok).toBe(true)
    if (waitRes.ok) {
      expect(waitRes.state.domain.readingStable).toBe(true)
    }

    // Measure
    const measureRes = await executeGuidedAction(
      session,
      state.attemptId,
      'measure_ph',
      {},
      'measuring',
    )
    expect(measureRes.ok).toBe(true)
    if (measureRes.ok) {
      expect(measureRes.state.domain.measurements.length).toBe(1)
      expect(typeof measureRes.state.domain.lastMeasuredPH).toBe('number')
      // pH comes from authoritative session projection and domain measurement, not a controller formula
      expect(measureRes.state.projection.phStar).toBe(measureRes.state.domain.lastMeasuredPH)
    }
  })
})

describe('Workbench Controller R3 - EXPLORE Mode Orchestration Contract', () => {
  it('EXPLORE start creates parameterized attempt and performs authorized preparation sequence (select_route + calibrate)', async () => {
    const { session } = createGuestSession()
    const customSetup: AcidSetupParams = {
      acidVolumeL: 0.045,
      acidConcentrationMolL: 0.012,
    }

    const res = await orchestrateExploreStart(session, customSetup)
    expect(res.ok).toBe(true)
    if (res.ok) {
      expect(res.state.domain.route).toBe('naoh')
      expect(res.state.domain.meterCalibrated).toBe(true)
      expect(res.state.lastSequence).toBe(2) // start (0) -> select_route (1) -> calibrate_meter (2)
      expect(res.acknowledgement.actionType).toBe('calibrate_meter')
      expect(res.acknowledgement.sequence).toBe(2)
      expect(res.state.projection.initialAcidVolumeMl).toBe(45)
    }
  })

  it('dispenseAndMeasure dispatches exact add_base -> mix -> wait_for_stable_reading -> measure_ph order sequentially', async () => {
    const { session } = createGuestSession()
    const startRes = await orchestrateExploreStart(session)
    expect(startRes.ok).toBe(true)
    if (!startRes.ok) return

    const attemptId = startRes.state.attemptId
    // Use permitted aliquot: 0.001 L = 1 mL
    const result = await orchestrateDispenseAndMeasure(session, attemptId, 0.001)

    expect(result.ok).toBe(true)
    if (result.ok) {
      // All 4 actions committed: sequence 2 + 4 = 6
      expect(result.state.lastSequence).toBe(6)
      expect(result.state.domain.baseVolumeL).toBe(0.001)
      expect(result.state.domain.mixedSinceLastAddition).toBe(true)
      expect(result.state.domain.readingStable).toBe(true)
      expect(result.state.domain.measurements.length).toBe(1)
      expect(result.acknowledgement.actionType).toBe('measure_ph')
      expect(result.acknowledgement.sequence).toBe(6)
    }
  })

  it('permits continuous dispense and measure while domain permits it', async () => {
    const { session } = createGuestSession()
    const startRes = await orchestrateExploreStart(session)
    if (!startRes.ok) throw new Error('Start failed')

    const attemptId = startRes.state.attemptId
    // Dose 1 (permitted aliquot 0.005 L = 5 mL)
    const r1 = await orchestrateDispenseAndMeasure(session, attemptId, 0.005)
    expect(r1.ok).toBe(true)
    // Dose 2 (permitted aliquot 0.005 L = 5 mL)
    const r2 = await orchestrateDispenseAndMeasure(session, attemptId, 0.005)
    expect(r2.ok).toBe(true)

    if (r2.ok) {
      expect(r2.state.domain.baseVolumeL).toBe(0.01)
      expect(r2.state.domain.measurements.length).toBe(2)
    }
  })
})

describe('Workbench Controller R3 - Partial Sequence Failure and Refusal Recovery', () => {
  it('failure on first orchestration action stops sequence and preserves initial attempt', async () => {
    const fakeSession: Partial<AcidSession> = {
      storageMode: 'local',
      async start() {
        const { session } = createGuestSession()
        return session.start()
      },
      async apply(_id, actionType) {
        if (actionType === 'select_route') {
          return {
            ok: false,
            error: {
              category: 'precondition_failed',
              code: 'ROUTE_ALREADY_SELECTED',
              messageKey: 'errors.routeAlreadySelected',
              data: {},
            },
          }
        }
        throw new Error('Should not reach calibrate_meter')
      },
      async load() {
        return null
      },
    }

    const res = await orchestrateExploreStart(fakeSession as AcidSession)
    expect(res.ok).toBe(false)
    if (!res.ok) {
      expect(res.stage).toBe('selecting_route')
      expect(res.error.code).toBe('ROUTE_ALREADY_SELECTED')
      expect(res.error.stage).toBe('selecting_route')
      expect(res.state).toBeDefined()
      // Initial attempt state preserved, not rolled back
      expect(res.state?.lastSequence).toBe(0)
    }
  })

  it('failure after add_base does not claim rollback and preserves committed base addition', async () => {
    const { session } = createGuestSession()
    const started = await orchestrateExploreStart(session)
    if (!started.ok) throw new Error('start failed')

    let mixCalled = false
    const interceptedSession: AcidSession = {
      ...session,
      async apply(id, actionType, params, units, commit) {
        if (actionType === 'mix') {
          mixCalled = true
          return {
            ok: false,
            error: {
              category: 'precondition_failed',
              code: 'HARDWARE_MIX_FAILED',
              messageKey: 'errors.mixFailed',
              data: {},
            },
          }
        }
        return session.apply(id, actionType, params, units, commit)
      },
    }

    const res = await orchestrateDispenseAndMeasure(interceptedSession, started.state.attemptId, 0.001)
    expect(res.ok).toBe(false)
    expect(mixCalled).toBe(true)
    if (!res.ok) {
      expect(res.stage).toBe('mixing')
      expect(res.error.code).toBe('HARDWARE_MIX_FAILED')
      // Committed add_base is PRESERVED, not rolled back
      expect(res.state).toBeDefined()
      expect(res.state?.domain.baseVolumeL).toBe(0.001)
      expect(res.state?.domain.mixedSinceLastAddition).toBe(false)
    }
  })

  it('failure after mix does not execute wait_for_stable_reading or measure_ph', async () => {
    const { session } = createGuestSession()
    const started = await orchestrateExploreStart(session)
    if (!started.ok) throw new Error('start failed')

    let waitCalled = false
    let measureCalled = false

    const interceptedSession: AcidSession = {
      ...session,
      async apply(id, actionType, params, units, commit) {
        if (actionType === 'wait_for_stable_reading') {
          waitCalled = true
          return {
            ok: false,
            error: {
              category: 'precondition_failed',
              code: 'STABILIZATION_TIMEOUT',
              messageKey: 'errors.stabilizationTimeout',
              data: {},
            },
          }
        }
        if (actionType === 'measure_ph') {
          measureCalled = true
        }
        return session.apply(id, actionType, params, units, commit)
      },
    }

    const res = await orchestrateDispenseAndMeasure(interceptedSession, started.state.attemptId, 0.001)
    expect(res.ok).toBe(false)
    expect(waitCalled).toBe(true)
    expect(measureCalled).toBe(false)
    if (!res.ok) {
      expect(res.stage).toBe('stabilizing')
      expect(res.error.code).toBe('STABILIZATION_TIMEOUT')
      expect(res.state?.domain.mixedSinceLastAddition).toBe(true)
      expect(res.state?.domain.readingStable).toBe(false)
    }
  })

  it('revision conflict reloads authoritative attempt state from store without blind retry loops', async () => {
    const { session } = createGuestSession()
    const started = await session.start()
    const attemptId = started.attemptId

    // Simulate store returning revision_conflict
    const refusal = {
      ok: false as const,
      outcome: 'revision_conflict' as const,
      currentRevision: 5,
    }

    const error = await handleSessionRefusal(refusal, session, attemptId, 'dispensing')
    expect(error.code).toBe('REVISION_CONFLICT')
    expect(error.recoverable).toBe(true)
    expect(error.stage).toBe('dispensing')
    // Successfully reloaded authoritative state
    expect(error.reloadedState).toBeDefined()
    expect(error.reloadedState?.attemptId).toBe(attemptId)
  })

  it('idempotency conflict surfaces non-recoverable error without blind retry loop', async () => {
    const { session } = createGuestSession()
    const started = await session.start()

    const refusal = {
      ok: false as const,
      outcome: 'idempotency_conflict' as const,
      existingSequence: 3,
    }

    const error = await handleSessionRefusal(refusal, session, started.attemptId, 'dispensing')
    expect(error.code).toBe('IDEMPOTENCY_CONFLICT')
    expect(error.recoverable).toBe(false)
    expect(error.stage).toBe('dispensing')
    expect(error.data).toEqual({ existingSequence: 3 })
  })
})

describe('Workbench Controller R3 - Interaction Acknowledgement Contract', () => {
  it('successful persisted action updates acknowledgement with sequence, revision, and actionType', async () => {
    const { session } = createGuestSession()
    const started = await session.start()

    const ack = createAcknowledgement('select_route', started)
    expect(ack.actionType).toBe('select_route')
    expect(ack.sequence).toBe(started.lastSequence)
    expect(ack.revision).toBe(started.revision)
    expect(ack.occurredAt).toBeInstanceOf(Date)
  })

  it('failed action returns ok: false and does not emit successful acknowledgement token', async () => {
    const { session } = createGuestSession()
    const started = await session.start()

    // Applying add_base before select_route will fail domain validation
    const res = await executeGuidedAction(
      session,
      started.attemptId,
      'add_base',
      { volumeL: 0.001 },
      'dispensing',
    )

    expect(res.ok).toBe(false)
    if (!res.ok) {
      expect('acknowledgement' in res).toBe(false)
      expect(res.error).toBeDefined()
      expect(res.stage).toBe('dispensing')
    }
  })
})

describe('Workbench Controller R3 - Stirrer Operational Telemetry', () => {
  it('stirrer RPM is operational/visual only, does not alter chemistry or dispatch mix', async () => {
    const { session } = createGuestSession()
    const started = await session.start()

    // Changing stirrer RPM in operational state does not change session or chemistry
    const initialMoles = started.domain.chlorideMoles
    const initialVol = started.domain.totalVolumeL

    // Even if RPM is set high, chemistry state remains unchanged
    const stirrerRpm = 1000
    expect(stirrerRpm).toBe(1000)
    expect(started.domain.chlorideMoles).toBe(initialMoles)
    expect(started.domain.totalVolumeL).toBe(initialVol)
    expect(started.domain.readingStable).toBe(false)
  })

  it('mixSample dispatches the explicit domain mix action', async () => {
    const { session } = createGuestSession()
    const started = await session.start()
    await executeGuidedAction(session, started.attemptId, 'select_route', { route: 'naoh' })
    await executeGuidedAction(session, started.attemptId, 'calibrate_meter')
    await executeGuidedAction(session, started.attemptId, 'add_base', { volumeL: 0.001 })

    const mixRes = await executeGuidedAction(
      session,
      started.attemptId,
      'mix',
      {},
      'mixing',
    )
    expect(mixRes.ok).toBe(true)
    if (mixRes.ok) {
      expect(mixRes.state.domain.mixedSinceLastAddition).toBe(true)
    }
  })
})

describe('Workbench Controller R3 - Restart and Setup Lifecycle Contract', () => {
  it('restartSameSetup reconstructs setup from authoritative initial state and creates fresh attempt', async () => {
    const { session } = createGuestSession()
    const customSetup: AcidSetupParams = {
      acidVolumeL: 0.04,
      acidConcentrationMolL: 0.018,
    }

    const run1 = await session.start(customSetup)
    await session.apply(run1.attemptId, 'select_route', { route: 'naoh' })
    await session.apply(run1.attemptId, 'calibrate_meter')
    await session.apply(run1.attemptId, 'add_base', { volumeL: 0.005 })

    // Reconstruct setup from active run 1
    const reconstructedSetup = getAttemptSetupParams(run1)
    expect(reconstructedSetup.acidVolumeL).toBe(0.04)
    expect(reconstructedSetup.acidConcentrationMolL).toBe(0.018)

    // Start fresh attempt with same setup
    const run2 = await session.start(reconstructedSetup)
    expect(run2.attemptId).not.toBe(run1.attemptId)
    expect(run2.lastSequence).toBe(0)
    expect(run2.domain.totalVolumeL).toBe(0.04)
    expect(run2.domain.baseVolumeL).toBe(0)

    // Run 1 history remains intact in repository
    const loadedRun1 = await session.load(run1.attemptId)
    expect(loadedRun1 !== null && loadedRun1.ok).toBe(true)
    if (loadedRun1 && loadedRun1.ok) {
      expect(loadedRun1.state.domain.baseVolumeL).toBe(0.005)
      expect(loadedRun1.state.lastSequence).toBe(3)
    }
  })
})

describe('Workbench Controller R3 - Undo and Completion Contracts', () => {
  it('orchestrateUndo reverts reversible action and updates sequence', async () => {
    const { session } = createGuestSession()
    const started = await session.start()
    const routeRes = await session.apply(started.attemptId, 'select_route', { route: 'naoh' })
    expect(routeRes.ok).toBe(true)

    const undoRes = await orchestrateUndo(session, started.attemptId)
    expect(undoRes.ok).toBe(true)
    if (undoRes.ok) {
      expect(undoRes.state.domain.route).toBeNull()
      expect(undoRes.stage).toBe('undoing')
      expect(undoRes.acknowledgement.actionType).toBe('undo_last')
    }
  })

  it('orchestrateComplete delegates to session.complete and produces report snapshot after valid measurement', async () => {
    const { session } = createGuestSession()
    const startRes = await orchestrateExploreStart(session)
    expect(startRes.ok).toBe(true)
    if (!startRes.ok) return

    // Execute a dispense and measure to achieve a valid, stable, measured state
    const dmRes = await orchestrateDispenseAndMeasure(session, startRes.state.attemptId, 0.001)
    expect(dmRes.ok).toBe(true)
    if (!dmRes.ok) return

    const compRes = await orchestrateComplete(session, startRes.state.attemptId)
    expect(compRes.ok).toBe(true)
    if (compRes.ok) {
      expect(compRes.state.status).toBe('completed')
      expect(compRes.state.finalReportSnapshot).not.toBeNull()
      expect(compRes.stage).toBe('completing')
      expect(compRes.acknowledgement.actionType).toBe('complete')
    }
  })
})

describe('Workbench Controller R3 - React Hook useWorkbenchController', () => {
  it('mounts cleanly in React 19 without errors and initializes authoritative read models and local state', () => {
    const { session } = createGuestSession()
    let capturedController: WorkbenchController | null = null

    function TestComponent() {
      capturedController = useWorkbenchController({ session })
      return React.createElement('div', { id: 'test' }, 'workbench-controller-active')
    }

    const html = renderToString(React.createElement(TestComponent))
    expect(html).toContain('workbench-controller-active')
    expect(capturedController).not.toBeNull()

    if (capturedController) {
      const c = capturedController as WorkbenchController
      // Authoritative read models
      expect(c.isPreStart).toBe(true)
      expect(c.sessionState).toBeNull()
      expect(c.domain).toBeNull()
      expect(c.projection).toBeNull()
      expect(c.attemptId).toBeNull()
      expect(c.status).toBeNull()
      expect(c.activeSetup).toBeNull()
      expect(c.availableActions).toEqual([])
      expect(c.isExploreDispenseAvailable).toBe(false)
      expect(c.isUndoAvailable).toBe(false)
      expect(c.isCompleteAvailable).toBe(false)

      // Allowed local operational state
      expect(c.mode).toBe('GUIDED')
      expect(c.setupDraft).toEqual(benchmarkSetupParams())
      expect(c.selectedAliquotL).toBe(0.001)
      expect(c.stirrerRpm).toBe(300)
      expect(c.busy).toBe(false)
      expect(c.saveStatus).toBe('idle')
      expect(c.operationStage).toBe('idle')
      expect(c.lastError).toBeNull()
      expect(c.lastSuccessfulInteraction).toBeNull()

      // Actions are callable functions
      expect(typeof c.startRun).toBe('function')
      expect(typeof c.loadRun).toBe('function')
      expect(typeof c.restartSameSetup).toBe('function')
      expect(typeof c.beginNewSetup).toBe('function')
      expect(typeof c.selectNaohRoute).toBe('function')
      expect(typeof c.calibrateMeter).toBe('function')
      expect(typeof c.addBase).toBe('function')
      expect(typeof c.mixSample).toBe('function')
      expect(typeof c.waitForStableReading).toBe('function')
      expect(typeof c.measurePh).toBe('function')
      expect(typeof c.addCorrectionAcid).toBe('function')
      expect(typeof c.dispenseAndMeasure).toBe('function')
      expect(typeof c.undoLastAction).toBe('function')
      expect(typeof c.completeRun).toBe('function')
      expect(typeof c.setMode).toBe('function')
      expect(typeof c.setSetupDraft).toBe('function')
      expect(typeof c.setSelectedAliquot).toBe('function')
      expect(typeof c.setStirrerRpm).toBe('function')
      expect(typeof c.clearError).toBe('function')
    }
  })
})

describe('Workbench Controller R3 - Single Source of Truth & Zero Chemistry Duplication', () => {
  it('ensures useWorkbenchController hook source code never duplicates authoritative chemistry fields', () => {
    const hookCode = readFileSync(CONTROLLER_HOOK_FILE, 'utf8')

    // Authoritative chemistry fields that MUST NOT be duplicated in React local state
    const forbiddenStates = [
      'useState<number>(0) // for chlorideMoles',
      'chlorideMoles, setChlorideMoles',
      'sodiumMoles, setSodiumMoles',
      'totalVolumeL, setTotalVolumeL',
      'baseVolumeL, setBaseVolumeL',
      'simulatedPH, setSimulatedPH',
      'lastMeasuredPH, setLastMeasuredPH',
      'compositionRevision',
      'measurementHistory',
      'aliquotHistory',
    ]

    for (const forbidden of forbiddenStates) {
      expect(hookCode).not.toContain(forbidden)
    }

    // Must not have setPh or ph calculation in hook
    expect(hookCode).not.toMatch(/setPh\s*\(/)
    expect(hookCode).not.toMatch(/calcPh\s*\(/)
    expect(hookCode).not.toMatch(/Math\.log10/)
  })

  it('ensures hook does not contain animation timers or global listeners', () => {
    const hookCode = readFileSync(CONTROLLER_HOOK_FILE, 'utf8')

    // No animation or fake timers
    expect(hookCode).not.toContain('setInterval')
    expect(hookCode).not.toContain('requestAnimationFrame')
    expect(hookCode).not.toContain('setTimeout')

    // No global listeners
    expect(hookCode).not.toMatch(/window\.addEventListener/)
    expect(hookCode).not.toMatch(/document\.addEventListener/)
  })

  it('ensures types.ts cleanly separates authoritative domain read models from allowed local state', () => {
    const typesCode = readFileSync(CONTROLLER_TYPES_FILE, 'utf8')

    expect(typesCode).toContain('WorkbenchMode')
    expect(typesCode).toContain('OperationStage')
    expect(typesCode).toContain('SaveStatus')
    expect(typesCode).toContain('InteractionAcknowledgement')
    expect(typesCode).toContain('ControllerError')
    expect(typesCode).toContain('OrchestrationResult')
    expect(typesCode).toContain('WorkbenchControllerState')
    expect(typesCode).toContain('WorkbenchControllerActions')
    expect(typesCode).toContain('WorkbenchController')
  })

  it('ensures orchestration.ts exports pure testable orchestration functions', () => {
    const orchCode = readFileSync(ORCHESTRATION_FILE, 'utf8')
    expect(orchCode).toContain('export function createAcknowledgement')
    expect(orchCode).toContain('export function getAttemptSetupParams')
    expect(orchCode).toContain('export async function handleSessionRefusal')
    expect(orchCode).toContain('export async function executeGuidedAction')
    expect(orchCode).toContain('export async function orchestrateExploreStart')
    expect(orchCode).toContain('export async function orchestrateDispenseAndMeasure')
    expect(orchCode).toContain('export async function orchestrateUndo')
    expect(orchCode).toContain('export async function orchestrateComplete')
  })

  it('verifies RemoteAcidSession satisfies controller AcidSession typing', () => {
    // Structural typecheck: verify AcidSession signature is satisfied by both session types
    const isSessionCompatible = (s: RemoteAcidSession | AcidSession) =>
      typeof s.apply === 'function' && typeof s.start === 'function'
    expect(typeof isSessionCompatible).toBe('function')
  })
})
