'use client'

import { useId, useRef, useState, useEffect, type CSSProperties } from 'react'
import { PlayIcon, StopIcon, PlusIcon, ResetIcon } from './icons.js'
import styles from './workbench.module.css'

/**
 * Apparatus for Water Treatment — magnetic stirrer version.
 *
 * Layout (top → bottom):
 *   • Top support bar (buret stand rack) carrying NaOH/HCl name tags
 *   • Two 50 mL burets hang from the bar, tips pointing into the beaker
 *   • Flat-bottom 2 L beaker sitting on a magnetic stirrer hotplate
 *   • Stir bar (nam châm khuấy) rests inside the beaker on the flat floor
 *     and rotates when the stirrer is on; the hotplate under the beaker
 *     drives it.
 *
 * Geometry is qualitative; pH, dose and buret state are tracked by the
 * session and reflected here.
 */
export type AcidBase = 'naoh' | 'hcl'

export type ApStatus = {
  pH: number
  volumeMl: number
  stirring: boolean
  naohAddedMl: number
  hclAddedMl: number
}

const BEAKER_CAPACITY_ML = 2000
const BEAKER_LEFT_X = 130
const BEAKER_RIGHT_X = 250
const BEAKER_TOP_Y = 252
const BEAKER_BOTTOM_Y = 425
const BEAKER_HEIGHT = BEAKER_BOTTOM_Y - BEAKER_TOP_Y

const BURET_CAPACITY = 50
const BURET_BODY_TOP = 36
const BURET_BODY_BOTTOM = 240
const BURET_BODY_HEIGHT = BURET_BODY_BOTTOM - BURET_BODY_TOP
const BURET_WIDTH = 22
const BURET_NAOH_CX = 152
const BURET_HCL_CX = 228

const STIRRER_CX = 190

const INITIAL_STATUS: ApStatus = {
  pH: 5.4,
  volumeMl: 1000,
  stirring: false,
  naohAddedMl: 0,
  hclAddedMl: 0,
}

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

function Buret({
  uid, color, lightColor, deepColor, cx, label, topY, remainingMl, isDripping, remainingDisplay,
}: {
  uid: string
  color: string
  lightColor: string
  deepColor: string
  cx: number
  label: string
  topY: number
  remainingMl: number
  isDripping: boolean
  remainingDisplay: string
}) {
  const leftX = cx - BURET_WIDTH / 2
  const rightX = cx + BURET_WIDTH / 2
  const liqTopY = buretLiquidTopY(remainingMl)
  const empty = remainingMl <= 0
  return <g aria-label={label}>
    {/* Clamp that grips the buret to the support bar */}
    <rect x={cx - 8} y={topY - 4} width="16" height="8" rx="1.5" fill="#5d7682" stroke="#2c4654" strokeWidth=".6" />
    {/* Cap on top of buret */}
    <path d={'M' + (leftX - 2) + ' ' + (topY + 4) + ' h' + (BURET_WIDTH + 4) + ' v6 h-' + (BURET_WIDTH + 4) + ' Z'} fill="#a7bcc8" stroke="#7591a0" strokeWidth=".6" />
    <rect x={cx - 1.5} y={topY + 2} width="3" height="3" fill="#7591a0" />

    {/* Body tube */}
    <rect x={leftX} y={BURET_BODY_TOP} width={BURET_WIDTH} height={BURET_BODY_HEIGHT} fill={'url(#' + uid + 'glass)'} stroke="#8da9b8" strokeWidth="1.4" />
    {/* Liquid inside */}
    {!empty && <g clipPath={'url(#' + uid + 'fill' + cx + ')'}>
      <rect x={leftX} y={liqTopY} width={BURET_WIDTH} height={BURET_BODY_BOTTOM - liqTopY} fill={color} />
      <ellipse cx={cx} cy={liqTopY + 1} rx={BURET_WIDTH / 2 - 1} ry="1.5" fill={lightColor} />
      <ellipse cx={cx} cy={liqTopY + 2} rx={BURET_WIDTH / 2 - 2} ry="1" fill={deepColor} opacity=".75" />
    </g>}

    {/* Tick marks: 0 at top → 50 at bottom */}
    {Array.from({ length: 11 }, (_, i) => {
      const ml = i * 5
      const y = buretTickY(ml)
      const major = i % 2 === 0
      return <g key={ml}>
        <line x1={rightX} x2={rightX + (major ? 7 : 4)} y1={y} y2={y} stroke="#365964" strokeWidth={major ? .9 : .5} />
        {major && <text x={rightX + 9} y={y + 2.5} fontSize="6.5" fill="#365964">{ml}</text>}
      </g>
    })}
    <text x={leftX - 1} y={BURET_BODY_TOP - 2} fontSize="6" fill="#365964" textAnchor="end">mL</text>

    {/* Stopcock */}
    <rect x={leftX - 3} y={BURET_BODY_BOTTOM} width={BURET_WIDTH + 6} height="9" rx="1" fill="#456475" stroke="#2c4654" strokeWidth=".6" />
    <circle cx={cx} cy={BURET_BODY_BOTTOM + 4.5} r="3" fill="#2c4654" stroke="#1a2c36" strokeWidth=".4" />
    <line x1={cx - 4} x2={cx + 4} y1={BURET_BODY_BOTTOM + 4.5} y2={BURET_BODY_BOTTOM + 4.5} stroke="#a7bcc8" strokeWidth=".6" />

    {/* Delivery tip — extends down INTO the beaker */}
    <path d={'M' + (cx - 3) + ' ' + (BURET_BODY_BOTTOM + 9) + ' h6 v18 h-6 Z'} fill="#9bb0bc" stroke="#365964" strokeWidth=".5" />
    {!empty && <path d={'M' + (cx - 1.5) + ' ' + (BURET_BODY_BOTTOM + 11) + ' v14'} stroke={color} strokeWidth="2" />}

    {/* Falling drop + stream when user just clicked +1 */}
    {isDripping && !empty && <g>
      <path d={'M' + cx + ' ' + (BURET_BODY_BOTTOM + 27) + ' v4'} stroke={color} strokeWidth="2.5" strokeLinecap="round" className={styles.dripStream} />
      <circle cx={cx} cy={BURET_BODY_BOTTOM + 32} r="2.8" fill={color} className={styles.dropFall} />
    </g>}

    {/* Remaining volume readout on the side (rack name plate shows the buret identity) */}
    <text x={rightX + 6} y={BURET_BODY_TOP + 10} fontSize="6.5" fill="#365964">{remainingDisplay}</text>
  </g>
}

