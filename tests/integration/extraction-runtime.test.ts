import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { GuestAttemptRepository } from '@/application/attempts/guest-repository.js'
import { createExtractionSession } from '@/application/simulation/extraction-session.js'
import type { ExtractionState } from '@/domain/experiments/acid-base-extraction/model.js'
import { newUUID } from '@/shared/ids.js'

describe('extraction guest session', () => {
  it.each(['acid-first','base-first'])('completes %s with conserved inventory and immutable report', async order => {
    const repository=new GuestAttemptRepository<ExtractionState>(), session=createExtractionSession(repository), started=await session.start(), id=started.attemptId
    async function action(type:string,parameters:Record<string,string|number>,volume?:number){const result=await session.apply(id,type,volume?{...parameters,volumeL:volume}:parameters,volume?{volumeL:'mL'}:{});expect(result.ok,type+JSON.stringify(parameters)).toBe(true);return result}
    const transfer=(from:string,to:string,phase:string,volume:number)=>action('transfer',{from,to,phase},volume)
    const add=(vesselId:string,reagent:string,volume:number)=>action('add_reagent',{vesselId,reagent},volume)
    async function extract(reagent:string,volume:number){await add('F',reagent,volume);await action('mix',{vesselId:'F'});await action('vent',{vesselId:'F'});await action('settle',{vesselId:'F'});await transfer('F','S','aqueous',volume)}
    async function recover(reagent:string,to:string,component:string){await add('S',reagent,30);await action('filter',{from:'S',to});await action('dry',{vesselId:to});const result=await action('measure',{vesselId:to,kind:'mass'});if(!result.ok)throw Error('measure failed');const value=result.state.projection.readings.at(-1)!.value!;await action('record_product',{vesselId:to,component,answer:value});const v=result.state.projection.vessels.find(item=>item.id==='S')!;await transfer('S','W','all',v.waterMl)}
    await transfer('S','F','all',40)
    await extract(order==='acid-first'?'base':'acid',20)
    await recover(order==='acid-first'?'acid':'base','R1',order==='acid-first'?'A':'B')
    await extract(order==='acid-first'?'acid':'base',30)
    await recover(order==='acid-first'?'base':'acid','R2',order==='acid-first'?'B':'A')
    await transfer('F','R3','organic',40);await action('evaporate',{vesselId:'R3'});await action('dry',{vesselId:'R3'});const measured=await action('measure',{vesselId:'R3',kind:'mass'});if(!measured.ok)throw Error('measure failed');await action('record_product',{vesselId:'R3',component:'N',answer:measured.state.projection.readings.at(-1)!.value!})
    const complete=await session.complete(id);if(!complete.ok)throw Error('complete failed')
    expect(complete.report.goalStatus.goalMet).toBe(true)
    for(const key of ['A','B','N'] as const)expect(complete.report.distribution.reduce((sum,row)=>sum+row.amountsMg[key],0)).toBeCloseTo(100,7)
    const loaded=await session.load(id);if(!loaded?.ok)throw Error('load failed')
    expect(loaded.state.report).toEqual(complete.report)
    expect(JSON.stringify(started.projection)).not.toContain('moles')
  })
  it('retries once and refuses changed intent, stale revision and foreign scenarios',async()=>{
    const repository=new GuestAttemptRepository<ExtractionState>(),session=createExtractionSession(repository),started=await session.start(),id=newUUID()
    const first=await session.apply(started.attemptId,'add_reagent',{vesselId:'F',reagent:'water',volumeL:10},{volumeL:'mL'},{actionId:id,expectedRevision:0})
    expect(first.ok).toBe(true)
    expect((await session.apply(started.attemptId,'add_reagent',{vesselId:'F',reagent:'water',volumeL:10},{volumeL:'mL'},{actionId:id,expectedRevision:0})).ok).toBe(true)
    const loaded=await session.load(started.attemptId);if(!loaded?.ok)throw Error('load failed');expect(loaded.state.revision).toBe(1)
    expect((await session.apply(started.attemptId,'add_reagent',{vesselId:'F',reagent:'water',volumeL:20},{volumeL:'mL'},{actionId:id,expectedRevision:1})).ok).toBe(false)
    expect((await session.apply(started.attemptId,'vent',{vesselId:'F'},{},{expectedRevision:0})).ok).toBe(false)
    const foreign=await new GuestAttemptRepository<object>().createAttempt({attemptId:newUUID(),scenarioKey:'jar-test',scenarioReleaseId:'jar-test@0.1.0',contentLocale:'vi',initialState:{},initialProjection:{},projectionVersion:1})
    expect(await session.load(foreign.attemptId)).toMatchObject({ok:false})
    const completed=await session.complete(started.attemptId);if(!completed.ok)throw Error('complete failed');expect(completed.report.goalStatus.evaluable).toBe(false);expect(completed.report.products.every(p=>p.measuredMassMg===null&&p.recovery===null&&p.expectedAnswer===null)).toBe(true)
  })
})
