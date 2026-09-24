import { describe, expect, it } from 'vitest'

import type {
  DomainError,
  SimulationAction,
  SimulationResult,
  UUID,
} from '@/domain/process/contracts.js'
import { stateHash } from '@/domain/process/hashing.js'
import {
  createAcidNeutralizationModule,
  benchmarkScenarioConfig,
  createAcidStateFor,
  ACID_RELEASE_ID,
} from '@/domain/experiments/acid-neutralization/engine.js'
import {
  computeReagentMmol,
  computeRelativeCostIndex,
  computeSafetyPenalties,
  computeEgrossMmolEq,
  initialHclMmolFor,
  resolveTargetEquivalentsMmolEq,
} from '@/domain/experiments/acid-neutralization/resources.js'
import { evaluateAcidScoreBreakdown } from '@/domain/experiments/acid-neutralization/scoring.js'
import { TOLERANCES, SPEC_PUBLISHED_BENCHMARK_E_STAR_MMOL_EQ } from '@/domain/experiments/acid-neutralization/constants.js'
import type {
  AcidNeutralizationState,
  AcidRoute,
} from '@/domain/experiments/acid-neutralization/state.js'

/**
 * Engine-level acceptance tests.
 *
 * tests/unit/acid-equilibrium-golden.test.ts drives the SOLVERS directly. This
 * file drives the ENGINE through real action sequences, which is the only way to
 * prove the state machine: aliquot accumulation, the §5.2 reading-invalidation
 * rule, measurement freshness, penalty commit points and the cost/safety
 * indices all live in transitions, not in the equilibrium math.
 *
 * Golden pH* values here come from docs/experiments/acid-neutralization-spec.md
 * §15 / docs/verification-and-acceptance.md §5.1 and were reproduced
 * independently before the engine was written.
 */

const module = createAcidNeutralizationModule()
const config = benchmarkScenarioConfig()

let actionCounter = 0

function actionId(): UUID {
  actionCounter += 1
  return `c0000000-0000-4000-8000-${String(actionCounter).padStart(12, '0')}` as UUID
}

function makeAction(
  actionType: string,
  parameters: Record<string, number | string | boolean> = {},
): SimulationAction {
  return {
    actionId: actionId(),
    actionType,
    parameters,
    unitSelections: {},
  }
}

/**
 * Apply one action, asserting it was accepted. Failing here rather than
 * returning an error keeps a broken precondition pointing at the action that
 * broke it instead of surfacing later as a wrong pH.
 */
function apply(
  state: AcidNeutralizationState,
  sequence: number,
  action: SimulationAction,
): { state: AcidNeutralizationState; result: SimulationResult<AcidNeutralizationState> } {
  const context = {
    scenario: { key: 'acid-neutralization' as const, releaseId: ACID_RELEASE_ID },
    state,
    sequence,
  }

  const validationError = module.validateAction(context, action)
  if (validationError) {
    throw new Error(
      `action ${action.actionType} rejected at sequence ${sequence}: ${validationError.code} (${validationError.messageKey})`,
    )
  }

  const outcome = module.run(context, action)
  if ('nextState' in outcome === false) {
    const error = outcome as DomainError
    throw new Error(`action ${action.actionType} failed: ${error.code}`)
  }

  return { state: outcome.nextState, result: outcome }
}

/** Apply and expect a specific rejection code, asserting nothing was committed. */
function applyExpectingRejection(
  state: AcidNeutralizationState,
  sequence: number,
  action: SimulationAction,
): DomainError {
  const context = {
    scenario: { key: 'acid-neutralization' as const, releaseId: ACID_RELEASE_ID },
    state,
    sequence,
  }

  const outcome = module.run(context, action)
  if ('nextState' in outcome) {
    throw new Error(
      `expected ${action.actionType} to be rejected, but it committed (phase ${outcome.nextState.phase})`,
    )
  }
  return outcome as DomainError
}

/**
 * Drive one full titration: select route, calibrate, then add/mix/wait/measure
 * per aliquot, and complete.
 *
 * The four-step cycle per aliquot is not ceremony — §5.2 invalidates the reading
 * on every addition, so each dose must be mixed, stabilized and measured again.
 * Skipping it is exactly the mistake this test exists to catch.
 */
