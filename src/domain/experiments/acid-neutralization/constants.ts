/**
 * Acid neutralization — scenario constants.
 *
 * This bundle is immutable for release `acid-neutralization@1.0.0`.
 * Source of truth: docs/experiments/acid-neutralization-spec.md §6.
 * Do not change one constant while keeping the same release id (§6.1), and do
 * not compare pH digits against the copper scenario, which uses a different
 * activity model and `log Kw = -14.000` convention (§6.2).
 */

/** Model spec version implemented by this release. */
export const MODEL_SPEC_VERSION = '1.0.0'

/** pKw = 13.990 at 25 °C, 0.1 MPa (IAPWS R11-24). */
export const P_KW = 13.99

export const KW = 10 ** -P_KW // 1.023292992e-14

/** pKa1 of CO2* = 6.352 (PHREEQC official data). */
export const P_KA1_CARBONIC = 6.352

export const KA1_CARBONIC = 10 ** -P_KA1_CARBONIC // 4.446312675e-7

/** pKa2 of HCO3- = 10.329 (PHREEQC official data). */
export const P_KA2_CARBONIC = 10.329

export const KA2_CARBONIC = 10 ** -P_KA2_CARBONIC // 4.688133821e-11

/**
 * log10 Kh,Ca = -12.780 for Ca2+ + H2O <=> CaOH+ + H+.
 * Kh = [CaOH+][H+]/[Ca2+], so [CaOH+] = (Kh/h) * [Ca2+].
 */
export const LOG10_KH_CALCIUM = -12.78

export const KH_CALCIUM = 10 ** LOG10_KH_CALCIUM // 1.659586907e-13

/** Molar masses used for reagent mass reporting (spec §13.3), g/mol. */
export const MOLAR_MASS_G_PER_MOL = {
  naoh: 39.997,
  calciumHydroxide: 74.0927,
  sodiumCarbonate: 105.9888,
  hcl: 36.4609,
} as const

/** Locked scenario conditions (spec §2, §17). */
export const LOCKED_CONDITIONS = {
  temperatureC: 25.0,
  pressureMPa: 0.1,
} as const

/** Benchmark target and acceptance band (spec §2, §14). */
export const BENCHMARK_TARGET_PH = 6.995

export const TARGET_TOLERANCE_PH = 0.2

/** Benchmark sample (spec §2). */
export const BENCHMARK_SAMPLE = {
  acidVolumeL: 0.025, // 25.00 mL
  acidConcentrationMolL: 0.01, // 0.01000 mol/L HCl
} as const

/**
 * Permitted aliquot sizes in litres (spec §3.2). Arbitrary aliquots are not
 * accepted in scenario 1.0.0; the fixed set keeps runs comparable and avoids
 * meaningless input precision.
 */
export const PERMITTED_ALIQUOTS_L = [0.00005, 0.0001, 0.0005, 0.001, 0.005] as const

/** Event limits (spec §3.6). */
export const MAX_REAGENT_ADDITIONS = 120
export const MAX_ACCEPTED_EVENTS = 500

/** Exploration ranges (spec §3.5). */
export const EXPLORATION_RANGES = {
  acidVolumeL: { min: 0.025, max: 0.05 },
  acidConcentrationMolL: { min: 0.005, max: 0.02 },
  targetPh: { min: 6.5, max: 7.5, step: 0.1 },
} as const

/**
 * Locked route stoichiometry for release 1.0.0 (spec §2).
 *
 * All three stocks share a nominal 0.01000 eq/L, so the divalent routes are
 * 0.005000 mol/L. These are part of the immutable constant bundle (§6.1):
 * changing them changes every golden value and requires a new release.
 */
export const BASE_MOLAR_CONC_MOL_L: Record<'naoh' | 'calcium-hydroxide' | 'sodium-carbonate', number> = {
  naoh: 0.01,
  'calcium-hydroxide': 0.005,
  'sodium-carbonate': 0.005,
}

/** Equivalents of H+ accepted per mole of base, by route (spec §2). */
export const EQUIVALENTS_PER_MOLE: Record<'naoh' | 'calcium-hydroxide' | 'sodium-carbonate', number> = {
  naoh: 1,
  'calcium-hydroxide': 2,
  'sodium-carbonate': 2,
}

/** Correction acid is 0.01000 mol/L HCl, monobasic (spec §2). */
export const CORRECTION_HCL_CONC_MOL_L = 0.01

/**
 * Millimoles per mole. The cost convention (§13.4) and the resource score
 * (§14.3) are both defined per mmol, while canonical state is in mol.
 */
export const MMOL_PER_MOL = 1000

/**
 * Volume bisection tolerance when inverting the model for a target pH*
 * (spec §14.3). 1e-12 L = 1e-9 mL, far below the 0.05 mL smallest permitted
 * aliquot, so the derived E* cannot influence an observable dose decision.
 */
export const TARGET_VOLUME_TOLERANCE_L = 1e-12

/**
 * Cost convention `pedagogical-cost-1.0.0` (spec §13.4). Coefficients apply per
 * mmol of reagent and are a versioned pedagogical convention, not a price.
 */
export const COST_CONVENTION_VERSION = 'pedagogical-cost-1.0.0'

export const COST_COEFFICIENTS_PER_MMOL = {
  naoh: 1.0,
  calciumHydroxide: 1.3,
  sodiumCarbonate: 1.0,
  correctionHcl: 1.0,
} as const

