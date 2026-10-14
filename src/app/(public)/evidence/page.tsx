import Link from 'next/link'
import type { Metadata } from 'next'
import {
  APP_STRINGS, ACID_STRINGS, ACID_SOURCES, ACID_CLAIMS, ACID_DERIVED_VALUES,
  ACID_GOLDEN_PROVENANCE, ACID_NEUTRALIZATION_RELEASE, EVIDENCE_REGISTER_VERSION,
} from '@/content/index.js'
import type { EvidenceSource, SourceType, EvidenceStatus, ClaimEvidenceLink } from '@/content/index.js'
import { EXPERIMENT_OVERVIEWS } from '@/features/experiment-catalog/overviews.js'
import { EvidenceExperimentBrowser } from '@/features/scientific-evidence/experiment-browser.js'
import { ArrowRightIcon, BookIcon, CalculatorIcon, FlaskIcon, ShieldCheckIcon, MoleculeIcon } from '@/features/landing/icons.js'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs.js'
import { ClaimList } from '@/shared/ui/scientific-disclosure.js'
import { formatPhTechnical, formatScientific } from '@/shared/ui/format.js'

export const metadata: Metadata = {
  title: APP_STRINGS.evidence.title,
  description: 'Tài liệu tham khảo theo từng bài thí nghiệm: nguồn, cách sử dụng, điều kiện áp dụng và giới hạn của mô hình.',
}

const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  'authoritative-definition': 'Định nghĩa khoa học',
  'authoritative-technical': 'Tài liệu kỹ thuật',
  'primary-experimental': 'Nghiên cứu thực nghiệm',
  'laboratory-procedure': 'Quy trình phòng thí nghiệm',
  'safety-authority': 'An toàn hóa chất',
  'supporting-study': 'Nghiên cứu bổ trợ',
}
const SOURCE_CATEGORY: Record<SourceType, string> = {
  'authoritative-definition': 'foundations',
  'authoritative-technical': 'foundations',
  'primary-experimental': 'research',
  'laboratory-procedure': 'procedure',
  'safety-authority': 'safety',
  'supporting-study': 'research',
}
const SOURCE_GROUPS = [
  { key: 'foundations', title: 'Định nghĩa và tài liệu kỹ thuật', Icon: BookIcon },
  { key: 'procedure', title: 'Quy trình thực hành', Icon: FlaskIcon },
  { key: 'research', title: 'Nghiên cứu tham khảo', Icon: MoleculeIcon },
  { key: 'safety', title: 'An toàn hóa chất', Icon: ShieldCheckIcon },
] as const
const STATUS_LABELS: Record<EvidenceStatus, string> = {
  'source-checked': 'Đã đối chiếu nguồn',
  'cross-checked': 'Đã kiểm tra chéo',
  'model-derived': 'Dẫn xuất từ mô hình',
  'supporting-only': 'Chỉ dùng tham khảo',
  'excluded-from-model': 'Không dùng trong mô hình',
}
const USAGE_LABELS = {
  constant: 'Hằng số', procedure: 'Quy trình', limitation: 'Giới hạn', safety: 'An toàn', supporting: 'Bổ trợ',
} as const

/** Presentation of the existing register only. Unpublished source sets stay explicitly empty. */
export default function EvidencePage() {
  const acidSources = ACID_NEUTRALIZATION_RELEASE.sourceKeys
    .map(key => ACID_SOURCES[key])
    .filter((source): source is EvidenceSource => source !== undefined)
  const experiments = EXPERIMENT_OVERVIEWS.map(experiment => ({
    key: experiment.scenarioKey,
    title: experiment.title,
    category: experiment.category,
    sourceCount: experiment.scenarioKey === ACID_NEUTRALIZATION_RELEASE.scenarioKey ? acidSources.length : null,
  }))

  return (
    <div className="page evidence-library">
      <EvidenceBackground />
      <Breadcrumbs items={[{ label: 'Trang chủ', href: '/' }, { label: 'Nguồn khoa học' }]} />
      <header className="evidence-library-header">
        <h1>Nguồn khoa học</h1>
        <p>Tra cứu tài liệu và cách từng bài thí nghiệm sử dụng nguồn. Chọn một bài để xem định nghĩa, quy trình, nghiên cứu và hướng dẫn an toàn liên quan.</p>
      </header>
      <EvidenceExperimentBrowser experiments={experiments}>
        {experiments.map(experiment => experiment.key === ACID_NEUTRALIZATION_RELEASE.scenarioKey ? (
          <div key={experiment.key}>
            <div className="evidence-lesson-heading">
              <div><h2>{experiment.title}</h2><p>Thông tin cơ bản hiển thị dưới đây. Mở từng nguồn để xem điều kiện, giới hạn và cách dùng trong bài.</p></div>
              <Link href={`/experiments/${experiment.key}`}>Xem bài thí nghiệm <ArrowRightIcon /></Link>
            </div>
            <div className="evidence-source-groups">
              {SOURCE_GROUPS.map(({ key, title, Icon }) => {
                const sources = acidSources.filter(source => SOURCE_CATEGORY[source.sourceType] === key)
                if (sources.length === 0) return null
                return (
                  <section className={`evidence-source-group evidence-source-group-${key}`} key={key} aria-labelledby={`source-group-${key}`}>
                    <h3 id={`source-group-${key}`}><Icon />{title}<span>{sources.length} nguồn</span></h3>
                    <div className="evidence-source-grid">{sources.map(source => <SourceCard key={source.key} source={source} />)}</div>
                  </section>
                )
              })}
            </div>
            <AcidModelDetails />
          </div>
        ) : (
          <div className="evidence-empty" key={experiment.key}>
            <BookIcon />
            <h2>{experiment.title}</h2>
            <p>Chưa có danh mục nguồn được công bố cho bài này trong phiên bản hiện tại.</p>
            <Link href="/experiments">Xem các bài thí nghiệm <ArrowRightIcon /></Link>
          </div>
        ))}
      </EvidenceExperimentBrowser>
    </div>
  )
}

