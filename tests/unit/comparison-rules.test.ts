import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import type { UUID } from '@/domain/process/contracts.js'
import {
  ACID_RELEASE_ID,
  createAcidNeutralizationModule,
} from '@/domain/experiments/acid-neutralization/index.js'
import type { AcidNeutralizationState } from '@/domain/experiments/acid-neutralization/index.js'
import type { ResourceLedger } from '@/domain/process/contracts.js'
import { createInitialResourceLedger } from '@/domain/process/ledger.js'
import { GuestAttemptRepository } from '@/application/attempts/guest-repository.js'
import {
  createAcidSession,
  type AcidSessionState,
} from '@/application/simulation/acid-session.js'
import { createAcidProjector } from '@/application/scenarios/acid-projection.js'
import {
  assessComparability,
  buildComparison,
  type CompareSide,
} from '@/features/compare/comparison.js'

/**
 * §4.8 comparison rules and §15.1's frozen-report requirement.
 *
 * The comparability rules are the reason this module exists as pure code rather than as JSX:
 * §18.5 forbids comparing across releases, and a rule that lives in a render path is a rule
 * nobody tests. Each case below is a way the screen could silently show a number that is not a
 * verdict about the learner's technique — a different release, an unfinished run, one run
 * compared against itself.
 *
 * The frozen-report cases use REAL completed runs from the guest runtime, not fabricated
 * literals. That matters: the whole point of §15.1 is that a completed run's scores come from
 * the snapshot written when it finished, so the test has to have a real snapshot and a
 * deliberately different live projection to prove which one wins.
 */

const projector = createAcidProjector()
/** The release's own module, so fixtures use the engine's initial state rather than a copy. */
const engine = createAcidNeutralizationModule()

function repository(): GuestAttemptRepository<AcidNeutralizationState> {
  return new GuestAttemptRepository<AcidNeutralizationState>()
}

function session(): ReturnType<typeof createAcidSession> {
  return createAcidSession(repository())
}

/** Dose each aliquot through the mix/wait/measure cycle a decision reading requires. */
async function dose(
  active: ReturnType<typeof createAcidSession>,
  attemptId: UUID,
  aliquotsMl: number[],
): Promise<AcidSessionState> {
  let state: AcidSessionState | null = null

  for (const ml of aliquotsMl) {
    for (const [actionType, parameters] of [
      ['add_base', { volumeL: ml / 1000 }],
      ['mix', {}],
      ['wait_for_stable_reading', {}],
      ['measure_ph', {}],
    ] as Array<[string, Record<string, number>]>) {
      const result = await active.apply(attemptId, actionType, parameters)
      if (!result.ok) throw new Error(`${actionType} refused: ${JSON.stringify(result)}`)
      state = result.state
    }
  }

  if (state === null) throw new Error('dose called with an empty aliquot list')
  return state
}

/** A finished run: select_route, calibrate, then two 1.00 mL aliquots, then complete. */
async function completedRun(
  active: ReturnType<typeof createAcidSession>,
  route: 'naoh' | 'calcium-hydroxide' = 'naoh',
): Promise<AcidSessionState> {
  const started = await active.start()
  const selected = await active.apply(started.attemptId, 'select_route', { route })
  if (!selected.ok) throw new Error('select_route refused')

  const calibrated = await active.apply(started.attemptId, 'calibrate_meter')
  if (!calibrated.ok) throw new Error('calibrate_meter refused')

  await dose(active, started.attemptId, [1.0, 1.0])

  const completed = await active.complete(started.attemptId)
  if (!completed.ok) throw new Error(`complete refused: ${JSON.stringify(completed)}`)
  return completed.state
}

/** `fake-indexeddb` keeps the database alive for the whole file, so each test clears it. */
async function resetStore(active: ReturnType<typeof createAcidSession>): Promise<void> {
  for (const summary of await active.list()) {
    await active.remove(summary.attemptId)
  }
}

/** The comparable view of a finished run, as the screen would build it. */
function sideOf(state: AcidSessionState): CompareSide {
  return {
    attemptId: state.attemptId,
    scenarioKey: state.finalReportSnapshot?.scenarioKey ?? 'acid-neutralization',
    releaseId: state.releaseId,
    status: state.status,
    report: state.finalReportSnapshot,
    ledger: state.ledger,
    projection: state.projection,
    invalidReasonCodes: state.domain.invalidReasonCodes,
  }
}

