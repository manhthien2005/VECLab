import { useEffect, useId, useRef, useState, type CSSProperties } from 'react'
import { JAR_CUP_IDS, JAR_PROFILE, type JarCupId } from '@/domain/experiments/jar-test/model.js'
import type { JarProjection } from '@/application/scenarios/jar-projection.js'
import styles from './workbench.module.css'

export type JarVisualCue = { id: string; actionType: string; cupId: JarCupId | null }
type Props = { projection: JarProjection; selectedCupId: JarCupId
  onSelectCup: (id: JarCupId) => void; disabled?: boolean; cue?: JarVisualCue | null
  onCueFinished: (id: string) => void }

const CAPACITY_ML = JAR_PROFILE.beakerCapacityL * 1000
const SAMPLE_ML = JAR_PROFILE.aliquotVolumeL * 1000
const LIQUID_BOTTOM = 270
// The highest graduation leaves headroom below the rim. All levels and ticks
// use the same scale; phase, dose and NTU do not change the sample's volume.
function volumeY(volumeMl: number) { return LIQUID_BOTTOM - 162 * volumeMl / CAPACITY_ML }

const PHASE_COPY = {
  setup: ['Chuẩn bị dàn cốc', 'Mẫu nước đục · ' + SAMPLE_ML + ' mL / cốc'],
  rapid: ['Khuấy nhanh', JAR_PROFILE.phases.rapid.rpm + ' rpm · ' + JAR_PROFILE.phases.rapid.durationSeconds + ' giây mô phỏng'],
  slow: ['Khuấy chậm', JAR_PROFILE.phases.slow.rpm + ' rpm · ' + JAR_PROFILE.phases.slow.durationSeconds / 60 + ' phút mô phỏng'],
  settling: ['Lắng', 'Dừng khuấy · ' + JAR_PROFILE.phases.settling.durationSeconds / 60 + ' phút mô phỏng'],
  completed: ['Lượt đã kết thúc', 'Xem lại số đo đã lưu'],
} as const

function formatNtu(value: number | null | undefined) {
  return value == null ? 'Chưa đo' : value.toLocaleString('vi-VN', { maximumFractionDigits: 4 }) + ' NTU'
}

