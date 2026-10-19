import { describe, it, expect } from 'vitest'
import {
  VIRGIN_POLYMERS,
  PLASTIC_PROFILE,
  createPlasticSeparationModule,
} from '@/domain/experiments/virgin-plastic-separation/index.js'
import type { SimulationAction, SimulationContext, UUID } from '@/domain/process/contracts.js'
import type { PlasticSeparationState } from '@/domain/experiments/virgin-plastic-separation/model.js'

type PlasticModule = ReturnType<typeof createPlasticSeparationModule>
type PlasticRunResult = ReturnType<PlasticModule['run']>

function makeAction(actionType: string, parameters: SimulationAction['parameters'] = {}): SimulationAction {
  return {
    actionId: 'action-test-uuid' as UUID,
    actionType,
    parameters,
    unitSelections: {},
  }
}

function makeContext(state: PlasticSeparationState, sequence = 1): SimulationContext<PlasticSeparationState> {
  return {
    scenario: { key: 'plastic-separation', releaseId: PLASTIC_PROFILE.releaseId },
    state,
    sequence,
  }
}

function nextStateFrom(result: PlasticRunResult): PlasticSeparationState {
  if (!('nextState' in result)) throw new Error(`Unexpected domain error: ${result.code}`)
  return result.nextState
}

function apply(module: PlasticModule, state: PlasticSeparationState, actionType: string, parameters: SimulationAction['parameters'] = {}) {
  return nextStateFrom(module.run(makeContext(state), makeAction(actionType, parameters)))
}

describe('Virgin Plastic Density Separation Engine', () => {
  it('conforms to published Table 1 polymer properties', () => {
    expect(VIRGIN_POLYMERS).toHaveLength(6)
    expect(VIRGIN_POLYMERS.map(({ id, nominalDensity }) => [id, nominalDensity])).toEqual([
      ['PP', '0,910 g/cm³'],
      ['HDPE', '0,953 g/cm³'],
      ['PS', '1,040 g/cm³'],
      ['ABS', '1,070 g/cm³'],
      ['PA', '1,140 g/cm³'],
      ['PC', '1,200 g/cm³'],
    ])
  })

  it('rejects out-of-order process actions', () => {
    const module = createPlasticSeparationModule()
    const state = module.createInitialState()
    expect(module.run(makeContext(state), makeAction('separate_water'))).toHaveProperty('category', 'precondition_failed')
    expect(module.run(makeContext(state), makeAction('centrifuge_and_weigh'))).toHaveProperty('category', 'precondition_failed')
    expect(module.run(makeContext(state), makeAction('select_branch', { branch: 'light' }))).toHaveProperty('category', 'precondition_failed')
    expect(module.run(makeContext(state), makeAction('load_and_wet'))).toHaveProperty('category', 'precondition_failed')
  })

  it('requires centrifugation after a reported separation before the next preset', () => {
    const module = createPlasticSeparationModule()
    let state = module.createInitialState()
    state = apply(module, state, 'prepare_samples')
    state = apply(module, state, 'load_and_wet')
    state = apply(module, state, 'separate_water')
    state = apply(module, state, 'centrifuge_and_weigh')
    state = apply(module, state, 'select_branch', { branch: 'light' })
    state = apply(module, state, 'run_ethanol_preset', { concentration: 23 })
    expect(state.pendingCentrifugation).toBe(true)
    expect(module.run(makeContext(state), makeAction('run_ethanol_preset', { concentration: 31 }))).toHaveProperty('category', 'precondition_failed')
    state = apply(module, state, 'centrifuge_and_weigh')
    state = apply(module, state, 'run_ethanol_preset', { concentration: 31 })
    state = apply(module, state, 'centrifuge_and_weigh')
    expect(state.completedBranches).toContain('light')
  })

  it('rejects unlisted concentrations and requires both branches before summary', () => {
    const module = createPlasticSeparationModule()
    let state = module.createInitialState()
    state = apply(module, state, 'prepare_samples')
    state = apply(module, state, 'load_and_wet')
    state = apply(module, state, 'separate_water')
    state = apply(module, state, 'centrifuge_and_weigh')
    state = apply(module, state, 'select_branch', { branch: 'light' })
    expect(module.run(makeContext(state), makeAction('run_ethanol_preset', { concentration: 25 }))).toHaveProperty('category', 'invalid_input')
    state = apply(module, state, 'run_ethanol_preset', { concentration: 23 })
    state = apply(module, state, 'centrifuge_and_weigh')
    state = apply(module, state, 'run_ethanol_preset', { concentration: 31 })
    state = apply(module, state, 'centrifuge_and_weigh')
    expect(module.run(makeContext(state), makeAction('summarize_fractions'))).toHaveProperty('category', 'precondition_failed')
    state = apply(module, state, 'select_branch', { branch: 'heavy' })
    for (const concentration of [11.5, 20, 40]) {
      state = apply(module, state, 'run_nacl_preset', { concentration })
      state = apply(module, state, 'centrifuge_and_weigh')
    }
    expect(state.completedBranches).toEqual(['light', 'heavy'])
    state = apply(module, state, 'summarize_fractions')
    state = apply(module, state, 'complete')
    const goal = module.evaluateGoalStatus(state, {
      reagents: {}, waterLiters: 0, operationCount: 16, relativeCostIndex: null,
      costConventionVersion: null, safetyIndex: null, safetyConventionVersion: null,
      safetyPenalties: [], secondaryWaste: {},
    })
    expect(state.stage).toBe('completed')
    expect(goal.goalMet).toBe(true)
    expect(goal.achievementPercent).toBe(100)
  })
})

