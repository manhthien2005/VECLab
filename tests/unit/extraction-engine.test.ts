import { describe, expect, it } from 'vitest'
import { equilibrate, createInitialExtractionState, inventories, partitionFraction, teachingMassMg } from '@/domain/experiments/acid-base-extraction/model.js'
import { createExtractionModule } from '@/domain/experiments/acid-base-extraction/engine.js'
import { newUUID } from '@/shared/ids.js'

describe('bounded extraction learning model', () => {
  it('matches independent distribution arithmetic and conserves every component', () => {
    expect(partitionFraction(2, 60, 100)).toBeCloseTo(0.5454545454545, 10)
    expect(1 - (1 - partitionFraction(2, 20, 100)) ** 3).toBeCloseTo(0.6355685131195, 10)
    const state = createInitialExtractionState()
    const vessel = { ...state.vessels.S, waterMl: 20, acidEq: .003 }
    const result = equilibrate(vessel)
    for (const id of ['A', 'B', 'N'] as const) expect(result.aqueous[id] + result.organic[id] + result.solid[id]).toBeCloseTo(vessel.moles[id], 12)
    expect(result.aqueous.B).toBeGreaterThan(result.organic.B)
    expect(result.organic.N).toBeGreaterThan(result.aqueous.N)
    expect(teachingMassMg(vessel)).toBeGreaterThan(300)
  })
  it('rejects inherited action names and transfers to waste without losing matter', () => {
    const module = createExtractionModule()
    let state = module.createInitialState()
    const run = (actionType: string, parameters: Record<string, string | number> = {}) => {
      const result = module.run({ state, scenario: { key: 'acid-base-extraction', releaseId: 'acid-base-extraction@0.1.0' }, sequence: 1 }, { actionId: newUUID(), actionType, parameters, unitSelections: {} })
      if ('nextState' in result) state = result.nextState
      return result
    }
    expect(run('toString')).toHaveProperty('code', 'UNKNOWN_ACTION_TYPE')
    run('transfer', { from: 'S', to: 'W', phase: 'all', volumeL: .02 })
    expect(inventories(state).A).toBeCloseTo(.001, 12)
    expect(state.vessels.W.moles.A).toBeGreaterThan(0)
  })
})
