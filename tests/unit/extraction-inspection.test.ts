import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it } from 'vitest'
import { createInitialExtractionState } from '@/domain/experiments/acid-base-extraction/model.js'
import { projectExtraction } from '@/application/scenarios/extraction-projection.js'
import { VesselInfo } from '@/features/extraction/apparatus.js'

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
