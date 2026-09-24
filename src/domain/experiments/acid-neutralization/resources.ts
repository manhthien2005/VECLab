import type { ResourceLedger, SafetyPenalty } from '@/domain/process/contracts.js'
import { createInitialResourceLedger as createGenericLedger } from '@/domain/process/ledger.js'
import {
  MOLAR_MASS_G_PER_MOL,
  COST_CONVENTION_VERSION,
  SAFETY_CONVENTION_VERSION,
  COST_COEFFICIENTS_PER_MMOL,
  SAFETY_PENALTY_POINTS,
  EXCESS_BASE_RATIO_LIMIT,
  SAFETY_PH_BAND,
  BASE_MOLAR_CONC_MOL_L,
  EQUIVALENTS_PER_MOLE,
  CORRECTION_HCL_CONC_MOL_L,
  MMOL_PER_MOL,
} from './constants.js'
import { solutionConfigFrom, solveVolumeForTargetPh } from './equilibrium.js'
import {
  ACID_ROUTES,
  type AcidNeutralizationState,
  type AcidRoute,
  type AcidScenarioConfig,
} from './state.js'

/**
 * Resource accounting for acid neutralization (spec §13.3–§13.5).
 *
 * This module owns the pedagogical conventions: cost index and safety index.
 * The engine owns the chemistry facts (reagent mmol, operation counts, which
 * penalties were committed); this module turns facts into rubric numbers.
 *
 * Neither index is a measurement. `relativeCostIndex` is not currency and not a
 * quotation; `safetyIndex` is not a risk assessment. Both are versioned
 * conventions, comparable only within one scenario release, and both are N/A
 * (null) rather than 0 when the run is not evaluable — substituting 0 would
 * report "free" or "maximally safe" for a run the model could not evaluate.
 */

/** Reagent amounts in mmol, the unit the cost coefficients are defined per. */
export type AcidReagentMmol = {
  naoh: number
  calciumHydroxide: number
  sodiumCarbonate: number
  correctionHcl: number
}

/**
 * Reagent mmol actually delivered, split by what was added rather than by the
 * route in effect. A correction addition delivers HCl while the route still
 * reads `naoh`; charging it to the base would corrupt the cost index, so
 * `AliquotRecord.reagent` is the discriminator here.
 */
export function computeReagentMmol(state: AcidNeutralizationState): AcidReagentMmol {
  const result: AcidReagentMmol = {
    naoh: 0,
    calciumHydroxide: 0,
    sodiumCarbonate: 0,
    correctionHcl: 0,
  }

  for (const aliquot of state.aliquotHistory) {
    const volumeMl = aliquot.volumeL * 1000
    if (aliquot.reagent === 'correction-acid') {
      result.correctionHcl += volumeMl * CORRECTION_HCL_CONC_MOL_L
      continue
    }
    const concMolL = BASE_MOLAR_CONC_MOL_L[aliquot.route]
    switch (aliquot.route) {
      case 'naoh':
        result.naoh += volumeMl * concMolL
        break
      case 'calcium-hydroxide':
        result.calciumHydroxide += volumeMl * concMolL
        break
      case 'sodium-carbonate':
        result.sodiumCarbonate += volumeMl * concMolL
        break
    }
  }

  return result
}

/** Solute mass in grams (spec §13.3). Reported, never used for scoring. */
export function computeReagentMassG(mmol: AcidReagentMmol): Record<string, number> {
  const mol = {
    naoh: mmol.naoh / MMOL_PER_MOL,
    calciumHydroxide: mmol.calciumHydroxide / MMOL_PER_MOL,
    sodiumCarbonate: mmol.sodiumCarbonate / MMOL_PER_MOL,
    correctionHcl: mmol.correctionHcl / MMOL_PER_MOL,
  }
  return {
    naoh: mol.naoh * MOLAR_MASS_G_PER_MOL.naoh,
    calciumHydroxide: mol.calciumHydroxide * MOLAR_MASS_G_PER_MOL.calciumHydroxide,
    sodiumCarbonate: mol.sodiumCarbonate * MOLAR_MASS_G_PER_MOL.sodiumCarbonate,
    correctionHcl: mol.correctionHcl * MOLAR_MASS_G_PER_MOL.hcl,
  }
}

