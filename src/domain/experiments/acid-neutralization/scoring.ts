import type { CriterionResult, GoalStatus, ResourceLedger } from '@/domain/process/contracts.js'
import {
  TARGET_TOLERANCE_PH,
  BENCHMARK_TARGET_PH,
  SCORE_WEIGHTS,
} from './constants.js'
import type { AcidNeutralizationState } from './state.js'
import { computeEgrossMmolEq, computeCorrectionEquivalentsMmolEq } from './resources.js'

/**
 * Acid neutralization scoring (spec §14).
 *
 * Scoring is a versioned pedagogical decision, not a scientific constant and
 * not a probability (§14.6). `success` is a hard goal status evaluated
 * independently of the score: a high score never turns an out-of-target run
 * into a success (§14.5). Component scores are always exposed so the rubric
 * stays public.
 *
 * Weights: pH 60, resource 20, process 20, total 100 (§14.2–§14.4).
 */

export type AcidScoreBreakdown = {
  /** pH component, 0..60. */
  phScore: number
  /** Resource component, 0..20, or null when not evaluable (§14.3). */
  resourceScore: number | null
  /** Process component, 0..20. */
  processScore: number
  /** round(SpH + Sresource + Sprocess); null when not evaluable. */
  overallScore: number | null
  evaluable: boolean
  success: boolean
  /** Per-criterion detail behind processScore (§14.4). */
  processCriteria: CriterionResult[]
  /** E* and Egross in mmol eq, exposed for the report and for tests. */
  targetEquivalentsMmolEq: number | null
  grossEquivalentsMmolEq: number | null
}

/**
 * Sentinel for a criterion whose target is not evaluable.
 *
 * `CriterionResult.target` is typed `number | string` by the frozen Process
 * Core contract (docs/system-architecture.md §5.2), so N/A cannot be null. A
 * string is used deliberately: `0` would read as "the target was zero", which
 * for a dose criterion means "no reagent needed" — a real claim, and a wrong
 * one (data model §10.1 forbids 0 in place of N/A).
 */
export const NOT_EVALUABLE_TARGET = 'N/A'

/**
 * §14.1 — success is a conjunction of hard conditions. Notably it does NOT
 * consult the score, so a run can score well and still not be a success.
 */
export function evaluateSuccess(
  state: AcidNeutralizationState,
  targetPH: number = BENCHMARK_TARGET_PH,
): boolean {
  if (!state.modelValid) return false
  if (!state.meterCalibrated) return false
  if (!state.readingStable) return false
  if (state.lastMeasuredPH === null) return false
  if (
    state.lastMeasuredCompositionRevision === null ||
    state.lastMeasuredCompositionRevision !== state.compositionRevision
  ) {
    return false
  }
  return Math.abs(state.lastMeasuredPH - targetPH) <= TARGET_TOLERANCE_PH
}

/** §14.2 — SpH = 60 × clamp(1 - |pH* - target| / 0.50, 0, 1). */
export function computePhScore(
  simulatedPH: number | null,
  targetPH: number = BENCHMARK_TARGET_PH,
): number | null {
  if (simulatedPH === null || !Number.isFinite(simulatedPH)) return null
  // §14.2: the linear term is clamped to [0, 1], so a run more than 0.50 pH
  // units off target scores 0 rather than going negative.
  const attainment = 1 - Math.abs(simulatedPH - targetPH) / SCORE_WEIGHTS.phScoreBandwidth
  return SCORE_WEIGHTS.ph * Math.max(0, Math.min(1, attainment))
}

/**
 * §14.3 — Sresource = 20 × min(1, E* / Egross).
 *
 * Evaluable only when the final measurement is valid AND Egross > 0; otherwise
 * the score is N/A and the run is not evaluable. `null` is returned rather than
 * 0, because reporting 0 would claim the learner wasted every reagent.
 *
 * `targetEquivalentsMmolEq` is the route-specific `E*` for THIS run, resolved
 * by inverting the model (resources.resolveTargetEquivalentsMmolEq). It is a
 * parameter rather than a benchmark lookup because exploration targets need a
 * different `E*` per route (§3.5); passing null means the target was
 * unreachable, which is N/A rather than a zero score.
 */
export function computeResourceScore(
  state: AcidNeutralizationState,
  targetEquivalentsMmolEq: number | null,
): {
  score: number | null
  targetEquivalentsMmolEq: number | null
  grossEquivalentsMmolEq: number
} {
  const grossEquivalentsMmolEq = computeEgrossMmolEq(state)

  const finalMeasurementValid =
    state.modelValid &&
    state.lastMeasuredPH !== null &&
    state.lastMeasuredCompositionRevision === state.compositionRevision

  if (
    targetEquivalentsMmolEq === null ||
    !finalMeasurementValid ||
    !(grossEquivalentsMmolEq > 0)
  ) {
    return { score: null, targetEquivalentsMmolEq, grossEquivalentsMmolEq }
  }

  return {
    score: SCORE_WEIGHTS.resource * Math.min(1, targetEquivalentsMmolEq / grossEquivalentsMmolEq),
    targetEquivalentsMmolEq,
    grossEquivalentsMmolEq,
  }
}

