'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { WorkbenchFrame, type WorkbenchPane } from '@/features/workbench/frame.js'
import { OperationHelp } from '@/features/workbench/operation-help.js'
import { ActionButton } from '@/features/workbench/action-button.js'
import { JAR_OPERATION_HELP } from '@/content/operation-help.vi.js'
import { FlaskIcon, ArrowRightIcon, CheckCircleIcon } from '@/features/landing/icons.js'
import { TargetIcon, GuideIcon, TheoryIcon, SourcesIcon, ReportIcon, SubmitIcon, CloseIcon, InfoIcon, ControlIcon } from '@/features/workbench/icons.js'
import { EquipmentPanel, type EquipmentKind } from './equipment-panel.js'
import { EquipmentArt } from './equipment-art.js'
import { JarSubmitDialog, JarReportDialog, JarProgramDialog } from './completion.js'
import { JarNotebook } from './notebook.js'
import type { UUID } from '@/domain/process/contracts.js'
import { parseUUID, newUUID } from '@/shared/ids.js'
import {
  JAR_CUP_IDS, JAR_PROFILE, type JarCupId,
} from '@/domain/experiments/jar-test/model.js'
import type {
  JarSessionView, JarSession, JarActionResult, JarCompletionResult,
} from '@/application/simulation/jar-session.js'
import type { JarReadingView, JarCupProjection, JarProjection } from '@/application/scenarios/jar-projection.js'
import { GuestAttemptRepository } from '@/application/attempts/guest-repository.js'
import { createJarSession } from '@/application/simulation/jar-session.js'
import type { JarState } from '@/domain/experiments/jar-test/model.js'
import { JarApparatus, type JarVisualCue } from './apparatus.js'
import styles from './workbench.module.css'

const JAR_PATH = '/simulate/jar-test'
type Mode = 'local'
type Props = {
  attemptId: string | null
  invalidAttempt?: boolean
  storageMode: Mode
  openReport?: boolean
  initialPane?: WorkbenchPane
}
type PendingIntent = {
  attemptId: UUID
  actionId: UUID
  expectedRevision: number
  actionType: string | null
  parameters: Record<string, string | number | boolean>
  units: Record<string, string>
}
type LoadState = 'idle' | 'loading' | 'ready' | 'missing' | 'load_error' | 'start_error'
type Issue = { message: string; conflict: boolean }

const PHASES = [
  { id: 'rapid', name: 'Khuấy nhanh', seconds: 60, rpm: 100 },
  { id: 'slow', name: 'Khuấy chậm', seconds: 1200, rpm: 40 },
  { id: 'settling', name: 'Lắng', seconds: 1800, rpm: 0 },
] as const

const PHASE_NAME = {
  setup: 'Chuẩn bị',
  rapid: 'Khuấy nhanh',
  slow: 'Khuấy chậm',
  settling: 'Lắng',
  completed: 'Đã hoàn thành',
}

function controlGroupFor(projection: JarProjection, cupId: JarCupId): string {
  if (!projection.initialMeasurement?.valid && projection.phase === 'setup') return 'baseline'
  if (projection.phase === 'rapid' || projection.phase === 'slow') return 'program'
  if (projection.phase === 'settling' || projection.phase === 'completed') return 'results'
  return projection.cups.some((cup) => cup.id === cupId) ? 'dose' : 'prepare'
}

function readingLabel(reading: JarReadingView | null | undefined): string {
  if (!reading?.valid || reading.valueNtu === null) return 'N/A'
  return reading.valueNtu.toLocaleString('vi-VN', { maximumFractionDigits: 4 }) + ' NTU'
}

function readingNote(reading: JarReadingView | null | undefined): string {
  if (!reading) return 'Chưa thực hiện phép đo'
  return reading.valid ? 'Số đo đã lưu' :
    reading.invalidReason === 'PROTOCOL_INCOMPLETE'
      ? 'Phép đo không hợp lệ: quy trình chưa hoàn tất'
      : 'Phép đo không hợp lệ'
}

function refusalMessage(outcome: JarActionResult | JarCompletionResult): Issue {
  if (outcome.ok) return { message: '', conflict: false }
  if ('error' in outcome) {
    const code = outcome.error.code
    const named: Record<string, string> = {
      CUPS_LOCKED: 'Chỉ chuẩn bị cốc khi máy đang ở pha chuẩn bị.',
      CUP_ALREADY_PREPARED: 'Cốc này đã được chuẩn bị.',
      INITIAL_ALREADY_MEASURED: 'Mẫu ban đầu đã được đo.',
      INITIAL_MEASUREMENT_LOCKED: 'Chỉ đo mẫu ban đầu trước khi chạy chương trình.',
      CUPS_NOT_READY: 'Cần đo mẫu ban đầu và cấp ít nhất 50 mg/L cho mỗi cốc đã chuẩn bị.',
      INITIAL_NOT_MEASURED: 'Hãy đo mẫu ban đầu trước khi bắt đầu khuấy.',
      PHASE_OUT_OF_ORDER: 'Các pha phải được chạy theo thứ tự khuấy nhanh, khuấy chậm, lắng.',
      DOSE_LOCKED: 'Chỉ cấp hóa chất trong pha chuẩn bị.',
      TOTAL_DOSE_EXCEEDED: 'Tổng liều trong mỗi cốc không vượt quá 250 mg/L.',
      INVALID_DOSE_INCREMENT: 'Liều tăng phải là bội số dương của 50 mg/L.',
      CUP_NOT_PREPARED: 'Hãy chuẩn bị cốc được chọn trước khi thao tác.',
      ATTEMPT_COMPLETED: 'Lượt này đã hoàn thành và chỉ có thể xem.',
      STATE_HASH_MISMATCH: 'Dữ liệu lượt thử chưa nhất quán. Không tiếp tục ghi; cần kiểm tra lượt đã lưu.',
    }
    return {
      message: named[code] ?? 'Thao tác chưa được chấp nhận. Kiểm tra điều kiện hiện tại trước khi thử lại.',
      conflict: code === 'REVISION_CONFLICT',
    }
  }
  switch (outcome.outcome) {
    case 'revision_conflict':
      return { message: 'Lượt đã thay đổi ở tab khác. Tải lại dữ liệu mới nhất trước khi thao tác.', conflict: true }
    case 'idempotency_conflict':
      return { message: 'Mã thao tác đã được dùng với nội dung khác. Cần tải lại lượt.', conflict: true }
    case 'not_found':
      return { message: 'Không tìm thấy lượt hoặc không có quyền truy cập.', conflict: false }
    case 'not_in_progress':
      return { message: 'Lượt đã kết thúc. Tải lại để xem dữ liệu đã lưu.', conflict: true }
    default:
      return { message: 'Chưa thể lưu thao tác này. Tải lại trạng thái trước khi tiếp tục.', conflict: true }
  }
}