function SourceCard({ source }: { source: EvidenceSource }) {
  const relatedClaims = ACID_NEUTRALIZATION_RELEASE.claimKeys
    .map(key => ACID_CLAIMS[key])
    .filter((claim): claim is ClaimEvidenceLink => claim !== undefined && claim.sourceKeys.includes(source.key))

  return (
    <article className="evidence-source-card">
      <div className="evidence-source-meta"><span>{SOURCE_TYPE_LABELS[source.sourceType]}</span>{source.year !== null && <span>{source.year}</span>}</div>
      <h4>{source.title}</h4>
      <p className="evidence-source-organization">{source.authorsOrOrganization}</p>
      <div className="evidence-source-actions">
        <a href={source.url} target="_blank" rel="noopener noreferrer" aria-label={`Mở tài liệu gốc — ${source.title}`}>Tài liệu gốc <ArrowRightIcon /></a>
      </div>
      <details className="evidence-disclosure evidence-source-detail">
        <summary>Điều kiện và cách sử dụng <ArrowRightIcon /></summary>
        <div className="evidence-disclosure-body">
          <dl className="evidence-source-facts">
            <div><dt>Mã nguồn</dt><dd>{source.key}</dd></div>
            <div><dt>Ngày đối chiếu trong hồ sơ</dt><dd><time dateTime={source.checkedAt}>{source.checkedAt}</time></dd></div>
            {source.locations.length > 0 && <div><dt>Phần được trích dẫn</dt><dd>{source.locations.join('; ')}</dd></div>}
            {source.conditions.length > 0 && <div><dt>Điều kiện áp dụng</dt><dd>{source.conditions.join('; ')}</dd></div>}
          </dl>
          {source.limitations.length > 0 && <div className="evidence-source-limit"><h5>Giới hạn khi sử dụng nguồn</h5><ul>{source.limitations.map(limit => <li key={limit}>{limit}</li>)}</ul></div>}
          <h5>Liên kết với mô hình</h5>
          {relatedClaims.length === 0 ? <p>Nguồn được liệt kê để tham khảo; hồ sơ hiện tại chưa liên kết nguồn này với một tuyên bố cụ thể của mô hình.</p> : (
            <ul className="evidence-source-claims">{relatedClaims.map(claim => <li key={claim.claimKey}><code>{claim.claimKey}</code><span>{USAGE_LABELS[claim.usage]} · {STATUS_LABELS[claim.status]}</span>{claim.transformation !== undefined && <p>{claim.transformation}</p>}</li>)}</ul>
          )}
        </div>
      </details>
    </article>
  )
}

