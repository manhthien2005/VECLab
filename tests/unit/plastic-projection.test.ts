import { describe, expect, it } from 'vitest'
import { projectPlastic } from '@/application/scenarios/plastic-projection.js'
import {
  PLASTIC_PROFILE,
  createPlasticSeparationModule,
} from '@/domain/experiments/virgin-plastic-separation/index.js'
import type { SimulationAction, SimulationContext, UUID } from '@/domain/process/contracts.js'
import type { PlasticSeparationState } from '@/domain/experiments/virgin-plastic-separation/model.js'

type PlasticModule = ReturnType<typeof createPlasticSeparationModule>

function apply(
  module: PlasticModule,
  state: PlasticSeparationState,
  actionType: string,
  parameters: SimulationAction['parameters'] = {},
): PlasticSeparationState {
  const context: SimulationContext<PlasticSeparationState> = {
    scenario: { key: 'plastic-separation', releaseId: PLASTIC_PROFILE.releaseId },
    state,
    sequence: state.revision + 1,
  }
  const result = module.run(context, {
    actionId: `projection-${state.revision}` as UUID,
    actionType,
    parameters,
    unitSelections: {},
  })
  if (!('nextState' in result)) throw new Error(`Unexpected domain error: ${result.code}`)
  return result.nextState
}

function separatedWaterState() {
  const module = createPlasticSeparationModule()
  let state = module.createInitialState()
  state = apply(module, state, 'prepare_samples')
  state = apply(module, state, 'load_and_wet')
  state = apply(module, state, 'separate_water')
  return { module, state }
}

describe('Plastic separation projection weighing display', () => {
  it('waits for centrifugation and converts the reported water recovery to a mass estimate', () => {
    const { module, state: separated } = separatedWaterState()
    expect(projectPlastic(separated).weighedMassKg).toBeNull()

    const weighed = apply(module, separated, 'centrifuge_and_weigh')
    const projection = projectPlastic(weighed)

    expect(projection.weighedMassKg).toBeCloseTo(3.9)
    expect(projection.weighedPolymerIds).toEqual(['PP', 'HDPE'])
    expect(projection.weighedLabelVi).toContain('97,5%')
  })

  it('clears the scale during centrifugation and reports the preset recovery after weighing', () => {
    const { module, state: separated } = separatedWaterState()
    let state = apply(module, separated, 'centrifuge_and_weigh')
    state = apply(module, state, 'select_branch', { branch: 'light' })
    state = apply(module, state, 'run_ethanol_preset', { concentration: 23 })
    expect(projectPlastic(state).weighedMassKg).toBeNull()

    state = apply(module, state, 'centrifuge_and_weigh')
    const projection = projectPlastic(state)
    expect(projection.weighedMassKg).toBeCloseTo(1.912)
    expect(projection.weighedPolymerIds).toEqual(['PP'])
    expect(projection.weighedLabelVi).toContain('95,6%')
  })

  it('shows PP returned to the ethanol vessel at 31% and weighs only HDPE', () => {
    const { module, state: separated } = separatedWaterState()
    let state = apply(module, separated, 'centrifuge_and_weigh')
    state = apply(module, state, 'select_branch', { branch: 'light' })
    state = apply(module, state, 'run_ethanol_preset', { concentration: 23 })
    state = apply(module, state, 'centrifuge_and_weigh')
    state = apply(module, state, 'run_ethanol_preset', { concentration: 31 })

    const during31 = projectPlastic(state)
    expect(during31.polymers.find((polymer) => polymer.id === 'PP')?.location).toBe('separated_floating')
    expect(during31.polymers.find((polymer) => polymer.id === 'HDPE')?.location).toBe('separated_sinking')
    expect(during31.weighedPolymerIds).toEqual([])

    state = apply(module, state, 'centrifuge_and_weigh')
    const after31 = projectPlastic(state)
    expect(after31.weighedPolymerIds).toEqual(['HDPE'])
    expect(after31.weighedLabelVi).toContain('HDPE')
  })

  it('separates PA and PC into two independent readouts for NaCl 40%', () => {
    const { module, state: separated } = separatedWaterState()
    let state = apply(module, separated, 'centrifuge_and_weigh')
    state = apply(module, state, 'select_branch', { branch: 'heavy' })
    state = apply(module, state, 'run_nacl_preset', { concentration: '11-12' })
    state = apply(module, state, 'centrifuge_and_weigh')
    state = apply(module, state, 'run_nacl_preset', { concentration: 20 })
    state = apply(module, state, 'centrifuge_and_weigh')
    state = apply(module, state, 'run_nacl_preset', { concentration: 40 })

    const during40 = projectPlastic(state)
    expect(during40.polymers.find((polymer) => polymer.id === 'PA')?.location).toBe('separated_floating')
    expect(during40.polymers.find((polymer) => polymer.id === 'PC')?.location).toBe('separated_sinking')
    expect(during40.weighedFractions).toEqual({})

    state = apply(module, state, 'centrifuge_and_weigh')
    const after40 = projectPlastic(state)
    expect(after40.weighedFractions.PA?.massKg).toBeCloseTo(1.4)
    expect(after40.weighedFractions.PA?.recoveryPercent).toBe(70)
    expect(after40.weighedFractions.PC?.massKg).toBeCloseTo(1.908)
    expect(after40.weighedFractions.PC?.recoveryPercent).toBe(95.4)
    expect(after40.weighedMassKg).toBeCloseTo(3.308)
  })
})