function JarLearningGoal() {
  const details = useRef<HTMLDetailsElement>(null)
  useEffect(() => {
    function dismissOutside(event: PointerEvent) {
      const element = details.current
      if (element?.open && event.target instanceof Node && !element.contains(event.target)) element.open = false
    }
    document.addEventListener('pointerdown', dismissOutside)
    return () => document.removeEventListener('pointerdown', dismissOutside)
  }, [])
  function closeScope() {
    if (!details.current) return
    details.current.open = false
    details.current.querySelector('summary')?.focus()
  }
  return <div className={styles.goal} data-testid="jar-public-goal">
    <details ref={details} className={styles.goalDetails} onKeyDown={(event) => {
      if (event.key === 'Escape' && details.current?.open) { event.stopPropagation(); closeScope() }
    }}><summary aria-label="Mục tiêu & phạm vi"><TargetIcon />
      <span className={styles.goalButtonCopy}><strong>Mục tiêu<span className={styles.mobileScopeLabel}> | Phạm vi</span></strong><span>Giảm độ đục ≥ {JAR_PROFILE.goalRemovalPercent}%</span></span>
      <span className={styles.goalDivider} aria-hidden="true">|</span>
      <span className={styles.goalScopeCopy}><strong>Phạm vi</strong><span>1–{JAR_CUP_IDS.length} cốc · pH {JAR_PROFILE.availableInitialPh.join(' / ')} · {JAR_PROFILE.minDoseMgL}–{JAR_PROFILE.maxDoseMgL} mg/L</span></span>
    </summary>
      <section className={styles.goalPanel} aria-label="Mục tiêu và phạm vi Jar Test">
        <div className={styles.goalPanelHeading}><h2>Mục tiêu & phạm vi</h2>
          <button type="button" aria-label="Đóng mục tiêu & phạm vi" onClick={closeScope}><CloseIcon /></button>
        </div>
        <div className={styles.goalIntro}><p className={styles.goalTitle}><strong>Mục tiêu: giảm độ đục ít nhất {JAR_PROFILE.goalRemovalPercent}%</strong></p>
          <p className={styles.goalSubtitle}>So sánh các cốc, đo NTU và chọn phương án xử lý.</p></div>
        <div className={styles.goalPanelGrid}>
          <section><h3>Kết quả cần nộp</h3><ul><li>Số đo NTU ban đầu và cuối hợp lệ.</li><li>Hiệu suất giảm đục do bạn tự tính.</li><li>Một cốc được chọn làm phương án nộp.</li></ul></section>
          <section><h3>Bạn được chọn</h3><dl>
            <div><dt>pH ban đầu</dt><dd>{JAR_PROFILE.availableInitialPh.join(' / ')}</dd></div>
            <div><dt>Tổng liều phèn</dt><dd>{JAR_PROFILE.minDoseMgL}–{JAR_PROFILE.maxDoseMgL} mg/L</dd></div>
            <div><dt>Bước liều</dt><dd>{JAR_PROFILE.doseStepMgL} mg/L</dd></div>
            <div><dt>Số cốc</dt><dd>1–{JAR_CUP_IDS.length} cốc</dd></div>
          </dl></section>
          <section><h3>Điều kiện cố định</h3><p>{JAR_PROFILE.aliquotVolumeL.toLocaleString('vi-VN')} L mẫu / cốc · Chương trình chung:</p><ul>
            <li>Khuấy nhanh: {JAR_PROFILE.phases.rapid.rpm} rpm · {JAR_PROFILE.phases.rapid.durationSeconds} giây.</li>
            <li>Khuấy chậm: {JAR_PROFILE.phases.slow.rpm} rpm · {JAR_PROFILE.phases.slow.durationSeconds / 60} phút.</li>
            <li>Lắng: {JAR_PROFILE.phases.settling.durationSeconds / 60} phút · Dừng khuấy.</li>
          </ul></section>
          <section><h3>Giới hạn mô phỏng</h3><p>Mẫu kaolin tổng hợp với phèn nhôm. Hạt và chuyển động chỉ minh họa; độ đục được đọc qua phép đo NTU.</p><p>Mục tiêu {JAR_PROFILE.goalRemovalPercent}% không phải ngưỡng chất lượng nước hoặc chứng nhận nước an toàn để uống hay xả thải.</p></section>
        </div>
      </section>
    </details>
  </div>
}

/**
 * Browser-local JarSession owns the saved attempt. Only drafts and
 * qualitative motion live in UI state; all chemistry comes from a committed view.
 */
export function JarWorkbench(props: Props) {
  // A different run/store must not inherit drafts, pending retries or async
  // responses from the previous session during client-side navigation.
  const sessionKey = JSON.stringify([
    props.storageMode, props.attemptId, props.invalidAttempt ?? false,
  ])
  return <JarWorkbenchSession key={sessionKey} {...props} />
}

