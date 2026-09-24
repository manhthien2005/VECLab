import { describe, expect, it } from 'vitest'

import { solveEquilibrium, carbonFractions } from '@/domain/experiments/acid-neutralization/equilibrium.js'
import { TOLERANCES } from '@/domain/experiments/acid-neutralization/constants.js'

/**
 * Golden pH* values, verified independently against the spec constant bundle.
 *
 * Source: docs/experiments/acid-neutralization-spec.md §15 and
 * docs/verification-and-acceptance.md §5.1. Tolerance ±0.002 pH (§15.2).
 *
 * Benchmark: 25.00 mL HCl 0.01000 mol/L -> 0.00025 mol chloride.
 * Base equivalent concentration 0.01000 eq/L, so NaOH is 0.01000 mol/L while
 * Ca(OH)2 and Na2CO3 are 0.005000 mol/L (spec §2, 2 equivalents each).
 */

const ACID_VOLUME_L = 0.025
const ACID_CONC_MOL_L = 0.01
const CHLORIDE_MOLES = ACID_VOLUME_L * ACID_CONC_MOL_L
const BASE_EQ_CONC_EQ_L = 0.01
const PH_TOLERANCE = TOLERANCES.phAbsolute

/** Canonical-unit input builder. Volumes in L, amounts in mol. */
function inputs(route: 'naoh' | 'calcium-hydroxide' | 'sodium-carbonate', baseVolumeL: number, correctionVolumeL = 0) {
  const molarConcMolL = route === 'naoh' ? BASE_EQ_CONC_EQ_L : BASE_EQ_CONC_EQ_L / 2
  const baseMoles = baseVolumeL * molarConcMolL
  // Correction HCl is 0.01000 mol/L and adds chloride plus volume only.
  const correctionMoles = correctionVolumeL * ACID_CONC_MOL_L

  return {
    route,
    totalVolumeL: ACID_VOLUME_L + baseVolumeL + correctionVolumeL,
    chlorideMoles: CHLORIDE_MOLES + correctionMoles,
    sodiumMoles: route === 'naoh' ? baseMoles : route === 'sodium-carbonate' ? 2 * baseMoles : 0,
    calciumMoles: route === 'calcium-hydroxide' ? baseMoles : 0,
    totalInorganicCarbonMoles: route === 'sodium-carbonate' ? baseMoles : 0,
  }
}

function pHOf(route: 'naoh' | 'calcium-hydroxide' | 'sodium-carbonate', baseVolumeL: number, correctionVolumeL = 0) {
  const outcome = solveEquilibrium(inputs(route, baseVolumeL, correctionVolumeL))
  expect(outcome.ok, `solver failed for ${route} ${baseVolumeL}`).toBe(true)
  if (!outcome.ok) throw new Error('unreachable')
  return outcome.result.simulatedPH
}

describe('acid neutralization golden cases (spec §15, acceptance §5.1)', () => {
  it('AN-G01: no base added -> pH* 2.00000', () => {
    expect(pHOf('naoh', 0)).toBeCloseTo(2.0, 5)
    expect(Math.abs(pHOf('naoh', 0) - 2.0)).toBeLessThanOrEqual(PH_TOLERANCE)
  })

  it('AN-G02: NaOH 22.50 mL -> pH* 3.27875', () => {
    expect(Math.abs(pHOf('naoh', 0.0225) - 3.27875)).toBeLessThanOrEqual(PH_TOLERANCE)
  })

  it('AN-G03: NaOH 25.00 mL stoichiometric -> pH* 6.99500', () => {
    expect(Math.abs(pHOf('naoh', 0.025) - 6.995)).toBeLessThanOrEqual(PH_TOLERANCE)
  })

  it('AN-G04: Ca(OH)2 27.50 mL -> pH* 10.64984', () => {
    expect(Math.abs(pHOf('calcium-hydroxide', 0.0275) - 10.64984)).toBeLessThanOrEqual(PH_TOLERANCE)
  })

  it('AN-G05: Na2CO3 25.00 mL closed system -> pH* 4.47992', () => {
    expect(Math.abs(pHOf('sodium-carbonate', 0.025) - 4.47992)).toBeLessThanOrEqual(PH_TOLERANCE)
  })

  it('AN-G06: Na2CO3 42.25 mL -> pH* 6.99921', () => {
    expect(Math.abs(pHOf('sodium-carbonate', 0.04225) - 6.99921)).toBeLessThanOrEqual(PH_TOLERANCE)
  })

  it('AN-G07: Ca(OH)2 25.00 mL -> pH* 6.98637', () => {
    // The CaOH+ complex pulls this BELOW the NaOH stoichiometric value of
    // 6.99500. An implementation that ignores hydrolysis lands on 6.995 and
    // looks correct only because AN-G04 passes by luck.
    expect(Math.abs(pHOf('calcium-hydroxide', 0.025) - 6.98637)).toBeLessThanOrEqual(PH_TOLERANCE)
  })

  it('AN-G08: NaOH 27.50 mL then HCl correction 2.50 mL -> pH* 6.99500', () => {
    expect(Math.abs(pHOf('naoh', 0.0275, 0.0025) - 6.995)).toBeLessThanOrEqual(PH_TOLERANCE)
  })
})

