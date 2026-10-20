import Link from 'next/link'
import type { Metadata } from 'next'
import { EXTRACTION_SOURCES } from '@/content/evidence/acid-base-extraction.js'
import { ExtractionEvidence } from '@/features/extraction/evidence.js'
import { JAR_PROFILE } from '@/domain/experiments/jar-test/model.js'
import { JAR_LIMITS, JAR_SOURCES } from '@/content/evidence/jar-test.js'
import { PLASTIC_SOURCES } from '@/content/evidence/plastic-density-separation.js'
import { EXPERIMENT_OVERVIEWS } from '@/features/experiment-catalog/overviews.js'
import { EvidenceExperimentBrowser } from '@/features/scientific-evidence/experiment-browser.js'
import { ArrowRightIcon, BookIcon, CalculatorIcon } from '@/features/landing/icons.js'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs.js'
import { ScienceBackdrop } from '@/shared/ui/science-backdrop.js'

export const metadata: Metadata = {
  title: 'Nguồn khoa học',
  description: 'Nguồn Jar Test và chiết tách axit–bazơ, tài liệu phương pháp và giới hạn áp dụng.',
}

export default function EvidencePage() {
  const experiments = [...EXPERIMENT_OVERVIEWS].sort((a, b) => Number(b.scenarioKey === 'jar-test') - Number(a.scenarioKey === 'jar-test'))
    .map(item => ({ key: item.scenarioKey, title: item.title, category: item.category, sourceCount: item.scenarioKey === 'jar-test' ? JAR_SOURCES.length : item.scenarioKey === 'acid-base-extraction' ? EXTRACTION_SOURCES.length : item.scenarioKey === 'plastic-density-separation' ? Object.keys(PLASTIC_SOURCES).length : null }))
  return <div className="page evidence-library">
    <ScienceBackdrop />
    <Breadcrumbs items={[{ label: 'Trang chủ', href: '/' }, { label: 'Nguồn khoa học' }]} />
    <header className="evidence-library-header"><h1>Nguồn khoa học</h1><p>Tài liệu được sử dụng cho từng bài, cách áp dụng và những giới hạn cần biết.</p></header>
    <EvidenceExperimentBrowser experiments={experiments}>
      {experiments.map(experiment => experiment.key === 'acid-base-extraction' ? <ExtractionEvidence key={experiment.key}/> : experiment.key === 'plastic-density-separation' ? <div className="evidence-empty" key={experiment.key}><h2>{experiment.title}</h2><p>Thông số pilot, preset và giới hạn của bài được trình bày cùng tài liệu gốc tại trang bài học.</p><Link href="/experiments/plastic-density-separation#plastic-sources">Xem nguồn và phạm vi bài nhựa <ArrowRightIcon /></Link></div> : experiment.key !== 'jar-test' ? <div className="evidence-empty" key={experiment.key}><h2>{experiment.title}</h2><p>Chưa triển khai bài thực hành. Danh mục nguồn cho bài này chưa được công bố.</p><Link href="/experiments">Xem các bài thí nghiệm <ArrowRightIcon /></Link></div> : <div key={experiment.key}>
        <div className="evidence-lesson-heading"><div><h2>Jar Test</h2><p>Một nguồn cho phương trình tính kết quả, một nguồn cho quy trình thực hành. Mở từng tài liệu để xem cách bài học sử dụng.</p></div><Link href="/experiments/jar-test">Xem bài thí nghiệm <ArrowRightIcon /></Link></div>
        <div className="evidence-source-groups"><section className="evidence-source-group"><h3><BookIcon />Tài liệu đang sử dụng <span>{JAR_SOURCES.length} nguồn</span></h3><div className="evidence-source-grid">{JAR_SOURCES.map(source => <article className="evidence-source-card" key={source.key} data-source-role={source.key === 'alateef-2024-rsm' ? 'model' : 'procedure'}>
          <div className="evidence-source-role"><span aria-hidden="true">{source.key === 'alateef-2024-rsm' ? <CalculatorIcon /> : <BookIcon />}</span><div><strong>{source.kind}</strong><p>{source.key === 'alateef-2024-rsm' ? 'Phương trình giảm độ đục cuối quy trình' : 'Thao tác Jar Test và an toàn phòng thí nghiệm'}</p></div></div>
          <h4>{source.title}</h4><p className="evidence-source-organization">{source.author}</p>
          <div className="evidence-source-actions"><a href={source.url} target="_blank" rel="noopener noreferrer">Tài liệu gốc <ArrowRightIcon /></a></div>
          <details className="evidence-disclosure evidence-source-detail"><summary>Cách dùng & giới hạn <ArrowRightIcon /></summary><div className="evidence-disclosure-body"><p>{source.use}</p><dl className="evidence-source-facts"><div><dt>Phần tham khảo</dt><dd>{source.location}</dd></div></dl><p>{source.limit}</p>{source.alternativeUrl && <p><a href={source.alternativeUrl} target="_blank" rel="noopener noreferrer">Bản toàn văn do tác giả chia sẻ</a></p>}</div></details>
        </article>)}</div></section></div>
        <section className="evidence-model-details"><h2><CalculatorIcon />Phạm vi của bản mô phỏng</h2><p>Chỉ tính kết quả cuối quy trình trong hồ sơ mẫu đã khóa.</p><dl className="evidence-profile-summary"><div><dt>Mẫu ban đầu</dt><dd>Kaolin · {JAR_PROFILE.initialNtu} NTU</dd></div><div><dt>Điều kiện khảo sát</dt><dd>pH {JAR_PROFILE.availableInitialPh.join(' / ')} · {JAR_PROFILE.minDoseMgL}–{JAR_PROFILE.maxDoseMgL} mg/L</dd></div><div><dt>Đầu ra mô hình</dt><dd>Độ đục cuối · Hiệu suất giảm đục</dd></div></dl>
          <details className="evidence-disclosure"><summary>Hồ sơ và quy ước học tập <ArrowRightIcon /></summary><div className="evidence-disclosure-body"><ul>{JAR_LIMITS.map(limit => <li key={limit}>{limit}</li>)}</ul><p>Mỗi cốc chứa {JAR_PROFILE.aliquotVolumeL.toLocaleString('vi-VN')} L mẫu. Khuấy nhanh {JAR_PROFILE.phases.rapid.rpm} rpm trong {JAR_PROFILE.phases.rapid.durationSeconds} giây; khuấy chậm {JAR_PROFILE.phases.slow.rpm} rpm trong {JAR_PROFILE.phases.slow.durationSeconds / 60} phút; lắng {JAR_PROFILE.phases.settling.durationSeconds / 60} phút mô phỏng.</p><p>Thể tích mỗi cốc, bước liều {JAR_PROFILE.doseStepMgL} mg/L và mục tiêu {JAR_PROFILE.goalRemovalPercent}% là các lựa chọn của bài học. Phiên bản: {JAR_PROFILE.releaseId}.</p></div></details>
          <details className="evidence-disclosure"><summary>Cách tính và mức độ kiểm chứng <ArrowRightIcon /></summary><div className="evidence-disclosure-body"><p>Engine dùng Equation 3 với hệ số in công bố, cố định độ đục đầu 125 NTU và lựa chọn mô hình cánh khuấy hai bản. Hiệu suất giảm đục được đổi thành NTU cuối.</p><p>Người học tự tính (NTU đầu − NTU cuối) / NTU đầu × 100. Chỉ đối chiếu khi có số đo hợp lệ.</p><p>Kiểm tra số học và khả năng tái hiện phần mềm không thay thế kiểm chứng thực nghiệm ngoài mẫu. Không suy kết quả cho nước thải thật hoặc điều kiện ngoài hồ sơ.</p></div></details>
          <Link href="/experiments/jar-test/guide">Đọc lý thuyết & cách làm bài <ArrowRightIcon /></Link>
        </section>
      </div>)}
    </EvidenceExperimentBrowser>
  </div>
}
