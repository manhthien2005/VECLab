import { TOLERANCES } from './constants.js'
import type { AcidEquilibriumResult, AcidNeutralizationState } from './state.js'

/**
 * Post-solve invariants (spec §16).
 *
 * These are numeric self-checks on an equilibrium result. They exist because a
 * converged solver can still be wrong: a sign error in the charge balance
 * converges happily to a meaningless root. Running the invariants is what turns
 * "the solver returned a number" into "the number describes the model".
 *
 * A violated invariant sets `modelValid = false` and records a stable reason
 * code in state, which is what makes `complete` refuse the run (§5) and what
 * forces the cost/safety indices to N/A rather than 0 (§13.5, data model
 * §10.1). Violations are never silently repaired.
 */

/** Stable reason codes recorded in `invalidReasonCodes` (spec §12 style). */
export const INVALID_REASON_CODES = {
  NON_FINITE_PH: 'NON_FINITE_PH',
  PH_OUT_OF_SOLVER_RANGE: 'PH_OUT_OF_SOLVER_RANGE',
  NEGATIVE_CONCENTRATION: 'NEGATIVE_CONCENTRATION',
  CHARGE_BALANCE_RESIDUAL: 'CHARGE_BALANCE_RESIDUAL',
  CARBON_ALPHA_SUM: 'CARBON_ALPHA_SUM',
  CARBON_ALPHA_RANGE: 'CARBON_ALPHA_RANGE',
  CARBON_MASS_BALANCE: 'CARBON_MASS_BALANCE',
  CALCIUM_SPECIATION_BALANCE: 'CALCIUM_SPECIATION_BALANCE',
  NEGATIVE_MOLE_INVENTORY: 'NEGATIVE_MOLE_INVENTORY',
} as const

export type InvalidReasonCode =
  (typeof INVALID_REASON_CODES)[keyof typeof INVALID_REASON_CODES]

/** Solver pH bracket (spec §8.1, §9.2). */
const SOLVER_PH_RANGE = { min: -2, max: 16 } as const

/**
 * Numeric invariants of one equilibrium result, checked against the route that
 * produced it. Route-specific species are only checked where they apply, so a
 * NaOH result is not penalized for having no carbonate fractions.
 */
export function checkEquilibriumInvariants(
  equilibrium: AcidEquilibriumResult,
  route: 'naoh' | 'calcium-hydroxide' | 'sodium-carbonate',
): InvalidReasonCode[] {
  const violations: InvalidReasonCode[] = []
  const { hydrogenMolL, hydroxideMolL, simulatedPH, chargeBalanceResidualMolL } = equilibrium

  if (!Number.isFinite(simulatedPH)) {
    violations.push(INVALID_REASON_CODES.NON_FINITE_PH)
    return violations
  }
  if (simulatedPH < SOLVER_PH_RANGE.min || simulatedPH > SOLVER_PH_RANGE.max) {
    violations.push(INVALID_REASON_CODES.PH_OUT_OF_SOLVER_RANGE)
  }
  if (
    !Number.isFinite(hydrogenMolL) ||
    !Number.isFinite(hydroxideMolL) ||
    hydrogenMolL < 0 ||
    hydroxideMolL < 0
  ) {
    violations.push(INVALID_REASON_CODES.NEGATIVE_CONCENTRATION)
  }
  if (Math.abs(chargeBalanceResidualMolL) > TOLERANCES.chargeResidualMolL) {
    violations.push(INVALID_REASON_CODES.CHARGE_BALANCE_RESIDUAL)
  }

  if (route === 'sodium-carbonate') {
    const fractions = equilibrium.carbonFractions
    const totalCarbonMolL = equilibrium.totalInorganicCarbonMolL
    if (fractions === undefined || totalCarbonMolL === undefined) {
      // A carbonate result without speciation is not a carbonate result.
      violations.push(INVALID_REASON_CODES.CARBON_MASS_BALANCE)
    } else {
      const { co2Star, bicarbonate, carbonate } = fractions
      const alphaSum = co2Star + bicarbonate + carbonate
      if (Math.abs(alphaSum - 1) > TOLERANCES.alphaSumAbsolute) {
        violations.push(INVALID_REASON_CODES.CARBON_ALPHA_SUM)
      }
      for (const alpha of [co2Star, bicarbonate, carbonate]) {
        if (!(alpha >= 0 && alpha <= 1)) {
          violations.push(INVALID_REASON_CODES.CARBON_ALPHA_RANGE)
          break
        }
      }
      // §16.2: sum of species concentrations must equal CT.
      const speciatedSumMolL = totalCarbonMolL * alphaSum
      const relativeError =
        totalCarbonMolL > 0
          ? Math.abs(speciatedSumMolL - totalCarbonMolL) / totalCarbonMolL
          : 0
      if (relativeError > TOLERANCES.carbonMassRelativeError) {
        violations.push(INVALID_REASON_CODES.CARBON_MASS_BALANCE)
      }
    }
  }

  if (route === 'calcium-hydroxide') {
    const calciumMolL = equilibrium.calciumMolL
    const complexMolL = equilibrium.calciumHydroxideComplexMolL
    if (calciumMolL === undefined || complexMolL === undefined) {
      violations.push(INVALID_REASON_CODES.CALCIUM_SPECIATION_BALANCE)
    } else if (calciumMolL < 0 || complexMolL < 0) {
      violations.push(INVALID_REASON_CODES.CALCIUM_SPECIATION_BALANCE)
    }
  }

  return violations
}

/**
 * §16.1 and §16.3: mole inventory must stay non-negative outside tolerance,
 * and the calcium speciation must conserve total calcium.
 *
 * Checked against state rather than the equilibrium result because the mole
 * counters are what an addition mutates; a negative counter means the engine
 * applied an action it should have rejected.
 */
export function checkStateInvariants(
  state: AcidNeutralizationState,
  expectedTotalCalciumMolL: number | null,
): InvalidReasonCode[] {
  const violations: InvalidReasonCode[] = []
  const tolerance = TOLERANCES.nonNegativeMoles

  const inventories: Array<[string, number]> = [
    ['chlorideMoles', state.chlorideMoles],
    ['sodiumMoles', state.sodiumMoles],
    ['calciumMoles', state.calciumMoles],
    ['totalInorganicCarbonMoles', state.totalInorganicCarbonMoles],
    ['totalVolumeL', state.totalVolumeL],
    ['baseVolumeL', state.baseVolumeL],
    ['correctionAcidVolumeL', state.correctionAcidVolumeL],
  ]

  for (const [, amount] of inventories) {
    if (!Number.isFinite(amount) || amount < -tolerance) {
      violations.push(INVALID_REASON_CODES.NEGATIVE_MOLE_INVENTORY)
      break
    }
  }

  const equilibrium = state.equilibrium
  if (expectedTotalCalciumMolL !== null && equilibrium !== null) {
    const speciated =
      (equilibrium.calciumMolL ?? 0) + (equilibrium.calciumHydroxideComplexMolL ?? 0)
    if (Math.abs(speciated - expectedTotalCalciumMolL) > TOLERANCES.chargeResidualMolL) {
      violations.push(INVALID_REASON_CODES.CALCIUM_SPECIATION_BALANCE)
    }
  }

  return violations
}

/** Whether a measurement still describes the current composition (§5.2). */
export function isMeasurementCurrent(state: AcidNeutralizationState): boolean {
  return (
    state.lastMeasuredPH !== null &&
    state.lastMeasuredCompositionRevision !== null &&
    state.lastMeasuredCompositionRevision === state.compositionRevision
  )
}
