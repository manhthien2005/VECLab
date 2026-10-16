import { useId } from 'react'
import type { VesselId } from '@/domain/experiments/acid-base-extraction/model.js'
import { VesselArt, liquidLayout, type VisibleVessel } from './vessel-art.js'
import styles from './apparatus.module.css'

/** Presentation snapshots contain only the learner-visible vessel projection. */
export type ExtractionMotion = {
  key: string
  type: string
  from: VesselId
  to: VesselId | null
  previous: readonly VisibleVessel[]
  phase: string
  reagent: string
  kind: string
}
export const EXTRACTION_MOTION_MS = 2600

function Stream({ path, color, filtering = false, adding = false }: {
  path: string; color: string; filtering?: boolean; adding?: boolean
}) {
  return <g>
    <path d={path} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" opacity=".12"/>
    <path data-testid={adding ? 'extraction-add-stream' : 'extraction-liquid-stream'} className={styles.liquidStream}
      d={path} pathLength="1" fill="none" stroke={color} strokeWidth={filtering ? 3 : 4} strokeLinecap="round"/>
    <path className={styles.flowHighlights} d={path} pathLength="1" fill="none" stroke={filtering ? '#e9e4d4' : '#f3ffff'} strokeWidth="2" strokeLinecap="round"/>
  </g>
}

function TransferScene({ vessels, motion }: { vessels: readonly VisibleVessel[]; motion: ExtractionMotion }) {
  const source = vessels.find(v => v.id === motion.from)!
  const target = vessels.find(v => v.id === motion.to)!
  const beforeSource = motion.previous.find(v => v.id === source.id)
  const beforeTarget = motion.previous.find(v => v.id === target.id)
  const filtering = motion.type === 'filter', drain = source.id === 'F' && !filtering
  const color = filtering ? '#9c947b' : motion.phase === 'organic' ? '#c1a46b' : motion.phase === 'aqueous' ? '#5598a5' : '#619ba7'
  const phaseName = filtering ? 'Thu phần rắn' : motion.phase === 'aqueous' ? 'Thu pha nước' : motion.phase === 'organic' ? 'Thu pha hữu cơ' : 'Chuyển toàn mẫu'
  const path = drain ? 'M280 181V249' : filtering ? 'M269 94C302 102 343 132 405 158' : 'M269 94C316 103 352 152 405 191'
  return <svg viewBox={drain ? '0 0 560 430' : '0 0 560 400'} aria-hidden="true" className={styles.sceneArt + ' ' + styles.transferArt} data-testid="extraction-transfer-scene">
    <ellipse cx="280" cy={drain ? 411 : 351} rx="185" ry="9" fill="#dce8ee" opacity=".55"/>
    {drain && <g stroke="#9cb6c4" strokeWidth="6" fill="none"><path d="M174 18V218M174 75H220"/><path d="M145 220H207" strokeWidth="10" strokeLinecap="round"/></g>}
    <g data-vessel={source.id} className={drain ? undefined : styles.pouringVessel}>
      <svg x={drain ? 205 : 110} y={drain ? -10 : 20} width={drain ? 150 : 170} height={drain ? 208 : 236}>
        <VesselArt vessel={source} previous={beforeSource} motion={motion.type} compact />
      </svg>
    </g>
    <g data-vessel={target.id}>
      <svg x={drain ? 200 : 325} y={drain ? 220 : 139} width="160" height="222">
        <VesselArt vessel={target} previous={beforeTarget} motion="receiving" compact/>
      </svg>
    </g>
    {filtering && <g className={styles.filterCone}><path d="M374 144H436L413 173V184H399V173Z" fill="#f8fbfc" stroke="#94adba" strokeWidth="1.5"/><path d="M380 150H430" stroke="#c6bfa9" strokeWidth="4"/><path d="M406 184V191" stroke="#9c947b" strokeWidth="3"/></g>}
    <Stream path={path} color={color} filtering={filtering}/>
    <g className={styles.receiverRipple} fill="none" stroke={color}><ellipse cx={drain ? 280 : 405} cy={drain ? 251 : 191} rx="13" ry="3"/><ellipse cx={drain ? 280 : 405} cy={drain ? 251 : 191} rx="23" ry="5" opacity=".45"/></g>
    <g className={styles.sceneLabels}>
      <text x={drain ? 385 : 102} y={drain ? 80 : 295} className={styles.diagramTitle}>{source.id} → {target.id}</text>
      <text x={drain ? 385 : 102} y={drain ? 103 : 315}>{phaseName}</text>
      <text x={drain ? 385 : 325} y={drain ? 305 : 375} className={styles.diagramTitle}>Bình nhận {target.id}</text>
      <text x={drain ? 385 : 325} y={drain ? 327 : 395}>{filtering ? 'Dịch lọc giữ ở ' + source.id : 'Nhận phần dịch đã chọn'}</text>
    </g>
  </svg>
}

