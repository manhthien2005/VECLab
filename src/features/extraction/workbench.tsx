'use client'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { GuestAttemptRepository } from '@/application/attempts/guest-repository.js'
import { createExtractionSession, type ExtractionSessionView } from '@/application/simulation/extraction-session.js'
import { LEGACY_EXTRACTION_PROFILE, type ExtractionState, type VesselId } from '@/domain/experiments/acid-base-extraction/model.js'
import { newUUID } from '@/shared/ids.js'
import { WorkbenchFrame, type WorkbenchPane } from '@/features/workbench/frame.js'
import { TheoryIcon, GuideIcon, SourcesIcon, ReportIcon, SubmitIcon, CloseIcon, InfoIcon } from '@/features/workbench/icons.js'
import { ExtractionApparatus } from './apparatus.js'
import { ExtractionReport } from './report.js'
import { EXTRACTION_TOUR } from './tour.js'
import { FlaskIcon, ArrowRightIcon, CheckCircleIcon } from '@/features/landing/icons.js'
import { ExtractionEquipmentArt } from './equipment-art.js'
import { ExtractionControls } from './controls.js'
import { ExtractionNotebook } from './notebook.js'
import { ExtractionLearningGoal } from './panels.js'
import { ExtractionEquipmentPanel, type ExtractionEquipmentKind } from './equipment-panel.js'
import bench from './bench.module.css'
import styles from './workbench.module.css'
const ERRORS: Record<string,string> = { NO_LIQUID:'Bình chưa có dịch để thực hiện thao tác.', NO_SOLID:'Chưa có chất rắn để lọc.', NO_ORGANIC:'Chưa có dung môi hữu cơ để cô.', EMPTY_VESSEL:'Bình chưa có mẫu để làm khô.', ALREADY_DRY:'Mẫu đã làm khô.', VENT_FIRST:'Xả áp trước khi để phân lớp.', SEPARATE_FIRST:'Để hai pha phân lớp trước khi thu dịch.', NOT_ENOUGH_LIQUID:'Bình không có đủ thể tích của pha đã chọn.', CAPACITY_EXCEEDED:'Thể tích vượt dung tích 250 mL của bình.', ORGANIC_ONLY:'Chỉ cô phần dịch hữu cơ đã tách khỏi pha nước.', FILTER_OR_EVAPORATE_FIRST:'Lọc lấy rắn hoặc cô dung môi trước khi làm khô. Chỉ giữ tối đa 0,5 mL dịch trên mẫu.', SAME_VESSEL:'Chọn hai bình khác nhau.', INVALID_VOLUME:'Nhập thể tích lớn hơn 0 và không vượt 250 mL.' }
function Modal({ title, onClose, children }: { title:string; onClose:()=>void; children:ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => { const opener=document.activeElement; ref.current?.showModal(); return()=>{if(opener instanceof HTMLElement && opener.isConnected) opener.focus()} }, [])
  return <dialog ref={ref} className={styles.modal} aria-label={title} onCancel={event => { event.preventDefault(); onClose() }} onClick={event => { const r=event.currentTarget.getBoundingClientRect(); if(event.clientX<r.left || event.clientX>r.right || event.clientY<r.top || event.clientY>r.bottom) onClose() }}><header><h2>{title}</h2><button className={bench.button} type="button" onClick={onClose}><CloseIcon />Đóng</button></header>{children}</dialog>
}
export function ExtractionWorkbench({ attemptId, openReport = false, initialPane = 'simulation' }: { attemptId:string|null; openReport?:boolean; initialPane?:WorkbenchPane }) {
  const router=useRouter()
  const [repository]=useState(()=>new GuestAttemptRepository<ExtractionState>())
  const [session]=useState(()=>createExtractionSession(repository))
  const [pendingType,setPendingType]=useState<string|null>(null)
  const [view,setView]=useState<ExtractionSessionView|null>(null), [busy,setBusy]=useState(false), [loading,setLoading]=useState(true), [error,setError]=useState('')
  const [selected,setSelected]=useState<VesselId>('S'), [pane,setPane]=useState<WorkbenchPane>(initialPane), [tour,setTour]=useState(false), [equipmentItem,setEquipmentItem]=useState<ExtractionEquipmentKind|null>(null), [confirm,setConfirm]=useState(false), [report,setReport]=useState(openReport)
  const [motion,setMotion]=useState('idle')
  const lock=useRef(false), pending=useRef<{id:ReturnType<typeof newUUID>;type:string;parameters:Record<string,string|number|boolean>;units:Record<string,string>;revision:number}|null>(null)
  const opening=useRef<Promise<ExtractionSessionView>|null>(null)
  const tourTrigger=useRef<HTMLButtonElement>(null)
  useEffect(()=>{
    let cancelled=false
    if(attemptId) {
      void session.load(attemptId as Parameters<typeof session.load>[0]).then(result=>{
        if(cancelled)return
        if(result?.ok)setView(result.state)
        else setError('Không mở được lượt này: dữ liệu không tồn tại hoặc không thuộc hồ sơ chiết tách hiện tại.')
        setLoading(false)
      }).catch(()=>{if(!cancelled){setError('Chưa đọc được dữ liệu lưu trên trình duyệt.');setLoading(false)}})
    } else {
      // Reuse the promise during Strict Mode's effect replay: one entry creates one attempt.
      opening.current ??= session.start()
      void opening.current.then(next=>{if(!cancelled)router.replace('/simulate/acid-base-extraction?attempt='+next.attemptId)}).catch(()=>{if(!cancelled){setError('Chưa tạo được lượt. Kiểm tra quyền lưu dữ liệu trình duyệt rồi thử lại.');setLoading(false)}})
    }
    return()=>{cancelled=true}
  },[attemptId,session,router])
  async function start(){if(lock.current)return;lock.current=true;setBusy(true);setError('');try{const next=await session.start();setLoading(true);router.replace('/simulate/acid-base-extraction?attempt='+next.attemptId)}catch{setError('Chưa tạo được lượt. Kiểm tra quyền lưu dữ liệu trình duyệt rồi thử lại.')}finally{lock.current=false;setBusy(false)}}
  async function run(type:string,parameters:Record<string,string|number|boolean>={},units:Record<string,string>={},retry=false){
    if(!view || lock.current)return
    const request=retry?pending.current:{id:newUUID(),type,parameters,units,revision:view.revision}
    if(!request)return
    lock.current=true;pending.current=request;setPendingType(request.type);setBusy(true);setError('')
    try{
      const result=request.type==='complete'?await session.complete(view.attemptId,{actionId:request.id,expectedRevision:request.revision}):await session.apply(view.attemptId,request.type,request.parameters,request.units,{actionId:request.id,expectedRevision:request.revision})
      if(result.ok){setView(result.state);setMotion(request.type+'-'+String(request.parameters.vesselId??request.parameters.from??'')+'-'+result.state.lastSequence);pending.current=null;setPendingType(null);if(request.type==='complete'){setConfirm(false);setReport(true)}}
      else{pending.current=null;setPendingType(null);setError('error' in result ? ERRORS[result.error.code] ?? 'Thao tác chưa hợp lệ. Kiểm tra bình, thể tích và phương pháp đã chọn.' : 'outcome' in result && result.outcome==='revision_conflict'?'Lượt đã được thay đổi ở tab khác. Tải lại trước khi tiếp tục.':'Chưa lưu được thao tác. Hãy tải lại lượt.')}
    }catch{setError('Chưa nhận được xác nhận lưu. Bấm thử lại để gửi cùng thao tác, tránh ghi hai lần.')}finally{lock.current=false;setBusy(false)}
  }
  const selectVessel=(id:VesselId)=>setSelected(id)
  const done=view?.status==='completed'
  const header=<>
    <Link className={bench.brand} href="/" aria-label="Trang chủ VECLab"><span><FlaskIcon/></span><strong>VECLab</strong></Link>
    <Link className={bench.back} href="/experiments"><ArrowRightIcon/>Thí nghiệm</Link>
    <div className={bench.title}><h1>Chiết tách axit–bazơ</h1><p>Chiết · Thu pha · Lọc · Cân sản phẩm</p></div>
    <ExtractionLearningGoal legacy={view?.releaseId===LEGACY_EXTRACTION_PROFILE.releaseId}/>
    <div className={bench.headerActions}><span className={bench.saveState} role="status" aria-live="polite"><CheckCircleIcon/>{loading?'Đang mở lượt…':busy?'Đang lưu…':pendingType!==null?'Chưa xác nhận lưu':view?'Đã lưu trên thiết bị':'Chưa mở được lượt'}</span>
      <button className={bench.button+' '+bench.reportButton} type="button" disabled={!done} onClick={()=>setReport(true)} aria-label="Báo cáo" title={done?'Xem kết quả và đối chiếu đáp số đã nộp':'Báo cáo xuất hiện sau khi nộp bài'}><ReportIcon/><span>Báo cáo</span></button>
      <button className={bench.primary} type="button" disabled={!view||busy||pendingType!==null} onClick={()=>done?setReport(true):setConfirm(true)}>{done?<CheckCircleIcon/>:<SubmitIcon/>}{done?'Đã nộp':'Nộp bài'}</button>
    </div>
  </>
  const shelf=<div className={bench.shelfContent}><div className={bench.inventory}>
    {([['sample','Mẫu chuẩn A/B/N','100 mg / cấu tử'],['funnel','Phễu chiết','Hai pha không trộn lẫn'],['flasks','Bình thu mẫu','R1 / R2 / R3'],['reagents','Axit & bazơ chuẩn','0,1 M'],['meter','Máy đo pH & cân','pH · Khối lượng'],['filter','Lọc & cô dung môi','Thu chất rắn']] as const).map(([kind,label,description])=><button className={bench.equipment} key={kind} type="button" aria-haspopup="dialog" aria-label={'Tìm hiểu '+label} onClick={()=>setEquipmentItem(kind)}><ExtractionEquipmentArt kind={kind}/><span className={bench.equipmentText}><strong>{label}</strong><span>{description}</span></span><span className={bench.equipmentInfo}><InfoIcon/></span></button>)}
    </div><div className={bench.shelfHelp}><p className={bench.shelfNote}>Mẫu chuẩn A/B/N dùng để học tập.</p>
      <button ref={tourTrigger} className={bench.guideButton} type="button" disabled={!view} onClick={()=>setTour(true)}><GuideIcon/>Hướng dẫn thao tác</button>
      <Link className={bench.theoryLink} href={'/experiments/acid-base-extraction/guide'+(view?'?attempt='+view.attemptId:'')}><TheoryIcon/><span>Lý thuyết & cách làm bài</span></Link>
      <details><summary><SourcesIcon/>Nguồn & giới hạn</summary><p>Cân bằng lý tưởng của mẫu A/B/N ở 25 °C. Các hệ số là quy ước học tập, chưa hiệu chuẩn cho hóa chất thật.</p><Link href={'/experiments/acid-base-extraction/guide'+(view?'?attempt='+view.attemptId:'')+'#extraction-sources'}>Tài liệu phương pháp và hồ sơ mẫu <ArrowRightIcon/></Link><p>Không suy quy trình thực tế từ kết quả mô phỏng.</p></details>
    </div></div>
  const equipment=equipmentItem&&<ExtractionEquipmentPanel item={equipmentItem} onItemChange={setEquipmentItem} onClose={()=>setEquipmentItem(null)}/>
  if(!view)return <div className={styles.root}><WorkbenchFrame label="Bàn chiết tách axit–bazơ" header={header} shelf={shelf} simulation={<div className={bench.entry}>{loading?<p role="status">Đang mở bàn thực hành…</p>:<div role="alert"><h2>Chưa mở được lượt chiết tách</h2><p>{error}</p>{attemptId?<Link className={bench.primary} href="/simulate/acid-base-extraction">Bắt đầu lượt mới</Link>:<button className={bench.primary} type="button" disabled={busy} onClick={()=>void start()}>Thử lại</button>}</div>}</div>} controls={<p className={bench.empty}>Thao tác sẽ xuất hiện khi lượt sẵn sàng.</p>} notebook={<p className={bench.empty}>Chưa có phép đo.</p>} pane={pane} onPaneChange={setPane} onShelfInfo={()=>setEquipmentItem('sample')}/>{equipment}</div>
  const controls=<ExtractionControls projection={view.projection} selected={selected} onSelect={selectVessel} locked={busy||pendingType!==null} done={done} onRun={(type,params={},units={})=>void run(type,params,units)} onReport={()=>setReport(true)} onNotebook={()=>setPane('notebook')}/>
  const notebook=<ExtractionNotebook projection={view.projection} actions={view.actions} revision={view.revision} selected={selected}/>

  return <div className={styles.root}><WorkbenchFrame label="Bàn chiết tách axit–bazơ" header={header} shelf={shelf} simulation={<ExtractionApparatus projection={view.projection} selected={selected} onSelect={selectVessel} motion={motion} distribution={view.report?.distribution}/>} controls={controls} notebook={notebook} pane={pane} onPaneChange={setPane} tourSteps={EXTRACTION_TOUR} tourOpen={tour} onTourClose={()=>{setTour(false);requestAnimationFrame(()=>tourTrigger.current?.focus({preventScroll:true}))}} onShelfInfo={()=>setEquipmentItem('sample')} notices={error?<div role="alert" className={styles.error}>{error} {pendingType!==null&&<button className={bench.button} disabled={busy} onClick={()=>void run('',{}, {},true)}>Thử lại thao tác</button>}<button className={bench.button} onClick={()=>location.reload()}>Tải lại lượt</button></div>:undefined}/>
    {equipment}
    {confirm&&<Modal title="Xác nhận nộp bài chiết tách" onClose={()=>setConfirm(false)}><p>Đã lưu {view.projection.readings.length} phép đo, khai báo {Object.keys(view.projection.submissions).length}/3 sản phẩm. Sau nộp, lượt sẽ khóa và báo cáo hiện thành phần theo mô hình.</p>{Object.keys(view.projection.submissions).length<3&&<p className={styles.disclosure}>Còn sản phẩm chưa khai báo. Bạn có thể quay lại hoặc nộp lượt chưa hoàn chỉnh.</p>}{error&&<p role="alert">{error}</p>}{pendingType==='complete'&&<button className={bench.button} disabled={busy} type="button" onClick={()=>void run('',{}, {},true)}>Thử lại nộp bài</button>}<button className={bench.primary} disabled={busy||pendingType!==null} type="button" onClick={()=>void run('complete')}>{busy?'Đang lưu báo cáo…':'Xác nhận nộp bài'}</button></Modal>}
    {report&&view.report&&<Modal title="Báo cáo chiết tách axit–bazơ" onClose={()=>setReport(false)}><ExtractionReport report={view.report} actions={view.actions}/><div className={styles.links}><button className={bench.button} type="button" onClick={()=>{setReport(false);setPane('notebook')}}>Xem sổ đo</button><Link className={bench.primary} href="/simulate/acid-base-extraction">Làm lượt mới</Link></div></Modal>}
  </div>
}
