'use client'

import { useId, useRef, useState, useEffect } from 'react'
import { PlayIcon, StopIcon, PlusIcon, ResetIcon } from './icons.js'
import styles from './workbench.module.css'

/**
 * Apparatus for Sample Preparation — three buret version for Fe/Zn/Pb solutions.
 *
 * Layout (top → bottom):
 *   • Top support bar carrying three metal-ion burets
 *   • Three 10 mL burets hang from the bar (Fe, Zn, Pb solutions)
 *   • Flat-bottom 2.5 L beaker sitting on a magnetic stirrer hotplate
 *   • Stir bar rotates when the stirrer is on
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

export function SamplePreparationApparatus({
  status: external,
  onAddDrop,
  onToggleStir,
  onReset,
}: {
  status?: Partial<SampleApStatus>
  onAddDrop: (solution: MetalSolution, amountMl: DropStepMl) => void
  onToggleStir: () => void
  onReset: () => void
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
  const solutionFill = hasFe ? '#F1DFA0' : '#F8FAFC'

  const [activeDrop, setActiveDrop] = useState<MetalSolution | null>(null)
  const lastAddedRef = useRef({
    fe: status.feAddedMl,
    zn: status.znAddedMl,
    pb: status.pbAddedMl,
  })

  useEffect(() => {
    const prev = lastAddedRef.current
    if (status.feAddedMl !== prev.fe) {
      setActiveDrop('fe')
    } else if (status.znAddedMl !== prev.zn) {
      setActiveDrop('zn')
    } else if (status.pbAddedMl !== prev.pb) {
      setActiveDrop('pb')
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

  const [dropSteps, setDropSteps] = useState<Record<MetalSolution, DropStepMl>>({ fe: 1, zn: 1, pb: 1 })
  const setDropStep = (solution: MetalSolution, value: string) => {
    const amount = Number(value) as DropStepMl
    if (DROP_STEPS.includes(amount)) {
      setDropSteps((current) => ({ ...current, [solution]: amount }))
    }
  }

  const totalAddedMl = feAddedMl + znAddedMl + pbAddedMl
  const mixtureLabel = hasFe && hasZn && hasPb
    ? 'Fe³⁺ + Zn²⁺ + Pb²⁺ · vàng nhạt, có thể đục'
    : hasFe && (hasZn || hasPb)
      ? 'Fe³⁺ + ion kim loại · vàng nhạt, độ trong có thể thay đổi'
      : hasZn && hasPb
        ? 'Zn²⁺ + Pb²⁺ · gần không màu, có thể đục do PbSO₄'
        : hasFe
          ? 'Fe³⁺ · vàng nhạt'
          : hasZn
            ? 'Zn²⁺ · không màu'
            : hasPb
              ? 'Pb²⁺ · không màu'
              : 'Nước cất · không màu'

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
            fillOpacity={hasFe ? '.88' : '.72'}
          />
          <ellipse
            cx={(BEAKER_LEFT_X + BEAKER_RIGHT_X) / 2}
            cy={waterY}
            rx={(BEAKER_RIGHT_X - BEAKER_LEFT_X - 4) / 2}
            ry="3.5"
            fill={hasFe ? '#f8edc9' : '#ffffff'}
            fillOpacity=".9"
            stroke="#6b8a99"
            strokeWidth="1"
          />

          <rect
            className={status.stirring ? styles.stirBarSpin : styles.stirBar}
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
          data-testid="sample-toggle-stir"
        >
          {status.stirring ? <StopIcon /> : <PlayIcon />}
          {status.stirring ? 'Dừng khuấy' : 'Bật khuấy'}
        </button>
        <div className={styles.buretControls}>
          <div className={styles.buretControl}>
            <span>Fe³⁺</span>
            <select
              aria-label="Bước thêm Fe³⁺"
              value={dropSteps.fe}
              onChange={(event) => setDropStep('fe', event.target.value)}
              disabled={feEmpty}
            >
              {DROP_STEPS.map((step) => <option key={step} value={step}>{step} mL</option>)}
            </select>
            <button
              type="button"
              className={styles.buretAdd}
              data-testid="sample-add-fe"
              onClick={() => onAddDrop('fe', dropSteps.fe)}
              disabled={feEmpty || dropSteps.fe > feRemaining}
            >
              <PlusIcon /> Thêm <span>{feEmpty ? 'Đã hết' : 'Thêm'}</span>
            </button>
          </div>
          <div className={styles.buretControl}>
            <span>Zn²⁺</span>
            <select
              aria-label="Bước thêm Zn²⁺"
              value={dropSteps.zn}
              onChange={(event) => setDropStep('zn', event.target.value)}
              disabled={znEmpty}
            >
              {DROP_STEPS.map((step) => <option key={step} value={step}>{step} mL</option>)}
            </select>
            <button
              type="button"
              className={styles.buretAdd}
              data-testid="sample-add-zn"
              onClick={() => onAddDrop('zn', dropSteps.zn)}
              disabled={znEmpty || dropSteps.zn > znRemaining}
            >
              <PlusIcon /> Thêm <span>{znEmpty ? 'Đã hết' : 'Thêm'}</span>
            </button>
          </div>
          <div className={styles.buretControl}>
            <span>Pb²⁺</span>
            <select
              aria-label="Bước thêm Pb²⁺"
              value={dropSteps.pb}
              onChange={(event) => setDropStep('pb', event.target.value)}
              disabled={pbEmpty}
            >
              {DROP_STEPS.map((step) => <option key={step} value={step}>{step} mL</option>)}
            </select>
            <button
              type="button"
              className={styles.buretAdd}
              data-testid="sample-add-pb"
              onClick={() => onAddDrop('pb', dropSteps.pb)}
              disabled={pbEmpty || dropSteps.pb > pbRemaining}
            >
              <PlusIcon /> Thêm <span>{pbEmpty ? 'Đã hết' : 'Thêm'}</span>
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