function runTitration(route: AcidRoute, aliquotsMl: number[]): {
  state: AcidNeutralizationState
  sequence: number
} {
  let state = createAcidStateFor(config)
  let sequence = 0

  const step = (action: SimulationAction) => {
    sequence += 1
    state = apply(state, sequence, action).state
  }

  step(makeAction('select_route', { route }))
  step(makeAction('calibrate_meter'))

  for (const volumeMl of aliquotsMl) {
    step(makeAction('add_base', { volumeL: volumeMl / 1000 }))
    step(makeAction('mix'))
    step(makeAction('wait_for_stable_reading'))
    step(makeAction('measure_ph'))
  }

  step(makeAction('complete'))
  return { state, sequence }
}

/** Add base without the mix/wait/measure cycle, for precondition tests. */
function addBaseOnly(route: AcidRoute, aliquotsMl: number[]): AcidNeutralizationState {
  let state = createAcidStateFor(config)
  let sequence = 0

  const step = (action: SimulationAction) => {
    sequence += 1
    state = apply(state, sequence, action).state
  }

  step(makeAction('select_route', { route }))
  step(makeAction('calibrate_meter'))
  for (const volumeMl of aliquotsMl) {
    step(makeAction('add_base', { volumeL: volumeMl / 1000 }))
  }
  return state
}

/** Measure the current composition: mix, wait for stability, read. */
function measureCurrent(
  state: AcidNeutralizationState,
  sequenceRef: { value: number },
): AcidNeutralizationState {
  let current = state
  const step = (action: SimulationAction) => {
    sequenceRef.value += 1
    current = apply(current, sequenceRef.value, action).state
  }
  step(makeAction('mix'))
  step(makeAction('wait_for_stable_reading'))
  step(makeAction('measure_ph'))
  return current
}

