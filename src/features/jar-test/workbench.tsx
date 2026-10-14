'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { UUID } from '@/domain/process/contracts.js'
import { parseUUID, newUUID } from '@/shared/ids.js'
import {
  JAR_CUP_IDS, JAR_PROFILE, type JarCupId,
} from '@/domain/experiments/jar-test/model.js'
import type {
  JarSessionView, JarSession, JarActionResult, JarCompletionResult,
} from '@/application/simulation/jar-session.js'
import type { JarReadingView, JarCupProjection } from '@/application/scenarios/jar-projection.js'
import { createJarSessionForStorageMode } from '@/features/simulation-session.js'
import { JarApparatus } from './apparatus.js'
import styles from './workbench.module.css'

const JAR_PATH = '/simulate/jar-test'
type Mode = 'local' | 'cloud'
type Props = {
  attemptId: string | null
  invalidAttempt?: boolean
  storageMode: Mode
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
  return (
    <p className={styles.lead} data-testid="jar-public-goal">
      <strong>Mục tiêu học tập:</strong> tìm phương án giảm độ đục ít nhất{' '}
      {JAR_PROFILE.goalRemovalPercent}% theo mô hình Jar Test.
      Đây không phải ngưỡng chất lượng nước hoặc chứng nhận nước an toàn để uống hay xả thải.
    </p>
  )
}

/**
 * Local and cloud share the accepted JarSession contract. Only drafts and
 * qualitative motion live in UI state; all chemistry comes from a committed view.
 */
