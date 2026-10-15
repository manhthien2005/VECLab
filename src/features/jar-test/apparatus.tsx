import { useId } from 'react'
import { JAR_CUP_IDS, type JarCupId } from '@/domain/experiments/jar-test/model.js'
import type { JarProjection } from '@/application/scenarios/jar-projection.js'
import styles from './workbench.module.css'

type Props = { projection: JarProjection; selectedCupId: JarCupId
  onSelectCup: (id: JarCupId) => void; disabled?: boolean; skipAnimation?: boolean }

/** Geometry and motion are qualitative. Only committed inputs determine labels. */
export function JarApparatus({ projection, selectedCupId, onSelectCup, disabled = false, skipAnimation = false }: Props) {
  const uid = useId().replaceAll(':', '')
  const stirring = projection.phase === 'rapid' || projection.phase === 'slow'
  return <div className={styles.rack} data-phase={projection.phase} data-animation={skipAnimation ? 'off' : 'on'}>
    <div className={styles.rackScroll} tabIndex={0} aria-label="Dàn sáu cốc; cuộn ngang khi cần">
      <div className={styles.vesselGrid} role="group" aria-label="Chọn cốc thao tác">
        {JAR_CUP_IDS.map((id) => {
          const cup = projection.cups.find((entry) => entry.id === id)
          const selected = selectedCupId === id
          const steel = uid + id + 'steel'
          const glass = uid + id + 'glass'
          return <button key={id} type="button" className={styles.vessel} data-selected={selected}
            aria-pressed={selected} disabled={disabled} onClick={() => onSelectCup(id)}
            aria-label={'Cốc ' + id + ', ' + (cup ? 'đã chuẩn bị' : 'chưa chuẩn bị') + (selected ? ', đang thao tác' : '')}>
            <svg viewBox="0 0 120 260" aria-hidden="true" className={styles.vesselDrawing}>
              <defs>
                <linearGradient id={steel}><stop stopColor="#9aaebc"/><stop offset=".35" stopColor="#eef4f7"/><stop offset=".65" stopColor="#b9c8d1"/><stop offset="1" stopColor="#7f97a6"/></linearGradient>
                <linearGradient id={glass}><stop stopColor="#e0eaf0" stopOpacity=".5"/><stop offset=".3" stopColor="#fff" stopOpacity=".12"/><stop offset="1" stopColor="#d5e2e9" stopOpacity=".35"/></linearGradient>
              </defs>
              <rect x="51" y="3" width="18" height="38" rx="3" fill={'url(#' + steel + ')'} />
              <path d="M15 101v136q45 17 90 0V101" fill={'url(#' + glass + ')'} stroke="#9bb0be" strokeWidth="1.6"/>
              {cup && <>
                <path d="M18 174q42-8 84 0v61q-42 16-84 0Z" fill="#cdd6d2" fillOpacity=".72"/>
                <ellipse cx="60" cy="174" rx="42" ry="5" fill="#e1e6e3" stroke="#bac8c6"/>
                {[0,1,2,3,4,5,6,7,8,9,10,11].map((n) => <circle key={n} cx={27 + (n % 4) * 21} cy={184 + Math.floor(n / 4) * 17} r="1.1" className={styles.particle}/>)}
              </>}
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
            </span>
          </button>
        })}
      </div>
    </div>
    <p className={styles.stageNote}>Chọn cốc để thao tác. Hạt và chuyển động chỉ minh họa, không biểu diễn NTU hay hiệu quả xử lý.</p>
  </div>
}
