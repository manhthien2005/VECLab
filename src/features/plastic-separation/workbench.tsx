'use client'

import { useState, useEffect, useTransition, useCallback, useMemo, useRef, useId } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { GuestAttemptRepository } from '@/application/attempts/guest-repository.js'
import {
  createPlasticSession,
  type PlasticSessionView,
} from '@/application/simulation/plastic-session.js'
import type { StoredAttemptEventRecord } from '@/application/attempts/repository.js'
import type { UUID } from '@/domain/process/contracts.js'
import {
  type PlasticSeparationState,
  type PolymerId,
} from '@/domain/experiments/virgin-plastic-separation/model.js'
import { GuideIcon, TheoryIcon, SourcesIcon, TargetIcon, ReportIcon, SubmitIcon } from '@/features/workbench/icons.js'
import { ArrowRightIcon, FlaskIcon, CheckCircleIcon } from '@/features/landing/icons.js'
import { type WorkbenchTourStep } from '@/features/workbench/tour.js'
import { PlasticSeparationApparatus } from './apparatus.js'
import { PlasticEquipmentShelf } from './equipment-shelf.js'
import { PlasticEquipmentPanel, type PlasticItemKind } from './equipment-panel.js'
import { PlasticNotebook } from './notebook.js'
import { PlasticCompletionDialog } from './completion.js'
import styles from './workbench.module.css'
import bench from '@/features/extraction/bench.module.css'
import { WorkbenchFrame, type WorkbenchPane } from '@/features/workbench/frame.js'
import { ActionButton } from '@/features/workbench/action-button.js'
import { PlasticControls } from './controls.js'
import { PlasticDialog } from './dialog.js'
import { plasticSubmissionChecks, PLASTIC_WORKBENCH_STEPS, plasticWorkbenchContext, type PlasticControlGroup } from './readouts.js'
import ui from './workbench-ui.module.css'
import type { PlasticMotion } from './motion.js'

