'use client'
import { useEffect, useId, useState } from 'react'
import type { ExtractionProjection, ExtractionReportSnapshot } from '@/application/scenarios/extraction-projection.js'
import type { VesselId } from '@/domain/experiments/acid-base-extraction/model.js'
import type { ExtractionEquipmentKind } from './equipment-panel.js'
import { InfoIcon } from '@/features/workbench/icons.js'
import { VesselArt, BenchToolArt, liquidLayout, type VisibleVessel } from './vessel-art.js'
import styles from './apparatus.module.css'

export const VESSEL_NAMES:Record<VesselId,string>={S:'Bình mẫu',F:'Phễu chiết',R1:'Bình thu 1',R2:'Bình thu 2',R3:'Bình thu 3',W:'Bình thải'}
const ROLES:Record<VesselId,string>={S:'Giữ mẫu và xử lý dịch chiết',F:'Trộn và tách hai pha',R1:'Giữ riêng phần mẫu thu được',R2:'Giữ riêng phần mẫu thu được',R3:'Giữ riêng phần mẫu thu được',W:'Theo dõi phần dịch đã loại'}
type Distribution=ExtractionReportSnapshot['distribution']
type Reading=ExtractionProjection['readings'][number]
const number=(value:number,digits=1)=>value.toLocaleString('vi-VN',{maximumFractionDigits:digits})
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
  return <>
    <header><span>{id}</span><div><strong>{VESSEL_NAMES[id]}</strong><small>{vesselStatus(vessel)}</small></div></header>
    <dl><div><dt>Pha hữu cơ</dt><dd>{number(vessel.organicMl)} mL</dd></div><div><dt>Pha nước</dt><dd>{number(vessel.waterMl)} mL</dd></div><div><dt>Chất rắn</dt><dd>{vessel.solidPresent?vessel.dry?'Có · Đã làm khô':'Có · Minh họa':'Chưa thấy'}</dd></div><div><dt>pH đã đo</dt><dd>{readingText(ph)}</dd></div><div><dt>Khối lượng đã cân</dt><dd>{readingText(mass,'mg')}</dd></div></dl>
    {(vessel.organicMl>0||vessel.waterMl>0)&&<p>{vessel.organicMl>0&&<>Dung môi hữu cơ chuẩn.</>}{vessel.waterMl>0&&<> Pha nước gồm nước / thuốc thử đã cấp.</>}</p>}
    {content?<div className={styles.composition}><span>Theo báo cáo đã nộp</span><div>{(['A','B','N'] as const).map(key=><span key={key}><strong>{key}</strong>{number(content.amountsMg[key],2)} mg</span>)}</div></div>:<p className={styles.inspectionNote}>A: axit yếu · B: bazơ yếu · N: trung tính.<br/>Phân bố A/B/N xem sau nộp.</p>}
  </>
}

function FocusScene({projection,vessel,operation}:{projection:ExtractionProjection;vessel:VisibleVessel;operation:string}) {
  const uid=useId(),last=projection.history.at(-1),receiver=projection.vessels.find(v=>v.id===last?.to&&v.id!==vessel.id)
  const total=vessel.waterMl+vessel.organicMl
  const liquid=liquidLayout(vessel)
  const organicY=-1+(liquid.bottom-liquid.height+liquid.organic/2)*270/250
  const waterY=-1+(liquid.bottom-liquid.water/2)*270/250
  return <svg viewBox="0 0 560 280" aria-hidden="true" className={styles.sceneArt}>
    <defs><linearGradient id={uid+'steel'} x1="0" x2="1"><stop stopColor="#8ba5b4"/><stop offset=".35" stopColor="#dce8ef"/><stop offset=".7" stopColor="#a5bbc8"/><stop offset="1" stopColor="#7c99aa"/></linearGradient></defs>
    <ellipse cx="285" cy="260" rx="158" ry="11" fill="#dce7ee" opacity=".55"/>
    <path d="M82 268H478" stroke="#c7d8e3" strokeWidth="2"/>
    {vessel.id==='F'&&<g>
      <rect x="169" y="15" width="9" height="234" rx="3" fill={'url(#'+uid+'steel)'}/>
      <path d="M176 74H251" stroke="#8ca6b5" strokeWidth="7"/>
      <rect x="224" y="66" width="56" height="15" rx="5" fill="#698b9e"/>
      <rect x="143" y="246" width="165" height="13" rx="5" fill={'url(#'+uid+'steel)'}/>
      <rect x="150" y="257" width="150" height="4" rx="2" fill="#668696"/>
      <path d="M151 50H110" stroke="#a6bdca"/><text x="105" y="47" textAnchor="end" fontSize="10" fill="#58778b">Giá đỡ cố định</text>
    </g>}
    <svg x="192" y="-1" width="195" height="270"><VesselArt vessel={vessel} motion={operation}/></svg>
    {(vessel.separated||vessel.waterMl===0||vessel.organicMl===0)&&total>0?<g strokeWidth="1" fill="none">
      {vessel.organicMl>0&&<><path d={`M289 ${organicY}H373L398 101h35`} stroke="#bfa46f"/><circle cx="289" cy={organicY} r="2.5" fill="#c7a975" stroke="none"/><text x="400" y="92" fill="#7c6744" stroke="none" fontSize="11">Pha hữu cơ</text></>}
      {vessel.waterMl>0&&<><path d={`M289 ${waterY}H373L398 185h35`} stroke="#7cabb4"/><circle cx="289" cy={waterY} r="2.5" fill="#7cabb4" stroke="none"/><text x="400" y="201" fill="#426e7e" stroke="none" fontSize="11">Pha nước</text></>}
    </g>:total>0?<text x="398" y="135" fill="#547989" fontSize="11">Chờ phân lớp</text>:!vessel.solidPresent?<g><path d="M347 140H390" stroke="#a2bac9"/><text x="401" y="144" fill="#617e90" fontSize="11">Chưa có mẫu</text></g>:null}
    {(operation==='transfer'||operation==='filter')&&receiver&&<g>
      <svg x="420" y="194" width="58" height="80"><VesselArt vessel={receiver} compact/></svg>
      <path className={styles.transferFlow} d="M330 222q60-55 108-8" fill="none" stroke="#3f9da6" strokeWidth="2" strokeDasharray="4 5"/>
      <text x="450" y="184" textAnchor="middle" fill="#00656a" fontSize="11">Thu vào {receiver.id}</text>
    </g>}
    {(operation==='evaporate'||operation==='dry')&&<path className={styles.vapour} d="M278 27q-8-10 0-19m20 19q8-10 0-19" fill="none" stroke="#9bb7c4" strokeWidth="2"/>}
    {operation==='vent'&&<path className={styles.ventPuff} d="M289 8q-12-12-22-5m23 2q9-13 20-10" fill="none" stroke="#94b4c1" strokeWidth="2"/>}
  </svg>
}