export function WaterTreatmentApparatus({
  status: external,
  onAddDrop,
  onToggleStir,
  onReset,
}: {
  status?: Partial<ApStatus>
  onAddDrop: (reagent: AcidBase) => void
  onToggleStir: () => void
  onReset: () => void
}) {
  const uid = useId().replaceAll(':', '')
  const status: ApStatus = { ...INITIAL_STATUS, ...external }
  const waterY = volumeY(status.volumeMl)
  const liquidDepth = BEAKER_BOTTOM_Y - waterY

  // Buret remaining volume — wrap after draining a full buret
  const wrapMod = (n: number) => n % (BURET_CAPACITY + 1)
  const naohRemaining = BURET_CAPACITY - wrapMod(status.naohAddedMl)
  const hclRemaining = BURET_CAPACITY - wrapMod(status.hclAddedMl)
  const naohEmpty = naohRemaining <= 0
  const hclEmpty = hclRemaining <= 0

  // Animation trigger: brief drop when added
  const [activeDrop, setActiveDrop] = useState<{ reagent: AcidBase; tick: number } | null>(null)
  const lastAdded = useRef({ naoh: status.naohAddedMl, hcl: status.hclAddedMl })
  useEffect(() => {
    if (status.naohAddedMl !== lastAdded.current.naoh) {
      setActiveDrop({ reagent: 'naoh', tick: Date.now() })
    } else if (status.hclAddedMl !== lastAdded.current.hcl) {
      setActiveDrop({ reagent: 'hcl', tick: Date.now() })
    }
    lastAdded.current = { naoh: status.naohAddedMl, hcl: status.hclAddedMl }
  }, [status.naohAddedMl, status.hclAddedMl])
  useEffect(() => {
    if (!activeDrop) return
    const t = setTimeout(() => setActiveDrop(null), 800)
    return () => clearTimeout(t)
  }, [activeDrop])

  return <div className={styles.apparatus}>
    <div className={styles.apparatusHeader}>
      <div>
        <h2>Bàn xử lý nước</h2>
        <p>Máy khuấy từ · 2 buret NaOH/HCl 1 M · cốc 2 L đế bằng</p>
      </div>
    </div>

    <div className={styles.apparatusStage} aria-label="Bàn thí nghiệm với máy khuấy từ, cốc 2L đế bằng và hai buret treo phía trên">
      <svg viewBox="0 0 380 470" className={styles.apparatusSvg} role="img" aria-label="Sơ đồ bàn xử lý nước: hai buret NaOH và HCl 1M treo trên giá, máy khuấy từ dưới đáy cốc, cốc 2L đế bằng ở giữa">
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
          <clipPath id={uid + 'fill' + BURET_NAOH_CX}>
            <rect x={BURET_NAOH_CX - BURET_WIDTH / 2} y={buretLiquidTopY(naohRemaining)} width={BURET_WIDTH} height={BURET_BODY_BOTTOM - buretLiquidTopY(naohRemaining)} />
          </clipPath>
          <clipPath id={uid + 'fill' + BURET_HCL_CX}>
            <rect x={BURET_HCL_CX - BURET_WIDTH / 2} y={buretLiquidTopY(hclRemaining)} width={BURET_WIDTH} height={BURET_BODY_BOTTOM - buretLiquidTopY(hclRemaining)} />
          </clipPath>
        </defs>

        {/* Top support bar (buret stand rack) */}
        <rect x="20" y="6" width="340" height="12" rx="2" fill={'url(#' + uid + 'steel)'} />
        <rect x="18" y="6" width="344" height="2" fill="#dde8ee" />
        {/* Rack name plates for the burets */}
        <g>
          <rect x={BURET_NAOH_CX - 32} y="4" width="64" height="14" rx="2" fill={'url(#' + uid + 'bar)'} stroke="#557586" strokeWidth=".6" />
          <text x={BURET_NAOH_CX} y="14.5" textAnchor="middle" fontSize="8.5" fill="#0e3a45" fontWeight="700">NaOH 1 M</text>
        </g>
        <g>
          <rect x={BURET_HCL_CX - 28} y="4" width="56" height="14" rx="2" fill={'url(#' + uid + 'bar)'} stroke="#557586" strokeWidth=".6" />
          <text x={BURET_HCL_CX} y="14.5" textAnchor="middle" fontSize="8.5" fill="#5a3208" fontWeight="700">HCl 1 M</text>
        </g>
        {/* End posts */}
        <rect x="18" y="18" width="6" height="14" fill={'url(#' + uid + 'steel)'} />
        <rect x="356" y="18" width="6" height="14" fill={'url(#' + uid + 'steel)'} />

        {/* NaOH buret (left) */}
        <Buret
          uid={uid} cx={BURET_NAOH_CX} topY={26}
          color="#1f8a99" lightColor="#75c3d0" deepColor="#1a6e7a"
          label="NaOH 1 M" remainingMl={naohRemaining}
          isDripping={activeDrop?.reagent === 'naoh'}
          remainingDisplay={naohRemaining + ' mL'}
        />

        {/* HCl buret (right) */}
        <Buret
          uid={uid} cx={BURET_HCL_CX} topY={26}
          color="#b26516" lightColor="#e3a14d" deepColor="#8a4d10"
          label="HCl 1 M" remainingMl={hclRemaining}
          isDripping={activeDrop?.reagent === 'hcl'}
          remainingDisplay={hclRemaining + ' mL'}
        />

        {/* Beaker — FLAT BOTTOM, slight rounding on top edges */}
        <path d={'M' + BEAKER_LEFT_X + ' ' + (BEAKER_TOP_Y + 4) + ' Q' + BEAKER_LEFT_X + ' ' + BEAKER_TOP_Y + ' ' + (BEAKER_LEFT_X + 4) + ' ' + BEAKER_TOP_Y + ' H' + (BEAKER_RIGHT_X - 4) + ' Q' + BEAKER_RIGHT_X + ' ' + BEAKER_TOP_Y + ' ' + BEAKER_RIGHT_X + ' ' + (BEAKER_TOP_Y + 4) + ' V' + BEAKER_BOTTOM_Y + ' H' + BEAKER_LEFT_X + ' Z'} fill={'url(#' + uid + 'glass)'} stroke="#557586" strokeWidth="2" />
        {/* Spout lips */}
        <path d={'M' + (BEAKER_LEFT_X - 1) + ' ' + (BEAKER_TOP_Y - 1) + ' l-6 -3 l7 -2'} fill="none" stroke="#8da9b8" strokeWidth="1.4" strokeLinecap="round" />
        <path d={'M' + (BEAKER_RIGHT_X + 1) + ' ' + (BEAKER_TOP_Y - 1) + ' l6 -3 l-7 -2'} fill="none" stroke="#8da9b8" strokeWidth="1.4" strokeLinecap="round" />

        {/* Liquid — flat bottom */}
        <path d={'M' + (BEAKER_LEFT_X + 2) + ' ' + waterY + ' H' + (BEAKER_RIGHT_X - 2) + ' V' + (BEAKER_BOTTOM_Y - 1) + ' H' + (BEAKER_LEFT_X + 2) + ' Z'} fill="#bcd5e0" fillOpacity=".78" />
        <ellipse cx={(BEAKER_LEFT_X + BEAKER_RIGHT_X) / 2} cy={waterY} rx={(BEAKER_RIGHT_X - BEAKER_LEFT_X - 4) / 2} ry="3.5" fill="#dceaf1" stroke="#6b8a99" strokeWidth="1" />

        {/* Stir bar (nam châm khuấy) — sits on the flat bottom, spins when stirring */}
        {status.volumeMl > 50 && liquidDepth > 6 && <g>
          <rect
            className={status.stirring ? styles.stirBarSpin : styles.stirBar}
            x={STIRRER_CX - 22} y={BEAKER_BOTTOM_Y - 9} width="44" height="6" rx="3"
            fill="#e6ebee" stroke="#7e8a92" strokeWidth=".6"
            data-testid="wt-stirbar"
          />
          <rect x={STIRRER_CX - 18} y={BEAKER_BOTTOM_Y - 8.5} width="36" height="1.4" rx=".7" fill="#f4f7f9" pointerEvents="none" />
        </g>}

        {/* Glass highlights */}
        <path d={'M' + (BEAKER_LEFT_X + 6) + ' ' + (BEAKER_TOP_Y + 18) + ' v140'} stroke="#fff" strokeWidth="3" strokeOpacity=".75" />
        <path d={'M' + (BEAKER_RIGHT_X - 6) + ' ' + (BEAKER_TOP_Y + 18) + ' v140'} stroke="#afc9d4" strokeWidth="1.2" strokeOpacity=".5" />

        {/* Beaker graduations — every 200 mL */}
        {Array.from({ length: 10 }, (_, i) => {
          const ml = (i + 1) * 200
          const y = volumeY(ml)
          const major = (i + 1) % 2 === 0
          return <g key={ml}>
            <line x1={major ? BEAKER_LEFT_X - 8 : BEAKER_LEFT_X - 4} x2={BEAKER_LEFT_X - 1} y1={y} y2={y} stroke="#365964" strokeWidth={major ? 1 : .55} />
            {major && <text x={BEAKER_LEFT_X - 10} y={y + 2.5} textAnchor="end" fontSize="6.5" fill="#365964">{ml}</text>}
          </g>
        })}
        <text x={BEAKER_LEFT_X - 10} y={BEAKER_TOP_Y - 2} textAnchor="end" fontSize="6" fill="#365964">mL</text>

        {/* Magnetic stirrer hotplate — sits UNDER the beaker bottom */}
        <rect x="70" y="430" width="240" height="22" rx="3" fill={'url(#' + uid + 'platform)'} stroke="#557586" strokeWidth="1" />
        <rect x="70" y="430" width="240" height="2" fill="#e7eff4" />
        {/* Vent slots on the platform */}
        {Array.from({ length: 6 }, (_, i) => <rect key={'vent' + i} x={120 + i * 14} y={446} width="9" height="2" rx="1" fill="#5d7682" opacity=".55" />)}
        {/* Power indicator */}
        <g>
          <circle cx="92" cy="441" r="4.5" fill={status.stirring ? '#cc7a1e' : '#456475'} className={status.stirring ? styles.indicatorOn : undefined} />
          <text x="92" y="459" textAnchor="middle" fontSize="5.5" fill="#365964">Power</text>
        </g>
        {/* Speed dial */}
        <g>
          <circle cx="288" cy="441" r="6" fill="#3f576a" stroke="#1a2c36" strokeWidth=".6" />
          <line x1="288" y1="441" x2="288" y2="437" stroke="#dde8ee" strokeWidth="1" strokeLinecap="round" transform={'rotate(' + (status.stirring ? 90 : 0) + ' 288 441)'} className={status.stirring ? undefined : undefined} />
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
        data-testid="wt-toggle-stir"
      >
        {status.stirring ? <StopIcon /> : <PlayIcon />}
        {status.stirring ? 'Dừng khuấy' : 'Bật khuấy'}
      </button>
      <div className={styles.buretControls}>
        <button type="button" className={styles.buretAdd} data-testid="wt-add-naoh" onClick={() => onAddDrop('naoh')}>
          <PlusIcon /> NaOH <span>{naohEmpty ? 'Đã hết' : '+1 mL'}</span>
        </button>
        <button type="button" className={styles.buretAdd} data-testid="wt-add-hcl" onClick={() => onAddDrop('hcl')}>
          <PlusIcon /> HCl <span>{hclEmpty ? 'Đã hết' : '+1 mL'}</span>
        </button>
        <button type="button" className={styles.buretReset} onClick={onReset} aria-label="Đặt lại bàn thực hành">
          <ResetIcon /> Đặt lại
        </button>
      </div>
    </div>

    <p className={styles.apparatusNote}>Mực buret, tốc độ khuấy và pH chỉ mang tính minh họa; giá trị thật lưu ở bảng dưới.</p>
  </div>
}