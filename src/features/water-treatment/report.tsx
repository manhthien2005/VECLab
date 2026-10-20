import type { WaterTreatmentReportSnapshot } from './report-types.js'
import { CheckCircleIcon } from '@/features/landing/icons.js'
import { InfoIcon } from '@/features/workbench/icons.js'
import styles from './report.module.css'

const fmt = (value: number | null, digits = 2): string =>
  value === null ? 'N/A' : value.toLocaleString('vi-VN', { maximumFractionDigits: digits })

const QCVN_LIMITS = {
  fe: 2.0,
  zn: 1.0,
  pb: 0.1,
  phMin: 6,
  phMax: 9,
} as const

const METAL_NAMES = {
  fe: 'Sắt (Fe)',
  zn: 'Kẽm (Zn)',
  pb: 'Chì (Pb)',
} as const

function MetricBar({
  label,
  value,
  limit,
  unit = 'mg/L',
  inverse = false,
}: {
  label: string
  value: number | null
  limit: number
  unit?: string
  inverse?: boolean
}) {
  const met = value !== null && (inverse ? value <= limit : value >= limit)
  const percentage = value !== null ? Math.min(100, (value / limit) * 100) : 0

  return (
    <div className={styles.metric} role="img" aria-label={`${label}: ${fmt(value)} ${unit}; giới hạn ${limit} ${unit}`}>
      <div className={styles.metricLabel} aria-hidden="true">
        <span>{label}</span>
        <strong>
          {fmt(value)}
          {value !== null && ` ${unit}`}
        </strong>
      </div>
      <div className={styles.metricTrack} aria-hidden="true">
        {value !== null && (
          <span
            className={styles.metricFill}
            data-met={met}
            style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
          />
        )}
        <span className={styles.limitMarker} style={{ left: `${Math.min(100, (limit / (value ?? limit)) * 100)}%` }} />
      </div>
      <span className={styles.limitLabel} aria-hidden="true">
        {inverse ? `≤ ${limit} ${unit}` : `≥ ${limit} ${unit}`}
      </span>
    </div>
  )
}

function RemovalEfficiencySection({ report }: { report: WaterTreatmentReportSnapshot }) {
  if (!report.sampleCalculation || !report.ban2LockedData) {
    return (
      <section className={styles.section} aria-label="Hiệu suất xử lý">
        <h3>Hiệu suất xử lý</h3>
        <p className={styles.warning}>Chưa đủ dữ liệu để tính hiệu suất xử lý.</p>
      </section>
    )
  }

  return (
    <section className={styles.section} aria-label="Hiệu suất xử lý">
      <h3>Hiệu suất xử lý kim loại</h3>
      <p className={styles.context}>
        Hiệu suất tính bằng % giảm nồng độ so với mẫu ban đầu.
      </p>
      <div className={styles.removalGrid}>
        {(['fe', 'zn', 'pb'] as const).map((metal) => {
          const initial = report.sampleCalculation?.dissolvedMgL[metal] ?? null
          const final = report.ban2LockedData?.[`${metal}AfterMgL`] ?? null
          const removal = report.removalEfficiency[metal]
          const met = removal !== null && removal >= 90

          return (
            <article key={metal} className={styles.removalCard} data-met={met}>
              <header>
                <h4>{METAL_NAMES[metal]}</h4>
              </header>
              <dl className={styles.removalData}>
                <div>
                  <dt>Ban đầu</dt>
                  <dd>{fmt(initial)} mg/L</dd>
                </div>
                <div>
                  <dt>Sau xử lý</dt>
                  <dd>{fmt(final)} mg/L</dd>
                </div>
                <div>
                  <dt>Hiệu suất</dt>
                  <dd className={styles.removalValue}>
                    {fmt(removal)}
                    {removal !== null && ' %'}
                  </dd>
                </div>
              </dl>
              {met ? (
                <p className={styles.removalStatus} data-met={true}>
                  ✓ Đạt mục tiêu ≥90%
                </p>
              ) : removal !== null ? (
                <p className={styles.removalStatus} data-met={false}>
                  Chưa đạt 90%
                </p>
              ) : null}
            </article>
          )
        })}
      </div>
    </section>
  )
}

