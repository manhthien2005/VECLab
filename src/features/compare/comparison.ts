import type { AcidProjection } from '@/application/scenarios/acid-projection.js'
import type { FinalReportSnapshot } from '@/application/simulation/acid-session.js'
import type { ResourceLedger } from '@/domain/process/contracts.js'

/**
 * Comparability rules for §4.8 (docs/web-application-scope.md).
 *
 * Pure, with no React and no fetching, because these rules are the part worth getting right
 * and worth testing: §4.8 says two runs may be compared only when they belong to the signed-in
 * account, are both completed, and share the SAME experiment and the same exact
 * `scenario_release_id` — and that the web must EXPLAIN when they cannot be compared.
 *
 * The release rule is the one with teeth. A release locks constants, scoring conventions and
 * content, so a difference between a `@1.0.0` run and a `@1.1.0` run could come entirely from
 * the version and not at all from what the learner did. Rendering that as a comparison would
 * produce a number that looks like a verdict about their technique. §18.5 is explicit that
 * mixed-release comparison is not allowed; this module is where that is enforced.
 *
 * Everything here is a comparison of the FROZEN report where one exists. §15.1 forbids
 * recomputing a completed run's result, so scores and goal status are read from the snapshot
 * rather than derived from the current projection — a newer engine version must not be able to
 * change what two finished runs achieved.
 */

/** One attempt's comparable data, gathered by the caller from its session state. */
export type CompareSide = {
  attemptId: string
  scenarioKey: string
  releaseId: string
  /** Terminal state; only `completed` is comparable (§4.8). */
  status: 'in_progress' | 'completed' | 'stopped'
  /** The frozen report, or null when the run never completed. */
  report: FinalReportSnapshot | null
  /** Rebuilt by hash-verified replay, so it agrees with the stored events. */
  ledger: ResourceLedger
  /** Live projection, used only when there is no frozen report. */
  projection: AcidProjection
  /** Reason codes the model recorded as invalidating, from the stored state. */
  invalidReasonCodes: readonly string[]
}

/** Why two attempts cannot be compared, in the order the rules are checked. */
export type IncomparableReason = 'same_attempt' | 'incomplete' | 'scenario' | 'release'

export type Comparability =
  | { comparable: true }
  | { comparable: false; reason: IncomparableReason }

/**
 * Decide whether two attempts may be compared.
 *
 * Order matters, and it is ordered so the explanation is the most useful true one:
 *
 *   1. SAME ATTEMPT — picking one run twice is not a comparison at all. Checked first
 *      because every other rule would trivially pass for an attempt against itself, so the
 *      learner would be told "comparable" about something meaningless.
 *   2. INCOMPLETE — before release, because an unfinished run has no frozen report and so no
 *      scores to compare. Reporting a release mismatch here would send the learner looking at
 *      versions when the real problem is that one side never finished.
 *   3. SCENARIO — two different experiments share nothing to compare, not even units.
 *   4. RELEASE — same experiment, different locked version.
 *
 * Ownership is NOT checked here, deliberately: the caller can only ever pass attempts its own
 * session returned, and for cloud that session is bound to a verified learner server-side. A
 * check here would be a second opinion about a fact the store already enforced.
 */
export function assessComparability(a: CompareSide, b: CompareSide): Comparability {
  if (a.attemptId === b.attemptId) return { comparable: false, reason: 'same_attempt' }

  // Both sides must be finished. `stopped` counts as incomplete: it is terminal but has no
  // report, and §4.8 restricts comparison to completed runs because the report is the frozen
  // artifact that makes two results comparable at all.
  if (a.status !== 'completed' || b.status !== 'completed') {
    return { comparable: false, reason: 'incomplete' }
  }

  if (a.scenarioKey !== b.scenarioKey) return { comparable: false, reason: 'scenario' }

  // Exact string equality, not a parse of the version. §4.8 says "cùng exact
  // scenario_release_id", and a semver-aware comparison would accept `@1.0.0` against
  // `@1.0.0+build` — two different locks that could carry different constants.
  if (a.releaseId !== b.releaseId) return { comparable: false, reason: 'release' }

  // A completed attempt without a usable snapshot is possible in principle (§4.2 makes the
  // snapshot mandatory, but an old row could predate it). Treating it as incomplete is the
  // honest answer: there is nothing frozen to compare against.
  if (a.report === null || b.report === null) {
    return { comparable: false, reason: 'incomplete' }
  }

  return { comparable: true }
}

/** A scored quantity as the comparison shows it. Null means "not evaluable", never zero. */
export type CompareMetric = {
  /** Stable key, used for React keys and for the field label lookup. */
  key: string
  a: number | null
  b: number | null
  /**
   * Unit for display, or null when the value is already unitless (a score, an index).
   *
   * Display only. §2.3 keeps canonical units inside the model, and nothing here converts:
   * both sides come from the same release, so they are already in the same unit.
   */
  unit: string | null
  /** Higher is better, so a difference can be labelled as an improvement rather than a change. */
  higherIsBetter: boolean
}