describe('solver invariants (spec §16)', () => {
  const sweepVolumesL = [0, 0.00005, 0.001, 0.0125, 0.025, 0.0275, 0.03, 0.04, 0.05]

  it('never returns NaN or Infinity across the full sweep, all routes', () => {
    for (const route of ['naoh', 'calcium-hydroxide', 'sodium-carbonate'] as const) {
      for (const volumeL of sweepVolumesL) {
        const outcome = solveEquilibrium(inputs(route, volumeL))
        expect(outcome.ok, `${route} at ${volumeL} L`).toBe(true)
        if (!outcome.ok) continue
        const { simulatedPH, hydrogenMolL, hydroxideMolL } = outcome.result
        expect(Number.isFinite(simulatedPH), `pH finite ${route} ${volumeL}`).toBe(true)
        expect(Number.isFinite(hydrogenMolL)).toBe(true)
        expect(Number.isFinite(hydroxideMolL)).toBe(true)
        expect(hydrogenMolL).toBeGreaterThan(0)
        expect(simulatedPH).toBeGreaterThanOrEqual(-2)
        expect(simulatedPH).toBeLessThanOrEqual(16)
      }
    }
  })

  it('keeps charge balance residual within acceptance tolerance', () => {
    for (const route of ['naoh', 'calcium-hydroxide', 'sodium-carbonate'] as const) {
      for (const volumeL of sweepVolumesL) {
        const outcome = solveEquilibrium(inputs(route, volumeL))
        if (!outcome.ok) continue
        expect(
          Math.abs(outcome.result.chargeBalanceResidualMolL),
          `${route} at ${volumeL} L`,
        ).toBeLessThanOrEqual(TOLERANCES.chargeResidualMolL)
      }
    }
  })

  it('keeps carbonate alpha fractions summing to 1 and within [0,1]', () => {
    for (const volumeL of sweepVolumesL) {
      const outcome = solveEquilibrium(inputs('sodium-carbonate', volumeL))
      if (!outcome.ok) continue
      const fractions = outcome.result.carbonFractions
      expect(fractions, `fractions present at ${volumeL} L`).toBeDefined()
      if (!fractions) continue

      const sum = fractions.co2Star + fractions.bicarbonate + fractions.carbonate
      expect(Math.abs(sum - 1), `alpha sum at ${volumeL} L`).toBeLessThanOrEqual(
        TOLERANCES.alphaSumAbsolute,
      )
      for (const alpha of [fractions.co2Star, fractions.bicarbonate, fractions.carbonate]) {
        expect(alpha).toBeGreaterThanOrEqual(0)
        expect(alpha).toBeLessThanOrEqual(1)
      }
    }
  })

  it('conserves total calcium across Ca2+ and CaOH+ speciation', () => {
    for (const volumeL of sweepVolumesL) {
      if (volumeL === 0) continue
      const input = inputs('calcium-hydroxide', volumeL)
      const outcome = solveEquilibrium(input)
      if (!outcome.ok) continue
      const totalCalciumMolL = input.calciumMoles / input.totalVolumeL
      const speciated = (outcome.result.calciumMolL ?? 0) + (outcome.result.calciumHydroxideComplexMolL ?? 0)
      expect(Math.abs(speciated - totalCalciumMolL)).toBeLessThanOrEqual(
        TOLERANCES.chargeResidualMolL,
      )
    }
  })

  it('agrees with an independent bisection through the equivalence region', () => {
    // Spec §5.2/§16: the strong-route pH must be continuous across equivalence,
    // and the spec forbids a three-region excess-acid/equivalence/excess-base
    // shortcut. A shortcut shows up as disagreement with an independent root
    // find of the same charge balance, exactly near equivalence.
    //
    // Step sizes are NOT the invariant: a 0.01 mL step near equivalence really
    // does swing pH* by ~1.3, because the titration curve is steep there.
    const KW_LOCAL = 10 ** -13.99

    const bisectPh = (baseVolumeL: number): number => {
      const input = inputs('naoh', baseVolumeL)
      const cNa = input.sodiumMoles / input.totalVolumeL
      const cCl = input.chlorideMoles / input.totalVolumeL
      const residualAt = (h: number) => h + cNa - KW_LOCAL / h - cCl
      let lo = -2
      let hi = 16
      // Width-only stop: the production solver also permits an early exit on
      // |f| < 1e-12 mol/L (spec §8.1), and near equivalence f is nearly flat,
      // so that exit allows a visibly larger pH error than the width bound.
      // Stopping on width alone makes this reference strictly tighter than the
      // implementation under test.
      for (let i = 0; i < 100; i += 1) {
        const mid = (lo + hi) / 2
        if (Math.abs(hi - lo) < 1e-12) return mid
        const r = residualAt(10 ** -mid)
        if (Math.sign(r) === Math.sign(residualAt(10 ** -lo))) lo = mid
        else hi = mid
      }
      return (lo + hi) / 2
    }

    // Tolerance reflects the bug class under test. A forbidden three-region
    // excess-acid/equivalence/excess-base shortcut disagrees by O(0.1) pH near
    // equivalence, whereas the two root finders above agree to ~1e-8 once the
    // implementation's own residual early-exit is accounted for. 1e-6 keeps the
    // check sharp against that shortcut without asserting on solver noise.
    const CROSS_CHECK_PH_TOLERANCE = 1e-6

    const nearEquivalenceL = [0.02, 0.0249, 0.02499, 0.025, 0.02501, 0.0251, 0.03]
    for (const volumeL of nearEquivalenceL) {
      const closedForm = pHOf('naoh', volumeL)
      expect(Math.abs(closedForm - bisectPh(volumeL)), `NaOH at ${volumeL} L`).toBeLessThanOrEqual(
        CROSS_CHECK_PH_TOLERANCE,
      )
    }

    // Monotonic in added base, with no reversal anywhere across the region.
    const curve = nearEquivalenceL.map((volumeL) => pHOf('naoh', volumeL))
    for (let index = 1; index < curve.length; index += 1) {
      expect(curve[index]).toBeGreaterThan(curve[index - 1] as number)
    }
  })

  it('confirms carbonate nominal equivalence does not reach the target pH', () => {
    // Spec §9.3: 25.00 mL Na2CO3 carries exactly 2 nominal H+ capacity yet
    // sits near pH* 4.48. Reaching the benchmark target needs ~42.20 mL.
    const atNominalEquivalence = pHOf('sodium-carbonate', 0.025)
    expect(atNominalEquivalence).toBeLessThan(5)

    const targetVolumeL = 0.042198
    expect(Math.abs(pHOf('sodium-carbonate', targetVolumeL) - 6.995)).toBeLessThanOrEqual(
      PH_TOLERANCE,
    )
  })
})