/**
 * §14.4 criterion 2 — "every reading used for a decision came after mix/stable".
 *
 * The engine already rejects `measure_ph` unless the sample is mixed and the
 * reading is stable (spec §5), so state built by the engine satisfies this by
 * construction. The check below is therefore aimed at the other way state can
 * arrive: a guest import replayed from IndexedDB, or a restored snapshot. There
 * the measurement log is data, not a guarantee, and a tampered or truncated log
 * must not silently earn the 5 points.
 *
 * What is verified from the log itself: sequences strictly increase, each
 * measurement is tied to a real composition revision, and the measurement that
 * drives the completion decision still describes the current composition.
 */
function evaluateProcedureCompliance(state: AcidNeutralizationState): CriterionResult {
  const measurements = state.measurements

  if (measurements.length === 0) {
    return {
      key: 'process.measurement-procedure',
      evaluable: false,
      met: false,
      actual: null,
      target: 'every decision reading follows mix and stable',
      unit: null,
    }
  }

  let monotonic = true
  let revisionsBound = true
  for (let index = 0; index < measurements.length; index += 1) {
    const current = measurements[index]
    // Indexed access is possibly undefined under noUncheckedIndexedAccess; a
    // gap in the log is itself a compliance failure, not something to skip.
    if (current === undefined || current.compositionRevision < 1) {
      revisionsBound = false
      continue
    }
    if (index > 0) {
      const previous = measurements[index - 1]
      if (previous === undefined || current.sequence <= previous.sequence) monotonic = false
    }
  }

  const decisionReadingFresh =
    state.lastMeasuredCompositionRevision !== null &&
    state.lastMeasuredCompositionRevision === state.compositionRevision

  const compliant = monotonic && revisionsBound && decisionReadingFresh

  return {
    key: 'process.measurement-procedure',
    evaluable: true,
    met: compliant,
    actual: compliant ? 'compliant' : 'non-compliant',
    target: 'every decision reading follows mix and stable',
    unit: null,
  }
}

/** Last base aliquot in mL, or null when no base was ever added. */
export function finalBaseAliquotMl(state: AcidNeutralizationState): number | null {
  for (let index = state.aliquotHistory.length - 1; index >= 0; index -= 1) {
    const record = state.aliquotHistory[index]
    // Only base additions count: a trailing HCl correction must not be scored
    // as the "final base aliquot" (§14.4 wording is explicit about base).
    if (record && record.reagent === 'base') return record.volumeL * 1000
  }
  return null
}

/**
 * §14.4 — four independent 5-point criteria:
 *   meter calibrated
 *   every decision reading followed mix/stable
 *   final base aliquot ≤ 0.50 mL
 *   no HCl correction used
 */
export function computeProcessCriteria(state: AcidNeutralizationState): CriterionResult[] {
  const calibrated: CriterionResult = {
    key: 'process.meter-calibrated',
    evaluable: true,
    met: state.meterCalibrated,
    actual: state.meterCalibrated ? 'calibrated' : 'not-calibrated',
    target: 'calibrated',
    unit: null,
  }

  const procedure = evaluateProcedureCompliance(state)

  const lastAliquotMl = finalBaseAliquotMl(state)
  const fineAliquot: CriterionResult = {
    key: 'process.final-aliquot-fine',
    // No base added at all: nothing to judge, so the criterion is not evaluable
    // rather than being awarded or denied by default.
    evaluable: lastAliquotMl !== null,
    met: lastAliquotMl !== null && lastAliquotMl <= SCORE_WEIGHTS.finalAliquotMaxMl,
    actual: lastAliquotMl,
    target: SCORE_WEIGHTS.finalAliquotMaxMl,
    unit: 'mL',
  }

  const correctionMmolEq = computeCorrectionEquivalentsMmolEq(state)
  const noCorrection: CriterionResult = {
    key: 'process.no-correction-acid',
    evaluable: true,
    met: correctionMmolEq === 0,
    actual: correctionMmolEq,
    target: 0,
    unit: 'mmol eq',
  }

  return [calibrated, procedure, fineAliquot, noCorrection]
}

/**
 * Sums the four §14.4 criteria at 5 points each. Non-evaluable criteria award
 * nothing, which is why an incomplete run cannot reach 20 by omission.
 */
export function computeProcessScore(criteria: CriterionResult[]): number {
  const pointsPerCriterion = SCORE_WEIGHTS.process / 4
  return criteria.reduce(
    (sum, criterion) => (criterion.evaluable && criterion.met ? sum + pointsPerCriterion : sum),
    0,
  )
}