function JarWorkbenchSession({ attemptId, invalidAttempt = false, openReport = false, initialPane = 'simulation' }: Props) {
  const router = useRouter()
  const session: JarSession = useMemo(
    () => createJarSession(new GuestAttemptRepository<JarState>()), [],
  )
  const [loadState, setLoadState] = useState<LoadState>(attemptId === null ? 'idle' : 'loading')
  const [view, setView] = useState<JarSessionView | null>(null)
  const [selectedCupId, setSelectedCupId] = useState<JarCupId>('A')
  const [initialPh, setInitialPh] = useState<number>(7)
  const [doseIncrement, setDoseIncrement] = useState<number>(50)
  const [answerDrafts, setAnswerDrafts] = useState<Partial<Record<JarCupId, string>>>({})

  const [visualCue, setVisualCue] = useState<JarVisualCue | null>(null)
  const finishVisualCue = useCallback((id: string) => {
    setVisualCue((current) => current?.id === id ? null : current)
  }, [])
  const [tourOpen, setTourOpen] = useState(false)
  const [equipmentItem, setEquipmentItem] = useState<EquipmentKind | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [programConfirmOpen, setProgramConfirmOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const notebookRef = useRef<HTMLElement>(null)
  const submitTrigger = useRef<HTMLButtonElement>(null)
  const tourTrigger = useRef<HTMLButtonElement>(null)
  const [pane, setPane] = useState<WorkbenchPane>(initialPane)
  const [group, setGroup] = useState<string | null>('baseline')
  const [busy, setBusy] = useState(false)
  const [issue, setIssue] = useState<Issue | null>(null)
  const [notice, setNotice] = useState('')
  const [uncertain, setUncertain] = useState(false)
  // Refs prevent double sends before React has committed disabled=true.
  const busyRef = useRef(false)
  const startRef = useRef(false)
  const pendingRef = useRef<PendingIntent | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
    if (invalidAttempt) {
      setLoadState('missing')
      setView(null)
      return
    }
    if (attemptId === null) {
      setLoadState((previous) => previous === 'start_error' ? previous : 'idle')
      return
    }
    const id = parseUUID(attemptId)
    if (id === null) {
      setLoadState('missing')
      setView(null)
      return
    }
    setLoadState('loading')
    await session.load(id).then((result) => {
      if (cancelled) return
      if (result === null) {
        setLoadState('missing')
        setView(null)
      } else if (!result.ok) {
        setIssue({ message: 'Không thể mở lượt này: release hoặc dữ liệu đã lưu không hợp lệ.', conflict: false })
        setLoadState('load_error')
        setView(null)
      } else {
        setView(result.state)
        setReportOpen(openReport && result.state.status === 'completed' && result.state.report !== null)
        if (initialPane === 'notebook') {
          setPane('notebook')
          requestAnimationFrame(() => { notebookRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' }); notebookRef.current?.focus({ preventScroll: true }) })
        }
        const cupId = result.state.projection.selectedCupId ?? result.state.projection.cups[0]?.id ?? 'A'
        setSelectedCupId(cupId)
        setGroup(controlGroupFor(result.state.projection, cupId))
        setLoadState('ready')
        setIssue(null)
      }
    }).catch(() => {
      if (!cancelled) {
        setLoadState('load_error')
        setIssue({ message: 'Không kết nối được nơi lưu lượt. Kiểm tra kết nối rồi thử tải lại.', conflict: false })
      }
    })
    })()
    return () => { cancelled = true }
  }, [attemptId, invalidAttempt, session, openReport, initialPane])

  async function reload(): Promise<void> {
    const id = view?.attemptId ?? parseUUID(attemptId)
    if (!id || busyRef.current) return
    busyRef.current = true
    setBusy(true)
    setVisualCue(null)
    try {
      const loaded = await session.load(id)
      if (loaded === null) {
        setLoadState('missing')
        setView(null)
        setIssue(null)
      } else if (!loaded.ok) {
        setIssue({ message: 'Không thể mở dữ liệu đã lưu của lượt này.', conflict: false })
      } else {
        pendingRef.current = null
        setUncertain(false)
        setIssue(null)
        setView(loaded.state)
        setGroup(controlGroupFor(loaded.state.projection, selectedCupId))
        setLoadState('ready')
        setNotice('Đã tải lại dữ liệu được lưu. Kiểm tra trạng thái trước khi thao tác tiếp.')
      }
    } catch {
      setIssue({ message: 'Tải lại thất bại. Kiểm tra kết nối và thử lại.', conflict: false })
    } finally {
      busyRef.current = false
      setBusy(false)
    }
  }

  async function start(): Promise<void> {
    if (startRef.current || busyRef.current || loadState !== 'idle') return
    startRef.current = true
    busyRef.current = true
    setBusy(true)
    setIssue(null)
    try {
      const started = await session.start()
      setView(started)
      setLoadState('ready')
      setNotice('Lượt mới đã được lưu. Hãy chọn cốc và chuẩn bị mẫu.')
      router.replace(JAR_PATH + '?attempt=' + started.attemptId, { scroll: false })
    } catch {
      // start() has no client-supplied idempotency key. Never automatically
      // mint a second attempt while the first create outcome is uncertain.
      setLoadState('start_error')
      setIssue({ message: 'Chưa xác nhận được lượt mới đã tạo hay chưa. Không tự gửi lại; tải lại trang để kiểm tra trước khi bắt đầu lượt khác.', conflict: false })
    } finally {
      busyRef.current = false
      setBusy(false)
    }
  }

  async function send(intent: PendingIntent): Promise<void> {
    if (busyRef.current) return
    busyRef.current = true
    setBusy(true)
    setIssue(null)
    setNotice('')
    try {
      if (intent.actionType === null) {
        const result = await session.complete(intent.attemptId, {
          actionId: intent.actionId, expectedRevision: intent.expectedRevision,
        })
        setConfirmOpen(false)
        if (result.ok) {
          pendingRef.current = null
          setUncertain(false)
          setView(result.state)
          setReportOpen(true)
          setVisualCue(null)
          setNotice('Đã lưu kết quả. Lượt này chỉ có thể xem lại.')
        } else {
          pendingRef.current = null
          setUncertain(false)
          setIssue(refusalMessage(result))
        }
      } else {
        const result = await session.apply(
          intent.attemptId, intent.actionType, intent.parameters, intent.units,
          { actionId: intent.actionId, expectedRevision: intent.expectedRevision },
        )
        if (result.ok) {
          pendingRef.current = null
          setUncertain(false)
          setView(result.state)
          setNotice('Đã lưu: ' + actionLabel(intent.actionType) + '.')
          if (!result.feedback.idempotentReplay) {
            const hasScene = ['prepare_cup', 'add_coagulant', 'run_phase', 'measure_initial', 'measure_final'].includes(intent.actionType)
            setVisualCue(hasScene ? {
              id: intent.actionId,
              actionType: intent.actionType,
              cupId: JAR_CUP_IDS.find((id) => id === intent.parameters.cupId) ?? null,
            } : null)
          }
          if (intent.actionType === 'prepare_cup') setGroup('dose')
          if (intent.actionType === 'measure_initial') setGroup(result.state.projection.cups.some(c => c.id === selectedCupId) ? 'dose' : 'prepare')
          if (intent.actionType === 'run_phase') setGroup(result.state.projection.phase === 'settling' ? 'results' : 'program')
        } else {
          pendingRef.current = null
          setUncertain(false)
          setIssue(refusalMessage(result))
        }
      }
    } catch {
      setConfirmOpen(false)
      // Transport failure leaves commit status unknown. Keep the exact intent
      // and actionId for a deliberate idempotent retry, never mint a new one.
      setUncertain(true)
      setIssue({ message: 'Chưa rõ thao tác đã được lưu hay chưa. Gửi lại đúng thao tác hoặc tải lại trạng thái trước khi quyết định.', conflict: false })
    } finally {
      busyRef.current = false
      setBusy(false)
    }
  }

  function submit(
    actionType: string | null,
    parameters: PendingIntent['parameters'] = {},
    units: PendingIntent['units'] = {},
  ): void {
    if (!view || view.status !== 'in_progress' || busyRef.current || pendingRef.current || uncertain) return
    const intent: PendingIntent = {
      attemptId: view.attemptId,
      actionId: newUUID(),
      expectedRevision: view.revision,
      actionType,
      parameters: { ...parameters },
      units: { ...units },
    }
    pendingRef.current = intent
    void send(intent)
  }

  const active = view?.status === 'in_progress'
  const locked = busy || uncertain || !!issue?.conflict || !active
  const projection = view?.projection
  const cup: JarCupProjection | undefined = projection?.cups.find((item) => item.id === selectedCupId)
  const recent = cup?.measurements.at(-1)
  const answerInput = answerDrafts[selectedCupId] ?? (cup?.submittedRemovalPercent?.toString() ?? '')
  const increments = [50, 100, 150, 200, 250].filter((n) => n + (cup?.doseMgL ?? 0) <= JAR_PROFILE.maxDoseMgL)
  const increment = increments.includes(doseIncrement) ? doseIncrement : increments[0] ?? 50
  const nextPhase = projection?.phase === 'setup' ? 'rapid' : projection?.phase === 'rapid' ? 'slow' : projection?.phase === 'slow' ? 'settling' : null
  const ready = loadState === 'ready' && !!view && !!projection
  const batchReady = !!projection?.initialMeasurement?.valid && projection.cups.length > 0 && projection.cups.every(c => c.doseMgL >= JAR_PROFILE.minDoseMgL)
  const lockReason = busy ? 'Đang lưu thao tác. Chờ xác nhận trước khi tiếp tục.' : uncertain ? 'Chưa xác nhận được thao tác đã lưu. Gửi lại đúng thao tác hoặc tải lại trạng thái đã lưu.' : issue?.conflict ? 'Dữ liệu lượt đã thay đổi. Tải lại dữ liệu mới nhất trước khi tiếp tục.' : !active ? 'Lượt đã kết thúc nên không thể ghi thêm thao tác.' : null
  const missingCupReason = !cup ? 'Chuẩn bị cốc ' + selectedCupId + ' trước khi thao tác.' + (projection?.phase !== 'setup' ? ' Mẻ đã chạy; chọn cốc đã chuẩn bị hoặc bắt đầu mẻ mới.' : '') : null
  const prepareReason = lockReason ?? (projection?.phase !== 'setup' ? 'Mẻ đã bắt đầu khuấy nên đã khóa chuẩn bị. Chọn cốc đã có để đo, hoặc bắt đầu mẻ mới để đổi pH/thêm cốc.' : cup ? 'Cốc ' + selectedCupId + ' đã được chuẩn bị. Chọn cốc khác nếu muốn thử pH khác.' : null)
  const doseReason = lockReason ?? (projection?.phase !== 'setup' ? 'Mẻ đã bắt đầu khuấy nên đã khóa liều phèn. Bắt đầu mẻ mới nếu muốn thử liều khác.' : missingCupReason ?? (!increments.length ? 'Cốc đã đạt liều tối đa 250 mg/L. Chọn cốc khác hoặc tiếp tục Khuấy & lắng.' : null))
  const batchReason = lockReason ?? (!projection?.initialMeasurement?.valid ? 'Cần đo mẫu ban đầu trước khi chạy khuấy.' : !projection.cups.length ? 'Chuẩn bị ít nhất một cốc trước khi chạy khuấy.' : !batchReady ? 'Cần cấp ít nhất 50 mg/L cho cốc ' + projection.cups.filter(c => c.doseMgL < JAR_PROFILE.minDoseMgL).map(c => c.id).join(', ') + '.' : null)
  const currentStep = !projection?.initialMeasurement?.valid ? 0 : projection.phase === 'setup' ? (cup ? 2 : 1) : projection.phase === 'rapid' || projection.phase === 'slow' ? 3 : 4
  const steps = [['baseline', 'Đo mẫu đầu'], ['prepare', 'Chuẩn bị cốc'], ['dose', 'Cấp phèn'], ['program', 'Khuấy & lắng'], ['results', 'Đo & ghi kết quả']] as const

  function selectCup(id: JarCupId) {
    setSelectedCupId(id)
    setDoseIncrement(50)
    setGroup(projection ? controlGroupFor(projection, id) : 'prepare')
  }

  function showNotebook() {
    setReportOpen(false)
    setPane('notebook')
    // The mobile pane and closing dialog must commit before scrolling/focusing.
    requestAnimationFrame(() => {
      notebookRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' })
      notebookRef.current?.focus({ preventScroll: true })
    })
  }

  function closeReport() {
    setReportOpen(false)
    requestAnimationFrame(() => {
      // The first report replaces the confirmation, whose focused button unmounts.
      if (document.activeElement === document.body) submitTrigger.current?.focus({ preventScroll: true })
    })
  }

  const header = <>
    <Link href="/" className={styles.brand} aria-label="Trang chủ VECLab"><span><FlaskIcon /></span><strong>VECLab</strong></Link>
    <Link href="/experiments" className={styles.back}><ArrowRightIcon />Thí nghiệm</Link>
    <div className={styles.title}><h1>Jar Test</h1><p>Keo tụ · Tạo bông · Lắng</p></div>
    <JarLearningGoal />
    <div className={styles.headerActions}>
      <span className={styles.saveState} role="status" aria-live="polite"><CheckCircleIcon />
        {busy ? 'Đang lưu…' : uncertain ? 'Chưa xác nhận lưu' : ready ? 'Đã lưu trên thiết bị' : 'Lưu trên thiết bị'}
        {notice && <span className={styles.srOnly}>{notice}</span>}
      </span>
      <button type="button" className={styles.button + ' ' + styles.reportButton} disabled={!view?.report || busy} aria-label="Báo cáo Jar Test" title={view?.report ? 'Xem kết quả và đối chiếu đáp số đã nộp' : 'Báo cáo xuất hiện sau khi nộp bài'} onClick={() => setReportOpen(true)}><ReportIcon /><span>Báo cáo</span></button>
      <button ref={submitTrigger} className={styles.primary} type="button" disabled={view?.status === 'completed' ? !view.report || busy : !ready || locked}
        aria-label={view?.status === 'completed' ? 'Xem kết quả đã nộp' : 'Hoàn thành và lưu lượt Jar Test'} onClick={() => view?.status === 'completed' ? setReportOpen(true) : setConfirmOpen(true)}>
        {view?.status === 'completed' ? <CheckCircleIcon /> : <SubmitIcon />}{view?.status === 'completed' ? 'Đã nộp' : 'Nộp bài'}
      </button>
    </div>
  </>

  const guideBaseHref = '/experiments/jar-test/guide' + (view?.attemptId ? '?attempt=' + encodeURIComponent(view.attemptId) : '')
  const shelf = <div className={styles.shelfContent}>
    <div className={styles.inventory}>
      {([['sample', 'Mẫu kaolin', 'Nước đục · ' + JAR_PROFILE.aliquotVolumeL * 1000 + ' mL / cốc'], ['coagulant', 'Phèn nhôm', '50–250 mg/L'], ['meter', 'Máy đo độ đục', 'NTU']] as const)
        .map(([kind, title, description]) => <button type="button" className={styles.equipment} key={kind} aria-haspopup="dialog" aria-label={'Tìm hiểu ' + title} onClick={() => setEquipmentItem(kind)}>
          <EquipmentArt kind={kind} /><span className={styles.equipmentText}><strong>{title}</strong><span>{description}</span></span><span className={styles.equipmentInfo}><InfoIcon /></span>
        </button>)}
    </div>
    <div className={styles.shelfHelp}>
      <p className={styles.shelfNote}>Mẫu tổng hợp dùng để học tập. Lượt này lưu trên trình duyệt.</p>
      <button ref={tourTrigger} type="button" className={styles.guideButton} onClick={() => setTourOpen(true)}><GuideIcon />Hướng dẫn thao tác</button>
      <Link className={styles.theoryLink} href={guideBaseHref} target="_blank" rel="noopener noreferrer"><TheoryIcon /><span>Lý thuyết & cách làm bài</span></Link>
      <details><summary><SourcesIcon />Nguồn & giới hạn</summary>
        <p>Chỉ áp dụng cho hồ sơ mẫu, pH, liều và chương trình đã khóa. Hình ảnh hạt không dùng để suy ra hiệu suất.</p>
        <a href={'https://doi.org/' + JAR_PROFILE.sourceDoi} target="_blank" rel="noopener noreferrer">Nghiên cứu dùng xây dựng mô hình — mở tab mới <ArrowRightIcon /></a>
        <p>Không suy liều cho mẫu nước thật từ kết quả này.</p>
      </details>
    </div>
  </div>

  const notices = issue && ready ? <div className={styles.error} role="alert"><p>{issue.message}</p>
    {issue.conflict && <button className={styles.button} onClick={() => void reload()} disabled={busy}>Tải lại dữ liệu mới nhất</button>}
    {uncertain && <div className={styles.actionRow}>
      <button className={styles.primary} disabled={busy} onClick={() => { if (pendingRef.current) void send(pendingRef.current) }}>Thử gửi lại đúng thao tác</button>
      <button className={styles.button} disabled={busy} onClick={() => void reload()}>Tải lại trạng thái đã lưu</button>
    </div>}
  </div> : null

  const simulation = <>
    <div className={styles.stageHeader}>
      <div><h2>Khu vực thực hành</h2><p>Dàn khuấy Jar Test · 6 vị trí</p></div>
      {projection && <span className={styles.phaseBadge}>{PHASE_NAME[projection.phase]}</span>}
      <ol className={styles.steps} aria-label="Quy trình Jar Test">{steps.map(([id,label],index) => <li key={id} aria-current={ready && index === currentStep ? 'step' : undefined}>
        <button type="button" disabled={!ready} onClick={() => { setGroup(id); setPane('controls') }}><span>{index + 1}</span>{label}</button>
      </li>)}</ol>
    </div>
    {ready && projection ? <>
      <JarApparatus projection={projection} selectedCupId={selectedCupId} onSelectCup={selectCup} disabled={busy} cue={visualCue} onCueFinished={finishVisualCue} />
      <div className={styles.stageFooter}><span>Thời gian mô phỏng: {projection.elapsedSeconds} giây</span>
        <span>Các pha khuấy–lắng chạy bằng thời gian mô phỏng, không cần chờ thực.</span>
      </div>
    </> : <div className={styles.entry}>
      {loadState === 'idle' && <><EquipmentArt kind="sample" /><h2>Khảo sát keo tụ — tạo bông — lắng</h2>
        <p>So sánh tối đa sáu cốc. Chọn pH ban đầu, cấp phèn, đo độ đục và tự tính hiệu suất xử lý.</p>
        <p className={styles.muted}>Mỗi cốc dùng 0,5 L mẫu. Chương trình chạy theo thời gian mô phỏng, không cần chờ ngoài đời thực.</p>
        <button type="button" className={styles.primary} onClick={() => void start()} disabled={busy}>{busy ? 'Đang tạo lượt…' : 'Bắt đầu thí nghiệm Jar Test'}</button></>}
      {loadState === 'loading' && <p role="status">Đang mở lượt đã lưu…</p>}
      {loadState === 'missing' && <div role="alert"><h2>Không tìm thấy lượt thí nghiệm</h2><p>Liên kết không hợp lệ hoặc lượt không còn tồn tại. Dữ liệu hiện có được giữ nguyên.</p><a className={styles.button} href={JAR_PATH}>Về màn bắt đầu</a></div>}
      {(loadState === 'load_error' || loadState === 'start_error') && <div role="alert"><h2>Chưa thể mở lượt Jar Test</h2><p>{issue?.message}</p>
        {loadState === 'load_error' && <button className={styles.button} onClick={() => void reload()} disabled={busy}>Thử tải lại lượt</button>}</div>}
    </div>}
  </>

  const controls = <>
    <div className={styles.controlsHeading}><h2>Thao tác</h2>
      <select className={styles.cupSelect} aria-label="Cốc đang thao tác" value={selectedCupId} disabled={!ready || busy}
        onChange={(event) => { const id = JAR_CUP_IDS.find((id) => id === event.target.value); if (id) selectCup(id) }}>
        {JAR_CUP_IDS.map((id) => <option key={id} value={id}>Cốc {id}</option>)}
      </select>
    </div>
    {ready && <p className={styles.cupContext}>{cup ? <><span>pH đầu {cup.initialPh}</span><span>{cup.doseMgL} mg/L</span></> : 'Chưa chuẩn bị mẫu'}</p>}
    {!ready || !projection ? <p className={styles.empty}>Bắt đầu lượt để chuẩn bị mẫu và sử dụng dụng cụ.</p> : !active ? <div className={styles.readonly}>
      <h3>Lượt đã hoàn thành</h3><p>Bạn vẫn có thể chọn các cốc để xem số liệu. Các thao tác đã khóa.</p>
      <p>Phương án đã nộp: {projection.selectedCupId ? 'Cốc ' + projection.selectedCupId : 'Chưa chọn'}.</p>
      {view?.report && <button type="button" className={styles.primary} onClick={() => setReportOpen(true)}><ReportIcon />Xem báo cáo kết quả</button>}
      <button type="button" className={styles.button} onClick={showNotebook}>Xem sổ đo</button>
      <a className={styles.button} href={JAR_PATH}>Bắt đầu mẻ Jar Test mới</a>
    </div> : <>
      <ControlGroup id="baseline" title="Đo mẫu ban đầu" summary={projection.initialMeasurement?.valid ? 'Đã đo · Chung cho cả mẻ' : 'Bước đầu tiên · Mẫu chưa xử lý'} open={group === 'baseline'} onToggle={() => setGroup(group === 'baseline' ? null : 'baseline')}>
        <OperationHelp topic={JAR_OPERATION_HELP.baseline} guideBaseHref={guideBaseHref} />
        <div className={styles.measurement}><span className={styles.measurementLabel}>Độ đục mẫu chưa xử lý</span><strong data-testid="jar-baseline-value">{projection.initialMeasurement ? readingLabel(projection.initialMeasurement) : 'Chưa đo'}</strong></div>
        <p className={styles.limit}>Đo một lần để làm mốc tính hiệu suất cho tất cả cốc.</p>
        <ActionButton className={styles.primary} reason={lockReason ?? (projection.initialMeasurement ? 'Mẫu ban đầu đã được đo. Số đo này dùng chung cho cả mẻ.' : projection.phase !== 'setup' ? 'Mẻ đã chạy nên đã khóa phép đo ban đầu. Bắt đầu mẻ mới để đo lại.' : null)} reasonClassName={styles.actionReason} onClick={() => submit('measure_initial')}>Đo mẫu ban đầu</ActionButton>
      </ControlGroup>
      <ControlGroup id="prepare" title="Chuẩn bị mẫu" summary={cup ? '0,5 L · pH đầu ' + cup.initialPh + ' · Đã chuẩn bị' : '0,5 L · Chọn pH ban đầu'} open={group === 'prepare'} onToggle={() => setGroup(group === 'prepare' ? null : 'prepare')}>
        <OperationHelp topic={JAR_OPERATION_HELP.prepare} guideBaseHref={guideBaseHref} />
        <label className={styles.inputField} htmlFor="jar-ph">pH ban đầu của cốc
          <select id="jar-ph" value={cup?.initialPh ?? initialPh} disabled={locked || !!cup || projection.phase !== 'setup'} onChange={(e) => setInitialPh(Number(e.target.value))}>
            {JAR_PROFILE.availableInitialPh.map((ph) => <option key={ph} value={ph}>{ph}</option>)}
          </select></label>
        <div className={styles.sampleVolume}><span>Mẫu / dung tích cốc</span><strong>0,5 L / 1 L</strong></div>
        <ActionButton className={styles.primary} reason={prepareReason} reasonClassName={styles.actionReason} onClick={() => submit('prepare_cup', { cupId: selectedCupId, initialPh })}>Chuẩn bị cốc {selectedCupId}</ActionButton>
        {projection.phase !== 'setup' && <p className={styles.limit}>Mẻ đã chạy: không thêm cốc hoặc đổi pH. Chọn cốc đã chuẩn bị để đo và ghi kết quả.</p>}
      </ControlGroup>
      <ControlGroup id="dose" title="Cấp phèn" summary={cup ? 'Tổng liều ' + cup.doseMgL + ' mg/L' : 'Chuẩn bị cốc trước khi cấp'} open={group === 'dose'} onToggle={() => setGroup(group === 'dose' ? null : 'dose')}>
        <OperationHelp topic={JAR_OPERATION_HELP.dose} guideBaseHref={guideBaseHref} />
        <div className={styles.doseTotal}><span>Tổng liều hiện tại</span><strong data-testid="jar-dose">{cup ? cup.doseMgL + ' mg/L' : 'N/A'}</strong></div>
        <label className={styles.inputField} htmlFor="jar-dose-increment">Liều tăng (mg/L)
          <select id="jar-dose-increment" value={increment} disabled={locked || !cup || projection.phase !== 'setup' || !increments.length} onChange={(e) => setDoseIncrement(Number(e.target.value))}>
            {increments.map((n) => <option key={n} value={n}>{n}</option>)}
          </select></label>
        {cup && increments.length > 0 && <p className={styles.dosePreview}><span>Sau khi thêm</span><strong>{cup.doseMgL + increment} mg/L</strong></p>}
        <ActionButton className={styles.primary} reason={doseReason} reasonClassName={styles.actionReason} onClick={() => submit('add_coagulant', { cupId: selectedCupId, incrementMgL: increment }, { incrementMgL: 'mg/L' })}>Thêm {increment} mg/L vào cốc {selectedCupId}</ActionButton>
        <p className={styles.limit}>{projection.phase !== 'setup' ? 'Đã khóa liều khi bắt đầu khuấy' : increments.length ? 'Tổng liều tối đa 250 mg/L' : 'Đã đạt liều tối đa'}</p>
      </ControlGroup>
      <ControlGroup id="program" title="Khuấy & lắng" summary={projection.phase === 'setup' ? 'Ba pha cố định · Chung cho dàn cốc' : PHASE_NAME[projection.phase]} open={group === 'program'} onToggle={() => setGroup(group === 'program' ? null : 'program')}>
        <OperationHelp topic={JAR_OPERATION_HELP.program} guideBaseHref={guideBaseHref} />
        <ol className={styles.program}>{PHASES.map((phase, index) => {
          const done = projection.elapsedSeconds >= PHASES.slice(0, index + 1).reduce((total, entry) => total + entry.seconds, 0)
          return <li key={phase.id} data-done={done} data-next={nextPhase === phase.id}>
            <span aria-hidden="true">{done ? <CheckCircleIcon /> : index + 1}</span>
            <div><strong>{phase.name}</strong><small>{phase.seconds < 120 ? phase.seconds + ' giây' : phase.seconds / 60 + ' phút'} · {phase.rpm > 0 ? phase.rpm + ' rpm' : 'Dừng khuấy'}</small></div>
            <em>{done ? 'Đã chạy' : nextPhase === phase.id ? 'Tiếp theo' : ''}</em>
          </li>
        })}</ol>
        <p className={styles.limit}>Chạy chung {projection.cups.length} cốc{projection.cups.length > 0 && ': ' + projection.cups.map(c => c.id).join(', ')} · Thời gian mô phỏng</p>
        {projection.phase === 'setup' && !batchReady && <div className={styles.recoveryActions}>
          {!projection.initialMeasurement?.valid&&<button type="button" className={styles.button} onClick={()=>setGroup('baseline')}>Đi tới Đo mẫu ban đầu</button>}
          {!projection.cups.length&&<button type="button" className={styles.button} onClick={()=>setGroup('prepare')}>Đi tới Chuẩn bị mẫu</button>}
          {projection.cups.filter(c=>c.doseMgL<JAR_PROFILE.minDoseMgL).map(c=><button key={c.id} type="button" className={styles.button} onClick={()=>{selectCup(c.id);setGroup('dose')}}>Cấp phèn cho cốc {c.id}</button>)}
        </div>}
        {nextPhase ? <ActionButton className={styles.primary} reason={projection.phase==='setup'?batchReason:lockReason} reasonClassName={styles.actionReason} aria-label={'Chạy pha ' + PHASE_NAME[nextPhase] + ' (' + JAR_PROFILE.phases[nextPhase].durationSeconds + ' giây mô phỏng)'} onClick={() => projection.phase === 'setup' ? setProgramConfirmOpen(true) : submit('run_phase', { phase: nextPhase })}>Chạy {PHASE_NAME[nextPhase].toLowerCase()} <ArrowRightIcon /></ActionButton> : <p>Đã lắng xong cả mẻ. Chọn từng cốc để đo; đo một cốc không khóa các cốc khác.</p>}
      </ControlGroup>
      <ControlGroup id="results" title="Đo & ghi kết quả" summary="NTU cuối · Đáp số · Phương án nộp" open={group === 'results'} onToggle={() => setGroup(group === 'results' ? null : 'results')}>
        <OperationHelp topic={JAR_OPERATION_HELP.results} guideBaseHref={guideBaseHref} />
        <div className={styles.measurement} data-testid="jar-selected-reading"><span className={styles.measurementLabel}>Độ đục cuối · Cốc {selectedCupId}</span><strong>{recent ? readingLabel(recent) : 'Chưa đo'}</strong>{recent && <span>{readingNote(recent)}</span>}</div>
        <ActionButton className={styles.button} reason={lockReason??missingCupReason} reasonClassName={styles.actionReason} onClick={() => submit('measure_final', { cupId: selectedCupId })}>Đo độ đục cuối cốc {selectedCupId}</ActionButton>
        {cup&&projection.phase!=='settling'&&<p className={styles.actionReason}>Đo lúc này sẽ được lưu là N/A vì chưa hoàn tất khuấy nhanh → khuấy chậm → lắng. Bạn có thể tiếp tục quy trình rồi đo lại.</p>}
        <div className={styles.resultDivider} />
        <label className={styles.inputField} htmlFor="jar-removal">Phần trăm giảm đục tự tính (%)
          <input id="jar-removal" type="number" inputMode="decimal" step="any" placeholder="Nhập đáp số của bạn" value={answerInput} disabled={locked || !cup} onChange={(e) => setAnswerDrafts((old) => ({ ...old, [selectedCupId]: e.target.value }))} /></label>
        <ActionButton className={styles.button} reason={lockReason??missingCupReason??(!answerInput.trim()||!Number.isFinite(Number(answerInput))?'Nhập đáp số tự tính là một số trước khi ghi kết quả.':null)} reasonClassName={styles.actionReason} onClick={() => submit('record_result', { cupId: selectedCupId, removalPercent: Number(answerInput) })}>Ghi đáp số cốc {selectedCupId}</ActionButton>
        <p>Đáp số đã lưu: {cup?.submittedRemovalPercent === null || !cup ? 'N/A' : cup.submittedRemovalPercent + ' %'}</p>
        <ActionButton className={styles.primary} reason={lockReason??missingCupReason} reasonClassName={styles.actionReason} aria-label={'Chọn cốc ' + selectedCupId + ' làm phương án nộp'} aria-pressed={projection.selectedCupId === selectedCupId} onClick={() => submit('select_result', { cupId: selectedCupId })}>{projection.selectedCupId === selectedCupId ? <><CheckCircleIcon />Đã chọn cốc {selectedCupId}</> : 'Dùng cốc ' + selectedCupId + ' để nộp'}</ActionButton>
        <p className={styles.selectionSummary}><span>Phương án nộp</span><strong data-testid="jar-submitted-cup">{projection.selectedCupId ? 'Cốc ' + projection.selectedCupId : 'Chưa chọn'}</strong></p>
      </ControlGroup>
      <p className={styles.submissionHint}>Nộp bài sẽ khóa lượt, kể cả khi thiếu dữ liệu.</p>
    </>}
  </>

  const notebook = <section ref={notebookRef} tabIndex={-1} className={styles.notebook} aria-label="Sổ đo Jar Test">
    {ready && view && projection ? <JarNotebook view={view} selected={selectedCupId} drafts={answerDrafts} busy={busy} onSelect={selectCup} onBaseline={() => { setGroup('baseline'); setPane('controls') }} onReport={() => setReportOpen(true)} /> : <p className={styles.empty}>Sổ thực hành sẽ hiển thị số đo sau khi bắt đầu lượt.</p>}
  </section>

  return <><WorkbenchFrame contentSized label="Bàn thí nghiệm Jar Test" header={header} notices={notices} shelf={shelf} simulation={simulation} controls={controls} notebook={notebook} pane={pane} onPaneChange={setPane} onShelfInfo={() => setEquipmentItem('sample')} tourOpen={tourOpen} onTourClose={() => {
    setTourOpen(false)
    // The shelf is temporarily hidden during the mobile tour. Restore focus
    // after the original pane and shelf visibility have been committed.
    requestAnimationFrame(() => tourTrigger.current?.focus({ preventScroll: true }))
  }} />{equipmentItem && <EquipmentPanel item={equipmentItem} onItemChange={setEquipmentItem} onClose={() => setEquipmentItem(null)} />}
    {confirmOpen && active && projection && <JarSubmitDialog projection={projection} drafts={answerDrafts} busy={busy} onClose={() => setConfirmOpen(false)} onConfirm={() => submit(null)} />}
    {programConfirmOpen && active && projection && <JarProgramDialog projection={projection} onClose={() => setProgramConfirmOpen(false)} onConfirm={() => { setProgramConfirmOpen(false); submit('run_phase', { phase: 'rapid' }) }} />}
    {reportOpen && view?.status === 'completed' && view.report && <JarReportDialog report={view.report} onClose={closeReport} onNotebook={showNotebook} />}
  </>
}

function ControlGroup({ id, title, summary, open, onToggle, children }: {
  id: string; title: string; summary: string; open: boolean; onToggle: () => void; children: React.ReactNode
}) {
  return <details className={styles.controlGroup} open={open} data-testid={'jar-control-' + id}>
    <summary onClick={(e) => { e.preventDefault(); onToggle() }}><span className={styles.controlIcon}><ControlIcon kind={id} /></span><span className={styles.controlText}><strong>{title}</strong><small>{summary}</small></span></summary>
    <div className={styles.groupBody}>{children}</div>
  </details>
}

function actionLabel(actionType: string): string {
  const titles: Record<string, string> = {
    prepare_cup: 'chuẩn bị cốc',
    measure_initial: 'đo mẫu ban đầu',
    add_coagulant: 'cấp hóa chất',
    run_phase: 'chạy chương trình',
    measure_final: 'đo độ đục cuối',
    record_result: 'ghi đáp số',
    select_result: 'chọn phương án',
  }
  return titles[actionType] ?? 'thao tác'
}
