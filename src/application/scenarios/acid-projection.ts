import type { ResourceLedger } from '@/domain/process/contracts.js'
import type {
  AcidNeutralizationState,
  AcidRoute,
  AcidScenarioConfig,
} from '@/domain/experiments/acid-neutralization/state.js'
import {
  benchmarkScenarioConfig,
} from '@/domain/experiments/acid-neutralization/engine.js'
import {
  resolveTargetEquivalentsByRoute,
} from '@/domain/experiments/acid-neutralization/resources.js'
import {
  evaluateAcidScoreBreakdown,
} from '@/domain/experiments/acid-neutralization/scoring.js'

/**
 * Acid neutralization projection (docs/data-and-state-model.md §6.3, §22 inv. 11).
 *
 * `current_projection` is the single summary the dashboard, lab list, report header
 * and comparison view read, derived from `current_state` by a versioned projector in
 * the same commit. It exists so those surfaces never load a full domain state to
 * show a pH, and so comparing two attempts reads two small rows.
 *
 * A FACTORY bound to a config, exactly like `createAcidNeutralizationModule`. That
 * symmetry is the point: the projector must resolve per-route `E*` from the same
 * frozen config the engine used, or `resourceScore` in a projection could disagree
 * with `resourceScore` in the report for one and the same run. Both go through
 * `resolveTargetEquivalentsByRoute`, so there is one derivation site.
 *
 * `null` means "not evaluable", never 0: a run without a valid final measurement
 * keeps `overallScore: null`, because reporting 0 would claim the learner scored
 * zero on work that has not been scored (§10.1).
 */

/** Versioned with the release; bumping it invalidates stored projections. */
export const ACID_PROJECTION_VERSION = 1

export type AcidProjection = {
  /** Locked release, so projections of different releases stay distinguishable. */
  scenarioReleaseId: string
  sequence: number
  phase: string
  /** Chosen neutralizer, or null before `select_route`. */
  route: AcidRoute | null
  /** Simulated pH*, or null when no valid measurement exists. */
  phStar: number | null
  /** Whether that measurement still describes the current composition. */
  measurementCurrent: boolean
  modelValid: boolean
  /** Whether pH* sits inside the internal target band. */
  goalMet: boolean
  overallScore: number | null
  phScore: number
  resourceScore: number | null
  processScore: number
  /** Base actually dosed, mmol eq — the Egross denominator of the resource score. */
  grossEquivalentsMmolEq: number | null
  /** Per-route E* used as the resource-score numerator. */
  targetEquivalentsMmolEq: number | null
  baseVolumeMl: number
  correctionAcidVolumeMl: number
  totalVolumeMl: number
  operationCount: number
  /** Relative cost index and safety index, or null when not yet evaluable. */
  relativeCostIndex: number | null
  safetyIndex: number | null
  safetyPenaltyCodes: string[]
  /** Invalid-model reasons, so the UI can explain a blocked run. */
  invalidReasonCodes: string[]
}

export type AcidProjector = {
  /** Projector version, taken from the manifest so a store can persist it. */
  readonly version: number
  /**
   * Project a state+ledger pair.
   *
   * One entry point, because one is all the stored shape admits: `current_state` is
   * the bare domain state and the ledger is rebuilt by replay, so a projection is
   * always built from that pair in the same commit (§22 invariant 11). There is no
   * stored envelope to project from.
   */
  project(
    scenarioReleaseId: string,
    sequence: number,
    state: AcidNeutralizationState,
    ledger: ResourceLedger,
  ): AcidProjection
}

/**
 * Build the projector for a frozen run configuration.
 *
 * `E*` is resolved once here, not per projection: deriving it re-runs a nested
 * solver, and a projection is rebuilt on every commit and on every list read.
 */
