import { type CSSProperties, type ReactNode } from 'react'
import type { SoapMixView, SoapVesselView } from '@/application/scenarios/soap-projection.js'
import styles from './apparatus.module.css'

const BEAKER = 'M38 42H142V211Q90 231 38 211Z'
const BOTTOM = 221
const MAX_HEIGHT = 148

export const SOAP_COLORS = { water: '#8ecae6', lye: '#6da8b5', oil: '#caa35d', mix: '#e6d8a6' } as const

export type SoapLayer = { color: string; share: number }
export type SoapVesselCue = 'hand' | 'machine' | null

/** Bottom-to-top liquid layers for a vessel: dense lye under oil, one cream layer once stirred. */
export function layersOf(vessel: SoapVesselView, mix: SoapMixView | null): SoapLayer[] {
  if (vessel.volumeMl <= 0) return []
  if (vessel.id === 'M' && mix?.stirred) return [{ color: SOAP_COLORS.mix, share: 1 }]
  const lyeShare = vessel.lyeMl / vessel.volumeMl
  const oilShare = vessel.oilMl / vessel.volumeMl
  const layers: SoapLayer[] = []
  if (vessel.hasWater) layers.push({ color: vessel.hasLye ? SOAP_COLORS.lye : SOAP_COLORS.water, share: lyeShare })
  if (oilShare > 0) layers.push({ color: SOAP_COLORS.oil, share: oilShare })
  return layers
}

/** Major volume ticks for a cup of the given capacity (mL). */
function graduationMarks(capacityMl: number): number[] {
  const step = capacityMl <= 400 ? 50 : capacityMl <= 800 ? 100 : 200
  const marks: number[] = []
  for (let ml = step; ml < capacityMl - step / 2; ml += step) marks.push(ml)
  return marks
}

type BeakerProps = {
  uid: string
  fill: number
  layers: SoapLayer[]
  solid: boolean
  /** Animates the liquid between two fractions of the drawn height (pour scenes). */
  level?: { from: number; to: number } | undefined
  broken?: boolean
  /** When set, draw ticks scaled to this cup capacity (mL). */
  capacityMl?: number
  children?: ReactNode
}

