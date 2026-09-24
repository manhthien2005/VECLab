import { describe, expect, it } from 'vitest'
import type { SimulationAction, UUID } from '@/domain/process/contracts.js'
import {
  ACID_RELEASE_ID,
  benchmarkScenarioConfig,
  createAcidNeutralizationModule,
  createInitialResourceLedger,
  resolveTargetEquivalentsByRoute,
} from '@/domain/experiments/acid-neutralization/index.js'
import type {
  AcidNeutralizationState,
  AcidRoute,
} from '@/domain/experiments/acid-neutralization/index.js'
import { evaluateAcidScoreBreakdown } from '@/domain/experiments/acid-neutralization/scoring.js'
import {
  createAcidProjector,
  isAcidProjection,
  type AcidProjection,
} from '@/application/scenarios/acid-projection.js'
import {
  commitAction,
  type CommitSuccess,
  type StoredAttemptSnapshot,
} from '@/application/simulation/commit-action.js'

/**
 * Projection contract tests.
 *
 * The projection is what the lab list, the report header and the comparison view read;
 * the workbench and the report read the domain state directly. If those two paths ever
 * disagree, a learner sees one score in their list and a different score in their report
 * for the same run.
 *
 * These tests drive the REAL commit path (commitAction -> projector) end to end and
 * compare against the scoring module both paths are built on, so they fail on the bugs
 * this layer exists to prevent: a projector that re-derives E* or scores differently
 * from the engine, a stale reading that still satisfies the goal, and an unevaluable run
 * reported as a zero.
 */

const engine = createAcidNeutralizationModule()
const projector = createAcidProjector()
const config = benchmarkScenarioConfig()
const targetEquivalentsByRoute = resolveTargetEquivalentsByRoute(config)

const ATTEMPT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID
const OCCURRED_AT = new Date('2026-09-11T08:00:00.000Z')

let counter = 0
function actionId(): UUID {
  counter += 1
  return `c0000000-0000-4000-8000-${String(counter).padStart(12, '0')}` as UUID
}

function action(
  actionType: string,
  parameters: Record<string, number | string | boolean> = {},
): SimulationAction {
  return { actionId: actionId(), actionType, parameters, unitSelections: {} }
}

/** One committed action plus the projection derived from it. */
type CommittedStep = {
  commit: CommitSuccess<AcidNeutralizationState>
  projection: AcidProjection
}

function initialSnapshot(): StoredAttemptSnapshot<AcidNeutralizationState> {
  return {
    attemptId: ATTEMPT_ID,
    releaseId: ACID_RELEASE_ID,
    revision: 0,
    lastSequence: 0,
    state: engine.createInitialState(),
    ledger: createInitialResourceLedger(),
  }
}

/**
 * Thread one action through the application commit path and project the result.
 *
 * Mirrors what the session does on every accepted action, so the test exercises the
 * same code the UI will: compute the event, then project `stateAfter` + `ledgerAfter`
 * — the pair the store would hold, since `current_state` is the bare domain state and
 * the ledger is rebuilt by folding deltas.
 */
function commit(
  snapshot: StoredAttemptSnapshot<AcidNeutralizationState>,
  act: SimulationAction,
): { snapshot: StoredAttemptSnapshot<AcidNeutralizationState>; step: CommittedStep } {
  const result = commitAction(engine, {
    attempt: snapshot,
    action: act,
    occurredAt: OCCURRED_AT,
  })

  if (!result.ok) throw new Error(`action rejected: ${result.error.code}`)

  const next: StoredAttemptSnapshot<AcidNeutralizationState> = {
    attemptId: snapshot.attemptId,
    releaseId: ACID_RELEASE_ID,
    revision: snapshot.revision + 1,
    lastSequence: result.sequence,
    state: result.stateAfter,
    ledger: result.ledgerAfter,
  }

  return {
    snapshot: next,
    step: {
      commit: result,
      projection: projector.project(
        ACID_RELEASE_ID,
        result.sequence,
        result.stateAfter,
        result.ledgerAfter,
      ),
    },
  }
}

