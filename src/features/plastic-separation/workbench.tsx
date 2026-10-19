'use client'

import { useState, useEffect, useTransition, useCallback, useMemo, useRef, useId } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { GuestAttemptRepository } from '@/application/attempts/guest-repository.js'
import {
  createPlasticSession,
  type PlasticSessionView,
} from '@/application/simulation/plastic-session.js'
import type { UUID } from '@/domain/process/contracts.js'
import {
  VIRGIN_POLYMERS,
  type PlasticSeparationState,
  type PolymerId,
} from '@/domain/experiments/virgin-plastic-separation/model.js'
import { GuideIcon, TheoryIcon, SourcesIcon, InfoIcon, TargetIcon } from '@/features/workbench/icons.js'
import { ArrowRightIcon } from '@/features/landing/icons.js'
import { WorkbenchTour, type WorkbenchTourStep } from '@/features/workbench/tour.js'
import { PlasticSeparationApparatus } from './apparatus.js'
import { PlasticEquipmentShelf } from './equipment-shelf.js'
import { PlasticEquipmentPanel, type PlasticItemKind } from './equipment-panel.js'
import { PlasticNotebook } from './notebook.js'
import { PlasticCompletionDialog } from './completion.js'
import styles from './workbench.module.css'

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
      'Kệ bên trái giới thiệu mẫu, hóa chất và thiết bị của bài. Bạn thao tác với chúng qua bảng Thao tác, không cần kéo thả. Có thể mở lại hướng dẫn này bất cứ lúc nào.',
  },
  {
    area: 'simulation',
    title: 'Khu vực thực hành',
    description:
      'Mô phỏng trực quan bể pilot 800 L với động học khuấy và phân tầng chìm–nổi của các hạt nhựa theo nồng độ môi trường. Khi hoàn tất, nơi đây hiển thị ma trận 6 khay thu hồi.',
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
      'Chuyển sang tab Sổ thực hành để xem lại các bước thao tác, số liệu phân đoạn thu hồi và bảng cân bằng khối lượng các loại polymer.',
  },
] as const

type WorkbenchProps = {
  attemptId: string | null
  storageMode?: 'local' | 'cloud'
  openReport?: boolean
  initialPane?: 'simulation' | 'notebook'
}

type PhaseOneVisual = 'idle' | 'trays' | 'loading-trays' | 'prepared' | 'water-rising' | 'pouring' | 'mixing'
type InitialCentrifugeVisual = 'idle' | 'loading' | 'spinning' | 'transferring' | 'complete'
type BranchSeparationVisual = 'idle' | 'mixing' | 'separating' | 'ready'
type SummaryTrayState = 'hidden' | 'animating' | 'visible'
type LoadState = 'idle' | 'loading' | 'ready' | 'missing' | 'error'