describe('acid engine: golden cases driven through real actions', () => {
  it('AN-G01: fresh sample measures pH* 2.00000 before any base', () => {
    let state = createAcidStateFor(config)
    const seq = { value: 0 }
    const step = (action: SimulationAction) => {
      seq.value += 1
      state = apply(state, seq.value, action).state
    }

    step(makeAction('select_route', { route: 'naoh' }))
    step(makeAction('calibrate_meter'))
    // No base added, so the delivered sample is already homogeneous and `mix`
    // is refused (nothing to mix). The reading still needs the meter calibrated
    // and the reading declared stable — those are instrument steps, not stirring.
    state = apply(state, ++seq.value, makeAction('wait_for_stable_reading')).state
    state = apply(state, ++seq.value, makeAction('measure_ph')).state

    expect(state.lastMeasuredPH).not.toBeNull()
    expect(Math.abs((state.lastMeasuredPH as number) - 2.0)).toBeLessThanOrEqual(
      TOLERANCES.phAbsolute,
    )
  })

  it('AN-G03: NaOH to 25.00 mL reaches pH* 6.99500 and completes', () => {
    // 25.00 mL from the permitted aliquot set: 5 x 5.00 mL.
    const { state } = runTitration('naoh', [5, 5, 5, 5, 5])

    expect(state.phase).toBe('completed')
    expect(state.modelValid).toBe(true)
    expect(state.lastMeasuredPH).not.toBeNull()
    expect(Math.abs((state.lastMeasuredPH as number) - 6.995)).toBeLessThanOrEqual(
      TOLERANCES.phAbsolute,
    )
  })

  it('AN-G07: Ca(OH)2 to 25.00 mL lands at pH* 6.98637, not 6.995', () => {
    const { state } = runTitration('calcium-hydroxide', [5, 5, 5, 5, 5])

    // The CaOH+ complex consumes hydroxide, so stoichiometric Ca(OH)2 does NOT
    // reach the NaOH value. An engine that ignored hydrolysis would report 6.995
    // here and still pass AN-G04.
    expect(Math.abs((state.lastMeasuredPH as number) - 6.98637)).toBeLessThanOrEqual(
      TOLERANCES.phAbsolute,
    )
  })

  it('AN-G05: Na2CO3 to 25.00 mL sits at pH* 4.47992 despite two nominal equivalents', () => {
    const { state } = runTitration('sodium-carbonate', [5, 5, 5, 5, 5])

    expect(Math.abs((state.lastMeasuredPH as number) - 4.47992)).toBeLessThanOrEqual(
      TOLERANCES.phAbsolute,
    )
    // The learner must be told why, or the result reads as a bug (§9.3).
    expect(state.totalInorganicCarbonMoles).toBeGreaterThan(0)
  })

  it('AN-G06: Na2CO3 needs ~42.25 mL to reach the target pH*', () => {
    // 42.25 mL = 8 x 5.00 + 4 x 0.50 + 5 x 0.05
    const { state } = runTitration('sodium-carbonate', [
      5, 5, 5, 5, 5, 5, 5, 5,
      0.5, 0.5, 0.5, 0.5,
      0.05, 0.05, 0.05, 0.05, 0.05,
    ])

    expect(state.baseVolumeL * 1000).toBeCloseTo(42.25, 6)
    expect(Math.abs((state.lastMeasuredPH as number) - 6.99921)).toBeLessThanOrEqual(
      TOLERANCES.phAbsolute,
    )
  })

  it('AN-G04: Ca(OH)2 to 27.50 mL reaches pH* 10.64984', () => {
    // 27.50 mL = 5 x 5.00 + 5 x 0.50
    const { state } = runTitration('calcium-hydroxide', [
      5, 5, 5, 5, 5,
      0.5, 0.5, 0.5, 0.5, 0.5,
    ])

    expect(Math.abs((state.lastMeasuredPH as number) - 10.64984)).toBeLessThanOrEqual(
      TOLERANCES.phAbsolute,
    )
  })

  it('AN-G08: overshoot then HCl correction returns to pH* 6.99500', () => {
    let state = createAcidStateFor(config)
    const seq = { value: 0 }
    const step = (action: SimulationAction) => {
      seq.value += 1
      state = apply(state, seq.value, action).state
    }

    step(makeAction('select_route', { route: 'naoh' }))
    step(makeAction('calibrate_meter'))

    // Overshoot to 27.50 mL (5 x 5.00 + 5 x 0.50), measuring as we go.
    for (const volumeMl of [5, 5, 5, 5, 5, 0.5, 0.5, 0.5, 0.5, 0.5]) {
      step(makeAction('add_base', { volumeL: volumeMl / 1000 }))
      step(makeAction('mix'))
      step(makeAction('wait_for_stable_reading'))
      step(makeAction('measure_ph'))
    }

    // Must be above the target band, otherwise correction is not the right
    // recovery branch (§12).
    expect((state.lastMeasuredPH as number) - 6.995).toBeGreaterThan(0.2)

    // Correction: 2.50 mL of 0.01000 mol/L HCl = 5 x 0.50 mL.
    for (const volumeMl of [0.5, 0.5, 0.5, 0.5, 0.5]) {
      step(makeAction('add_correction_acid', { volumeL: volumeMl / 1000 }))
      step(makeAction('mix'))
      step(makeAction('wait_for_stable_reading'))
      step(makeAction('measure_ph'))
    }
    step(makeAction('complete'))

    expect(state.phase).toBe('completed')
    expect(Math.abs((state.lastMeasuredPH as number) - 6.995)).toBeLessThanOrEqual(
      TOLERANCES.phAbsolute,
    )

    // §13.4: correction reagent is charged, so the cost index rises above 1.
    const denominatorMmol = initialHclMmolFor(config)
    expect(denominatorMmol).toBeCloseTo(0.25, 6)
    const costIndex = computeRelativeCostIndex(state, denominatorMmol)
    expect(costIndex).not.toBeNull()
    expect(costIndex as number).toBeCloseTo(1.2, 5)

    // §13.5: the correction penalty is 15 points -> safety 85. The excess-base
    // penalty must NOT fire: base equivalents are exactly 1.1 x E*, and the
    // comparison is strict.
    const eStar = resolveTargetEquivalentsMmolEq(config, 'naoh')
    expect(eStar).not.toBeNull()
    const { penalties, safetyIndex } = computeSafetyPenalties(state, {
      targetEquivalentsMmolEq: eStar as number,
      sequence: seq.value,
      modelEvaluable: true,
    })
    expect(penalties.map((p) => p.code)).toEqual(['CORRECTION_ACID_USED'])
    expect(safetyIndex).toBe(85)
  })
})

