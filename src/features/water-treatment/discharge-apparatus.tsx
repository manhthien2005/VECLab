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
}

// ─── Fixed apparatus geometry (matching Bàn 2 apparatus.tsx) ───────────────────
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

/** Fixed liquid depth — no animation, no change after adding reagent */
const FIXED_LIQUID_DEPTH = BEAKER_HEIGHT * 0.65
const FIXED_LIQUID_TOP_Y = BEAKER_BOTTOM_Y - FIXED_LIQUID_DEPTH

/** A single pH measurement record */
export type PHMeasurement = {
  index: number
  timestamp: Date
  pH: number
  naohMl: number
  hclMl: number
  /** pH in range [pH_min, pH_max] per QCVN 40:2025 */
  phOk: boolean
}

/**
 * Simplified Buret visual — matches Bàn 2 (apparatus.tsx) style.
 * No drop animation, no fill-level change.
 */
function BuretVisual({
  cx, color, labelColor,
}: {
  cx: number
  color: string
  labelColor: string
}) {
  const leftX = cx - BURET_WIDTH / 2
  const rightX = cx + BURET_WIDTH / 2
  return (
    <g aria-label="Buret">
      {/* Clamp */}
      <rect x={cx - 8} y={BURET_BODY_TOP - 10} width="16" height="8" rx="1.5" fill="#5d7682" stroke="#2c4654" strokeWidth=".6" />
      {/* Cap */}
      <path d={`M${leftX - 2} ${BURET_BODY_TOP - 6} h${BURET_WIDTH + 4} v6 h-${BURET_WIDTH + 4} Z`} fill="#a7bcc8" stroke="#7591a0" strokeWidth=".6" />
      <rect x={cx - 1.5} y={BURET_BODY_TOP - 4} width="3" height="3" fill="#7591a0" />

      {/* Body tube */}
      <rect
        x={leftX} y={BURET_BODY_TOP}
        width={BURET_WIDTH} height={BURET_BODY_HEIGHT}
        fill={`url(#${uid}glass)`} stroke={color} strokeWidth="1.4"
      />

      {/* Tick marks: 0 at top → 50 at bottom */}
      {Array.from({ length: 11 }, (_, i) => {
        const ml = i * 5
        const y = BURET_BODY_BOTTOM - (BURET_BODY_HEIGHT * ml) / BURET_CAPACITY
        const major = i % 2 === 0
        return (
          <g key={ml}>
            <line x1={rightX} x2={rightX + (major ? 6 : 3)} y1={y} y2={y} stroke={labelColor} strokeWidth={major ? 0.8 : 0.5} />
            {major && <text x={rightX + 8} y={y + 2.5} fontSize="6" fill={labelColor}>{ml}</text>}
          </g>
        )
      })}
      <text x={leftX - 1} y={BURET_BODY_TOP - 2} fontSize="6" fill={labelColor} textAnchor="end">mL</text>

      {/* Stopcock */}
      <rect x={leftX - 3} y={BURET_BODY_BOTTOM} width={BURET_WIDTH + 6} height={BURET_STOPCOCK_H} rx="1" fill="#456475" stroke="#2c4654" strokeWidth=".6" />
      <circle cx={cx} cy={BURET_BODY_BOTTOM + BURET_STOPCOCK_H / 2} r="3" fill="#2c4654" stroke="#1a2c36" strokeWidth=".4" />

      {/* Delivery tip */}
      <path d={`M${cx - 3} ${BURET_BODY_BOTTOM + BURET_STOPCOCK_H} h6 v${BURET_TIP_H} h-6 Z`} fill="#9bb0bc" stroke="#365964" strokeWidth=".5" />
    </g>
  )
}

