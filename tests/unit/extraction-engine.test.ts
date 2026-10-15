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
      const result = module.run({ state, scenario: { key: 'acid-base-extraction', releaseId: module.manifest.releaseId }, sequence: 1 }, { actionId: newUUID(), actionType, parameters, unitSelections: {} })
      if ('nextState' in result) state = result.nextState
      return result
    }
    expect(run('toString')).toHaveProperty('code', 'UNKNOWN_ACTION_TYPE')
    run('transfer', { from: 'S', to: 'W', phase: 'all', volumeL: .02 })
    expect(inventories(state).A).toBeCloseTo(.001, 12)
    expect(state.vessels.W.moles.A).toBeGreaterThan(0)
  })
  it('refuses operations without material while preserving valid zero and N/A readings',()=>{
    const module=createExtractionModule(),state=module.createInitialState()
    const run=(actionType:string,parameters:Record<string,string|number>)=>module.run({state,sequence:1,scenario:{key:'acid-base-extraction',releaseId:module.manifest.releaseId}},{actionId:newUUID(),actionType,parameters,unitSelections:{}})
    for(const [actionType,code] of [['mix','NO_LIQUID'],['vent','NO_LIQUID'],['settle','NO_LIQUID'],['evaporate','NO_ORGANIC'],['dry','EMPTY_VESSEL']] as const)expect(run(actionType,{vesselId:'F'})).toHaveProperty('code',code)
    expect(run('filter',{from:'F',to:'R1'})).toHaveProperty('code','NO_SOLID')
    const mass=run('measure',{vesselId:'F',kind:'mass'}),ph=run('measure',{vesselId:'F',kind:'ph'})
    expect(mass).toHaveProperty('nextState.readings.0.value',0)
    expect(ph).toHaveProperty('nextState.readings.0.value',null)
    expect(state.history).toHaveLength(0)
  })
  it.each([true,false])('requires fresh mixing after adding more liquid, corrected before transfer: %s',correct=>{
    const module=createExtractionModule();let state=module.createInitialState(),sequence=0
    const run=(actionType:string,parameters:Record<string,string|number>)=>{const result=module.run({state,sequence:++sequence,scenario:{key:'acid-base-extraction',releaseId:module.manifest.releaseId}},{actionId:newUUID(),actionType,parameters,unitSelections:{}});if(!('nextState' in result))throw Error(result.code);state=result.nextState}
    run('transfer',{from:'S',to:'F',phase:'all',volumeL:.04})
    run('add_reagent',{vesselId:'F',reagent:'base',volumeL:.02})
    for(const action of ['mix','vent','settle'])run(action,{vesselId:'F'})
    run('add_reagent',{vesselId:'F',reagent:'water',volumeL:.001})
    if(correct)run('mix',{vesselId:'F'})
    for(const action of ['vent','settle'])run(action,{vesselId:'F'})
    run('transfer',{from:'F',to:'R1',phase:'aqueous',volumeL:.001})
    expect(state.protocolIssues).toHaveLength(correct?0:1)
    run('mix',{vesselId:'F'})
    expect(state.protocolIssues).toHaveLength(correct?0:1)
  })
})