export function createAcidProjector(
  config: AcidScenarioConfig = benchmarkScenarioConfig(),
): AcidProjector {
  const targetEquivalentsByRoute = resolveTargetEquivalentsByRoute(config)

  function project(
    scenarioReleaseId: string,
    sequence: number,
    state: AcidNeutralizationState,
    ledger: ResourceLedger,
  ): AcidProjection {
    const route = state.route
    // No route means nothing was dosed, so there is no target dose to score
    // against. null keeps the resource score N/A rather than awarding or denying
    // it by default — the same branch the engine takes in evaluateGoalStatus.
    const targetEquivalentsMmolEq =
      route === null ? null : targetEquivalentsByRoute[route]

    const breakdown = evaluateAcidScoreBreakdown(
      state,
      targetEquivalentsMmolEq,
      config.constants.targetPH,
    )

    const measuredPH = state.lastMeasuredPH
    const measurementCurrent =
      measuredPH !== null &&
      state.lastMeasuredCompositionRevision === state.compositionRevision

    return {
      scenarioReleaseId,
      sequence,
      phase: state.phase,
      route,
      phStar: measuredPH,
      measurementCurrent,
      modelValid: state.modelValid,
      // Goal attainment needs a valid measurement of the CURRENT composition. A
      // stale reading cannot satisfy the target, however close it looks, and
      // correction acid invalidates earlier readings (spec §5).
      goalMet: breakdown.success && measurementCurrent,
      overallScore: breakdown.overallScore,
      phScore: breakdown.phScore,
      resourceScore: breakdown.resourceScore,
      processScore: breakdown.processScore,
      grossEquivalentsMmolEq: breakdown.grossEquivalentsMmolEq,
      targetEquivalentsMmolEq: breakdown.targetEquivalentsMmolEq,
      baseVolumeMl: state.baseVolumeL * 1000,
      correctionAcidVolumeMl: state.correctionAcidVolumeL * 1000,
      totalVolumeMl: state.totalVolumeL * 1000,
      operationCount: ledger.operationCount,
      relativeCostIndex: ledger.relativeCostIndex,
      safetyIndex: ledger.safetyIndex,
      safetyPenaltyCodes: ledger.safetyPenalties.map((penalty) => penalty.code),
      invalidReasonCodes: [...state.invalidReasonCodes],
    }
  }

  return {
    version: ACID_PROJECTION_VERSION,
    project,
  }
}

/**
 * Narrow a stored projection back to `AcidProjection`.
 *
 * Needed when reading `attempts.current_projection` from either store: the column
 * is `jsonb`, so the value arrives untyped, and a projection written by an older
 * projector version must be rejected rather than rendered with fields missing.
 */
export function isAcidProjection(value: unknown): value is AcidProjection {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>

  return (
    typeof candidate.scenarioReleaseId === 'string' &&
    typeof candidate.sequence === 'number' &&
    typeof candidate.phase === 'string' &&
    (candidate.route === null || typeof candidate.route === 'string') &&
    (candidate.phStar === null || typeof candidate.phStar === 'number') &&
    typeof candidate.measurementCurrent === 'boolean' &&
    typeof candidate.modelValid === 'boolean' &&
    typeof candidate.goalMet === 'boolean' &&
    (candidate.overallScore === null || typeof candidate.overallScore === 'number') &&
    typeof candidate.phScore === 'number' &&
    (candidate.resourceScore === null || typeof candidate.resourceScore === 'number') &&
    typeof candidate.processScore === 'number' &&
    typeof candidate.baseVolumeMl === 'number' &&
    typeof candidate.correctionAcidVolumeMl === 'number' &&
    typeof candidate.totalVolumeMl === 'number' &&
    typeof candidate.operationCount === 'number' &&
    (candidate.relativeCostIndex === null ||
      typeof candidate.relativeCostIndex === 'number') &&
    (candidate.safetyIndex === null || typeof candidate.safetyIndex === 'number') &&
    Array.isArray(candidate.safetyPenaltyCodes) &&
    Array.isArray(candidate.invalidReasonCodes)
  )
}