export function DischargeApparatus({
  initialPH,
  calculation,
  filterHistory,
  onDischarge,
  phase,
}: DischargeApparatusProps) {
  /** pH chưa xác nhận — thay đổi ngay khi thêm reagent nhưng chưa đo */
  const [pendingPH, setPendingPH] = useState(initialPH)
  /** Lần đo pH gần nhất đã xác nhận (sau khi khuấy + bấm Đo) */
  const [measuredPH, setMeasuredPH] = useState(initialPH)
  /** Lịch sử các lần đo pH */
  const [phHistory, setPhHistory] = useState<PHMeasurement[]>([])
  /** Tổng NaOH / HCl đã thêm */
  const [naohMl, setNaohMl] = useState(0)
  const [hclMl, setHclMl] = useState(0)
  /** Đã khuấy chưa sau lần thêm gần nhất */
  const [stirring, setStirring] = useState(false)
  const [hasStirredSinceLastAdd, setHasStirredSinceLastAdd] = useState(false)
  const [dropStep, setDropStep] = useState<number>(1)
  /** Trạng thái khóa — đã khóa Bàn 3 rồi */
  const [locked, setLocked] = useState(false)

  const stirringTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const measureCountRef = useRef(0)

  const composition = calculation.filtrate_mgPerL

  /** Có thể đo pH khi: đang ở phase balancing, chưa khóa, và đã khuấy sau lần thêm gần nhất */
  const canMeasure = phase === 'balancing' && !locked && hasStirredSinceLastAdd

  /** Bật/tắt khuấy — mỗi lần bật khuấy reset cờ để buộc phải khuấy trước khi đo */
  const toggleStir = useCallback(() => {
    setStirring((prev) => {
      const next = !prev
      if (next) {
        // Bật khuấy → reset cờ buộc khuấy trước khi đo
        setHasStirredSinceLastAdd(false)
        if (stirringTimerRef.current) {
          clearTimeout(stirringTimerRef.current)
          stirringTimerRef.current = null
        }
      }
      return next
    })
    if (stirring) {
      // Dừng khuấy → có thể đo
      if (stirringTimerRef.current) {
        clearTimeout(stirringTimerRef.current)
        stirringTimerRef.current = null
      }
    } else {
      // Bật khuấy → tự dừng sau 8s
      stirringTimerRef.current = setTimeout(() => {
        setStirring(false)
      }, 8000)
    }
  }, [stirring])

  /** Đo pH — chỉ hoạt động sau khi đã khuấy */
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
    // Sau khi đo xong → chưa thể đo lại cho đến khi thêm reagent + khuấy
    setHasStirredSinceLastAdd(false)
  }, [canMeasure, pendingPH, naohMl, hclMl])

  /** Thêm NaOH — cập nhật pendingPH ngay, buộc phải khuấy trước khi đo */
  const addNaoh = useCallback(() => {
    if (locked) return
    const drops = dropStep
    const ml = drops / 60
    setNaohMl((m) => m + ml)
    setPendingPH((p) => Math.min(14, p + drops / 8))
    setHasStirredSinceLastAdd(false)
  }, [dropStep, locked])

  /** Thêm HCl — cập nhật pendingPH ngay, buộc phải khuấy trước khi đo */
  const addHcl = useCallback(() => {
    if (locked) return
    const drops = dropStep
    const ml = drops / 60
    setHclMl((m) => m + ml)
    setPendingPH((p) => Math.max(0, p - drops / 8))
    setHasStirredSinceLastAdd(false)
  }, [dropStep, locked])

  /** Khóa Bàn 3 — chốt kết quả hiện tại */
  const lockResults = useCallback(() => {
    setLocked(true)
  }, [])

  const reset = useCallback(() => {
    if (locked) return
    setPendingPH(initialPH)
    setMeasuredPH(initialPH)
    setNaohMl(0)
    setHclMl(0)
    setStirring(false)
    setHasStirredSinceLastAdd(false)
    setPhHistory([])
    measureCountRef.current = 0
    if (stirringTimerRef.current) {
      clearTimeout(stirringTimerRef.current)
      stirringTimerRef.current = null
    }
  }, [initialPH, locked])

  useEffect(() => {
    return () => {
      if (stirringTimerRef.current) clearTimeout(stirringTimerRef.current)
    }
  }, [])

  // pH trong bảng = measuredPH (lần đo cuối cùng đã xác nhận)
  const currentPhOk = measuredPH >= WT_QCVN_COLUMN_A.pH_min && measuredPH <= WT_QCVN_COLUMN_A.pH_max
  const feOk = composition.Fe <= WT_QCVN_COLUMN_A.Fe_mgPerL
  const znOk = composition.Zn <= WT_QCVN_COLUMN_A.Zn_mgPerL
  const pbOk = composition.Pb <= WT_QCVN_COLUMN_A.Pb_mgPerL
  const allOk = feOk && znOk && pbOk && currentPhOk

  const cycleDropStep = () => {
    setDropStep((d) => (d >= 10 ? 1 : d === 1 ? 2 : d === 2 ? 5 : 10))
  }

  return (
    <div className={styles.apparatus}>
      {/* Header */}
      <div className={styles.apparatusHeader}>
        <div>
          <h2>Bàn cân bằng pH</h2>
          <p>Máy khuấy từ · 2 buret NaOH/HCl 1 M · cốc 2 L đế bằng</p>
        </div>
      </div>

      {/* Stage: apparatus SVG + volume model */}
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

          {/* Burets */}
          <BuretVisual cx={BURET_NAOH_CX} color="#1f8a99" labelColor="#0e3a45" />
          <BuretVisual cx={BURET_HCL_CX} color="#b26516" labelColor="#5a3208" />

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

          {/* Liquid — fixed level, no animation */}
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
                Tổng chất thêm
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

        {/* Nút Đo pH — chỉ hoạt động sau khi khuấy */}
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
          {(['naoh', 'hcl'] as const).map((reagent) => {
            const label = reagent === 'naoh' ? 'NaOH' : 'HCl'
            return (
              <div className={styles.buretControl} key={reagent}>
                <span>{label}</span>
                <div className={styles.doseStepMenu}>
                  <button
                    type="button"
                    className={styles.doseStepTrigger}
                    onClick={cycleDropStep}
                    disabled={locked || phase === 'discharged'}
                    title="Chọn số giọt mỗi lần thêm"
                  >
                    {dropStep} giọt
                  </button>
                </div>
                <button
                  type="button"
                  className={styles.buretAdd}
                  onClick={reagent === 'naoh' ? addNaoh : addHcl}
                  disabled={locked || phase === 'discharged'}
                  title={reagent === 'naoh' ? 'Thêm NaOH' : 'Thêm HCl'}
                >
                  <PlusIcon /> <span>Thêm</span>
                </button>
              </div>
            )
          })}
        </div>
        <button
          type="button"
          className={styles.buretReset}
          onClick={reset}
          disabled={locked || phase === 'discharged'}
          title="Đặt lại pH về ban đầu"
        >
          ↺ Đặt lại
        </button>
      </div>

      {/* Data panel */}
      <section className={styles.calculationPanel} aria-label="Bảng kiểm tra cột A QCVN 40:2025">
        <div className={styles.calculationHeader}>
          <div>
            <strong>Kết quả kiểm tra</strong>
            <span className={styles.calculationHeaderNote}>Cân bằng pH trước khi thải</span>
          </div>
          <span>Đơn vị: mg/L (pH không đơn vị)</span>
        </div>

        {/* Bảng chính — dùng measuredPH */}
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

        {/* Lịch sử đo pH */}
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

        {/* Hành động — Khóa hoặc Thải */}
        {phase === 'balancing' ? (
          locked ? (
            <div className={styles.dischargeSuccess}>
              <p>✓ Đã khóa kết quả Bàn 3.</p>
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
          ) : (
            <div className={styles.dischargeActions}>
              <p className={allOk ? styles.dischargeReady : styles.dischargeNotReady}>
                {allOk
                  ? '✓ Đạt cột A — sẵn sàng khóa và thải.'
                  : '⚠ Chưa đạt cột A — cần điều chỉnh pH thêm.'}
              </p>
              <button
                type="button"
                className={styles.lockButton}
                onClick={lockResults}
                disabled={!allOk}
                title={allOk ? 'Khóa kết quả cân bằng pH' : 'Chưa đạt cột A'}
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
