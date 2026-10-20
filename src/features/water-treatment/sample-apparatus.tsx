'use client'

import { useId, useRef, useState, useEffect } from 'react'
import { runSampleChemistry, type SampleChemistryResult } from '@/app/simulate/water-treatment/sample-chemistry-action.js'
import { PlayIcon, StopIcon, PlusIcon, ResetIcon, BeakerIcon } from './icons.js'
import styles from './workbench.module.css'

/**
 * Apparatus for Sample Preparation — three buret version for Fe/Zn/Pb solutions.
 *
 * Layout (top → bottom):
 *   • Top support bar carrying three metal-ion burets
 *   • Three 10 mL burets hang from the bar (Fe, Zn, Pb solutions)
 *   • Flat-bottom 2.5 L beaker sitting on a magnetic stirrer hotplate
 *   • Stir bar stays fixed while the liquid and suspended particles move
 *
 * Geometry is qualitative; concentration, dose and buret state are tracked by the
 * session and reflected here.
 */

export type MetalSolution = 'fe' | 'zn' | 'pb'
type DropStepMl = 0.01 | 0.05 | 0.1 | 0.5 | 1
const DROP_STEPS: readonly DropStepMl[] = [0.01, 0.05, 0.1, 0.5, 1]

export type SampleApStatus = {
  pH: number
  targetVolumeMl: number
  stirring: boolean
  feAddedMl: number
  znAddedMl: number
  pbAddedMl: number
}

const BEAKER_CAPACITY_ML = 2500
const BEAKER_LEFT_X = 80
const BEAKER_RIGHT_X = 300
const BEAKER_TOP_Y = 252
const BEAKER_BOTTOM_Y = 425
const BEAKER_HEIGHT = BEAKER_BOTTOM_Y - BEAKER_TOP_Y

const BURET_CAPACITY = 10
const BURET_BODY_TOP = 36
const BURET_BODY_BOTTOM = 240
const BURET_BODY_HEIGHT = BURET_BODY_BOTTOM - BURET_BODY_TOP
const BURET_WIDTH = 22
const BURET_FE_CX = 100
const BURET_ZN_CX = 190
const BURET_PB_CX = 280

const STIRRER_CX = 190

function volumeY(volumeMl: number) {
  const clamped = Math.max(0, Math.min(BEAKER_CAPACITY_ML, volumeMl))
  return BEAKER_BOTTOM_Y - (BEAKER_HEIGHT * clamped) / BEAKER_CAPACITY_ML
}

function buretLiquidTopY(remainingMl: number) {
  const clamped = Math.max(0, Math.min(BURET_CAPACITY, remainingMl))
  return BURET_BODY_BOTTOM - (BURET_BODY_HEIGHT * clamped) / BURET_CAPACITY
}

function buretTickY(ml: number) {
  return BURET_BODY_TOP + (BURET_BODY_HEIGHT * ml) / BURET_CAPACITY
}

const METAL_COLORS = {
  fe: { color: '#F1DFA0', light: '#f8edc9', deep: '#ddc77f', label: 'Fe³⁺', fullLabel: 'Dung dịch FeCl₃' },
  zn: { color: '#F8FAFC', light: '#ffffff', deep: '#e8edf1', label: 'Zn²⁺', fullLabel: 'Dung dịch ZnSO₄' },
  pb: { color: '#F8FAFC', light: '#ffffff', deep: '#e8edf1', label: 'Pb²⁺', fullLabel: 'Dung dịch Pb(NO₃)₂' },
} as const

export type SampleCalculation = Pick<SampleChemistryResult, 'pH' | 'totalVolumeMl' | 'inputMassMg' | 'dissolvedMgL' | 'dissolvedMassMg' | 'precipitateMg' | 'totalPrecipitateMg' | 'diagnostics' | 'database' | 'configuredPhases' | 'convergence' | 'massBalance' | 'engine'>

const PRECIPITATE_GUIDANCE = [
  { label: 'Fe(OH)₃ · nâu đỏ #A56535', ph: 'pH tham khảo 2–4' },
  { label: 'Zn(OH)₂ · trắng #F1F1ED', ph: 'pH tham khảo 7–8,5; có thể tan lại trong kiềm dư' },
  { label: 'Chất rắn chứa Pb · trắng kem #F2EBDD', ph: 'pH phụ thuộc cân bằng; Pb(OH)₂ chỉ là giả định đơn giản' },
] as const