describe('acid engine: state transition invariants', () => {
  it('accumulates aliquots and advances the composition revision per addition', () => {
    const state = addBaseOnly('naoh', [5, 5, 0.5])

    expect(state.baseVolumeL * 1000).toBeCloseTo(10.5, 9)
    expect(state.compositionRevision).toBe(3)
    expect(state.aliquotHistory).toHaveLength(3)
    expect(state.aliquotHistory.map((a) => a.reagent)).toEqual(['base', 'base', 'base'])
    // Chloride is unchanged by base addition; sodium tracks the NaOH dose.
    expect(state.chlorideMoles).toBeCloseTo(0.025 * 0.01, 12)
    expect(state.sodiumMoles).toBeCloseTo(0.0105 * 0.01, 12)
  })

  it('records a correction addition as correction-acid, not as the base route', () => {
    let state = createAcidStateFor(config)
    const seq = { value: 0 }
    const step = (action: SimulationAction) => {
      seq.value += 1
      state = apply(state, seq.value, action).state
    }

    step(makeAction('select_route', { route: 'naoh' }))
    step(makeAction('calibrate_meter'))
    // Overshoot so the correction branch is legitimate.
    for (const volumeMl of [5, 5, 5, 5, 5, 0.5, 0.5, 0.5, 0.5, 0.5]) {
      step(makeAction('add_base', { volumeL: volumeMl / 1000 }))
      step(makeAction('mix'))
      step(makeAction('wait_for_stable_reading'))
      step(makeAction('measure_ph'))
    }
    step(makeAction('add_correction_acid', { volumeL: 0.0005 }))

    const last = state.aliquotHistory.at(-1)
    expect(last).toBeDefined()
    expect(last?.reagent).toBe('correction-acid')
    // The route still names the base route in effect — that is the point of the
    // separate discriminator: filtering on `route` alone would charge this HCl
    // dose to the NaOH coefficient.
    expect(last?.route).toBe('naoh')
    expect(state.correctionAcidVolumeL * 1000).toBeCloseTo(0.5, 9)
    expect(state.directionChangeCount).toBe(1)

    const mmol = computeReagentMmol(state)
    expect(mmol.correctionHcl).toBeCloseTo(0.005, 9)
    expect(mmol.naoh).toBeCloseTo(0.275, 9)
  })

  it('invalidates the previous reading on every composition change (§5.2)', () => {
    let state = createAcidStateFor(config)
    const seq = { value: 0 }
    const step = (action: SimulationAction) => {
      seq.value += 1
      state = apply(state, seq.value, action).state
    }

    step(makeAction('select_route', { route: 'naoh' }))
    step(makeAction('calibrate_meter'))
    step(makeAction('add_base', { volumeL: 0.005 }))
    step(makeAction('mix'))
    step(makeAction('wait_for_stable_reading'))
    step(makeAction('measure_ph'))

    const revisionAfterMeasurement = state.compositionRevision
    expect(state.lastMeasuredPH).not.toBeNull()
    expect(state.lastMeasuredCompositionRevision).toBe(revisionAfterMeasurement)

    // One more dose must wipe the reading entirely.
    step(makeAction('add_base', { volumeL: 0.005 }))
    expect(state.lastMeasuredPH).toBeNull()
    expect(state.lastMeasuredCompositionRevision).toBeNull()
    expect(state.readingStable).toBe(false)
    expect(state.mixedSinceLastAddition).toBe(false)
    expect(state.equilibrium).toBeNull()
    expect(state.modelValid).toBe(false)
    expect(state.compositionRevision).toBe(revisionAfterMeasurement + 1)
  })

  it('refuses to complete on a stale measurement', () => {
    let state = createAcidStateFor(config)
    const seq = { value: 0 }
    const step = (action: SimulationAction) => {
      seq.value += 1
      state = apply(state, seq.value, action).state
    }

    step(makeAction('select_route', { route: 'naoh' }))
    step(makeAction('calibrate_meter'))
    // 25.00 mL from the permitted aliquot set {0.05, 0.10, 0.50, 1.00, 5.00} mL:
    // a single 25 mL dose is not a permitted aliquot, so it is built from 5 x 5 mL.
    for (const volumeMl of [5, 5, 5, 5, 5]) {
      step(makeAction('add_base', { volumeL: volumeMl / 1000 }))
      step(makeAction('mix'))
      step(makeAction('wait_for_stable_reading'))
    }
    step(makeAction('measure_ph'))

    // Dose again WITHOUT re-measuring: the stored reading now describes an older
    // composition, so completing would score a beaker that no longer exists.
    step(makeAction('add_base', { volumeL: 0.0005 }))
    // Re-mix and stabilize so the only remaining defect is staleness itself.
    step(makeAction('mix'))
    step(makeAction('wait_for_stable_reading'))

    expect(state.lastMeasuredPH).toBeNull()
    const error = applyExpectingRejection(state, seq.value + 1, makeAction('complete'))
    expect(error.code).toBe('READING_NOT_STABLE')
  })

  it('refuses measurement before calibration and before a stable reading', () => {
    let state = createAcidStateFor(config)
    const seq = { value: 0 }
    const step = (action: SimulationAction) => {
      seq.value += 1
      state = apply(state, seq.value, action).state
    }

    step(makeAction('select_route', { route: 'naoh' }))
    expect(applyExpectingRejection(state, seq.value + 1, makeAction('measure_ph')).code).toBe(
      'METER_NOT_CALIBRATED',
    )

    step(makeAction('calibrate_meter'))
    step(makeAction('add_base', { volumeL: 0.005 }))
    expect(applyExpectingRejection(state, seq.value + 1, makeAction('measure_ph')).code).toBe(
      'SAMPLE_NOT_MIXED',
    )

    step(makeAction('mix'))
    expect(applyExpectingRejection(state, seq.value + 1, makeAction('measure_ph')).code).toBe(
      'READING_NOT_STABLE',
    )
  })

  it('locks the route once base has been added (§12 ROUTE_LOCKED)', () => {
    const state = addBaseOnly('naoh', [5])
    const error = applyExpectingRejection(
      state,
      state.aliquotHistory.length + 3,
      makeAction('select_route', { route: 'sodium-carbonate' }),
    )
    expect(error.code).toBe('ROUTE_LOCKED')
    expect(error.category).toBe('precondition_failed')
  })

  it('rejects an aliquot outside the permitted set', () => {
    let state = createAcidStateFor(config)
    const seq = { value: 0 }
    const step = (action: SimulationAction) => {
      seq.value += 1
      state = apply(state, seq.value, action).state
    }
    step(makeAction('select_route', { route: 'naoh' }))
    step(makeAction('calibrate_meter'))

    // 3.00 mL is not in {0.05, 0.10, 0.50, 1.00, 5.00} mL (§3.2).
    const error = applyExpectingRejection(
      state,
      seq.value + 1,
      makeAction('add_base', { volumeL: 0.003 }),
    )
    expect(error.code).toBe('ALIQUOT_NOT_PERMITTED')
    expect(error.category).toBe('invalid_input')
    // Rejected actions mutate nothing (§13.2).
    expect(state.baseVolumeL).toBe(0)
    expect(state.aliquotHistory).toHaveLength(0)
  })

  it('refuses a correction while the sample is still below target', () => {
    let state = createAcidStateFor(config)
    const seq = { value: 0 }
    const step = (action: SimulationAction) => {
      seq.value += 1
      state = apply(state, seq.value, action).state
    }

    step(makeAction('select_route', { route: 'naoh' }))
    step(makeAction('calibrate_meter'))
    // 10.00 mL NaOH: well below equivalence, so pH* is still acidic.
    step(makeAction('add_base', { volumeL: 0.005 }))
    step(makeAction('add_base', { volumeL: 0.005 }))
    state = measureCurrent(state, seq)
    expect((state.lastMeasuredPH as number) - 6.995).toBeLessThan(0.2)

    const error = applyExpectingRejection(
      state,
      seq.value + 1,
      makeAction('add_correction_acid', { volumeL: 0.0005 }),
    )
    expect(error.code).toBe('TARGET_NOT_HIGH')
    expect(state.correctionAcidVolumeL).toBe(0)
  })

  it('rejects an action type outside the release', () => {
    const state = createAcidStateFor(config)
    const error = applyExpectingRejection(state, 1, makeAction('pour_unknown_reagent'))
    expect(error.code).toBe('UNKNOWN_ACTION_TYPE')
  })

  it('refuses a second mix with nothing new to mix', () => {
    let state = createAcidStateFor(config)
    const seq = { value: 0 }
    const step = (action: SimulationAction) => {
      seq.value += 1
      state = apply(state, seq.value, action).state
    }

    step(makeAction('select_route', { route: 'naoh' }))
    step(makeAction('calibrate_meter'))
    step(makeAction('add_base', { volumeL: 0.005 }))
    step(makeAction('mix'))
    // Nothing has been added since, so a second mix has no chemical meaning.
    expect(applyExpectingRejection(state, seq.value + 1, makeAction('mix')).code).toBe(
      'SAMPLE_NOT_MIXED',
    )
  })
})

