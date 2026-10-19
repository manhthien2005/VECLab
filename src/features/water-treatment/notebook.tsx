'use client'

import type { WaterTreatmentResult } from '@/app/simulate/water-treatment/actions.js'
import { ReportIcon, GuideIcon } from '@/features/workbench/icons.js'
import { WT_QCVN_COLUMN_A } from './constants.js'
import styles from './notebook.module.css'

const number = (value: number) =>
  value.toLocaleString('vi-VN', { maximumFractionDigits: 4 })

/**
 * Sổ đo (notebook) cho Xử lý nước — placeholder với số liệu cơ bản và
 * lịch sử thao tác. Sẽ mở rộng thêm ở giai đoạn sau (chọn 4 mục trong
 * survey: đo pH ban đầu, đo lại ở Bước 3, v.v.).
 */
export function WaterTreatmentNotebook({
  history,
  composition,
  onOpenReport,
}: {
  history: ReadonlyArray<WaterTreatmentResult>
  composition: { Fe: number; Zn: number; Pb: number }
  onOpenReport: () => void
}) {
  const total = history.length
  const last = history[total - 1]
  const phReadings = history.filter((r) => r.action === 'measure-initial-ph' || r.action === 're-measure-ph' || r.action === 'measure-final')
  const stirCount = history.filter((r) => r.action === 'stir').length
  const filterCount = history.filter((r) => r.action === 'filter').length
  const hasWork = total > 0
  return (
    <section className={styles.notebook} aria-label="Sổ đo Xử lý nước Fe/Zn/Pb" tabIndex={-1}>
      <header className={styles.heading}>
        <h2>Sổ thực hành</h2>
        <span data-testid="wt-revision">{hasWork ? total + ' bước đã lưu' : 'Chưa có dữ liệu'}</span>
      </header>
      <div className={styles.overview}>
        <section className={styles.baseline} aria-label="Composition mẫu và pH ban đầu">
          <h3>
            <GuideIcon />
            Composition & pH ban đầu
          </h3>
          <dl>
            <div>
              <dt>Fe</dt>
              <dd>{number(composition.Fe)} mg/L</dd>
            </div>
            <div>
              <dt>Zn</dt>
              <dd>{number(composition.Zn)} mg/L</dd>
            </div>
            <div>
              <dt>Pb</dt>
              <dd>{number(composition.Pb)} mg/L</dd>
            </div>
          </dl>
          <p>
            Cột A: Fe ≤ {WT_QCVN_COLUMN_A.Fe_mgPerL} · Zn ≤ {WT_QCVN_COLUMN_A.Zn_mgPerL} · Pb ≤{' '}
            {WT_QCVN_COLUMN_A.Pb_mgPerL} mg/L · pH {WT_QCVN_COLUMN_A.pH_min}–
            {WT_QCVN_COLUMN_A.pH_max}.
          </p>
        </section>
        <section className={styles.progress} aria-label="Tiến trình đã ghi">
          <h3>
            <ReportIcon />
            Tiến trình
          </h3>
          <dl>
            <div>
              <dt>Phép đo pH đã ghi</dt>
              <dd>{phReadings.length}</dd>
            </div>
            <div>
              <dt>Stage khuấy</dt>
              <dd>{stirCount}</dd>
            </div>
            <div>
              <dt>Stage lọc</dt>
              <dd>{filterCount}</dd>
            </div>
          </dl>
          {last ? (
            <p>
              pH cuối: <strong>{number(last.pH)}</strong>
            </p>
          ) : (
            <p>Chưa có dữ liệu — bắt đầu bằng cách áp dụng composition và đo pH ban đầu.</p>
          )}
          <button type="button" onClick={onOpenReport} disabled={!hasWork}>
            Mở báo cáo
          </button>
        </section>
      </div>
      {hasWork ? (
        <details className={styles.history} open>
          <summary>Lịch sử thao tác</summary>
          <ol className={styles.historyList}>
            {history.map((row, index) => {
              const event = row.events[0]
              return (
                <li key={(event?.timestamp ?? index) + '-' + index} data-action={row.action}>
                  <span className={styles.historyIndex}>{index + 1}</span>
                  <div>
                    <strong>{actionLabel(row.action)}</strong>
                    <span>pH {number(row.pH)}</span>
                    <p>{event?.note ?? ''}</p>
                  </div>
                  <time>{event ? new Date(event.timestamp).toLocaleTimeString('vi-VN') : ''}</time>
                </li>
              )
            })}
          </ol>
        </details>
      ) : (
        <p className={styles.empty}>
          Sổ thực hành sẽ hiển thị số đo và lịch sử thao tác sau khi bắt đầu thí nghiệm.
        </p>
      )}
    </section>
  )
}

function actionLabel(action: string): string {
  const titles: Record<string, string> = {
    'measure-initial-ph': 'Đo pH ban đầu',
    'add-base': 'Nhỏ NaOH',
    'add-acid': 'Nhỏ HCl',
    stir: 'Khuấy',
    settle: 'Lắng',
    filter: 'Lọc phase rắn',
    're-measure-ph': 'Đo lại pH',
    'measure-final': 'Đo pH cuối',
  }
  return titles[action] ?? action
}
