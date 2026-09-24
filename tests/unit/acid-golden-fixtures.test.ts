import { describe, expect, it } from 'vitest'

import golden from '../fixtures/acid-neutralization/golden-cases.json'
import {
  solveEquilibrium,
  equilibriumInputsForBaseVolume,
  solutionConfigFrom,
  carbonFractions,
  createAcidNeutralizationModule,
  createAcidStateFor,
  benchmarkScenarioConfig,
  ACID_RELEASE_ID,
} from '@/domain/experiments/acid-neutralization/index.js'
import {
  computeRelativeCostIndex,
  computeSafetyPenalties,
  computeEgrossMmolEq,
  initialHclMmolFor,
  resolveTargetEquivalentsMmolEq,
} from '@/domain/experiments/acid-neutralization/resources.js'
import { TOLERANCES } from '@/domain/experiments/acid-neutralization/constants.js'
import type {
  AcidRoute,
  AcidScenarioConfig,
} from '@/domain/experiments/acid-neutralization/index.js'
import type { SimulationAction, UUID } from '@/domain/process/contracts.js'

/**
 * Fixture-driven acceptance gate.
 *
 * docs/verification-and-acceptance.md §5.1 requires the eight AN-G* cases to
 * pass inside ±0.002 pH, and §19 requires the golden values to carry provenance
 * and an independent check. Both are satisfied by keeping the expectations in
 * tests/fixtures/acid-neutralization/golden-cases.json — a data file that names
 * its sources, its derivation and how it was cross-checked — and having this
 * test read them rather than restating numbers inline.
 *
 * Two things are asserted on every case, not one:
 *   * the SOLVER reproduces the expected pH at the expected composition
 *   * the ENGINE, driven through real actions, arrives at the same pH
 * The first pins the chemistry; the second pins the state machine that carries
 * it. A case that passes at solver level but fails through the engine means the
 * transition logic diverges from the model.
 */

type GoldenCase = {
  caseId: string
  title: string
  route: AcidRoute
  baseVolumeMl: number
  correctionAcidVolumeMl: number
  expected: {
    pH: number
    totalInorganicCarbonMolL?: number
    alpha0?: number
    alpha1?: number
    alpha2?: number
    alpha1PlusTwoAlpha2?: number
    relativeCostIndex?: number
    safetyIndex?: number
    penaltyCodes?: string[]
    grossEquivalentsMmolEq?: number
  }
  notes: string
}

const cases = golden.cases as GoldenCase[]
const goldenTolerances = golden.tolerances
const benchmark = golden.benchmark

/** The config the fixture describes, rebuilt from the fixture rather than from
 *  the engine's own default — so the fixture is the authority on the sample. */
const baseConfig = benchmarkScenarioConfig()
const fixtureConfig: AcidScenarioConfig = {
  ...baseConfig,
  constants: {
    ...baseConfig.constants,
    acidVolumeL: benchmark.acidVolumeL,
    acidConcentrationMolL: benchmark.acidConcentrationMolL,
    baseEquivalentConcentrationEqL: benchmark.baseEquivalentConcentrationEqL,
    targetPH: benchmark.targetPH,
  },
}

const module = createAcidNeutralizationModule(fixtureConfig)

let counter = 0
function actionId(): UUID {
  counter += 1
  return `c0000000-0000-4000-8000-${String(counter).padStart(12, '0')}` as UUID
}

/**
 * Decompose a total millilitre amount into permitted aliquots.
 *
 * The fixture states the END volume; the engine only accepts the five permitted
 * aliquot sizes (§3.2). Building the sequence greedily from the largest permitted
 * size reproduces any volume that is a multiple of 0.05 mL, which every golden
 * case is.
 */
function decomposeToPermittedAliquots(totalMl: number): number[] {
  const permittedMl = [5, 1, 0.5, 0.1, 0.05]
  const aliquots: number[] = []
  let remainingMl = totalMl

  for (const size of permittedMl) {
    while (remainingMl >= size - 1e-9) {
      aliquots.push(size)
      remainingMl -= size
    }
  }

  // Anything left is smaller than the smallest permitted aliquot, which the
  // engine would reject. Failing here names the case instead of silently
  // dropping the remainder and testing the wrong volume.
  if (remainingMl > 1e-9) {
    throw new Error(
      `volume ${totalMl} mL cannot be built from permitted aliquots; ${remainingMl} mL remains`,
    )
  }
  return aliquots
}

