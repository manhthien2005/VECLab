'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { TreatmentCalculation, FilterHistoryEntry } from './apparatus.js'
import { WT_QCVN_COLUMN_A } from './constants.js'
import { PlayIcon, StopIcon, PlusIcon } from './icons.js'
import styles from './workbench.module.css'

/** Số giọt NaOH / HCl để chuyển 1 đơn vị pH */
const DROPS_PER_PH_UNIT = 8

interface DischargeApparatusProps {
  initialPH: number
  calculation: TreatmentCalculation
  filterHistory: FilterHistoryEntry[]
  onDischarge: () => void
  phase: 'balancing' | 'discharged'
}

// ─── Fixed apparatus geometry (matching Bàn 2 apparatus.tsx) ───────────────────
// Buret body ABOVE beaker, tip ENTERS beaker top, hotplate BELOW beaker.
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

// Magnetic stirrer hotplate (UNDER the beaker bottom, no overlap)
const PLATFORM_LEFT_X = 70
const PLATFORM_RIGHT_X = 310
const PLATFORM_WIDTH = PLATFORM_RIGHT_X - PLATFORM_LEFT_X // 240
const PLATFORM_TOP_Y = BEAKER_BOTTOM_Y + 5 // 430 — 5 px gap below beaker
const PLATFORM_HEIGHT = 22

const uid = 'discharge'

function liquidDepthForPH(ph: number, maxDepth: number): number {
  // pH càng thấp (acid) thì mực nước thấp hơn một chút để phản ánh thể tích thêm
  const phFactor = ph < 6 ? 0.5 : ph > 9 ? 0.65 : 0.58
  return Math.max(6, Math.min(maxDepth - 12, maxDepth * phFactor))
}

