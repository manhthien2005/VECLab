'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { GuestAttemptRepository } from '@/application/attempts/guest-repository.js'
import { createSoapSession } from '@/application/simulation/soap-session.js'
import { SOAP_PROFILE, type SoapState, type SoapVesselId } from '@/domain/experiments/soap/model.js'
import { SOAP_LIMITS, SOAP_SOURCES } from '@/content/evidence/soap.js'
import { WorkbenchFrame, type WorkbenchPane } from '@/features/workbench/frame.js'
import { GuideIcon, ReportIcon, SourcesIcon, TheoryIcon, CloseIcon, InfoIcon } from '@/features/workbench/icons.js'
import { ArrowRightIcon, CheckCircleIcon, FlaskIcon } from '@/features/landing/icons.js'
import { SoapApparatus } from './apparatus.js'
import { SoapControls } from './controls.js'
import { INITIAL_FIELDS, type SoapFields } from './controls-shared.js'
import { SoapNotebook } from './notebook.js'
import { SoapLearningGoal } from './panels.js'
import { makeSoapCue, type SoapCue } from './pour-scene.js'
import { SoapReport } from './report.js'
import { SoapEquipmentArt, type SoapEquipmentKind } from './equipment-art.js'
import { SoapEquipmentPanel } from './equipment-panel.js'
import type { SoapSessionView } from '@/application/simulation/soap-session.js'
import { newUUID } from '@/shared/ids.js'
import bench from '@/features/extraction/bench.module.css'
import chrome from '@/features/extraction/workbench.module.css'
import extra from './workbench.module.css'

const ERRORS: Record<string, string> = {
  ERR_OVERFLOW: 'Vượt quá thể tích cốc.',
  EXCEEDS_SOURCE: 'Cốc nguồn không đủ dung dịch như bạn nhập.',
  EMPTY_SOURCE: 'Cốc nguồn đang trống.',
  LYE_NOT_READY: 'Dung dịch kiềm chưa hợp lệ, vui lòng đọc lại mô tả của bước này.',
  LYE_INDEX_MISMATCH: 'Chỉ số dung dịch khác với dung dịch kiềm đang có trong cốc đích (nồng độ chênh quá 1 %).',
  STIR_NEEDS_BOTH: 'Cần có cả kiềm và dầu trong cốc trộn mới khuấy được.',
  ALREADY_STIRRED: 'Hỗn hợp đã khuấy rồi.',
  STIR_REQUIRED: 'Khuấy hỗn hợp trước khi chờ dung dịch đặc lại.',
  STIR_REQUIRED_BEFORE_MOLD: 'Khuấy hỗn hợp trước khi đổ khuôn.',
  ERR_SEIZING: 'Hỗn hợp đã đông cứng trong cốc. Dùng “Làm lại hỗn hợp”.',
  ALREADY_TRACED: 'Dung dịch đã đặc lại.',
  MIX_ALREADY_THICK: 'Hỗn hợp đã đặc lại, không thêm được nữa.',
  RETURN_NOT_ALLOWED: 'Cốc trộn có cả kiềm và dầu nên không đổ lại được. Dùng “Đổ bỏ dung dịch”.',
  RETURN_WRONG_TARGET: 'Dung dịch này không về được cốc đã chọn.',
  OIL_IN_CUP: 'Trong cốc còn dầu. Loại bỏ dầu cũ (hoặc đổ bỏ hỗn hợp) trước khi đổi loại dầu.',
  NOTHING_TO_DISCARD: 'Không có gì để bỏ.',
  MOLD_IN_USE: 'Khuôn đang chứa mẫu trước.',
  MAX_SAMPLES: 'Đã đủ ' + SOAP_PROFILE.maxSamples + ' mẫu. Hoàn thành thí nghiệm để chấm điểm.',
  NOT_IN_MOLD: 'Chưa có hỗn hợp trong khuôn.',
  GEL_INCOMPLETE: 'Chờ ' + SOAP_PROFILE.gelHours + ' giờ trong khuôn trước khi tháo.',
  NOT_UNMOLDED: 'Tháo khuôn trước khi đợi ' + SOAP_PROFILE.cureWeeks + ' tuần.',
  NOT_CURED: 'Đợi ' + SOAP_PROFILE.cureWeeks + ' tuần rồi mới đo.',
  NO_SAMPLE: 'Cần ít nhất 1 mẫu thử trước khi hoàn thành.',
  ALREADY_COOL: 'Dung dịch kiềm đã nguội.',
  INVALID_AMOUNT: 'Số lượng chưa hợp lệ.',
  INVALID_OIL: 'Chọn dầu ô liu, dừa hoặc cọ.',
  ATTEMPT_COMPLETED: 'Thí nghiệm đã kết thúc.',
  UNDECLARED_PARAMETER_UNIT: 'Số liệu chưa gửi kèm đơn vị.',
}