/** Glass beaker in the 180 × 250 drawing frame shared by every cup scene. */
export function Beaker({ uid, fill, layers, solid, level, broken = false, capacityMl, children }: BeakerProps) {
  const height = Math.max(solid ? 10 : 0, fill * MAX_HEIGHT)
  const surfaceY = BOTTOM - height
  const top = layers.at(-1)?.color ?? SOAP_COLORS.water
  const rects = layers.map((layer, index) => {
    const below = layers.slice(0, index).reduce((sum, item) => sum + item.share, 0)
    const h = height * layer.share
    return <rect key={index} x="20" y={BOTTOM - height * below - h} width="140" height={h + 0.5} fill={layer.color} opacity=".92"/>
  })
  const levelStyle = level ? { '--lvl-from': level.from, '--lvl-to': level.to } as CSSProperties : undefined
  const ticks = capacityMl && capacityMl > 0 ? graduationMarks(capacityMl) : []
  return <g>
    <defs>
      <linearGradient id={uid + 'glass'} x1="0" x2="1">
        <stop stopColor="#f9fdff" stopOpacity=".94"/>
        <stop offset=".35" stopColor="#e6f0f5" stopOpacity=".35"/>
        <stop offset=".8" stopColor="#fff" stopOpacity=".7"/>
        <stop offset="1" stopColor="#cadfe9" stopOpacity=".65"/>
      </linearGradient>
      <clipPath id={uid + 'clip'}><path d={BEAKER}/></clipPath>
    </defs>
    <ellipse cx="90" cy="238" rx="60" ry="6" fill="#8aa0ad" opacity=".14"/>
    {broken && <ellipse className={styles.puddle} cx="90" cy="236" rx="84" ry="10" fill={top} opacity=".5"/>}
    <g className={broken ? styles.brokenGlass : undefined}>
      <path d={BEAKER} fill={'url(#' + uid + 'glass)'} stroke="#7398ab" strokeWidth="1.7"/>
      <g clipPath={'url(#' + uid + 'clip)'}>
        {height > 0 && <g className={level ? styles.level : undefined} style={levelStyle}>{rects}</g>}
        {height > 0 && layers.length > 0 && !level && <path d={'M24 ' + surfaceY + 'Q90 ' + (surfaceY + 4) + ' 156 ' + surfaceY} fill="none" stroke="#376f7b" strokeWidth="1.3"/>}
        {solid && <g fill="#eef3f6" stroke="#8aa0ad" strokeWidth=".6">
          {[0, 1, 2, 3, 4, 5].map((i) => <ellipse key={i} cx={50 + (i % 3) * 28} cy={BOTTOM - 8 - Math.floor(i / 3) * 8} rx="8" ry="4"/>)}
        </g>}
        {height > 12 && <path d="M47 58v133" stroke="white" opacity=".8" strokeWidth="4" fill="none" strokeLinecap="round"/>}
      </g>
      <ellipse cx="90" cy="42" rx="52" ry="4" fill="none" stroke="#7e9eaf" strokeWidth="1.4"/>
      {ticks.length > 0 && capacityMl && <g className={styles.graduations}>
        {ticks.map((ml) => {
          const gy = BOTTOM - ml / capacityMl * MAX_HEIGHT
          return <g key={ml}><path d={'M118 ' + gy + 'h14'}/><text x="116" y={gy + 3} textAnchor="end">{ml}</text></g>
        })}
        <text x="90" y="31" textAnchor="middle">mL</text>
      </g>}
      <path d={BEAKER} fill="none" stroke="#6e93a5" strokeWidth="1.6"/>
      {broken && <g className={styles.cracks} fill="none" stroke="#2f5566" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path pathLength="1" d="M70 44 L82 88 L66 120 L88 150 L74 186 L92 214"/>
        <path pathLength="1" d="M82 88 L112 104 L104 140"/>
        <path pathLength="1" d="M88 150 L118 168"/>
      </g>}
    </g>
    {broken && <g className={styles.shards} fill="#dcecf3" stroke="#7398ab" strokeWidth="1.2" strokeLinejoin="round">
      <path d="M150 220l14-10 8 14z"/>
      <path d="M26 224l-12-6 6 12z"/>
      <path d="M126 232l10-4 2 9z"/>
    </g>}
    {children}
  </g>
}

export function SoapVesselArt({ vessel, mix = null, compact = false, cue = null }: {
  vessel: SoapVesselView
  mix?: SoapMixView | null
  compact?: boolean
  cue?: SoapVesselCue
}) {
  // Stable across SSR/client; avoid useId so gradient ids never mismatch on hydrate.
  const uid = 'soap-' + vessel.id + (compact ? '-c' : '-f')
  const layers = layersOf(vessel, mix)
  const surfaceY = BOTTOM - Math.max(vessel.hasSolidNaoh ? 10 : 0, vessel.fill * MAX_HEIGHT)
  return <svg viewBox="0 0 180 250" aria-hidden="true" className={styles.vesselArt}>
    <Beaker uid={uid} fill={vessel.fill} layers={layers} solid={vessel.hasSolidNaoh && !vessel.hasWater}
      broken={vessel.broken} {...(compact ? {} : { capacityMl: vessel.capacityMl })}>
      {!compact && (cue === 'hand' || cue === 'machine') && <g>
        {cue === 'hand'
          ? <g className={styles.spoon}><path d="M108 28 L78 150" stroke="#8a6a3a" strokeWidth="4" strokeLinecap="round"/><ellipse cx="74" cy="162" rx="14" ry="8" fill="#c4a06a" stroke="#8a6a3a"/></g>
          : <g className={styles.impeller}><path d="M90 18 V168" stroke="#5a7383" strokeWidth="3"/><path d="M68 150 H112" stroke="#5a7383" strokeWidth="5" strokeLinecap="round"/></g>}
        <ellipse className={styles.swirl} cx="90" cy={Math.min(surfaceY + 28, 170)} rx="28" ry="8" fill="none" stroke="#376f7b" strokeWidth="1.5"/>
      </g>}
    </Beaker>
  </svg>
}