/** select_route + calibrate, then dose each aliquot with mix/wait/measure. */
function titrate(route: AcidRoute, aliquotsMl: number[]): {
  snapshot: StoredAttemptSnapshot<AcidNeutralizationState>
  steps: CommittedStep[]
} {
  let snapshot = initialSnapshot()
  const steps: CommittedStep[] = []

  const push = (act: SimulationAction): void => {
    const result = commit(snapshot, act)
    snapshot = result.snapshot
    steps.push(result.step)
  }

  push(action('select_route', { route }))
  push(action('calibrate_meter'))

  for (const ml of aliquotsMl) {
    // The canonical parameter is litres; the UI presents mL and normalizeParameters
    // converts through `unitSelections`, so the engine only ever sees litres.
    push(action('add_base', { volumeL: ml / 1000 }))
    push(action('mix'))
    push(action('wait_for_stable_reading'))
    push(action('measure_ph'))
  }

  return { snapshot, steps }
}

/** The authoritative breakdown for a state on a given route. */
function expectedBreakdown(state: AcidNeutralizationState, route: AcidRoute | null) {
  return evaluateAcidScoreBreakdown(
    state,
    route === null ? null : targetEquivalentsByRoute[route],
    config.constants.targetPH,
  )
}

describe('projection agrees with the engine', () => {
  const cases: Array<[AcidRoute, number[]]> = [
    ['naoh', [1.0, 1.0, 0.5]],
    ['calcium-hydroxide', [1.0, 1.0, 0.5]],
    ['sodium-carbonate', [5.0, 5.0, 1.0, 0.5]],
  ]

  for (const [route, aliquots] of cases) {
    it(`reports the same scores as the scoring module for ${route}`, () => {
      const { steps } = titrate(route, aliquots)
      const { projection, commit: committed } = steps[steps.length - 1]!

      const breakdown = expectedBreakdown(committed.stateAfter, route)

      expect(projection.phScore).toEqual(breakdown.phScore)
      expect(projection.resourceScore).toEqual(breakdown.resourceScore)
      expect(projection.processScore).toEqual(breakdown.processScore)
      expect(projection.overallScore).toEqual(breakdown.overallScore)
      expect(projection.targetEquivalentsMmolEq).toEqual(breakdown.targetEquivalentsMmolEq)
      expect(projection.grossEquivalentsMmolEq).toEqual(breakdown.grossEquivalentsMmolEq)

      // Readouts come straight from the committed state.
      expect(projection.phStar).toBe(committed.stateAfter.lastMeasuredPH)
      expect(projection.route).toBe(route)
      expect(projection.sequence).toBe(committed.sequence)
      expect(projection.scenarioReleaseId).toBe(ACID_RELEASE_ID)
      expect(projection.baseVolumeMl).toBeCloseTo(committed.stateAfter.baseVolumeL * 1000, 9)
      expect(projection.totalVolumeMl).toBeCloseTo(committed.stateAfter.totalVolumeL * 1000, 9)

      // Ledger-derived numbers come from the replayed ledger, not from a re-computation.
      expect(projection.operationCount).toBe(committed.ledgerAfter.operationCount)
      expect(projection.safetyPenaltyCodes).toEqual(
        committed.ledgerAfter.safetyPenalties.map((penalty) => penalty.code),
      )

      // Goal attainment is the MODULE's success plus a current measurement. The
      // projection adds the freshness requirement; it never re-decides success.
      const goalStatus = engine.evaluateGoalStatus(
        committed.stateAfter,
        committed.ledgerAfter,
      )
      expect(projection.goalMet).toBe(
        goalStatus.goalMet && projection.measurementCurrent,
      )
    })
  }

  it('resolves E* so a dosed run has a non-null resource score', () => {
    // The exact failure the factory symmetry prevents: if the projector resolved E*
    // differently from the engine, resourceScore would be null here while the report
    // showed a real score.
    const { steps } = titrate('naoh', [1.0, 1.0, 0.5])
    const projection = steps[steps.length - 1]!.projection

    expect(projection.targetEquivalentsMmolEq).not.toBeNull()
    expect(projection.resourceScore).not.toBeNull()
  })
})