export function MotionScene({ vessel, vessels, motion }: {
  vessel: VisibleVessel; vessels: readonly VisibleVessel[]; motion: ExtractionMotion | null
}) {
  const uid = useId(), operation = motion?.type ?? 'idle'
  if (motion?.to && (operation === 'transfer' || operation === 'filter')) return <TransferScene vessels={vessels} motion={motion}/>
  const previous = motion?.previous.find(v => v.id === vessel.id)
  const liquid = liquidLayout(vessel), total = vessel.waterMl + vessel.organicMl
  const adding = operation === 'add_reagent', weighing = operation === 'measure' && motion?.kind === 'mass'
  const probing = operation === 'measure' && motion?.kind === 'ph' && vessel.waterMl > 0
  const reagent = motion?.reagent === 'acid' ? 'Axit 0,1 M' : motion?.reagent === 'base' ? 'Bazơ 0,1 M' : motion?.reagent === 'solvent' ? 'Dung môi hữu cơ' : 'Nước'
  const organicY = 5 + (liquid.bottom - liquid.height + liquid.organic / 2) * 280 / 250
  const waterY = 5 + (liquid.bottom - liquid.water / 2) * 280 / 250
  return <svg viewBox="0 0 560 320" aria-hidden="true" className={styles.sceneArt}>
    <defs><linearGradient id={uid+'steel'} x1="0" x2="1"><stop stopColor="#819eae"/><stop offset=".35" stopColor="#e1edf3"/><stop offset="1" stopColor="#86a2b2"/></linearGradient></defs>
    <ellipse cx="285" cy="289" rx="160" ry="9" fill="#dce8ee" opacity=".5"/>
    <path d="M82 292H478" stroke="#ccdde6" strokeWidth="1.5"/>
    {vessel.id === 'F' && <g><rect x="168" y="18" width="8" height="253" rx="3" fill={'url(#'+uid+'steel)'}/><path d="M176 82H252" stroke="#8ca6b5" strokeWidth="6"/><rect x="224" y="75" width="57" height="14" rx="5" fill="#7797a9"/><rect x="143" y="273" width="168" height="11" rx="4" fill={'url(#'+uid+'steel)'}/></g>}
    <svg x="192" y="5" width="201" height="280"><VesselArt vessel={vessel} previous={previous} motion={operation}/></svg>
    {(vessel.separated || !vessel.waterMl || !vessel.organicMl) && total > 0 ? <g className={operation === 'settle' ? styles.phaseLabels : undefined} strokeWidth="1" fill="none">
      {vessel.organicMl > 0 && <><path d={`M293 ${organicY}H367L397 105H437`} stroke="#bfa46f"/><circle cx="293" cy={organicY} r="2.5" fill="#c7a975" stroke="none"/><text x="399" y="97" fill="#7c6744" stroke="none" fontSize="12">Pha hữu cơ</text></>}
      {vessel.waterMl > 0 && <><path d={`M293 ${waterY}H367L397 203H437`} stroke="#7cabb4"/><circle cx="293" cy={waterY} r="2.5" fill="#7cabb4" stroke="none"/><text x="399" y="222" fill="#426e7e" stroke="none" fontSize="12">Pha nước</text></>}
    </g> : total > 0 ? <text x="399" y="150" fill="#547989" fontSize="12">Chờ phân lớp</text> : !vessel.solidPresent ? <g><path d="M347 150H390" stroke="#a2bac9"/><text x="401" y="154" fill="#617e90" fontSize="12">Chưa có mẫu</text></g> : null}
    {adding && <>
      <g className={styles.reagentBottle}><rect x="369" y="17" width="40" height="65" rx="7" fill="#e5f0f4" stroke="#87a8b8" strokeWidth="1.5"/><path d="M381 17V8H397V17" fill="#b7cdd8" stroke="#87a8b8"/><rect x="373" y="39" width="32" height="23" rx="3" fill="#fff"/><path d="M380 51H399" stroke="#70a9af" strokeWidth="2"/></g>
      <Stream path={vessel.id === 'F' ? 'M354 25Q318 18 293 48' : 'M354 25Q318 38 293 54'} color={motion?.reagent === 'solvent' ? '#c1a46b' : '#5598a5'} adding/>
      <text x="379" y="24" className={styles.diagramTitle}>{reagent}</text>
    </>}
    {(operation === 'evaporate' || operation === 'dry') && <g className={styles.vapourGroup} fill="none" stroke="#87acbc" strokeWidth="2" strokeLinecap="round">{[0,1,2].map(n => <path key={n} className={styles.vapour} style={{ animationDelay: (n * .18) + 's' }} d={`M${270+n*17} 62q-10-13 0-26t0-26`}/>)}</g>}
    {operation === 'vent' && <g fill="none" stroke="#8dafbc" strokeWidth="2" strokeLinecap="round"><path className={styles.ventPuff} d="M287 21q-15-20-30-7m34 4q7-19 24-17"/><circle className={styles.ventPuff} cx="283" cy="9" r="4"/></g>}
    {probing && <g className={styles.phProbe}><path d={`M320 0V${waterY-55}Q320 ${waterY-35} 306 ${waterY-22}`} stroke="#607e91" strokeWidth="7" fill="none"/><path d={`M306 ${waterY-22}L298 ${waterY-2}`} stroke="#b4d4dc" strokeWidth="6"/><circle cx="298" cy={waterY} r="4" fill="#5a9ea7"/></g>}
    {weighing && <g className={styles.balanceCue}><path d="M231 273H357" stroke="#7696a8" strokeWidth="6" strokeLinecap="round"/><rect x="220" y="280" width="146" height="30" rx="7" fill="#e2edf2" stroke="#9bb5c2"/><rect x="269" y="287" width="50" height="15" rx="3" fill="#285363"/><path d="M278 294H310" stroke="#d3efed" strokeWidth="2"/></g>}
    {operation === 'settle' && <path className={styles.separationLine} d={`M245 ${waterY}H340`} stroke="#6ca2ac" strokeWidth="1" strokeDasharray="3 4"/>}
  </svg>
}
