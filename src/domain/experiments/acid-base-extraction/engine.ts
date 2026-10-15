import type { DomainError, DomainModule, GoalStatus, SimulationAction } from '@/domain/process/contracts.js'
import { preconditionFailed } from '@/shared/errors/domain-errors.js'
import { createLegacyExtractionModule, legacyExtractionGoal } from './legacy-engine.js'
import { COMPONENTS, EXTRACTION_PROFILE, LEGACY_EXTRACTION_PROFILE, createInitialExtractionState, equilibrate, type ExtractionState, type Vessel, type VesselId } from './model.js'

const liquid = (v:Vessel) => v.waterMl + v.organicMl > 1e-8
const twoPhases = (v:Vessel) => v.waterMl > 1e-8 && v.organicMl > 1e-8
function operationError(state:ExtractionState, action:SimulationAction):DomainError|null {
  const p=action.parameters, v=state.vessels[(p.vesselId ?? p.from) as VesselId]
  let code:string|undefined
  if (['mix','vent','settle'].includes(action.actionType) && !liquid(v)) code='NO_LIQUID'
  else if (action.actionType==='filter' && !COMPONENTS.some(id=>equilibrate(v).solid[id]>1e-8)) code='NO_SOLID'
  else if (action.actionType==='evaporate' && v.organicMl<=1e-8) code='NO_ORGANIC'
  else if (action.actionType==='dry') {
    if (!liquid(v) && !COMPONENTS.some(id=>v.moles[id]>1e-10)) code='EMPTY_VESSEL'
    else if (v.dry) code='ALREADY_DRY'
  }
  return code?preconditionFailed(code,'errors.extraction.'+code):null
}

export function extractionGoal(state:ExtractionState):GoalStatus {
  const numeric=legacyExtractionGoal(state)
  if(state.profileVersion==='1')return numeric
  const missing=state.protocolIssues?.length??0
  const criteria=[...numeric.primaryCriteria,{key:'mixing',evaluable:true,met:missing===0,actual:missing,target:0,unit:'step'}]
  return {...numeric,goalMet:numeric.goalMet&&missing===0,primaryCriteria:criteria,achievementPercent:criteria.filter(c=>c.met).length/criteria.length*100}
}

/** Chemistry stays identical to v1; v2 adds explicit operation and assessment rules. */
export function createExtractionModule():DomainModule<ExtractionState> {
  const base=createLegacyExtractionModule()
  return {
    ...base,
    manifest:{...base.manifest,releaseId:EXTRACTION_PROFILE.releaseId,scoringVersion:'2',stateSchemaVersion:'2',contentVersion:'2',projectionVersion:1},
    createInitialState:()=>createInitialExtractionState(),
    evaluateGoalStatus:extractionGoal,
    validateAction:(context,action)=>base.validateAction(context,action)??operationError(context.state,action),
    run(context,action) {
      const invalid=base.validateAction(context,action)??operationError(context.state,action)
      if(invalid)return invalid
      const result=base.run(context,action)
      if(!('nextState' in result))return result
      const next=result.nextState,p=action.parameters,type=action.actionType
      const id=p.vesselId as VesselId
      if(type==='add_reagent')next.vessels[id].needsMix=twoPhases(next.vessels[id])
      else if(type==='mix')next.vessels[id].needsMix=false
      else if(type==='transfer'||type==='filter') {
        const from=p.from as VesselId,to=p.to as VesselId,before=context.state.vessels[from]
        if(twoPhases(before)&&before.needsMix&&(type==='filter'||p.phase!=='all')) {
          next.protocolIssues??=[]
          next.protocolIssues.push({sequence:context.sequence,vesselId:from})
        }
        next.vessels[from].needsMix=twoPhases(next.vessels[from])&&!!before.needsMix
        next.vessels[to].needsMix=twoPhases(next.vessels[to])&&(liquid(context.state.vessels[to])||!!before.needsMix)
        if(type==='filter')next.vessels[to].separated=!twoPhases(next.vessels[to])
      }
      return result
    },
  }
}
const current=createExtractionModule(),legacy=createLegacyExtractionModule()
export function resolveExtractionModule(releaseId:string):DomainModule<ExtractionState>|null {
  return releaseId===EXTRACTION_PROFILE.releaseId?current:releaseId===LEGACY_EXTRACTION_PROFILE.releaseId?legacy:null
}
export { EXTRACTION_PROFILE } from './model.js'
export type { ExtractionState } from './model.js'
