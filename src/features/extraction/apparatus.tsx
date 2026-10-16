'use client'
import { useEffect, useId, useRef, useState } from 'react'
import type { ExtractionActionSummary, ExtractionProjection, ExtractionReportSnapshot } from '@/application/scenarios/extraction-projection.js'
import type { VesselId } from '@/domain/experiments/acid-base-extraction/model.js'
import { VesselArt, type VisibleVessel } from './vessel-art.js'
import styles from './apparatus.module.css'
import { MotionScene, EXTRACTION_MOTION_MS, type ExtractionMotion } from './motion-scene.js'
import { extractionActionLabel } from './action-label.js'

export const VESSEL_NAMES:Record<VesselId,string>={S:'Bình mẫu',F:'Phễu chiết',R1:'Bình thu 1',R2:'Bình thu 2',R3:'Bình thu 3',W:'Bình thải'}
const ROLES:Record<VesselId,string>={S:'Giữ mẫu và xử lý dịch chiết',F:'Trộn và tách hai pha',R1:'Giữ riêng phần mẫu thu được',R2:'Giữ riêng phần mẫu thu được',R3:'Giữ riêng phần mẫu thu được',W:'Theo dõi phần dịch đã loại'}
type Distribution=ExtractionReportSnapshot['distribution']
type Reading=ExtractionProjection['readings'][number]
const number=(value:number,digits=1)=>value.toLocaleString('vi-VN',{maximumFractionDigits:digits})
const EXPLANATIONS:Record<string,string>={
  add_reagent:'Dung dịch được cấp vào bình; mực dịch tăng theo thể tích đã thêm. Nếu xuất hiện chất rắn, đó là quan sát định tính của mẫu.',
  mix:'Hai pha được trộn để tiếp xúc. Chưa thu dịch khi chưa xả áp và để phân lớp.',
  vent:'Đã ghi nhận thao tác xả áp. Tiếp tục để phân lớp để quan sát hai lớp riêng.',
  settle:'Trong hồ sơ này, hữu cơ nằm trên và nước nằm dưới. Đường ranh giới ứng với thể tích của từng pha.',
  transfer:'Bình nguồn vơi và bình nhận dâng theo lượng dịch đã chuyển. Phần không được chọn vẫn giữ ở nguồn.',
  filter:'Thu chất rắn sang bình nhận cùng tối đa 0,5 mL dịch lưu. Phần lớn dịch lọc giữ ở bình nguồn theo quy ước bài này.',
  evaporate:'Dung môi hữu cơ được loại khỏi bình và ghi vào phần dung môi thu hồi. Chất rắn chỉ hiện khi mẫu có rắn theo mô hình.',
  dry:'Dịch lưu trên mẫu được loại; trạng thái đã làm khô không thay thế phép cân.',
  measure:'Màn hình chỉ hiện số đo vừa được lưu. pH không có pha nước hiển thị N/A; kết quả cân có thể gồm cả dịch còn lưu.',
  record_product:'Đã lưu khai báo của bạn. Thu hồi và độ tinh khiết được đối chiếu sau khi nộp bài.',
  complete:'Lượt đã khóa; số đo và thao tác được giữ trong báo cáo đã nộp.',
}
function readingText(reading:Reading|undefined,unit=''){return !reading?'Chưa đo':reading.value===null?'N/A':number(reading.value,2)+(unit?' '+unit:'')}
function vesselStatus(v:VisibleVessel){
  if(v.waterMl+v.organicMl===0)return v.solidPresent?v.dry?'Mẫu rắn đã làm khô':'Có chất rắn':'Bình trống'
  if(v.waterMl>0&&v.organicMl>0)return v.separated?'Hai pha đã tách':'Hai pha chưa tách'
  return (v.organicMl>0?'Pha hữu cơ':'Pha nước')+(v.solidPresent?' · Có chất rắn':'')
}

