import { useEffect, useId, useRef, useState, type CSSProperties } from 'react'
import { JAR_CUP_IDS, type JarCupId } from '@/domain/experiments/jar-test/model.js'
import type { JarProjection } from '@/application/scenarios/jar-projection.js'
import styles from './workbench.module.css'

export type JarVisualCue = { id: string; actionType: string; cupId: JarCupId | null }
type Props = { projection: JarProjection; selectedCupId: JarCupId
  onSelectCup: (id: JarCupId) => void; disabled?: boolean; skipAnimation?: boolean; motionOptIn?: boolean; cue?: JarVisualCue | null }

const PHASE_COPY = {
  setup: ['Chuẩn bị dàn cốc', 'Mẫu 0,5 L / cốc'],
  rapid: ['Khuấy nhanh', '100 rpm · 60 giây mô phỏng'],
  slow: ['Khuấy chậm', '40 rpm · 20 phút mô phỏng'],
  settling: ['Lắng', 'Dừng khuấy · 30 phút mô phỏng'],
  completed: ['Lượt đã kết thúc', 'Xem lại số đo đã lưu'],
} as const

function formatNtu(value: number | null | undefined) {
  return value == null ? 'Chưa đo' : value.toLocaleString('vi-VN', { maximumFractionDigits: 4 }) + ' NTU'
}