/**
 * The §4.8 comparison rows, from two sides already judged comparable.
 *
 * Reads scores from the FROZEN report, not from the live projection, for the reason stated
 * above. The ledger is the source for reagent amounts: it is rebuilt by replaying the stored
 * event chain with every hash verified, so it agrees with what actually happened rather than
 * with what the current state happens to hold.
 *
 * A metric whose value is null on either side is still returned — with the null intact. §10.2
 * is explicit that "not evaluable" is not zero, and dropping the row would hide the fact that
 * one side could not be scored, which is itself part of the comparison.
 */
export function buildComparison(a: CompareSide, b: CompareSide): {
  scores: readonly CompareMetric[]
  reagents: readonly CompareMetric[]
  steps: readonly CompareMetric[]
  efficiency: readonly CompareMetric[]
} {
  const pa = a.report?.projection ?? a.projection
  const pb = b.report?.projection ?? b.projection

  return {
    scores: [
      metric('overallScore', pa.overallScore, pb.overallScore, null, true),
      metric('phScore', pa.phScore, pb.phScore, null, true),
      metric('resourceScore', pa.resourceScore, pb.resourceScore, null, true),
      metric('processScore', pa.processScore, pb.processScore, null, true),
      metric('achievementPercent', goalPercent(a), goalPercent(b), '%', true),
    ],
    // §4.8's "vật chất và liều lượng": what was actually dosed, from the ledger. The keys are
    // the union of both sides' reagents, because one run may have used a correction acid and
    // the other not — and that difference is the point of the comparison.
    reagents: reagentMetrics(a.ledger, b.ledger),
    steps: [metric('operationCount', pa.operationCount, pb.operationCount, null, false)],
    // "Hiệu suất ... tùy bài": for acid neutralization the efficiency view is the cost and
    // safety indices plus the dose against the route's E*. Lower cost is better, so
    // `higherIsBetter` is false there — getting that backwards would label a wasteful run as
    // the winner.
    efficiency: [
      metric('relativeCostIndex', pa.relativeCostIndex, pb.relativeCostIndex, null, false),
      metric('safetyIndex', pa.safetyIndex, pb.safetyIndex, null, true),
      metric(
        'grossEquivalentsMmolEq',
        pa.grossEquivalentsMmolEq,
        pb.grossEquivalentsMmolEq,
        'mmol eq',
        false,
      ),
      metric(
        'targetEquivalentsMmolEq',
        pa.targetEquivalentsMmolEq,
        pb.targetEquivalentsMmolEq,
        'mmol eq',
        true,
      ),
    ],
  }
}

/**
 * Achievement percent, or null when the goal was not evaluable.
 *
 * §10.2 again: a run whose criteria could not be evaluated has no percentage, and reporting
 * 0 would say it scored nothing rather than that it could not be scored.
 */
function goalPercent(side: CompareSide): number | null {
  const goal = side.report?.goalStatus
  return goal === undefined || !goal.evaluable ? null : goal.achievementPercent
}

function metric(
  key: string,
  a: number | null,
  b: number | null,
  unit: string | null,
  higherIsBetter: boolean,
): CompareMetric {
  return { key, a, b, unit, higherIsBetter }
}

/**
 * Reagent metrics across the union of both ledgers' keys.
 *
 * The union rather than one side's keys, because a reagent present in only one run is the most
 * informative difference on the screen — a correction acid one learner needed and the other
 * did not. Keyed sets keep the order stable and deterministic so the two columns line up the
 * same way on every render.
 */
function reagentMetrics(a: ResourceLedger, b: ResourceLedger): readonly CompareMetric[] {
  const keys = [...new Set([...Object.keys(a.reagents), ...Object.keys(b.reagents)])].sort()

  const rows = keys.map((key) =>
    metric(
      `reagent.${key}`,
      reagentAmount(a, key),
      reagentAmount(b, key),
      // The unit is taken from whichever side has the entry. Both sides are the same release,
      // so a reagent means the same quantity in the same unit on both; asserting that would be
      // a second definition of the release's units.
      a.reagents[key]?.unit ?? b.reagents[key]?.unit ?? null,
      false,
    ),
  )

  // Water is part of "vật chất" too, and is tracked separately from reagents in the ledger.
  const waterUnit = 'L'
  rows.push(metric('waterLiters', a.waterLiters, b.waterLiters, waterUnit, false))

  return rows
}

/** A reagent's amount, or null when that run never used it. */
function reagentAmount(ledger: ResourceLedger, key: string): number | null {
  const entry = ledger.reagents[key]
  return entry === undefined ? null : entry.amount
}
