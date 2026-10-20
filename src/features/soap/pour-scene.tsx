import type { SoapProjection } from '@/application/scenarios/soap-projection.js'
import type { SoapStirMode, SoapVesselId } from '@/domain/experiments/soap/model.js'
import { Beaker, SOAP_COLORS, layersOf, type SoapLayer } from './vessel-art.js'
import { GloveHand, MoldScene } from './mold-art.js'
import styles from './apparatus.module.css'

type PourCup = { layers: SoapLayer[]; solid: boolean; from: number; to: number }
export type SoapPourCue = { kind: 'pour'; source: PourCup; target: PourCup | null }
export type SoapCue = { seq: number } & (SoapPourCue | { kind: 'stir'; mode: SoapStirMode } | { kind: 'unmold' })

const STREAM = { naoh: '#dfe8ee' } as const

function synthetic(color: string, solid = false): PourCup {
  return { layers: solid ? [] : [{ color, share: 1 }], solid, from: 0.8, to: 0.55 }
}

function viewOf(p: SoapProjection, id: SoapVesselId) {
  return p.vessels.find((item) => item.id === id)!
}

/** A source cup is drawn as it was before the pour, a target cup as it is after. */
function cupOf(id: SoapVesselId, before: SoapProjection, after: SoapProjection, side: 'source' | 'target'): PourCup {
  const shownIn = side === 'source' ? before : after
  const shown = viewOf(shownIn, id)
  return {
    layers: layersOf(shown, shownIn.mix),
    solid: shown.hasSolidNaoh && !shown.hasWater,
    from: viewOf(before, id).fill,
    to: viewOf(after, id).fill,
  }
}

function makePourCue(
  type: string,
  parameters: Record<string, string | number | boolean>,
  before: SoapProjection,
  after: SoapProjection,
): SoapPourCue | null {
  const real = (source: SoapVesselId, target: SoapVesselId): SoapPourCue => ({
    kind: 'pour',
    source: cupOf(source, before, after, 'source'),
    target: target === 'D' ? null : cupOf(target, before, after, 'target'),
  })
  const fromSynthetic = (source: PourCup, target: SoapVesselId): SoapPourCue =>
    ({ kind: 'pour', source, target: cupOf(target, before, after, 'target') })
  switch (type) {
    case 'pour_water': return fromSynthetic(synthetic(SOAP_COLORS.water), 'W')
    case 'pour_naoh': return fromSynthetic(synthetic(STREAM.naoh, true), 'W')
    case 'pour_oil': return fromSynthetic(synthetic(SOAP_COLORS.oil), 'O')
    case 'pour_to_mix': return real(parameters.from === 'O' ? 'O' : 'W', 'M')
    case 'return_to_source': return real('M', parameters.to === 'O' ? 'O' : 'W')
    case 'pour_to_mold': return real('M', 'D')
    default: return null
  }
}

/** Builds the animation for a committed action from the projections before and after it, or null when it has none. */
export function makeSoapCue(
  seq: number,
  type: string,
  parameters: Record<string, string | number | boolean>,
  before: SoapProjection,
  after: SoapProjection,
): SoapCue | null {
  if (type === 'stir') return { seq, kind: 'stir', mode: parameters.mode === 'hand' ? 'hand' : 'machine' }
  if (type === 'unmold') return { seq, kind: 'unmold' }
  const pour = makePourCue(type, parameters, before, after)
  return pour && { seq, ...pour }
}

function levelOf(cup: PourCup) {
  const top = Math.max(cup.from, cup.to)
  return { fill: top, level: top > 0 ? { from: cup.from / top, to: cup.to / top } : undefined }
}

const GLOVE = 'translate(50 120) rotate(90)'

/** Gloved hand tilts the source cup over the target, liquid streams across and levels change. */
export function PourScene({ cue }: { cue: SoapPourCue & { seq: number } }) {
  const uid = 'soap-pour-' + cue.seq
  const source = levelOf(cue.source)
  const target = cue.target ? levelOf(cue.target) : null
  const color = cue.source.solid ? STREAM.naoh : cue.source.layers.at(-1)?.color ?? SOAP_COLORS.water
  return <svg viewBox="0 0 360 260" aria-hidden="true" className={styles.pourScene}>
    <g transform="translate(190 6) scale(.9)">
      {cue.target && target
        ? <Beaker uid={uid + 't'} fill={target.fill} layers={cue.target.layers} solid={cue.target.solid} level={target.level}/>
        : <g transform="translate(5 100) scale(.5)">
          <MoldScene stage="empty" uid={uid + 'me'}/>
          <g className={styles.fadeIn}><MoldScene stage="poured" uid={uid + 'mp'}/></g>
        </g>}
    </g>
    <path className={styles.pourStream} pathLength="1" d={'M236 38Q248 58 ' + (cue.target ? '247 150' : '252 136')}
      fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"/>
    <g transform="translate(14 22) scale(.9)">
      <g className={styles.pourTilt}>
        <Beaker uid={uid + 's'} fill={source.fill} layers={cue.source.layers} solid={cue.source.solid} level={source.level}/>
        <g transform={GLOVE}><GloveHand/></g>
      </g>
    </g>
  </svg>
}