/** Geometry and motion are qualitative. Only committed inputs determine labels. */
export function JarApparatus({ projection, selectedCupId, onSelectCup, disabled = false, cue, onCueFinished }: Props) {
  const uid = useId().replaceAll(':', '')
  const root = useRef<HTMLDivElement>(null)
  const rackScroll = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(true)
  const [documentVisible, setDocumentVisible] = useState(true)
  useEffect(() => {
    const element = root.current
    if (!element) return
    const observer = typeof IntersectionObserver === 'undefined' ? null
      : new IntersectionObserver(([entry]) => setVisible(!!entry?.isIntersecting))
    observer?.observe(element)
    const updateVisibility = () => setDocumentVisible(document.visibilityState !== 'hidden')
    updateVisibility()
    document.addEventListener('visibilitychange', updateVisibility)
    return () => { observer?.disconnect(); document.removeEventListener('visibilitychange', updateVisibility) }
  }, [])
  useEffect(() => {
    const scroll = rackScroll.current
    const selected = scroll?.querySelector<HTMLButtonElement>('[data-selected="true"]')
    if (!visible || !scroll || !selected || scroll.clientWidth === 0) return
    // Move only the rack's viewport; never scroll the page or steal keyboard focus.
    const left = selected.offsetLeft + selected.offsetWidth / 2 - scroll.clientWidth / 2
    scroll.scrollTo({ left: Math.max(0, left), behavior: 'instant' })
  }, [selectedCupId, visible])
  const stirring = projection.phase === 'rapid' || projection.phase === 'slow'
  const flocculated = projection.elapsedSeconds >= JAR_PROFILE.phases.rapid.durationSeconds + JAR_PROFILE.phases.slow.durationSeconds
  const settled = projection.elapsedSeconds >= Object.values(JAR_PROFILE.phases).reduce((sum, phase) => sum + phase.durationSeconds, 0)
  const settlingCue = cue?.actionType === 'run_phase' && projection.phase === 'settling'
  const selectedCup = projection.cups.find((entry) => entry.id === selectedCupId)
  const reading = selectedCup?.measurements.at(-1)
  const measuring = cue?.actionType === 'measure_initial' || (cue?.actionType === 'measure_final' && cue.cupId === selectedCupId)
  const [phaseTitle, phaseDescription] = PHASE_COPY[projection.phase]
  const explanation = cue ? explainAction(cue, projection) : null
  return <div ref={root} className={styles.rack} data-phase={projection.phase} data-settled={settled} data-settling-cue={settlingCue} data-animation="on" data-paused={!visible || !documentVisible}>
    <div className={styles.processStatus}><span className={styles.machineIndicator} aria-hidden="true"/>
      <div><strong>{phaseTitle}</strong><span>{phaseDescription}</span></div>
      <span className={styles.sampleCount}>{projection.cups.length} / 6 cốc</span>
    </div>
    <div ref={rackScroll} className={styles.rackScroll} tabIndex={0} aria-label="Dàn sáu cốc; cuộn ngang khi cần">
      <div className={styles.vesselGrid} role="group" aria-label="Chọn cốc thao tác">
        {JAR_CUP_IDS.map((id, index) => {
          const cup = projection.cups.find((entry) => entry.id === id)
          const selected = selectedCupId === id
          const steel = uid + id + 'steel'
          const glass = uid + id + 'glass'
          const filling = cue?.cupId === id && cue.actionType === 'prepare_cup'
          const dosing = cue?.cupId === id && cue.actionType === 'add_coagulant'
          const last = cup?.measurements.at(-1)
          const volumeMl = cup ? SAMPLE_ML : 0
          const waterY = volumeY(volumeMl)
          const liquidDepth = LIQUID_BOTTOM - waterY
          const flowTop = waterY + liquidDepth * .3
          const flowBottom = waterY + liquidDepth * .7
          return <button key={id} type="button" className={styles.vessel} data-selected={selected} data-cue={cue?.cupId === id}
            aria-pressed={selected} disabled={disabled} onClick={() => onSelectCup(id)}
            aria-describedby={uid + id + 'volume' + (cup ? ' ' + uid + id + 'parameters' : '')}
            aria-label={'Cốc ' + id + ', ' + (cup ? 'đã chuẩn bị' : 'chưa chuẩn bị') + (selected ? ', đang thao tác' : '')}>
            <svg viewBox="0 0 144 310" aria-hidden="true" className={styles.vesselDrawing}>
              <defs>
                <linearGradient id={steel}><stop stopColor="#78929f"/><stop offset=".4" stopColor="#e9f1f5"/><stop offset=".65" stopColor="#bacdd7"/><stop offset="1" stopColor="#6f8999"/></linearGradient>
                <linearGradient id={glass}><stop stopColor="#cedfe8" stopOpacity=".55"/><stop offset=".3" stopColor="#fff" stopOpacity=".08"/><stop offset=".8" stopColor="#e0edf3" stopOpacity=".12"/><stop offset="1" stopColor="#c6dbe5" stopOpacity=".5"/></linearGradient>
                <clipPath id={uid + id + 'fill'}><path d="M21 94v172q51 18 102 0V94Z"/></clipPath>
                <clipPath id={uid + id + 'source'}><path d="m108 77 10-17 15 9-10 15Z"/></clipPath>
                <clipPath id={uid + id + 'stream'}><rect x="95" y="-300" width="20" height={300 + waterY} className={filling ? styles.risingSurface : undefined} style={{ '--fill-distance': liquidDepth + 'px' } as CSSProperties}/></clipPath>
                <clipPath id={uid + id + 'shaft'}><rect x="25" y="61" width="94" height="212"/></clipPath>
              </defs>
              {index === 0 && <rect x="5" y="52" width="7" height="235" rx="3" fill={'url(#' + steel + ')'} />}
              {index === 5 && <rect x="132" y="52" width="7" height="235" rx="3" fill={'url(#' + steel + ')'} />}
              <rect x="-8" y="32" width="160" height="28" fill="#c0d0da"/>
              <path d="M-8 33h160M-8 58h160" stroke="#809eaf" strokeWidth="1.5"/>
              <path d="M-8 36h160" stroke="#e9f1f5" strokeWidth="2"/>
              <rect x="59" y="7" width="26" height="28" rx="5" fill={'url(#' + steel + ')'} stroke="#8097a5"/>
              <path d="M64 12v16m5-16v16m6-16v16m5-16v16" stroke="#8299a7" strokeWidth="1"/>
              <rect x="64" y="60" width="16" height="10" rx="3" fill="#607e90"/>
              <path d="M18 93v175q54 19 108 0V93" fill={'url(#' + glass + ')'} stroke={selected ? '#48888e' : '#8da9b8'} strokeWidth="1.8"/>
              {cup && <g clipPath={'url(#' + uid + id + 'fill)'} data-testid={'jar-particles-' + id}>
                <g key={'liquid-' + (filling ? cue.id : 'rest')} className={filling ? styles.fillWindow : undefined}>
                <path d={'M21 ' + waterY + 'H123V266q-51 18-102 0Z'} fill="#b7c1b3" fillOpacity=".8"/>
                <g className={styles.flowLines} fill="none" stroke="#7eaaa9" strokeWidth=".8" strokeLinecap="round">
                  <path d={'M30 ' + flowTop + 'q10-8 30-5m22 0q22-2 30 7M31 ' + flowBottom + 'q8 8 28 5m22 0q22 0 30-8'}/>
                </g>
                {settled && <path className={styles.sediment} d="M24 264q48 14 96 0v5q-48 14-96 0Z" fill="#899780" fillOpacity=".8"/>}
                {[0,1,2,3,4,5,6,7,8,9,10,11].map((n) => {
                  const y = waterY + liquidDepth * (.2 + Math.floor(n / 4) * .28)
                  return <g key={n} transform={'translate(' + (34 + (n % 4) * 25) + ' ' + y + ')'}>
                    <g key={settlingCue ? cue.id : 'rest'} data-particle className={styles.particleMotion} style={{ '--settle-distance': (264 - y) + 'px', '--particle-delay': (n % 4 * -.25) + 's' } as CSSProperties}>
                      <circle r={flocculated ? '1.8' : '1.1'} className={styles.particle}/>
                      {flocculated && <g className={cue?.actionType === 'run_phase' && projection.phase === 'slow' ? styles.flocGrowth : undefined}><circle cx="2.6" cy="1" r="1.1" className={styles.particle}/><circle cx="-.8" cy="2.3" r=".9" className={styles.particle}/></g>}
                    </g>
                  </g>
                })}
                </g>
                <g key={'surface-' + (filling ? cue.id : 'rest')} className={filling ? styles.risingSurface : undefined} style={{ '--fill-distance': liquidDepth + 'px' } as CSSProperties}>
                  <ellipse data-liquid-surface className={styles.waterSurface} style={{ transformOrigin: '72px ' + waterY + 'px' }} cx="72" cy={waterY} rx="51" ry="4" fill="#d1d9ca" stroke="#749286" strokeWidth="1.2"/>
                </g>
              </g>}
              {filling && <g key={cue.id} className={styles.pourCue}>
                <g className={styles.sampleBottle}>
                  <path d="m103 91 5-10-3-4 13-22 20 12-13 22-5-1-7 8Z" fill="#f1f6f7" stroke="#7598a4" strokeWidth="1.2"/>
                  <g clipPath={'url(#' + uid + id + 'source)'}><rect data-pour-source className={styles.sourceLiquid} x="106" y="58" width="30" height="30" fill="#b7c1b3"/></g>
                  <path d="m113 75 8-13" stroke="white" strokeWidth="2"/>
                  <path d="m103 91 10 5" stroke="#527b8c" strokeWidth="1.6"/>
                </g>
                <g clipPath={'url(#' + uid + id + 'stream)'}><path className={styles.sampleStream} d={'M105 94q-5 14-2 34V' + LIQUID_BOTTOM} fill="none" stroke="#8eaaa0" strokeWidth="2.5" strokeLinecap="round"/></g>
                <g className={styles.risingSurface} style={{ '--fill-distance': liquidDepth + 'px' } as CSSProperties}>
                  <ellipse className={styles.pourRipple} cx="103" cy={waterY} rx="9" ry="2.5" style={{ transformOrigin: '103px ' + waterY + 'px' }} fill="none" stroke="#87aeb3"/>
                </g>
              </g>}
              {dosing && <g key={cue.id} className={styles.doseCue}>
                <g className={styles.pipette}>
                  <path d="M106 78h8v34l-4 8-4-8Z" fill="#f3f8fa" stroke="#799ba6"/>
                  <path d="M108 90h4v20l-2 5-2-5Z" fill="#89b8c0"/>
                  <rect x="104" y="72" width="12" height="7" rx="2" fill="#396f80"/>
                  <path d="M107 85h3m-3 7h3m-3 7h3m-3 7h3" stroke="#547c8e" strokeWidth=".6"/>
                </g>
                {[0,1,2].map((n) => <path key={n} d="M110 122q-4 5-2 7t4 0q2-2-2-7Z" className={styles.doseDrop} style={{ animationDelay: (n * .22 + .3) + 's' }}/>) }
              </g>}
              <g clipPath={'url(#' + uid + id + 'shaft)'}>
                <g key={filling ? cue?.id : 'shaft'} data-testid={'jar-shaft-' + id} className={!cup ? styles.shaftRaised : filling ? styles.shaftLowering : undefined}>
                  <path d="M72 63v177" stroke="#6c8798" strokeWidth="5"/>
                  <path d="M71 63v173" stroke="#e6f0f5" strokeWidth="1.8"/>
                  <g data-testid={'jar-paddle-' + id} className={stirring && cup ? styles.paddleMoving : styles.paddle}>
                    <path d="m37 228 33 4v16l-33-4Z" fill="#638797" stroke="#426a7d"/>
                    <path d="m74 232 33-4v16l-33 4Z" fill="#a9c1cb" stroke="#426a7d"/>
                    <path d="m39 230 29 4m9 0 28-4" stroke="#d9e8ed" strokeWidth="1.2"/>
                  </g>
                  <rect x="68" y="230" width="8" height="17" rx="2" fill={'url(#' + steel + ')'} stroke="#557586" strokeWidth=".8"/>
                </g>
              </g>
              <ellipse cx="72" cy="93" rx="56" ry="7" fill="none" stroke="#8da9b8" strokeWidth="1.5"/>
              <path d="M26 104v154" stroke="#fff" strokeWidth="4" strokeOpacity=".85"/>
              <path d="M119 105v155" stroke="#afc9d4" strokeWidth="1.2" strokeOpacity=".5"/>
              <text x="117" y="100" textAnchor="end" fill="#365964" fontSize="8" fontFamily="sans-serif">mL</text>
              {Array.from({ length: 20 }, (_, index) => {
                const tickMl = (index + 1) * CAPACITY_ML / 20
                const y = volumeY(tickMl)
                const major = (index + 1) % 5 === 0
                return <g key={tickMl} fill="#365964" fontSize="8.5" fontFamily="sans-serif">
                  <line data-volume-tick={tickMl} x1={major ? 105 : 112} x2="119" y1={y} y2={y} stroke={major ? '#557c82' : '#91a9aa'} strokeWidth={major ? 1 : .65}/>
                  {major && <text x="101" y={y + 3} textAnchor="end">{tickMl}</text>}
                </g>
              })}
              <rect x="-8" y="284" width="160" height="14" fill="#c5d6df"/>
              <path d="M-8 285h160M-8 298h160" stroke="#95b0c1"/>
              {selected && <rect x="48" y="287" width="48" height="8" rx="4" fill="#007b80"/>}
            </svg>
            <span className={styles.vesselLabel}><strong>Cốc {id}{selected && <span className={styles.selectedDot} aria-hidden="true"/>}</strong>
              {cup ? <span id={uid + id + 'parameters'} className={styles.vesselParameters}>
                <span className={styles.vesselParameter}><span className={`${styles.parameterIcon} ${styles.phIcon}`} aria-hidden="true"/><span className={styles.srOnly}>pH </span>{cup.initialPh}</span>
                <span className={styles.vesselParameter}><span className={`${styles.parameterIcon} ${styles.chemicalIcon}`} aria-hidden="true"/><span className={styles.srOnly}>Liều phèn </span>{cup.doseMgL} mg/L</span>
              </span> : <span>Chưa chuẩn bị</span>}
              <span id={uid + id + 'volume'} data-testid={'jar-volume-' + id} className={styles.vesselVolume}>{cup ? volumeMl + ' mL mẫu nước đục' : 'Cốc trống · 0 mL'}</span>
              {cup && <span className={styles.vesselReading}>{last ? last.valid ? formatNtu(last.valueNtu) : 'N/A · Đo sớm' : 'Chưa đo NTU'}</span>}
            </span>
          </button>
        })}
      </div>
    </div>
    <div className={styles.actionSlot}>
      {cue && explanation ? <div key={cue.id} data-testid="jar-action-explanation" className={styles.actionExplanation}
        onAnimationEnd={(event) => { if (event.target === event.currentTarget) onCueFinished(cue.id) }}>
        <span className={styles.actionMark} aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="m6 12 4 4 8-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
        <div><strong>{explanation[0]}</strong><span>{explanation[1]}</span></div>
        <span className={styles.actionSaved}>Đã lưu</span>
      </div> : <p className={styles.actionRest}><span>Cốc {selectedCupId} · {selectedCup ? SAMPLE_ML + ' mL mẫu' : 'Đang trống'}</span><span>{selectedCup ? 'Chọn cốc trên dàn để thao tác' : 'Chuẩn bị cốc để cấp mẫu nước đục'}</span></p>}
    </div>
    <div className={styles.meterPanel} data-testid="jar-stage-measurements">
      <div key={measuring ? cue?.id : 'meter'} className={measuring ? styles.meterMeasuring : styles.meterArt} aria-hidden="true">
        <EquipmentArtMeter />
      </div>
      <div className={styles.meterReadings}>
        <div><span>Mẫu ban đầu</span><strong>{formatNtu(projection.initialMeasurement?.valueNtu)}</strong></div>
        <div><span>Cốc {selectedCupId} · Số đo cuối</span><strong data-testid="jar-stage-final-ntu">{reading ? reading.valid ? formatNtu(reading.valueNtu) : 'N/A' : 'Chưa đo'}</strong></div>
      </div>
      <p className={styles.meterNote}>{reading ? reading.valid ? 'Đã lưu số đo' : 'N/A · Chưa đủ quy trình' : selectedCup ? 'Chưa có phép đo cuối' : 'Cốc chưa chuẩn bị'}</p>
    </div>
    <p className={styles.stageNote}>Hoạt ảnh minh họa · Độ đục lấy từ phép đo NTU.</p>
  </div>
}

