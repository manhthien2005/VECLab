import Link from 'next/link'
import { SOAP_LIMITS, SOAP_SOURCES, SOAP_SOURCED_FORMULAS } from '@/content/evidence/soap.js'
import { ArrowRightIcon, BookIcon, CalculatorIcon } from '@/features/landing/icons.js'

export function SoapEvidence() {
  return <div>
    <div className="evidence-lesson-heading">
      <div>
        <h2>Xà phòng hóa (cold process)</h2>
        <p>Chỉ hiện nguồn trạng thái A (có URL). Mục chưa đủ nguồn không gắn vào bài như đã xác nhận.</p>
      </div>
      <Link href="/experiments/cold-process-soap">Xem bài thí nghiệm <ArrowRightIcon /></Link>
    </div>
    <section className="evidence-source-group">
      <h3><BookIcon />Tài liệu đang sử dụng <span>{SOAP_SOURCES.length} nguồn</span></h3>
      <div className="evidence-source-grid">{SOAP_SOURCES.map((source) => (
        <article className="evidence-source-card" key={source.key}>
          <div className="evidence-source-role"><span aria-hidden="true"><BookIcon /></span><div><strong>{source.kind}</strong><p>{source.author}</p></div></div>
          <h4>{source.title}</h4>
          <div className="evidence-source-actions">
            <a href={source.url} target="_blank" rel="noopener noreferrer">Tài liệu gốc <ArrowRightIcon /></a>
            {source.alternativeUrl && <a href={source.alternativeUrl} target="_blank" rel="noopener noreferrer">Bản khác <ArrowRightIcon /></a>}
          </div>
          <details className="evidence-disclosure evidence-source-detail"><summary>Cách dùng & giới hạn <ArrowRightIcon /></summary>
            <div className="evidence-disclosure-body"><p>{source.use}</p><p>{source.limit}</p><p>{source.location}</p></div>
          </details>
        </article>
      ))}</div>
    </section>
    <section className="evidence-model-details">
      <h2><CalculatorIcon />Công thức đã gắn nguồn</h2>
      <ul>{SOAP_SOURCED_FORMULAS.filter((item) => item.cups.length > 0).map((item) => <li key={item.key}><strong>{item.title}</strong> — {item.lines[0]}</li>)}</ul>
    </section>
    <section className="evidence-model-details">
      <h2><CalculatorIcon />Phạm vi mô hình</h2>
      <ul>{SOAP_LIMITS.map((item) => <li key={item}>{item}</li>)}</ul>
    </section>
  </div>
}