/** Safety convention `pedagogical-safety-1.0.0` (spec §13.5). */
export const SAFETY_CONVENTION_VERSION = 'pedagogical-safety-1.0.0'

export const SAFETY_PENALTY_POINTS = {
  EXCESS_BASE_OVER_110_PERCENT_TARGET: 20,
  CORRECTION_ACID_USED: 15,
  FINAL_PH_OUTSIDE_6_TO_8: 30,
} as const

/**
 * Route-specific `E*` values published in spec §14.3 for the benchmark target
 * pH* 6.995, in mmol of equivalents.
 *
 * RUNTIME MUST NOT READ THIS TABLE. `E*` is derived by inverting the model
 * (see resolveTargetEquivalentsMmolEq / solveVolumeForTargetPh), because an
 * exploration target needs a different `E*` per route (§3.5) and a lookup
 * would score those runs against benchmark numbers.
 *
 * These values exist so the inverter can be cross-checked against the spec:
 * tests/unit/acid-target-volume.test.ts asserts that inverting the model at
 * target 6.995 with the benchmark sample reproduces each entry. That is a
 * stronger check than trusting the table, since it also pins the equivalence
 * between §14.3 and §7–§9.
 *
 * The Ca(OH)₂ value exceeds 0.2500 because CaOH⁺ hydrolysis consumes a little
 * hydroxide, so slightly more than stoichiometric base reaches the same pH*.
 * The Na₂CO₃ value is roughly 1.69× the nominal two-equivalent dose because the
 * closed-carbon equilibrium only reaches the target near 42.20 mL (§9.3).
 */
export const SPEC_PUBLISHED_BENCHMARK_E_STAR_MMOL_EQ: Record<
  'naoh' | 'calcium-hydroxide' | 'sodium-carbonate',
  number
> = {
  naoh: 0.25,
  'calcium-hydroxide': 0.2500002,
  'sodium-carbonate': 0.4219783,
}

/** Scoring weights (spec §14.2–§14.4). */
export const SCORE_WEIGHTS = {
  ph: 60,
  resource: 20,
  process: 20,
  /** pH score full-credit half-width, in pH units (§14.2). */
  phScoreBandwidth: 0.5,
  /** Last base aliquot must be at most this many mL for process credit (§14.4). */
  finalAliquotMaxMl: 0.5,
} as const

/**
 * Safety penalty thresholds (spec §13.5). Excess base is measured against the
 * route-specific `E*`, never against the nominal 0.2500 mmol acid equivalents —
 * using the latter would wrongly penalize every valid Na₂CO₃ run.
 */
export const EXCESS_BASE_RATIO_LIMIT = 1.1

/** Complete-with-penalty band for FINAL_PH_OUTSIDE_6_TO_8 (spec §13.5). */
export const SAFETY_PH_BAND = { low: 6, high: 8 } as const

/** Solver configuration (spec §8.1, §9.2). */
export const SOLVER = {
  phLowerBound: -2,
  phUpperBound: 16,
  maxIterations: 100,
  /** Stop when bracket width < 1e-10 pH. */
  phWidthTolerance: 1e-10,
  /** Stop when |f| < 1e-12 mol/L. */
  residualToleranceMolL: 1e-12,
} as const

/** Acceptance tolerances (spec §15.2, §16). */
export const TOLERANCES = {
  phAbsolute: 0.002,
  alphaAbsolute: 2e-5,
  carbonMassRelativeError: 1e-10,
  chargeResidualMolL: 1e-10,
  alphaSumAbsolute: 1e-12,
  nonNegativeMoles: 1e-15,
} as const

/**
 * Source register keys referenced by calculation traces.
 *
 * Every key must resolve in docs/scientific-evidence-register.md and in the
 * acid spec source matrix (§20). Inventing a key breaks the content/QA gate
 * "mọi claim/source key resolve", so these ids are copied verbatim.
 */
export const SOURCE_KEYS = {
  phDefinition: 'IUPAC-PH',
  kw: 'IAPWS-KW-2024',
  carbonicAndCalciumEquilibria: 'USGS-PHREEQC-1995',
  calciumHydroxideSolubility: 'NIST-CAOH2-1956',
  co2ExchangeLimitation: 'USGS-ALK-FAQ',
  stableReadingAndAliquot: 'VALENCIA-TITRATION',
  potentiometricProcedure: 'FSU-TITRATION',
  endpointAndMatrixLimitation: 'ASTM-D1067-16',
  hazardHcl: 'NIOSH-HCL',
  hazardNaoh: 'NIOSH-NAOH',
  hazardCalciumHydroxide: 'NIOSH-CAOH2',
  hazardSodiumCarbonate: 'PUBCHEM-NA2CO3',
} as const

/**
 * Claim ids from the route-to-claim mapping (spec §20.1). Calculation traces
 * cite these; the content layer resolves each to register sources.
 */
export const CLAIM_IDS = {
  phDefinition: 'AN-PH-DEFINITION',
  kw25C: 'AN-KW-25C',
  caohComplex: 'AN-CAOH-COMPLEX',
  caoh2Concentration: 'AN-CAOH2-CONCENTRATION',
  carbonateConstants: 'AN-CARBONATE-CONSTANTS',
  closedCarbon: 'AN-CLOSED-CARBON',
  aliquotProcedure: 'AN-ALIQUOT-PROCEDURE',
  safetyWording: 'AN-SAFETY-WORDING',
} as const
