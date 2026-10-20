'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { TreatmentCalculation, FilterHistoryEntry } from './apparatus.js'
import { WT_QCVN_COLUMN_A } from './constants.js'
import { PlayIcon, StopIcon, PlusIcon, LockIcon } from './icons.js'
import styles from './workbench.module.css'

interface DischargeApparatusProps {
  initialPH: number
  calculation: TreatmentCalculation
  filterHistory: FilterHistoryEntry[]
  onDischarge: () => void
  phase: 'balancing' | 'discharged'
  /** Báo pH hiện tại của Bàn 3 về workbench để hiển thị trong notebook. */
  onPHChange?: (pH: number) => void
}

// ─── Fixed apparatus geometry ───────────────────
const BEAKER_LEFT_X = 130
const BEAKER_RIGHT_X = 250
const BEAKER_TOP_Y = 252
const BEAKER_BOTTOM_Y = 425
const BEAKER_HEIGHT = BEAKER_BOTTOM_Y - BEAKER_TOP_Y // 173
const BEAKER_CENTER_X = (BEAKER_LEFT_X + BEAKER_RIGHT_X) / 2 // 190

const BURET_NAOH_CX = 152
const BURET_HCL_CX = 228
const BURET_BODY_TOP = 36
const BURET_BODY_BOTTOM = 240
const BURET_BODY_HEIGHT = BURET_BODY_BOTTOM - BURET_BODY_TOP // 204
const BURET_WIDTH = 22
const BURET_CAPACITY = 50
const BURET_STOPCOCK_H = 9
const BURET_TIP_H = 18

const PLATFORM_LEFT_X = 70
const PLATFORM_RIGHT_X = 310
const PLATFORM_WIDTH = PLATFORM_RIGHT_X - PLATFORM_LEFT_X // 240
const PLATFORM_TOP_Y = BEAKER_BOTTOM_Y + 5 // 430
const PLATFORM_HEIGHT = 22

const uid = 'discharge'

/** Drop step options for pH burets */
const STEP_ML_OPTIONS = [0.01, 0.05, 0.1, 0.5, 1.0] as const

/** Fixed liquid depth in beaker */
const FIXED_LIQUID_DEPTH = BEAKER_HEIGHT * 0.65
const FIXED_LIQUID_TOP_Y = BEAKER_BOTTOM_Y - FIXED_LIQUID_DEPTH

/** A single pH measurement record */
export type PHMeasurement = {
  index: number
  timestamp: Date
  pH: number
  naohMl: number
  hclMl: number
  phOk: boolean
}