describe('comparability rules', () => {
  it('refuses to compare an attempt with itself', () => {
    // Every other rule passes trivially for one run against itself, so this is checked first:
    // without it the learner would be told two picks are comparable when they are one pick.
    const side = sideOf({ ...fakeCompleted(), attemptId: ATTEMPT_A })
    const verdict = assessComparability(side, side)

    expect(verdict).toEqual({ comparable: false, reason: 'same_attempt' })
  })

  it('refuses an unfinished run, including a stopped one', () => {
    const finished = sideOf(fakeCompleted())
    const inProgress = { ...finished, attemptId: ATTEMPT_B, status: 'in_progress' as const }
    const stopped = { ...finished, attemptId: ATTEMPT_B, status: 'stopped' as const }

    expect(assessComparability(finished, inProgress)).toEqual({
      comparable: false,
      reason: 'incomplete',
    })
    // `stopped` is terminal but has no report, so it is incomplete for comparison purposes.
    expect(assessComparability(finished, stopped)).toEqual({
      comparable: false,
      reason: 'incomplete',
    })
  })

  it('refuses two different experiments', () => {
    const acid = sideOf(fakeCompleted())
    const other = { ...acid, attemptId: ATTEMPT_B, scenarioKey: 'copper-precipitation' }

    expect(assessComparability(acid, other)).toEqual({
      comparable: false,
      reason: 'scenario',
    })
  })

  it('refuses two different releases of the same experiment', () => {
    // §18.5's rule, and the one with the most at stake: a release locks constants and scoring,
    // so a difference between two releases may come entirely from the version. Exact string
    // equality — a semver-aware check would accept `@1.0.0` against `@1.0.0+build`, two
    // different locks.
    const older = sideOf(fakeCompleted())
    const newer = {
      ...older,
      attemptId: ATTEMPT_B,
      releaseId: 'acid-neutralization@1.1.0',
    }

    expect(assessComparability(older, newer)).toEqual({
      comparable: false,
      reason: 'release',
    })

    // Release is checked AFTER scenario, so two different experiments report `scenario`
    // rather than also reporting a release difference.
    const differentBoth = {
      ...older,
      attemptId: ATTEMPT_B,
      scenarioKey: 'copper-precipitation',
      releaseId: 'copper-precipitation@1.0.0',
    }
    expect(assessComparability(older, differentBoth)).toEqual({
      comparable: false,
      reason: 'scenario',
    })
  })

  it('refuses a completed run whose snapshot is missing', () => {
    const finished = sideOf(fakeCompleted())
    const noSnapshot = { ...finished, attemptId: ATTEMPT_B, report: null }

    // §4.2 makes the snapshot mandatory at completion, but an old row could predate it. There
    // is nothing frozen to compare, and saying so beats inventing a score from live state.
    expect(assessComparability(finished, noSnapshot)).toEqual({
      comparable: false,
      reason: 'incomplete',
    })
  })
})