/** Learner-facing inspection never derives or reveals unmeasured component quantities. */
export function VesselInfo({projection,id,distribution}:{projection:ExtractionProjection;id:VesselId;distribution?:Distribution|undefined}) {
  const vessel=projection.vessels.find(v=>v.id===id)!
  const ph=projection.readings.filter(r=>r.vesselId===id&&r.kind==='ph').at(-1)
  const mass=projection.readings.filter(r=>r.vesselId===id&&r.kind==='mass').at(-1)
  const content=projection.phase==='completed'?distribution?.find(row=>row.vesselId===id):undefined
  const change=projection.history.filter(h=>h.from===id||h.to===id).at(-1)?.sequence??0
  return <>
    <header><span>{id}</span><div><strong>{VESSEL_NAMES[id]}</strong><small>{vesselStatus(vessel)}</small></div></header>
    <dl><div><dt>Pha hữu cơ</dt><dd>{number(vessel.organicMl)} mL</dd></div><div><dt>Pha nước</dt><dd>{number(vessel.waterMl)} mL</dd></div><div><dt>Chất rắn</dt><dd>{vessel.solidPresent?vessel.dry?'Có · Đã làm khô':'Có · Minh họa':'Chưa thấy'}</dd></div><div><dt>pH đã đo</dt><dd>{readingText(ph)}</dd></div><div><dt>Khối lượng đã cân</dt><dd>{readingText(mass,'mg')}</dd></div></dl>
    {((ph&&change>ph.sequence)||(mass&&change>mass.sequence))&&<p>Số đo lưu trước thao tác mới; đo lại để biết trạng thái hiện tại.</p>}
    {(vessel.organicMl>0||vessel.waterMl>0)&&<p>{vessel.organicMl>0&&<>Dung môi hữu cơ chuẩn.</>}{vessel.waterMl>0&&<> Pha nước gồm nước / thuốc thử đã cấp.</>}</p>}
    {content?<div className={styles.composition}><span>Theo báo cáo đã nộp</span><div>{(['A','B','N'] as const).map(key=><span key={key}><strong>{key}</strong>{number(content.amountsMg[key],2)} mg</span>)}</div></div>:<p className={styles.inspectionNote}>A: axit yếu · B: bazơ yếu · N: trung tính.<br/>Phân bố A/B/N xem sau nộp.</p>}
  </>
}