/** Keep technical traceability available without making it the default reading view. */
function AcidModelDetails() {
  const derived = Object.values(ACID_DERIVED_VALUES)
  const supportingClaims = ACID_NEUTRALIZATION_RELEASE.claimKeys.filter(key => ACID_CLAIMS[key]?.usage === 'supporting')
  return (
    <section className="evidence-model-details" aria-labelledby="evidence-model-title">
      <h2 id="evidence-model-title"><CalculatorIcon />Cách sử dụng nguồn trong mô hình</h2>
      <p>Dữ liệu có nguồn, giá trị tính toán và quy ước học tập được trình bày riêng để bạn tiện đối chiếu.</p>
      <details className="evidence-disclosure">
        <summary>Tuyên bố và nguồn hỗ trợ <ArrowRightIcon /></summary>
        <div className="evidence-disclosure-body"><p>Trạng thái được giữ theo sổ bằng chứng của phiên bản. “Dẫn xuất từ mô hình” là giá trị được tính qua phép biến đổi; “chỉ dùng tham khảo” không phải dữ liệu đầu vào.</p><div className="evidence-table-scroll" role="region" aria-label="Bảng tuyên bố và nguồn hỗ trợ" tabIndex={0}><ClaimList claimKeys={ACID_NEUTRALIZATION_RELEASE.claimKeys.filter(key => ACID_CLAIMS[key]?.usage !== 'supporting')} /></div></div>
      </details>
      <details className="evidence-disclosure">
        <summary>Giá trị dẫn xuất và trường hợp chuẩn <ArrowRightIcon /></summary>
        <div className="evidence-disclosure-body">
          <div className="evidence-table-scroll" role="region" aria-label="Bảng giá trị dẫn xuất" tabIndex={0}>
            <table><caption>Giá trị được tính từ hằng số có nguồn</caption><thead><tr><th scope="col">Giá trị</th><th scope="col">Tuyên bố nguồn</th><th scope="col">Phép biến đổi</th><th scope="col">Giá trị trong mô hình</th></tr></thead><tbody>{derived.map(value => <tr key={value.key}><td><code>{value.key}</code></td><td>{value.claimKey}</td><td>{value.transformation}</td><td className="num">{formatScientific(value.implementationValue)}</td></tr>)}</tbody></table>
          </div>
          <h3>Nguồn gốc các trường hợp chuẩn</h3>
          <dl className="evidence-provenance">
            <div><dt>Mã trường hợp</dt><dd>{ACID_GOLDEN_PROVENANCE.caseId}</dd></div>
            <div><dt>Phiên bản kịch bản</dt><dd>{ACID_GOLDEN_PROVENANCE.scenarioVersion}</dd></div>
            <div><dt>Bộ hằng số</dt><dd>{ACID_GOLDEN_PROVENANCE.constantBundle}</dd></div>
            <div><dt>Nguồn</dt><dd>{ACID_GOLDEN_PROVENANCE.sourceKeys.join(', ')}</dd></div>
            <div><dt>Cách dẫn xuất</dt><dd>{ACID_GOLDEN_PROVENANCE.derivation}</dd></div>
            <div><dt>Kiểm tra độc lập theo hồ sơ</dt><dd>{ACID_GOLDEN_PROVENANCE.independentCheck ? 'Có' : 'Không'}</dd></div>
            <div><dt>Dung sai pH*</dt><dd>± {formatPhTechnical(ACID_GOLDEN_PROVENANCE.tolerances.pH ?? null)}</dd></div>
          </dl>
        </div>
      </details>
      <details className="evidence-disclosure">
        <summary>Giả định và quy ước của bài <ArrowRightIcon /></summary>
        <div className="evidence-disclosure-body">
          <p>Đây là các lựa chọn sư phạm của bài, không phải hằng số khoa học hoặc kết quả thực nghiệm.</p>
          <ul className="evidence-conventions"><li>{ACID_STRINGS['scenarios.acid-neutralization.target-band']}</li><li>{ACID_STRINGS['resources.cost-index-explanation']}</li><li>{ACID_STRINGS['resources.safety-index-explanation']}</li></ul>
          {supportingClaims.length > 0 && <div className="evidence-table-scroll" role="region" aria-label="Tuyên bố chỉ dùng tham khảo" tabIndex={0}><ClaimList claimKeys={supportingClaims} /></div>}
        </div>
      </details>
      <details className="evidence-disclosure">
        <summary>Thông tin phiên bản <ArrowRightIcon /></summary>
        <div className="evidence-disclosure-body"><dl className="evidence-provenance"><div><dt>Bản phát hành</dt><dd>{ACID_NEUTRALIZATION_RELEASE.releaseId}</dd></div><div><dt>Nội dung</dt><dd>{ACID_NEUTRALIZATION_RELEASE.contentVersion}</dd></div><div><dt>Sổ bằng chứng của bài</dt><dd>{ACID_NEUTRALIZATION_RELEASE.evidenceRegisterVersion}</dd></div><div><dt>Sổ bằng chứng hiện tại</dt><dd>{EVIDENCE_REGISTER_VERSION}</dd></div></dl></div>
      </details>
    </section>
  )
}

function EvidenceBackground() {
  return <svg className="evidence-library-background" aria-hidden="true" focusable="false" width="1400" height="1200" viewBox="0 0 1400 1200" preserveAspectRatio="xMidYMin slice" fill="none"><g stroke="currentColor" opacity="0.15"><path d="m1100 35 35-20 35 20v40l-35 20-35-20Zm70 0 35-20 35 20v40l-35 20-35-20Zm-35 60 35-20 35 20v40l-35 20-35-20ZM1270 90v100l-45 45h-160M95 500v85l-35 35v115m0 70 30-17 30 17v34l-30 17-30-17Z" /><circle cx="1065" cy="235" r="4" /><circle cx="60" cy="735" r="4" /></g><g fill="currentColor" opacity="0.13"><circle cx="1300" cy="300" r="2" /><circle cx="1010" cy="90" r="2" /><circle cx="95" cy="450" r="2" /></g></svg>
}