describe('comparison values', () => {
  let active: ReturnType<typeof createAcidSession>

  beforeEach(async () => {
    active = session()
    await resetStore(active)
  })

  it('reads scores from the frozen report, not from live projection', async () => {
    const state = await completedRun(active)
    if (state.finalReportSnapshot === null) throw new Error('completed run has no report')

    const frozen = state.finalReportSnapshot.projection

    // A live projection that genuinely DISAGREES with the snapshot. Built from the engine's
    // INITIAL state — undosed, no route chosen — rather than from the finished run's own state:
    // projecting the same state and ledger reproduces the same score, so that would prove
    // nothing. This is what a recomputation after a state change would yield, and §15.1 says a
    // finished run's result must not move when that happens.
    const divergent = projector.project(
      ACID_RELEASE_ID,
      0,
      engine.createInitialState(),
      createInitialResourceLedger(),
    )
    expect(divergent.overallScore).not.toBe(frozen.overallScore)
    const side: CompareSide = { ...sideOf(state), projection: divergent }
    const other: CompareSide = { ...sideOf(state), attemptId: ATTEMPT_B }

    const { scores } = buildComparison(side, other)
    const overall = scores.find((metric) => metric.key === 'overallScore')

    // Both columns show the FROZEN value. If the live projection had won, side `a` would show
    // the divergent number and the two columns would differ for two runs that are the same run.
    expect(overall?.a).toBe(frozen.overallScore)
    expect(overall?.b).toBe(frozen.overallScore)
  })

  it('keeps a null metric as null rather than as zero', async () => {
    const state = await completedRun(active)

    // A run with no correction acid has no safety penalty, but the indices can still be
    // non-evaluable in principle; the contract is that whatever is null stays null. Asserting
    // on the shape rather than on one field is what makes this hold as the projection grows.
    const side = sideOf(state)
    const { scores, efficiency } = buildComparison(side, { ...side, attemptId: ATTEMPT_B })

    for (const metric of [...scores, ...efficiency]) {
      if (metric.a === null) {
        expect(metric.b).toBeNull()
        // The row is still PRESENT. Dropping it would hide that one side could not be scored,
        // which is itself part of the comparison (§10.2: N/A is not zero, and is not absent).
        expect(metric).toHaveProperty('key')
      }
    }
  })

  it('includes a reagent only one run used', async () => {
    // Two routes dose different reagents, so the union is not the intersection: a correction
    // acid one learner needed and the other did not is the most informative row on the screen,
    // and building rows from one side's keys would silently omit it.
    const plain = await completedRun(active, 'naoh')
    const carbonate = await completedRun(active, 'calcium-hydroxide')

    const { reagents } = buildComparison(sideOf(plain), sideOf(carbonate))
    const keys = reagents.map((metric) => metric.key)

    // Every reagent either run touched appears, plus water.
    const expected = new Set([
      ...Object.keys(plain.ledger.reagents).map((key) => `reagent.${key}`),
      ...Object.keys(carbonate.ledger.reagents).map((key) => `reagent.${key}`),
      'waterLiters',
    ])
    expect(new Set(keys)).toEqual(expected)

    // A reagent absent from one side is null there, not 0 — a run that used none is not a run
    // that used zero of something it could have used.
    for (const metric of reagents) {
      if (metric.key === 'waterLiters') continue
      const name = metric.key.slice('reagent.'.length)
      const inPlain = name in plain.ledger.reagents
      const inCarbonate = name in carbonate.ledger.reagents
      if (!inPlain) expect(metric.a).toBeNull()
      if (!inCarbonate) expect(metric.b).toBeNull()
    }
  })

  it('sorts reagent rows so both columns line up the same way', async () => {
    const plain = await completedRun(active, 'naoh')
    const carbonate = await completedRun(active, 'calcium-hydroxide')

    const first = buildComparison(sideOf(plain), sideOf(carbonate)).reagents
    const swapped = buildComparison(sideOf(carbonate), sideOf(plain)).reagents

    // Same keys in the same order regardless of which run is A and which is B. Without a sort
    // the order would follow whichever ledger was walked first, and the two columns would not
    // line up row for row.
    expect(first.map((m) => m.key)).toEqual(swapped.map((m) => m.key))
  })
})

// ---------------------------------------------------------------------------
// Fixtures for the rule cases, which test decisions rather than chemistry.
//
// These are literals on purpose. `assessComparability` takes `CompareSide`, its declared input,
// and the rules are about the FIELDS — ids, status, scenario key, release id — so a real run
// would add setup without adding coverage. The cases that need real chemistry (frozen report,
// null metrics, reagent union) use completed runs above.
// ---------------------------------------------------------------------------

const ATTEMPT_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID
const ATTEMPT_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' as UUID

function fakeCompleted(): AcidSessionState {
  const projection = projector.project(
    ACID_RELEASE_ID,
    0,
    initialDomainState(),
    neutralLedger(),
  )

  return {
    attemptId: ATTEMPT_A,
    releaseId: ACID_RELEASE_ID,
    revision: 1,
    lastSequence: 1,
    status: 'completed',
    domain: initialDomainState(),
    ledger: neutralLedger(),
    projection,
    finalReportSnapshot: {
      schemaVersion: 1,
      scenarioKey: 'acid-neutralization',
      releaseId: ACID_RELEASE_ID,
      generatedAt: new Date('2026-09-10T09:00:00.000Z'),
      projection,
      goalStatus: {
        evaluable: true,
        goalMet: true,
        primaryCriteria: [],
        efficiencyCriteria: [],
        achievementPercent: 100,
      },
    },
    createdAt: new Date('2026-09-10T08:00:00.000Z'),
    completedAt: new Date('2026-09-10T09:00:00.000Z'),
    storageMode: 'local',
  }
}

/**
 * The engine's own initial state, so the fixture cannot disagree with the release.
 *
 * Built by the module rather than written out here: constructing it by hand would restate
 * every constant the release locks, and a restated constant is one that can drift.
 */
function initialDomainState(): AcidNeutralizationState {
  return engine.createInitialState()
}

/** A ledger for a fresh attempt: neutral values, and no invented zeros. */
function neutralLedger(): ResourceLedger {
  // The domain's factory rather than a literal. `ResourceLedger` grows when a convention is
  // added, and a hand-written fixture would then be missing a field that the real ledger has —
  // the comparison would read null where a run would read a number.
  return createInitialResourceLedger()
}