/**
 * Simplified Buret visual — matches Bàn 2 (apparatus.tsx) style.
 * No fill-state tracking; shows tick marks and delivery tip.
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
      {/* Clamp that grips the buret to the support bar */}
      <rect x={cx - 8} y={BURET_BODY_TOP - 10} width="16" height="8" rx="1.5" fill="#5d7682" stroke="#2c4654" strokeWidth=".6" />
      {/* Cap on top of buret */}
      <path d={`M${leftX - 2} ${BURET_BODY_TOP - 6} h${BURET_WIDTH + 4} v6 h-${BURET_WIDTH + 4} Z`} fill="#a7bcc8" stroke="#7591a0" strokeWidth=".6" />
      <rect x={cx - 1.5} y={BURET_BODY_TOP - 4} width="3" height="3" fill="#7591a0" />

      {/* Body tube — glass gradient fill */}
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

      {/* Delivery tip — extends down INTO the beaker */}
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
  const [pH, setpH] = useState(initialPH)
  const [naohMl, setNaohMl] = useState(0)
  const [hclMl, setHclMl] = useState(0)
  const [stirring, setStirring] = useState(false)
  const [dropStep, setDropStep] = useState<number>(1)

  const stirringTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const toggleStir = useCallback(() => {
    setStirring((prev) => {
      const next = !prev
      if (next && stirringTimerRef.current) {
        clearTimeout(stirringTimerRef.current)
        stirringTimerRef.current = null
      }
      return next
    })
    if (stirringTimerRef.current) {
      clearTimeout(stirringTimerRef.current)
      stirringTimerRef.current = null
    } else {
      stirringTimerRef.current = setTimeout(() => setStirring(false), 8000)
    }
  }, [])

  const addNaoh = useCallback(() => {
    const drops = dropStep
    const ml = (drops / 60) * dropStep
    setpH((p) => Math.min(14, p + drops / DROPS_PER_PH_UNIT))
    setNaohMl((m) => m + ml)
  }, [dropStep])

  const addHcl = useCallback(() => {
    const drops = dropStep
    const ml = (drops / 60) * dropStep
    setpH((p) => Math.max(0, p - drops / DROPS_PER_PH_UNIT))
    setHclMl((m) => m + ml)
  }, [dropStep])

  const reset = useCallback(() => {
    setpH(initialPH)
    setNaohMl(0)
    setHclMl(0)
    setStirring(false)
    if (stirringTimerRef.current) {
      clearTimeout(stirringTimerRef.current)
      stirringTimerRef.current = null
    }
  }, [initialPH])

  useEffect(() => {
    return () => {
      if (stirringTimerRef.current) clearTimeout(stirringTimerRef.current)
    }
  }, [])

  const composition = calculation.filtrate_mgPerL
  const feOk = composition.Fe <= WT_QCVN_COLUMN_A.Fe_mgPerL
  const znOk = composition.Zn <= WT_QCVN_COLUMN_A.Zn_mgPerL
  const pbOk = composition.Pb <= WT_QCVN_COLUMN_A.Pb_mgPerL
  const phOk = pH >= WT_QCVN_COLUMN_A.pH_min && pH <= WT_QCVN_COLUMN_A.pH_max
  const allOk = feOk && znOk && pbOk && phOk

  // SVG liquid level
  const maxLiquidDepth = BEAKER_HEIGHT * 0.75
  const liquidDepth = liquidDepthForPH(pH, maxLiquidDepth)
  const liquidTopY = BEAKER_BOTTOM_Y - liquidDepth

  // pH status color
  const pHColor =
    pH < 6 ? '#c62828' : pH > 9 ? '#e65100' : '#2e7d32'

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
        {/* SVG apparatus — geometry matching Bàn 2 (apparatus.tsx) */}
        <svg viewBox="0 0 380 470" className={styles.apparatusSvg} role="img" aria-label="Sơ đồ bàn cân bằng pH: hai buret NaOH và HCl 1M treo trên giá, máy khuấy từ dưới đáy cốc, cốc 2L đế bằng ở giữa">
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

          {/* Top support bar (buret stand rack) */}
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

          {/* NaOH Buret — body ABOVE beaker, tip ENTERS beaker */}
          <BuretVisual cx={BURET_NAOH_CX} color="#1f8a99" labelColor="#0e3a45" />

          {/* HCl Buret — body ABOVE beaker, tip ENTERS beaker */}
          <BuretVisual cx={BURET_HCL_CX} color="#b26516" labelColor="#5a3208" />

          {/* Beaker — FLAT BOTTOM (matching Bàn 2) */}
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

          {/* Liquid — flat bottom, elliptical surface */}
          <path
            d={`M${BEAKER_LEFT_X + 2} ${liquidTopY}
               H${BEAKER_RIGHT_X - 2} V${BEAKER_BOTTOM_Y - 1} H${BEAKER_LEFT_X + 2} Z`}
            fill="#29b6c5" fillOpacity=".25"
          />
          <ellipse cx={BEAKER_CENTER_X} cy={liquidTopY} rx={(BEAKER_RIGHT_X - BEAKER_LEFT_X - 4) / 2} ry="3.5" fill="#29b6c5" stroke="#6b8a99" strokeWidth="1" />

          {/* pH readout inside beaker */}
          <text x={BEAKER_CENTER_X} y={liquidTopY + 22} textAnchor="middle" fontSize="12" fontWeight="750" fill={pHColor}>
            pH {pH.toFixed(2)}
          </text>
          {/* pH status */}
          <text x={BEAKER_CENTER_X} y={liquidTopY + 38} textAnchor="middle" fontSize="9.5" fontWeight="650" fill={pHColor}>
            {phOk ? '✓ Đạt cột A' : pH < 6 ? '⚠ Cần tăng pH' : '⚠ Cần giảm pH'}
          </text>

          {/* Stir bar — inside the beaker when stirring */}
          {stirring && (
            <rect
              x={BEAKER_CENTER_X - 18} y={BEAKER_BOTTOM_Y - 8}
              width="36" height="6" rx="3"
              fill="#e6ebee" stroke="#7e8a92" strokeWidth=".6"
            />
          )}

          {/* Magnetic stirrer hotplate — BELOW the beaker (no overlap) */}
          <rect x={PLATFORM_LEFT_X} y={PLATFORM_TOP_Y} width={PLATFORM_WIDTH} height={PLATFORM_HEIGHT} rx="3" fill={`url(#${uid}platform)`} stroke="#557586" strokeWidth="1" />
          <rect x={PLATFORM_LEFT_X} y={PLATFORM_TOP_Y} width={PLATFORM_WIDTH} height="2" fill="#e7eff4" />
          {/* Vent slots */}
          {Array.from({ length: 6 }, (_, i) => (
            <rect key={'vent' + i} x={120 + i * 14} y={PLATFORM_TOP_Y + 16} width="9" height="2" rx="1" fill="#5d7682" opacity=".55" />
          ))}
          {/* Power indicator */}
          <circle cx="92" cy={PLATFORM_TOP_Y + 11} r="4.5" fill={stirring ? '#cc7a1e' : '#456475'} className={stirring ? styles.indicatorOn : undefined} />
          <text x="92" y={PLATFORM_TOP_Y + 29} textAnchor="middle" fontSize="5.5" fill="#365964">Power</text>
          {/* Speed dial */}
          <circle cx="288" cy={PLATFORM_TOP_Y + 11} r="6" fill="#3f576a" stroke="#1a2c36" strokeWidth=".6" />
          <line x1="288" y1={PLATFORM_TOP_Y + 11} x2="288" y2={PLATFORM_TOP_Y + 7} stroke="#dde8ee" strokeWidth="1" strokeLinecap="round" />
          <circle cx="288" cy={PLATFORM_TOP_Y + 11} r="1.2" fill="#a7bcc8" />
          <text x="288" y={PLATFORM_TOP_Y + 29} textAnchor="middle" fontSize="5.5" fill="#365964">Tốc độ</text>
          {/* Label */}
          <text x={BEAKER_CENTER_X} y={PLATFORM_TOP_Y + 34} textAnchor="middle" fontSize="7.5" fill="#365964" fontWeight="650">Máy khuấy từ</text>
        </svg>

        {/* Volume model (read-only) */}
        <div className={styles.volumeModel}>
          <div className={styles.volumeModelHeader}>
            <strong>Thể tích trong cốc</strong>
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
                pH
              </span>
              <span className={styles.volumeModelValue}>{pH.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls bar */}
      <div className={styles.apparatusControls}>
        <button
          type="button"
          className={styles.stirButton}
          data-active={stirring}
          onClick={toggleStir}
          disabled={phase === 'discharged'}
          data-testid="wt-toggle-stir"
        >
          {stirring ? <StopIcon /> : <PlayIcon />}
          {stirring ? 'Dừng khuấy' : 'Bật khuấy'}
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
                    disabled={phase === 'discharged'}
                    title="Chọn số giọt mỗi lần thêm"
                  >
                    {dropStep} giọt
                  </button>
                </div>
                <button
                  type="button"
                  className={styles.buretAdd}
                  onClick={reagent === 'naoh' ? addNaoh : addHcl}
                  disabled={phase === 'discharged'}
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
          disabled={phase === 'discharged'}
          title="Đặt lại pH về ban đầu"
        >
          ↺ Đặt lại
        </button>
      </div>

      {/* Data table */}
      <section className={styles.calculationPanel} aria-label="Bảng kiểm tra cột A QCVN 40:2025">
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
                <th scope="col">Kết quả (mg/L)</th>
                <th scope="col">Cột A (mg/L)</th>
                <th scope="col">Đạt</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Fe</th>
                <td>{composition.Fe.toFixed(6)}</td>
                <td>≤ {WT_QCVN_COLUMN_A.Fe_mgPerL}</td>
                <td className={feOk ? styles.pass : styles.fail}>{feOk ? '✓' : '✗'}</td>
              </tr>
              <tr>
                <th scope="row">Zn</th>
                <td>{composition.Zn.toFixed(6)}</td>
                <td>≤ {WT_QCVN_COLUMN_A.Zn_mgPerL}</td>
                <td className={znOk ? styles.pass : styles.fail}>{znOk ? '✓' : '✗'}</td>
              </tr>
              <tr>
                <th scope="row">Pb</th>
                <td>{composition.Pb.toFixed(6)}</td>
                <td>≤ {WT_QCVN_COLUMN_A.Pb_mgPerL}</td>
                <td className={pbOk ? styles.pass : styles.fail}>{pbOk ? '✓' : '✗'}</td>
              </tr>
              <tr>
                <th scope="row">pH</th>
                <td>{pH.toFixed(2)}</td>
                <td>{WT_QCVN_COLUMN_A.pH_min}–{WT_QCVN_COLUMN_A.pH_max}</td>
                <td className={phOk ? styles.pass : styles.fail}>{phOk ? '✓' : '✗'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Filter history from Bàn 2 */}
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
                    <td>{entry.calculation.filtrate_mgPerL.Fe.toFixed(6)}</td>
                    <td>{entry.calculation.filtrate_mgPerL.Zn.toFixed(6)}</td>
                    <td>{entry.calculation.filtrate_mgPerL.Pb.toFixed(6)}</td>
                    <td>{entry.cumulativeFiltered?.Fe.toFixed(6) ?? '—'}</td>
                    <td>{entry.cumulativeFiltered?.Zn.toFixed(6) ?? '—'}</td>
                    <td>{entry.cumulativeFiltered?.Pb.toFixed(6) ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Discharge action */}
        {phase === 'balancing' ? (
          <div className={styles.dischargeActions}>
            <p className={allOk ? styles.dischargeReady : styles.dischargeNotReady}>
              {allOk
                ? '✓ Đạt cột A — sẵn sàng thải ra môi trường.'
                : '⚠ Chưa đạt cột A — cần điều chỉnh pH thêm.'}
            </p>
            <button
              type="button"
              className={styles.primary}
              onClick={onDischarge}
              disabled={!allOk}
              title={allOk ? 'Thải nước đã xử lý ra môi trường' : 'Kết quả chưa đạt cột A'}
            >
              Thải ra môi trường
            </button>
          </div>
        ) : (
          <div className={styles.dischargeSuccess}>
            <p>✓ Đã thải nước đã xử lý ra môi trường.</p>
          </div>
        )}
      </section>
    </div>
  )
}