/** Buret with liquid fill that goes down as reagent is dispensed */
function BuretVisual({
  cx, color, labelColor,
  currentMl,
  isDropping,
  dropColor,
}: {
  cx: number
  color: string
  labelColor: string
  currentMl: number
  isDropping: boolean
  dropColor: string
}) {
  const leftX = cx - BURET_WIDTH / 2
  const rightX = cx + BURET_WIDTH / 2

  // Fill from bottom up; empty when currentMl === 0
  const fillRatio = Math.max(0, Math.min(1, currentMl / BURET_CAPACITY))
  const fillHeight = BURET_BODY_HEIGHT * fillRatio
  const fillTop = BURET_BODY_BOTTOM - fillHeight

  return (
    <g aria-label="Buret">
      {/* Clamp */}
      <rect x={cx - 8} y={BURET_BODY_TOP - 10} width="16" height="8" rx="1.5" fill="#5d7682" stroke="#2c4654" strokeWidth=".6" />
      {/* Cap */}
      <path d={`M${leftX - 2} ${BURET_BODY_TOP - 6} h${BURET_WIDTH + 4} v6 h-${BURET_WIDTH + 4} Z`} fill="#a7bcc8" stroke="#7591a0" strokeWidth=".6" />
      <rect x={cx - 1.5} y={BURET_BODY_TOP - 4} width="3" height="3" fill="#7591a0" />

      {/* Body tube — glass background */}
      <rect
        x={leftX} y={BURET_BODY_TOP}
        width={BURET_WIDTH} height={BURET_BODY_HEIGHT}
        fill={`url(#${uid}glass)`} stroke={color} strokeWidth="1.4"
      />

      {/* Liquid fill — from bottom upward, shrinks as currentMl decreases */}
      {fillRatio > 0 && (
        <>
          <rect
            x={leftX + 1} y={fillTop}
            width={BURET_WIDTH - 2} height={fillHeight}
            fill={dropColor} fillOpacity=".45"
          />
          {/* Liquid surface ellipse */}
          <ellipse cx={cx} cy={fillTop + 1} rx={(BURET_WIDTH - 2) / 2} ry="2.5" fill={dropColor} fillOpacity=".6" stroke={color} strokeWidth=".5" />
        </>
      )}

      {/* Tick marks: 0 at top → 50 at bottom */}
      {Array.from({ length: 11 }, (_, i) => {
        const ml = i * 5
        const y = BURET_BODY_BOTTOM - (BURET_BODY_HEIGHT * ml) / BURET_CAPACITY
        const major = i % 2 === 0
        return (
          <g key={ml}>
            <line x1={leftX} x2={leftX - (major ? 6 : 3)} y1={y} y2={y} stroke={labelColor} strokeWidth={major ? 0.8 : 0.5} />
            {major && <text x={leftX - 8} y={y + 2.5} fontSize="6" fill={labelColor} textAnchor="end">{ml}</text>}
          </g>
        )
      })}
      <text x={rightX + 1} y={BURET_BODY_TOP - 2} fontSize="6" fill={labelColor} textAnchor="start">mL</text>

      {/* Stopcock */}
      <rect x={leftX - 3} y={BURET_BODY_BOTTOM} width={BURET_WIDTH + 6} height={BURET_STOPCOCK_H} rx="1" fill="#456475" stroke="#2c4654" strokeWidth=".6" />
      <circle cx={cx} cy={BURET_BODY_BOTTOM + BURET_STOPCOCK_H / 2} r="3" fill="#2c4654" stroke="#1a2c36" strokeWidth=".4" />

      {/* Delivery tip */}
      <path d={`M${cx - 3} ${BURET_BODY_BOTTOM + BURET_STOPCOCK_H} h6 v${BURET_TIP_H} h-6 Z`} fill="#9bb0bc" stroke="#365964" strokeWidth=".5" />

      {/* Drop animation — shown while dispensing */}
      {isDropping && (
        <>
          <circle cx={cx} cy={BURET_BODY_BOTTOM + BURET_STOPCOCK_H + BURET_TIP_H + 6} r="2.2" fill={dropColor} opacity=".85" />
          <circle cx={cx} cy={BURET_BODY_BOTTOM + BURET_STOPCOCK_H + BURET_TIP_H + 14} r="1.8" fill={dropColor} opacity=".55" />
        </>
      )}
    </g>
  )
}

/** Beaker with measurement tick marks */
function BeakerMarks() {
  // Tick marks every 20 mL, up to 2000 mL beaker capacity
  const marks = [0, 200, 400, 600, 800, 1000, 1200, 1400, 1600, 1800, 2000]
  return (
    <g aria-label="Beaker markings">
      {marks.map((ml) => {
        const ratio = ml / 2000
        const y = BEAKER_BOTTOM_Y - BEAKER_HEIGHT * ratio
        const major = ml % 400 === 0
        return (
          <g key={ml}>
            {/* Tick on LEFT wall */}
            <line
              x1={BEAKER_LEFT_X - 2} x2={BEAKER_LEFT_X - (major ? 8 : 5)}
              y1={y} y2={y}
              stroke="#78909c" strokeWidth={major ? 0.9 : 0.5}
            />
            {/* Tick on RIGHT wall */}
            <line
              x1={BEAKER_RIGHT_X + 2} x2={BEAKER_RIGHT_X + (major ? 8 : 5)}
              y1={y} y2={y}
              stroke="#78909c" strokeWidth={major ? 0.9 : 0.5}
            />
            {major && (
              <>
                <text x={BEAKER_LEFT_X - 11} y={y + 2.5} fontSize="5.5" fill="#607486" textAnchor="end">{ml}</text>
                <text x={BEAKER_RIGHT_X + 11} y={y + 2.5} fontSize="5.5" fill="#607486" textAnchor="start">{ml}</text>
              </>
            )}
          </g>
        )
      })}
      <text x={BEAKER_LEFT_X - 2} y={BEAKER_TOP_Y + 8} fontSize="5" fill="#90a4ae" textAnchor="end">mL</text>
    </g>
  )
}