export function PlasticSeparationWorkbench({
  attemptId,
  openReport = false,
  initialPane = 'simulation',
}: WorkbenchProps) {
  const router = useRouter()
  const session = useMemo(
    () => createPlasticSession(new GuestAttemptRepository<PlasticSeparationState>()),
    [],
  )
  const [loadState, setLoadState] = useState<LoadState>(attemptId ? 'loading' : 'idle')
  const [attempt, setAttempt] = useState<PlasticSessionView | null>(null)
  const [activePane, setActivePane] = useState<'simulation' | 'notebook'>(initialPane)
  const [isReportOpen, setIsReportOpen] = useState(openReport)
  const [selectedPolymerId, setSelectedPolymerId] = useState<PolymerId | null>(null)
  const [activeCue, setActiveCue] = useState<{ id: string; actionType: string; message: string } | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [resetModalOpen, setResetModalOpen] = useState(false)
  const [phaseOneVisual, setPhaseOneVisual] = useState<PhaseOneVisual>('idle')
  const [tankParticleSeed, setTankParticleSeed] = useState(1)
  const [waterSeparationRunning, setWaterSeparationRunning] = useState(false)
  const [initialCentrifugeVisual, setInitialCentrifugeVisual] = useState<InitialCentrifugeVisual>('idle')
  const [branchSeparationVisual, setBranchSeparationVisual] = useState<BranchSeparationVisual>('idle')
  const [branchSelectionPending, setBranchSelectionPending] = useState(false)
  const [summaryTrayState, setSummaryTrayState] = useState<SummaryTrayState>('hidden')
  const [summaryVisibleCount, setSummaryVisibleCount] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  const [tourOpen, setTourOpen] = useState(false)
  const [tourStep, setTourStep] = useState(0)
  const [equipmentItem, setEquipmentItem] = useState<PlasticItemKind | null>(null)
  const tourTrigger = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!attempt) return
    const timer = window.setTimeout(() => {
      if (attempt.projection.wetted && phaseOneVisual === 'idle') setPhaseOneVisual('mixing')
      else if (attempt.projection.samplesPrepared && phaseOneVisual === 'idle') setPhaseOneVisual('prepared')
    }, 0)
    return () => window.clearTimeout(timer)
  }, [attempt, phaseOneVisual])

  useEffect(() => {
    if (attempt?.projection.stage === 'branch_selection' && attempt.projection.centrifuged && initialCentrifugeVisual === 'idle' && !branchSelectionPending) {
      const timer = window.setTimeout(() => setInitialCentrifugeVisual('complete'), 0)
      return () => window.clearTimeout(timer)
    }
  }, [attempt, initialCentrifugeVisual, branchSelectionPending])

  useEffect(() => {
    if (attempt?.projection.activeBranch !== null) {
      const timer = window.setTimeout(() => setBranchSelectionPending(false), 0)
      return () => window.clearTimeout(timer)
    }
  }, [attempt])

  useEffect(() => {
    const next = phaseOneVisual === 'trays' ? ['loading-trays', 650] as const
      : phaseOneVisual === 'loading-trays' ? ['prepared', 2300] as const
        : phaseOneVisual === 'water-rising' ? ['pouring', 1800] as const
          : phaseOneVisual === 'pouring' ? ['mixing', 2600] as const
            : null
    if (!next) return
    const timer = window.setTimeout(() => setPhaseOneVisual(next[0]), next[1])
    return () => window.clearTimeout(timer)
  }, [phaseOneVisual])

  useEffect(() => {
    if (!waterSeparationRunning) return
    const timer = window.setTimeout(() => setWaterSeparationRunning(false), 8_800)
    return () => window.clearTimeout(timer)
  }, [waterSeparationRunning])

  useEffect(() => {
    const next = initialCentrifugeVisual === 'loading' ? ['spinning', 1_250] as const
      : initialCentrifugeVisual === 'spinning' ? ['transferring', 3_000] as const
        : initialCentrifugeVisual === 'transferring' ? ['complete', 2_000] as const
          : null
    if (!next) return
    const timer = window.setTimeout(() => setInitialCentrifugeVisual(next[0]), next[1])
    return () => window.clearTimeout(timer)
  }, [initialCentrifugeVisual])

  useEffect(() => {
    const next = branchSeparationVisual === 'mixing' ? ['separating', 1_800] as const
      : branchSeparationVisual === 'separating' ? ['ready', 8_500] as const
        : null
    if (!next) return
    const timer = window.setTimeout(() => setBranchSeparationVisual(next[0]), next[1])
    return () => window.clearTimeout(timer)
  }, [branchSeparationVisual])

  // Summary tray stagger animation: fire when stage becomes 'summary'
  useEffect(() => {
    if (attempt?.projection.stage === 'summary' && summaryTrayState === 'hidden') {
      const timer = window.setTimeout(() => {
        setSummaryTrayState('animating')
        setSummaryVisibleCount(0)
      }, 0)
      return () => window.clearTimeout(timer)
    }
  }, [attempt, summaryTrayState])

  useEffect(() => {
    if (summaryTrayState !== 'animating') return
    if (summaryVisibleCount >= 6) {
      const timer = window.setTimeout(() => setSummaryTrayState('visible'), 0)
      return () => window.clearTimeout(timer)
    }
    const timer = window.setTimeout(() => setSummaryVisibleCount((n) => n + 1), 160)
    return () => window.clearTimeout(timer)
  }, [summaryTrayState, summaryVisibleCount])

  // Initialize session and load attempt if specified
  useEffect(() => {
    let cancelled = false
    async function init() {
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
      } catch (err: unknown) {
        if (!cancelled) {
          setLoadState('error')
          setErrorMessage(err instanceof Error ? err.message : 'Không thể kết nối đến phiên thực hành.')
        }
      }
    }

    void init()
    return () => {
      cancelled = true
    }
  }, [attemptId, session])

  // Start fresh attempt handler (from hero entry button)
  const handleStartSession = useCallback(async () => {
    if (isPending) return
    setErrorMessage(null)
    startTransition(async () => {
      try {
        const fresh = await session.start()
        setAttempt(fresh)
        setLoadState('ready')
        router.replace(`/simulate/plastic-density-separation?attempt=${fresh.attemptId}`, { scroll: false })
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : 'Không thể khởi tạo phiên thực hành.')
      }
    })
  }, [session, router, isPending])


  // Action dispatcher
  const dispatchAction = useCallback(
    async (actionType: string, parameters: Record<string, number | string | boolean> = {}, cueMessage?: string) => {
      if (!attempt) return
      setErrorMessage(null)

      startTransition(async () => {
        try {
          const res = await session.apply(attempt.attemptId, actionType, parameters)
          if (res.ok) {
            setAttempt(res.state)
            if (cueMessage) {
              const cueId = `cue-${Date.now()}`
              setActiveCue({ id: cueId, actionType, message: cueMessage })
              setTimeout(() => {
                setActiveCue((current) => (current?.id === cueId ? null : current))
              }, 4000)
            }
          } else {
            if ('error' in res && res.error) {
              setErrorMessage(`Thao tác không hợp lệ: ${res.error.code}`)
            } else if ('outcome' in res) {
              setErrorMessage(`Không thể thực hiện: ${res.outcome}`)
            }
          }
        } catch (err: unknown) {
          setErrorMessage(err instanceof Error ? err.message : 'Lỗi khi gửi hành động.')
        }
      })
    },
    [session, attempt],
  )

  // Complete attempt
  const handleComplete = useCallback(async () => {
    if (!attempt) return
    setErrorMessage(null)

    startTransition(async () => {
      try {
        const res = await session.complete(attempt.attemptId)
        if (res.ok) {
          setAttempt(res.state)
          setIsReportOpen(true)
        } else {
          setErrorMessage('Chưa thể hoàn thành lượt: vui lòng kiểm tra lại các bước.')
        }
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : 'Lỗi khi hoàn tất lượt.')
      }
    })
  }, [session, attempt])

  // Reset attempt
  const handleReset = useCallback(async () => {
    setResetModalOpen(false)
    setErrorMessage(null)

    startTransition(async () => {
      try {
        const fresh = await session.start()
        setAttempt(fresh)
        setLoadState('ready')
        setSelectedPolymerId(null)
        setActiveCue(null)
        setIsReportOpen(false)
        setPhaseOneVisual('idle')
        setWaterSeparationRunning(false)
        setInitialCentrifugeVisual('idle')
        setBranchSeparationVisual('idle')
        setBranchSelectionPending(false)
        setSummaryTrayState('hidden')
        setSummaryVisibleCount(0)
        router.replace(`/simulate/plastic-density-separation?attempt=${fresh.attemptId}`)
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : 'Lỗi khi đặt lại lượt.')
      }
    })
  }, [session, router])

  const ready = loadState === 'ready' && !!attempt
  const projection = attempt?.projection ?? null
  const initialCentrifugeActive = projection ? projection.stage === 'branch_selection' && initialCentrifugeVisual !== 'idle' : false
  const branchSeparationActive = projection ? projection.pendingCentrifugation && branchSeparationVisual !== 'idle' : false
  const isBranchView =
    projection !== null &&
    projection.activeBranch !== null &&
    (projection.stage === 'ethanol_branch' ||
      projection.stage === 'nacl_branch' ||
      (projection.stage === 'centrifugation' && projection.pendingCentrifugation))
  const visibleShelfPolymers = isBranchView && projection
    ? VIRGIN_POLYMERS.filter((polymer) =>
        projection.activeBranch === 'light' ? polymer.id === 'PP' || polymer.id === 'HDPE' : ['PS', 'ABS', 'PA', 'PC'].includes(polymer.id),
      )
    : VIRGIN_POLYMERS
  const handlePrepareSamples = () => {
    setPhaseOneVisual('trays')
    void dispatchAction('prepare_samples', {}, 'Đã chuẩn bị sáu mẫu polymer nguyên sinh theo điều kiện nghiên cứu')
  }
  const handleLoadAndWet = () => {
    setTankParticleSeed(Math.random())
    setPhaseOneVisual('water-rising')
    void dispatchAction('load_and_wet', {}, 'Đã nạp mẫu và ghi nhận điều kiện làm ướt 160 rpm trong 1 giờ')
  }
  const handleSeparateWater = () => {
    setWaterSeparationRunning(true)
    void dispatchAction(
      'separate_water',
      {},
      'Tách nước thành công: PP và HDPE nổi (thu hồi 97,5%), nhóm nặng chìm đáy',
    )
  }
  const handleInitialCentrifuge = () => {
    setInitialCentrifugeVisual('loading')
    void dispatchAction(
      'centrifuge_and_weigh',
      {},
      'Đưa phân đoạn PP + HDPE vào máy ly tâm 2.950 rpm; sau đó chuyển mẫu sang cân',
    )
  }
  const handleBranchPreset = (
    actionType: string,
    parameters: Record<string, number | string | boolean>,
    cueMessage: string,
  ) => {
    setTankParticleSeed(Math.random())
    setInitialCentrifugeVisual('idle')
    setBranchSeparationVisual('mixing')
    void dispatchAction(actionType, parameters, cueMessage)
  }
  const branchPresetLocked = isPending || (projection ? projection.pendingCentrifugation : false) || branchSeparationVisual === 'mixing' || branchSeparationVisual === 'separating'
  const branchIntroActive =
    projection !== null &&
    projection.activeBranch !== null &&
    (projection.stage === 'ethanol_branch' || projection.stage === 'nacl_branch') &&
    phaseOneVisual !== 'mixing'

  return (
    <div ref={root} className={styles.workbenchContainer}>
      {/* Header bar with breadcrumbs and views */}
      <header className={styles.headerBar} data-workbench-area="header">
        <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
          <Link href="/" className={styles.breadcrumbLink}>
            Trang chủ
          </Link>
          <span className={styles.breadcrumbSeparator}>/</span>
          <Link href="/experiments" className={styles.breadcrumbLink}>
            Thí nghiệm
          </Link>
          <span className={styles.breadcrumbSeparator}>/</span>
          <Link href="/experiments/plastic-density-separation" className={styles.breadcrumbLink}>
            Phân loại nhựa nguyên sinh
          </Link>
          <span className={styles.breadcrumbSeparator}>/</span>
          <span className={styles.breadcrumbCurrent}>Bàn thí nghiệm</span>
        </nav>

        <div className={styles.headerGoal}>
          <TargetIcon />
          <span><strong>Mục tiêu:</strong> Thu hồi PP 95,6% · HDPE 99,7%</span>
          <span className={styles.headerGoalDivider}>|</span>
          <span><strong>Quy mô:</strong> Bể pilot 800 L · 6 polymer (12 kg)</span>
        </div>

        <div className={styles.headerActions}>
          <div className={styles.viewButtonGroup} role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activePane === 'simulation'}
              className={`${styles.viewButton} ${activePane === 'simulation' ? styles.viewButtonActive : ''}`}
              onClick={() => setActivePane('simulation')}
            >
              Bàn thí nghiệm
            </button>
            <button
              type="button"
              role="tab"
              data-workbench-area="notebook"
              aria-selected={activePane === 'notebook'}
              className={`${styles.viewButton} ${activePane === 'notebook' ? styles.viewButtonActive : ''}`}
              onClick={() => setActivePane('notebook')}
            >
              Sổ thực hành
            </button>
          </div>

          {attempt && attempt.status === 'completed' && (
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() => setIsReportOpen(true)}
            >
              Xem báo cáo
            </button>
          )}

          {attempt && (
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() => setResetModalOpen(true)}
              title="Bắt đầu lại mẻ thí nghiệm"
            >
              Làm lại
            </button>
          )}
        </div>
      </header>

      {/* Error message notification if any */}
      {errorMessage && (
        <div className={styles.conflictAlert} style={{ borderColor: 'var(--bad)', background: '#fef2f2', color: '#991b1b' }}>
          <div>❌</div>
          <div>{errorMessage}</div>
        </div>
      )}

      {/* Main View Switch */}
      {activePane === 'notebook' ? (
        <div data-workbench-area="notebook">
          {!ready || !projection ? (
            <p className={styles.notebookTeaser}>Sổ thực hành sẽ hiển thị số liệu sau khi bắt đầu lượt.</p>
          ) : (
            <PlasticNotebook projection={projection} />
          )}
        </div>
      ) : (
        <div className={styles.workbenchGrid}>
          <aside className={styles.materialShelf} data-workbench-area="shelf" aria-label="Mẫu và dụng cụ">
            <h2>Mẫu & dụng cụ</h2>
            <div className={styles.materialList}>
              {visibleShelfPolymers.map((polymer) => (
                <button
                  type="button"
                  key={polymer.id}
                  className={`${styles.materialCard} ${selectedPolymerId === polymer.id ? styles.materialCardSelected : ''}`}
                  onClick={() => {
                    setSelectedPolymerId(polymer.id)
                    setEquipmentItem(polymer.id.toLowerCase() as PlasticItemKind)
                  }}
                  aria-label={`Mẫu ${polymer.id}: ${polymer.nominalDensity}, ${polymer.formVi}. Nhấn để xem chi tiết.`}
                >
                  <div className={styles.materialCardMain}>
                    <span className={styles.materialSwatch} style={{ backgroundColor: polymer.colorHex }} />
                    <div className={styles.materialCardBody}>
                      <div className={styles.materialCardHeader}>
                        <strong className={styles.materialName}>{polymer.id}</strong>
                        <span className={styles.materialDensity}>{polymer.nominalDensity}</span>
                      </div>
                      <span className={styles.materialForm}>{polymer.formVi}</span>
                    </div>
                  </div>
                  <span className={styles.materialCardAction} aria-hidden="true" title="Xem ảnh thật & thông số">
                    <InfoIcon />
                  </span>
                </button>
              ))}
            </div>
            <p className={styles.materialNote}>Mỗi mẫu nguyên sinh: 2,0 kg theo nghiên cứu pilot.</p>
            <PlasticEquipmentShelf onSelectEquipment={(kind) => setEquipmentItem(kind)} />
            <div className={styles.shelfHelp}>
              <p className={styles.shelfNote}>Mẫu pilot 2,0 kg/loại polymer. Dữ liệu mẻ thực hành lưu trên trình duyệt.</p>
              <button
                ref={tourTrigger}
                type="button"
                className={styles.guideButton}
                onClick={() => {
                  setTourStep(0)
                  setTourOpen(true)
                }}
              >
                <GuideIcon />
                <span>Hướng dẫn thao tác</span>
              </button>
              <Link
                className={styles.theoryLink}
                href="/experiments/plastic-density-separation/guide"
                target="_blank"
                rel="noopener noreferrer"
              >
                <TheoryIcon />
                <span>Lý thuyết & cách làm bài</span>
              </Link>
              <details className={styles.shelfSources}>
                <summary>
                  <SourcesIcon />
                  <span>Nguồn & giới hạn</span>
                </summary>
                <p>Nghiên cứu pilot quy mô 800 L của Meneses Quelal và cộng sự (2022). Tỷ lệ thu hồi qua cân bằng khối lượng, không biểu thị độ tinh khiết hóa học.</p>
                <a
                  href="https://doi.org/10.1007/s11356-021-15611-w"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Bài báo Meneses Quelal et al. (2022) — mở tab mới <ArrowRightIcon />
                </a>
                <p>Không suy liều hoặc thiết kế dây chuyền thực tế từ mô hình này.</p>
              </details>
            </div>
          </aside>

          <div className={styles.centerColumn} data-workbench-area="simulation">
            <div className={styles.stageHeading}>
              <div><h2>Khu vực thực hành</h2><p>Phân loại nhựa nguyên sinh · 6 polymer</p></div>
              <ol className={styles.processSteps} aria-label="Quy trình phân loại nhựa">
                {['Chuẩn bị', 'Tách nước', 'Ly tâm & cân', 'Phân loại dung dịch', 'Kết quả'].map((label, index) => {
                  const branchSorting = branchSeparationVisual === 'mixing' || branchSeparationVisual === 'separating'
                  const activeIndex = !projection ? -1 : projection.stage === 'preparation' ? 0 : projection.stage === 'wetting' ? (phaseOneVisual === 'mixing' ? 1 : 0) : projection.stage === 'water_separation' || (projection.stage === 'centrifugation' && waterSeparationRunning) ? 1 : projection.stage === 'branch_selection' ? initialCentrifugeVisual === 'complete' ? 3 : 2 : branchSorting ? 3 : projection.stage === 'centrifugation' ? 2 : projection.stage === 'ethanol_branch' || projection.stage === 'nacl_branch' ? 3 : 4
                  return <li key={label} aria-current={ready && index === activeIndex ? 'step' : undefined}><span>{index + 1}</span>{label}</li>
                })}
              </ol>
            </div>
            {/* Center Column: Hero entry when not ready, summary scene when completed/summary, apparatus card when running */}
            {!ready || !projection ? (
              <div className={styles.entry}>
                {loadState === 'idle' && (
                  <>
                    <EquipmentArtPlastic />
                    <h2 className={styles.entryTitle}>Phân loại nhựa nguyên sinh bằng tỷ trọng</h2>
                    <p className={styles.entryDesc}>
                      Phân loại 6 loại polymer nguyên sinh (PP, HDPE, PS, ABS, PA, PC) dựa trên sự khác biệt khối lượng riêng qua các môi trường nước máy, dung dịch ethanol và dung dịch muối NaCl theo nghiên cứu Meneses Quelal et al. (2022).
                    </p>
                    <p className={styles.entryMuted}>
                      Quy mô bể pilot 800 L, khuấy 160 rpm trong 1 giờ, rotor ly tâm tách ẩm 2.950 rpm. Lượt thực hành chỉ lưu trong trình duyệt của bạn.
                    </p>
                    <button
                      type="button"
                      className={styles.entryStartBtn}
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
                    <h2 className={styles.entryTitle}>Không tìm thấy lượt thí nghiệm</h2>
                    <p className={styles.entryDesc}>Liên kết không hợp lệ hoặc lượt không còn tồn tại. Dữ liệu hiện có được giữ nguyên.</p>
                    <Link className={styles.entryStartBtn} href="/simulate/plastic-density-separation">Về màn bắt đầu</Link>
                  </div>
                )}
                {loadState === 'error' && (
                  <div role="alert" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <h2 className={styles.entryTitle}>Chưa thể mở lượt thực hành</h2>
                    <p className={styles.entryDesc}>{errorMessage ?? 'Lỗi kết nối bộ lưu trữ.'}</p>
                    <button type="button" className={styles.entryStartBtn} onClick={() => void handleStartSession()}>Tạo lượt mới</button>
                  </div>
                )}
              </div>
            ) : projection.stage === 'summary' ? (
              <div className={styles.summaryScene}>
                <div className={styles.summarySceneHeader}>
                <div className={styles.summarySceneIcon}>✅</div>
                <div>
                  <div className={styles.summarySceneTitle}>Kết quả phân loại hoàn tất</div>
                  <div className={styles.summarySceneSubtitle}>Sáu polymer nguyên sinh đã được phân tách theo bài báo Meneses Quelal et al. (2022)</div>
                </div>
              </div>

              <div className={styles.summaryFlowBadges}>
                {[
                  { label: 'Nước máy', ok: projection.outcomesHistory.some((o) => o.kind === 'water') },
                  { label: 'Ethanol 23 & 31% v/v', ok: projection.ethanolProgress === 2 },
                  { label: 'NaCl 11–12, 20 & 40% w/v', ok: projection.naclProgress === 3 },
                ].map(({ label, ok }) => (
                  <span key={label} className={ok ? styles.summaryFlowBadgeOk : styles.summaryFlowBadgePending}>
                    {ok ? '✓' : '…'} {label}
                  </span>
                ))}
              </div>

              <div className={styles.summaryTrayGrid}>
                {VIRGIN_POLYMERS.map((polymer, idx) => {
                  const fraction = projection.collectedFractions.find((f) => f.polymerId === polymer.id)
                  const polymerVis = projection.polymers.find((p) => p.id === polymer.id)
                  const recoveryPct = polymerVis?.recoveryPercent ?? null
                  const massKg = recoveryPct !== null ? (2.0 * recoveryPct / 100).toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'
                  const mediumLabel = fraction?.mediumUsed ?? (
                    polymer.id === 'PP' || polymer.id === 'HDPE' ? 'Ethanol' : 'NaCl'
                  )
                  const isVisible = summaryVisibleCount > idx || summaryTrayState === 'visible'
                  return (
                    <div
                      key={polymer.id}
                      className={`${styles.summaryTray} ${isVisible ? styles.summaryTrayVisible : ''}`}
                      style={{ '--tray-color': polymer.colorHex, '--tray-stroke': polymer.strokeHex } as React.CSSProperties}
                    >
                      <div className={styles.summaryTrayParticles}>
                        {Array.from({ length: 9 }).map((_, i) => {
                          const shapes: Record<string, string> = {
                            pellet: 'ellipse',
                            sphere: 'circle',
                            rectangle: 'rect',
                            cylinder: 'ellipse',
                          }
                          const shape = shapes[polymer.particleShape] ?? 'circle'
                          const col = i % 3
                          const row = Math.floor(i / 3)
                          const cx = 16 + col * 20
                          const cy = 14 + row * 18
                          return (
                            <svg key={i} width="72" height="66" viewBox="0 0 72 66" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                              {shape === 'circle' && (
                                <circle cx={cx} cy={cy} r={7} fill={polymer.colorHex} stroke={polymer.strokeHex} strokeWidth="1" opacity={0.82 - i * 0.02} />
                              )}
                              {shape === 'ellipse' && (
                                <ellipse cx={cx} cy={cy} rx={8} ry={5} fill={polymer.colorHex} stroke={polymer.strokeHex} strokeWidth="1" opacity={0.82 - i * 0.02} />
                              )}
                              {shape === 'rect' && (
                                <rect x={cx - 7} y={cy - 4.5} width={14} height={9} rx={2} fill={polymer.colorHex} stroke={polymer.strokeHex} strokeWidth="1" opacity={0.82 - i * 0.02} />
                              )}
                            </svg>
                          )
                        })}
                      </div>
                      <div className={styles.summaryTrayLabel}>
                        <strong>{polymer.id}</strong>
                        <small>{polymer.nominalDensity}</small>
                      </div>
                      <div className={styles.summaryTrayMeta}>
                        <span className={styles.summaryTrayMedium}>{mediumLabel}</span>
                        {recoveryPct !== null && (
                          <span className={styles.summaryTrayRecovery}>
                            {recoveryPct.toLocaleString('vi-VN')}%
                          </span>
                        )}
                      </div>
                      <div className={styles.summaryTrayMass}>
                        ≈ {massKg} kg thu hồi
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
          <div className={styles.apparatusCard}>
            <PlasticSeparationApparatus
              projection={projection}
              phaseOneVisual={phaseOneVisual}
              centrifugeVisual={initialCentrifugeVisual}
              branchSeparationVisual={branchSeparationVisual}
              tankParticleSeed={tankParticleSeed}
              onSelectPolymer={(id) => setSelectedPolymerId(id === selectedPolymerId ? null : id)}
              selectedPolymerId={selectedPolymerId}
              activeCue={activeCue}
            />

            {/* Apparatus Telemetry Bar */}
            <div className={styles.apparatusTelemetry}>
              <div className={styles.telemetryItem}>
                <span className={styles.telemetryLabel}>{initialCentrifugeVisual !== 'idle' && projection.stage === 'branch_selection' ? 'Thiết bị' : isBranchView ? 'Bình phân tách' : 'Bể pilot'}</span>
                <span className={styles.telemetryValue}>
                  {initialCentrifugeVisual !== 'idle' && projection.stage === 'branch_selection'
                    ? 'Máy ly tâm · rotor 2.950 rpm'
                    : isBranchView
                    ? projection.activeBranch === 'light'
                      ? 'Bể pilot 800 L · Ethanol'
                      : 'Bể pilot 800 L · NaCl'
                    : '800 L'}
                </span>
              </div>
              <div className={styles.telemetryItem}>
                <span className={styles.telemetryLabel}>{initialCentrifugeVisual !== 'idle' && projection.stage === 'branch_selection' ? 'Trạng thái' : isBranchView ? 'Môi trường' : 'Cánh khuấy'}</span>
                <span className={styles.telemetryValue}>
                  {initialCentrifugeVisual !== 'idle' && projection.stage === 'branch_selection'
                    ? initialCentrifugeVisual === 'complete' ? 'Đã cân mẫu' : 'Đang ly tâm & cân'
                    : isBranchView
                    ? projection.activeBranch === 'light'
                      ? 'Ethanol · 23 / 31% v/v'
                      : 'NaCl · 11–12 / 20 / 40% w/v'
                    : projection.stage === 'wetting'
                    ? '160 rpm · bước làm ướt'
                    : activeCue?.actionType.startsWith('run_')
                      ? '160 rpm · bước tách'
                      : '160 rpm · điều kiện bài báo'}
                </span>
              </div>
              <div className={styles.telemetryItem}>
                <span className={styles.telemetryLabel}>Máy ly tâm</span>
                <span className={styles.telemetryValue}>2.950 rpm</span>
              </div>
              <div className={styles.telemetryItem}>
                <span className={styles.telemetryLabel}>
                  {initialCentrifugeActive && initialCentrifugeVisual !== 'complete'
                    ? 'Khối lượng phân đoạn'
                    : projection.weighedFractions.PA && projection.weighedFractions.PC
                    ? 'Khối lượng từng phân đoạn'
                    : projection.weighedMassKg === null ? 'Khối lượng cấp liệu' : 'Khối lượng quy đổi'}
                </span>
                <span className={styles.telemetryValue}>
                  {initialCentrifugeActive && initialCentrifugeVisual !== 'complete'
                    ? 'Đang xử lý mẫu…'
                    : projection.weighedFractions.PA && projection.weighedFractions.PC
                    ? `PA ≈ ${projection.weighedFractions.PA.massKg.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg · PC ≈ ${projection.weighedFractions.PC.massKg.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg`
                    : projection.weighedMassKg === null
                      ? '2,0 kg / polymer'
                      : `≈ ${projection.weighedMassKg.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg`}
                </span>
              </div>
            </div>
          </div>
          )}
          </div>

          {/* Right Column: Guidance & Stepper Control Panels */}
          <div className={styles.controlsPanel} data-workbench-area="controls">
            {!ready || !projection ? (
              <>
                <div className={styles.promptCard}>
                  <div className={styles.promptEyebrow}>HƯỚNG DẪN THỰC HÀNH</div>
                  <div className={styles.promptBody}>
                    Bấm “Bắt đầu thí nghiệm Phân loại nhựa” ở khu vực thực hành để khởi tạo mẻ pilot mới và mở các bước thao tác.
                  </div>
                </div>
                <p className={styles.empty}>Bắt đầu lượt để chuẩn bị mẫu 6 polymer và nạp vào bể pilot 800 L.</p>
              </>
            ) : (
              <>
                {/* Context Prompt Card */}
                <div className={styles.promptCard}>
                  <div className={styles.promptEyebrow}>HƯỚNG DẪN THỰC HÀNH</div>
                  <div className={styles.promptBody}>
                    {initialCentrifugeActive && initialCentrifugeVisual !== 'complete'
                      ? initialCentrifugeVisual === 'spinning'
                        ? 'Mẫu PP + HDPE đang quay trong máy ly tâm ở 2.950 rpm. Chờ hết chu trình mô phỏng.'
                        : initialCentrifugeVisual === 'transferring'
                          ? 'Mẫu đã ly tâm; đang chuyển hạt vào khay cân để đọc khối lượng và hiệu suất thu hồi.'
                          : 'Đang đưa phân đoạn PP + HDPE từ bể sang rotor máy ly tâm.'
                      : projection.nextPromptVi}
                  </div>
                </div>

            {/* Step 1: Preparation & Wetting */}
            <div className={styles.stepGroup}>
              <div className={styles.stepHeader}>
                <div className={styles.stepTitleBlock}>
                  <span
                    className={`${styles.stepNumber} ${
                      projection.wetted && phaseOneVisual === 'mixing' ? styles.stepNumberDone : styles.stepNumberActive
                    }`}
                  >
                    {projection.wetted && phaseOneVisual === 'mixing' ? '✓' : '1'}
                  </span>
                  <div>
                    <div className={styles.stepTitle}>1. Chuẩn bị mẫu & Làm ướt bể pilot</div>
                    <div className={styles.stepSubtitle}>
                  {projection.wetted && phaseOneVisual === 'mixing'
                    ? 'Đã nạp mẫu và ghi nhận điều kiện làm ướt (160 rpm · 1 giờ)'
                    : projection.wetted
                      ? phaseOneVisual === 'water-rising'
                        ? 'Nước đang dâng lên trong bể pilot…'
                        : phaseOneVisual === 'pouring'
                          ? 'Các mẫu polymer đang được đổ vào bể…'
                          : 'Đang hoàn tất bước làm ướt…'
                    : projection.samplesPrepared
                      ? 'Sáu mẫu nguyên sinh đã chuẩn bị theo Table 1'
                      : 'Sáu polymer nguyên sinh · 2,0 kg mỗi mẫu'}
                    </div>
                  </div>
                </div>
              </div>

              {!projection.samplesPrepared && !projection.wetted && (
                <div className={styles.stepBody}>
                  <p style={{ fontSize: '0.875rem', marginBottom: '0.75rem', color: 'var(--ink)' }}>
                    Bắt đầu từ sáu loại nhựa nguyên sinh trong nghiên cứu: PP, HDPE, PS, ABS, PA và PC. Mỗi polymer được cấp 2,0 kg; hình dạng, kích thước và khối lượng riêng được trình bày trên khay mẫu.
                  </p>
                  <button
                    type="button"
                    className={styles.actionBtn}
                    disabled={isPending || phaseOneVisual === 'trays' || phaseOneVisual === 'loading-trays'}
                    onClick={handlePrepareSamples}
                  >
                    Chuẩn bị 6 mẫu polymer
                  </button>
                </div>
              )}

              {projection.samplesPrepared && !projection.wetted && (
                <div className={styles.stepBody}>
                  <p style={{ fontSize: '0.875rem', marginBottom: '0.75rem', color: 'var(--ink)' }}>
                    Nạp 2,0 kg mỗi polymer vào bể pilot có thể tích hữu ích 800 L, trộn với nước máy và khuấy 160 rpm trong 1 giờ để làm ướt mẫu, tránh hình thành bọt khí. Mô phỏng ghi nhận điều kiện này mà không chạy bộ đếm thời gian.
                  </p>
                  <button
                    type="button"
                    className={styles.actionBtn}
                    disabled={isPending || phaseOneVisual !== 'prepared'}
                    onClick={handleLoadAndWet}
                  >
                    Nạp mẫu & ghi nhận bước làm ướt
                  </button>
                </div>
              )}
            </div>

            {/* Step 2: Water Separation */}
            <div className={styles.stepGroup}>
              <div className={styles.stepHeader}>
                <div className={styles.stepTitleBlock}>
                  <span
                    className={`${styles.stepNumber} ${
                      projection.waterSeparated && !waterSeparationRunning
                        ? styles.stepNumberDone
                        : projection.wetted && phaseOneVisual === 'mixing'
                          ? styles.stepNumberActive
                          : ''
                    }`}
                  >
                    {projection.waterSeparated && !waterSeparationRunning ? '✓' : '2'}
                  </span>
                  <div>
                    <div className={styles.stepTitle}>2. Tách sơ bộ bằng nước máy</div>
                    <div className={styles.stepSubtitle}>
                      {waterSeparationRunning
                        ? 'Các hạt PP và HDPE đang nổi lên; PS, ABS, PA và PC đang chìm xuống…'
                        : projection.waterSeparated
                          ? 'Đã tách: PP+HDPE nổi (97,5%) · PS+ABS+PA+PC chìm'
                        : 'Phân lớp tự nhiên theo khối lượng riêng trong nước'}
                    </div>
                  </div>
                </div>
              </div>

              {projection.wetted && !projection.waterSeparated && (
                <div className={styles.stepBody}>
                  <p style={{ fontSize: '0.875rem', marginBottom: '0.75rem', color: 'var(--ink)' }}>
                    Theo kết quả bước tách bằng nước trong bài báo, PP và HDPE thuộc phân đoạn nổi; PS, ABS, PA và PC thuộc phân đoạn chìm. Tỷ lệ thu hồi 97,5% được báo cáo cho nhóm PP + HDPE.
                  </p>
                  <button
                    type="button"
                    className={styles.actionBtn}
                    disabled={isPending || phaseOneVisual !== 'mixing'}
                    onClick={handleSeparateWater}
                  >
                    Ghi nhận tách sơ bộ trong nước
                  </button>
                </div>
              )}
            </div>

            {/* Step 3: Centrifuge & Weigh */}
            <div className={styles.stepGroup}>
              <div className={styles.stepHeader}>
                <div className={styles.stepTitleBlock}>
                  <span
                    className={`${styles.stepNumber} ${
                      projection.centrifuged && !projection.pendingCentrifugation && !(projection.stage === 'branch_selection' && initialCentrifugeVisual !== 'complete')
                        ? styles.stepNumberDone
                        : projection.waterSeparated && !waterSeparationRunning
                          ? styles.stepNumberActive
                          : ''
                    }`}
                  >
                    {projection.centrifuged && !projection.pendingCentrifugation ? '✓' : '3'}
                  </span>
                  <div>
                    <div className={styles.stepTitle}>3. Ly tâm & Cân khối lượng</div>
                    <div className={styles.stepSubtitle}>
                      {initialCentrifugeActive && initialCentrifugeVisual === 'loading'
                        ? 'Đang chuyển phân đoạn PP + HDPE vào rotor…'
                        : initialCentrifugeActive && initialCentrifugeVisual === 'spinning'
                          ? 'Đang ly tâm ở 2.950 rpm · mô phỏng 3 giây…'
                          : initialCentrifugeActive && initialCentrifugeVisual === 'transferring'
                            ? 'Đang đưa hạt vào khay cân…'
                        : initialCentrifugeActive && initialCentrifugeVisual === 'complete'
                              ? `Đã cân PP + HDPE · thu hồi ${projection.weighedRecoveryPercent?.toLocaleString('vi-VN') ?? '—'}%`
                              : projection.pendingCentrifugation
                                ? 'Cần ghi nhận ly tâm phân đoạn ở 2.950 rpm'
                                : projection.centrifuged
                                  ? 'Điều kiện nghiên cứu: ly tâm 2.950 rpm sau mỗi giai đoạn tách'
                                  : 'Điều kiện nghiên cứu: ly tâm 2.950 rpm'}
                    </div>
                  </div>
                </div>
              </div>

              {((projection.waterSeparated && !projection.centrifuged && !waterSeparationRunning) || projection.pendingCentrifugation || initialCentrifugeActive) && (
                <div className={styles.stepBody}>
                  <p style={{ fontSize: '0.875rem', marginBottom: '0.75rem', color: 'var(--ink)' }}>
                    {initialCentrifugeActive && initialCentrifugeVisual === 'complete'
                      ? `Khối lượng phân đoạn PP + HDPE: khoảng ${projection.weighedMassKg?.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '—'} kg; hiệu suất thu hồi ${projection.weighedRecoveryPercent?.toLocaleString('vi-VN') ?? '—'}%. Đây là giá trị quy đổi theo bài báo, không phải phép đo mới.`
                      : initialCentrifugeActive
                        ? 'Mẫu đang được chuyển vào rotor, ly tâm rồi đưa sang khay cân. Khối lượng và hiệu suất sẽ hiện khi cân hoàn tất.'
                        : 'Phân đoạn nổi PP + HDPE sẽ được chuyển vào máy ly tâm 2.950 rpm, sau đó đưa sang khay cân. Khối lượng và hiệu suất được quy đổi theo tỷ lệ thu hồi công bố trong bài báo.'}
                  </p>
                  {!initialCentrifugeActive && <button
                    type="button"
                    className={styles.actionBtn}
                    disabled={isPending || (branchSeparationActive && branchSeparationVisual !== 'ready')}
                    onClick={handleInitialCentrifuge}
                  >
                    Ghi nhận ly tâm phân đoạn & Cân mẫu
                  </button>}
                </div>
              )}
            </div>

            {/* Step 4: Branch Selection & Selective Separation */}
            <div className={styles.stepGroup}>
              <div className={styles.stepHeader}>
                <div className={styles.stepTitleBlock}>
                  <span
                    className={`${styles.stepNumber} ${
                      projection.completedBranches.length === 2
                        ? styles.stepNumberDone
                            : projection.centrifuged && (!initialCentrifugeActive || initialCentrifugeVisual === 'complete')
                          ? styles.stepNumberActive
                          : ''
                    }`}
                  >
                    {projection.completedBranches.length === 2 ? '✓' : '4'}
                  </span>
                  <div>
                    <div className={styles.stepTitle}>4. Phân loại theo nhánh dung dịch</div>
                    <div className={styles.stepSubtitle}>
                      {projection.completedBranches.length === 2
                        ? 'Đã hoàn thành cả 2 nhánh (Ethanol & NaCl)'
                        : initialCentrifugeActive && initialCentrifugeVisual !== 'complete'
                          ? 'Chờ hoàn tất ly tâm và cân mẫu'
                        : projection.activeBranch
                          ? branchSeparationActive && branchSeparationVisual === 'mixing'
                            ? `Đang khuấy nhánh ${projection.activeBranch === 'light' ? 'Ethanol' : 'NaCl'} · 160 rpm…`
                            : branchSeparationActive && branchSeparationVisual === 'separating'
                              ? 'Các hạt đang từ từ nổi lên và chìm xuống…'
                              : branchSeparationActive && branchSeparationVisual === 'ready'
                                ? 'Đã ổn định phân đoạn · tiếp tục ly tâm và cân'
                                : `Đang thực hiện nhánh ${projection.activeBranch === 'light' ? 'Ethanol (nhẹ)' : 'NaCl (nặng)'}`
                          : 'Chọn phân đoạn để phân loại tiếp'}
                    </div>
                  </div>
                </div>
              </div>

              {projection.centrifuged && !projection.pendingCentrifugation && projection.stage !== 'summary' && !(projection.stage === 'branch_selection' && initialCentrifugeVisual !== 'complete') && (
                <div className={styles.stepBody}>
                  {/* Branch switcher */}
                  <div className={styles.branchSwitcher}>
                    <button
                      type="button"
                      className={`${styles.secondaryBtn} ${
                        projection.activeBranch === 'light' ? styles.viewButtonActive : ''
                      }`}
                      disabled={isPending}
                      onClick={() => {
                        setBranchSelectionPending(true)
                        setTankParticleSeed(Math.random())
                        setInitialCentrifugeVisual('idle')
                        setBranchSeparationVisual('idle')
                        setPhaseOneVisual('water-rising')
                        dispatchAction('select_branch', { branch: 'light' })
                      }}
                    >
                      Nhánh nhẹ (Ethanol)
                      {projection.completedBranches.includes('light') && ' ✓'}
                    </button>
                    <button
                      type="button"
                      className={`${styles.secondaryBtn} ${
                        projection.activeBranch === 'heavy' ? styles.viewButtonActive : ''
                      }`}
                      disabled={isPending}
                      onClick={() => {
                        setBranchSelectionPending(true)
                        setTankParticleSeed(Math.random())
                        setInitialCentrifugeVisual('idle')
                        setBranchSeparationVisual('idle')
                        setPhaseOneVisual('water-rising')
                        dispatchAction('select_branch', { branch: 'heavy' })
                      }}
                    >
                      Nhánh nặng (NaCl)
                      {projection.completedBranches.includes('heavy') && ' ✓'}
                    </button>
                  </div>

                  {/* Ethanol branch controls */}
                  {projection.activeBranch === 'light' && (
                    <div className={styles.presetGrid}>
                      <div
                        className={`${styles.presetCard} ${
                          projection.ethanolProgress >= 1 ? styles.presetCardActive : ''
                        }`}
                      >
                        <div>
                          <strong>Preset 1: Ethanol 23% v/v</strong>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)' }}>
                            Khuấy 160 rpm · 1 giờ · ly tâm 2.950 rpm. PP nổi, HDPE chìm · Thu hồi PP: 95,60%
                          </div>
                        </div>
                        <button
                          type="button"
                          className={styles.secondaryBtn}
                          disabled={projection.ethanolProgress !== 0 || branchPresetLocked || branchIntroActive}
                          onClick={() =>
                            handleBranchPreset(
                              'run_ethanol_preset',
                              { concentration: 23 },
                              'Ethanol 23% v/v: PP nổi (thu hồi 95,60%), HDPE chìm',
                            )
                          }
                        >
                          {projection.ethanolProgress >= 1 ? 'Đã chạy' : 'Chạy'}
                        </button>
                      </div>

                      <div
                        className={`${styles.presetCard} ${
                          projection.ethanolProgress === 2 ? styles.presetCardActive : ''
                        }`}
                      >
                        <div>
                          <strong>Preset 2: Ethanol 31% v/v</strong>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)' }}>
                            Nạp lại PP cùng phân đoạn HDPE đã cân · Khuấy 160 rpm · 1 giờ. PP nổi hoàn toàn, chỉ cân HDPE · Thu hồi HDPE: 99,70%
                          </div>
                        </div>
                        <button
                          type="button"
                          className={styles.secondaryBtn}
                          disabled={projection.ethanolProgress !== 1 || branchPresetLocked || branchIntroActive}
                          onClick={() =>
                            handleBranchPreset(
                              'run_ethanol_preset',
                              { concentration: 31 },
                              'Ethanol 31%: nạp lại PP + HDPE; PP nổi hoàn toàn, chỉ cân HDPE.',
                            )
                          }
                        >
                          {projection.ethanolProgress === 2 ? 'Đã chạy' : 'Chạy'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* NaCl branch controls */}
                  {projection.activeBranch === 'heavy' && (
                    <div className={styles.presetGrid}>
                      <div
                        className={`${styles.presetCard} ${
                          projection.naclProgress >= 1 ? styles.presetCardActive : ''
                        }`}
                      >
                        <div>
                          <strong>Preset 1: NaCl 11–12% w/v</strong>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)' }}>
                            Khuấy 160 rpm · 1 giờ · ly tâm 2.950 rpm. PS nổi · Thu hồi: 80,3%
                          </div>
                        </div>
                        <button
                          type="button"
                          className={styles.secondaryBtn}
                          disabled={projection.naclProgress !== 0 || branchPresetLocked || branchIntroActive}
                          onClick={() =>
                            handleBranchPreset(
                              'run_nacl_preset',
                              { concentration: 11.5 },
                              'NaCl 11–12% w/v: PS nổi (thu hồi 80,3%), ABS/PA/PC chìm',
                            )
                          }
                        >
                          {projection.naclProgress >= 1 ? 'Đã chạy' : 'Chạy'}
                        </button>
                      </div>

                      <div
                        className={`${styles.presetCard} ${
                          projection.naclProgress >= 2 ? styles.presetCardActive : ''
                        }`}
                      >
                        <div>
                          <strong>Preset 2: NaCl 20% w/v</strong>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)' }}>
                            Khuấy 160 rpm · 1 giờ · ly tâm 2.950 rpm. ABS nổi · Thu hồi: 84,8%
                          </div>
                        </div>
                        <button
                          type="button"
                          className={styles.secondaryBtn}
                          disabled={projection.naclProgress !== 1 || branchPresetLocked || branchIntroActive}
                          onClick={() =>
                            handleBranchPreset(
                              'run_nacl_preset',
                              { concentration: 20 },
                              'NaCl 20% w/v: ABS nổi (thu hồi 84,8%), PA/PC chìm',
                            )
                          }
                        >
                          {projection.naclProgress >= 2 ? 'Đã chạy' : 'Chạy'}
                        </button>
                      </div>

                      <div
                        className={`${styles.presetCard} ${
                          projection.naclProgress === 3 ? styles.presetCardActive : ''
                        }`}
                      >
                        <div>
                          <strong>Preset 3: NaCl 40% w/v</strong>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)' }}>
                            Khuấy 160 rpm · 1 giờ · ly tâm 2.950 rpm. PA nổi (70%) · PC chìm (95,4%)
                          </div>
                        </div>
                        <button
                          type="button"
                          className={styles.secondaryBtn}
                          disabled={projection.naclProgress !== 2 || branchPresetLocked || branchIntroActive}
                          onClick={() =>
                            handleBranchPreset(
                              'run_nacl_preset',
                              { concentration: 40 },
                              'NaCl 40% w/v: PA nổi (thu hồi 70%), PC chìm đáy (thu hồi 95,4%)',
                            )
                          }
                        >
                          {projection.naclProgress === 3 ? 'Đã chạy' : 'Chạy'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Summarize button if at least 1 branch completed */}
                  {projection.completedBranches.length === 2 && !projection.pendingCentrifugation && (
                    <div style={{ marginTop: '1rem' }}>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        onClick={() => dispatchAction('summarize_fractions')}
                      >
                        Xem tổng kết các phân đoạn thu hồi
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Step 5: Summary & Complete */}
            {projection.stage === 'summary' && (
              <div className={styles.stepGroup}>
                <div className={styles.stepHeader}>
                  <div className={styles.stepTitleBlock}>
                    <span className={`${styles.stepNumber} ${styles.stepNumberActive}`}>5</span>
                    <div>
                      <div className={styles.stepTitle}>5. Hoàn tất &amp; Lưu báo cáo</div>
                      <div className={styles.stepSubtitle}>
                        Khóa lượt và ghi nhận kết quả vào cơ sở dữ liệu
                      </div>
                    </div>
                  </div>
                </div>
                <div className={styles.stepBody}>
                  <div className={styles.summaryFlowPath}>
                    <span>💧 Nước máy</span>
                    <span className={styles.summaryArrow}>→</span>
                    <span>🧪 Ethanol</span>
                    <span className={styles.summaryArrow}>→</span>
                    <span>🧂 NaCl</span>
                  </div>
                  <p style={{ fontSize: '0.875rem', marginBottom: '0.75rem', color: 'var(--ink)', marginTop: '0.75rem' }}>
                    Bạn đã hoàn thành cả hai nhánh phân loại. Khay thu hồi hiển thị sáu polymer đã tách. Nhấn hoàn thành để đóng lượt và lưu báo cáo khoa học.
                  </p>
                  <button
                    type="button"
                    className={styles.actionBtn}
                    disabled={isPending}
                    onClick={handleComplete}
                  >
                    Hoàn tất lượt thực hành
                  </button>
                </div>
              </div>
            )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Completion Report Dialog */}
      {isReportOpen && attempt?.report && (
        <PlasticCompletionDialog
          report={attempt.report}
          onClose={() => setIsReportOpen(false)}
          onNewAttempt={handleReset}
        />
      )}

      {/* Reset Confirmation Modal */}
      {resetModalOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalCard} style={{ maxWidth: '420px' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.75rem' }}>
              Xác nhận bắt đầu lại?
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', marginBottom: '1.25rem' }}>
              Thao tác này sẽ tạo một lượt thí nghiệm mới từ bước chuẩn bị mẫu. Dữ liệu hiện tại của bạn sẽ không bị ghi đè.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => setResetModalOpen(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                className={styles.actionBtn}
                onClick={handleReset}
              >
                Bắt đầu lại
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Equipment and Material Real Photo Modal Panel */}
      {equipmentItem && (
        <PlasticEquipmentPanel
          item={equipmentItem}
          onItemChange={setEquipmentItem}
          onClose={() => setEquipmentItem(null)}
        />
      )}

      {/* Workbench Tour (Matching Jar Test exactly) */}
      {tourOpen && (
        <WorkbenchTour
          steps={PLASTIC_WORKBENCH_TOUR}
          root={root}
          step={tourStep}
          onStepChange={setTourStep}
          onClose={() => {
            setTourStep(0)
            setTourOpen(false)
            requestAnimationFrame(() => tourTrigger.current?.focus({ preventScroll: true }))
          }}
        />
      )}
    </div>
  )
}