function makeAction(
  actionType: string,
  parameters: Record<string, number | string | boolean> = {},
): SimulationAction {
  return { actionId: actionId(), actionType, parameters, unitSelections: {} }
}

/**
 * Drive the engine to the composition a golden case describes, measuring after
 * every addition so the final reading describes the final composition.
 */
function driveEngine(goldenCase: GoldenCase) {
  let state = createAcidStateFor(fixtureConfig)
  let sequence = 0

  const step = (action: SimulationAction) => {
    sequence += 1
    const context = {
      scenario: { key: 'acid-neutralization' as const, releaseId: ACID_RELEASE_ID },
      state,
      sequence,
    }
    const outcome = module.run(context, action)
    if ('nextState' in outcome === false) {
      throw new Error(
        `${goldenCase.caseId}: ${action.actionType} failed with ${outcome.code} at sequence ${sequence}`,
      )
    }
    state = outcome.nextState
  }

  const measureCycle = () => {
    step(makeAction('mix'))
    step(makeAction('wait_for_stable_reading'))
    step(makeAction('measure_ph'))
  }

  step(makeAction('select_route', { route: goldenCase.route }))
  step(makeAction('calibrate_meter'))

  // A case with no additions still needs a reading: AN-G01 measures the
  // untouched sample. Without this the loops below never run and the engine
  // reports no pH at all. The delivered sample is already homogeneous, so `mix`
  // is skipped and only the instrument steps apply.
  if (goldenCase.baseVolumeMl === 0 && goldenCase.correctionAcidVolumeMl === 0) {
    step(makeAction('wait_for_stable_reading'))
    step(makeAction('measure_ph'))
  }

  for (const aliquotMl of decomposeToPermittedAliquots(goldenCase.baseVolumeMl)) {
    step(makeAction('add_base', { volumeL: aliquotMl / 1000 }))
    measureCycle()
  }

  for (const aliquotMl of decomposeToPermittedAliquots(goldenCase.correctionAcidVolumeMl)) {
    step(makeAction('add_correction_acid', { volumeL: aliquotMl / 1000 }))
    measureCycle()
  }

  return { state, sequence }
}

describe('golden fixture integrity', () => {
  it('covers exactly the eight published cases', () => {
    expect(cases.map((goldenCase) => goldenCase.caseId)).toEqual([
      'AN-G01',
      'AN-G02',
      'AN-G03',
      'AN-G04',
      'AN-G05',
      'AN-G06',
      'AN-G07',
      'AN-G08',
    ])
  })

  it('records provenance and an independent check', () => {
    // §19: golden values must name their sources and how they were verified.
    expect(golden.provenance.independentCheck).toBe(true)
    expect(golden.provenance.sourceKeys.length).toBeGreaterThan(0)
    expect(golden.provenance.claimKeys).toContain('AN-G01-G08')
    expect(golden.modelSpecVersion).toBe(golden.fixtureVersion)
  })

  it('publishes the tolerances the solver is held to', () => {
    expect(goldenTolerances.phAbsolute).toBe(TOLERANCES.phAbsolute)
    expect(goldenTolerances.chargeResidualMolL).toBe(TOLERANCES.chargeResidualMolL)
  })
})

describe('golden cases: solver reproduces expected pH', () => {
  for (const goldenCase of cases) {
    it(`${goldenCase.caseId}: ${goldenCase.title}`, () => {
      const inputs = equilibriumInputsForBaseVolume(
        solutionConfigFrom(fixtureConfig),
        goldenCase.route,
        goldenCase.baseVolumeMl / 1000,
        goldenCase.correctionAcidVolumeMl / 1000,
      )

      const outcome = solveEquilibrium(inputs)
      expect(outcome.ok, `${goldenCase.caseId} solver failed`).toBe(true)
      if (!outcome.ok) return

      expect(Math.abs(outcome.result.simulatedPH - goldenCase.expected.pH)).toBeLessThanOrEqual(
        goldenTolerances.phAbsolute,
      )
      expect(Math.abs(outcome.result.chargeBalanceResidualMolL)).toBeLessThanOrEqual(
        goldenTolerances.chargeResidualMolL,
      )
    })
  }
})