function EquipmentArtMeter() {
  return <svg viewBox="0 0 114 72" fill="none">
    <g className={styles.sampleVial}><rect x="7" y="27" width="17" height="30" rx="3" fill="#f7fafb" stroke="#90aab6"/>
      <path d="M10 39h11v14H10Z" fill="#c5d3d1"/><rect x="6" y="23" width="19" height="6" rx="2" fill="#396b7d"/>
      <path d="M12 31v20" stroke="white" strokeWidth="1.5"/>
    </g>
    <rect x="35" y="19" width="72" height="43" rx="7" fill="#e6edf1" stroke="#9ab0bd"/>
    <path d="M40 22h61" stroke="white" strokeWidth="2"/>
    <rect x="43" y="29" width="33" height="18" rx="3" fill="#294c5d"/>
    <path className={styles.meterSignal} pathLength="1" d="M49 38h5l3-4 4 8 3-4h6" stroke="#d2eee9" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="91" cy="38" r="5" fill="#007b80"/><path d="M83 19V7h14v12" fill="#eff5f7" stroke="#9ab0bd"/>
    <path d="M86 13h8v6h-8Z" fill="#cdd6d2"/><path d="M43 56h56" stroke="#b7cbd5"/>
  </svg>
}

function explainAction(cue: JarVisualCue, projection: JarProjection): [string, string] | null {
  const cup = projection.cups.find((entry) => entry.id === cue.cupId)
  switch (cue.actionType) {
    case 'prepare_cup': return ['Chuẩn bị cốc ' + cue.cupId, 'Mẫu ' + JAR_PROFILE.aliquotVolumeL.toLocaleString('vi-VN') + ' L · pH đầu ' + cup?.initialPh]
    case 'add_coagulant': return ['Cấp phèn vào cốc ' + cue.cupId, 'Tổng liều đã lưu: ' + cup?.doseMgL + ' mg/L']
    case 'run_phase': return [PHASE_COPY[projection.phase][0] + ' · Cả mẻ', PHASE_COPY[projection.phase][1]]
    case 'measure_initial': return ['Đo mẫu ban đầu', 'Số đo dùng chung cho cả mẻ · ' + formatNtu(projection.initialMeasurement?.valueNtu)]
    case 'measure_final': {
      const last = cup?.measurements.at(-1)
      return ['Đo độ đục cốc ' + cue.cupId, last?.valid ? formatNtu(last.valueNtu) + ' · Đã ghi vào sổ đo' : 'N/A · Chưa đủ quy trình']
    }
    default: return null
  }
}
