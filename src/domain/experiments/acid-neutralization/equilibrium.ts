import {
  KW,
  KA1_CARBONIC,
  KA2_CARBONIC,
  KH_CALCIUM,
  SOLVER,
  EQUIVALENTS_PER_MOLE,
  CORRECTION_HCL_CONC_MOL_L,
  MMOL_PER_MOL,
  TARGET_VOLUME_TOLERANCE_L,
} from './constants.js'
import type { AcidRoute, AcidEquilibriumResult, AcidScenarioConfig, CarbonFractions } from './state.js'

/**
 * Acid neutralization equilibrium solvers.
 *
 * Implements docs/experiments/acid-neutralization-spec.md §7 (NaOH), §8
 * (Ca(OH)₂) and §9 (Na₂CO₃) verbatim, against the locked constant bundle of
 * release 1.0.0 (§6). The bundle is `pKw = 13.990` with concentration-ideal
 * pH*; do not mix it with the copper scenario's Davies activity model and
 * `log Kw = -14.000` convention (§6.2).
 *
 * Determinism is a release requirement: same state and same action must produce
 * the same numbers on every device, in the browser and on the server
 * (docs/system-architecture.md §1). Both iterative solvers therefore use plain
 * bisection with fixed tolerances rather than an adaptive or
 * platform-dependent method.
 */

/** Aggregates derived from state, already in canonical units (L, mol, mol/L). */
export type EquilibriumInputs = {
  route: AcidRoute
  totalVolumeL: number
  chlorideMoles: number
  sodiumMoles: number
  calciumMoles: number
  totalInorganicCarbonMoles: number
}

/**
 * Solver outcome. `iterations` rides on the outcome rather than inside
 * `AcidEquilibriumResult` because §4.3 freezes that type as persisted state:
 * adding a diagnostic field would change the state hash and every stored
 * snapshot. Iteration count is still required — it feeds the calculation trace
 * (§10.2, §10.3) and the residual/convergence invariants (§16).
 */
export type SolverOutcome =
  | { ok: true; result: AcidEquilibriumResult; iterations: number }
  | {
      ok: false
      code: 'EQUILIBRIUM_NO_CONVERGENCE' | 'MODEL_INVALID_VOLUME'
      data: Record<string, number | string>
    }

type BisectionSolution = {
  pH: number
  hydrogenMolL: number
  residualMolL: number
  iterations: number
}

/**
 * Bisection on the pH variable over the spec's bracket, shared by the two
 * routes whose charge balance is not solvable in closed form.
 *
 * `residualAt` takes a hydrogen-ion concentration and returns the charge
 * balance in mol/L. The solver stops on either the pH-width tolerance or the
 * residual tolerance (§8.1, §9.2) and reports the iteration count, because both
 * are required trace fields (§10.2, §10.3).
 */
function bisectOnPh(residualAt: (hydrogenMolL: number) => number): BisectionSolution | null {
  const { phLowerBound, phUpperBound, maxIterations, phWidthTolerance, residualToleranceMolL } = SOLVER
  // SOLVER is `as const`, so widen explicitly: the bracket narrows each pass.
  let lowerPh: number = phLowerBound
  let upperPh: number = phUpperBound

  const lowerResidual = residualAt(10 ** -lowerPh)
  const upperResidual = residualAt(10 ** -upperPh)

  if (!Number.isFinite(lowerResidual) || !Number.isFinite(upperResidual)) return null
  // No sign change means the bracket does not contain the root; the spec
  // requires a domain error here rather than a silently wrong answer (§8.1).
  if (Math.sign(lowerResidual) === Math.sign(upperResidual)) return null

  let iterations = 0
  let midPh = (lowerPh + upperPh) / 2
  let midResidual = lowerResidual

  while (iterations < maxIterations) {
    iterations += 1
    midPh = (lowerPh + upperPh) / 2
    const midHydrogen = 10 ** -midPh
    midResidual = residualAt(midHydrogen)

    if (!Number.isFinite(midResidual)) return null
    if (Math.abs(midResidual) < residualToleranceMolL) break
    if (Math.abs(upperPh - lowerPh) < phWidthTolerance) break

    // Narrow the bracket toward the sign change; the hydrogen concentrations
    // are recomputed from pH each iteration, so no separate endpoint state.
    if (Math.sign(midResidual) === Math.sign(lowerResidual)) {
      lowerPh = midPh
    } else {
      upperPh = midPh
    }
  }

  const hydrogenMolL = 10 ** -midPh
  return { pH: midPh, hydrogenMolL, residualMolL: midResidual, iterations }
}