describe('acid engine: determinism and replay', () => {
  it('produces an identical state hash for the same action chain', () => {
    const first = runTitration('naoh', [5, 5, 5, 5, 5])
    const second = runTitration('naoh', [5, 5, 5, 5, 5])

    expect(stateHash(first.state)).toBe(stateHash(second.state))
    expect(first.state.lastMeasuredPH).toBe(second.state.lastMeasuredPH)
  })

  it('produces a different hash for a different action chain', () => {
    const stoichiometric = runTitration('naoh', [5, 5, 5, 5, 5])
    const overshoot = runTitration('naoh', [5, 5, 5, 5, 5, 0.5])

    expect(stateHash(stoichiometric.state)).not.toBe(stateHash(overshoot.state))
  })

  it('keeps state serializable without precision loss through JSON', () => {
    const { state } = runTitration('calcium-hydroxide', [5, 5, 5, 5, 5])
    const roundTripped = JSON.parse(JSON.stringify(state)) as AcidNeutralizationState

    // State must survive a JSON round trip, because that is how it is stored and
    // how a guest attempt is exported (§17). Hashing the round trip proves no
    // precision was lost in a way that would change the model.
    expect(stateHash(roundTripped)).toBe(stateHash(state))
    expect(roundTripped.lastMeasuredPH).toBe(state.lastMeasuredPH)
  })
})