/** Dropdown menu to choose the volume dispensed per press (mL) */
function DoseStepMenu({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string
  value: number
  disabled: boolean
  onChange: (value: number) => void
}) {
  const [open, setOpen] = useState(false)
  const menuId = `dose-step-${label.toLowerCase().replace(/\s/g, '-')}`

  return (
    <div className={styles.doseStepMenu}>
      <button
        type="button"
        className={styles.doseStepTrigger}
        aria-label={`Bước thêm ${label}`}
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
        <div id={menuId} className={styles.doseStepMenuList} role="listbox" aria-label={`Chọn bước thêm ${label}`}>
          {STEP_ML_OPTIONS.map((step) => (
            <button
              type="button"
              role="option"
              aria-selected={step === value}
              className={styles.doseStepOption}
              key={step}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange(step)
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

export function DischargeApparatus({
  initialPH,
  calculation,
  filterHistory,
  onDischarge,
  phase,
  onPHChange,
}: DischargeApparatusProps) {
  /** pH chưa xác nhận */
  const [pendingPH, setPendingPH] = useState(initialPH)
  /** pH đo được cuối cùng (sau khi khuấy + bấm Đo) */
  const [measuredPH, setMeasuredPH] = useState(initialPH)
  /** Lịch sử đo pH */
  const [phHistory, setPhHistory] = useState<PHMeasurement[]>([])
  /** Mực hiện tại trong mỗi buret (tính từ dưới lên) */
  const [naohMl, setNaohMl] = useState(0)
  const [hclMl, setHclMl] = useState(0)

  // Sync pH change back to workbench whenever pendingPH updates
  useEffect(() => { onPHChange?.(pendingPH) }, [pendingPH, onPHChange])
  /** Drop animation states */
  const [naohDropping, setNaohDropping] = useState(false)
  const [hclDropping, setHclDropping] = useState(false)
  /** Khuấy */
  const [stirring, setStirring] = useState(false)
  const [hasStirredSinceLastAdd, setHasStirredSinceLastAdd] = useState(false)
  const [stepMl, setStepMl] = useState<number>(0.1)
  /** Đã khóa Bàn 3 */
  const [locked, setLocked] = useState(false)

  const stirringTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const measureCountRef = useRef(0)
  const naohDropTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hclDropTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const composition = calculation.filtrate_mgPerL

  const canMeasure = phase === 'balancing' && !locked && hasStirredSinceLastAdd

  const toggleStir = useCallback(() => {
    setStirring((prev) => {
      const next = !prev
      if (next) {
        setHasStirredSinceLastAdd(true)
        if (stirringTimerRef.current) {
          clearTimeout(stirringTimerRef.current)
          stirringTimerRef.current = null
        }
      }
      return next
    })
    if (stirring) {
      if (stirringTimerRef.current) {
        clearTimeout(stirringTimerRef.current)
        stirringTimerRef.current = null
      }
    } else {
      stirringTimerRef.current = setTimeout(() => setStirring(false), 8000)
    }
  }, [stirring])

  const measurePH = useCallback(() => {
    if (!canMeasure) return
    measureCountRef.current += 1
    const phOk = pendingPH >= WT_QCVN_COLUMN_A.pH_min && pendingPH <= WT_QCVN_COLUMN_A.pH_max
    setMeasuredPH(pendingPH)
    setPhHistory((prev) => [
      ...prev,
      {
        index: measureCountRef.current,
        timestamp: new Date(),
        pH: pendingPH,
        naohMl,
        hclMl,
        phOk,
      },
    ])
    setHasStirredSinceLastAdd(false)
  }, [canMeasure, pendingPH, naohMl, hclMl])

  /** Thêm NaOH — mực trong buret giảm, hiệu ứng giọt nhỏ */
  const addNaoh = useCallback(() => {
    if (locked) return
    const ml = stepMl
    setNaohMl((m) => m + ml)
    setPendingPH((p) => Math.min(14, p + ml / 8))
    setHasStirredSinceLastAdd(stirring)
    setNaohDropping(true)
    if (naohDropTimerRef.current) clearTimeout(naohDropTimerRef.current)
    naohDropTimerRef.current = setTimeout(() => setNaohDropping(false), 700)
  }, [stepMl, locked, stirring])

  /** Thêm HCl — mực trong buret giảm, hiệu ứng giọt nhỏ */
  const addHcl = useCallback(() => {
    if (locked) return
    const ml = stepMl
    setHclMl((m) => m + ml)
    setPendingPH((p) => Math.max(0, p - ml / 8))
    setHasStirredSinceLastAdd(stirring)
    setHclDropping(true)
    if (hclDropTimerRef.current) clearTimeout(hclDropTimerRef.current)
    hclDropTimerRef.current = setTimeout(() => setHclDropping(false), 700)
  }, [stepMl, locked, stirring])

  const lockResults = useCallback(() => {
    setLocked(true)
  }, [])

  useEffect(() => {
    return () => {
      if (stirringTimerRef.current) clearTimeout(stirringTimerRef.current)
      if (naohDropTimerRef.current) clearTimeout(naohDropTimerRef.current)
      if (hclDropTimerRef.current) clearTimeout(hclDropTimerRef.current)
    }
  }, [])

  const currentPhOk = measuredPH >= WT_QCVN_COLUMN_A.pH_min && measuredPH <= WT_QCVN_COLUMN_A.pH_max
  const feOk = composition.Fe <= WT_QCVN_COLUMN_A.Fe_mgPerL
  const znOk = composition.Zn <= WT_QCVN_COLUMN_A.Zn_mgPerL
  const pbOk = composition.Pb <= WT_QCVN_COLUMN_A.Pb_mgPerL
  const allOk = feOk && znOk && pbOk && currentPhOk

  return (
    <div className={styles.apparatus}>
      {/* Header */}
      <div className={styles.apparatusHeader}>
        <div>

        </div>
      </div>

      {/* Stage */}
      <div className={styles.apparatusStage}>
        {/* SVG apparatus */}
        <svg viewBox="0 0 380 470" className={styles.apparatusSvg} role="img" aria-label="Sơ đồ bàn cân bằng pH">
          <defs>
            <linearGradient id={uid + 'glass'}>
              <stop offset="0" stopColor="#cedfe8" stopOpacity=".55" />
              <stop offset=".3" stopColor="#fff" stopOpacity=".08" />
              <stop offset=".8" stopColor="#e0edf3" stopOpacity=".12" />
              <stop offset="1" stopColor="#c6dbe5" stopOpacity=".5" />
            </linearGradient>
            <linearGradient id={uid + 'steel'}>
              <stop offset="0" stopColor="#78909c" />
              <stop offset=".4" stopColor="#eceff1" />
              <stop offset=".65" stopColor="#b0bec5" />
              <stop offset="1" stopColor="#607d8b" />
            </linearGradient>
            <linearGradient id={uid + 'platform'}>
              <stop offset="0" stopColor="#cfdce4" />
              <stop offset="1" stopColor="#78909c" />
            </linearGradient>
            <linearGradient id={uid + 'bar'}>
              <stop offset="0" stopColor="#b0bec5" />
              <stop offset=".5" stopColor="#eceff1" />
              <stop offset="1" stopColor="#b0bec5" />
            </linearGradient>
          </defs>

          {/* Support bar */}
          <rect x="20" y="6" width="340" height="12" rx="2" fill={`url(#${uid}steel)`} />
          <rect x="18" y="6" width="344" height="2" fill="#eceff1" />
          {/* NaOH name plate */}
          <rect x={BURET_NAOH_CX - 32} y="4" width="64" height="14" rx="2" fill={`url(#${uid}bar)`} stroke="#455a64" strokeWidth=".6" />
          <text x={BURET_NAOH_CX} y="14.5" textAnchor="middle" fontSize="8.5" fill="#0d3a45" fontWeight="700">NaOH 1 M</text>
          {/* HCl name plate */}
          <rect x={BURET_HCL_CX - 28} y="4" width="56" height="14" rx="2" fill={`url(#${uid}bar)`} stroke="#455a64" strokeWidth=".6" />
          <text x={BURET_HCL_CX} y="14.5" textAnchor="middle" fontSize="8.5" fill="#5a3208" fontWeight="700">HCl 1 M</text>
          {/* End posts */}
          <rect x="18" y="18" width="6" height="14" fill={`url(#${uid}steel)`} />
          <rect x="356" y="18" width="6" height="14" fill={`url(#${uid}steel)`} />

          {/* Burets with fill level and drop animation */}
          <BuretVisual cx={BURET_NAOH_CX} color="#1f8a99" labelColor="#0e3a45" currentMl={BURET_CAPACITY - naohMl} isDropping={naohDropping} dropColor="#1f8a99" />
          <BuretVisual cx={BURET_HCL_CX} color="#b26516" labelColor="#5a3208" currentMl={BURET_CAPACITY - hclMl} isDropping={hclDropping} dropColor="#b26516" />

          {/* Beaker — flat bottom */}
          <path
            d={`M${BEAKER_LEFT_X} ${BEAKER_TOP_Y + 4}
               Q${BEAKER_LEFT_X} ${BEAKER_TOP_Y} ${BEAKER_LEFT_X + 4} ${BEAKER_TOP_Y}
               H${BEAKER_RIGHT_X - 4} Q${BEAKER_RIGHT_X} ${BEAKER_TOP_Y} ${BEAKER_RIGHT_X} ${BEAKER_TOP_Y + 4}
               V${BEAKER_BOTTOM_Y} H${BEAKER_LEFT_X} Z`}
            fill={`url(#${uid}glass)`} stroke="#557586" strokeWidth="2"
          />
          {/* Spout lips */}
          <path d={`M${BEAKER_LEFT_X - 1} ${BEAKER_TOP_Y - 1} l-6 -3 l7 -2`} fill="none" stroke="#8da9b8" strokeWidth="1.4" strokeLinecap="round" />
          <path d={`M${BEAKER_RIGHT_X + 1} ${BEAKER_TOP_Y - 1} l6 -3 l-7 -2`} fill="none" stroke="#8da9b8" strokeWidth="1.4" strokeLinecap="round" />

          {/* Beaker tick marks — 0 mL at bottom, 2000 mL at top */}
          <BeakerMarks />

          {/* Liquid — fixed level */}
          <path
            d={`M${BEAKER_LEFT_X + 2} ${FIXED_LIQUID_TOP_Y}
               H${BEAKER_RIGHT_X - 2} V${BEAKER_BOTTOM_Y - 1} H${BEAKER_LEFT_X + 2} Z`}
            fill="#29b6c5" fillOpacity=".25"
          />
          <ellipse cx={BEAKER_CENTER_X} cy={FIXED_LIQUID_TOP_Y} rx={(BEAKER_RIGHT_X - BEAKER_LEFT_X - 4) / 2} ry="3.5" fill="#29b6c5" stroke="#6b8a99" strokeWidth="1" />

          {/* Stir bar */}
          {stirring && (
            <rect
              x={BEAKER_CENTER_X - 18} y={BEAKER_BOTTOM_Y - 8}
              width="36" height="6" rx="3"
              fill="#e6ebee" stroke="#7e8a92" strokeWidth=".6"
            />
          )}

          {/* Hotplate */}
          <rect x={PLATFORM_LEFT_X} y={PLATFORM_TOP_Y} width={PLATFORM_WIDTH} height={PLATFORM_HEIGHT} rx="3" fill={`url(#${uid}platform)`} stroke="#557586" strokeWidth="1" />
          <rect x={PLATFORM_LEFT_X} y={PLATFORM_TOP_Y} width={PLATFORM_WIDTH} height="2" fill="#e7eff4" />
          {Array.from({ length: 6 }, (_, i) => (
            <rect key={'vent' + i} x={120 + i * 14} y={PLATFORM_TOP_Y + 16} width="9" height="2" rx="1" fill="#5d7682" opacity=".55" />
          ))}
          <circle cx="92" cy={PLATFORM_TOP_Y + 11} r="4.5" fill={stirring ? '#cc7a1e' : '#456475'} className={stirring ? styles.indicatorOn : undefined} />
          <text x="92" y={PLATFORM_TOP_Y + 29} textAnchor="middle" fontSize="5.5" fill="#365964">Power</text>
          <circle cx="288" cy={PLATFORM_TOP_Y + 11} r="6" fill="#3f576a" stroke="#1a2c36" strokeWidth=".6" />
          <line x1="288" y1={PLATFORM_TOP_Y + 11} x2="288" y2={PLATFORM_TOP_Y + 7} stroke="#dde8ee" strokeWidth="1" strokeLinecap="round" />
          <circle cx="288" cy={PLATFORM_TOP_Y + 11} r="1.2" fill="#a7bcc8" />
          <text x="288" y={PLATFORM_TOP_Y + 29} textAnchor="middle" fontSize="5.5" fill="#365964">Tốc độ</text>
          <text x={BEAKER_CENTER_X} y={PLATFORM_TOP_Y + 34} textAnchor="middle" fontSize="7.5" fill="#365964" fontWeight="650">Máy khuấy từ</text>
        </svg>

        {/* Volume model */}
        <div className={styles.volumeModel}>
          <div className={styles.volumeModelHeader}>
            <strong>Thể tích &amp; pH</strong>
          </div>
          <div className={styles.volumeModelGrid}>
            <div className={styles.volumeModelRow}>
              <span className={styles.volumeModelLabel}>
                <span className={styles.volumeDot} data-solution="naoh" />
                NaOH 1 M
              </span>
              <span className={styles.volumeModelValue}>{naohMl.toFixed(2)} mL</span>
            </div>
            <div className={styles.volumeModelRow}>
              <span className={styles.volumeModelLabel}>
                <span className={styles.volumeDot} data-solution="hcl" />
                HCl 1 M
              </span>
              <span className={styles.volumeModelValue}>{hclMl.toFixed(2)} mL</span>
            </div>
            <div className={styles.volumeModelDivider} />
            <div className={styles.volumeModelRow}>
              <span className={styles.volumeModelLabel}>
                <span className={styles.volumeDotGray} />
                Tổng đã nhỏ
              </span>
              <span className={styles.volumeModelValue}>{(naohMl + hclMl).toFixed(2)} mL</span>
            </div>
            <div className={styles.volumeModelRow} data-total>
              <span className={styles.volumeModelLabel}>
                <span className={styles.volumeDotAccent} />
                pH đo được
              </span>
              <span className={styles.volumeModelValue}>{measuredPH.toFixed(2)}</span>
            </div>
            <div className={styles.volumeModelRow}>
              <span className={styles.volumeModelLabel}>
                <span className={styles.volumeDotGray} />
                pH chưa đo
              </span>
              <span className={styles.volumeModelValue}>{pendingPH.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className={styles.apparatusControls}>
        <button
          type="button"
          className={styles.stirButton}
          data-active={stirring}
          onClick={toggleStir}
          disabled={locked || phase === 'discharged'}
          data-testid="wt-toggle-stir"
        >
          {stirring ? <StopIcon /> : <PlayIcon />}
          {stirring ? 'Dừng khuấy' : 'Bật khuấy'}
        </button>

        <button
          type="button"
          className={styles.measureButton}
          onClick={measurePH}
          disabled={!canMeasure}
          title={!hasStirredSinceLastAdd && !locked ? 'Thêm thuốc thử, khuấy rồi mới đo.' : canMeasure ? 'Ghi nhận pH sau khi khuấy' : 'Đã khóa'}
        >
          Đo pH
        </button>

        <div className={styles.buretControls}>
          {([['naoh', naohMl, naohDropping, addNaoh, '#1f8a99'], ['hcl', hclMl, hclDropping, addHcl, '#b26516']] as const).map(([reagent, , isDropping, onAdd, color]) => {
            const label = reagent === 'naoh' ? 'NaOH' : 'HCl'
            return (
              <div className={styles.buretControl} key={reagent}>
                <span>{label}</span>
                <DoseStepMenu
                  label={label}
                  value={stepMl}
                  disabled={locked || phase === 'discharged'}
                  onChange={setStepMl}
                />
                <button
                  type="button"
                  className={styles.buretAdd}
                  onClick={onAdd}
                  disabled={locked || phase === 'discharged'}
                  title={`Nhỏ ${label}`}
                  data-dropping={isDropping}
                  data-color={color}
                >
                  <PlusIcon /> <span>Thêm</span>
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Data panel — chỉ hiện sau khi khóa kết quả để học sinh tự đánh giá */}
      <section className={styles.calculationPanel} aria-label="Bảng kiểm tra cột A QCVN 40:2025">
        {locked ? (
          <>
            <div className={styles.calculationHeader}>
              <div>
                <strong>Kết quả kiểm tra</strong>
                <span className={styles.calculationHeaderNote}>Cân bằng pH trước khi thải</span>
              </div>
              <span>Đơn vị: mg/L (pH không đơn vị)</span>
            </div>

        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <caption className={styles.tableCaption}>
              Kiểm tra cột A QCVN 40:2025 — nồng độ kim loại từ Bàn 2 và pH sau cân bằng
            </caption>
            <thead>
              <tr>
                <th scope="col">Chỉ tiêu</th>
                <th scope="col">Kết quả</th>
                <th scope="col">Cột A</th>
                <th scope="col">Đạt</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Fe</th>
                <td>{composition.Fe.toFixed(4)} mg/L</td>
                <td>≤ {WT_QCVN_COLUMN_A.Fe_mgPerL} mg/L</td>
                <td className={feOk ? styles.pass : styles.fail}>{feOk ? '✓' : '✗'}</td>
              </tr>
              <tr>
                <th scope="row">Zn</th>
                <td>{composition.Zn.toFixed(4)} mg/L</td>
                <td>≤ {WT_QCVN_COLUMN_A.Zn_mgPerL} mg/L</td>
                <td className={znOk ? styles.pass : styles.fail}>{znOk ? '✓' : '✗'}</td>
              </tr>
              <tr>
                <th scope="row">Pb</th>
                <td>{composition.Pb.toFixed(4)} mg/L</td>
                <td>≤ {WT_QCVN_COLUMN_A.Pb_mgPerL} mg/L</td>
                <td className={pbOk ? styles.pass : styles.fail}>{pbOk ? '✓' : '✗'}</td>
              </tr>
              <tr>
                <th scope="row">pH</th>
                <td>{measuredPH.toFixed(2)}</td>
                <td>{WT_QCVN_COLUMN_A.pH_min}–{WT_QCVN_COLUMN_A.pH_max}</td>
                <td className={currentPhOk ? styles.pass : styles.fail}>{currentPhOk ? '✓' : '✗'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Lịch sử lọc từ Bàn 2 */}
        {filterHistory.length > 0 && (
          <div className={styles.tableScroll} style={{ marginTop: '12px' }}>
            <table className={styles.table}>
              <caption className={styles.tableCaption}>
                Lịch sử lọc từ Bàn 2 — kết quả tích lũy Fe, Zn và Pb
              </caption>
              <thead>
                <tr>
                  <th scope="col">Lần</th>
                  <th scope="col">pH lọc</th>
                  <th scope="col">Fe còn lại</th>
                  <th scope="col">Zn còn lại</th>
                  <th scope="col">Pb còn lại</th>
                  <th scope="col">Fe đã lọc</th>
                  <th scope="col">Zn đã lọc</th>
                  <th scope="col">Pb đã lọc</th>
                </tr>
              </thead>
              <tbody>
                {filterHistory.map((entry) => (
                  <tr key={entry.index}>
                    <td>{entry.index}</td>
                    <td>{entry.calculation.pH.toFixed(2)}</td>
                    <td>{entry.calculation.filtrate_mgPerL.Fe.toFixed(4)}</td>
                    <td>{entry.calculation.filtrate_mgPerL.Zn.toFixed(4)}</td>
                    <td>{entry.calculation.filtrate_mgPerL.Pb.toFixed(4)}</td>
                    <td>{entry.cumulativeFiltered?.Fe.toFixed(4) ?? '—'}</td>
                    <td>{entry.cumulativeFiltered?.Zn.toFixed(4) ?? '—'}</td>
                    <td>{entry.cumulativeFiltered?.Pb.toFixed(4) ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
          </>
        ) : null}

        {/* Lịch sử đo pH — nằm riêng bên dưới, hiện ngay sau mỗi lần đo */}
        {phHistory.length > 0 && (
          <div className={styles.tableScroll} style={{ marginTop: '12px' }}>
            <table className={styles.table}>
              <caption className={styles.tableCaption}>
                Lịch sử đo pH — NaOH/HCl tích lũy và kết quả từng lần đo
              </caption>
              <thead>
                <tr>
                  <th scope="col">Lần</th>
                  <th scope="col">Thời gian</th>
                  <th scope="col">pH đo được</th>
                  <th scope="col">NaOH (mL)</th>
                  <th scope="col">HCl (mL)</th>
                  <th scope="col">pH đạt</th>
                </tr>
              </thead>
              <tbody>
                {phHistory.map((entry) => (
                  <tr key={entry.index}>
                    <td>{entry.index}</td>
                    <td>{entry.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
                    <td>{entry.pH.toFixed(2)}</td>
                    <td>{entry.naohMl.toFixed(2)}</td>
                    <td>{entry.hclMl.toFixed(2)}</td>
                    <td className={entry.phOk ? styles.pass : styles.fail}>{entry.phOk ? '✓' : '✗'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Hành động */}
        {phase === 'balancing' ? (
          locked ? (
            <div className={styles.dischargeSuccess}>
              <p>✓ Đã khóa kết quả Bàn 3 — Đạt cột A, sẵn sàng thải.</p>
              <div className={styles.dischargeButtonWrap}>
                <button
                  type="button"
                  className={styles.primary}
                  onClick={onDischarge}
                  disabled={!allOk}
                  title={allOk ? 'Thải nước đã xử lý ra môi trường' : 'Chưa đạt cột A'}
                >
                  Thải ra môi trường
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.dischargeActions}>
              <p className={styles.dischargeNotReady}>
                Cân bằng pH trong khoảng 6–9 rồi bấm <strong>Khóa kết quả</strong>.
              </p>
              <button
                type="button"
                className={styles.lockButton}
                onClick={lockResults}
                disabled={!allOk}
                title="Khóa kết quả cân bằng pH"
              >
                <LockIcon /> Khóa kết quả
              </button>
            </div>
          )
        ) : (
          <div className={styles.dischargeSuccess}>
            <p>✓ Đã thải nước đã xử lý ra môi trường.</p>
          </div>
        )}
      </section>
    </div>
  )
}