/**
 * §7 — NaOH strong acid/strong base charge balance, solved in closed form.
 *
 *   D = (nCl - nNa) / V
 *   h - Kw/h = D
 *
 * The `D < 0` branch uses the numerically stable form `2Kw / (sqrt(D²+4Kw) - D)`
 * to avoid catastrophic cancellation from subtracting two nearly equal numbers
 * near equivalence. The spec explicitly forbids replacing this with a
 * three-region excess-acid / equivalence / excess-base shortcut, which would
 * introduce a discontinuity exactly where the learner is looking.
 */
export function solveNaohEquilibrium(inputs: EquilibriumInputs): SolverOutcome {
  const { totalVolumeL, chlorideMoles, sodiumMoles } = inputs
  if (!(totalVolumeL > 0)) {
    return { ok: false, code: 'MODEL_INVALID_VOLUME', data: { totalVolumeL } }
  }

  const chlorideMolL = chlorideMoles / totalVolumeL
  const sodiumMolL = sodiumMoles / totalVolumeL
  const excessAcidMolL = chlorideMolL - sodiumMolL
  const discriminant = Math.sqrt(excessAcidMolL * excessAcidMolL + 4 * KW)

  const hydrogenMolL =
    excessAcidMolL >= 0
      ? (excessAcidMolL + discriminant) / 2
      : (2 * KW) / (discriminant - excessAcidMolL)

  if (!Number.isFinite(hydrogenMolL) || hydrogenMolL <= 0) {
    return { ok: false, code: 'EQUILIBRIUM_NO_CONVERGENCE', data: { totalVolumeL } }
  }

  const hydroxideMolL = KW / hydrogenMolL
  // Charge balance residual: positive species minus negative species.
  const residualMolL = hydrogenMolL + sodiumMolL - hydroxideMolL - chlorideMolL

  return {
    ok: true,
    result: {
      hydrogenMolL,
      hydroxideMolL,
      simulatedPH: -Math.log10(hydrogenMolL),
      chargeBalanceResidualMolL: residualMolL,
    },
    // Analytic closed form: no iterations performed, reported as 0 so the
    // trace shape stays uniform across the three routes.
    iterations: 0,
  }
}

type CalciumSpeciation = {
  calciumMolL: number
  calciumHydroxideComplexMolL: number
}

/**
 * §8 — Ca(OH)₂ speciation at a given hydrogen concentration.
 *
 *   r = Kh,Ca / h
 *   [Ca²⁺]  = CCaT / (1 + r)
 *   [CaOH⁺] = r × CCaT / (1 + r)
 *
 * The hydrolysis complex is what makes this route differ from NaOH: CaOH⁺
 * removes hydroxide from solution, so at exact stoichiometry pH* lands at
 * 6.98637 (AN-G07) rather than 6.995. Ignoring the complex reproduces the NaOH
 * curve and silently fails that golden case.
 */
function calciumSpeciation(totalCalciumMolL: number, hydrogenMolL: number): CalciumSpeciation {
  const hydrolysisRatio = KH_CALCIUM / hydrogenMolL
  const denominator = 1 + hydrolysisRatio
  return {
    calciumMolL: totalCalciumMolL / denominator,
    calciumHydroxideComplexMolL: (hydrolysisRatio * totalCalciumMolL) / denominator,
  }
}

export function solveCalciumHydroxideEquilibrium(inputs: EquilibriumInputs): SolverOutcome {
  const { totalVolumeL, chlorideMoles, calciumMoles } = inputs
  if (!(totalVolumeL > 0)) {
    return { ok: false, code: 'MODEL_INVALID_VOLUME', data: { totalVolumeL } }
  }

  const chlorideMolL = chlorideMoles / totalVolumeL
  const totalCalciumMolL = calciumMoles / totalVolumeL

  const residualAt = (hydrogenMolL: number): number => {
    const speciation = calciumSpeciation(totalCalciumMolL, hydrogenMolL)
    return (
      hydrogenMolL +
      2 * speciation.calciumMolL +
      speciation.calciumHydroxideComplexMolL -
      KW / hydrogenMolL -
      chlorideMolL
    )
  }

  const solution = bisectOnPh(residualAt)
  if (solution === null) {
    return { ok: false, code: 'EQUILIBRIUM_NO_CONVERGENCE', data: { totalVolumeL, totalCalciumMolL } }
  }

  const speciation = calciumSpeciation(totalCalciumMolL, solution.hydrogenMolL)
  return {
    ok: true,
    result: {
      hydrogenMolL: solution.hydrogenMolL,
      hydroxideMolL: KW / solution.hydrogenMolL,
      simulatedPH: solution.pH,
      chargeBalanceResidualMolL: solution.residualMolL,
      calciumMolL: speciation.calciumMolL,
      calciumHydroxideComplexMolL: speciation.calciumHydroxideComplexMolL,
    },
    iterations: solution.iterations,
  }
}