describe('acid engine: E* derivation matches the published table', () => {
  it('reproduces spec §14.3 benchmark E* for every route', () => {
    // The published table is an OUTPUT of inverting the model at target 6.995,
    // not an input. Agreement here pins §14.3 to §7-§9: if the solvers changed,
    // this would break even though every golden pH still passed.
    for (const route of ['naoh', 'calcium-hydroxide', 'sodium-carbonate'] as const) {
      const derived = resolveTargetEquivalentsMmolEq(config, route)
      expect(derived, `E* for ${route}`).not.toBeNull()
      expect(Math.abs((derived as number) - SPEC_PUBLISHED_BENCHMARK_E_STAR_MMOL_EQ[route])).toBeLessThan(
        1e-6,
      )
    }
  })

  it('derives a distinct E* for an exploration target', () => {
    // §3.5: exploration targets 6.5-7.5 are in scope, and each needs its own E*.
    // A lookup table would return the benchmark value here and mis-score the run.
    const explorationConfig = {
      ...config,
      constants: { ...config.constants, targetPH: 7.2 },
    }
    const benchmarkEStar = resolveTargetEquivalentsMmolEq(config, 'naoh')
    const explorationEStar = resolveTargetEquivalentsMmolEq(explorationConfig, 'naoh')

    expect(explorationEStar).not.toBeNull()
    expect(explorationEStar).not.toBe(benchmarkEStar)
    expect(explorationEStar as number).toBeGreaterThan(benchmarkEStar as number)
  })
})