describe('golden cases: engine reaches the same pH through real actions', () => {
  for (const goldenCase of cases) {
    it(`${goldenCase.caseId}: driven end to end`, () => {
      const { state } = driveEngine(goldenCase)

      expect(
        state.modelValid,
        `${goldenCase.caseId} model invalid: ${state.invalidReasonCodes}`,
      ).toBe(true)
      expect(state.lastMeasuredPH, `${goldenCase.caseId} produced no reading`).not.toBeNull()
      expect(
        Math.abs((state.lastMeasuredPH as number) - goldenCase.expected.pH),
      ).toBeLessThanOrEqual(goldenTolerances.phAbsolute)
      expect(state.baseVolumeL * 1000).toBeCloseTo(goldenCase.baseVolumeMl, 6)
      expect(state.correctionAcidVolumeL * 1000).toBeCloseTo(
        goldenCase.correctionAcidVolumeMl,
        6,
      )
    })
  }
})

describe('golden cases: carbonate speciation', () => {
  it('AN-G05: two nominal equivalents stay mostly CO2* in a closed system', () => {
    const goldenCase = cases.find((candidate) => candidate.caseId === 'AN-G05')
    expect(goldenCase).toBeDefined()
    if (!goldenCase) return

    const inputs = equilibriumInputsForBaseVolume(
      solutionConfigFrom(fixtureConfig),
      'sodium-carbonate',
      goldenCase.baseVolumeMl / 1000,
    )
    const outcome = solveEquilibrium(inputs)
    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return

    const fractions = outcome.result.carbonFractions
    expect(fractions).toBeDefined()
    if (!fractions) return

    expect(outcome.result.totalInorganicCarbonMolL).toBeCloseTo(
      goldenCase.expected.totalInorganicCarbonMolL as number,
      9,
    )
    expect(fractions.co2Star).toBeCloseTo(goldenCase.expected.alpha0 as number, 5)
    expect(fractions.bicarbonate).toBeCloseTo(goldenCase.expected.alpha1 as number, 6)
    expect(fractions.carbonate).toBeCloseTo(goldenCase.expected.alpha2 as number, 9)

    const alphaSum = fractions.co2Star + fractions.bicarbonate + fractions.carbonate
    expect(Math.abs(alphaSum - 1)).toBeLessThanOrEqual(goldenTolerances.alphaSumAbsolute)
  })

  it('AN-G06: alpha1 + 2*alpha2 equals the charge-balance ratio', () => {
    const goldenCase = cases.find((candidate) => candidate.caseId === 'AN-G06')
    expect(goldenCase).toBeDefined()
    if (!goldenCase) return

    const inputs = equilibriumInputsForBaseVolume(
      solutionConfigFrom(fixtureConfig),
      'sodium-carbonate',
      goldenCase.baseVolumeMl / 1000,
    )
    const outcome = solveEquilibrium(inputs)
    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return

    const fractions = outcome.result.carbonFractions
    const totalCarbonMolL = outcome.result.totalInorganicCarbonMolL
    expect(fractions).toBeDefined()
    expect(totalCarbonMolL).toBeDefined()
    if (!fractions || totalCarbonMolL === undefined) return

    // This is the independent cross-check the fixture promises: the bound base
    // must equal (nNa - nCl)/CT, computed from moles rather than from the alphas.
    const boundBaseFromAlphas = fractions.bicarbonate + 2 * fractions.carbonate
    expect(boundBaseFromAlphas).toBeCloseTo(
      goldenCase.expected.alpha1PlusTwoAlpha2 as number,
      6,
    )

    const boundBaseFromCharge =
      (inputs.sodiumMoles - inputs.chlorideMoles) / (totalCarbonMolL * inputs.totalVolumeL)
    expect(Math.abs(boundBaseFromAlphas - boundBaseFromCharge)).toBeLessThanOrEqual(
      goldenTolerances.alphaAbsolute,
    )
    expect(totalCarbonMolL).toBeCloseTo(
      goldenCase.expected.totalInorganicCarbonMolL as number,
      9,
    )
  })

  it('carbon fractions are internally consistent at the golden pH values', () => {
    // Recomputing alphas from the solved pH must give the same distribution the
    // solver used, which catches a solver that stores alphas from a different
    // iteration than the one that produced its pH.
    for (const goldenCase of cases) {
      if (goldenCase.route !== 'sodium-carbonate') continue
      const inputs = equilibriumInputsForBaseVolume(
        solutionConfigFrom(fixtureConfig),
        goldenCase.route,
        goldenCase.baseVolumeMl / 1000,
      )
      const outcome = solveEquilibrium(inputs)
      expect(outcome.ok).toBe(true)
      if (!outcome.ok) continue

      const fromPh = carbonFractions(outcome.result.hydrogenMolL)
      expect(fromPh.co2Star).toBeCloseTo(outcome.result.carbonFractions?.co2Star as number, 12)
      expect(fromPh.bicarbonate).toBeCloseTo(
        outcome.result.carbonFractions?.bicarbonate as number,
        12,
      )
      expect(fromPh.carbonate).toBeCloseTo(
        outcome.result.carbonFractions?.carbonate as number,
        12,
      )
    }
  })
})