describe('carbonFractions helper', () => {
  it('tracks the pKa1 and pKa2 crossover points', () => {
    // pKa1 = 6.352, pKa2 = 10.329. Below pKa1 CO2* dominates; between the two
    // HCO3- dominates; above pKa2 CO3^2- dominates. Asserting the crossover
    // rather than a single point pins the distribution constants themselves.
    const stronglyAcidic = carbonFractions(10 ** -4) // pH 4
    const betweenPka = carbonFractions(10 ** -8.5) // pH 8.5
    const stronglyAlkaline = carbonFractions(10 ** -12) // pH 12

    expect(stronglyAcidic.co2Star).toBeGreaterThan(stronglyAcidic.bicarbonate)
    expect(stronglyAcidic.carbonate).toBeLessThan(1e-6)

    expect(betweenPka.bicarbonate).toBeGreaterThan(betweenPka.co2Star)
    expect(betweenPka.bicarbonate).toBeGreaterThan(betweenPka.carbonate)

    expect(stronglyAlkaline.carbonate).toBeGreaterThan(stronglyAlkaline.bicarbonate)
    expect(stronglyAlkaline.co2Star).toBeLessThan(1e-4)
  })

  it('crosses over at each pKa where the two adjacent species are equal', () => {
    // At pH = pKa the two species straddling it are exactly equal by
    // construction of the alpha expressions. This is a sharper check than any
    // single dominance assertion and would catch a swapped Ka1/Ka2.
    const atPka1 = carbonFractions(10 ** -6.352)
    expect(atPka1.co2Star).toBeCloseTo(atPka1.bicarbonate, 12)

    const atPka2 = carbonFractions(10 ** -10.329)
    expect(atPka2.bicarbonate).toBeCloseTo(atPka2.carbonate, 12)
  })
})
