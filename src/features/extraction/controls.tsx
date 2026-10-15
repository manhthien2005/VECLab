'use client'
import { useState } from 'react'
import Link from 'next/link'
import type { ExtractionProjection } from '@/application/scenarios/extraction-projection.js'
import { VESSEL_IDS, type VesselId, type Component } from '@/domain/experiments/acid-base-extraction/model.js'
import { ReportIcon } from '@/features/workbench/icons.js'
import { VESSEL_NAMES } from './apparatus.js'
import { ExtractionControlGroup } from './panels.js'
import { fmt } from './report.js'
import styles from './bench.module.css'

type Command=(type:string,parameters?:Record<string,string|number|boolean>,units?:Record<string,string>)=>void
type Draft={vesselId:VesselId;answer:string}
const DEFAULT_PRODUCTS:Record<Component,VesselId>={A:'R1',B:'R2',N:'R3'}
const validVolume=(text:string)=>text.trim()!==''&&Number.isFinite(Number(text))&&Number(text)>=.1&&Number(text)<=250
export function ExtractionControls({projection,selected,onSelect,locked,done,onRun,onReport,onNotebook}: {
  projection:ExtractionProjection;selected:VesselId;onSelect:(id:VesselId)=>void;locked:boolean;done:boolean;onRun:Command;onReport:()=>void;onNotebook:()=>void
}) {
  const [group,setGroup]=useState<string|null>('transfer')
  const [volume,setVolume]=useState('20'),[transferVolume,setTransferVolume]=useState('40'),[reagent,setReagent]=useState('acid')
  const [destination,setDestination]=useState<VesselId>('F'),[phase,setPhase]=useState('all')
  const [component,setComponent]=useState<Component>('A'),[drafts,setDrafts]=useState<Partial<Record<Component,Draft>>>({})
  const saved=projection.submissions[component]
  const draft=drafts[component]??{vesselId:saved?.vesselId??DEFAULT_PRODUCTS[component],answer:saved?String(saved.answer):''}
  function editDraft(patch:Partial<Draft>){setDrafts(previous=>({...previous,[component]:{...draft,...patch}}))}
  const current=projection.vessels.find(v=>v.id===selected)!
  const receiver=destination===selected?(selected==='R1'?'R2':'R1'):destination
  const target=projection.vessels.find(v=>v.id===receiver)!
  const productVessel=projection.vessels.find(v=>v.id===draft.vesselId)!
  const productMass=projection.readings.filter(r=>r.vesselId===draft.vesselId&&r.kind==='mass').at(-1)
  const productChange=projection.history.filter(h=>h.from===draft.vesselId||h.to===draft.vesselId).at(-1)?.sequence??0
  const toggle=(id:string)=>()=>setGroup(group===id?null:id)
  const hasLiquid=current.waterMl+current.organicMl>1e-8
  const twoPhases=current.waterMl>1e-8&&current.organicMl>1e-8
  const available=phase==='aqueous'?current.waterMl:phase==='organic'?current.organicMl:current.waterMl+current.organicMl
  const addIssue=!validVolume(volume)?'invalid':current.waterMl+current.organicMl+Number(volume)>250+1e-8?'capacity':null
  const transferIssue=!validVolume(transferVolume)?'Nhập thể tích từ 0,1 đến 250 mL.':!current.separated?'Để phân lớp trước khi chuyển dịch.':Number(transferVolume)>available+1e-8?'Thể tích cần chuyển vượt lượng dịch đang có.':target.waterMl+target.organicMl+Number(transferVolume)>250+1e-8?'Bình nhận không đủ dung tích.':null
  const canDry=current.organicMl<=1e-8&&current.waterMl<=.5+1e-8
  function action(label:string,type:string,parameters:Record<string,string|number|boolean>={},primary=false){
    const reason=['mix','vent','settle'].includes(type)&&!hasLiquid?'Bình chưa có dịch.':type==='settle'&&!current.vented?'Xả áp trước khi để phân lớp.':type==='filter'&&!current.solidPresent?'Chưa có chất rắn để lọc.':type==='evaporate'&&current.organicMl<=1e-8?'Chưa có dung môi hữu cơ để cô.':type==='evaporate'&&current.waterMl>1e-8?'Tách pha nước trước khi cô dung môi.':type==='dry'&&!hasLiquid&&!current.solidPresent?'Bình chưa có mẫu.':type==='dry'&&current.dry?'Mẫu đã làm khô.':type==='dry'&&!canDry?'Lọc chất rắn hoặc cô dung môi trước khi làm khô.':undefined
    return <button type="button" className={primary?styles.primary:styles.button} disabled={locked||!!reason} title={reason} onClick={()=>onRun(type,parameters)}>{label}</button>
  }
  return <>
    <div className={styles.controlsHeading}><h2>Thao tác</h2><select className={styles.cupSelect} aria-label="Bình đang thao tác" value={selected} disabled={locked} onChange={event=>onSelect(event.target.value as VesselId)}>{VESSEL_IDS.map(id=><option key={id} value={id}>Bình {id}</option>)}</select></div>
    <p className={styles.cupContext}><span>{VESSEL_NAMES[selected]}</span><span>{fmt(current.waterMl+current.organicMl,1)} mL</span></p>
    {done?<div className={styles.readonly}><h3>Lượt đã hoàn thành</h3><p>Bạn vẫn có thể chọn các bình để xem số liệu. Các thao tác đã khóa.</p><button type="button" className={styles.primary} onClick={onReport}><ReportIcon/>Xem báo cáo kết quả</button><button type="button" className={styles.button} onClick={onNotebook}>Xem sổ đo</button><Link className={styles.button} href="/simulate/acid-base-extraction">Bắt đầu lượt chiết tách mới</Link></div>:<>
      <ExtractionControlGroup id="prepare" title="Cấp dung dịch" summary="Chọn thuốc thử và thể tích" open={group==='prepare'} onToggle={toggle('prepare')}>
        <div className={styles.inputField}><label htmlFor="extraction-reagent">Dung dịch</label><select id="extraction-reagent" value={reagent} disabled={locked} onChange={e=>setReagent(e.target.value)}><option value="acid">Axit chuẩn (0,1 M)</option><option value="base">Bazơ chuẩn (0,1 M)</option><option value="water">Nước</option><option value="solvent">Dung môi hữu cơ chuẩn</option></select></div>
        <div className={styles.inputField}><label htmlFor="extraction-add-volume">Thể tích dung dịch (mL)</label><input id="extraction-add-volume" type="number" min="0.1" max="250" step="0.1" value={volume} disabled={locked} aria-describedby="extraction-add-hint" onChange={e=>setVolume(e.target.value)}/></div>
        <p id="extraction-add-hint">{addIssue==='invalid'?'Nhập thể tích từ 0,1 đến 250 mL.':addIssue==='capacity'?'Tổng dịch vượt dung tích 250 mL.':`Bình ${selected} còn ${fmt(250-current.waterMl-current.organicMl,1)} mL dung tích.`}</p>
        <button type="button" className={styles.primary} disabled={locked||!!addIssue} onClick={()=>onRun('add_reagent',{vesselId:selected,reagent,volumeL:Number(volume)},{volumeL:'mL'})}>Thêm {volume||'…'} mL vào {selected}</button>
      </ExtractionControlGroup>
      <ExtractionControlGroup id="program" title="Trộn & phân lớp" summary="Trộn → Xả áp → Để phân lớp" open={group==='program'} onToggle={toggle('program')}>
        <div className={styles.operationState} role="status">{!hasLiquid?'Bình chưa có dịch.':twoPhases?<><strong>{current.needsMix?'Cần trộn sau lần cấp/chuyển dịch':current.needsMix===false?'Đã trộn hai pha':'Hai pha trong bình'}</strong><span>{current.vented?'Đã xả áp':'Chưa xả áp'} · {current.separated?'Đã phân lớp':'Chưa phân lớp'}</span></>:<><strong>{current.organicMl>0?'Chỉ có pha hữu cơ':'Chỉ có pha nước'}</strong><span>Hai lớp chỉ xuất hiện khi có cả nước và dung môi hữu cơ.</span></>}</div>
        {action('Trộn','mix',{vesselId:selected},true)}{action('Xả áp','vent',{vesselId:selected})}{action('Để phân lớp','settle',{vesselId:selected})}
        {twoPhases&&<p>Sau phân lớp, mở “Chuyển & thu hồi mẫu” để chọn pha và bình nhận.</p>}
      </ExtractionControlGroup>
      <ExtractionControlGroup id="transfer" title="Chuyển & thu hồi mẫu" summary="Thu dịch · Lọc rắn · Cô · Làm khô" open={group==='transfer'} onToggle={toggle('transfer')}>
        <div className={styles.inputField}><label htmlFor="extraction-destination">Bình nhận</label><select id="extraction-destination" value={receiver} disabled={locked} onChange={e=>setDestination(e.target.value as VesselId)}>{VESSEL_IDS.filter(id=>id!==selected).map(id=><option key={id} value={id}>{id} · {VESSEL_NAMES[id]}</option>)}</select></div>
        <h3 className={styles.operationTitle}>Chuyển dịch {selected} → {receiver}</h3>
        <div className={styles.inputField}><label htmlFor="extraction-phase">Phần dịch cần chuyển</label><select id="extraction-phase" value={phase} disabled={locked} onChange={e=>setPhase(e.target.value)}><option value="aqueous">Pha nước (lớp dưới khi có hai pha)</option><option value="organic">Pha hữu cơ (lớp trên khi có hai pha)</option><option value="all">Toàn mẫu theo thể tích</option></select></div>
        <div className={styles.inputField}><label htmlFor="extraction-transfer-volume">Thể tích cần chuyển (mL)</label><input id="extraction-transfer-volume" type="number" min="0.1" max="250" step="0.1" value={transferVolume} disabled={locked} aria-describedby="extraction-transfer-hint" onChange={e=>setTransferVolume(e.target.value)}/></div>
        <p id="extraction-transfer-hint">Có {fmt(available,1)} mL {phase==='all'?'dịch':phase==='aqueous'?'pha nước':'pha hữu cơ'} trong {selected}.{transferIssue&&<> {transferIssue}</>}</p>
        <button type="button" className={styles.primary} disabled={locked||!!transferIssue} onClick={()=>onRun('transfer',{from:selected,to:receiver,phase,volumeL:Number(transferVolume)},{volumeL:'mL'})}>Chuyển {transferVolume||'…'} mL → {receiver}</button>
        <h3 className={styles.operationTitle}>Thu chất rắn</h3>
        <p>Lọc đưa rắn từ {selected} sang {receiver}. Cô và làm khô chỉ tác động lên bình {selected}.</p>
        {action('Lọc chất rắn → '+receiver,'filter',{from:selected,to:receiver})}{action('Cô dung môi','evaporate',{vesselId:selected})}{action('Làm khô','dry',{vesselId:selected})}
        {current.waterMl>1e-8&&current.organicMl>1e-8?<p>Cô chỉ dùng với pha hữu cơ đã tách khỏi nước.</p>:!canDry?<p>Trước khi làm khô: lọc rắn hoặc cô hết dung môi hữu cơ. Mẫu lọc được giữ tối đa 0,5 mL dịch.</p>:null}
      </ExtractionControlGroup>
      <ExtractionControlGroup id="results" title="Đo & ghi kết quả" summary="Đo bình đang chọn · Khai báo sản phẩm" open={group==='results'} onToggle={toggle('results')}>
        <p>Đo pH và cân mẫu tại <strong>bình {selected}</strong>. Số đo được giữ trong sổ thực hành.</p>
        {action('Đo pH','measure',{vesselId:selected,kind:'ph'})}{action('Cân mẫu','measure',{vesselId:selected,kind:'mass'})}
        <h3 className={styles.operationTitle}>Khai báo sản phẩm</h3>
        <div className={styles.inputField}><label htmlFor="extraction-product-type">Sản phẩm cần khai báo</label><select id="extraction-product-type" value={component} disabled={locked} onChange={e=>setComponent(e.target.value as Component)}>{(['A','B','N'] as const).map(id=><option key={id} value={id}>Chất {id} · {id==='A'?'Axit yếu':id==='B'?'Bazơ yếu':'Trung tính'}</option>)}</select></div>
        <div className={styles.inputField}><label htmlFor="extraction-product-vessel">Bình sản phẩm</label><select id="extraction-product-vessel" value={draft.vesselId} disabled={locked} onChange={e=>editDraft({vesselId:e.target.value as VesselId})}>{(['R1','R2','R3'] as const).map(id=><option key={id} value={id}>{id}</option>)}</select></div>
        <output className={styles.operationState} aria-live="polite"><strong>Khai báo {component} trong {draft.vesselId}</strong><span>{productMass?`Khối lượng đã cân: ${fmt(productMass.value)} mg`:'Chưa cân bình sản phẩm này'}{productMass&&productChange>productMass.sequence?' · Cần cân lại':''} · {productVessel.dry?'Đã làm khô':'Chưa làm khô'}</span></output>
        <div className={styles.inputField}><label htmlFor="extraction-answer">Thu hồi tự tính (%)</label><input id="extraction-answer" type="number" min="0" max="1000" step="0.01" value={draft.answer} disabled={locked} onChange={e=>editDraft({answer:e.target.value})} placeholder="Nhập đáp số của bạn"/></div>
        <button type="button" className={styles.primary} disabled={locked||!draft.answer.trim()||!Number.isFinite(Number(draft.answer))||Number(draft.answer)<0||Number(draft.answer)>1000} onClick={()=>onRun('record_product',{component,vesselId:draft.vesselId,answer:Number(draft.answer)})}>Lưu sản phẩm {component}</button>
        <p>Khối lượng đã cân / 100 mg × 100%. Mẫu lẫn tạp hoặc còn dung môi có thể làm tăng khối lượng. Cân lại nếu có thao tác mới trên bình sản phẩm.</p>
        {saved&&<p>Đã lưu {component} → {saved.vesselId}: {fmt(saved.answer)}%. Sửa và lưu lại để cập nhật.</p>}
      </ExtractionControlGroup>
      <p className={styles.empty}>Nộp bài sẽ khóa lượt, kể cả khi thiếu dữ liệu.</p>
    </>}
  </>
}
