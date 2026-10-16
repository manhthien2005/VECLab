import { useId } from 'react'
import type { ExtractionProjection } from '@/application/scenarios/extraction-projection.js'
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
const fmt = (value: number) => value.toLocaleString('vi-VN', { maximumFractionDigits: 2 })
const mouthY = (id: VesselId) => id === 'F' ? 38 : id.startsWith('R') ? 35 : id === 'W' ? 32 : 42
const lipX = (id: VesselId) => id === 'F' ? 132 : id.startsWith('R') ? 106 : id === 'W' ? 109 : 142

function Stream({ path, color, adding = false }: { path: string; color: string; adding?: boolean }) {
  return <g>
    <path data-testid={adding ? 'extraction-add-stream' : 'extraction-liquid-stream'} className={styles.liquidStream}
      d={path} pathLength="1" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round"/>
    <path className={styles.flowHighlights} d={path} pathLength="1" fill="none" stroke="#f3ffff" strokeWidth="1.5" strokeLinecap="round"/>
  </g>
}

function TransferScene({ vessels, motion }: { vessels: readonly VisibleVessel[]; motion: ExtractionMotion }) {
  const source = vessels.find(v => v.id === motion.from)!, target = vessels.find(v => v.id === motion.to)!
  const beforeSource = motion.previous.find(v => v.id === source.id), beforeTarget = motion.previous.find(v => v.id === target.id)
  // The upper organic layer is poured from the mouth; the lower water layer uses the tap.
  const drain = source.id === 'F' && (motion.phase === 'aqueous' || motion.phase === 'all' && !source.organicMl && !beforeSource?.organicMl)
  const color = motion.phase === 'organic' || !beforeSource?.waterMl ? '#ad8848' : '#438b9b'
  const phaseName = drain ? 'Thu dịch qua khóa phễu' : motion.phase === 'aqueous' ? 'Rót pha nước' : motion.phase === 'organic' ? 'Rót pha hữu cơ từ miệng' : 'Chuyển toàn mẫu'
  const sourceMouth = 95 + mouthY(source.id) * 236 / 250, sourceLip = 110 + lipX(source.id) * 170 / 180
  const targetMouth = (drain ? 220 : 139) + mouthY(target.id) * 222 / 250
  const path = drain ? 'M280 181V' + targetMouth : 'M'+sourceLip+' ' + sourceMouth + 'Q327 ' + (sourceMouth + 3) + ' 405 ' + targetMouth
  return <svg viewBox="0 -25 560 455" aria-hidden="true" className={styles.sceneArt + ' ' + styles.transferArt} data-testid="extraction-transfer-scene" data-transfer-method={drain ? 'stopcock' : 'pour'}>
    <ellipse cx="280" cy={drain ? 411 : 351} rx="185" ry="9" fill="#dce8ee" opacity=".55"/>
    {drain && <g stroke="#9cb6c4" strokeWidth="6" fill="none"><path d="M174 18V218M174 75H220"/><path d="M145 220H207" strokeWidth="10" strokeLinecap="round"/></g>}
    <g data-vessel={source.id}>
      <g className={drain ? undefined : styles.pouringVessel} style={drain ? undefined : { transformOrigin: sourceLip+'px ' + sourceMouth + 'px' }}>
        <svg x={drain ? 205 : 110} y={drain ? -10 : 95} width={drain ? 150 : 170} height={drain ? 208 : 236}>
          <VesselArt vessel={source} previous={beforeSource} motion={drain ? 'transfer' : 'pouring'} showCapacity={false}/>
        </svg>
      </g>
    </g>
    <g data-vessel={target.id}><svg x={drain ? 200 : 325} y={drain ? 220 : 139} width="160" height="222">
      <VesselArt vessel={target} previous={beforeTarget} motion="receiving" showCapacity={false}/>
    </svg></g>
    <Stream path={path} color={color}/>
    <g className={styles.receiverRipple} fill="none" stroke={color}><ellipse cx={drain ? 280 : 405} cy={targetMouth + 5} rx="12" ry="3"/></g>
    <g className={styles.sceneLabels}>
      <text x={drain ? 380 : 105} y={drain ? 75 : 380} className={styles.diagramTitle}>{source.id} → {target.id}</text>
      <text x={drain ? 380 : 105} y={drain ? 97 : 400}>{phaseName}</text>
      <text x={drain ? 380 : 325} y={drain ? 317 : 378} className={styles.diagramTitle}>{target.id} · {fmt(target.waterMl + target.organicMl)} mL</text>
      <text x={drain ? 380 : 105} y={drain ? 122 : 420}>{source.id} còn {fmt(source.waterMl + source.organicMl)} mL</text>
    </g>
  </svg>
}

