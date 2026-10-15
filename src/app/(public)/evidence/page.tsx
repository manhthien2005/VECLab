import Link from 'next/link'
import type { Metadata } from 'next'
import { JAR_PROFILE } from '@/domain/experiments/jar-test/model.js'
import { JAR_LIMITS, JAR_SOURCES } from '@/content/evidence/jar-test.js'
import { EXPERIMENT_OVERVIEWS } from '@/features/experiment-catalog/overviews.js'
import { EvidenceExperimentBrowser } from '@/features/scientific-evidence/experiment-browser.js'
import { ArrowRightIcon, BookIcon, CalculatorIcon } from '@/features/landing/icons.js'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs.js'
import { ScienceBackdrop } from '@/shared/ui/science-backdrop.js'

export const metadata: Metadata = {
  title: 'Nguồn khoa học',
  description: 'Nguồn mô hình Jar Test, tài liệu quy trình và giới hạn áp dụng.',
}

export default function EvidencePage() {
  const experiments = [...EXPERIMENT_OVERVIEWS].sort((a, b) => Number(b.scenarioKey === 'jar-test') - Number(a.scenarioKey === 'jar-test'))
    .map(item => ({ key: item.scenarioKey, title: item.title, category: item.category, sourceCount: item.scenarioKey === 'jar-test' ? JAR_SOURCES.length : null }))
  return <div className="page evidence-library">
    <ScienceBackdrop />
    <Breadcrumbs items={[{ label: 'Trang chủ', href: '/' }, { label: 'Nguồn khoa học' }]} />
    <header className="evidence-library-header"><h1>Nguồn khoa học</h1><p>Tài liệu được sử dụng cho từng bài, cách áp dụng và những giới hạn cần biết.</p></header>
    <EvidenceExperimentBrowser experiments={experiments}>
      {experiments.map(experiment => experiment.key !== 'jar-test' ? <div className="evidence-empty" key={experiment.key}><h2>{experiment.title}</h2><p>Chưa triển khai bài thực hành. Danh mục nguồn cho bài này chưa được công bố.</p><Link href="/experiments">Xem các bài thí nghiệm <ArrowRightIcon /></Link></div> : <div key={experiment.key}>
        <div className="evidence-lesson-heading"><div><h2>Jar Test</h2><p>Mô hình giảm độ đục bằng phèn nhôm. Các tài liệu dưới đây có vai trò khác nhau; không phải chứng nhận chất lượng sản phẩm.</p></div><Link href="/experiments/jar-test">Xem bài thí nghiệm <ArrowRightIcon /></Link></div>
        <div className="evidence-source-groups"><section className="evidence-source-group"><h3><BookIcon />Tài liệu đang sử dụng <span>{JAR_SOURCES.length} nguồn</span></h3><div className="evidence-source-grid">{JAR_SOURCES.map(source => <article className="evidence-source-card" key={source.key}>
          <span className="experiment-topic">{source.kind}</span><h4>{source.title}</h4><p className="evidence-source-organization">{source.author}</p>
          <div className="evidence-source-actions"><a href={source.url} target="_blank" rel="noopener noreferrer">Tài liệu gốc <ArrowRightIcon /></a></div>
          <details className="evidence-disclosure evidence-source-detail"><summary>Cách dùng & giới hạn <ArrowRightIcon /></summary><div className="evidence-disclosure-body"><p>{source.use}</p><dl className="evidence-source-facts"><div><dt>Phần tham khảo</dt><dd>{source.location}</dd></div></dl><p>{source.limit}</p>{source.alternativeUrl && <p><a href={source.alternativeUrl} target="_blank" rel="noopener noreferrer">Bản toàn văn do tác giả chia sẻ</a></p>}</div></details>
        </article>)}</div></section></div>
        <section className="evidence-model-details"><h2><CalculatorIcon />Phạm vi của bản mô phỏng</h2><p>125 NTU · pH 5 / 7 / 9 · Phèn nhôm 50–250 mg/L. Chỉ tính kết quả cuối quy trình.</p>
          <details className="evidence-disclosure"><summary>Hồ sơ và quy ước học tập <ArrowRightIcon /></summary><div className="evidence-disclosure-body"><ul>{JAR_LIMITS.map(limit => <li key={limit}>{limit}</li>)}</ul><p>Mỗi cốc chứa {JAR_PROFILE.aliquotVolumeL.toLocaleString('vi-VN')} L mẫu. Khuấy nhanh {JAR_PROFILE.phases.rapid.rpm} rpm trong {JAR_PROFILE.phases.rapid.durationSeconds} giây; khuấy chậm {JAR_PROFILE.phases.slow.rpm} rpm trong {JAR_PROFILE.phases.slow.durationSeconds / 60} phút; lắng {JAR_PROFILE.phases.settling.durationSeconds / 60} phút mô phỏng.</p><p>Thể tích mỗi cốc, bước liều {JAR_PROFILE.doseStepMgL} mg/L và mục tiêu {JAR_PROFILE.goalRemovalPercent}% là các lựa chọn của bài học. Phiên bản: {JAR_PROFILE.releaseId}.</p></div></details>
          <details className="evidence-disclosure"><summary>Cách tính và mức độ kiểm chứng <ArrowRightIcon /></summary><div className="evidence-disclosure-body"><p>Engine dùng Equation 3 với hệ số in công bố, cố định độ đục đầu 125 NTU và lựa chọn mô hình cánh khuấy hai bản. Hiệu suất giảm đục được đổi thành NTU cuối.</p><p>Người học tự tính (NTU đầu − NTU cuối) / NTU đầu × 100. Chỉ đối chiếu khi có số đo hợp lệ.</p><p>Kiểm tra số học và khả năng tái hiện phần mềm không thay thế kiểm chứng thực nghiệm ngoài mẫu. Không suy kết quả cho nước thải thật hoặc điều kiện ngoài hồ sơ.</p></div></details>
          <Link href="/experiments/jar-test/guide">Đọc lý thuyết & cách làm bài <ArrowRightIcon /></Link>
        </section>
      </div>)}
    </EvidenceExperimentBrowser>
  </div>
}
