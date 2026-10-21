'use client'

import { CheckCircleIcon } from '@/features/landing/icons.js'
import styles from './stage-steps.module.css'

export type StageStepId = 'compose' | 'stir' | 'neutralize'

const STAGES: ReadonlyArray<{ id: StageStepId; label: string }> = [
  { id: 'compose', label: 'Chọn mẫu & đo pH' },
  { id: 'stir', label: 'Kiềm hóa & lọc' },
  { id: 'neutralize', label: 'Trung hòa & xác nhận' },
]

/**
 * Thanh step ngang (5-stage trong Jar Test, 3-stage trong water treatment).
 * Mỗi step là 1 button. Bấm sẽ gọi `onSelect(id)` để parent mở group tương
 * ứng. Step hiện tại đánh dấu `aria-current="step"`, step đã qua có check.
 */
export function StageSteps({
  current,
  done,
  onSelect,
}: {
  current: StageStepId
  done: ReadonlyArray<StageStepId>
  onSelect: (id: StageStepId) => void
}) {
  return (
    <ol className={styles.steps} aria-label="Quy trình xử lý nước Fe, Zn, Pb">
      {STAGES.map((stage, index) => {
        const isDone = done.includes(stage.id)
        const isCurrent = current === stage.id
        return (
          <li
            key={stage.id}
            aria-current={isCurrent ? 'step' : undefined}
            data-done={isDone}
            data-current={isCurrent}
          >
            <button type="button" onClick={() => onSelect(stage.id)}>
              <span aria-hidden="true">{isDone ? <CheckCircleIcon /> : index + 1}</span>
              {stage.label}
            </button>
          </li>
        )
      })}
    </ol>
  )
}
