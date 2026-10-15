import Link from 'next/link'
import type { ExtractionActionSummary, ExtractionReportSnapshot } from '@/application/scenarios/extraction-projection.js'
import { extractionActionLabel } from './action-label.js'
import styles from './report.module.css'

export const fmt = (value: number | null, digits = 2) => value === null ? 'N/A' : value.toLocaleString('vi-VN', { maximumFractionDigits: digits })
type Product = ExtractionReportSnapshot['products'][number]
const COMPONENT_NAMES = { A: 'Axit yếu', B: 'Bazơ yếu', N: 'Chất trung tính' }
const VESSEL_NAMES = { S: 'Bình mẫu', F: 'Phễu chiết', R1: 'Bình thu 1', R2: 'Bình thu 2', R3: 'Bình thu 3', W: 'Bình thải' }

// Older snapshots retain their original wording; simplify it only when displaying.
function diagnosticText(message: string) {
  return message.replaceAll('cấu tử', 'chất').replaceAll('Cấu tử', 'Chất')
    .replace('chất mục tiêu', 'chất cần thu hồi')
    .replace('cân bằng lượng chất để xác định phần bị gộp', 'lượng chất trong từng bình để xác định phần còn lẫn')
}

function MetricBar({ component, label, value, target }: { component: string; label: string; value: number | null; target: number }) {
  return <div className={styles.metric} role="img" aria-label={`${label} ${component}: ${value === null ? 'N/A' : `${fmt(value)} %`}; mục tiêu ${target} %`}>
    <div className={styles.metricLabel} aria-hidden="true"><span>{label}</span><strong>{fmt(value)}{value !== null && ' %'}</strong></div>
    <div className={styles.metricTrack} aria-hidden="true">
      {value !== null && <span className={styles.metricFill} data-met={value >= target} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />}
      <span className={styles.targetMarker} style={{ left: `${target}%` }} />
    </div>
    <span className={styles.targetLabel} aria-hidden="true">Mục tiêu ≥{target}%</span>
  </div>
}

function productInsight(product: Product) {
  if (!product.vesselId) return 'Chưa khai báo bình sản phẩm.'
  if (product.recovery === null || product.purity === null) return 'Chưa đủ dữ liệu để đối chiếu cả hai chỉ tiêu.'
  const recoveryGap = Math.max(0, 80 - product.recovery), purityGap = Math.max(0, 90 - product.purity)
  if (recoveryGap && purityGap) return `Thu hồi thấp hơn mục tiêu ${fmt(recoveryGap)} điểm %; độ tinh khiết thấp hơn ${fmt(purityGap)} điểm %.`
  if (recoveryGap) return `Độ tinh khiết đạt; thu hồi còn thiếu ${fmt(recoveryGap)} điểm % so với mục tiêu.`
  if (purityGap) return `Thu hồi đạt; độ tinh khiết còn thiếu ${fmt(purityGap)} điểm % so với mục tiêu.`
  return 'Đạt cả hai chỉ tiêu của mẫu.'
}

function ProductResult({ product }: { product: Product }) {
  return <article className={styles.product} aria-label={`Kết quả sản phẩm ${product.component}`}>
    <header className={styles.productHeader}>
      <span className={styles.componentId}>{product.component}</span>
      <div><h4>{COMPONENT_NAMES[product.component]}</h4><span>{product.vesselId ? `Bình sản phẩm ${product.vesselId}` : 'Chưa chọn bình'}</span></div>
    </header>
    <MetricBar component={product.component} label="Thu hồi" value={product.recovery} target={80} />
    <MetricBar component={product.component} label="Độ tinh khiết" value={product.purity} target={90} />
    <p className={styles.insight}>{productInsight(product)}</p>
    <div className={styles.calculation}>
      <h5>Phép tính từ khối lượng cân</h5>
      <dl>
        <div><dt>Đã cân</dt><dd>{product.measuredMassMg === null ? 'Chưa cân' : `${fmt(product.measuredMassMg)} mg`}</dd></div>
        <div><dt>Bạn nộp</dt><dd>{fmt(product.answer)}{product.answer !== null && ' %'}</dd></div>
        <div><dt>Theo phép cân</dt><dd>{fmt(product.expectedAnswer)}{product.expectedAnswer !== null && ' %'}</dd></div>
      </dl>
      <p className={styles.answerError} data-warning={product.answerError !== null && product.answerError > 1}>
        {product.answerError === null ? 'Chưa đủ dữ liệu đối chiếu đáp số.' : `Lệch ${fmt(product.answerError)} điểm %`}
      </p>
      {product.vesselId && <p className={styles.readingState}>
        {product.measuredMassMg === null ? 'Cần cân mẫu.' : !product.currentMeasurement ? 'Số đo cũ · Cần cân sau thao tác cuối.' : 'Số đo sau thao tác cuối.'}
        {!product.dry && ' Chưa làm khô; khối lượng có thể gồm dung môi.'}
      </p>}
    </div>
  </article>
}