/**
 * Total base equivalents delivered, in mmol eq (spec §14.3).
 *
 * Equivalents, not reagent mmol: Ca(OH)₂ and Na₂CO₃ each deliver two per mole.
 * The cost index uses reagent mmol instead, and conflating the two is the
 * single easiest way to get 1.300 where the spec requires 0.650 for
 * stoichiometric Ca(OH)₂.
 */
export function computeBaseEquivalentsMmolEq(state: AcidNeutralizationState): number {
  const mmol = computeReagentMmol(state)
  return (
    mmol.naoh * EQUIVALENTS_PER_MOLE.naoh +
    mmol.calciumHydroxide * EQUIVALENTS_PER_MOLE['calcium-hydroxide'] +
    mmol.sodiumCarbonate * EQUIVALENTS_PER_MOLE['sodium-carbonate']
  )
}

/** Correction acid equivalents in mmol eq (monobasic HCl). */
export function computeCorrectionEquivalentsMmolEq(state: AcidNeutralizationState): number {
  return computeReagentMmol(state).correctionHcl
}

/**
 * `Egross` — total base equivalents plus correction equivalents (§14.3).
 * Counts the correction because pouring acid to undo an overshoot consumed
 * reagent too; excluding it would reward overshooting.
 */
export function computeEgrossMmolEq(state: AcidNeutralizationState): number {
  return (
    computeBaseEquivalentsMmolEq(state) + computeCorrectionEquivalentsMmolEq(state)
  )
}

/**
 * Route-specific `E*` for a run, derived by inverting the model (§14.3, §3.5).
 *
 * The benchmark table in spec §14.3 is the output of this inversion at target
 * 6.995 with the benchmark sample, not an input to it. Deriving rather than
 * looking up keeps exploration runs correct: an exploration target of 7.2 has a
 * different `E*` per route, and scoring such a run against benchmark numbers
 * would systematically over- or under-penalize reagent use.
 *
 * Returns null when the target is unreachable within the route's permitted
 * volume. Callers must render that as N/A; 0 would report a free run.
 */
export function resolveTargetEquivalentsMmolEq(
  config: AcidScenarioConfig,
  route: AcidRoute,
): number | null {
  const outcome = solveVolumeForTargetPh(
    solutionConfigFrom(config),
    route,
    config.constants.targetPH,
    config.maxBaseVolumeLByRoute[route],
  )
  return outcome.ok ? outcome.baseEquivalentsMmolEq : null
}

/**
 * Per-route `E*` map for a frozen configuration.
 *
 * The engine needs this to score an action and the projector needs it to summarize
 * an attempt; both must agree, because a projection whose `resourceScore` was
 * derived from a different `E*` than the report's would show two scores for one
 * run. Building the map here makes that impossible — there is one derivation site.
 *
 * Resolved eagerly for every route: the map is built once per module or projection
 * factory over a frozen config, and deriving `E*` re-runs a nested solver, so a
 * lazy lookup would re-solve inside every render path that touched it.
 */
export function resolveTargetEquivalentsByRoute(
  config: AcidScenarioConfig,
): Record<AcidRoute, number | null> {
  const byRoute: Record<AcidRoute, number | null> = {
    naoh: null,
    'calcium-hydroxide': null,
    'sodium-carbonate': null,
  }

  for (const route of ACID_ROUTES) {
    byRoute[route] = resolveTargetEquivalentsMmolEq(config, route)
  }

  return byRoute
}

/**
 * Initial HCl in the sample, in mmol — the cost index denominator (§13.4).
 *
 * Derived from the frozen configuration rather than passed in as a bare number,
 * so the engine and whoever builds the final ledger compute the SAME
 * denominator. Two independent copies of `volume × concentration × 1000` is how
 * a release ends up reporting a cost index against a sample it was not run on.
 */
