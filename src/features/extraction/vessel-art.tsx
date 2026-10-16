import { useId, type CSSProperties } from 'react'
import type { ExtractionProjection } from '@/application/scenarios/extraction-projection.js'
import { EXTRACTION_PROFILE } from '@/domain/experiments/acid-base-extraction/model.js'
import { liquidLayout, radiusAtY, volumeY } from './vessel-geometry.js'
import styles from './apparatus.module.css'

export { liquidLayout } from './vessel-geometry.js'
export type VisibleVessel = ExtractionProjection['vessels'][number]
const GRADUATIONS = [25, 50, 100, 150, 200, EXTRACTION_PROFILE.capacityMl]

/** Colors identify phases; solids never reveal hidden A/B/N amounts. */
export function VesselArt({ vessel, previous, compact = false, motion = 'idle', showCapacity = true }: {
  vessel: VisibleVessel; previous?: VisibleVessel | undefined; compact?: boolean; motion?: string; showCapacity?: boolean
}) {
  const uid = useId(), funnel = vessel.id === 'F', flask = vessel.id.startsWith('R'), waste = vessel.id === 'W'
  const shape = funnel ? 'M48 38H132Q145 100 111 152L97 176V201H83V176L69 152Q35 100 48 38Z'
    : flask ? 'M74 35H106V77L145 194Q153 219 133 224H47Q27 219 35 194L74 77Z'
    : waste ? 'M71 32H109V61L128 85V213Q128 225 115 225H65Q52 225 52 213V85L71 61Z'
    : 'M38 42H142V211Q90 231 38 211Z'
  const { bottom, height, water, organic } = liquidLayout(vessel), before = liquidLayout(previous ?? vessel)
  const changing = !!previous && ['transfer', 'pouring', 'receiving', 'add_reagent', 'filter', 'evaporate', 'dry'].includes(motion)
  const maxWater = Math.max(water, changing ? before.water : 0), maxOrganic = Math.max(organic, changing ? before.organic : 0)
  const maxMixed = Math.max(height, changing ? before.height : 0)
  const layerStyle = (start: number, end: number, max: number, base: number, shift = 0): CSSProperties => ({
    '--phase-start-scale': max ? start / max : 0, '--phase-end-scale': max ? end / max : 0,
    '--phase-start-shift': shift + 'px', transformOrigin: '0px ' + base + 'px',
  } as CSSProperties)
  const surfaceStyle = (shift: number) => ({ '--surface-start-shift': shift + 'px' } as CSSProperties)
  const layered = vessel.separated || vessel.waterMl === 0 || vessel.organicMl === 0
  const pouring = motion === 'pouring'
  const lipX = funnel ? 132 : flask ? 106 : waste ? 109 : 142
  const lipY = funnel ? 38 : flask ? 35 : waste ? 32 : 42
  const fluidX = pouring ? -180 : 25, fluidWidth = pouring ? 440 : 130
  return <svg viewBox="0 0 180 250" aria-hidden="true" className={styles.vesselArt} data-vessel-art={vessel.id} data-volume-ml={vessel.waterMl + vessel.organicMl}>
    <defs>
      <linearGradient id={uid + 'glass'} x1="0" x2="1"><stop stopColor="#f9fdff" stopOpacity=".94"/><stop offset=".35" stopColor="#e6f0f5" stopOpacity=".35"/><stop offset=".8" stopColor="#fff" stopOpacity=".7"/><stop offset="1" stopColor="#cadfe9" stopOpacity=".65"/></linearGradient>
      <linearGradient id={uid + 'water'} x1="0" x2="1"><stop stopColor="#74afb9"/><stop offset=".5" stopColor="#a6d2d5"/><stop offset="1" stopColor="#65a6b2"/></linearGradient>
      <linearGradient id={uid + 'organic'} x1="0" x2="1"><stop stopColor="#d5ad62"/><stop offset=".5" stopColor="#ecd49b"/><stop offset="1" stopColor="#c4a164"/></linearGradient>
      <clipPath id={uid + 'clip'}><path d={shape}/></clipPath>
    </defs>
    <ellipse cx="90" cy="238" rx="60" ry="6" fill="#8aaab9" opacity=".12"/>
    <g className={styles.vesselMotion} data-motion={motion}>
      <path d={shape} fill={'url(#' + uid + 'glass)'} stroke="#7398ab" strokeWidth="1.7"/>
      <g clipPath={'url(#' + uid + 'clip)'}>
        <g className={pouring ? styles.gravityLiquid : undefined} style={pouring ? {transformOrigin:lipX+'px '+lipY+'px','--gravity-level-shift':(lipY-bottom)+'px'} as CSSProperties : undefined}>
        {maxMixed > 0 && (layered ? <>
          {maxWater > 0 && <rect className={changing ? styles.layerChanging : undefined} style={changing ? layerStyle(before.water, water, maxWater, bottom) : undefined} data-phase="aqueous" data-volume-ml={vessel.waterMl} x={fluidX} y={bottom - maxWater} width={fluidWidth} height={maxWater} fill={'url(#' + uid + 'water)'}/>}
          {maxOrganic > 0 && <rect className={changing ? styles.layerChanging : undefined} style={changing ? layerStyle(before.organic, organic, maxOrganic, bottom - water, water - before.water) : undefined} data-phase="organic" data-volume-ml={vessel.organicMl} x={fluidX} y={bottom - water - maxOrganic} width={fluidWidth} height={maxOrganic} fill={'url(#' + uid + 'organic)'}/>}
        </> : <>
          <rect className={changing ? styles.layerChanging : undefined} style={changing ? layerStyle(before.height, height, maxMixed, bottom) : undefined} x={fluidX} y={bottom - maxMixed} width={fluidWidth} height={maxMixed} fill="#a6beb5"/>
          {!changing && <g fill="#e5cd98" opacity=".65">{[0, 1, 2, 3, 4, 5].map(i => <ellipse key={i} cx={58 + i % 3 * 29} cy={bottom - height * (.3 + Math.floor(i / 3) * .4)} rx="6" ry="3"/>)}</g>}
        </>)}
        {maxMixed > 0 && <g transform={'translate(0 ' + (bottom - height) + ')'} data-meniscus="total" data-level-y={bottom - height}>
          <path className={changing ? styles.surfaceChanging : undefined} style={changing ? surfaceStyle(height - before.height) : undefined} d={pouring?'M-180 0H260':'M25 0Q90 4 155 0'} fill="none" stroke={layered && organic > 0 ? '#967032' : '#376f7b'} strokeWidth="1.4"/>
        </g>}
        {layered && maxWater > 0 && maxOrganic > 0 && <g transform={'translate(0 ' + (bottom - water) + ')'} data-meniscus="boundary" data-level-y={bottom - water}>
          <path className={changing ? styles.surfaceChanging : undefined} style={changing ? surfaceStyle(water - before.water) : undefined} d={pouring?'M-180 0H260':'M25 0H155'} fill="none" stroke="#567d7a" strokeWidth="1.1"/>
        </g>}
        {vessel.solidPresent && <g data-solid={vessel.dry ? 'dry' : 'wet'} className={styles.solidBed} fill={vessel.dry ? '#ede6d6' : '#d0c7b0'} stroke="#8e8266" strokeWidth=".7">{Array.from({ length: 12 }, (_, i) => <ellipse key={i} cx={funnel ? 80 + i % 4 * 7 : 53 + i % 6 * 14} cy={bottom - 3 - Math.floor(i / 6) * 4} rx="7" ry="3"/>)}</g>}
        {height > 0 && <path className={styles.swirl} d={'M51 ' + (bottom - height * .55) + 'q38-8 78 0m-73 ' + Math.min(14, height * .2) + 'q34 8 68 0'} fill="none" stroke="white" strokeWidth="2"/>}
        {motion === 'mix' && height > 0 && <g className={styles.mixingEddies} fill="none" stroke="#f1ffff" strokeWidth="1.4">{[0, 1, 2].map(n => <ellipse key={n} cx="90" cy={bottom - height * (.3 + n * .23)} rx={22 + n * 5} ry="5" style={{ animationDelay: n * .13 + 's' }}/>)}</g>}
        {motion === 'settle' && height > 0 && <rect className={styles.mixedVeil} x="25" y={bottom - height} width="130" height={height} fill="#a6beb5"/>}
        </g>
        <path d={funnel ? 'M59 52q-3 48 17 83' : flask ? 'M80 47v31l-35 116' : waste ? 'M62 92v111' : 'M47 58v133'} stroke="white" opacity=".8" strokeWidth="4" fill="none" strokeLinecap="round"/>
      </g>
      {!compact && <g className={styles.graduations}>{GRADUATIONS.map(ml => {
        const y = volumeY(vessel.id, ml), edge = 90 + radiusAtY(vessel.id, y)
        return <g key={ml} data-graduation={ml} data-level-y={y}><path d={'M' + (edge - 12) + ' ' + y + 'h9'}/>{ml !== 25 && <text x={edge - 15} y={y + 2.6} textAnchor="end">{ml}</text>}</g>
      })}<text x="90" y="31" textAnchor="middle">mL</text></g>}
      <path d={shape} fill="none" stroke="#6e93a5" strokeWidth="1.6"/>
      {funnel ? <>
        <g className={styles.stopper}><rect x="77" y="24" width="26" height="14" rx="3" fill="#e7f1f5" stroke="#8cabb9"/><path d="M82 13h16v11H82Z" fill="#a9c0cc" stroke="#7494a6"/></g>
        <rect x="78" y="201" width="24" height="10" rx="3" fill="#d4e5ec" stroke="#7398ab"/>
        <path className={styles.stopcock} d="M72 206h36" stroke="#007b80" strokeWidth="4" strokeLinecap="round"/><circle cx="90" cy="206" r="3" fill="#005f68"/>
        <path d="M86 211v19h8v-19" fill="#edf6f8" stroke="#7398ab"/>
      </> : waste ? <><rect x="68" y="23" width="44" height="11" rx="3" fill="#7394a5"/><rect x="62" y="113" width="56" height="45" rx="3" fill="white" opacity=".85"/><text x="90" y="143" textAnchor="middle" fill="#546d7c" fontSize="21" fontWeight="650">W</text></> : <ellipse cx="90" cy={flask ? 35 : 42} rx={flask ? 19 : 54} ry="4" fill="none" stroke="#7e9eaf" strokeWidth="1.4"/>}
    </g>
    {!compact && showCapacity && <text x="90" y="247" textAnchor="middle" fontSize="8" fill="#486878">Dung tích {EXTRACTION_PROFILE.capacityMl} mL</text>}
  </svg>
}