function Distribution({ report }: { report: ExtractionReportSnapshot }) {
  return <section className={styles.distribution} aria-label="Phân bố lượng chất sau thực hành">
    <h3>Lượng chất còn ở từng bình</h3>
    <p className={styles.context}>Mỗi thanh là 100 mg ban đầu của một chất. Các phần màu biểu thị lượng còn ở từng bình.</p>
    <ul className={styles.legend} aria-label="Ký hiệu các bình">{Object.entries(VESSEL_NAMES).map(([id, name]) => <li key={id}><span className={styles.swatch} data-vessel={id} aria-hidden="true" /><strong>{id}</strong> {name}</li>)}</ul>
    {report.products.map(product => {
      const parts = report.distribution.map(row => ({ id: row.vesselId, amount: row.amountsMg[product.component] }))
      const visibleParts = parts.filter(part => part.amount > 0).sort((a, b) => b.amount - a.amount)
      const outside = parts.filter(part => part.id !== product.vesselId).reduce((sum, part) => sum + part.amount, 0)
      const waste = parts.find(part => part.id === 'W')?.amount ?? 0
      return <figure className={styles.distributionRow} key={product.component} aria-label={`Phân bố chất ${product.component}`}>
        <figcaption><strong>{product.component}</strong><span>{COMPONENT_NAMES[product.component]}</span></figcaption>
        <div className={styles.distributionBody}>
          <div className={styles.distributionTrack} role="img" aria-label={visibleParts.map(part => `${part.id}: ${fmt(part.amount)} mg`).join('; ') || 'Không còn lượng chất trong các bình'}>
            {parts.map(part => <span key={part.id} data-vessel={part.id} style={{ width: `${Math.max(0, part.amount)}%` }} title={`${part.id}: ${fmt(part.amount)} mg`} />)}
          </div>
          <ul className={styles.distributionValues}>{visibleParts.map(part => <li key={part.id}><span className={styles.swatch} data-vessel={part.id} aria-hidden="true" /><strong>{part.id}</strong> {fmt(part.amount)} mg</li>)}</ul>
          <p className={styles.context}>{product.vesselId
            ? `${fmt(outside)} mg ngoài bình sản phẩm ${product.vesselId}${waste > 0 && product.vesselId !== 'W' ? `, trong đó ${fmt(waste)} mg ở bình thải W` : ''}.`
            : 'Chưa chọn bình sản phẩm để đối chiếu lượng thu hồi.'}</p>
        </div>
      </figure>
    })}
    <p className={styles.note}>Chất còn hòa tan trong dịch không tự chứng minh thao tác sai. Xem các thao tác có bằng chứng ở phần dưới.</p>
    <details className={styles.details}><summary>Xem lượng chất chi tiết theo bình</summary><div className={styles.tableScroll}><table>
      <caption>Cân bằng mẫu mô phỏng — ban đầu 100 mg mỗi chất</caption>
      <thead><tr><th>Bình</th><th>A (mg)</th><th>B (mg)</th><th>N (mg)</th></tr></thead>
      <tbody>{report.distribution.map(row => <tr key={row.vesselId}><th scope="row">{row.vesselId}</th><td>{fmt(row.amountsMg.A)}</td><td>{fmt(row.amountsMg.B)}</td><td>{fmt(row.amountsMg.N)}</td></tr>)}</tbody>
    </table></div></details>
  </section>
}