export function initialHclMmolFor(config: AcidScenarioConfig): number {
  return (
    config.constants.acidVolumeL * config.constants.acidConcentrationMolL * MMOL_PER_MOL
  )
}

/**
 * Pedagogical cost index, convention `pedagogical-cost-1.0.0` (§13.4).
 *
 *   rawCost = nNaOH*1.00 + nCaOH2*1.30 + nNa2CO3*1.00 + nCorrectionHCl*1.00
 *   relativeCostIndex = rawCost / initialHClMmol
 *
 * Verified against spec §5.5 acceptance values: stoichiometric NaOH 1.000,
 * stoichiometric Ca(OH)₂ 0.650, Na₂CO₃ at E* ≈ 0.84396, AN-G08 1.200.
 * Returns null when the denominator is unavailable, never 0.
 */
export function computeRelativeCostIndex(
  state: AcidNeutralizationState,
  initialHclMmol: number,
): number | null {
  if (!(initialHclMmol > 0)) return null

  const mmol = computeReagentMmol(state)
  const rawCost =
    mmol.naoh * COST_COEFFICIENTS_PER_MMOL.naoh +
    mmol.calciumHydroxide * COST_COEFFICIENTS_PER_MMOL.calciumHydroxide +
    mmol.sodiumCarbonate * COST_COEFFICIENTS_PER_MMOL.sodiumCarbonate +
    mmol.correctionHcl * COST_COEFFICIENTS_PER_MMOL.correctionHcl

  return rawCost / initialHclMmol
}

export type SafetyPenaltyEvaluation = {
  penalties: SafetyPenalty[]
  safetyIndex: number | null
}

/**
 * Pedagogical safety index, convention `pedagogical-safety-1.0.0` (§13.5).
 *
 *   safetyIndex = clamp(100 - sum(committedPenaltyPoints), 0, 100)
 *
 * Model-invalid runs yield null (N/A), never 0. Hazard profiles for HCl, NaOH,
 * Ca(OH)₂ and Na₂CO₃ are shown separately and are never suppressed by this
 * index — a high index does not mean a reagent is harmless.
 *
 * The excess-base test is strict (`>`). AN-G08 delivers exactly 0.275 mmol eq
 * against 1.1 × E* = 1.1 × 0.2500 = 0.275, and the spec expects safety 85 —
 * i.e. NO excess penalty. Using `>=` would fire the 20-point penalty and report
 * 65, contradicting the acceptance value. The run sits on the boundary by
 * design, so the comparison operator is load-bearing.
 */
export function computeSafetyPenalties(
  state: AcidNeutralizationState,
  options: {
    /** Benchmark target, or solver-derived E* for an exploration target. */
    targetEquivalentsMmolEq: number
    /** Sequence at which each penalty was committed. */
    sequence: number
    /** True only when the model produced a valid result for the final state. */
    modelEvaluable: boolean
  },
): SafetyPenaltyEvaluation {
  if (!options.modelEvaluable) {
    return { penalties: [], safetyIndex: null }
  }

  const penalties: SafetyPenalty[] = []

  const baseEquivalentsMmolEq = computeBaseEquivalentsMmolEq(state)
  const excessThresholdMmolEq = EXCESS_BASE_RATIO_LIMIT * options.targetEquivalentsMmolEq
  // Strict inequality: see the AN-G08 boundary note above.
  if (baseEquivalentsMmolEq > excessThresholdMmolEq) {
    penalties.push({
      code: 'EXCESS_BASE_OVER_110_PERCENT_TARGET',
      points: SAFETY_PENALTY_POINTS.EXCESS_BASE_OVER_110_PERCENT_TARGET,
      committedAtSequence: options.sequence,
      descriptionKey: 'penalties.EXCESS_BASE_OVER_110_PERCENT_TARGET',
    })
  }

  if (computeCorrectionEquivalentsMmolEq(state) > 0) {
    penalties.push({
      code: 'CORRECTION_ACID_USED',
      points: SAFETY_PENALTY_POINTS.CORRECTION_ACID_USED,
      committedAtSequence: options.sequence,
      descriptionKey: 'penalties.CORRECTION_ACID_USED',
    })
  }

  const finalPH = state.lastMeasuredPH
  if (finalPH !== null && (finalPH < SAFETY_PH_BAND.low || finalPH > SAFETY_PH_BAND.high)) {
    penalties.push({
      code: 'FINAL_PH_OUTSIDE_6_TO_8',
      points: SAFETY_PENALTY_POINTS.FINAL_PH_OUTSIDE_6_TO_8,
      committedAtSequence: options.sequence,
      descriptionKey: 'penalties.FINAL_PH_OUTSIDE_6_TO_8',
    })
  }

  const totalPenaltyPoints = penalties.reduce((sum, penalty) => sum + penalty.points, 0)
  const safetyIndex = Math.max(0, Math.min(100, 100 - totalPenaltyPoints))

  return { penalties, safetyIndex }
}

