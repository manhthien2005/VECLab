import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it } from 'vitest'
import { createInitialExtractionState } from '@/domain/experiments/acid-base-extraction/model.js'
import { projectExtraction } from '@/application/scenarios/extraction-projection.js'
import { VesselInfo } from '@/features/extraction/apparatus.js'
import { createExtractionSession } from '@/application/simulation/extraction-session.js'
import { GuestAttemptRepository } from '@/application/attempts/guest-repository.js'
import type { ExtractionState } from '@/domain/experiments/acid-base-extraction/model.js'
import 'fake-indexeddb/auto'

it('keeps component distribution out of inspection before submission',()=>{
 const projection=projectExtraction(createInitialExtractionState())
 const distribution=[{vesselId:'S' as const,amountsMg:{A:12.3,B:45.6,N:78.9}}]
 const html=renderToStaticMarkup(createElement(VesselInfo,{projection,id:'S',distribution}))
 expect(html).toContain('40 mL')
 expect(html).toContain('Phân bố A/B/N xem sau nộp')
 expect(html).not.toContain('12,3')
 const completed=renderToStaticMarkup(createElement(VesselInfo,{projection:{...projection,phase:'completed'},id:'S',distribution}))
 expect(completed).toContain('12,3')
 expect(completed).toContain('45,6')
 expect(completed).toContain('78,9')
})

it('shows the operating mix flag through replay without exposing component quantities',async()=>{
 const session=createExtractionSession(new GuestAttemptRepository<ExtractionState>())
 const started=await session.start()
 const added=await session.apply(started.attemptId,'add_reagent',{vesselId:'S',reagent:'base',volumeL:20},{volumeL:'mL'})
 expect(added.ok).toBe(true)
 if(!added.ok)throw Error('add failed')
 expect(added.state.projection.vessels.find(v=>v.id==='S')).toMatchObject({needsMix:true,separated:false})
 expect(JSON.stringify(added.state.projection)).not.toMatch(/moles|aqueous|amountsMg|purity|recovery/)
 const mixed=await session.apply(started.attemptId,'mix',{vesselId:'S'})
 if(!mixed.ok)throw Error('mix failed')
 expect(mixed.state.projection.vessels.find(v=>v.id==='S')).toMatchObject({needsMix:false,separated:false})
 const resumed=await session.load(started.attemptId)
 expect(resumed).toMatchObject({ok:true,state:{projection:mixed.state.projection}})
})
