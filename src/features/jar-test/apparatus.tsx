import { useEffect, useId, useRef, useState, type CSSProperties } from 'react'
import { JAR_CUP_IDS, type JarCupId } from '@/domain/experiments/jar-test/model.js'
import type { JarProjection } from '@/application/scenarios/jar-projection.js'
import styles from './workbench.module.css'

export type JarVisualCue = { id: string; actionType: string; cupId: JarCupId | null }
type Props = { projection: JarProjection; selectedCupId: JarCupId
  onSelectCup: (id: JarCupId) => void; disabled?: boolean; skipAnimation?: boolean; cue?: JarVisualCue | null }

const PHASE_COPY = {
  setup: ['Chuẩn bị dàn cốc', 'Chọn cốc, chuẩn bị mẫu và cấp phèn.'],
  rapid: ['Khuấy nhanh · 100 rpm', 'Phân tán hóa chất trong mẫu · Đã chạy 60 giây mô phỏng.'],
  slow: ['Khuấy chậm · 40 rpm', 'Minh họa các hạt kết thành bông · Đã chạy 20 phút mô phỏng.'],
  settling: ['Lắng · Dừng cánh khuấy', 'Minh họa bông lắng xuống đáy · Đã chạy 30 phút mô phỏng.'],
  completed: ['Lượt đã kết thúc', 'Chọn từng cốc để xem lại số đo đã lưu.'],
} as const

function formatNtu(value: number | null | undefined) {
  return value == null ? 'Chưa đo' : value.toLocaleString('vi-VN', { maximumFractionDigits: 4 }) + ' NTU'
}

/** Geometry and motion are qualitative. Only committed inputs determine labels. */
export function JarApparatus({ projection, selectedCupId, onSelectCup, disabled = false, skipAnimation = false, cue }: Props) {
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
  return <div ref={root} className={styles.rack} data-phase={projection.phase} data-settled={projection.elapsedSeconds >= 3060} data-animation={skipAnimation ? 'off' : 'on'} data-paused={!visible || !documentVisible}>
    <div className={styles.processStatus}><span className={styles.machineIndicator} aria-hidden="true"/>
      <div><strong>{phaseTitle}</strong><span>{phaseDescription}</span></div>
      <span className={styles.sampleCount}>{projection.cups.length} / 6 cốc</span>
    </div>
    <div className={styles.rackScroll} tabIndex={0} aria-label="Dàn sáu cốc; cuộn ngang khi cần">
      <div className={styles.vesselGrid} role="group" aria-label="Chọn cốc thao tác">
        {JAR_CUP_IDS.map((id) => {
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
            <svg viewBox="0 0 120 260" aria-hidden="true" className={styles.vesselDrawing}>
              <defs>
                <linearGradient id={steel}><stop stopColor="#9aaebc"/><stop offset=".35" stopColor="#eef4f7"/><stop offset=".65" stopColor="#b9c8d1"/><stop offset="1" stopColor="#7f97a6"/></linearGradient>
                <linearGradient id={glass}><stop stopColor="#e0eaf0" stopOpacity=".5"/><stop offset=".3" stopColor="#fff" stopOpacity=".12"/><stop offset="1" stopColor="#d5e2e9" stopOpacity=".35"/></linearGradient>
                <clipPath id={uid + id + 'fill'}><rect key={filling ? cue?.id : 'filled'} x="18" y="165" width="84" height="85" className={filling ? styles.fillWindow : undefined}/></clipPath>
              </defs>
              <rect x="51" y="3" width="18" height="38" rx="3" fill={'url(#' + steel + ')'} />
              <path d="M15 101v136q45 17 90 0V101" fill={'url(#' + glass + ')'} stroke="#9bb0be" strokeWidth="1.6"/>
              {cup && <g clipPath={'url(#' + uid + id + 'fill)'}>
                <path d="M18 174q42-8 84 0v61q-42 16-84 0Z" fill="#cdd6d2" fillOpacity=".72"/>
                <ellipse className={styles.waterSurface} cx="60" cy="174" rx="42" ry="5" fill="#e1e6e3" stroke="#bac8c6"/>
                {[0,1,2,3,4,5,6,7,8,9,10,11].map((n) => {
                  const y = 184 + Math.floor(n / 4) * 17
                  return <g key={n} transform={'translate(' + (27 + (n % 4) * 21) + ' ' + y + ')'}>
                    <g className={styles.particleMotion} style={{ '--settle-distance': (234 - y) + 'px', '--particle-delay': (n % 4 * -.25) + 's' } as CSSProperties}>
                      <circle r={flocculated ? '1.8' : '1.1'} className={styles.particle}/>
                      {flocculated && <><circle cx="2.6" cy="1" r="1.1" className={styles.particle}/><circle cx="-.8" cy="2.3" r=".9" className={styles.particle}/></>}
                    </g>
                  </g>
                })}
              </g>}
              {filling && <g key={cue.id} className={styles.pourCue}><path d="M92 112v62" stroke="#b4c8cd" strokeWidth="3" strokeLinecap="round"/><ellipse cx="92" cy="174" rx="7" ry="2" fill="none" stroke="#87aeb3"/></g>}
              {dosing && <g key={cue.id} className={styles.doseCue}>
                <path d="m89 111 5-12h7l-4 12-6 4Z" fill="#e4eff1" stroke="#799ba6"/>
                {[0,1,2].map((n) => <circle key={n} cx="91" cy="119" r="1.8" className={styles.doseDrop} style={{ animationDelay: (n * .18) + 's' }}/>) }
              </g>}
              <ellipse cx="60" cy="101" rx="48" ry="6" fill="#f8fbfd" fillOpacity=".65" stroke="#9bb0be" strokeWidth="1.5"/>
              <path d="M24 110v117" stroke="#fff" strokeWidth="3" strokeOpacity=".85"/>
              {selected && <rect x="8" y="94" width="104" height="153" rx="8" fill="none" stroke="#007b80" strokeWidth="1.5"/>}
              <g className={stirring && cup ? styles.paddleMoving : styles.paddle}>
                <path d="M60 39v180" stroke={'url(#' + steel + ')'} strokeWidth="4"/>
                <path d="M41 214q9-4 19 6 10-10 19-6v12q-10 5-19-3-9 8-19 3Z" fill="#dae3e8" stroke="#a9bac4" strokeWidth=".8"/>
              </g>
              {[['1 L',115],['500',174],['250',205]].map(([label,y]) => <g key={label} fill="#6a8391" fontSize="8" fontFamily="sans-serif"><path d={'M81 ' + y + 'h10'} stroke="#8fa5b0"/><text x="77" y={Number(y)+3} textAnchor="end">{label}</text></g>)}
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
      <p className={styles.meterNote}>{reading ? reading.valid ? 'Số đo đã lưu trong sổ đo.' : 'Đo khi chưa đủ quy trình. Phép đo này được giữ lại với giá trị N/A.' : selectedCup ? 'Chọn Đo độ đục cuối trong bảng Thao tác để lấy số liệu.' : 'Chuẩn bị cốc để bắt đầu khảo sát.'}</p>
    </div>
    <p className={styles.stageNote}>Chọn cốc để thao tác. Hạt và chuyển động chỉ minh họa, không biểu diễn NTU hay hiệu quả xử lý.</p>
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
