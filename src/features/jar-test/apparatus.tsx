import type { JarCupId } from '@/domain/experiments/jar-test/model.js'
import { JAR_CUP_IDS } from '@/domain/experiments/jar-test/model.js'
import type { JarProjection } from '@/application/scenarios/jar-projection.js'
import styles from './workbench.module.css'

type JarApparatusProps = {
  projection: JarProjection
  selectedCupId: JarCupId
  onSelectCup: (cupId: JarCupId) => void
  disabled?: boolean
  skipAnimation?: boolean
}

/**
 * A–F are six fixed vessels on one stirring rack. This is a qualitative
 * representation only: flocs, particles, water level and motion never drive
 * the domain model, and never encode hidden removal predictions.
 */
export function JarApparatus({
  projection, selectedCupId, onSelectCup, disabled = false, skipAnimation = false,
}: JarApparatusProps) {
  const stirring = projection.phase === 'rapid' || projection.phase === 'slow'
  return (
    <div className={styles.rack} data-phase={projection.phase}
      data-animation={skipAnimation ? 'off' : 'on'}>
      <div className={styles.rackHeading}>
        <strong>Dàn Jar Test — 6 vị trí</strong>
        <span>{stirring ? 'Máy khuấy đang ở pha ' + (projection.phase === 'rapid' ? 'nhanh' : 'chậm') :
          projection.phase === 'settling' ? 'Đang ở pha lắng' : 'Trạng thái ' +
          (projection.phase === 'completed' ? 'đã nộp' : 'chuẩn bị')}</span>
      </div>
      <div className={styles.vesselGrid} role="group" aria-label="Chọn cốc thao tác">
        {JAR_CUP_IDS.map((id) => {
          const cup = projection.cups.find((entry) => entry.id === id)
          const selected = id === selectedCupId
          return (
            <button type="button" key={id}
              className={styles.vessel}
              data-selected={selected ? 'true' : 'false'}
              data-prepared={cup ? 'true' : 'false'}
              aria-pressed={selected}
              aria-label={'Cốc ' + id + ', ' + (cup ? 'đã chuẩn bị' : 'chưa chuẩn bị') +
                (selected ? ', đang thao tác' : '')}
              onClick={() => onSelectCup(id)}
              disabled={disabled}>
              <span className={styles.vesselTitle}>Cốc {id}</span>
              <svg viewBox="0 0 124 146" role="img" aria-hidden="true"
                className={styles.vesselDrawing}>
                <path d="M18 17H106M27 17V125Q62 137 97 125V17"
                  fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                {cup ? (
                  <>
                    <path d="M30 61Q62 56 94 61V123Q62 134 30 123Z"
                      className={styles.water} />
                    <path d="M30 61Q62 56 94 61" fill="none" stroke="currentColor"
                      opacity=".45" strokeWidth="1" />
                    <g className={styles.particles}>
                      {[0, 1, 2, 3, 4, 5].map((particle) => (
                        <circle key={particle} cx={39 + (particle % 3) * 22}
                          cy={76 + Math.floor(particle / 3) * 23} r="2.4"
                          className={styles.particle} />
                      ))}
                    </g>
                    <path className={stirring ? styles.paddleMoving : styles.paddle}
                      d="M62 21V95M45 95H79" stroke="currentColor" strokeWidth="3"
                      strokeLinecap="round" fill="none" />
                  </>
                ) : (
                  <path d="M39 72H85" stroke="currentColor"
                    strokeDasharray="3 5" opacity=".4" strokeWidth="2" />
                )}
              </svg>
              <span className={styles.vesselMeta}>
                {cup ? 'pH ban đầu ' + cup.initialPh + ' · ' + cup.doseMgL + ' mg/L' : 'Chưa chuẩn bị'}
              </span>
              <span className={styles.vesselSelected} aria-hidden="true">
                {selected ? 'Đang chọn' : '\u00a0'}
              </span>
            </button>
          )
        })}
      </div>
      <p className={styles.stageNote}>
        Mực nước, hạt và chuyển động chỉ minh họa định tính, không thể hiện giá trị NTU
        hay tốc độ hình thành bông. Chọn cốc bằng chuột, chạm hoặc bàn phím.
      </p>
    </div>
  )
}