function Buret({
  uid, cx, topY, theme, remainingMl, isDripping, remainingDisplay,
}: {
  uid: string
  cx: number
  topY: number
  theme: (typeof METAL_COLORS)[keyof typeof METAL_COLORS]
  remainingMl: number
  isDripping: boolean
  remainingDisplay: string
}) {
  const leftX = cx - BURET_WIDTH / 2
  const rightX = cx + BURET_WIDTH / 2
  const liqTopY = buretLiquidTopY(remainingMl)
  const empty = remainingMl <= 0
  const fillClipId = uid + 'fill' + cx
  const fillRect = (
    <rect
      x={leftX}
      y={liqTopY}
      width={BURET_WIDTH}
      height={BURET_BODY_BOTTOM - liqTopY}
      fill={theme.color}
    />
  )
  return (
    <g aria-label={theme.fullLabel}>
      <rect x={cx - 8} y={topY - 4} width="16" height="8" rx="1.5" fill="#5d7682" stroke="#2c4654" strokeWidth=".6" />
      <rect x={leftX - 2} y={topY + 4} width={BURET_WIDTH + 4} height="6" fill="#a7bcc8" stroke="#7591a0" strokeWidth=".6" />
      <rect x={cx - 1.5} y={topY + 2} width="3" height="3" fill="#7591a0" />

      <rect
        x={leftX}
        y={BURET_BODY_TOP}
        width={BURET_WIDTH}
        height={BURET_BODY_HEIGHT}
        fill={'url(#' + uid + 'glass)'}
        stroke="#8da9b8"
        strokeWidth="1.4"
      />
      {empty ? null : (
        <g clipPath={'url(#' + fillClipId + ')'}>
          {fillRect}
          <ellipse cx={cx} cy={liqTopY + 1} rx={BURET_WIDTH / 2 - 1} ry="1.5" fill={theme.light} />
          <ellipse cx={cx} cy={liqTopY + 2} rx={BURET_WIDTH / 2 - 2} ry="1" fill={theme.deep} opacity=".75" />
        </g>
      )}

      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((ml) => {
        const y = buretTickY(ml)
        const major = ml % 2 === 0
        return (
          <g key={ml}>
            <line
              x1={rightX}
              x2={rightX + (major ? 7 : 4)}
              y1={y}
              y2={y}
              stroke="#365964"
              strokeWidth={major ? 0.9 : 0.5}
            />
            {major ? <text x={rightX + 9} y={y + 2.5} fontSize="6.5" fill="#365964">{ml}</text> : null}
          </g>
        )
      })}
      <text x={leftX - 1} y={BURET_BODY_TOP - 2} fontSize="6" fill="#365964" textAnchor="end">mL</text>

      <rect x={leftX - 3} y={BURET_BODY_BOTTOM} width={BURET_WIDTH + 6} height="9" rx="1" fill="#456475" stroke="#2c4654" strokeWidth=".6" />
      <circle cx={cx} cy={BURET_BODY_BOTTOM + 4.5} r="3" fill="#2c4654" stroke="#1a2c36" strokeWidth=".4" />
      <line
        x1={cx - 4}
        x2={cx + 4}
        y1={BURET_BODY_BOTTOM + 4.5}
        y2={BURET_BODY_BOTTOM + 4.5}
        stroke="#a7bcc8"
        strokeWidth=".6"
      />

      <path
        d={'M' + (cx - 3) + ' ' + (BURET_BODY_BOTTOM + 9) + ' h6 v18 h-6 Z'}
        fill="#9bb0bc"
        stroke="#365964"
        strokeWidth=".5"
      />
      {empty ? null : (
        <path
          d={'M' + (cx - 1.5) + ' ' + (BURET_BODY_BOTTOM + 11) + ' v14'}
          stroke={theme.color}
          strokeWidth="2"
        />
      )}

      {isDripping && !empty ? (
        <g>
          <path
            d={'M' + cx + ' ' + (BURET_BODY_BOTTOM + 27) + ' v4'}
            stroke={theme.color}
            strokeWidth="2.5"
            strokeLinecap="round"
            className={styles.dripStream}
          />
          <circle cx={cx} cy={BURET_BODY_BOTTOM + 32} r="2.8" fill={theme.color} className={styles.dropFall} />
        </g>
      ) : null}

      <text x={rightX + 6} y={BURET_BODY_TOP + 10} fontSize="6.5" fill="#365964">
        {remainingDisplay}
      </text>
    </g>
  )
}