function QCVNComplianceSection({ report }: { report: WaterTreatmentReportSnapshot }) {
  const { goalStatus } = report

  return (
    <section className={styles.section} aria-label="Đối chiếu QCVN 40:2025 Cột A">
      <h3>Đối chiếu QCVN 40:2025 Cột A</h3>
      <p className={styles.context}>
        Xả thải công nghiệp phải đạt các giới hạn sau. Không áp dụng cho nước uống.
      </p>

      <div className={styles.criteriaTable}>
        <table>
          <caption>Kết quả so với QCVN 40:2025 Cột A</caption>
          <thead>
            <tr>
              <th>Chỉ tiêu</th>
              <th>Giá trị đo</th>
              <th>Giới hạn</th>
              <th>Kết quả</th>
            </tr>
          </thead>
          <tbody>
            {goalStatus.criteria.map((criterion) => {
              const limitText =
                criterion.key === 'ph'
                  ? `${criterion.limit.min}–${criterion.limit.max}`
                  : `≤ ${criterion.limit.value} mg/L`

              return (
                <tr key={criterion.key} data-met={criterion.met}>
                  <th scope="row">{criterion.label}</th>
                  <td>
                    {fmt(criterion.value)}
                    {criterion.value !== null && (criterion.key === 'ph' ? '' : ' mg/L')}
                  </td>
                  <td>{limitText}</td>
                  <td>{criterion.met ? '✓ Đạt' : '✗ Vượt'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {goalStatus.goalMet ? (
        <p className={styles.success}>
          <CheckCircleIcon />
          <strong>Đạt toàn bộ Cột A QCVN 40:2025/BTNMT</strong>
        </p>
      ) : (
        <p className={styles.failure}>
          <InfoIcon />
          <strong>Chưa đạt toàn bộ chuẩn</strong>
        </p>
      )}

      <p className={styles.note}>
        Chuẩn Cột A là QCVN 40:2025/BTNMT — xả thải công nghiệp. Không dùng cho nước uống.
      </p>
    </section>
  )
}

function DiagnosticsSection({ report }: { report: WaterTreatmentReportSnapshot }) {
  if (report.diagnostics.length === 0) {
    return (
      <section className={styles.section} aria-label="Điểm cần xem lại">
        <h3>Điểm cần xem lại</h3>
        <p>Không ghi nhận vấn đề trong quá trình thực hành. Tiếp tục đối chiếu các chỉ tiêu ở trên.</p>
      </section>
    )
  }

  return (
    <section className={styles.section} aria-label="Điểm cần xem lại">
      <h3>Điểm cần xem lại</h3>
      <ul className={styles.diagnostics}>
        {report.diagnostics.map((diagnostic, index) => (
          <li key={index} data-severity={diagnostic.severity}>
            <strong>{diagnostic.message}</strong>
            <p>{diagnostic.suggestion}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

function TreatmentSummarySection({ report }: { report: WaterTreatmentReportSnapshot }) {
  return (
    <section className={styles.section} aria-label="Tóm tắt quy trình">
      <h3>Quy trình đã thực hiện</h3>

      <div className={styles.stationGrid}>
        <article className={styles.stationCard}>
          <h4>Bàn 1: Pha mẫu</h4>
          <dl>
            <div>
              <dt>Thể tích</dt>
              <dd>{report.sampleStatus.volumeMl} mL</dd>
            </div>
            {report.sampleCalculation && (
              <>
                <div>
                  <dt>Fe</dt>
                  <dd>{fmt(report.sampleCalculation.dissolvedMgL.fe)} mg/L</dd>
                </div>
                <div>
                  <dt>Zn</dt>
                  <dd>{fmt(report.sampleCalculation.dissolvedMgL.zn)} mg/L</dd>
                </div>
                <div>
                  <dt>Pb</dt>
                  <dd>{fmt(report.sampleCalculation.dissolvedMgL.pb)} mg/L</dd>
                </div>
              </>
            )}
          </dl>
        </article>

        <article className={styles.stationCard}>
          <h4>Bàn 2: Xử lý hydroxide</h4>
          <dl>
            <div>
              <dt>NaOH đã thêm</dt>
              <dd>{fmt(report.treatmentStatus.naohAddedMl)} mL</dd>
            </div>
            <div>
              <dt>Khuấy</dt>
              <dd>{report.treatmentStatus.stirDurationSeconds} giây</dd>
            </div>
            <div>
              <dt>Lắng</dt>
              <dd>{report.treatmentStatus.settleDurationSeconds} giây</dd>
            </div>
            <div>
              <dt>Lọc</dt>
              <dd>{report.treatmentStatus.filterCount} lần</dd>
            </div>
            {report.ban2LockedData && (
              <div>
                <dt>pH cuối</dt>
                <dd>{fmt(report.ban2LockedData.finalPH)}</dd>
              </div>
            )}
          </dl>
        </article>

        <article className={styles.stationCard}>
          <h4>Bàn 3: Xả thải</h4>
          <dl>
            <div>
              <dt>Trạng thái</dt>
              <dd>
                {report.dischargePhase === 'discharged'
                  ? 'Đã xả'
                  : report.dischargePhase === 'discharging'
                    ? 'Đang xả'
                    : 'Chưa xả'}
              </dd>
            </div>
            {report.dischargePH !== null && (
              <div>
                <dt>pH xả</dt>
                <dd>{fmt(report.dischargePH)}</dd>
              </div>
            )}
          </dl>
        </article>
      </div>
    </section>
  )
}

export function WaterTreatmentReport({ report }: { report: WaterTreatmentReportSnapshot }) {
  const title = !report.goalStatus.evaluable
    ? 'Chưa đủ dữ liệu để đánh giá'
    : report.goalStatus.goalMet
      ? 'Đã đạt mục tiêu bài thực hành'
      : 'Đã nộp · Còn điểm cần xem lại'

  return (
    <div className={styles.report}>
      <div className={styles.status} data-met={report.goalStatus.goalMet}>
        {report.goalStatus.goalMet ? <CheckCircleIcon /> : <InfoIcon />}
        <div>
          <h2>{title}</h2>
          <p>
            {report.resources.operationCount} thao tác · Dùng {report.resources.waterUsedMl} mL nước · Lưu lúc{' '}
            {report.generatedAt.toLocaleString('vi-VN')}
          </p>
        </div>
      </div>

      <p className={styles.context}>
        Kết quả tính cho mẫu tổng hợp Fe/Zn/Pb dùng trong bài học, không phải số liệu thực nghiệm.
      </p>

      <RemovalEfficiencySection report={report} />
      <QCVNComplianceSection report={report} />
      <TreatmentSummarySection report={report} />
      <DiagnosticsSection report={report} />

      <details className={styles.details}>
        <summary>Hồ sơ và tài nguyên</summary>
        <p>
          {report.releaseId} · {report.versions.profileId} v{report.versions.profileVersion}
        </p>
        <dl className={styles.resources}>
          <div>
            <dt>Nước</dt>
            <dd>{report.resources.waterUsedMl} mL</dd>
          </div>
          <div>
            <dt>NaOH</dt>
            <dd>
              {report.resources.reagents.naoh.amount} {report.resources.reagents.naoh.unit}
            </dd>
          </div>
          <div>
            <dt>HCl</dt>
            <dd>
              {report.resources.reagents.hcl.amount} {report.resources.reagents.hcl.unit}
            </dd>
          </div>
        </dl>
        <p className={styles.note}>
          Mô phỏng học tập với mẫu tổng hợp; kết quả không chứng nhận nước an toàn để uống hay xả thải.
        </p>
      </details>
    </div>
  )
}