export function computeSafetyIndex(penalties: SafetyPenalty[]): number | null {
  const total = penalties.reduce((sum, penalty) => sum + penalty.points, 0)
  return Math.max(0, Math.min(100, 100 - total))
}

/**
 * Fresh ledger for an acid attempt.
 *
 * Delegates to the Process Core's generic accumulation (§10.1) and only binds
 * this release's convention versions, which are the scenario-specific part.
 * Accumulation itself lives in the core so the Process Core never imports a
 * scenario module.
 */
export function createInitialResourceLedger(): ResourceLedger {
  return createGenericLedger(COST_CONVENTION_VERSION, SAFETY_CONVENTION_VERSION)
}

/**
 * Build the ledger for a completed attempt, where both indices become evaluable.
 *
 * Called once at completion, not per action: the cost index depends on totals and
 * the safety index on the final measurement, so neither is meaningful mid-run.
 *
 * PENALTIES ARE NOT COMPUTED HERE. The engine commits them in the `complete`
 * action's `resourceDelta`, which `applyResourceDelta` stamps with the committing
 * sequence and folds into the ledger. That has to be the owner, because the ledger
 * must be reproducible by REPLAYING the event chain — penalties held only in a
 * derived final ledger would vanish on resume and on guest import. Recomputing and
 * appending them here counted every penalty twice, which halved the safety index
 * (AN-G08 returned 40 instead of the locked 85).
 *
 * What this function adds is the two INDICES, which no delta carries:
 * `noOperationDelta` leaves `relativeCostIndexDelta` null, so the cost index stays
 * unevaluated until completion.
 */
export function buildFinalResourceLedger(
  ledger: ResourceLedger,
  state: AcidNeutralizationState,
  options: {
    initialHclMmol: number
    /**
     * Whether the run produced a result the indices can describe. The caller decides
     * this, because it is what knows whether the route's E* resolved: an unreachable
     * target leaves the safety rubric with nothing to score against.
     *
     * When false both indices read N/A even though penalties are empty — an empty
     * list would otherwise compute to 100 and report a model-invalid run as
     * maximally safe (§13.5, data model §10.1).
     */
    modelEvaluable: boolean
  },
): ResourceLedger {
  const safetyPenalties = ledger.safetyPenalties

  return {
    ...ledger,
    // Cost depends only on reagents actually consumed, which is known even when the
    // final model did not converge, so it is not gated on `modelEvaluable`.
    // `computeRelativeCostIndex` returns null on its own when the denominator is
    // unavailable.
    relativeCostIndex: computeRelativeCostIndex(state, options.initialHclMmol),
    costConventionVersion: COST_CONVENTION_VERSION,
    // Safety IS gated: with an unevaluable model the penalty rubric has nothing to
    // score against, and an empty list would compute to 100 — reporting a
    // model-invalid run as maximally safe (§13.5).
    safetyIndex: options.modelEvaluable ? computeSafetyIndex(safetyPenalties) : null,
    safetyConventionVersion: SAFETY_CONVENTION_VERSION,
    safetyPenalties,
  }
}