function FilterScene({ vessels, motion }: { vessels: readonly VisibleVessel[]; motion: ExtractionMotion }) {
  const source = vessels.find(v => v.id === motion.from)!, target = vessels.find(v => v.id === motion.to)!
  const hold = target.waterMl - (motion.previous.find(v => v.id === target.id)?.waterMl ?? target.waterMl)
  return <svg viewBox="0 0 560 370" aria-hidden="true" className={styles.sceneArt} data-testid="extraction-filter-scene">
    <path d="M70 326H490" stroke="#ccdde6" strokeWidth="1.5"/>
    <svg x="55" y="65" width="175" height="243"><VesselArt vessel={source} previous={motion.previous.find(v => v.id === source.id)} motion="filter" showCapacity={false}/></svg>
    <svg x="325" y="93" width="175" height="243"><VesselArt vessel={target} previous={motion.previous.find(v => v.id === target.id)} motion="receiving" showCapacity={false}/></svg>
    <g><path d="M378 99H447L422 133V147H404V133Z" fill="#edf4f7" stroke="#7c9aa9" strokeWidth="1.6"/><path d="M385 105H440L413 131Z" fill="#fffdf7" stroke="#bbb19a"/><path d="M390 109H435" stroke="#aa9674" strokeWidth="5" strokeLinecap="round"/></g>
    <path className={styles.solidTransfer} d="M180 90Q279 24 406 97" fill="none" stroke="#998568" strokeWidth="3" strokeDasharray="4 7"/>
    <path d="m395 87 12 10-15 4" fill="none" stroke="#998568" strokeWidth="2"/>
    <g className={styles.sceneLabels}>
      <text x="66" y="340" className={styles.diagramTitle}>Dịch lọc giữ ở {source.id}</text>
      <text x="66" y="359">{fmt(source.waterMl + source.organicMl)} mL dịch còn lại</text>
      <text x="330" y="340" className={styles.diagramTitle}>Thu rắn ẩm → {target.id}</text>
      <text x="330" y="359">Dịch lưu: {fmt(hold)} mL</text>
      <text x="259" y="43" textAnchor="middle">Thu chất rắn trên giấy lọc</text>
    </g>
  </svg>
}

