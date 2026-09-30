import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { GuestAttemptRepository } from '@/application/attempts/guest-repository.js'
import { createAcidSession } from '@/application/simulation/acid-session.js'
import type { AcidNeutralizationState } from '@/domain/experiments/acid-neutralization/state.js'
import { stateHash } from '@/domain/process/hashing.js'
import { replayEvents } from '@/domain/process/lifecycle.js'
import { createInitialResourceLedger } from '@/domain/experiments/acid-neutralization/resources.js'

function guestSession() {
  const repo = new GuestAttemptRepository<AcidNeutralizationState>()
  return { repo, session: createAcidSession(repo) }
}

describe('Parameterized Guest AcidSession Lifecycle', () => {
  it('preserves exact benchmark behavior when start() is called with zero arguments', async () => {
    const { session } = guestSession()
    const state = await session.start()

    expect(state.domain.totalVolumeL).toBe(0.025)
    expect(state.domain.chlorideMoles).toBe(0.00025)
    expect(state.projection.initialAcidVolumeMl).toBe(25)
    expect(state.projection.initialAcidConcentrationMolL).toBe(0.010)
    expect(state.status).toBe('in_progress')
  })

  it('creates parameterized initial state and projection when start(params) is called', async () => {
    const { session } = guestSession()
    const state = await session.start({
      acidVolumeL: 0.050,
      acidConcentrationMolL: 0.015,
    })

    expect(state.domain.totalVolumeL).toBe(0.050)
    // 0.050 L * 0.015 mol/L = 0.00075 mol
    expect(state.domain.chlorideMoles).toBeCloseTo(0.00075, 9)
    expect(state.projection.initialAcidVolumeMl).toBe(50)
    expect(state.projection.initialAcidConcentrationMolL).toBe(0.015)
  })

  it('uses attempt-specific configuration for actions and permits volume beyond benchmark cap', async () => {
    const { session } = guestSession()
    // Start with 50 mL sample (which has 60 mL NaOH cap instead of 30 mL)
    const started = await session.start({
      acidVolumeL: 0.050,
      acidConcentrationMolL: 0.010,
    })
    const attemptId = started.attemptId

    // Select route
    const routeRes = await session.apply(attemptId, 'select_route', { route: 'naoh' })
    expect(routeRes.ok).toBe(true)

    // Calibrate meter
    const calRes = await session.apply(attemptId, 'calibrate_meter')
    expect(calRes.ok).toBe(true)

    // Add 7 doses of 5 mL = 35 mL (would be blocked by benchmark 30 mL cap)
    for (let i = 0; i < 7; i++) {
      const addRes = await session.apply(attemptId, 'add_base', { volumeL: 0.005 })
      expect(addRes.ok, `dose ${i + 1} should be accepted`).toBe(true)
    }

    // Verify 35 mL NaOH was dosed successfully
    const loaded = await session.load(attemptId)
    expect(loaded?.ok).toBe(true)
    if (loaded && loaded.ok) {
      expect(loaded.state.domain.baseVolumeL).toBeCloseTo(0.035, 6)
      expect(loaded.state.projection.baseVolumeMl).toBeCloseTo(35, 3)
      expect(loaded.state.projection.initialAcidVolumeMl).toBe(50)
    }
  })

  it('supports undo on a parameterized attempt while maintaining state integrity', async () => {
    const { session } = guestSession()
    const started = await session.start({
      acidVolumeL: 0.040,
      acidConcentrationMolL: 0.010,
    })
    const attemptId = started.attemptId

    // select_route is the spec §5.1 undoable action
    const routed = await session.apply(attemptId, 'select_route', { route: 'naoh' })
    expect(routed.ok).toBe(true)
    if (routed.ok) {
      expect(routed.state.domain.route).toBe('naoh')
    }

    // Apply undo on select_route
    const undoRes = await session.undo(attemptId)
    expect(undoRes.ok).toBe(true)
    if (undoRes.ok) {
      expect(undoRes.state.domain.route).toBeNull()
      expect(undoRes.state.projection.initialAcidVolumeMl).toBe(40)
      expect(undoRes.state.domain.totalVolumeL).toBe(0.040)
    }

    // Subsequent re-route, calibrate and dose
    await session.apply(attemptId, 'select_route', { route: 'naoh' })
    await session.apply(attemptId, 'calibrate_meter')
    await session.apply(attemptId, 'add_base', { volumeL: 0.005 })

    // Undoing after dosing is refused per spec §5.1 (dosed chemistry is irreversible)
    const refused = await session.undo(attemptId)
    expect(refused.ok).toBe(false)
    if (!refused.ok && 'error' in refused) {
      expect(refused.error.code).toBe('ACTION_NOT_UNDOABLE')
    }
  })

  it('evaluates completion and scoring against parameterized target equivalents', async () => {
    const { session } = guestSession()
    // 50 mL HCl 0.010 M -> 0.50 mmol eq target for NaOH (vs 0.25 mmol eq benchmark)
    const started = await session.start({
      acidVolumeL: 0.050,
      acidConcentrationMolL: 0.010,
    })
    const attemptId = started.attemptId

    await session.apply(attemptId, 'select_route', { route: 'naoh' })
    await session.apply(attemptId, 'calibrate_meter')

    // Add 10 x 5 mL = 50 mL NaOH (equivalent point for 50 mL sample with 0.01 M NaOH)
    for (let i = 0; i < 10; i++) {
      await session.apply(attemptId, 'add_base', { volumeL: 0.005 })
    }
    await session.apply(attemptId, 'mix')
    await session.apply(attemptId, 'wait_for_stable_reading')
    await session.apply(attemptId, 'measure_ph')

    // Complete the attempt
    const completeRes = await session.complete(attemptId)
    expect(completeRes.ok).toBe(true)
    if (completeRes.ok) {
      expect(completeRes.state.status).toBe('completed')
      expect(completeRes.report.projection.initialAcidVolumeMl).toBe(50)
      expect(completeRes.report.projection.initialAcidConcentrationMolL).toBe(0.010)
      // Target equivalents E* should be 0.50 mmol eq for 50 mL HCl 0.01 M
      expect(completeRes.report.projection.targetEquivalentsMmolEq).toBeCloseTo(0.50, 4)
      expect(completeRes.report.projection.grossEquivalentsMmolEq).toBeCloseTo(0.50, 4)
    }
  })

  it('replays parameterized event chain deterministically to identical final state hash', async () => {
    const { repo, session } = guestSession()
    const started = await session.start({
      acidVolumeL: 0.030,
      acidConcentrationMolL: 0.012,
    })
    const attemptId = started.attemptId

    await session.apply(attemptId, 'select_route', { route: 'naoh' })
    await session.apply(attemptId, 'calibrate_meter')
    await session.apply(attemptId, 'add_base', { volumeL: 0.005 })
    await session.apply(attemptId, 'mix')
    await session.apply(attemptId, 'wait_for_stable_reading')
    const finalAction = await session.apply(attemptId, 'measure_ph')
    expect(finalAction.ok).toBe(true)

    if (finalAction.ok) {
      const finalState = finalAction.state.domain
      const finalHash = stateHash(finalState)

      // Replay stored events from attempt's initialState
      const attempt = await repo.getAttempt(attemptId)
      expect(attempt).not.toBeNull()
      const events = await repo.getAttemptEvents(attemptId)
      expect(events.length).toBe(6)

      const replayed = replayEvents(
        attempt!.initialState,
        createInitialResourceLedger(),
        events,
      )
      expect(replayed.ok).toBe(true)
      if (replayed.ok) {
        expect(stateHash(replayed.state)).toBe(finalHash)
        expect(replayed.state).toEqual(finalState)
      }
    }
  })
})
