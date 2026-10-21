'use client'

import { useEffect, useId, useRef } from 'react'
import { CloseIcon, TargetIcon } from '@/features/workbench/icons.js'
import { WT_QCVN_COLUMN_A } from './constants.js'
import styles from './learning-goal.module.css'

/**
 * Learning goal popover — cùng pattern với JarLearningGoal: details mở rộng
 * với phần mục tiêu (gọn) và phần phạm vi (gọn) hiển thị inline; bấm
 * mở details sẽ bung thành panel lớn có heading, intro, lưới 4 mục.
 *
 * ESC và click ngoài panel sẽ đóng details, focus quay lại summary.
 */
export function WaterTreatmentLearningGoal() {
  const details = useRef<HTMLDetailsElement>(null)
  const id = useId()
  useEffect(() => {
    function dismissOutside(event: PointerEvent) {
      const element = details.current
      if (element?.open && event.target instanceof Node && !element.contains(event.target)) {
        element.open = false
      }
    }
    document.addEventListener('pointerdown', dismissOutside)
    return () => document.removeEventListener('pointerdown', dismissOutside)
  }, [])
  function closeScope() {
    if (!details.current) return
    details.current.open = false
    details.current.querySelector('summary')?.focus()
  }
  return (
    <div className={styles.goal} data-testid="wt-public-goal">
      <details
        ref={details}
        className={styles.goalDetails}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && details.current?.open) {
            event.stopPropagation()
            closeScope()
          }
        }}
      >
        <summary aria-label="Mục tiêu & phạm vi">
          <TargetIcon />
          <span className={styles.goalButtonCopy}>
            <strong>
              Mục tiêu<span className={styles.mobileScopeLabel}> | Phạm vi</span>
            </strong>
            <span>Đạt Cột A QCVN 40:2025/BTNMT</span>
          </span>
          <span className={styles.goalDivider} aria-hidden="true">|</span>
          <span className={styles.goalScopeCopy}>
            <strong>Phạm vi</strong>
            <span>
              pH {WT_QCVN_COLUMN_A.pH_min}–{WT_QCVN_COLUMN_A.pH_max} · Fe ≤ {WT_QCVN_COLUMN_A.Fe_mgPerL} · Zn ≤ {WT_QCVN_COLUMN_A.Zn_mgPerL} · Pb ≤ {WT_QCVN_COLUMN_A.Pb_mgPerL} mg/L
            </span>
          </span>
        </summary>
        <section
          className={styles.goalPanel}
          aria-label="Mục tiêu và phạm vi Xử lý nước Fe/Zn/Pb"
          id={id + '-panel'}
        >
          <div className={styles.goalPanelHeading}>
            <h2>Mục tiêu & phạm vi</h2>
            <button
              type="button"
              aria-label="Đóng mục tiêu & phạm vi"
              onClick={closeScope}
            >
              <CloseIcon />
            </button>
          </div>
          <div className={styles.goalIntro}>
            <p className={styles.goalTitle}>
              <strong>Mục tiêu: loại Fe, Zn, Pb đạt Cột A QCVN 40:2025/BTNMT</strong>
            </p>
            <p className={styles.goalSubtitle}>
              Hydroxide route: kiềm hóa → khuấy/lắng/lọc → trung hòa pH về khoảng [6; 9].
            </p>
          </div>
          <div className={styles.goalPanelGrid}>
            <section>
              <h3>Chuẩn cần đạt</h3>
              <ul>
                <li>Fe ≤ {WT_QCVN_COLUMN_A.Fe_mgPerL} mg/L</li>
                <li>Zn ≤ {WT_QCVN_COLUMN_A.Zn_mgPerL} mg/L</li>
                <li>Pb ≤ {WT_QCVN_COLUMN_A.Pb_mgPerL} mg/L</li>
                <li>pH cuối trong dải {WT_QCVN_COLUMN_A.pH_min}–{WT_QCVN_COLUMN_A.pH_max}</li>
              </ul>
            </section>
            <section>
              <h3>Bạn được chọn</h3>
              <dl>
                <div>
                  <dt>Thể tích mẫu</dt>
                  <dd>500–2.000 mL · 1.000 mL mặc định</dd>
                </div>
                <div>
                  <dt>Composition Fe/Zn/Pb</dt>
                  <dd>Tổng ≤ 5 mg/L · bước tuỳ kim loại</dd>
                </div>
                <div>
                  <dt>Liều NaOH</dt>
                  <dd>Tăng từng giọt, 0,01–0,5 mL/giọt</dd>
                </div>
                <div>
                  <dt>Số stage lọc</dt>
                  <dd>Không giới hạn (đến khi Cột A đạt)</dd>
                </div>
              </dl>
            </section>
            <section>
              <h3>Điều kiện cố định</h3>
              <p>Mẫu tổng hợp, nhiệt độ 25,0 °C.</p>
              <p>Chu trình mỗi stage:</p>
              <ul>
                <li>Khuấy 5 phút đồng nhất pH.</li>
                <li>Lắng 15 phút cho bông cặn.</li>
                <li>Lọc phase rắn bằng phễu lọc.</li>
              </ul>
            </section>
            <section>
              <h3>Giới hạn mô phỏng</h3>
              <p>Capacity closed-form + Ksp + Davies γ + charge balance (chemistry-solver.ts).</p>
              <p>pH ngoài [2; 13] sẽ bị pH guard từ chối — coi là vi phạm điều kiện mô hình.</p>
              <p>Mục tiêu Cột A là chuẩn xả thải công nghiệp đã xác minh 16/10/2026, không phải chuẩn nước uống.</p>
            </section>
          </div>
        </section>
      </details>
    </div>
  )
}