export function MotionScene({ vessel, vessels, motion, reading }: {
  vessel: VisibleVessel; vessels: readonly VisibleVessel[]; motion: ExtractionMotion | null
  reading?: ExtractionProjection['readings'][number] | undefined
}) {
  const uid = useId(), operation = motion?.type ?? 'idle'
  if (motion?.to && operation === 'transfer') return <TransferScene vessels={vessels} motion={motion}/>
  if (motion?.to && operation === 'filter') return <FilterScene vessels={vessels} motion={motion}/>
  const previous = motion?.previous.find(v => v.id === vessel.id), liquid = liquidLayout(vessel), total = vessel.waterMl + vessel.organicMl
  const adding = operation === 'add_reagent', weighing = operation === 'measure' && motion?.kind === 'mass'
  const measuringPh = operation === 'measure' && motion?.kind === 'ph', probing = measuringPh && vessel.waterMl > 0
  const reagent = motion?.reagent === 'acid' ? 'Axit 0,1 M' : motion?.reagent === 'base' ? 'Bazơ 0,1 M' : motion?.reagent === 'solvent' ? 'Dung môi hữu cơ' : 'Nước'
  const dose = total - (previous ? previous.waterMl + previous.organicMl : total)
  const organicY = 5 + (liquid.bottom - liquid.height + liquid.organic / 2) * 280 / 250, waterY = 5 + (liquid.bottom - liquid.water / 2) * 280 / 250
  const instrument = !reading ? 'Chưa đo' : reading.value === null ? 'N/A' : fmt(reading.value) + (weighing ? ' mg' : '')
  const heating = operation === 'evaporate' || operation === 'dry'
  return <svg viewBox="0 0 560 330" aria-hidden="true" className={styles.sceneArt}>
    <defs><linearGradient id={uid + 'steel'} x1="0" x2="1"><stop stopColor="#819eae"/><stop offset=".35" stopColor="#e1edf3"/><stop offset="1" stopColor="#86a2b2"/></linearGradient></defs>
    <ellipse cx="285" cy="289" rx="160" ry="9" fill="#dce8ee" opacity=".5"/><path d="M82 292H478" stroke="#ccdde6" strokeWidth="1.5"/>
    {vessel.id === 'F' && <g><rect x="168" y="18" width="8" height="253" rx="3" fill={'url(#' + uid + 'steel)'}/><path d="M176 82H252" stroke="#8ca6b5" strokeWidth="6"/><rect x="224" y="75" width="57" height="14" rx="5" fill="#7797a9"/><rect x="143" y="273" width="168" height="11" rx="4" fill={'url(#' + uid + 'steel)'}/></g>}
    {heating && <g><rect x="240" y="276" width="107" height="25" rx="5" fill="#dae6ec" stroke="#7899a9"/><path d="M250 276H337" stroke="#678c9e" strokeWidth="5"/><circle cx="326" cy="289" r="3" fill="#b58a4d"/><text x="293" y="316" textAnchor="middle" fill="#526e7d" fontSize="12">{operation === 'dry' ? 'Loại dịch lưu trên mẫu' : 'Thu hồi dung môi hữu cơ'}</text></g>}
    <svg x="192" y="5" width="201" height="280"><VesselArt vessel={vessel} previous={previous} motion={operation} showCapacity={vessel.id!=='F'&&!weighing&&!heating}/></svg>
    {(vessel.separated || !vessel.waterMl || !vessel.organicMl) && total > 0 ? <g className={operation === 'settle' ? styles.phaseLabels : undefined} strokeWidth="1" fill="none">
      {vessel.organicMl > 0 && <><path d={'M293 ' + organicY + 'H367L397 105H437'} stroke="#a2854f"/><circle cx="293" cy={organicY} r="2.5" fill="#ad8848" stroke="none"/><text x="399" y="97" fill="#6b542c" stroke="none" fontSize="12">Hữu cơ · {fmt(vessel.organicMl)} mL</text></>}
      {vessel.waterMl > 0 && <><path d={'M293 ' + waterY + 'H367L397 203H437'} stroke="#6798a6"/><circle cx="293" cy={waterY} r="2.5" fill="#438b9b" stroke="none"/><text x="399" y="222" fill="#315e6e" stroke="none" fontSize="12">Nước · {fmt(vessel.waterMl)} mL</text></>}
    </g> : total > 0 ? <g fill="#476776" fontSize="12"><text x="399" y="143">Chưa phân lớp</text><text x="399" y="163">{fmt(total)} mL tổng dịch</text></g> : !vessel.solidPresent ? <g><path d="M347 150H390" stroke="#a2bac9"/><text x="401" y="154" fill="#617e90" fontSize="12">Bình trống · 0 mL</text></g> : <g fill="#655b43" fontSize="12"><path d="M300 248H386" stroke="#a79b81"/><text x="399" y="247">{vessel.dry ? 'Mẫu rắn đã khô' : 'Chất rắn còn ẩm'}</text></g>}
    {adding && <>
      <g className={styles.reagentBottle}><path d="M382 29H398V44L413 53V99Q413 106 405 106H375Q367 106 367 99V53L382 44Z" fill="#e7f1f4" stroke="#87a8b8" strokeWidth="1.5"/><rect className={styles.doseLiquid} x="370" y="66" width="40" height="36" rx="3" fill={motion?.reagent === 'solvent' ? '#d9bb7e' : '#83b8c2'}/><path d="M382 29H398" stroke="#6e94a5" strokeWidth="2"/><rect x="374" y="74" width="32" height="17" rx="3" fill="#f9fcfd"/><text x="390" y="86" textAnchor="middle" fontSize="8" fill="#315e6e">{fmt(dose)} mL</text></g>
      <Stream path={'M390 29Q339 24 293 ' + (5 + mouthY(vessel.id) * 280 / 250)} color={motion?.reagent === 'solvent' ? '#ad8848' : '#438b9b'} adding/>
      <g fill="#315e6e" fontSize="12"><text x="438" y="50">{reagent}</text><text x="438" y="70">Cấp {fmt(dose)} mL</text></g>
    </>}
    {heating && <g fill="none" stroke="#7f9eac" strokeWidth="2" strokeLinecap="round">{[0, 1, 2].map(n => <path key={n} className={styles.vapour} style={{ animationDelay: n * .18 + 's' }} d={'M' + (270 + n * 17) + ' 62q-10-13 0-26t0-26'}/>)}</g>}
    {operation === 'vent' && <g fill="none" stroke="#8dafbc" strokeWidth="2" strokeLinecap="round"><path className={styles.ventPuff} d="M287 21q-15-20-30-7m34 4q7-19 24-17"/><circle className={styles.ventPuff} cx="283" cy="9" r="4"/></g>}
    {probing && <g className={styles.phProbe}><path d={'M320 0V' + (waterY - 55) + 'Q320 ' + (waterY - 35) + ' 306 ' + (waterY - 22)} stroke="#607e91" strokeWidth="7" fill="none"/><path d={'M306 ' + (waterY - 22) + 'L298 ' + (waterY - 2)} stroke="#b4d4dc" strokeWidth="6"/><circle cx="298" cy={waterY} r="4" fill="#5a9ea7"/></g>}
    {weighing && <g className={styles.balanceCue}><path d="M231 273H357" stroke="#7696a8" strokeWidth="6" strokeLinecap="round"/><rect x="220" y="280" width="146" height="25" rx="6" fill="#e2edf2" stroke="#9bb5c2"/></g>}
    {(weighing || measuringPh) && <g className={styles.instrument}><rect x="413" y="254" width="137" height="55" rx="6" fill="#e1edf2" stroke="#8ca9b9"/><rect x="421" y="273" width="121" height="27" rx="3" fill="#244d5d"/><text x="481" y="267" textAnchor="middle" fill="#365c6e" fontSize="9">{weighing ? 'KHỐI LƯỢNG ĐÃ CÂN' : 'pH ĐÃ ĐO'}</text><text data-testid="extraction-instrument-reading" x="481" y="292" textAnchor="middle" fill="#eef9f6" fontSize={instrument.length > 10 ? 11 : 14}>{instrument}</text></g>}
    {!heating && <text x="293" y="317" textAnchor="middle" fill="#365c6e" fontSize="12">{vessel.id} · {fmt(total)} mL{vessel.solidPresent ? ' · Có chất rắn' : ''}</text>}
  </svg>
}