/** Geometry and motion are qualitative. Only committed inputs determine labels. */
export function JarApparatus({ projection, selectedCupId, onSelectCup, disabled = false, skipAnimation = false, motionOptIn = false, cue }: Props) {
  const uid = useId().replaceAll(':', '')
  const root = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(true)
  const [documentVisible, setDocumentVisible] = useState(true)
  useEffect(() => {
    const element = root.current
    if (!element) return
    const observer = new IntersectionObserver(([entry]) => setVisible(!!entry?.isIntersecting))
    observer.observe(element)
    const updateVisibility = () => setDocumentVisible(document.visibilityState !== 'hidden')
    updateVisibility()
    document.addEventListener('visibilitychange', updateVisibility)
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', updateVisibility) }
  }, [])
  const stirring = projection.phase === 'rapid' || projection.phase === 'slow'
  const flocculated = projection.elapsedSeconds >= 1260
  const selectedCup = projection.cups.find((entry) => entry.id === selectedCupId)
  const reading = selectedCup?.measurements.at(-1)
  const measuring = cue?.actionType === 'measure_initial' || (cue?.actionType === 'measure_final' && cue.cupId === selectedCupId)
  const [phaseTitle, phaseDescription] = PHASE_COPY[projection.phase]
  return <div ref={root} className={styles.rack} data-phase={projection.phase} data-settled={projection.elapsedSeconds >= 3060} data-animation={skipAnimation ? 'off' : 'on'} data-motion-opt-in={motionOptIn} data-paused={!visible || !documentVisible}>
    <div className={styles.processStatus}><span className={styles.machineIndicator} aria-hidden="true"/>
      <div><strong>{phaseTitle}</strong><span>{phaseDescription}</span></div>
      <span className={styles.sampleCount}>{projection.cups.length} / 6 cốc</span>
    </div>
    <div className={styles.rackScroll} tabIndex={0} aria-label="Dàn sáu cốc; cuộn ngang khi cần">
      <div className={styles.vesselGrid} role="group" aria-label="Chọn cốc thao tác">
        {JAR_CUP_IDS.map((id, index) => {
          const cup = projection.cups.find((entry) => entry.id === id)
          const selected = selectedCupId === id
          const steel = uid + id + 'steel'
          const glass = uid + id + 'glass'
          const filling = cue?.cupId === id && cue.actionType === 'prepare_cup'
          const dosing = cue?.cupId === id && cue.actionType === 'add_coagulant'
          const last = cup?.measurements.at(-1)
          return <button key={id} type="button" className={styles.vessel} data-selected={selected}
            aria-pressed={selected} disabled={disabled} onClick={() => onSelectCup(id)}
            aria-label={'Cốc ' + id + ', ' + (cup ? 'đã chuẩn bị' : 'chưa chuẩn bị') + (selected ? ', đang thao tác' : '')}>
            {selected && <span className={styles.selectedBadge} aria-hidden="true">Đang chọn</span>}
            <svg viewBox="0 0 144 310" aria-hidden="true" className={styles.vesselDrawing}>
              <defs>
                <linearGradient id={steel}><stop stopColor="#78929f"/><stop offset=".4" stopColor="#e9f1f5"/><stop offset=".65" stopColor="#bacdd7"/><stop offset="1" stopColor="#6f8999"/></linearGradient>
                <linearGradient id={glass}><stop stopColor="#cedfe8" stopOpacity=".55"/><stop offset=".3" stopColor="#fff" stopOpacity=".08"/><stop offset=".8" stopColor="#e0edf3" stopOpacity=".12"/><stop offset="1" stopColor="#c6dbe5" stopOpacity=".5"/></linearGradient>
                <clipPath id={uid + id + 'fill'}><rect key={filling ? cue?.id : 'filled'} x="21" y="177" width="102" height="103" className={filling ? styles.fillWindow : undefined}/></clipPath>
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
              {selected && <rect x="12" y="82" width="120" height="197" rx="11" fill="none" stroke="#007b80" strokeWidth="2.5"/>}
              <path d="M18 93v175q54 19 108 0V93" fill={'url(#' + glass + ')'} stroke={selected ? '#48888e' : '#8da9b8'} strokeWidth="1.8"/>
              {cup && <g clipPath={'url(#' + uid + id + 'fill)'}>
                <path d="M21 184q51-9 102 0v82q-51 18-102 0Z" fill="#c5d3d1" fillOpacity=".68"/>
                <ellipse className={styles.waterSurface} cx="72" cy="184" rx="51" ry="6" fill="#e0e9e6" stroke="#afc5c3"/>
                {[0,1,2,3,4,5,6,7,8,9,10,11].map((n) => {
                  const y = 198 + Math.floor(n / 4) * 24
                  return <g key={n} transform={'translate(' + (34 + (n % 4) * 25) + ' ' + y + ')'}>
                    <g className={styles.particleMotion} style={{ '--settle-distance': (264 - y) + 'px', '--particle-delay': (n % 4 * -.25) + 's' } as CSSProperties}>
                      <circle r={flocculated ? '1.8' : '1.1'} className={styles.particle}/>
                      {flocculated && <><circle cx="2.6" cy="1" r="1.1" className={styles.particle}/><circle cx="-.8" cy="2.3" r=".9" className={styles.particle}/></>}
                    </g>
                  </g>
                })}
              </g>}
              {filling && <g key={cue.id} className={styles.pourCue}><path d="M110 108v76" stroke="#b4c8cd" strokeWidth="3" strokeLinecap="round"/><ellipse cx="110" cy="184" rx="7" ry="2" fill="none" stroke="#87aeb3"/></g>}
              {dosing && <g key={cue.id} className={styles.doseCue}>
                <path d="m108 110 5-12h7l-4 12-6 4Z" fill="#e4eff1" stroke="#799ba6"/>
                {[0,1,2].map((n) => <circle key={n} cx="110" cy="120" r="1.8" className={styles.doseDrop} style={{ animationDelay: (n * .18) + 's' }}/>) }
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
              {[['1 L',109],['500',184],['250',226]].map(([label,y]) => <g key={label} fill="#526f80" fontSize="8" fontFamily="sans-serif"><path d={'M105 ' + y + 'h12'} stroke="#7897a8"/><text x="101" y={Number(y)+3} textAnchor="end">{label}</text></g>)}
              <rect x="-8" y="284" width="160" height="14" fill="#c5d6df"/>
              <path d="M-8 285h160M-8 298h160" stroke="#95b0c1"/>
              {selected && <rect x="48" y="287" width="48" height="8" rx="4" fill="#007b80"/>}
            </svg>
            <span className={styles.vesselLabel}><strong>Cốc {id}{selected && <span className={styles.selectedDot} aria-hidden="true"/>}</strong>
              <span>{cup ? 'pH ' + cup.initialPh + ' · ' + cup.doseMgL + ' mg/L' : 'Chưa chuẩn bị'}</span>
              {cup && <span className={styles.vesselReading}>{last ? last.valid ? formatNtu(last.valueNtu) : 'N/A · Đo sớm' : 'Chưa đo NTU'}</span>}
            </span>
          </button>
        })}
      </div>
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
  return <svg viewBox="0 0 78 66" fill="none"><rect x="5" y="19" width="66" height="41" rx="7" fill="#e6edf1" stroke="#9ab0bd"/>
    <rect x="13" y="29" width="32" height="17" rx="3" fill="#294c5d"/>
    <path className={styles.meterSignal} d="M20 37h18" stroke="#d2eee9" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="57" cy="37" r="5" fill="#007b80"/><path d="M49 19V7h14v12" fill="#eff5f7" stroke="#9ab0bd"/>
    <path d="M52 13h8v6h-8Z" fill="#cdd6d2"/><path d="M12 55h52" stroke="#b7cbd5"/>
  </svg>
}
