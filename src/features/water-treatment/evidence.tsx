import Link from 'next/link'
import { WATER_TREATMENT_LIMITS, WATER_TREATMENT_SOURCES } from '@/content/evidence/water-treatment.js'
import { ArrowRightIcon, BookIcon, CalculatorIcon } from '@/features/landing/icons.js'

export function WaterTreatmentEvidence() {
  return <div>
    <div className="evidence-lesson-heading">
      <div>
        <h2>Hóa học nước – hydroxide route</h2>
        <p>Nguồn quy chuẩn được tách biệt với tài liệu phương pháp và mô hình; mục tiêu học tập không xác nhận kết quả xử lý nước thật.</p>
      </div>
      <Link href="/experiments/water-treatment/guide">Xem bài thí nghiệm <ArrowRightIcon /></Link>
    </div>
    <section className="evidence-source-group">
      <h3><BookIcon />Tài liệu đang sử dụng <span>{WATER_TREATMENT_SOURCES.length} nguồn</span></h3>
      <div className="evidence-source-grid">{WATER_TREATMENT_SOURCES.map((source) => (
        <article className="evidence-source-card" key={source.key}>
          <div className="evidence-source-role"><span aria-hidden="true"><BookIcon /></span><div><strong>{source.kind}</strong><p>{source.author}</p></div></div>
          <h4>{source.title}</h4>
          <div className="evidence-source-actions"><a href={source.url} target="_blank" rel="noopener noreferrer">Tài liệu gốc <ArrowRightIcon /></a></div>
          <details className="evidence-disclosure evidence-source-detail"><summary>Cách dùng & giới hạn <ArrowRightIcon /></summary>
            <div className="evidence-disclosure-body"><p>{source.use}</p><dl className="evidence-source-facts"><div><dt>Phần tham khảo</dt><dd>{source.location}</dd></div></dl><p>{source.limit}</p></div>
          </details>
        </article>
      ))}</div>
    </section>
    <section className="evidence-model-details">
      <h2><CalculatorIcon />Phạm vi mô hình và đối chiếu</h2>
      <ul>{WATER_TREATMENT_LIMITS.map((limit) => <li key={limit}>{limit}</li>)}</ul>
      <p>Danh mục này phân biệt căn cứ quy chuẩn, tài liệu nguyên lý và giới hạn của mô hình. Việc đối chiếu số học hoặc mô phỏng không phải kiểm chứng thực nghiệm độc lập.</p>
      <Link href="/experiments/water-treatment/guide">Đọc lý thuyết và phạm vi căn cứ <ArrowRightIcon /></Link>
    </section>
  </div>
}