export function JarWorkbench({ attemptId, invalidAttempt = false, storageMode }: Props) {
  const router = useRouter()
  const session: JarSession = useMemo(
    () => createJarSessionForStorageMode(storageMode), [storageMode],
  )
  const [loadState, setLoadState] = useState<LoadState>(attemptId === null ? 'idle' : 'loading')
  const [view, setView] = useState<JarSessionView | null>(null)
  const [selectedCupId, setSelectedCupId] = useState<JarCupId>('A')
  const [initialPh, setInitialPh] = useState<number>(7)
  const [doseIncrement, setDoseIncrement] = useState<number>(50)
  const [answerDrafts, setAnswerDrafts] = useState<Partial<Record<JarCupId, string>>>({})
  const [skipAnimation, setSkipAnimation] = useState(false)
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
  }, [attemptId, invalidAttempt, session])

  async function reload(): Promise<void> {
    const id = view?.attemptId ?? parseUUID(attemptId)
    if (!id || busyRef.current) return
    busyRef.current = true
    setBusy(true)
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
        if (result.ok) {
          pendingRef.current = null
          setUncertain(false)
          setView(result.state)
          setNotice('Lượt đã hoàn thành và lưu báo cáo bất biến.')
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
        } else {
          pendingRef.current = null
          setUncertain(false)
          setIssue(refusalMessage(result))
        }
      }
    } catch {
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
  const nextPhase = projection?.phase === 'setup' ? 'rapid' :
    projection?.phase === 'rapid' ? 'slow' :
      projection?.phase === 'slow' ? 'settling' : null

  return (
    <section className={styles.workbench} aria-label="Bàn thí nghiệm Jar Test">
      {loadState === 'idle' && (
        <div className={styles.intro}>
          <h2>Khảo sát keo tụ — tạo bông — lắng</h2>
          <p className={styles.lead}>Một mẻ gồm tối đa sáu cốc A–F, sử dụng mẫu kaolin
            tổng hợp và phèn nhôm. Tự chọn pH ban đầu, liều xử lý, đo độ đục,
            tính hiệu suất và chọn cốc nộp.</p>
          <JarLearningGoal />
          <p>Mỗi cốc dùng 0,5 L mẫu trong cốc 1 L. Chương trình khuấy/lắng cố định
            và chạy theo thời gian mô phỏng, không cần chờ ngoài đời thực.</p>
          <div className={styles.actionRow}>
            <button type="button" className="btn btn-primary" onClick={() => void start()}
              disabled={busy}>{busy ? 'Đang tạo lượt…' : 'Bắt đầu thí nghiệm Jar Test'}</button>
          </div>
          <p className={styles.underText}>Lượt được lưu {storageMode === 'cloud' ? 'trên tài khoản' : 'trong trình duyệt này'}.</p>
        </div>
      )}
      {loadState === 'loading' && <p className={styles.status} role="status">Đang mở lượt đã lưu…</p>}
      {loadState === 'missing' && (
        <div className={styles.intro} role="alert">
          <h2>Không tìm thấy lượt thí nghiệm</h2>
          <p>Liên kết không hợp lệ, lượt không còn tồn tại hoặc bạn không có quyền mở.
            Không tạo lượt mới thay thế để tránh ghi đè dữ liệu.</p>
          <a className="btn" href={JAR_PATH}>Về màn bắt đầu</a>
        </div>
      )}
      {(loadState === 'load_error' || loadState === 'start_error') && (
        <div className={styles.intro} role="alert">
          <h2>Chưa thể mở lượt Jar Test</h2>
          <p>{issue?.message}</p>
          {loadState === 'load_error' && <button className="btn" type="button"
            onClick={() => void reload()} disabled={busy}>Thử tải lại lượt</button>}
        </div>
      )}
      {loadState === 'ready' && view && projection && (
        <>
          <div className={styles.topline}>
            <div className={styles.meta}>
              <span className={styles.badge}>{storageMode === 'cloud' ? 'Đã đăng nhập · Cloud' : 'Khách · Lưu tại máy'}</span>
              <span>Revision {view.revision}</span>
              <span>Giai đoạn: {PHASE_NAME[projection.phase]}</span>
              <span>Thời gian mô phỏng: {projection.elapsedSeconds} giây</span>
            </div>
            <span className={styles.idText}>Mã lượt: {view.attemptId}</span>
          </div>
          <JarLearningGoal />
          {issue && (
            <div className={styles.status + ' ' + styles.error} role="alert">
              <p>{issue.message}</p>
              {issue.conflict && <button className="btn" type="button"
                onClick={() => void reload()} disabled={busy}>Tải lại dữ liệu mới nhất</button>}
            </div>
          )}
          {uncertain && (
            <div className={styles.status} role="alert">
              <p>Giữ nguyên mã thao tác và revision đến khi xác định kết quả.</p>
              <div className={styles.actionRow}>
                <button className="btn btn-primary" type="button" disabled={busy}
                  onClick={() => { if (pendingRef.current) void send(pendingRef.current) }}>
                  Thử gửi lại đúng thao tác
                </button>
                <button className="btn" type="button" disabled={busy}
                  onClick={() => void reload()}>Tải lại trạng thái đã lưu</button>
              </div>
            </div>
          )}
          <p role="status" aria-live="polite" className={styles.status}>
            {busy ? 'Đang xác nhận thao tác…' : notice || 'Các kết quả hiển thị lấy từ lượt đã lưu.'}
          </p>
          <div className={styles.workspace}>
            <JarApparatus projection={projection} selectedCupId={selectedCupId}
              onSelectCup={setSelectedCupId} disabled={busy} skipAnimation={skipAnimation} />
            <div className={styles.controls}>
              <div className={styles.panel}>
                <div className={styles.topline}>
                  <h2>Điều khiển cốc {selectedCupId}</h2>
                  <span className={styles.badge}>{cup ? 'Đã chuẩn bị' : 'Chưa chuẩn bị'}</span>
                </div>
                <label className={styles.actionRow}>
                  <input type="checkbox" checked={skipAnimation}
                    onChange={(event) => setSkipAnimation(event.target.checked)} />
                  Bỏ qua hoạt ảnh minh họa
                </label>
                {!active ? (
                  <p className={styles.readonly}>Lượt đã hoàn thành. Các thao tác không thể sửa dữ liệu.</p>
                ) : (
                  <>
                    <div className={styles.controlGroup}>
                      <h3>Chuẩn bị và đo mẫu</h3>
                      <label className={styles.inputField} htmlFor="jar-ph">
                        pH ban đầu của cốc
                        <select id="jar-ph" value={initialPh}
                          disabled={locked || !!cup || projection.phase !== 'setup'}
                          onChange={(event) => setInitialPh(Number(event.target.value))}>
                          {JAR_PROFILE.availableInitialPh.map((ph) =>
                            <option key={ph} value={ph}>{ph}</option>)}
                        </select>
                      </label>
                      <div className={styles.actionRow}>
                        <button type="button" className="btn" disabled={locked || !!cup || projection.phase !== 'setup'}
                          onClick={() => submit('prepare_cup', { cupId: selectedCupId, initialPh })}>
                          Chuẩn bị cốc {selectedCupId}
                        </button>
                        <button type="button" className="btn" disabled={locked || !!projection.initialMeasurement || projection.phase !== 'setup'}
                          onClick={() => submit('measure_initial')}>Đo mẫu ban đầu</button>
                      </div>
                      <p>Mẫu ban đầu: <strong data-testid="jar-initial-ntu">
                        {readingLabel(projection.initialMeasurement)}</strong> · {readingNote(projection.initialMeasurement)}</p>
                    </div>
                    <div className={styles.controlGroup}>
                      <h3>Cấp phèn nhôm</h3>
                      <div className={styles.numbers}>
                        <div className={styles.reading}><span>Cốc</span><strong>{selectedCupId}</strong></div>
                        <div className={styles.reading}><span>Tổng liều</span>
                          <strong data-testid="jar-dose">{cup ? cup.doseMgL + ' mg/L' : 'N/A'}</strong></div>
                        <div className={styles.reading}><span>Tối đa</span><strong>250 mg/L</strong></div>
                      </div>
                      <label className={styles.inputField} htmlFor="jar-dose-increment">
                        Liều tăng (mg/L)
                        <select id="jar-dose-increment" value={doseIncrement}
                          disabled={locked || !cup || projection.phase !== 'setup'}
                          onChange={(event) => setDoseIncrement(Number(event.target.value))}>
                          {[50, 100, 150, 200, 250].map((dose) =>
                            <option key={dose} value={dose}>{dose}</option>)}
                        </select>
                      </label>
                      <button type="button" className="btn btn-primary"
                        disabled={locked || !cup || projection.phase !== 'setup' ||
                          cup.doseMgL + doseIncrement > JAR_PROFILE.maxDoseMgL}
                        onClick={() => submit('add_coagulant',
                          { cupId: selectedCupId, incrementMgL: doseIncrement },
                          { incrementMgL: 'mg/L' })}>
                        Thêm {doseIncrement} mg/L vào cốc {selectedCupId}
                      </button>
                    </div>
                    <div className={styles.controlGroup}>
                      <h3>Chương trình chung</h3>
                      <ol>
                        {PHASES.map((phase) => (
                          <li key={phase.id}>{phase.name}: {phase.seconds} giây · {phase.rpm} rpm</li>
                        ))}
                      </ol>
                      <p>Chỉ một pha được commit mỗi lần. Hoạt ảnh không tăng thời gian mô phỏng.</p>
                      {nextPhase && (
                        <button type="button" className="btn btn-primary"
                          disabled={locked} onClick={() => submit('run_phase', { phase: nextPhase })}>
                          Chạy pha {PHASE_NAME[nextPhase]} ({JAR_PROFILE.phases[nextPhase].durationSeconds} giây mô phỏng)
                        </button>
                      )}
                    </div>
                    <div className={styles.controlGroup}>
                      <h3>Đo và ghi kết quả cốc {selectedCupId}</h3>
                      <p>Được phép đo sớm; nếu chưa đủ quy trình, số đo sẽ không hợp lệ và hiển thị N/A.</p>
                      <button className="btn" type="button" disabled={locked || !cup}
                        onClick={() => submit('measure_final', { cupId: selectedCupId })}>
                        Đo độ đục cuối cốc {selectedCupId}
                      </button>
                      <p data-testid="jar-selected-reading"><strong>{readingLabel(recent)}</strong> · {readingNote(recent)}</p>
                      <label className={styles.inputField} htmlFor="jar-removal">
                        Phần trăm giảm đục tự tính (%)
                        <input id="jar-removal" type="number" inputMode="decimal" step="any"
                          placeholder="Nhập đáp số của bạn" value={answerInput}
                          disabled={locked || !cup}
                          onChange={(event) => setAnswerDrafts((old) => ({
                            ...old, [selectedCupId]: event.target.value,
                          }))} />
                      </label>
                      <button type="button" className="btn" disabled={locked || !cup ||
                        answerInput.trim() === '' || !Number.isFinite(Number(answerInput))}
                        onClick={() => submit('record_result',
                          { cupId: selectedCupId, removalPercent: Number(answerInput) })}>
                        Ghi đáp số cốc {selectedCupId}
                      </button>
                      <p>Đáp số đã lưu: {cup?.submittedRemovalPercent === null || cup === undefined
                        ? 'N/A' : cup.submittedRemovalPercent + ' %'}</p>
                      <button type="button" className="btn" disabled={locked || !cup}
                        onClick={() => submit('select_result', { cupId: selectedCupId })}>
                        Chọn cốc {selectedCupId} làm phương án nộp
                      </button>
                      <p>Phương án đã chọn: <strong data-testid="jar-submitted-cup">
                        {projection.selectedCupId ? 'Cốc ' + projection.selectedCupId : 'Chưa chọn'}</strong></p>
                    </div>
                    <div className={styles.controlGroup}>
                      <h3>Kết thúc lượt</h3>
                      <p>Có thể nộp dù thiếu phép đo hoặc đáp số. Hệ thống giữ nguyên dữ liệu đã thực hiện.</p>
                      <button type="button" className="btn btn-primary"
                        disabled={locked} onClick={() => submit(null)}>
                        Hoàn thành và lưu lượt Jar Test
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className={styles.panel}>
            <h2>Sổ đo và thiết kế cốc</h2>
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <caption>Chỉ hiện số đo đã thực hiện; N/A không có nghĩa bằng 0.</caption>
                <thead><tr><th scope="col">Cốc</th><th scope="col">pH ban đầu</th>
                  <th scope="col">Tổng liều (mg/L)</th><th scope="col">NTU cuối</th>
                  <th scope="col">Đáp số đã nộp (%)</th></tr></thead>
                <tbody>
                  {JAR_CUP_IDS.map((id) => {
                    const entry = projection.cups.find((item) => item.id === id)
                    const last = entry?.measurements.at(-1)
                    return (
                      <tr key={id} data-selected={id === selectedCupId ? 'true' : 'false'}>
                        <th scope="row">Cốc {id}</th>
                        <td>{entry ? entry.initialPh : 'N/A'}</td>
                        <td>{entry ? entry.doseMgL : 'N/A'}</td>
                        <td title={readingNote(last)}>
                          {readingLabel(last)}
                          {last && !last.valid && <small> · Chưa đủ quy trình</small>}
                        </td>
                        <td>{entry?.submittedRemovalPercent === null || !entry
                          ? 'N/A' : entry.submittedRemovalPercent}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
          {view.status === 'completed' && (
            <section className={styles.readonly} aria-label="Kết quả lưu sau khi hoàn thành">
              <h2>Đã hoàn thành và lưu lượt</h2>
              <p>Trạng thái: chỉ đọc. Lượt và bản ghi kết quả không thay đổi khi tải lại trang.</p>
              <p>Phương án đã nộp: <strong>{projection.selectedCupId
                ? 'Cốc ' + projection.selectedCupId : 'Chưa chọn phương án'}</strong>.</p>
              <p>Đã lưu {projection.cups.length} cốc và {projection.cups.reduce(
                (sum, item) => sum + item.measurements.length, 0,
              )} phép đo cuối (bao gồm số đo không hợp lệ).</p>
              <p className={styles.underText}>Đây là xác nhận tối thiểu. Báo cáo phân tích đầy đủ thuộc giai đoạn tiếp theo.</p>
              <a className="btn" href={JAR_PATH}>Bắt đầu mẻ Jar Test mới</a>
            </section>
          )}
        </>
      )}
    </section>
  )
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