function EquipmentArtPlastic() {
  const id = useId().replaceAll(':', '')
  return (
    <svg className={styles.entrySvg} viewBox="0 0 80 90" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-body`} x1="10" y1="15" x2="70" y2="75" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f8fafc" />
          <stop offset="0.5" stopColor="#f1f5f9" />
          <stop offset="1" stopColor="#e2e8f0" />
        </linearGradient>
        <linearGradient id={`${id}-liquid`} x1="16" y1="36" x2="64" y2="76" gradientUnits="userSpaceOnUse">
          <stop stopColor="#e0f2fe" stopOpacity="0.85" />
          <stop offset="1" stopColor="#bae6fd" stopOpacity="0.95" />
        </linearGradient>
      </defs>
      {/* Pilot tank outer shell */}
      <rect x="14" y="16" width="52" height="62" rx="10" fill={`url(#${id}-body)`} stroke="#94a3b8" strokeWidth="1.5" />
      {/* Tank rim */}
      <rect x="11" y="14" width="58" height="5" rx="2.5" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.2" />
      {/* Liquid body */}
      <path d="M15 38 Q 40 41, 65 38 L 65 68 Q 65 77, 56 77 L 24 77 Q 15 77, 15 68 Z" fill={`url(#${id}-liquid)`} />
      {/* Fluid meniscus surface */}
      <ellipse cx="40" cy="38" rx="25" ry="4" fill="#38bdf8" fillOpacity="0.35" stroke="#38bdf8" strokeWidth="1" />
      {/* Center stirrer shaft & motor mount */}
      <rect x="38.5" y="6" width="3" height="52" rx="1.5" fill="#64748b" />
      <rect x="34" y="5" width="12" height="6" rx="2" fill="#475569" />
      {/* Dual impeller blades (160 rpm) */}
      <path d="M28 54 L 52 54" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M26 64 L 54 64" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
      {/* Measurement volume ticks on wall */}
      <line x1="17" y1="46" x2="22" y2="46" stroke="#94a3b8" strokeWidth="1" />
      <line x1="17" y1="54" x2="25" y2="54" stroke="#94a3b8" strokeWidth="1.2" />
      <line x1="17" y1="62" x2="22" y2="62" stroke="#94a3b8" strokeWidth="1" />
      {/* Floating pellets (PP yellow, HDPE green) at liquid surface */}
      <circle cx="27" cy="37" r="3.2" fill="#eab308" stroke="#a16207" strokeWidth="0.8" />
      <circle cx="35" cy="36" r="3" fill="#22c55e" stroke="#15803d" strokeWidth="0.8" />
      <circle cx="47" cy="36.5" r="3.2" fill="#eab308" stroke="#a16207" strokeWidth="0.8" />
      <circle cx="53" cy="38" r="3" fill="#22c55e" stroke="#15803d" strokeWidth="0.8" />
      {/* Sinking pellets (PS cyan, ABS orange, PA purple, PC blue) near tank bottom */}
      <circle cx="24" cy="71" r="3" fill="#06b6d4" stroke="#0891b2" strokeWidth="0.8" />
      <circle cx="32" cy="72.5" r="3.2" fill="#f97316" stroke="#c2410c" strokeWidth="0.8" />
      <circle cx="48" cy="72" r="3.1" fill="#a855f7" stroke="#7e22ce" strokeWidth="0.8" />
      <circle cx="56" cy="70.5" r="3.2" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="0.8" />
    </svg>
  )
}

const PLASTIC_WORKBENCH_TOUR: readonly WorkbenchTourStep[] = [
  {
    area: 'header',
    title: 'Mục tiêu & lượt thực hành',
    description:
      'Xem mục tiêu học tập và trạng thái lưu ở đầu trang. Nút Nộp bài kết thúc lượt và khóa các thao tác; bạn vẫn có thể xem lại số liệu.',
  },
  {
    area: 'shelf',
    title: 'Mẫu & dụng cụ',
    description:
      'Ba mục giới thiệu sáu mẫu nhựa, bể pilot và bộ ly tâm–cân. Nhấn từng mục để xem chi tiết; các bước thực hành nằm trong bảng Thao tác.',
  },
  {
    area: 'simulation',
    title: 'Khu vực thực hành',
    description:
      'Quan sát minh họa bể pilot và phân đoạn nổi–chìm theo hồ sơ. Chuyển động không mô phỏng dòng chảy hay tốc độ phân tách ngoài thực tế.',
  },
  {
    area: 'controls',
    title: 'Thao tác phân loại nhựa',
    description:
      'Bảng điều khiển bên phải hướng dẫn bạn từng bước: chuẩn bị 6 mẫu polymer, nạp bể và tách nước, ly tâm tách ẩm, và lần lượt thực hiện 2 nhánh dung dịch Ethanol và NaCl.',
  },
  {
    area: 'notebook',
    title: 'Sổ đo & lịch sử',
    description:
      'Mở khu vực Sổ đo để xem lại các bước thao tác, các phân đoạn thu hồi và khối lượng quy đổi từ tỷ lệ tham khảo.',
  },
] as const

type WorkbenchProps = {
  attemptId: string | null
  invalidAttempt?: boolean
  storageMode?: 'local' | 'cloud'
  openReport?: boolean
  initialPane?: 'simulation' | 'notebook'
}

type LoadState = 'idle' | 'loading' | 'ready' | 'missing' | 'error'

export function PlasticSeparationWorkbench({
  attemptId,
  invalidAttempt = false,
  openReport = false,
  initialPane = 'simulation',
}: WorkbenchProps) {
  const router = useRouter()
  const repository = useMemo(() => new GuestAttemptRepository<PlasticSeparationState>(), [])
  const session = useMemo(() => createPlasticSession(repository), [repository])
  const [loadState, setLoadState] = useState<LoadState>(invalidAttempt ? 'missing' : attemptId ? 'loading' : 'idle')
  const [attempt, setAttempt] = useState<PlasticSessionView | null>(null)
  const [activePane, setActivePane] = useState<WorkbenchPane>(initialPane)
  const [groupSelection, setGroupSelection] = useState<{ revision: number; id: PlasticControlGroup | null } | null>(null)
  const notebookRef = useRef<HTMLDivElement>(null)
  const [isReportOpen, setIsReportOpen] = useState(openReport)
  const [selectedPolymerId, setSelectedPolymerId] = useState<PolymerId | null>(null)
  const [motion, setMotion] = useState<PlasticMotion | null>(null)
  const finishMotion = useCallback((key: string) => setMotion(current => current?.key === key && current.playing ? { ...current, playing: false } : current), [])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [resetModalOpen, setResetModalOpen] = useState(false)
  const [history, setHistory] = useState<{ attemptId: string; records: readonly StoredAttemptEventRecord<PlasticSeparationState>[] } | null>(null)
  const writing = useRef(false)
  const [submissionOpen, setSubmissionOpen] = useState(false)
  const [tourOpen, setTourOpen] = useState(false)
  const [equipmentItem, setEquipmentItem] = useState<PlasticItemKind | null>(null)
  const tourTrigger = useRef<HTMLButtonElement>(null)

  // Initialize session and load attempt if specified
  useEffect(() => {
    let cancelled = false
    async function init() {
      if (invalidAttempt) { setLoadState('missing'); setAttempt(null); return }
      if (!attemptId) {
        setLoadState('idle')
        setAttempt(null)
        return
      }
      setLoadState('loading')
      try {
        const loaded = await session.load(attemptId as UUID)
        if (cancelled) return
        if (loaded && loaded.ok) {
          setAttempt(loaded.state)
          setLoadState('ready')
        } else {
          setLoadState('missing')
          setAttempt(null)
        }
      } catch {
        if (!cancelled) {
          setLoadState('error')
          setErrorMessage('Chưa đọc được dữ liệu trên trình duyệt. Tải lại lượt để thử lại.')
        }
      }
    }

    void init()
    return () => {
      cancelled = true
    }
  }, [attemptId, invalidAttempt, session])

  useEffect(() => {
    if (!attempt) return
    let cancelled = false
    void repository.getAttemptEventRecords(attempt.attemptId).then(records => {
      if (!cancelled) setHistory({ attemptId: attempt.attemptId, records })
    }).catch(() => { if (!cancelled) setHistory(null) })
    return () => { cancelled = true }
  }, [attempt, repository])

  // Start fresh attempt handler (from hero entry button)
  const handleStartSession = useCallback(async () => {
    if (isPending || writing.current) return
    writing.current = true
    setErrorMessage(null)
    startTransition(async () => {
      try {
        const fresh = await session.start()
        setAttempt(fresh)
        setLoadState('ready')
        router.replace(`/simulate/plastic-density-separation?attempt=${fresh.attemptId}`, { scroll: false })
      } catch {
        setErrorMessage('Chưa tạo được lượt trên trình duyệt. Kiểm tra quyền lưu dữ liệu rồi thử lại.')
      } finally { writing.current = false }
    })
  }, [session, router, isPending])


  // Action dispatcher
  const dispatchAction = useCallback(
    async (actionType: string, parameters: Record<string, number | string | boolean> = {}) => {
      if (!attempt || writing.current || attempt.status !== 'in_progress') return
      writing.current = true
      setErrorMessage(null)

      startTransition(async () => {
        try {
          const res = await session.apply(attempt.attemptId, actionType, parameters, {}, { expectedRevision: attempt.revision })
          if (res.ok) {
            setAttempt(res.state)
            setMotion({ key: `${res.state.attemptId}:${res.state.revision}`, actionType, previous: attempt.projection, playing: true })
          } else {
            if ('error' in res && res.error) {
              setErrorMessage('Chưa thể lưu thao tác ở trạng thái hiện tại. Tải lại lượt để lấy dữ liệu mới nhất trước khi tiếp tục.')
            } else if ('outcome' in res) {
              setErrorMessage('Lượt có thể đã thay đổi ở tab khác. Tải lại lượt để xác nhận trạng thái đã lưu.')
            }
          }
        } catch {
          setErrorMessage('Chưa xác nhận được thao tác đã lưu. Tải lại lượt trước khi tiếp tục để tránh ghi trùng.')
        } finally { writing.current = false }
      })
    },
    [session, attempt],
  )

  // Complete attempt
  const handleComplete = useCallback(async () => {
    if (!attempt || writing.current || attempt.status !== 'in_progress' || !plasticSubmissionChecks(attempt.projection).every(check => check.done)) return
    writing.current = true
    setErrorMessage(null)

    startTransition(async () => {
      try {
        const res = await session.complete(attempt.attemptId, { expectedRevision: attempt.revision })
        if (res.ok) {
          setAttempt(res.state)
          setSubmissionOpen(false)
          setIsReportOpen(true)
        } else {
          setErrorMessage('Chưa thể hoàn thành lượt: vui lòng kiểm tra lại các bước.')
        }
      } catch {
        setErrorMessage('Chưa xác nhận được bài nộp. Tải lại lượt để kiểm tra báo cáo đã lưu.')
      } finally { writing.current = false }
    })
  }, [session, attempt])

  // Reset attempt
  const handleReset = useCallback(async () => {
    if (writing.current) return
    writing.current = true
    setResetModalOpen(false)
    setSubmissionOpen(false)
    setErrorMessage(null)

    startTransition(async () => {
      try {
        const fresh = await session.start()
        setAttempt(fresh)
        setLoadState('ready')
        setGroupSelection(null)
        setActivePane('simulation')
        setSelectedPolymerId(null)
        setMotion(null)
        setIsReportOpen(false)
        router.replace(`/simulate/plastic-density-separation?attempt=${fresh.attemptId}`)
      } catch {
        setErrorMessage('Chưa tạo được lượt mới. Lượt hiện tại vẫn được giữ nguyên; tải lại để kiểm tra dữ liệu.')
      } finally { writing.current = false }
    })
  }, [session, router])

  const ready = loadState === 'ready' && !!attempt
  const projection = loadState === 'ready' ? attempt?.projection ?? null : null
  const currentMotion = motion?.key === `${attempt?.attemptId}:${projection?.revision}` ? motion : null
  const handlePrepareSamples = () => { void dispatchAction('prepare_samples') }
  const handleLoadAndWet = () => { void dispatchAction('load_and_wet') }
  const handleSeparateWater = () => { void dispatchAction('separate_water') }
  const handleInitialCentrifuge = () => { void dispatchAction('centrifuge_and_weigh') }
  const handleBranchPreset = (type: string, parameters: Record<string, number | string | boolean>) => { void dispatchAction(type, parameters) }
  const context = projection ? plasticWorkbenchContext(projection) : null
  const openGroup = groupSelection?.revision === projection?.revision ? groupSelection?.id ?? null : context?.group ?? null
  const chooseGroup = (id: PlasticControlGroup | null) => setGroupSelection({ revision: projection?.revision ?? -1, id })
  const showControls = (id: PlasticControlGroup) => {
    chooseGroup(id)
    setActivePane('controls')
    requestAnimationFrame(() => {
      const summary = document.getElementById('plastic-control-' + id)?.querySelector('summary')
      summary?.scrollIntoView({ block: 'nearest', behavior: 'instant' })
      summary?.focus({ preventScroll: true })
    })
  }
  const showNotebook = () => {
    setActivePane('notebook')
    requestAnimationFrame(() => {
      notebookRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' })
      notebookRef.current?.focus({ preventScroll: true })
    })
  }
  const done = attempt?.status === 'completed'
  const lockReason = !ready ? 'Đang mở lượt thực hành.' : isPending ? 'Đang lưu. Chờ xác nhận trước khi tiếp tục.' : errorMessage ? 'Tải lại lượt để xác nhận dữ liệu trước khi tiếp tục.' : attempt?.status === 'stopped' ? 'Lượt đã dừng. Bắt đầu lượt mới để tiếp tục.' : null
  const guideHref = '/experiments/plastic-density-separation/guide' + (attempt ? '?attempt=' + encodeURIComponent(attempt.attemptId) : '')
  const checks = projection ? plasticSubmissionChecks(projection) : []
  const selectBranch = (branch: 'light' | 'heavy') => { void dispatchAction('select_branch', { branch }) }
  const header = <>
    <Link className={bench.brand} href="/" aria-label="Trang chủ VECLab"><span><FlaskIcon /></span><strong>VECLab</strong></Link>
    <Link className={bench.back} href="/experiments"><ArrowRightIcon />Thí nghiệm</Link>
    <div className={bench.title}><h1>Phân loại nhựa nguyên sinh</h1><p>Nổi–chìm · Hai nhánh dung dịch · Thu hồi</p></div>
    <details className={ui.goal}><summary><TargetIcon />Mục tiêu & phạm vi</summary><div className={ui.goalPanel}><h2>Mục tiêu học tập</h2><p>Giải thích cách phân loại sáu loại nhựa nguyên sinh theo khối lượng riêng; đọc phân đoạn nổi–chìm và đối chiếu tỷ lệ thu hồi.</p><h2>Phạm vi lượt thực hành</h2><p>Sáu mẫu · 2,0 kg mỗi loại. Hoàn thành bước tách nước, nhánh ethanol và nhánh NaCl với các mức nồng độ cố định; ghi nhận ly tâm và cân sau từng bước tách.</p><p>Thu hồi là dữ liệu tham khảo; khối lượng được quy đổi, không phải phép đo mới. Không suy ra độ tinh khiết hoặc thiết kế quy trình thật.</p></div></details>
    <div className={bench.headerActions}><span className={bench.saveState} role="status"><CheckCircleIcon />{loadState === 'loading' ? 'Đang mở lượt…' : isPending ? 'Đang lưu…' : errorMessage ? 'Cần xác nhận dữ liệu' : ready ? 'Đã lưu trên thiết bị' : 'Lưu trên trình duyệt'}</span>
      <button className={bench.button} type="button" disabled={!attempt?.report} onClick={() => setIsReportOpen(true)} title={attempt?.report ? 'Xem báo cáo đã chốt' : 'Báo cáo được lưu sau khi nộp bài'}><ReportIcon />Báo cáo</button>
      <button className={bench.primary} type="button" disabled={!ready || isPending || attempt?.status === 'stopped' || (done && !attempt?.report)} onClick={() => done ? setIsReportOpen(true) : setSubmissionOpen(true)}>{done ? <CheckCircleIcon /> : <SubmitIcon />}{done ? 'Đã nộp' : 'Nộp bài'}</button>
    </div>
  </>
  const shelf = <div className={bench.shelfContent}>
    <PlasticEquipmentShelf onSelectEquipment={setEquipmentItem} />
    <div className={bench.shelfHelp}>
      <button ref={tourTrigger} className={bench.guideButton} type="button" onClick={() => setTourOpen(true)}>
        <GuideIcon />Hướng dẫn thao tác
      </button>
      <Link className={bench.theoryLink} href={guideHref} target="_blank" rel="noopener noreferrer">
        <TheoryIcon /><span>Lý thuyết & cách làm bài</span>
      </Link>
      <details><summary><SourcesIcon />Nguồn & giới hạn</summary>
        <p>Các điều kiện cố định theo Meneses Quelal và cộng sự (2022). Khối lượng được quy đổi từ tỷ lệ thu hồi tham khảo, không phải phép đo mới.</p>
        <Link href={guideHref + '#plastic-sources'} target="_blank" rel="noopener noreferrer">Đọc nguồn và giới hạn — mở tab mới <ArrowRightIcon /></Link>
      </details>
    </div>
  </div>
  const simulation = (
<div className={styles.centerColumn} data-workbench-area="simulation">
            <div className={ui.stageHeader}>
              <div className={ui.sceneTitle}><div><h2>Khu vực thực hành</h2><p>Sáu mẫu nhựa nguyên sinh · Hai nhánh dung dịch</p></div>{context && <span className={ui.badge}>{attempt?.status === 'completed' ? 'Đã nộp' : context.label}</span>}</div>
              <ol className={ui.steps} aria-label="Quy trình phân loại nhựa">{PLASTIC_WORKBENCH_STEPS.map((step, index) => <li key={step.id} aria-current={ready && context?.group === step.id ? 'step' : undefined}>
                <button type="button" disabled={!ready} aria-label={'Mở thao tác: ' + step.label} onClick={() => showControls(step.id)}><span>{index + 1}</span>{step.label}</button>
              </li>)}</ol>
            </div>
            {ready && projection && context && <div className={ui.sceneContext} aria-label="Trạng thái thực hành">
              <dl><div><dt>Môi trường hiện tại</dt><dd>{context.medium}</dd></div><div><dt>Nhánh đã hoàn tất</dt><dd>{projection.completedBranches.length}/2</dd></div></dl>
              <p>Chuyển động minh họa các bước đã ghi nhận; có thể xem ngay trạng thái cuối.</p>
            </div>}
            {/* Center Column: Hero entry when not ready, summary scene when completed/summary, apparatus card when running */}
            {!ready || !projection ? (
              <div className={bench.entry}>
                {loadState === 'idle' && (
                  <>
                    <EquipmentArtPlastic />
                    <h2 className={styles.entryTitle}>Phân loại nhựa theo khối lượng riêng</h2>
                    <p className={styles.entryDesc}>
                      Chuẩn bị sáu mẫu nhựa, tách sơ bộ trong nước rồi thực hiện hai nhánh ethanol và NaCl. Ghi nhận ly tâm, cân và đối chiếu các phân đoạn thu hồi.
                    </p>
                    <p className={styles.entryMuted}>
                      Các mức nồng độ cố định theo hồ sơ. Khối lượng được quy đổi từ tỷ lệ thu hồi tham khảo; lượt thực hành lưu trên trình duyệt.
                    </p>
                    <button
                      type="button"
                      className={bench.primary}
                      onClick={() => void handleStartSession()}
                      disabled={isPending}
                    >
                      {isPending ? 'Đang tạo lượt…' : 'Bắt đầu thí nghiệm Phân loại nhựa'}
                    </button>
                  </>
                )}
                {loadState === 'loading' && (
                  <p role="status" style={{ color: 'var(--ink-muted)' }}>Đang mở lượt thực hành đã lưu…</p>
                )}
                {loadState === 'missing' && (
                  <div role="alert" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <h2 className={styles.entryTitle}>Chưa mở được lượt thực hành</h2>
                    <p className={styles.entryDesc}>Liên kết không hợp lệ, lượt không có trên trình duyệt này hoặc thuộc phiên bản chưa hỗ trợ. Dữ liệu đã lưu được giữ nguyên.</p>
                    <Link className={bench.primary} href="/simulate/plastic-density-separation">Về màn bắt đầu</Link>
                  </div>
                )}
                {loadState === 'error' && (
                  <div role="alert" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <h2 className={styles.entryTitle}>Chưa mở được lượt thực hành</h2>
                    <p className={styles.entryDesc}>{errorMessage ?? 'Lỗi kết nối bộ lưu trữ.'}</p>
                    <button type="button" className={bench.primary} onClick={() => location.reload()}>Tải lại lượt</button>
                  </div>
                )}
              </div>
            ) : (
              <PlasticSeparationApparatus key={attempt?.attemptId} projection={projection} motion={currentMotion} onMotionEnd={finishMotion}
                onSelectPolymer={id => setSelectedPolymerId(current => current === id ? null : id)} selectedPolymerId={selectedPolymerId} />
            )}
          </div>
  )
  return <div className={ui.root}>
    <WorkbenchFrame label="Bàn phân loại nhựa nguyên sinh" header={header} shelf={shelf} simulation={simulation}
      controls={<PlasticControls projection={projection} context={context} openGroup={openGroup} onGroupChange={chooseGroup} lockReason={lockReason} done={done} reportAvailable={!!attempt?.report} guideHref={guideHref} onPrepare={handlePrepareSamples} onWet={handleLoadAndWet} onWater={handleSeparateWater} onCentrifuge={handleInitialCentrifuge} onBranch={selectBranch} onPreset={handleBranchPreset} onSummary={() => void dispatchAction('summarize_fractions')} onSubmit={() => setSubmissionOpen(true)} onReport={() => setIsReportOpen(true)} onNotebook={showNotebook} onReset={() => setResetModalOpen(true)} />}
      notebook={<div ref={notebookRef} tabIndex={-1}>{projection ? <PlasticNotebook projection={projection} history={history?.attemptId === attempt?.attemptId ? history?.records ?? null : null} /> : <div className={ui.notebook}><h2>Sổ thực hành</h2><p className={ui.muted}>Chưa có lượt thực hành để ghi sổ.</p></div>}</div>}
      pane={activePane} onPaneChange={setActivePane} contentSized tourSteps={PLASTIC_WORKBENCH_TOUR} tourOpen={tourOpen} onTourClose={() => { setTourOpen(false); requestAnimationFrame(() => tourTrigger.current?.focus({ preventScroll: true })) }} onShelfInfo={() => setEquipmentItem('pp')}
      notices={errorMessage ? <div className={ui.notice} role="alert"><p>{errorMessage}</p><button className={ui.button} type="button" onClick={() => location.reload()}>Tải lại lượt</button></div> : openReport && ready && !attempt?.report ? <div className={ui.notice} role="status">{done ? 'Chưa đọc được báo cáo đã chốt. Dữ liệu được giữ nguyên; bạn vẫn có thể xem sổ thực hành.' : 'Lượt chưa nộp nên chưa có báo cáo. Bạn có thể xem sổ và tiếp tục thực hành.'}</div> : undefined} />
    {submissionOpen && projection && <PlasticDialog title="Kiểm tra trước khi nộp bài" onClose={() => setSubmissionOpen(false)}><p>Nộp bài sẽ chốt báo cáo và khóa các thao tác của lượt này. Dữ liệu được lưu trên trình duyệt, chưa gửi đến giảng viên.</p><ul className={ui.checks}>{checks.map(check => <li key={check.label}><span>{check.done ? 'Đã hoàn thành' : 'Chưa hoàn thành'}</span><span>{check.label}</span></li>)}</ul>{errorMessage && <p role="alert">{errorMessage} <button className={ui.button} type="button" onClick={() => location.reload()}>Tải lại lượt</button></p>}<div className={ui.actions}><button className={ui.button} type="button" onClick={() => setSubmissionOpen(false)}>Tiếp tục thực hành</button><ActionButton className={ui.primary} reasonClassName={ui.reason} reason={lockReason ?? (!checks.every(check => check.done) ? 'Hoàn thành các mục còn thiếu trước khi nộp bài.' : null)} onClick={() => void handleComplete()}>Hoàn tất lượt thực hành</ActionButton></div></PlasticDialog>}
    {isReportOpen && attempt?.report && <PlasticCompletionDialog report={attempt.report} onClose={() => { setIsReportOpen(false); setActivePane('notebook') }} onNewAttempt={() => { setIsReportOpen(false); setResetModalOpen(true) }} />}
    {resetModalOpen && <PlasticDialog title="Bắt đầu lượt mới?" onClose={() => setResetModalOpen(false)}><p>Lượt hiện tại và báo cáo đã lưu được giữ nguyên trong Lab. Lượt mới bắt đầu từ bước chuẩn bị sáu mẫu.</p><div className={ui.actions}><button className={ui.button} type="button" onClick={() => setResetModalOpen(false)}>Quay lại</button><button className={ui.primary} type="button" disabled={isPending} onClick={() => void handleReset()}>Tạo lượt mới</button></div></PlasticDialog>}
    {equipmentItem && <PlasticEquipmentPanel item={equipmentItem} onItemChange={setEquipmentItem} onClose={() => setEquipmentItem(null)} />}
  </div>
}