describe('projection boundaries', () => {
  it('reports N/A, not zero, before any route is chosen', () => {
    const projection = projector.project(
      ACID_RELEASE_ID,
      0,
      engine.createInitialState(),
      createInitialResourceLedger(),
    )

    expect(projection.route).toBeNull()
    expect(projection.phStar).toBeNull()
    // A zero would claim the learner scored nothing on work that has not been scored.
    expect(projection.overallScore).toBeNull()
    expect(projection.resourceScore).toBeNull()
    expect(projection.goalMet).toBe(false)
  })

  it('a new dose clears the reading, so the goal cannot be met on it', () => {
    // Dose, then add more base WITHOUT re-measuring. Spec §5.2 atomically INVALIDATES
    // the reading — the engine sets lastMeasuredPH to null rather than keeping a number
    // that no longer describes the sample — so a learner cannot "complete" on a stale
    // reading, and the projection must show no pH at all.
    const { snapshot, steps } = titrate('naoh', [1.0])
    const measured = steps[steps.length - 1]!.projection
    expect(measured.phStar).not.toBeNull()
    expect(measured.measurementCurrent).toBe(true)

    const stale = commit(snapshot, action('add_base', { volumeL: 0.00005 })).step.projection

    expect(stale.phStar).toBeNull()
    expect(stale.measurementCurrent).toBe(false)
    expect(stale.goalMet).toBe(false)
    // The composition revision advanced, which is what invalidated the reading.
    expect(stale.sequence).toBe(measured.sequence + 1)
  })

  it('rejects a restored state whose reading predates its composition', () => {
    // The freshness guard exists for state that did NOT come from the engine: a guest
    // import replayed from IndexedDB, or a restored snapshot. There the measurement log
    // is data rather than a guarantee, so a truncated or tampered record must not
    // silently earn the goal. Bumping the revision past the reading's revision simulates
    // exactly that.
    const { steps } = titrate('naoh', [1.0, 1.0, 0.5])
    const measured = steps[steps.length - 1]!.commit.stateAfter

    const tampered: AcidNeutralizationState = {
      ...measured,
      compositionRevision: measured.compositionRevision + 1,
    }

    const projection = projector.project(
      ACID_RELEASE_ID,
      20,
      tampered,
      createInitialResourceLedger(),
    )

    // The number is still reported — it is in the log — but flagged as describing a
    // superseded composition, and therefore not allowed to satisfy the goal.
    expect(projection.phStar).not.toBeNull()
    expect(projection.measurementCurrent).toBe(false)
    expect(projection.goalMet).toBe(false)
  })
})

describe('stored projection guard', () => {
  it('accepts what the projector produced', () => {
    const { steps } = titrate('naoh', [1.0])
    // `current_projection` is jsonb, so a stored value arrives untyped. The guard is
    // what decides whether to render it or recompute.
    expect(isAcidProjection(steps[steps.length - 1]!.projection)).toBe(true)
  })

  it('rejects a projection missing a field', () => {
    const { steps } = titrate('naoh', [1.0])
    const { overallScore: _dropped, ...partial } = steps[steps.length - 1]!.projection

    // An older projector version that lacked a field must be recomputed rather than
    // rendered with the field silently undefined.
    expect(isAcidProjection(partial)).toBe(false)
  })

  it('rejects values that are not objects', () => {
    expect(isAcidProjection(null)).toBe(false)
    expect(isAcidProjection(undefined)).toBe(false)
    expect(isAcidProjection('{"phStar":7}')).toBe(false)
    expect(isAcidProjection([])).toBe(false)
  })
})
