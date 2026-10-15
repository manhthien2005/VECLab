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
export function ExtractionControls({projection,selected,onSelect,locked,done,onRun,onReport,onNotebook}: {
  projection:ExtractionProjection;selected:VesselId;onSelect:(id:VesselId)=>void;locked:boolean;done:boolean;onRun:Command;onReport:()=>void;onNotebook:()=>void
}) {
  const [group,setGroup]=useState<string|null>('prepare')
  const [volume,setVolume]=useState('20'),[transferVolume,setTransferVolume]=useState('20'),[reagent,setReagent]=useState('acid')
  const [destination,setDestination]=useState<VesselId>('R1'),[phase,setPhase]=useState('aqueous')
  const [component,setComponent]=useState<Component>('A'),[product,setProduct]=useState<VesselId>('R1'),[answer,setAnswer]=useState('')
  const current=projection.vessels.find(v=>v.id===selected)!
  const receiver=destination===selected?(selected==='R1'?'R2':'R1'):destination
  const latest=projection.readings.filter(r=>r.vesselId===selected).at(-1)
  const toggle=(id:string)=>()=>setGroup(group===id?null:id)
  function action(label:string,type:string,parameters:Record<string,string|number|boolean>={},primary=false){return <button type="button" className={primary?styles.primary:styles.button} disabled={locked} onClick={()=>onRun(type,parameters)}>{label}</button>}
  return <>
    <div className={styles.controlsHeading}><h2>Thao tác</h2><select className={styles.cupSelect} aria-label="Bình đang thao tác" value={selected} disabled={locked} onChange={event=>onSelect(event.target.value as VesselId)}>{VESSEL_IDS.map(id=><option key={id} value={id}>Bình {id}</option>)}</select></div>
    <p className={styles.cupContext}><span>{VESSEL_NAMES[selected]}</span><span>{fmt(current.waterMl+current.organicMl,1)} mL</span></p>
    {done?<div className={styles.readonly}><h3>Lượt đã hoàn thành</h3><p>Bạn vẫn có thể chọn các bình để xem số liệu. Các thao tác đã khóa.</p><button type="button" className={styles.primary} onClick={onReport}><ReportIcon/>Xem báo cáo kết quả</button><button type="button" className={styles.button} onClick={onNotebook}>Xem sổ đo</button><Link className={styles.button} href="/simulate/acid-base-extraction">Bắt đầu lượt chiết tách mới</Link></div>:<>
      <ExtractionControlGroup id="prepare" title="Cấp dung dịch" summary="Axit · Bazơ · Nước · Dung môi" open={group==='prepare'} onToggle={toggle('prepare')}>
        <div className={styles.inputField}><label htmlFor="extraction-reagent">Dung dịch</label><select id="extraction-reagent" value={reagent} disabled={locked} onChange={e=>setReagent(e.target.value)}><option value="acid">Axit chuẩn (0,1 M)</option><option value="base">Bazơ chuẩn (0,1 M)</option><option value="water">Nước</option><option value="solvent">Dung môi hữu cơ chuẩn</option></select></div>
        <div className={styles.inputField}><label htmlFor="extraction-add-volume">Thể tích dung dịch (mL)</label><input id="extraction-add-volume" type="number" min="0.1" max="250" step="0.1" value={volume} disabled={locked} onChange={e=>setVolume(e.target.value)}/></div>
        <button type="button" className={styles.primary} disabled={locked} onClick={()=>onRun('add_reagent',{vesselId:selected,reagent,volumeL:Number(volume)},{volumeL:'mL'})}>Thêm {volume||'…'} mL vào {selected}</button>
      </ExtractionControlGroup>
      <ExtractionControlGroup id="program" title="Trộn & phân lớp" summary="Trộn mẫu · Xả áp · Thu hai pha" open={group==='program'} onToggle={toggle('program')}>
        {action('Trộn','mix',{vesselId:selected},true)}{action('Xả áp','vent',{vesselId:selected})}{action('Để phân lớp','settle',{vesselId:selected})}
        <p>{current.vented?'Đã xả áp':'Chưa xả áp'} · {current.separated?'Đã sẵn sàng thu pha':'Chờ phân lớp'}</p>
      </ExtractionControlGroup>
      <ExtractionControlGroup id="transfer" title="Chuyển & thu hồi mẫu" summary="Thu pha · Lọc · Cô · Làm khô" open={group==='transfer'} onToggle={toggle('transfer')}>
        <div className={styles.inputField}><label htmlFor="extraction-destination">Bình nhận</label><select id="extraction-destination" value={receiver} disabled={locked} onChange={e=>setDestination(e.target.value as VesselId)}>{VESSEL_IDS.filter(id=>id!==selected).map(id=><option key={id} value={id}>{id} · {VESSEL_NAMES[id]}</option>)}</select></div>
        <div className={styles.inputField}><label htmlFor="extraction-phase">Phần dịch cần chuyển</label><select id="extraction-phase" value={phase} disabled={locked} onChange={e=>setPhase(e.target.value)}><option value="aqueous">Pha nước (lớp dưới)</option><option value="organic">Pha hữu cơ (lớp trên)</option><option value="all">Toàn mẫu theo thể tích</option></select></div>
        <div className={styles.inputField}><label htmlFor="extraction-transfer-volume">Thể tích cần chuyển (mL)</label><input id="extraction-transfer-volume" type="number" min="0.1" max="250" step="0.1" value={transferVolume} disabled={locked} onChange={e=>setTransferVolume(e.target.value)}/></div>
        <button type="button" className={styles.primary} disabled={locked} onClick={()=>onRun('transfer',{from:selected,to:receiver,phase,volumeL:Number(transferVolume)},{volumeL:'mL'})}>Chuyển {transferVolume||'…'} mL → {receiver}</button>
        {action('Lọc chất rắn → '+receiver,'filter',{from:selected,to:receiver})}{action('Cô dung môi','evaporate',{vesselId:selected})}{action('Làm khô','dry',{vesselId:selected})}
      </ExtractionControlGroup>
      <ExtractionControlGroup id="results" title="Đo & ghi kết quả" summary="pH · Khối lượng · Sản phẩm nộp" open={group==='results'} onToggle={toggle('results')}>
        <output aria-live="polite" className={styles.readonly}><strong>{latest?`${latest.kind==='mass'?'Khối lượng mô hình':'pH'}: ${fmt(latest.value)}${latest.kind==='mass'?' mg':''}`:'Chưa có phép đo'}</strong><p>{latest?'Bình '+selected+' · Bước đo '+latest.sequence:'Chọn bình rồi thực hiện phép đo.'}</p></output>
        {action('Đo pH','measure',{vesselId:selected,kind:'ph'})}{action('Cân mẫu','measure',{vesselId:selected,kind:'mass'})}
        <div className={styles.inputField}><label htmlFor="extraction-product-type">Sản phẩm cần khai báo</label><select id="extraction-product-type" value={component} disabled={locked} onChange={e=>setComponent(e.target.value as Component)}>{(['A','B','N'] as const).map(id=><option key={id} value={id}>Cấu tử {id}</option>)}</select></div>
        <div className={styles.inputField}><label htmlFor="extraction-product-vessel">Bình sản phẩm</label><select id="extraction-product-vessel" value={product} disabled={locked} onChange={e=>setProduct(e.target.value as VesselId)}>{(['R1','R2','R3'] as const).map(id=><option key={id} value={id}>{id}</option>)}</select></div>
        <div className={styles.inputField}><label htmlFor="extraction-answer">Thu hồi biểu kiến tự tính (%)</label><input id="extraction-answer" type="number" min="0" max="1000" step="0.01" value={answer} disabled={locked} onChange={e=>setAnswer(e.target.value)} placeholder="Nhập đáp số của bạn"/></div>
        <button type="button" className={styles.primary} disabled={locked||!answer.trim()||!Number.isFinite(Number(answer))} onClick={()=>onRun('record_product',{component,vesselId:product,answer:Number(answer)})}>Lưu sản phẩm {component}</button>
        <p>Khối lượng đã cân / 100 mg × 100%. Mẫu lẫn tạp hoặc còn dung môi có thể làm tăng khối lượng.</p>
      </ExtractionControlGroup>
      <p className={styles.empty}>Nộp bài sẽ khóa lượt, kể cả khi thiếu dữ liệu.</p>
    </>}
  </>
}
