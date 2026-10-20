import type { SoapMoldStage } from '@/domain/experiments/soap/model.js'
import styles from './apparatus.module.css'

export type SoapBarTone = 'fresh' | 'gel' | 'cured'

const TONES: Record<SoapBarTone, { front: string; top: string; side: string; line: string }> = {
  fresh: { front: '#efe0b4', top: '#f8edc9', side: '#d8c68e', line: '#c9b57a' },
  gel: { front: '#e3cc8e', top: '#eedba6', side: '#c9b072', line: '#b89a5c' },
  cured: { front: '#f1e2bd', top: '#faf1d6', side: '#dccba0', line: '#cdb98a' },
}

const BAR = { w: 120, h: 40, dx: 24, dy: -18 }

/** A cut bar of soap drawn as a small prism, origin at its front-left-top corner. */
export function SoapBarArt({ tone = 'cured', uid }: { tone?: SoapBarTone; uid: string }) {
  const c = TONES[tone]
  const { w, h, dx, dy } = BAR
  return <g>
    <defs>
      <linearGradient id={uid + 'front'} x1="0" y1="0" x2="0" y2="1">
        <stop stopColor={c.front}/>
        <stop offset="1" stopColor={c.side}/>
      </linearGradient>
      <linearGradient id={uid + 'top'} x1="0" y1="0" x2="1" y2="0">
        <stop stopColor={c.top}/>
        <stop offset="1" stopColor={c.front}/>
      </linearGradient>
    </defs>
    <ellipse cx={w / 2 + dx / 2} cy={h + 6} rx={w / 2 + 14} ry="6" fill="#6f5a35" opacity=".18"/>
    <path d={`M${w} 0L${w + dx} ${dy}V${h + dy}L${w} ${h}Z`} fill={c.side} stroke={c.line} strokeWidth="1.2" strokeLinejoin="round"/>
    <rect x="0" y="0" width={w} height={h} rx="6" fill={'url(#' + uid + 'front)'} stroke={c.line} strokeWidth="1.2"/>
    <path d={`M3 0L${3 + dx} ${dy}H${w + dx}L${w} 0Z`} fill={'url(#' + uid + 'top)'} stroke={c.line} strokeWidth="1.2" strokeLinejoin="round"/>
    <path d={`M${w * 0.22} ${dy * 0.55}q${w * 0.2} ${dy * 0.5} ${w * 0.42} 0t${w * 0.34} 0`} fill="none" stroke={c.line} strokeWidth="1" opacity=".55" strokeLinecap="round"/>
    <ellipse cx={w * 0.5} cy={h * 0.52} rx="26" ry="9" fill="none" stroke={c.line} strokeWidth="1.2" opacity=".6"/>
    <path d={`M${w * 0.5 - 12} ${h * 0.52}h24`} stroke={c.line} strokeWidth="1.2" opacity=".6" strokeLinecap="round"/>
    <rect x="6" y="5" width={w - 12} height="3.5" rx="1.75" fill="#fff" opacity=".42"/>
  </g>
}

/** Nitrile glove seen from the side, origin at the knuckles. */
export function GloveHand({ className }: { className?: string | undefined }) {
  return <g className={className}>
    <rect x="-8" y="26" width="44" height="22" rx="7" fill="#e6f0f7" stroke="#8fb3c9" strokeWidth="1.3"/>
    <path d="M-6 28Q-12 4 2 -2L30 -2Q44 4 38 28Z" fill="#59a6dc" stroke="#2f6f9f" strokeWidth="1.4" strokeLinejoin="round"/>
    {[0, 1, 2, 3].map((i) => <rect key={i} x={-3 + i * 10} y="-18" width="9" height="24" rx="4.5" fill="#59a6dc" stroke="#2f6f9f" strokeWidth="1.3"/>)}
    <path d="M-6 14Q-22 10 -20 -2Q-18 -12 -8 -4" fill="#59a6dc" stroke="#2f6f9f" strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M6 -10V4M16 -10V4" stroke="#fff" opacity=".35" strokeWidth="2" strokeLinecap="round"/>
  </g>
}

const STAGE_TONE: Record<Exclude<SoapMoldStage, 'empty'>, SoapBarTone> = {
  poured: 'fresh', gelled: 'gel', unmolded: 'gel', cured: 'cured',
}

type MoldSceneProps = { stage: SoapMoldStage; uid: string; cue?: boolean }

/** Silicone mold with batter inside, or a bar lifted out onto the tray once unmolded. Drawn in a 340 × 230 frame. */
export function MoldScene({ stage, uid, cue = false }: MoldSceneProps) {
  const outside = stage === 'unmolded' || stage === 'cured'
  const inside = stage === 'poured' || stage === 'gelled'
  const tone = stage === 'empty' ? 'fresh' : STAGE_TONE[stage]
  return <g>
    <defs>
      <linearGradient id={uid + 'mold'} x1="0" y1="0" x2="0" y2="1">
        <stop stopColor="#f6e6c9"/>
        <stop offset="1" stopColor="#e2c89a"/>
      </linearGradient>
    </defs>
    <ellipse cx="170" cy="204" rx="150" ry="9" fill="#7a8c97" opacity=".14"/>
    <rect x="198" y="186" width="130" height="10" rx="5" fill="#d5dde3" stroke="#aebdc7" strokeWidth="1.2"/>
    <path d="M174 124L198 100V160L174 184Z" fill="#dcc08c" stroke="#b8894c" strokeWidth="1.5" strokeLinejoin="round"/>
    <rect x="22" y="124" width="152" height="60" rx="10" fill={'url(#' + uid + 'mold)'} stroke="#b8894c" strokeWidth="1.6"/>
    <path d="M32 124L56 100H198L174 124Z" fill="#c9a97a" stroke="#b8894c" strokeWidth="1.5" strokeLinejoin="round"/>
    {inside && <path d="M40 121L60 105H190L170 121Z" fill={TONES[tone].top} stroke={TONES[tone].line} strokeWidth="1"/>}
    {inside && <path d="M62 112H170" stroke="#fff" opacity=".5" strokeWidth="3" strokeLinecap="round"/>}
    <path d="M34 140H162" stroke="#fff" opacity=".35" strokeWidth="3" strokeLinecap="round"/>
    {outside && <g transform="translate(204 150)">
      <g className={cue ? styles.barOut : undefined}>
        <SoapBarArt tone={tone} uid={uid}/>
        {cue && <g className={styles.hands}>
          <g transform="translate(-6 36) rotate(90)"><GloveHand/></g>
          <g transform="translate(150 36) rotate(-90)"><GloveHand/></g>
        </g>}
      </g>
    </g>}
  </g>
}

export function SoapMoldArt({ stage, cue = false, compact = false }: { stage: SoapMoldStage; cue?: boolean; compact?: boolean }) {
  const uid = 'soap-mold' + (compact ? '-c' : cue ? '-cue' : '-f')
  return <svg viewBox="0 0 340 230" aria-hidden="true" className={styles.moldArt}>
    <MoldScene stage={stage} uid={uid} cue={cue}/>
  </svg>
}