/**
 * §9.1 — closed-system inorganic carbon distribution.
 *
 *   delta  = h² + Ka1×h + Ka1×Ka2
 *   alpha0 = h² / delta,  alpha1 = Ka1×h / delta,  alpha2 = Ka1×Ka2 / delta
 *
 * CO₂* = CO₂(aq) + H₂CO₃. Total dissolved carbon is conserved because the
 * system is closed: no CO₂ exchange with air is modelled (§9.4), which is why
 * 25.00 mL of Na₂CO₃ sits at pH* 4.47992 (AN-G05) despite carrying exactly two
 * nominal equivalents, and why reaching the target needs ~42.20 mL (AN-G06).
 */
export function carbonFractions(hydrogenMolL: number): CarbonFractions {
  const denominator =
    hydrogenMolL * hydrogenMolL + KA1_CARBONIC * hydrogenMolL + KA1_CARBONIC * KA2_CARBONIC
  return {
    co2Star: (hydrogenMolL * hydrogenMolL) / denominator,
    bicarbonate: (KA1_CARBONIC * hydrogenMolL) / denominator,
    carbonate: (KA1_CARBONIC * KA2_CARBONIC) / denominator,
  }
}

export function solveSodiumCarbonateEquilibrium(inputs: EquilibriumInputs): SolverOutcome {
  const { totalVolumeL, chlorideMoles, sodiumMoles, totalInorganicCarbonMoles } = inputs
  if (!(totalVolumeL > 0)) {
    return { ok: false, code: 'MODEL_INVALID_VOLUME', data: { totalVolumeL } }
  }

  const chlorideMolL = chlorideMoles / totalVolumeL
  const sodiumMolL = sodiumMoles / totalVolumeL
  const totalInorganicCarbonMolL = totalInorganicCarbonMoles / totalVolumeL

  const residualAt = (hydrogenMolL: number): number => {
    const fractions = carbonFractions(hydrogenMolL)
    const boundBaseMolL =
      totalInorganicCarbonMolL * (fractions.bicarbonate + 2 * fractions.carbonate)
    return hydrogenMolL + sodiumMolL - KW / hydrogenMolL - chlorideMolL - boundBaseMolL
  }

  const solution = bisectOnPh(residualAt)
  if (solution === null) {
    return {
      ok: false,
      code: 'EQUILIBRIUM_NO_CONVERGENCE',
      data: { totalVolumeL, totalInorganicCarbonMolL },
    }
  }

  const fractions = carbonFractions(solution.hydrogenMolL)
  return {
    ok: true,
    result: {
      hydrogenMolL: solution.hydrogenMolL,
      hydroxideMolL: KW / solution.hydrogenMolL,
      simulatedPH: solution.pH,
      chargeBalanceResidualMolL: solution.residualMolL,
      totalInorganicCarbonMolL,
      carbonFractions: fractions,
    },
    iterations: solution.iterations,
  }
}

/** Route dispatcher. `route` decides which model applies; callers never choose. */
export function solveEquilibrium(inputs: EquilibriumInputs): SolverOutcome {
  switch (inputs.route) {
    case 'naoh':
      return solveNaohEquilibrium(inputs)
    case 'calcium-hydroxide':
      return solveCalciumHydroxideEquilibrium(inputs)
    case 'sodium-carbonate':
      return solveSodiumCarbonateEquilibrium(inputs)
  }
}

/** Solution configuration the forward model needs, in canonical units. */
export type AcidSolutionConfig = {
  acidVolumeL: number
  acidConcentrationMolL: number
  /** Nominal base normality; all three stocks are 0.01000 eq/L (spec §2). */
  baseEquivalentConcentrationEqL: number
}

/**
 * Project the frozen scenario constants into the solver's input shape.
 *
 * The constants bundle is the single source of truth for the sample and the
 * target; deriving this rather than duplicating the fields means the forward
 * model, the E* inverter and the engine cannot disagree about which sample a
 * run is describing.
 */
export function solutionConfigFrom(
  config: AcidScenarioConfig,
): AcidSolutionConfig {
  return {
    acidVolumeL: config.constants.acidVolumeL,
    acidConcentrationMolL: config.constants.acidConcentrationMolL,
    baseEquivalentConcentrationEqL: config.constants.baseEquivalentConcentrationEqL,
  }
}

/**
 * Build canonical solver inputs for a route at a given base volume.
 *
 * Shared by the engine and the target-volume inverter so the two cannot drift
 * into different stoichiometry. Molarity follows from normality and the route's
 * equivalents per mole, which is why all three stocks can share one
 * `baseEquivalentConcentrationEqL`.
 */