export function ExtractionReport({ report, actions }: { report: ExtractionReportSnapshot; actions?: readonly ExtractionActionSummary[] }) {
  const log = report.actions ?? actions ?? []
  const byId = new Map(log.map(action => [action.actionId, action]))
  const title = !report.goalStatus.evaluable ? 'Chưa đủ dữ liệu để đánh giá'
    : report.goalStatus.goalMet ? 'Đã đạt mục tiêu bài thực hành'
      : report.protocol?.passed === false && report.goalStatus.primaryCriteria.filter(c => c.key !== 'mixing').every(c => c.met)
        ? 'Đạt chỉ tiêu mẫu · Cần xem lại thao tác' : 'Đã nộp · Còn điểm cần xem lại'
  return <div className={styles.report}>
    <div className={styles.status} data-met={report.goalStatus.goalMet}>
      <h2>{title}</h2>
      <p>{report.products.filter(product => product.vesselId !== null).length}/3 sản phẩm đã khai báo · {report.resources.operationCount} thao tác đã lưu</p>
      {report.protocol ? <p className={styles.protocol}><strong>Thao tác trộn: {report.protocol.passed ? 'Đạt' : 'Cần xem lại'}</strong>{!report.protocol.passed && ` · ${report.protocol.issues.length} lần thu mẫu khi chưa trộn.`}</p>
        : <p className={styles.protocol}>Lượt phiên bản cũ: giữ quy tắc đánh giá lúc tạo lượt, chưa có tiêu chí thao tác trộn.</p>}
    </div>
    <p className={styles.context}>Kết quả tính cho mẫu A/B/N dùng trong bài học, không phải số liệu thực nghiệm.</p>
    <section className={styles.results} aria-label="Đối chiếu sản phẩm với mục tiêu">
      <h3>Chất lượng từng sản phẩm</h3>
      <div className={styles.products}>{report.products.map(product => <ProductResult key={product.component} product={product} />)}</div>
      <p className={styles.note}>Thu hồi = lượng chất thu được / 100 mg ban đầu. Độ tinh khiết = phần chất đó trong tổng A/B/N của bình sản phẩm.</p>
      <details className={styles.details}><summary>Cách đối chiếu phép tính</summary><p>Thu hồi tính từ khối lượng cân = khối lượng đã cân / 100 mg × 100%. Chỉ số này có thể cao do lẫn tạp hoặc còn dung môi, khác với thu hồi chất theo mô hình. Độ lệch đáp số tính bằng điểm phần trăm; số đo cũ chưa đủ để đánh giá kết quả.</p></details>
      <details className={styles.details} data-testid="extraction-product-data"><summary>Xem số liệu sản phẩm</summary><div className={styles.tableScroll}><table>
        <caption>Sản phẩm đã khai báo</caption>
        <thead><tr><th>Chất</th><th>Bình</th><th>Cân (mg)</th><th>Thu hồi mô hình (%)</th><th>Tinh khiết mô hình (%)</th><th>Đáp số (%)</th><th>Lệch phép tính (điểm %)</th></tr></thead>
        <tbody>{report.products.map(p => <tr key={p.component}><th scope="row">{p.component}</th><td>{p.vesselId ?? 'Chưa chọn'}</td><td>{fmt(p.measuredMassMg)}{!p.currentMeasurement && p.measuredMassMg !== null ? ' · Số đo cũ' : ''}</td><td>{fmt(p.recovery)}</td><td>{fmt(p.purity)}</td><td>{fmt(p.answer)}</td><td>{fmt(p.answerError)}</td></tr>)}</tbody>
      </table></div></details>
    </section>
    <Distribution report={report} />
    <section className={styles.review} aria-label="Điểm cần xem lại">
      <h3>Điểm cần xem lại</h3>
      {report.diagnostics.length ? <ul className={styles.diagnostics}>{report.diagnostics.map((d, i) => <li key={i}>
        <p>{diagnosticText(d.message)}</p>{d.actionIds.length > 0 && <details className={styles.details}><summary>Thao tác liên quan</summary><ul>
          {d.actionIds.map(id => { const action = byId.get(id); return <li key={id}>{action ? `#${action.sequence} · ${extractionActionLabel(action)}` : 'Chi tiết bước này không có trong lượt đã lưu.'}</li> })}
        </ul></details>}
      </li>)}</ul> : <p>Không ghi nhận vấn đề trong các kiểm tra đã lưu. Đối chiếu từng chỉ tiêu và phép tính ở trên để tự đánh giá.</p>}
    </section>
    <details className={styles.details}><summary>Hồ sơ và tài nguyên</summary>
      <p>{report.releaseId} · {report.versions.modelSpecVersion}</p>
      <ul>{Object.entries(report.resources.reagents).map(([id, quantity]) => <li key={id}>{({ acid: 'Dung dịch axit', base: 'Dung dịch bazơ', water: 'Nước', solvent: 'Dung môi hữu cơ' } as Record<string, string>)[id] ?? id}: {fmt(quantity.amount * 1000)} mL</li>)}</ul>
      <Link href="/experiments/acid-base-extraction/guide">Nguồn và giới hạn mô hình</Link>
    </details>
  </div>
}