const CUE_MS = { pour: 2600, unmold: 2600, stir: 1800 } as const

export function SoapWorkbench({ attemptId, openReport = false, initialPane = 'simulation' }: {
  attemptId: string | null
  openReport?: boolean
  initialPane?: WorkbenchPane
}) {
  const router = useRouter()
  const [repository] = useState(() => new GuestAttemptRepository<SoapState>())
  const [session] = useState(() => createSoapSession(repository))
  const [view, setView] = useState<SoapSessionView | null>(null)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<SoapVesselId | null>(null)
  const [pane, setPane] = useState<WorkbenchPane>(initialPane)
  const [report, setReport] = useState(openReport)
  const [cue, setCue] = useState<SoapCue | null>(null)
  const [fields, setFields] = useState<SoapFields>(INITIAL_FIELDS)
  const [equipmentItem, setEquipmentItem] = useState<SoapEquipmentKind | null>(null)
  const lock = useRef(false)
  const cueSeq = useRef(0)
  const opening = useRef<Promise<SoapSessionView> | null>(null)

  useEffect(() => {
    let cancelled = false
    if (attemptId) {
      void session.load(attemptId as Parameters<typeof session.load>[0]).then((result) => {
        if (cancelled) return
        if (result?.ok) setView(result.state)
        else setError('Không mở được lượt xà phòng này.')
        setLoading(false)
      }).catch(() => { if (!cancelled) { setError('Chưa đọc được dữ liệu trình duyệt.'); setLoading(false) } })
    } else {
      opening.current ??= session.start()
      void opening.current.then((next) => {
        if (!cancelled) router.replace('/simulate/cold-process-soap?attempt=' + next.attemptId)
      }).catch(() => { if (!cancelled) { setError('Chưa tạo được lượt.'); setLoading(false) } })
    }
    return () => { cancelled = true }
  }, [attemptId, session, router])

  useEffect(() => {
    if (!error) return
    const id = window.setTimeout(() => setError(''), 7000)
    return () => window.clearTimeout(id)
  }, [error])

  useEffect(() => {
    if (!cue) return
    const id = window.setTimeout(() => setCue(null), CUE_MS[cue.kind])
    return () => window.clearTimeout(id)
  }, [cue])

  const run = useCallback(async (
    type: string,
    parameters: Record<string, string | number | boolean> = {},
    units: Record<string, string> = {},
  ) => {
    if (!view || lock.current || view.status !== 'in_progress') return
    lock.current = true
    setBusy(true)
    setError('')
    try {
      const result = type === 'complete'
        ? await session.complete(view.attemptId, { actionId: newUUID(), expectedRevision: view.revision })
        : await session.apply(view.attemptId, type, parameters, units, { actionId: newUUID(), expectedRevision: view.revision })
      if (result.ok) {
        setView(result.state)
        const replayed = 'feedback' in result && result.feedback.idempotentReplay
        if (!replayed) {
          cueSeq.current += 1
          setCue(makeSoapCue(cueSeq.current, type, parameters, view.projection, result.state.projection))
          if (type === 'pour_to_mold') setSelected('D')
        }
        if (type === 'complete') setReport(true)
      } else {
        const code = 'error' in result ? result.error.code : 'SAVE'
        setError(ERRORS[code] ?? 'Thao tác chưa hợp lệ.')
      }
    } catch {
      setError('Chưa lưu được thao tác. Thử lại trên cùng lượt.')
    } finally {
      lock.current = false
      setBusy(false)
    }
  }, [session, view])

  const lockReason = busy ? 'Đang lưu thao tác. Chờ xác nhận trước khi tiếp tục.' : view?.status !== 'in_progress' ? 'Lượt đã kết thúc.' : null
  const p = view?.projection
  const guideBaseHref = '/experiments/cold-process-soap/guide' + (view ? '?attempt=' + encodeURIComponent(view.attemptId) : '')
  const header = <>
    <Link className={bench.brand} href="/" aria-label="Trang chủ VECLab"><span><FlaskIcon /></span><strong>VECLab</strong></Link>
    <Link className={bench.back} href="/experiments"><ArrowRightIcon />Thí nghiệm</Link>
    <div className={bench.title}><h1>Xà phòng hóa</h1><p>Cold process · NaOH vào nước · kiềm vào dầu</p></div>
    <SoapLearningGoal />
    <div className={bench.headerActions}>
      <span className={bench.saveState} role="status" aria-live="polite"><CheckCircleIcon />
        {loading ? 'Đang mở lượt…' : busy ? 'Đang lưu…' : view ? 'Đã lưu trên thiết bị' : 'Chưa mở được lượt'}
      </span>
      <button className={bench.button + ' ' + bench.reportButton} type="button" disabled={!view?.report} onClick={() => setReport(true)} aria-label="Báo cáo"><ReportIcon /><span>Báo cáo</span></button>
    </div>
  </>
  const shelf = <div className={bench.shelfContent}>
    <div className={bench.inventory}>
      {([['ppe', 'Kính và găng', 'Đã đeo sẵn'], ['lye', 'NaOH và nước', 'Rắn vào nước'], ['oils', 'Dầu', 'Ô liu · dừa · cọ'], ['mold', 'Khuôn silicone', 'Một mẫu mỗi lần'], ['meter', 'pH và cân', 'N/A nếu chưa đo']] as const)
        .map(([kind, title, description]) => <button type="button" className={bench.equipment} key={kind} aria-haspopup="dialog" aria-label={'Tìm hiểu ' + title} onClick={() => setEquipmentItem(kind)}>
          <SoapEquipmentArt kind={kind} /><span className={bench.equipmentText}><strong>{title}</strong><span>{description}</span></span><span className={bench.equipmentInfo}><InfoIcon /></span>
        </button>)}
    </div>
    <div className={bench.shelfHelp}>
      <p className={bench.shelfNote}>NaOH vào nước. Kiềm vào dầu. Nước vào NaOH rắn làm vỡ cốc và dừng thí nghiệm.</p>
      <button className={bench.guideButton} type="button" disabled={!view} onClick={() => setSelected('W')}><GuideIcon />Bắt đầu từ cốc kiềm</button>
      <Link className={bench.theoryLink} href={guideBaseHref} target="_blank" rel="noopener noreferrer"><TheoryIcon /><span>Lý thuyết & cách làm bài</span></Link>
      <details><summary><SourcesIcon />Nguồn & giới hạn</summary>
        <ul>{SOAP_LIMITS.map((item) => <li key={item}>{item}</li>)}</ul>
        <ul>{SOAP_SOURCES.map((source) => <li key={source.key}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a></li>)}</ul>
      </details>
    </div>
  </div>
  const equipment = equipmentItem && <SoapEquipmentPanel item={equipmentItem} onItemChange={setEquipmentItem} onClose={() => setEquipmentItem(null)} />

  if (!view || !p) {
    return <div className={chrome.root}><WorkbenchFrame label="Bàn xà phòng hóa" header={header} shelf={shelf}
      simulation={<div className={bench.entry}>{loading ? <p role="status">Đang mở bàn thực hành…</p> : <div role="alert"><h2>Chưa mở được lượt</h2><p>{error}</p></div>}</div>}
      controls={<p className={bench.empty}>Thao tác hiện khi lượt sẵn sàng.</p>} notebook={<p className={bench.empty}>Chưa có mẫu thử.</p>}
      pane={pane} onPaneChange={setPane} onShelfInfo={() => setEquipmentItem('ppe')} />{equipment}</div>
  }
  return <div className={chrome.root}>
    <WorkbenchFrame label="Bàn xà phòng hóa" header={header} shelf={shelf}
      simulation={<SoapApparatus projection={p} selected={selected} onSelect={setSelected} cue={cue} />}
      controls={<SoapControls projection={p} selected={selected} onSelect={setSelected} lockReason={lockReason}
        fields={fields} onField={(key, value) => setFields((current) => ({ ...current, [key]: value }))}
        onRun={(type, parameters, units) => void run(type, parameters, units)} />}
      notebook={<SoapNotebook projection={p} revision={view.revision} />} pane={pane} onPaneChange={setPane} onShelfInfo={() => setEquipmentItem('ppe')} />
    {report && view.report && <Modal title="Kết quả thí nghiệm xà phòng" onClose={() => setReport(false)}>
      <SoapReport report={view.report} />
    </Modal>}
    {error && <div className={extra.toast} role="alert">
      <strong>Thao tác chưa hợp lệ</strong>
      <p>{error}</p>
      <button type="button" onClick={() => setError('')}>Đóng</button>
    </div>}
    {equipment}
  </div>
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const opener = document.activeElement
    ref.current?.showModal()
    return () => { if (opener instanceof HTMLElement && opener.isConnected) opener.focus() }
  }, [])
  return <dialog ref={ref} className={chrome.modal} aria-label={title} onCancel={(event) => { event.preventDefault(); onClose() }}
    onClick={(event) => { const r = event.currentTarget.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) onClose() }}>
    <header><h2>{title}</h2><button className={bench.button} type="button" onClick={onClose}><CloseIcon />Đóng</button></header>
    {children}
  </dialog>
}