export function equilibriumInputsForBaseVolume(
  config: AcidSolutionConfig,
  route: AcidRoute,
  baseVolumeL: number,
  correctionAcidVolumeL = 0,
): EquilibriumInputs {
  const baseMolarConcMolL = config.baseEquivalentConcentrationEqL / EQUIVALENTS_PER_MOLE[route]
  const baseMoles = baseVolumeL * baseMolarConcMolL
  const correctionMoles = correctionAcidVolumeL * CORRECTION_HCL_CONC_MOL_L

  return {
    route,
    totalVolumeL: config.acidVolumeL + baseVolumeL + correctionAcidVolumeL,
    chlorideMoles: config.acidVolumeL * config.acidConcentrationMolL + correctionMoles,
    sodiumMoles:
      route === 'naoh' ? baseMoles : route === 'sodium-carbonate' ? 2 * baseMoles : 0,
    calciumMoles: route === 'calcium-hydroxide' ? baseMoles : 0,
    totalInorganicCarbonMoles: route === 'sodium-carbonate' ? baseMoles : 0,
  }
}

/** Forward model: pH* at a base volume, or null when the solver fails. */
export function simulatedPhAtVolume(
  config: AcidSolutionConfig,
  route: AcidRoute,
  baseVolumeL: number,
): number | null {
  const outcome = solveEquilibrium(equilibriumInputsForBaseVolume(config, route, baseVolumeL))
  return outcome.ok ? outcome.result.simulatedPH : null
}

export type TargetVolumeOutcome =
  | { ok: true; volumeL: number; phAtVolume: number; baseEquivalentsMmolEq: number }
  | {
      ok: false
      reason: 'TARGET_UNREACHABLE' | 'EQUILIBRIUM_NO_CONVERGENCE'
      data: Record<string, number | string>
    }

/**
 * Invert the model: the minimum base volume whose pH* reaches `targetPH`.
 *
 * This is how `E*` is obtained for a run (spec §14.3, §3.5). The benchmark
 * table in §14.3 is a consequence of this inversion at target 6.995 with the
 * benchmark sample, not an independent input, so exploration targets get a
 * correct route-specific `E*` instead of being scored against benchmark
 * numbers.
 *
 * Bisection on volume is valid because pH* is strictly increasing in added base
 * for all three routes across the permitted range. That monotonicity is
 * asserted by tests/unit/acid-target-volume.test.ts rather than assumed here.
 *
 * Returns TARGET_UNREACHABLE when the target lies outside the pH* span of
 * [0, maxVolumeL]. Callers must treat that as N/A, never as 0.
 */
export function solveVolumeForTargetPh(
  config: AcidSolutionConfig,
  route: AcidRoute,
  targetPH: number,
  maxVolumeL: number,
): TargetVolumeOutcome {
  const phAtZero = simulatedPhAtVolume(config, route, 0)
  const phAtMax = simulatedPhAtVolume(config, route, maxVolumeL)
  if (phAtZero === null || phAtMax === null) {
    return {
      ok: false,
      reason: 'EQUILIBRIUM_NO_CONVERGENCE',
      data: { route, targetPH, maxVolumeL },
    }
  }
  if (targetPH < phAtZero || targetPH > phAtMax) {
    return {
      ok: false,
      reason: 'TARGET_UNREACHABLE',
      data: { route, targetPH, maxVolumeL, phAtZero, phAtMax },
    }
  }

  let lower = 0
  let upper = maxVolumeL
  for (let iteration = 0; iteration < SOLVER.maxIterations; iteration += 1) {
    const mid = (lower + upper) / 2
    const ph = simulatedPhAtVolume(config, route, mid)
    if (ph === null) {
      return {
        ok: false,
        reason: 'EQUILIBRIUM_NO_CONVERGENCE',
        data: { route, targetPH, volumeL: mid },
      }
    }
    if (Math.abs(upper - lower) < TARGET_VOLUME_TOLERANCE_L) break
    if (ph < targetPH) lower = mid
    else upper = mid
  }

  // Take the upper end: the minimum volume that actually reaches the target.
  const volumeL = upper
  const phAtVolume = simulatedPhAtVolume(config, route, volumeL)
  if (phAtVolume === null) {
    return {
      ok: false,
      reason: 'EQUILIBRIUM_NO_CONVERGENCE',
      data: { route, targetPH, volumeL },
    }
  }

  // Equivalents = volume x molarity x equivalents-per-mole, in mmol.
  const baseEquivalentsMmolEq =
    volumeL * config.baseEquivalentConcentrationEqL * MMOL_PER_MOL

  return { ok: true, volumeL, phAtVolume, baseEquivalentsMmolEq }
}