describe('golden case AN-G08: cost and safety through the engine', () => {
  it('charges the correction dose and fires only the correction penalty', () => {
    const goldenCase = cases.find((candidate) => candidate.caseId === 'AN-G08')
    expect(goldenCase).toBeDefined()
    if (!goldenCase) return

    const { state, sequence } = driveEngine(goldenCase)

    // Cost: reagent mmol, not equivalents. 27.50 mL NaOH at 0.01000 mol/L is
    // 0.275 mmol and 2.50 mL HCl is 0.025 mmol, so rawCost = 0.300 against a
    // 0.2500 mmol denominator.
    const denominatorMmol = initialHclMmolFor(fixtureConfig)
    expect(denominatorMmol).toBeCloseTo(0.25, 9)
    const costIndex = computeRelativeCostIndex(state, denominatorMmol)
    expect(costIndex).toBeCloseTo(goldenCase.expected.relativeCostIndex as number, 9)

    // Egross counts the correction: excluding it would reward overshooting.
    expect(computeEgrossMmolEq(state)).toBeCloseTo(
      goldenCase.expected.grossEquivalentsMmolEq as number,
      9,
    )

    // Safety: base equivalents are EXACTLY 1.1 x E*, and the test is strict, so
    // only the correction penalty fires. Getting this boundary wrong yields 65.
    const eStar = resolveTargetEquivalentsMmolEq(fixtureConfig, 'naoh')
    expect(eStar).not.toBeNull()
    const { penalties, safetyIndex } = computeSafetyPenalties(state, {
      targetEquivalentsMmolEq: eStar as number,
      sequence,
      modelEvaluable: true,
    })

    expect(penalties.map((penalty) => penalty.code)).toEqual(goldenCase.expected.penaltyCodes)
    expect(safetyIndex).toBe(goldenCase.expected.safetyIndex)
  })

  it('fires the excess-base penalty just past the boundary', () => {
    // The complementary case: 27.50 mL does not fire the excess penalty, so a run
    // one fine aliquot further on must. Without this the strict comparison could
    // be replaced by a much higher threshold and AN-G08 would still pass.
    let state = createAcidStateFor(fixtureConfig)
    let sequence = 0
    const step = (action: SimulationAction) => {
      sequence += 1
      const context = {
        scenario: { key: 'acid-neutralization' as const, releaseId: ACID_RELEASE_ID },
        state,
        sequence,
      }
      const outcome = module.run(context, action)
      if ('nextState' in outcome === false) throw new Error(`failed: ${outcome.code}`)
      state = outcome.nextState
    }

    step(makeAction('select_route', { route: 'naoh' }))
    step(makeAction('calibrate_meter'))
    // 28.00 mL = 27.50 mL plus one 0.50 mL aliquot, i.e. just over 1.1 x E*.
    for (const aliquotMl of decomposeToPermittedAliquots(28.0)) {
      step(makeAction('add_base', { volumeL: aliquotMl / 1000 }))
      step(makeAction('mix'))
      step(makeAction('wait_for_stable_reading'))
      step(makeAction('measure_ph'))
    }

    const eStar = resolveTargetEquivalentsMmolEq(fixtureConfig, 'naoh') as number
    const { penalties, safetyIndex } = computeSafetyPenalties(state, {
      targetEquivalentsMmolEq: eStar,
      sequence,
      modelEvaluable: true,
    })

    // Two penalties, not one: 28.00 mL of NaOH puts pH* near 10.7, outside the
    // 6-8 completion band, so FINAL_PH_OUTSIDE_6_TO_8 fires alongside the
    // excess-base penalty. Safety is 100 - 20 - 30 = 50.
    expect(penalties.map((penalty) => penalty.code)).toEqual([
      'EXCESS_BASE_OVER_110_PERCENT_TARGET',
      'FINAL_PH_OUTSIDE_6_TO_8',
    ])
    expect(safetyIndex).toBe(50)
  })
})