describe('acid engine: scoring through real runs', () => {
  it('scores a clean stoichiometric NaOH run as a success', () => {
    const { state } = runTitration('naoh', [5, 5, 5, 5, 5])
    const eStar = resolveTargetEquivalentsMmolEq(config, 'naoh') as number
    const breakdown = evaluateAcidScoreBreakdown(state, eStar)

    expect(breakdown.success).toBe(true)
    expect(breakdown.evaluable).toBe(true)
    expect(breakdown.overallScore).not.toBeNull()
    // Final aliquot was 5.00 mL, so the "fine final aliquot" criterion fails and
    // the process score cannot be a full 20.
    expect(breakdown.processScore).toBeLessThan(20)
    expect(breakdown.phScore).toBeCloseTo(60, 5)
  })

  it('awards full process score when the last aliquot is fine and no correction was used', () => {
    // Build 25.00 mL entirely from permitted aliquots {0.05, 0.10, 0.50, 1.00,
    // 5.00} mL and END on a fine 0.50 mL dose. A single 4 mL dose is not
    // permitted, and ending coarse would fail the criterion under test.
    // 5+5+5+5+1+1+1+1+0.5+0.5 = 25.00 mL, i.e. exact stoichiometry.
    const { state } = runTitration('naoh', [5, 5, 5, 5, 1, 1, 1, 1, 0.5, 0.5])
    const eStar = resolveTargetEquivalentsMmolEq(config, 'naoh') as number
    const breakdown = evaluateAcidScoreBreakdown(state, eStar)

    const fineAliquot = breakdown.processCriteria.find(
      (criterion) => criterion.key === 'process.final-aliquot-fine',
    )
    expect(fineAliquot?.met).toBe(true)
    expect(fineAliquot?.actual).toBe(0.5)

    const noCorrection = breakdown.processCriteria.find(
      (criterion) => criterion.key === 'process.no-correction-acid',
    )
    expect(noCorrection?.met).toBe(true)
    expect(breakdown.processScore).toBe(20)
  })

  it('reports gross equivalents including the correction dose (§14.3)', () => {
    let state = createAcidStateFor(config)
    const seq = { value: 0 }
    const step = (action: SimulationAction) => {
      seq.value += 1
      state = apply(state, seq.value, action).state
    }

    step(makeAction('select_route', { route: 'naoh' }))
    step(makeAction('calibrate_meter'))
    for (const volumeMl of [5, 5, 5, 5, 5, 0.5, 0.5, 0.5, 0.5, 0.5]) {
      step(makeAction('add_base', { volumeL: volumeMl / 1000 }))
      step(makeAction('mix'))
      step(makeAction('wait_for_stable_reading'))
      step(makeAction('measure_ph'))
    }
    for (const volumeMl of [0.5, 0.5, 0.5, 0.5, 0.5]) {
      step(makeAction('add_correction_acid', { volumeL: volumeMl / 1000 }))
      step(makeAction('mix'))
      step(makeAction('wait_for_stable_reading'))
      step(makeAction('measure_ph'))
    }
    step(makeAction('complete'))

    // Egross counts base AND correction: excluding the correction would reward
    // overshooting, since the overshoot is what made the correction necessary.
    const egross = computeEgrossMmolEq(state)
    expect(egross).toBeCloseTo(0.3, 9)
  })

  it('returns N/A rather than 0 when the model is not evaluable', () => {
    // A run that never completed a valid measurement must not report a cost or
    // safety index of 0, which would read as "free" and "maximally safe".
    const state = addBaseOnly('naoh', [5])
    const eStar = resolveTargetEquivalentsMmolEq(config, 'naoh') as number
    const breakdown = evaluateAcidScoreBreakdown(state, eStar)

    expect(state.modelValid).toBe(false)
    expect(breakdown.resourceScore).toBeNull()
    expect(breakdown.overallScore).toBeNull()
    expect(breakdown.evaluable).toBe(false)
    expect(breakdown.success).toBe(false)
  })
})