export function computeOverallScore(breakdown: {
  phScore: number | null
  resourceScore: number | null
  processScore: number
}): number | null {
  if (breakdown.phScore === null || breakdown.resourceScore === null) return null
  return Math.round(breakdown.phScore + breakdown.resourceScore + breakdown.processScore)
}

export function evaluateAcidScoreBreakdown(
  state: AcidNeutralizationState,
  targetEquivalentsMmolEq: number | null,
  targetPH: number = BENCHMARK_TARGET_PH,
): AcidScoreBreakdown {
  const phScore = computePhScore(state.lastMeasuredPH, targetPH)
  const resource = computeResourceScore(state, targetEquivalentsMmolEq)
  const processCriteria = computeProcessCriteria(state)
  const processScore = computeProcessScore(processCriteria)
  const overallScore = computeOverallScore({
    phScore,
    resourceScore: resource.score,
    processScore,
  })

  return {
    // A non-evaluable pH score means no valid final measurement, so the run
    // scores nothing; overallScore stays null to keep N/A distinct from 0.
    phScore: phScore ?? 0,
    resourceScore: resource.score,
    processScore,
    overallScore,
    evaluable: overallScore !== null,
    success: evaluateSuccess(state, targetPH),
    processCriteria,
    targetEquivalentsMmolEq: resource.targetEquivalentsMmolEq,
    grossEquivalentsMmolEq: resource.grossEquivalentsMmolEq,
  }
}

/**
 * GoalStatus projection required by the Process Core contract
 * (docs/data-and-state-model.md §10.2).
 *
 * `achievementPercent` is the level of goal attainment expressed on a 0–100
 * scale, which for this scenario is exactly `Soverall`. It is not a probability
 * of real-world success and must never be labelled as one (§14.6, acceptance
 * §5.5). `resources` supplies the convention-versioned cost index used as an
 * efficiency criterion, so this is NOT mere contract symmetry — dropping it
 * would silently remove the cost criterion from the report.
 */
export function evaluateAcidGoalStatus(
  state: AcidNeutralizationState,
  resources: ResourceLedger,
  targetEquivalentsMmolEq: number | null,
  targetPH: number = BENCHMARK_TARGET_PH,
): GoalStatus {
  const breakdown = evaluateAcidScoreBreakdown(state, targetEquivalentsMmolEq, targetPH)

  const measuredPH = state.lastMeasuredPH
  const primaryCriteria: CriterionResult[] = [
    {
      key: 'primary.ph-within-target-band',
      evaluable: measuredPH !== null && state.modelValid,
      met: evaluateSuccess(state, targetPH),
      actual: measuredPH,
      target: targetPH,
      unit: 'pH*',
    },
    {
      key: 'primary.model-valid',
      evaluable: true,
      met: state.modelValid,
      actual: state.modelValid ? 'valid' : 'invalid',
      target: 'valid',
      unit: null,
    },
    {
      key: 'primary.measurement-current',
      evaluable: measuredPH !== null,
      met:
        state.lastMeasuredCompositionRevision !== null &&
        state.lastMeasuredCompositionRevision === state.compositionRevision,
      actual: state.lastMeasuredCompositionRevision,
      target: state.compositionRevision,
      unit: 'compositionRevision',
    },
  ]

  // Efficiency criteria are the resource and process rubric: what the learner
  // spent and how carefully they worked, not whether the goal was met.
  const efficiencyCriteria: CriterionResult[] = [
    {
      key: 'efficiency.reagent-equivalents',
      evaluable: breakdown.resourceScore !== null && breakdown.targetEquivalentsMmolEq !== null,
      met: breakdown.resourceScore !== null && breakdown.resourceScore >= SCORE_WEIGHTS.resource,
      actual: breakdown.grossEquivalentsMmolEq,
      // null stays null: an unreachable E* is N/A, and reporting 0 here would
      // claim the target dose was zero (data model §10.1).
      target: breakdown.targetEquivalentsMmolEq ?? NOT_EVALUABLE_TARGET,
      unit: 'mmol eq',
    },
    {
      key: 'efficiency.relative-cost-index',
      evaluable: resources.relativeCostIndex !== null,
      met: resources.relativeCostIndex !== null && resources.relativeCostIndex <= 1,
      actual: resources.relativeCostIndex,
      target: 1,
      unit: 'index',
    },
    ...breakdown.processCriteria,
  ]

  return {
    evaluable: breakdown.evaluable,
    goalMet: breakdown.success,
    primaryCriteria,
    efficiencyCriteria,
    // 0 only when the run is genuinely evaluable and scored zero. When it is
    // not evaluable, GoalStatus.evaluable is false and this value must not be
    // read as "0% achieved" (data model §10.1: no 0 in place of N/A).
    achievementPercent: breakdown.overallScore ?? 0,
  }
}