export function ExtractionApparatus({projection,selected,onSelect,motion,onMotionEnd,latestAction,distribution}:{
  projection:ExtractionProjection;selected:VesselId;onSelect:(id:VesselId)=>void;motion:ExtractionMotion|null;onMotionEnd:(key:string)=>void;latestAction?:ExtractionActionSummary|undefined;distribution?:Distribution|undefined
}) {
  const [inspect,setInspect]=useState<{id:VesselId;anchor:'card'|'scene'}|null>(null),uid=useId()
  const sceneRef=useRef<HTMLDivElement>(null)
  const [visible,setVisible]=useState(true),[documentVisible,setDocumentVisible]=useState(true)
  const clock=useRef({key:'',remaining:EXTRACTION_MOTION_MS})
  const vessel=projection.vessels.find(v=>v.id===selected)!
  const cue=motion?.from===selected?motion:null,operation=cue?.type??'idle'
  useEffect(()=>{
    const observer=typeof IntersectionObserver==='undefined'?null:new IntersectionObserver(([entry])=>setVisible(!!entry?.isIntersecting))
    if(sceneRef.current)observer?.observe(sceneRef.current)
    const update=()=>setDocumentVisible(document.visibilityState!=='hidden')
    update();document.addEventListener('visibilitychange',update)
    return()=>{observer?.disconnect();document.removeEventListener('visibilitychange',update)}
  },[])
  const cueKey=cue?.key
  useEffect(()=>{
    if(!cueKey)return
    const preference=matchMedia('(prefers-reduced-motion: reduce)')
    const settle=()=>{if(preference.matches)onMotionEnd(cueKey)}
    preference.addEventListener('change',settle)
    if(clock.current.key!==cueKey)clock.current={key:cueKey,remaining:EXTRACTION_MOTION_MS}
    const current=clock.current
    settle()
    const started=performance.now(),playing=visible&&documentVisible&&!preference.matches
    const timer=playing?setTimeout(()=>onMotionEnd(cueKey),current.remaining):undefined
    return()=>{
      clearTimeout(timer);preference.removeEventListener('change',settle)
      if(playing)current.remaining=Math.max(0,current.remaining-(performance.now()-started))
    }
  },[cueKey,visible,documentVisible,onMotionEnd])
  const ph=projection.readings.filter(r=>r.vesselId===selected&&r.kind==='ph').at(-1)
  const mass=projection.readings.filter(r=>r.vesselId===selected&&r.kind==='mass').at(-1)
  const lastChange=projection.history.filter(h=>h.from===selected||h.to===selected).at(-1)?.sequence??0
  const volumeChanges=cue?projection.vessels.flatMap(current=>{
    const previous=cue.previous.find(item=>item.id===current.id)
    const before=previous?previous.waterMl+previous.organicMl:0,after=current.waterMl+current.organicMl
    return Math.abs(before-after)>1e-8?[{id:current.id,before,after}]:[]
  }):[]
  const actedVessel=projection.vessels.find(item=>item.id===(latestAction?.parameters.vesselId??latestAction?.parameters.from))
  const onePhase=actedVessel&&!(actedVessel.waterMl>0&&actedVessel.organicMl>0)
  const explanation=latestAction&&(onePhase&&['mix','settle'].includes(latestAction.actionType)
    ?'Bình hiện chỉ có một pha. Hai lớp riêng chỉ xuất hiện khi có cả nước và dung môi hữu cơ.'
    :EXPLANATIONS[latestAction.actionType])
  useEffect(()=>{
    const escape=(event:KeyboardEvent)=>{if(event.key==='Escape')setInspect(null)}
    const outside=(event:PointerEvent)=>{if(event.target instanceof Element&&!event.target.closest('[data-vessel-inspect]'))setInspect(null)}
    document.addEventListener('keydown',escape);document.addEventListener('pointerdown',outside)
    return()=>{document.removeEventListener('keydown',escape);document.removeEventListener('pointerdown',outside)}
  },[])
  const tip=(id:VesselId,anchor:'card'|'scene')=>inspect?.id===id&&inspect.anchor===anchor?<div role="tooltip" aria-label={'Mẫu trong bình '+id} id={uid+'-'+id+'-'+anchor} className={styles.sampleTip+' '+(anchor==='scene'?styles.sceneTip:styles.cardTip)}><VesselInfo projection={projection} id={id} distribution={distribution}/></div>:null
  return <section className={styles.stage} data-paused={!visible||!documentVisible} aria-label="Khu vực thực hành chiết tách">
    <div className={styles.stageHeading}><div><h2>Khu vực thực hành</h2><p><strong>{selected} · {VESSEL_NAMES[selected]}</strong><span>{ROLES[selected]}</span></p></div><span className={styles.phaseTag} data-filled={vessel.waterMl+vessel.organicMl>0||vessel.solidPresent}>{vesselStatus(vessel)}</span></div>
    <div ref={sceneRef} className={styles.scene} data-testid="extraction-scene" data-operation={operation} data-cue-key={cueKey??''} data-vessel-inspect onPointerEnter={event=>{if(event.pointerType==='mouse')setInspect({id:selected,anchor:'scene'})}} onPointerLeave={event=>{if(event.pointerType==='mouse')setInspect(null)}}>
      <button type="button" className={styles.sceneFocus} aria-label={'Xem mẫu trong bình '+selected} aria-describedby={inspect?.anchor==='scene'&&inspect.id===selected?uid+'-'+selected+'-scene':undefined} onClick={()=>setInspect({id:selected,anchor:'scene'})} onFocus={()=>setInspect({id:selected,anchor:'scene'})} onBlur={()=>setInspect(null)}><MotionScene key={cue?.key??selected} vessel={vessel} vessels={projection.vessels} motion={cue} reading={cue?.kind==='mass'?mass:ph}/></button>
      {tip(selected,'scene')}
    </div>
    <div className={styles.sceneState}><span>{vessel.waterMl>0&&vessel.organicMl>0?<>{vessel.needsMix?'Cần trộn lại':vessel.needsMix===false?'Đã trộn':'Hai pha'} · {vessel.separated?'Hữu cơ ở trên · Nước ở dưới':'Hai pha chưa phân lớp'}</>:vessel.dry?'Mẫu đã làm khô':vessel.solidPresent?'Quan sát thấy chất rắn':vessel.waterMl>0?'Pha nước':vessel.organicMl>0?'Pha hữu cơ':'Bình chưa có mẫu'}</span><small>Màu và chuyển động minh họa trạng thái; không biểu thị thành phần hay tốc độ thực.</small></div>
    <div className={styles.phaseLegend} aria-label="Chú giải pha"><span><i className={styles.organicSwatch} aria-hidden="true"/>Pha hữu cơ</span><span><i className={styles.waterSwatch} aria-hidden="true"/>Pha nước</span><span><i className={styles.solidSwatch} aria-hidden="true"/>Chất rắn</span></div>
    <div className={styles.actionFeedback} role="status" aria-live="polite">
      <div><strong>{latestAction?`Đã lưu #${latestAction.sequence} · ${extractionActionLabel(latestAction)}`:'S có sẵn 40 mL dung môi chứa mẫu A, B, N'}</strong>
      <span>{latestAction?explanation:'Mẫu ban đầu là dung dịch hữu cơ. Chọn F làm bình nhận để chuyển mẫu vào phễu chiết.'}</span>
      {volumeChanges.length>0&&<div className={styles.volumeChanges} data-testid="extraction-volume-change">{volumeChanges.map(change=><span key={change.id}>{change.id}: {number(change.before,2)} → {number(change.after,2)} mL</span>)}</div>}</div>
      {cue&&<button type="button" className={styles.skipMotion} onClick={()=>onMotionEnd(cue.key)}>Xem trạng thái cuối</button>}
    </div>
    <div className={styles.readouts}>
      <div><span>Pha hữu cơ</span><strong>{number(vessel.organicMl)} <small>mL</small></strong></div>
      <div><span>Pha nước</span><strong>{number(vessel.waterMl)} <small>mL</small></strong></div>
      <div><span>pH đã đo</span><strong data-testid="extraction-current-ph">{readingText(ph)}</strong><small>{ph?'Bước '+ph.sequence+(lastChange>ph.sequence?' · Có thao tác mới':''):'Chưa có phép đo'}</small></div>
      <div><span>Khối lượng đã cân</span><strong data-testid="extraction-current-mass">{readingText(mass,'mg')}</strong><small>{mass?'Bước '+mass.sequence+(lastChange>mass.sequence?' · Có thao tác mới':''):'Chưa có phép cân'}</small></div>
    </div>
    <div className={styles.vesselPicker} role="group" aria-label="Chọn bình thao tác">{projection.vessels.map(item=><div key={item.id} className={styles.vesselSlot} data-vessel-inspect onPointerEnter={event=>{if(event.pointerType==='mouse')setInspect({id:item.id,anchor:'card'})}} onPointerLeave={event=>{if(event.pointerType==='mouse')setInspect(null)}}>
      <button type="button" className={styles.vesselCard} data-testid={'extraction-vessel-'+item.id} aria-label={item.id+' · '+VESSEL_NAMES[item.id]} aria-pressed={selected===item.id} aria-describedby={inspect?.id===item.id&&inspect.anchor==='card'?uid+'-'+item.id+'-card':undefined} onClick={()=>{onSelect(item.id);setInspect({id:item.id,anchor:'card'})}} onFocus={()=>setInspect({id:item.id,anchor:'card'})} onBlur={()=>setInspect(null)}><VesselArt vessel={item} compact/><span className={styles.vesselTitle}><strong>{item.id}</strong><span>{VESSEL_NAMES[item.id]}</span></span><small>{number(item.waterMl+item.organicMl)} mL{item.solidPresent?' · Có rắn':''}</small></button>
      {tip(item.id,'card')}
    </div>)}</div>
  </section>
}
