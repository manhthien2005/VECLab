import { describe, expect, it } from 'vitest'
import {
  maxBaseVolumeLForRoute,
  createAcidScenarioConfig,
} from '@/domain/experiments/acid-neutralization/setup.js'
import {
  createAcidNeutralizationModule,
} from '@/domain/experiments/acid-neutralization/engine.js'
import {
  validateVolumeCap,
} from '@/domain/experiments/acid-neutralization/validation.js'
import type { SimulationAction } from '@/domain/process/contracts.js'
import { newUUID } from '@/shared/ids.js'

describe('Dynamic Volume Caps by Route and Sample Volume', () => {
  it('implements exact route-specific scaling rules per spec §3.1', () => {
    // 25 mL benchmark sample
    expect(maxBaseVolumeLForRoute('naoh', 0.025)).toBeCloseTo(0.030, 9)
    expect(maxBaseVolumeLForRoute('calcium-hydroxide', 0.025)).toBeCloseTo(0.030, 9)
    expect(maxBaseVolumeLForRoute('sodium-carbonate', 0.025)).toBeCloseTo(0.050, 9)

    // 50 mL maximum exploration sample
    expect(maxBaseVolumeLForRoute('naoh', 0.050)).toBeCloseTo(0.060, 9)
    expect(maxBaseVolumeLForRoute('calcium-hydroxide', 0.050)).toBeCloseTo(0.060, 9)
    expect(maxBaseVolumeLForRoute('sodium-carbonate', 0.050)).toBeCloseTo(0.100, 9)

    // 35 mL interior sample
    expect(maxBaseVolumeLForRoute('naoh', 0.035)).toBeCloseTo(1.2 * 0.035, 9)
    expect(maxBaseVolumeLForRoute('calcium-hydroxide', 0.035)).toBeCloseTo(1.2 * 0.035, 9)
    expect(maxBaseVolumeLForRoute('sodium-carbonate', 0.035)).toBeCloseTo(2.0 * 0.035, 9)
  })

  it('preserves exact 30.0 mL cap for 25 mL benchmark NaOH attempt', () => {
    const config = createAcidScenarioConfig() // default benchmark
    const engine = createAcidNeutralizationModule(config)
    let state = engine.createInitialState()

    // Select naoh route
    const selectRouteAction: SimulationAction = {
      actionId: newUUID(),
      actionType: 'select_route',
      parameters: { route: 'naoh' },
      unitSelections: {},
    }
    const selectResult = engine.run({ scenario: { key: 'acid-neutralization', releaseId: 'acid-neutralization@1.0.0' }, state, sequence: 1 }, selectRouteAction)
    expect('nextState' in selectResult).toBe(true)
    if ('nextState' in selectResult) {
      state = selectResult.nextState
    }

    // Direct validateVolumeCap check: 30 mL exactly allowed, 30.05 mL rejected
    expect(validateVolumeCap(state, 'naoh', 0.030, 'base', 0.025)).toBeNull()
    const rejected = validateVolumeCap(state, 'naoh', 0.03005, 'base', 0.025)
    expect(rejected).not.toBeNull()
    expect(rejected?.code).toBe('VOLUME_OUT_OF_RANGE')
  })

  it('permits up to 60.0 mL cumulative NaOH base for a 50 mL sample', () => {
    const config = createAcidScenarioConfig({
      acidVolumeL: 0.050,
      acidConcentrationMolL: 0.010,
    })
    const engine = createAcidNeutralizationModule(config)
    let state = engine.createInitialState()

    // Total initial volume should be 50 mL
    expect(state.totalVolumeL).toBe(0.050)

    // Select naoh route
    const selectRouteAction: SimulationAction = {
      actionId: newUUID(),
      actionType: 'select_route',
      parameters: { route: 'naoh' },
      unitSelections: {},
    }
    const selectResult = engine.run({ scenario: { key: 'acid-neutralization', releaseId: 'acid-neutralization@1.0.0' }, state, sequence: 1 }, selectRouteAction)
    expect('nextState' in selectResult).toBe(true)
    if ('nextState' in selectResult) {
      state = selectResult.nextState
    }

    // Under benchmark singleton, adding 40 mL would fail (cap was 30 mL).
    // Under parameterized config, 50 mL and 60 mL are permitted!
    expect(validateVolumeCap(state, 'naoh', 0.040, 'base', 0.050)).toBeNull()
    expect(validateVolumeCap(state, 'naoh', 0.060, 'base', 0.050)).toBeNull()

    // 60.05 mL exceeds cap
    const overCap = validateVolumeCap(state, 'naoh', 0.06005, 'base', 0.050)
    expect(overCap).not.toBeNull()
    expect(overCap?.code).toBe('VOLUME_OUT_OF_RANGE')

    // Test through engine.validateAction
    const add40Action: SimulationAction = {
      actionId: newUUID(),
      actionType: 'add_base',
      parameters: { volumeL: 0.005 },
      unitSelections: {},
    }
    // Simulate state that already has 55 mL base added
    const highBaseState = {
      ...state,
      baseVolumeL: 0.055,
    }
    // Adding 5 mL reaches exactly 60 mL -> valid
    const validValidation = engine.validateAction(
      { scenario: { key: 'acid-neutralization', releaseId: 'acid-neutralization@1.0.0' }, state: highBaseState, sequence: 10 },
      add40Action,
    )
    expect(validValidation).toBeNull()

    // Adding 5 mL when baseVolumeL is 56 mL reaches 61 mL -> rejected
    const overBaseState = {
      ...state,
      baseVolumeL: 0.056,
    }
    const invalidValidation = engine.validateAction(
      { scenario: { key: 'acid-neutralization', releaseId: 'acid-neutralization@1.0.0' }, state: overBaseState, sequence: 10 },
      add40Action,
    )
    expect(invalidValidation).not.toBeNull()
    expect(invalidValidation?.code).toBe('VOLUME_OUT_OF_RANGE')
  })

  it('scales correction acid cap proportionally to 0.25 x acid volume', () => {
    const state = createAcidNeutralizationModule(createAcidScenarioConfig()).createInitialState()

    // 25 mL sample: cap is 6.25 mL (0.00625 L)
    expect(validateVolumeCap(state, 'naoh', 0.00625, 'correction-acid', 0.025)).toBeNull()
    expect(validateVolumeCap(state, 'naoh', 0.00630, 'correction-acid', 0.025)?.code).toBe('VOLUME_OUT_OF_RANGE')

    // 50 mL sample: cap is 12.5 mL (0.0125 L)
    expect(validateVolumeCap(state, 'naoh', 0.0125, 'correction-acid', 0.050)).toBeNull()
    expect(validateVolumeCap(state, 'naoh', 0.0126, 'correction-acid', 0.050)?.code).toBe('VOLUME_OUT_OF_RANGE')
  })
})