export function ExtractionApparatus({projection,selected,onSelect,motion,distribution,onEquipmentInfo}:{
  projection:ExtractionProjection;selected:VesselId;onSelect:(id:VesselId)=>void;motion:string;distribution?:Distribution|undefined;onEquipmentInfo:(kind:ExtractionEquipmentKind)=>void
}) {
  const [inspect,setInspect]=useState<{id:VesselId;anchor:'card'|'scene'}|null>(null),uid=useId()
  const vessel=projection.vessels.find(v=>v.id===selected)!,parts=motion.split('-'),operation=parts[1]===selected?(parts[0]??'idle'):'idle'
  const ph=projection.readings.filter(r=>r.vesselId===selected&&r.kind==='ph').at(-1)
  const mass=projection.readings.filter(r=>r.vesselId===selected&&r.kind==='mass').at(-1)
  const lastChange=projection.history.filter(h=>h.from===selected||h.to===selected).at(-1)?.sequence??0
  useEffect(()=>{
    const escape=(event:KeyboardEvent)=>{if(event.key==='Escape')setInspect(null)}
    const outside=(event:PointerEvent)=>{if(event.target instanceof Element&&!event.target.closest('[data-vessel-inspect]'))setInspect(null)}
    document.addEventListener('keydown',escape);document.addEventListener('pointerdown',outside)
    return()=>{document.removeEventListener('keydown',escape);document.removeEventListener('pointerdown',outside)}
  },[])
  const tip=(id:VesselId,anchor:'card'|'scene')=>inspect?.id===id&&inspect.anchor===anchor?<div role="tooltip" aria-label={'Mẫu trong bình '+id} id={uid+'-'+id+'-'+anchor} className={styles.sampleTip+' '+(anchor==='scene'?styles.sceneTip:styles.cardTip)}><VesselInfo projection={projection} id={id} distribution={distribution}/></div>:null
  return <section className={styles.stage} aria-label="Khu vực thực hành chiết tách">
    <div className={styles.stageHeading}><div><h2>Khu vực thực hành</h2><p><strong>{selected} · {VESSEL_NAMES[selected]}</strong><span>{ROLES[selected]}</span></p></div><span className={styles.phaseTag} data-filled={vessel.waterMl+vessel.organicMl>0||vessel.solidPresent}>{vesselStatus(vessel)}</span></div>
    <div className={styles.scene} data-vessel-inspect onPointerEnter={event=>{if(event.pointerType==='mouse')setInspect({id:selected,anchor:'scene'})}} onPointerLeave={event=>{if(event.pointerType==='mouse')setInspect(null)}}>
      <button type="button" className={styles.sceneFocus} aria-label={'Xem mẫu trong bình '+selected} aria-describedby={inspect?.anchor==='scene'&&inspect.id===selected?uid+'-'+selected+'-scene':undefined} onClick={()=>setInspect({id:selected,anchor:'scene'})} onFocus={()=>setInspect({id:selected,anchor:'scene'})} onBlur={()=>setInspect(null)}><FocusScene key={motion} projection={projection} vessel={vessel} operation={operation}/><span className={styles.inspectHint}><InfoIcon/>Rê chuột hoặc bấm vào bình để xem mẫu</span></button>
      {tip(selected,'scene')}
    </div>
    <div className={styles.deviceDock} aria-label="Thiết bị thực hành">
      {([{kind:'filter',title:'Trạm lọc',role:'Tách chất rắn khỏi dịch',item:'filter',active:operation==='filter'},{kind:'recovery',title:'Trạm cô & sấy',role:'Loại dung môi, làm khô',item:'filter',active:operation==='evaporate'||operation==='dry'},{kind:'meter',title:'Trạm đo & cân',role:'Đọc pH, cân sản phẩm',item:'meter',active:operation==='measure'}] as const).map(tool=><button key={tool.kind} type="button" className={styles.device} aria-label={'Tìm hiểu '+tool.title.toLowerCase()} data-active={tool.active} onClick={()=>onEquipmentInfo(tool.item)}><BenchToolArt kind={tool.kind} active={tool.active}/><span><strong>{tool.title}</strong><small>{tool.role}</small></span><InfoIcon/></button>)}
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
    <p className={styles.visualNote}>Mức chất lỏng và hạt chỉ minh họa. Thể tích, pH và khối lượng đọc ở thông số đã lưu.</p>
  </section>
}