function DoseStepMenu({
  solution,
  value,
  disabled,
  onChange,
}: {
  solution: MetalSolution
  value: DropStepMl
  disabled: boolean
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const menuId = `dose-step-${solution}`

  return (
    <div className={styles.doseStepMenu}>
      <button
        type="button"
        className={styles.doseStepTrigger}
        aria-label={`Bước thêm ${solution}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
      >
        {value} mL
      </button>
      {open ? (
        <div id={menuId} className={styles.doseStepMenuList} role="listbox" aria-label={`Chọn bước thêm ${solution}`}>
          {DROP_STEPS.map((step) => (
            <button
              type="button"
              role="option"
              aria-selected={step === value}
              className={styles.doseStepOption}
              key={step}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange(String(step))
                setOpen(false)
              }}
            >
              {step} mL
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function SamplePreparationApparatus({
  status: external,
  onAddDrop,
  onToggleStir,
  onReset,
  onCalculate,
  calculation,
}: {
  status?: Partial<SampleApStatus>
  onAddDrop: (solution: MetalSolution, amountMl: DropStepMl) => void
  onToggleStir: () => void
  onReset: () => void
  onCalculate: (result: SampleCalculation) => void
  calculation: SampleCalculation | null
  calculationError?: string | null
}) {
  const reactId = useId()
  const uid = reactId.replace(/:/g, '')
  const initialStatus: SampleApStatus = {
    pH: 7.0,
    targetVolumeMl: 1000,
    stirring: false,
    feAddedMl: 0,
    znAddedMl: 0,
    pbAddedMl: 0,
  }
  const status: SampleApStatus = { ...initialStatus, ...external }
  const waterY = volumeY(status.targetVolumeMl)

  const clampAdded = (n: number) => Math.max(0, Math.min(BURET_CAPACITY, n))
  const feAddedMl = clampAdded(status.feAddedMl)
  const znAddedMl = clampAdded(status.znAddedMl)
  const pbAddedMl = clampAdded(status.pbAddedMl)
  const feRemaining = BURET_CAPACITY - feAddedMl
  const znRemaining = BURET_CAPACITY - znAddedMl
  const pbRemaining = BURET_CAPACITY - pbAddedMl
  const feEmpty = feRemaining <= 0
  const znEmpty = znRemaining <= 0
  const pbEmpty = pbRemaining <= 0
  const hasFe = feAddedMl > 0
  const hasZn = znAddedMl > 0
  const hasPb = pbAddedMl > 0

  const [activeDrop, setActiveDrop] = useState<MetalSolution | null>(null)
  const [hasBeenStirred, setHasBeenStirred] = useState(false)
  const lastAddedRef = useRef({
    fe: status.feAddedMl,
    zn: status.znAddedMl,
    pb: status.pbAddedMl,
  })

  useEffect(() => {
    const prev = lastAddedRef.current
    if (status.feAddedMl !== prev.fe) {
      setActiveDrop('fe')
      setHasBeenStirred(false)
    } else if (status.znAddedMl !== prev.zn) {
      setActiveDrop('zn')
      setHasBeenStirred(false)
    } else if (status.pbAddedMl !== prev.pb) {
      setActiveDrop('pb')
      setHasBeenStirred(false)
    }
    lastAddedRef.current = {
      fe: status.feAddedMl,
      zn: status.znAddedMl,
      pb: status.pbAddedMl,
    }
  }, [status.feAddedMl, status.znAddedMl, status.pbAddedMl])

  useEffect(() => {
    if (!activeDrop) return
    const t = setTimeout(() => setActiveDrop(null), 800)
    return () => clearTimeout(t)
  }, [activeDrop])

  useEffect(() => {
    if (!hasFe && !hasZn && !hasPb) setHasBeenStirred(false)
  }, [hasFe, hasZn, hasPb])

  useEffect(() => {
    if (status.stirring && (hasFe || hasZn || hasPb)) setHasBeenStirred(true)
  }, [status.stirring, hasFe, hasZn, hasPb])

  const mixtureStirred = hasBeenStirred || status.stirring
  const solutionFill = mixtureStirred && hasFe ? '#F1DFA0' : '#F8FAFC'
  const solutionOpacity = mixtureStirred && hasFe ? '.88' : '.72'
  // FeCl3 acidifies the distilled-water sample; the UI represents the mixed pH as the Fe(OH)3 window.
  const mixedPh = hasFe ? Math.min(status.pH, 3.5) : status.pH
  const fePrecipitating = mixtureStirred && hasFe && mixedPh >= 2 && mixedPh <= 4
  const fePrecipitateHeight = fePrecipitating
    ? Math.min(18, 5 + feAddedMl * 2.2)
    : 0
  const feDropX = status.stirring ? STIRRER_CX : BURET_FE_CX

  const [dropSteps, setDropSteps] = useState<Record<MetalSolution, DropStepMl>>({ fe: 1, zn: 1, pb: 1 })
  const setDropStep = (solution: MetalSolution, value: string) => {
    const amount = Number(value) as DropStepMl
    if (DROP_STEPS.includes(amount)) {
      setDropSteps((current) => ({ ...current, [solution]: amount }))
    }
  }

  const totalAddedMl = feAddedMl + znAddedMl + pbAddedMl
  const hasFinishedStirring = hasBeenStirred && !status.stirring
  const [calculationBusy, setCalculationBusy] = useState(false)
  const [localCalculationError, setLocalCalculationError] = useState<string | null>(null)
  const [isCalculated, setIsCalculated] = useState(false)
  
  const calculateSample = async () => {
    if (!hasFinishedStirring || calculationBusy) return
    setCalculationBusy(true)
    setLocalCalculationError(null)
    try {
      const result = await runSampleChemistry({
        targetVolumeMl: status.targetVolumeMl,
        feAddedMl,
        znAddedMl,
        pbAddedMl,
        sourceMgL: 100,
      })
      setIsCalculated(true)
      onCalculate(result)
    } catch (error) {
      setLocalCalculationError(error instanceof Error ? error.message : 'Không thể chạy PHREEQC.')
    } finally {
      setCalculationBusy(false)
    }
  }
  
  // Reset calculated state when user resets the experiment
  useEffect(() => {
    if (!feAddedMl && !znAddedMl && !pbAddedMl) {
      setIsCalculated(false)
    }
  }, [feAddedMl, znAddedMl, pbAddedMl])

  return (
    <div className={styles.apparatus}>
      <div className={styles.apparatusHeader}>
        <div>
          <h2>Bàn pha mẫu nước nhiễm kim loại</h2>
          <p>Máy khuấy từ · 3 buret Fe/Zn/Pb · cốc 2500 mL đế bằng</p>
        </div>
      </div>

      <div
        className={styles.apparatusStage}
        aria-label="Bàn pha mẫu với máy khuấy từ, cốc 2500mL và ba buret Fe, Zn, Pb"
      >
        <div className={styles.volumeModel} aria-label="Mô hình thể tích dung dịch trong cốc">
          <div className={styles.volumeModelHeader}>
            <strong>Thể tích trong cốc</strong>
          </div>
          <div className={styles.volumeModelGrid}>
            <div className={styles.volumeModelRow}>
              <span className={styles.volumeModelLabel}>
                <span className={styles.volumeDot} data-solution="water" />
                Nước cất
              </span>
              <span className={styles.volumeModelValue}>{status.targetVolumeMl} mL</span>
            </div>
            <div className={styles.volumeModelDivider} />
            <div className={styles.volumeModelRow}>
              <span className={styles.volumeModelLabel}>
                <span className={styles.volumeDot} data-solution="fe" />
                FeCl₃
              </span>
              <span className={styles.volumeModelValue}>{feAddedMl} mL</span>
            </div>
            <div className={styles.volumeModelRow}>
              <span className={styles.volumeModelLabel}>
                <span className={styles.volumeDot} data-solution="zn" />
                ZnSO₄
              </span>
              <span className={styles.volumeModelValue}>{znAddedMl} mL</span>
            </div>
            <div className={styles.volumeModelRow}>
              <span className={styles.volumeModelLabel}>
                <span className={styles.volumeDot} data-solution="pb" />
                Pb(NO₃)₂
              </span>
              <span className={styles.volumeModelValue}>{pbAddedMl} mL</span>
            </div>
            <div className={styles.volumeModelDivider} />
            <div className={styles.volumeModelRow}>
              <span className={styles.volumeModelLabel}>
                <span className={styles.volumeDotGray} />
                Tổng 3 chất
              </span>
              <span className={styles.volumeModelValue}>{totalAddedMl} mL</span>
            </div>
            <div className={styles.volumeModelRow} data-total>
              <span className={styles.volumeModelLabel}>
                <span className={styles.volumeDotAccent} />
                Tổng cộng
              </span>
              <span className={styles.volumeModelValue}>{status.targetVolumeMl + totalAddedMl} mL</span>
            </div>
          </div>
        </div>

        <svg
          viewBox="0 0 380 470"
          className={styles.apparatusSvg}
          role="img"
          aria-label="Sơ đồ bàn pha mẫu: ba buret Fe, Zn, Pb treo trên giá, máy khuấy từ dưới đáy cốc, cốc 2500mL đế bằng ở giữa"
        >
          <defs>
            <linearGradient id={uid + 'glass'}>
              <stop offset="0" stopColor="#cedfe8" stopOpacity=".55" />
              <stop offset=".3" stopColor="#fff" stopOpacity=".08" />
              <stop offset=".8" stopColor="#e0edf3" stopOpacity=".12" />
              <stop offset="1" stopColor="#c6dbe5" stopOpacity=".5" />
            </linearGradient>
            <linearGradient id={uid + 'steel'} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#78929f" />
              <stop offset=".4" stopColor="#e9f1f5" />
              <stop offset=".65" stopColor="#bacdd7" />
              <stop offset="1" stopColor="#6f8999" />
            </linearGradient>
            <linearGradient id={uid + 'platform'} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#cfdce4" />
              <stop offset="1" stopColor="#7a8c95" />
            </linearGradient>
            <linearGradient id={uid + 'bar'} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="#b8c7d0" />
              <stop offset=".5" stopColor="#dde8ee" />
              <stop offset="1" stopColor="#b8c7d0" />
            </linearGradient>
            <clipPath id={uid + 'fill' + BURET_FE_CX}>
              <rect
                x={BURET_FE_CX - BURET_WIDTH / 2}
                y={buretLiquidTopY(feRemaining)}
                width={BURET_WIDTH}
                height={BURET_BODY_BOTTOM - buretLiquidTopY(feRemaining)}
              />
            </clipPath>
            <clipPath id={uid + 'fill' + BURET_ZN_CX}>
              <rect
                x={BURET_ZN_CX - BURET_WIDTH / 2}
                y={buretLiquidTopY(znRemaining)}
                width={BURET_WIDTH}
                height={BURET_BODY_BOTTOM - buretLiquidTopY(znRemaining)}
              />
            </clipPath>
            <clipPath id={uid + 'fill' + BURET_PB_CX}>
              <rect
                x={BURET_PB_CX - BURET_WIDTH / 2}
                y={buretLiquidTopY(pbRemaining)}
                width={BURET_WIDTH}
                height={BURET_BODY_BOTTOM - buretLiquidTopY(pbRemaining)}
              />
            </clipPath>
          </defs>

          <rect x="20" y="6" width="340" height="12" rx="2" fill={'url(#' + uid + 'steel)'} />
          <rect x="18" y="6" width="344" height="2" fill="#dde8ee" />

          <rect x={BURET_FE_CX - 36} y="4" width="72" height="14" rx="2" fill={'url(#' + uid + 'bar)'} stroke="#557586" strokeWidth=".6" />
          <text x={BURET_FE_CX} y="14.5" textAnchor="middle" fontSize="8.5" fill="#8a2c20" fontWeight="700">FeCl₃</text>

          <rect x={BURET_ZN_CX - 36} y="4" width="72" height="14" rx="2" fill={'url(#' + uid + 'bar)'} stroke="#557586" strokeWidth=".6" />
          <text x={BURET_ZN_CX} y="14.5" textAnchor="middle" fontSize="8.5" fill="#2d5a3d" fontWeight="700">ZnSO₄</text>

          <rect x={BURET_PB_CX - 38} y="4" width="76" height="14" rx="2" fill={'url(#' + uid + 'bar)'} stroke="#557586" strokeWidth=".6" />
          <text x={BURET_PB_CX} y="14.5" textAnchor="middle" fontSize="8.5" fill="#4a3d6e" fontWeight="700">Pb(NO₃)₂</text>

          <rect x="18" y="18" width="6" height="14" fill={'url(#' + uid + 'steel)'} />
          <rect x="356" y="18" width="6" height="14" fill={'url(#' + uid + 'steel)'} />

          <Buret
            uid={uid}
            cx={BURET_FE_CX}
            topY={26}
            theme={METAL_COLORS.fe}
            remainingMl={feRemaining}
            isDripping={activeDrop === 'fe'}
            remainingDisplay={feRemaining + ' mL'}
          />

          <Buret
            uid={uid}
            cx={BURET_ZN_CX}
            topY={26}
            theme={METAL_COLORS.zn}
            remainingMl={znRemaining}
            isDripping={activeDrop === 'zn'}
            remainingDisplay={znRemaining + ' mL'}
          />

          <Buret
            uid={uid}
            cx={BURET_PB_CX}
            topY={26}
            theme={METAL_COLORS.pb}
            remainingMl={pbRemaining}
            isDripping={activeDrop === 'pb'}
            remainingDisplay={pbRemaining + ' mL'}
          />

          <path
            d={
              'M' + BEAKER_LEFT_X + ' ' + (BEAKER_TOP_Y + 4) +
              ' Q' + BEAKER_LEFT_X + ' ' + BEAKER_TOP_Y + ' ' + (BEAKER_LEFT_X + 4) + ' ' + BEAKER_TOP_Y +
              ' H' + (BEAKER_RIGHT_X - 4) +
              ' Q' + BEAKER_RIGHT_X + ' ' + BEAKER_TOP_Y + ' ' + BEAKER_RIGHT_X + ' ' + (BEAKER_TOP_Y + 4) +
              ' V' + BEAKER_BOTTOM_Y + ' H' + BEAKER_LEFT_X + ' Z'
            }
            fill={'url(#' + uid + 'glass)'}
            stroke="#557586"
            strokeWidth="2"
          />

          <path
            d={'M' + (BEAKER_LEFT_X - 1) + ' ' + (BEAKER_TOP_Y - 1) + ' l-6 -3 l7 -2'}
            fill="none"
            stroke="#8da9b8"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <path
            d={'M' + (BEAKER_RIGHT_X + 1) + ' ' + (BEAKER_TOP_Y - 1) + ' l6 -3 l-7 -2'}
            fill="none"
            stroke="#8da9b8"
            strokeWidth="1.4"
            strokeLinecap="round"
          />

          <path
            d={
              'M' + (BEAKER_LEFT_X + 2) + ' ' + waterY +
              ' H' + (BEAKER_RIGHT_X - 2) +
              ' V' + (BEAKER_BOTTOM_Y - 1) +
              ' H' + (BEAKER_LEFT_X + 2) + ' Z'
            }
            fill={solutionFill}
            fillOpacity={solutionOpacity}
          />
          {status.stirring ? (
            <g className={styles.vortex} aria-label="Lốc xoáy trên mặt nước">
              <ellipse cx={STIRRER_CX} cy={waterY + 5} rx="54" ry="8" fill="#d8bd70" fillOpacity=".28" />
              <path
                d={'M' + (BEAKER_LEFT_X + 10) + ' ' + (waterY + 3) + ' Q190 ' + (waterY + 46) + ' ' + (BEAKER_RIGHT_X - 10) + ' ' + (waterY + 3) + ' Q190 ' + (waterY + 22) + ' ' + (BEAKER_LEFT_X + 10) + ' ' + (waterY + 3)}
                fill="#d2ad54"
                fillOpacity=".28"
                stroke="#a88439"
                strokeOpacity=".5"
                strokeWidth="1.2"
              />
              <path
                d={'M' + (STIRRER_CX - 21) + ' ' + (waterY + 4) + ' Q' + STIRRER_CX + ' ' + (waterY + 24) + ' ' + (STIRRER_CX + 21) + ' ' + (waterY + 4)}
                fill="none"
                stroke="#f5e6ad"
                strokeOpacity=".75"
                strokeWidth="2"
              />
              <ellipse cx={STIRRER_CX} cy={waterY + 35} rx="12" ry="4" fill="#a56535" fillOpacity=".35" />
            </g>
          ) : null}
          {status.stirring && fePrecipitating ? (
            <g className={styles.particulateSpin} aria-label="Hạt kết tủa Fe(OH)3 đang quay theo dòng nước">
              {[0, 1, 2, 3, 4, 5].map((index) => {
                return (
                  <circle
                    key={index}
                    cx={STIRRER_CX + (index - 2.5) * 12}
                    cy={waterY + 36 + (index % 3) * 9}
                    r={2 + (index % 2)}
                    fill="#a56535"
                    fillOpacity=".78"
                  />
                )
              })}
            </g>
          ) : null}
          {hasFe && !mixtureStirred ? (
            <g className={styles.localDropPlume} aria-label="Vệt dung dịch Fe chưa khuấy">
              <ellipse cx={feDropX} cy={waterY + 8} rx="13" ry="5" fill="#e2bd5d" fillOpacity=".72" />
              <ellipse cx={feDropX} cy={waterY + 18} rx="7" ry="14" fill="#e2bd5d" fillOpacity=".42" />
            </g>
          ) : null}
          {fePrecipitating ? (
            <g className={styles.fePrecipitate} aria-label="Kết tủa Fe(OH)3 sau khi khuấy">
              <path
                d={'M' + (BEAKER_LEFT_X + 5) + ' ' + (BEAKER_BOTTOM_Y - 2) + ' Q190 ' + (BEAKER_BOTTOM_Y - fePrecipitateHeight - 5) + ' ' + (BEAKER_RIGHT_X - 5) + ' ' + (BEAKER_BOTTOM_Y - 2) + ' Z'}
                fill="#a56535"
                fillOpacity=".82"
              />
              <ellipse cx="190" cy={BEAKER_BOTTOM_Y - fePrecipitateHeight - 2} rx="48" ry="3" fill="#c1824e" fillOpacity=".65" />
            </g>
          ) : null}
          <ellipse
            cx={(BEAKER_LEFT_X + BEAKER_RIGHT_X) / 2}
            cy={waterY}
            rx={(BEAKER_RIGHT_X - BEAKER_LEFT_X - 4) / 2}
            ry="3.5"
            fill={mixtureStirred && hasFe ? '#f8edc9' : '#ffffff'}
            fillOpacity={mixtureStirred && hasFe ? '.9' : '.72'}
            stroke="#6b8a99"
            strokeWidth="1"
          />

          <rect
            className={styles.stirBar}
            x={STIRRER_CX - 22}
            y={BEAKER_BOTTOM_Y - 9}
            width="44"
            height="6"
            rx="3"
            fill="#e6ebee"
            stroke="#7e8a92"
            strokeWidth=".6"
            data-testid="sample-stirbar"
          />
          <rect
            x={STIRRER_CX - 18}
            y={BEAKER_BOTTOM_Y - 8.5}
            width="36"
            height="1.4"
            rx=".7"
            fill="#f4f7f9"
            pointerEvents="none"
          />

          <path
            d={'M' + (BEAKER_LEFT_X + 6) + ' ' + (BEAKER_TOP_Y + 18) + ' v140'}
            stroke="#fff"
            strokeWidth="3"
            strokeOpacity=".75"
          />
          <path
            d={'M' + (BEAKER_RIGHT_X - 6) + ' ' + (BEAKER_TOP_Y + 18) + ' v140'}
            stroke="#afc9d4"
            strokeWidth="1.2"
            strokeOpacity=".5"
          />

          {[200, 400, 600, 800, 1000, 1200, 1400, 1600, 1800, 2000].map((ml) => {
            const y = volumeY(ml)
            const major = ml % 400 === 0
            return (
              <g key={ml}>
                <line
                  x1={major ? BEAKER_LEFT_X - 8 : BEAKER_LEFT_X - 4}
                  x2={BEAKER_LEFT_X - 1}
                  y1={y}
                  y2={y}
                  stroke="#365964"
                  strokeWidth={major ? 1 : 0.55}
                />
                {major ? (
                  <text x={BEAKER_LEFT_X - 10} y={y + 2.5} textAnchor="end" fontSize="6.5" fill="#365964">{ml}</text>
                ) : null}
              </g>
            )
          })}
          <text x={BEAKER_LEFT_X - 10} y={BEAKER_TOP_Y - 2} textAnchor="end" fontSize="6" fill="#365964">mL</text>

          <text
            x={(BEAKER_LEFT_X + BEAKER_RIGHT_X) / 2}
            y={BEAKER_TOP_Y - 12}
            textAnchor="middle"
            fontSize="7"
            fill="#365964"
          >
            Đã thêm: {totalAddedMl} mL
          </text>

          <rect
            x="70"
            y="430"
            width="240"
            height="22"
            rx="3"
            fill={'url(#' + uid + 'platform)'}
            stroke="#557586"
            strokeWidth="1"
          />
          <rect x="70" y="430" width="240" height="2" fill="#e7eff4" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect
              key={'vent' + i}
              x={120 + i * 14}
              y={446}
              width="9"
              height="2"
              rx="1"
              fill="#5d7682"
              opacity=".55"
            />
          ))}

          <circle
            cx="92"
            cy="441"
            r="4.5"
            fill={status.stirring ? '#cc7a1e' : '#456475'}
            className={status.stirring ? styles.indicatorOn : ''}
          />
          <text x="92" y="459" textAnchor="middle" fontSize="5.5" fill="#365964">Power</text>

          <g>
            <circle cx="288" cy="441" r="6" fill="#3f576a" stroke="#1a2c36" strokeWidth=".6" />
            <line
              x1="288"
              y1="441"
              x2="288"
              y2="437"
              stroke="#dde8ee"
              strokeWidth="1"
              strokeLinecap="round"
              transform={'rotate(' + (status.stirring ? 90 : 0) + ' 288 441)'}
            />
            <circle cx="288" cy="441" r="1.2" fill="#a7bcc8" />
            <text x="288" y="459" textAnchor="middle" fontSize="5.5" fill="#365964">Tốc độ</text>
          </g>
          <text x="190" y="464" textAnchor="middle" fontSize="7.5" fill="#365964" fontWeight="650">Máy khuấy từ</text>
        </svg>
      </div>

      <div className={styles.apparatusControls}>
        <button
          type="button"
          className={styles.stirButton}
          data-active={status.stirring}
          onClick={onToggleStir}
          disabled={isCalculated}
          data-testid="sample-toggle-stir"
        >
          {status.stirring ? <StopIcon /> : <PlayIcon />}
          {status.stirring ? 'Dừng khuấy' : 'Bật khuấy'}
        </button>
        <button
          type="button"
          className={styles.calculateButton}
          onClick={calculateSample}
          disabled={!hasFinishedStirring || calculationBusy || isCalculated}
          title={isCalculated ? 'Đã tính toán. Nhấn "Đặt lại" để bắt đầu lại' : hasFinishedStirring ? 'Chạy PHREEQC để tính pH, ion còn tan và pha rắn' : 'Hãy khuấy xong rồi dừng máy trước khi tính'}
          data-testid="sample-calculate"
        >
          <BeakerIcon /> {calculationBusy ? 'Đang tính…' : 'Tính toán'}
        </button>
        <div className={styles.buretControls}>
          <div className={styles.buretControl}>
            <span>Fe³⁺</span>
            <DoseStepMenu
              solution="fe"
              value={dropSteps.fe}
              onChange={(value) => setDropStep('fe', value)}
              disabled={feEmpty || isCalculated}
            />
            <button
              type="button"
              className={styles.buretAdd}
              data-testid="sample-add-fe"
              onClick={() => onAddDrop('fe', dropSteps.fe)}
              disabled={feEmpty || dropSteps.fe > feRemaining || isCalculated}
            >
              <PlusIcon /> <span>{feEmpty ? 'Đã hết' : 'Thêm'}</span>
            </button>
          </div>
          <div className={styles.buretControl}>
            <span>Zn²⁺</span>
            <DoseStepMenu
              solution="zn"
              value={dropSteps.zn}
              onChange={(value) => setDropStep('zn', value)}
              disabled={znEmpty || isCalculated}
            />
            <button
              type="button"
              className={styles.buretAdd}
              data-testid="sample-add-zn"
              onClick={() => onAddDrop('zn', dropSteps.zn)}
              disabled={znEmpty || dropSteps.zn > znRemaining || isCalculated}
            >
              <PlusIcon /> <span>{znEmpty ? 'Đã hết' : 'Thêm'}</span>
            </button>
          </div>
          <div className={styles.buretControl}>
            <span>Pb²⁺</span>
            <DoseStepMenu
              solution="pb"
              value={dropSteps.pb}
              onChange={(value) => setDropStep('pb', value)}
              disabled={pbEmpty || isCalculated}
            />
            <button
              type="button"
              className={styles.buretAdd}
              data-testid="sample-add-pb"
              onClick={() => onAddDrop('pb', dropSteps.pb)}
              disabled={pbEmpty || dropSteps.pb > pbRemaining || isCalculated}
            >
              <PlusIcon /> <span>{pbEmpty ? 'Đã hết' : 'Thêm'}</span>
            </button>
          </div>
          <button
            type="button"
            className={styles.buretReset}
            onClick={onReset}
            aria-label="Đặt lại bàn pha mẫu"
          >
            <ResetIcon /> Đặt lại
          </button>
        </div>
      </div>

      {localCalculationError ? (
        <p className={styles.calculationError} role="alert">{localCalculationError}</p>
      ) : null}
      {calculation ? (
        <section className={styles.calculationPanel} aria-label="Kết quả tính toán bằng PHREEQC">
          <div className={styles.calculationHeader}>
            <div>
              <strong>Kết quả sau xử lý</strong>
              <span className={styles.calculationHeaderNote}>{calculation.totalVolumeMl.toFixed(6)} mL mẫu</span>
            </div>
            <span>Khối lượng tính theo nguyên tố kim loại</span>
          </div>
          <p className={styles.calculationExplanation}>
            Bảng cho biết lượng kim loại còn trong nước và lượng đã chuyển thành kết tủa.
          </p>
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <caption className={styles.tableCaption}>Lượng ion còn trong dung dịch và lượng ion đã kết tủa.</caption>
              <thead>
                <tr><th scope="col">Đại lượng</th><th scope="col">Fe³⁺</th><th scope="col">Zn²⁺</th><th scope="col">Pb²⁺</th></tr>
              </thead>
              <tbody>
                <tr><th scope="row">Ion còn trong dung dịch (mg/L)</th><td>{calculation.dissolvedMgL.fe.toFixed(6)}</td><td>{calculation.dissolvedMgL.zn.toFixed(6)}</td><td>{calculation.dissolvedMgL.pb.toFixed(6)}</td></tr>
                <tr><th scope="row">Ion kết tủa (mg)</th><td>{calculation.precipitateMg.fe.toFixed(6)}</td><td>{calculation.precipitateMg.zn.toFixed(6)}</td><td>{calculation.precipitateMg.pb.toFixed(6)}</td></tr>
              </tbody>
            </table>
          </div>
          <div className={styles.calculationSummary}>
            <span>pH sau xử lý <strong>{calculation.pH.toFixed(6)}</strong></span>
            <span>Tổng ion kim loại kết tủa <strong>{calculation.totalPrecipitateMg.toFixed(6)} mg</strong></span>
          </div>
        </section>
      ) : null}

      <p className={styles.apparatusNote}>
        Dung dịch gốc 100 mg/L · mỗi buret chứa 10 mL và không tự nạp lại. Màu dung dịch là minh họa trước khi chỉnh pH.
      </p>
      <div className={styles.precipitateGuide} aria-label="Màu và pH tham khảo của kết tủa">
        <strong>Màu kết tủa và pH tham khảo</strong>
        {PRECIPITATE_GUIDANCE.map((item) => (
          <span key={item.label}>{item.label} · {item.ph}</span>
        ))}
        <span>ZnSO₄ + Pb(NO₃)₂: PbSO₄ có thể tạo chất rắn trắng, không cần tăng pH.</span>
      </div>
    </div>
  )
}
