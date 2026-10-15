'use client'

import { useId, useRef, useState } from 'react'
import type { ExtractionActionSummary, ExtractionProjection } from '@/application/scenarios/extraction-projection.js'
import { COMPONENTS, type VesselId } from '@/domain/experiments/acid-base-extraction/model.js'
import { ControlIcon, SubmitIcon } from '@/features/workbench/icons.js'
import { VESSEL_NAMES } from './apparatus.js'
import { ExtractionHistory } from './history.js'
import { fmt } from './report.js'
import styles from './notebook.module.css'

type Reading=ExtractionProjection['readings'][number]
const COMPONENT_NAMES={A:'Axit yếu',B:'Bazơ yếu',N:'Trung tính'}
const latest=(projection:ExtractionProjection,id:VesselId,kind:Reading['kind'])=>projection.readings.filter(r=>r.vesselId===id&&r.kind===kind).at(-1)
const lastChange=(projection:ExtractionProjection,id:VesselId)=>projection.history.filter(h=>h.from===id||h.to===id).at(-1)?.sequence??0

function ReadingValue({reading,change,unit=''}:{reading:Reading|undefined;change:number;unit?:string}) {
  if(!reading)return <span className={styles.missing}>Chưa đo</span>
  return <><strong>{fmt(reading.value)}{reading.value!==null&&unit&&<span className={styles.unit}> {unit}</span>}</strong>
    <small>Bước {reading.sequence}{change>reading.sequence?' · Số đo trước thao tác mới':''}</small>
    {!reading.valid&&<small>Không có pha nước</small>}
  </>
}

export function ExtractionNotebook({projection,actions,revision,selected}:{projection:ExtractionProjection;actions:readonly ExtractionActionSummary[];revision:number;selected:VesselId}) {
  const [tab,setTab]=useState<'data'|'history'>('data'),uid=useId()
  const tabs=useRef<(HTMLButtonElement|null)[]>([])
  const done=projection.phase==='completed',submitted=Object.keys(projection.submissions).length
  return <div className={styles.notebook}>
    <header className={styles.heading}><h2>Sổ thực hành</h2><span>Bản lưu {revision}{done?' · Đã nộp':''}</span></header>
    <div className={styles.tabs} role="tablist" aria-label="Nội dung sổ thực hành" onKeyDown={event=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return
      event.preventDefault()
      const next=event.key==='Home'?0:event.key==='End'?1:tab==='data'?1:0
      setTab(next===0?'data':'history');tabs.current[next]?.focus()
    }}>{(['data','history'] as const).map((id,index)=><button key={id} ref={node=>{tabs.current[index]=node}} type="button" role="tab" id={uid+'-'+id} aria-controls={uid+'-'+id+'-panel'} aria-selected={tab===id} tabIndex={tab===id?0:-1} onClick={()=>setTab(id)}>{id==='data'?'Số đo & sản phẩm':`Lịch sử thao tác (${actions.length})`}</button>)}</div>
    <div role="tabpanel" tabIndex={0} id={uid+'-data-panel'} aria-labelledby={uid+'-data'} hidden={tab!=='data'}>
    <div className={styles.bento}>
      <section className={styles.measurements} aria-label="Số đo theo bình">
        <header className={styles.cardHeading}><h3><ControlIcon kind="measure"/>Số đo theo bình</h3><span>{projection.readings.length} lần đo</span></header>
        <p className={styles.context}>Lần đo gần nhất của mỗi bình.</p>
        <table className={styles.latestTable}>
          <caption className={styles.srOnly}>Số đo gần nhất của sáu bình</caption>
          <colgroup><col style={{width:'34%'}}/><col style={{width:'28%'}}/><col style={{width:'38%'}}/></colgroup>
          <thead><tr><th scope="col">Bình</th><th scope="col">pH đã đo</th><th scope="col">Khối lượng đã cân</th></tr></thead>
          <tbody>{projection.vessels.map(vessel=><tr key={vessel.id} data-selected={selected===vessel.id}>
            <th scope="row"><strong>{vessel.id} <span>{VESSEL_NAMES[vessel.id]}</span></strong><small>{fmt(vessel.waterMl+vessel.organicMl,1)} mL{vessel.solidPresent?' · Có rắn':''}</small></th>
            <td><ReadingValue reading={latest(projection,vessel.id,'ph')} change={lastChange(projection,vessel.id)}/></td>
            <td><ReadingValue reading={latest(projection,vessel.id,'mass')} change={lastChange(projection,vessel.id)} unit="mg"/></td>
          </tr>)}</tbody>
        </table>
        <details className={styles.measurementLog} data-testid="extraction-measurement-log"><summary>Xem tất cả lần đo ({projection.readings.length})</summary>
          <div className={styles.logScroll} tabIndex={0} role="region" aria-label="Nhật ký các lần đo"><table>
            <caption>Các phép đo đã thực hiện</caption><thead><tr><th scope="col">Bước</th><th scope="col">Bình</th><th scope="col">Phép đo</th><th scope="col">Kết quả</th></tr></thead>
            <tbody>{projection.readings.map(reading=><tr key={reading.sequence}><td>{reading.sequence}</td><td>{reading.vesselId}</td><td>{reading.kind==='ph'?'pH':'Khối lượng mô hình'}</td><td>{fmt(reading.value)}{reading.value!==null&&reading.kind==='mass'?' mg':''}{!reading.valid?' · Không có pha nước':''}</td></tr>)}
              {!projection.readings.length&&<tr><td colSpan={4}>Chưa có phép đo.</td></tr>}
            </tbody>
          </table></div>
        </details>
      </section>
      <section className={styles.products} aria-label="Sản phẩm đã khai báo">
        <header className={styles.cardHeading}><h3><SubmitIcon/>Sản phẩm</h3><span>{submitted}/3 đã khai báo</span></header>
        <div className={styles.productList}>{COMPONENTS.map(id=>{
          const submission=projection.submissions[id],vessel=submission?projection.vessels.find(v=>v.id===submission.vesselId):undefined
          const mass=submission?latest(projection,submission.vesselId,'mass'):undefined
          return <article key={id} className={styles.product} aria-label={'Sản phẩm '+id}>
            <header><span className={styles.componentId}>{id}</span><div><h4>{COMPONENT_NAMES[id]}</h4><span>{submission?'Đã khai báo':'Chưa khai báo'}</span></div></header>
            {submission?<dl>
              <div><dt>Bình sản phẩm</dt><dd>{submission.vesselId}</dd></div>
              <div><dt>Thu hồi tự tính</dt><dd>{fmt(submission.answer)}<span className={styles.unit}> %</span></dd></div>
              <div><dt>Khối lượng đã cân</dt><dd><ReadingValue reading={mass} change={lastChange(projection,submission.vesselId)} unit="mg"/></dd></div>
              <div><dt>Trạng thái mẫu</dt><dd>{vessel?.dry?'Đã làm khô':'Chưa làm khô'}</dd></div>
            </dl>:<p className={styles.missing}>Chưa chọn bình và lưu đáp số.</p>}
          </article>
        })}</div>
        <p className={styles.context}>{done?'Mở báo cáo để đối chiếu kết quả.':'Đáp số bên trên do bạn nhập; đối chiếu sau khi nộp.'}</p>
      </section>
    </div>
    </div>
    <div role="tabpanel" tabIndex={0} id={uid+'-history-panel'} aria-labelledby={uid+'-history'} hidden={tab!=='history'}>
      <section className={styles.historyCard} aria-label="Lịch sử lượt thực hành"><ExtractionHistory history={actions}/></section>
    </div>
  </div>
}
