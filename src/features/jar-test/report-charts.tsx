import type { JarReportSnapshot } from '@/application/scenarios/jar-projection.js'
import { jarReportSummary, jarDoseObservation } from './report-insights.js'
import styles from './completion.module.css'

const fmt = (value: number) => value.toLocaleString('vi-VN', { maximumFractionDigits: 2 })
export function JarReportCharts({ report }: { report: JarReportSnapshot }) {
  const { initialNtu, targetFinalNtu, completeCups } = jarReportSummary(report)
  return <>
    <section className={styles.chartSection} aria-label="Hiệu suất từng cốc so với mục tiêu">
      <h3>Mỗi cốc cách mục tiêu bao xa?</h3>
      <p className={styles.note}>Vạch đứng là mục tiêu {report.reference.targetRemovalPercent}%. Thanh chỉ dùng hiệu suất từ số đo hợp lệ; cốc chưa đo giữ N/A.</p>
      <div className={styles.removalChart}>{report.cups.map(cup => {
        const value = cup.measuredRemovalPercent, met = value !== null && value >= report.reference.targetRemovalPercent
        return <figure key={cup.id} className={styles.chartRow} data-chosen={cup.id === report.selectedCupId} aria-label={`Hiệu suất cốc ${cup.id}`}>
          <figcaption><strong>Cốc {cup.id}{cup.id === report.selectedCupId && ' · Đã chọn'}</strong><span>pH {cup.initialPh} · {cup.doseMgL} mg/L</span></figcaption>
          <div className={styles.barBody}><div className={styles.barTrack} role="img" aria-label={`Cốc ${cup.id}: ${value === null ? 'N/A' : fmt(value) + '%'}; mục tiêu ${report.reference.targetRemovalPercent}%`}>
            {value !== null && <span className={styles.barFill} data-met={met} style={{ width: Math.max(0, Math.min(100, value)) + '%' }} />}
            <span className={styles.barTarget} style={{ left: report.reference.targetRemovalPercent + '%' }} />
          </div><p>{value === null ? 'N/A · Thiếu số đo hợp lệ' : `${fmt(value)}% · ${met ? 'Đạt mức giảm đục' : 'Còn thiếu ' + fmt(report.reference.targetRemovalPercent - value) + ' điểm %'}`}</p></div>
        </figure>
      })}</div>
      {!report.cups.length && <p>Chưa có cốc để biểu diễn.</p>}
    </section>
    <section className={styles.chartSection} aria-label="Độ đục trước và sau xử lý"><h3>Độ đục còn lại sau xử lý</h3>
      <p className={styles.note}>{initialNtu === null ? 'Thiếu phép đo mẫu đầu, chưa xác định được mức NTU cần đạt từ số đo.' : `Mẫu đầu ${fmt(initialNtu)} NTU. Để giảm ít nhất ${report.reference.targetRemovalPercent}%, NTU cuối cần không quá ${fmt(targetFinalNtu!)}.`}</p>
      <div className={styles.ntuGrid}>{report.cups.map(cup => {
        const final = cup.measurements.filter(m => m.valid && m.valueNtu !== null).at(-1)?.valueNtu ?? null
        const scale = Math.max(initialNtu ?? 0, final ?? 0, 1)
        return <figure key={cup.id} className={styles.ntuCup} aria-label={`Độ đục cốc ${cup.id}`}><figcaption>Cốc {cup.id}</figcaption>
          {[['Trước xử lý', initialNtu], ['Sau xử lý', final]] .map(([label, raw]) => {
            const value = raw as number | null
            return <div key={label as string} className={styles.ntuReading}><span>{label}</span><strong>{value === null ? 'N/A' : fmt(value) + ' NTU'}</strong><div className={styles.ntuTrack} aria-hidden="true">{value !== null && <span style={{ width: value / scale * 100 + '%' }} />}{targetFinalNtu !== null && <i style={{ left: targetFinalNtu / scale * 100 + '%' }} />}</div></div>
          })}
        </figure>
      })}</div><p className={styles.note}>Sổ so sánh có số đo và đáp số ở {completeCups}/{report.cups.length} cốc. Mục tiêu chung được chấm theo cốc đã chọn.</p>
    </section>
    {report.cups.some(cup => jarDoseObservation(cup, report.cups)) && <section className={styles.observations} aria-label="Nhận xét từ các cốc đã đo"><h3>Điều thấy được từ mẻ này</h3>{report.cups.map(cup => { const message = jarDoseObservation(cup, report.cups); return message ? <p key={cup.id}><strong>Cốc {cup.id} · So sánh liều phèn:</strong> {message}</p> : null })}</section>}
  </>
}
