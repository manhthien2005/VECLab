import Link from 'next/link'
import type { Metadata } from 'next'
import {
  APP_STRINGS,
  ACID_STRINGS,
  ACID_SOURCES,
  ACID_CLAIMS,
  ACID_DERIVED_VALUES,
  ACID_GOLDEN_PROVENANCE,
  ACID_NEUTRALIZATION_RELEASE,
  EVIDENCE_REGISTER_VERSION,
} from '@/content/index.js'
import type { EvidenceStatus } from '@/content/index.js'
import { listCatalog } from '@/features/experiment-catalog/catalog.js'
import { SourceList } from '@/shared/ui/scientific-disclosure.js'
import { formatPhTechnical, formatScientific } from '@/shared/ui/format.js'

/**
 * Scientific sources (docs/web-application-scope.md §4.3).
 *
 * Public: a learner does not sign in to check where a number came from, and neither
 * should anyone else auditing the model. That is the point of the page — traceability —
 * so gating it would defeat it.
 *
 * Two things §4.3 requires that are easy to conflate, and are therefore separated here
 * into distinct sections:
 *
 *   * SOURCED data — constants and procedures with a citation, a check date and stated
 *     conditions (pKw, carbonate constants, the pH definition).
 *   * SCENARIO ASSUMPTIONS — choices the scenario makes that no source mandates: the
 *     pedagogical target band, the cost and safety conventions, the permitted aliquot
 *     set. These are legitimate but they are conventions, and a learner must be able to
 *     tell them apart from a measured constant.
 *
 * Every claim below carries its evidence status, because "verified" and "model-derived"
 * are different amounts of confidence and collapsing them would misrepresent the
 * register.
 *
 * Server Component over the locked evidence register: statically renderable, and a
 * re-release updates this page with no edit here.
 */

export const metadata: Metadata = {
  title: APP_STRINGS.evidence.title,
  description:
    'Sổ đăng ký bằng chứng: nguồn, loại bằng chứng, điều kiện áp dụng và giới hạn cho từng hằng số và quy trình trong mô phỏng.',
}

export default function EvidencePage() {
  const strings = APP_STRINGS.evidence
  const catalog = listCatalog()
  const sources = Object.values(ACID_SOURCES)
  const claims = Object.values(ACID_CLAIMS)
  const derived = Object.values(ACID_DERIVED_VALUES)

  // Claims a source did NOT mandate. Splitting them out is what makes the
  // sourced-vs-assumed distinction visible rather than something a reader has to infer.
  const assumptions = claims.filter((claim) => claim.usage === 'supporting')
  const sourced = claims.filter((claim) => claim.usage !== 'supporting')

  return (
    <div className="page page-narrow stack-loose">
      <nav aria-label="Breadcrumb">
        <Link className="small" href="/">
          ← {strings.backToCatalog}
        </Link>
      </nav>

      <header className="stack-tight">
        <p className="eyebrow">
          {strings.registerVersion} {EVIDENCE_REGISTER_VERSION}
        </p>
        <h1>{strings.title}</h1>
        <p className="muted">{strings.lede}</p>
      </header>

      {/* Sources grouped by experiment, as §4.3 requires. One scenario is locked in
          this release, so there is one group; the loop keeps that fact data-driven
          rather than hardcoded, and a second locked scenario appears here with no edit. */}
      {catalog.map((entry) => (
        <section key={entry.releaseId} className="card stack-tight">
          <h2>{entry.title}</h2>
          <dl className="meta-list">
            <dt>{APP_STRINGS.release.releaseId}</dt>
            <dd>{entry.releaseId}</dd>
            <dt>{APP_STRINGS.release.contentVersion}</dt>
            <dd>{entry.contentVersion}</dd>
            <dt>{APP_STRINGS.release.evidenceRegisterVersion}</dt>
            <dd>{entry.evidenceRegisterVersion}</dd>
          </dl>
          <SourceList sourceKeys={ACID_NEUTRALIZATION_RELEASE.sourceKeys} />
        </section>
      ))}

      {/* Sourced data: constants and procedures with a citation. */}
      <section className="card stack-tight">
        <h2>Dữ liệu có nguồn</h2>
        <p className="small muted">
          Mỗi dòng dưới đây trỏ về một tài liệu đã kiểm tra. Trạng thái cho biết mức độ
          bằng chứng: kiểm tra chéo là mạnh nhất, còn dẫn xuất mô hình nghĩa là giá trị
          được tính từ một nguồn qua một phép biến đổi đã nêu rõ.
        </p>
        <table>
          <caption className="visually-hidden">
            Tuyên bố có nguồn, nguồn hỗ trợ, vai trò và trạng thái bằng chứng
          </caption>
          <thead>
            <tr>
              <th scope="col">Tuyên bố</th>
              <th scope="col">Vai trò</th>
              <th scope="col">Nguồn</th>
              <th scope="col">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {sourced.map((claim) => (
              <tr key={claim.claimKey}>
                <td>
                  <code>{claim.claimKey}</code>
                  {claim.transformation !== undefined && (
                    <>
                      <br />
                      <span className="tiny faint">{claim.transformation}</span>
                    </>
                  )}
                </td>
                <td className="small">{claim.usage}</td>
                <td className="small">{claim.sourceKeys.join(', ')}</td>
                <td>
                  <span className={`badge ${statusTone(claim.status)}`}>
                    {claim.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Derived values: a sourced number run through a stated transformation. Kept in
          its own section because the transformation is the part a reader must be able to
          audit — the value alone does not show it is not itself sourced. */}
      <section className="card stack-tight">
        <h2>{strings.derivedHeading}</h2>
        <table>
          <caption className="visually-hidden">
            Giá trị dẫn xuất, tuyên bố nguồn, phép biến đổi và giá trị trong mô hình
          </caption>
          <thead>
            <tr>
              <th scope="col">Giá trị</th>
              <th scope="col">Tuyên bố nguồn</th>
              <th scope="col">{strings.transformation}</th>
              <th scope="col" className="num">
                {strings.implementationValue}
              </th>
            </tr>
          </thead>
          <tbody>
            {derived.map((value) => (
              <tr key={value.key}>
                <td>
                  <code>{value.key}</code>
                </td>
                <td className="small">{value.claimKey}</td>
                <td className="small">{value.transformation}</td>
                {/* An equilibrium constant, not a pH: fixed decimals rendered every one
                    of these as 0,00000. */}
                <td className="num">{formatScientific(value.implementationValue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Scenario assumptions: conventions no source mandates. */}
      <section className="card stack-tight">
        <h2>Giả định và quy ước của kịch bản</h2>
        <p className="alert alert-warn small">
          Những mục dưới đây KHÔNG có nguồn thực nghiệm bắt buộc. Chúng là quy ước sư
          phạm do kịch bản đặt ra để việc chấm điểm ổn định và so sánh được, và chúng có
          phiên bản riêng. Nhầm chúng với hằng số có nguồn là nhầm loại bằng chứng.
        </p>
        <ul className="stack-tight small">
          <li>
            <strong>{ACID_STRINGS['scenarios.acid-neutralization.target-band']}</strong>
          </li>
          <li>
            <strong>{ACID_STRINGS['resources.cost-index-label']}:</strong>{' '}
            {ACID_STRINGS['resources.cost-index-explanation']}
          </li>
          <li>
            <strong>{ACID_STRINGS['resources.safety-index-label']}:</strong>{' '}
            {ACID_STRINGS['resources.safety-index-explanation']}
          </li>
        </ul>
        {assumptions.length > 0 && (
          <table>
            <caption className="visually-hidden">
              Tuyên bố hỗ trợ, không phải dữ liệu đầu vào của mô hình
            </caption>
            <thead>
              <tr>
                <th scope="col">Tuyên bố</th>
                <th scope="col">Nguồn</th>
                <th scope="col">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {assumptions.map((claim) => (
                <tr key={claim.claimKey}>
                  <td>
                    <code>{claim.claimKey}</code>
                  </td>
                  <td className="small">{claim.sourceKeys.join(', ')}</td>
                  <td>
                    <span className={`badge ${statusTone(claim.status)}`}>
                      {claim.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Provenance of the acceptance fixtures: the eight golden pH values the test
          suite pins. Publishing the derivation lets a reviewer reproduce them rather
          than take the numbers on trust. */}
      <section className="card stack-tight">
        <h2>{strings.provenanceHeading}</h2>
        <dl className="meta-list">
          <dt>Mã trường hợp</dt>
          <dd>{ACID_GOLDEN_PROVENANCE.caseId}</dd>
          <dt>Phiên bản kịch bản</dt>
          <dd>{ACID_GOLDEN_PROVENANCE.scenarioVersion}</dd>
          <dt>Bộ hằng số</dt>
          <dd>{ACID_GOLDEN_PROVENANCE.constantBundle}</dd>
          <dt>Nguồn</dt>
          <dd>{ACID_GOLDEN_PROVENANCE.sourceKeys.join(', ')}</dd>
          <dt>Cách dẫn xuất</dt>
          <dd>{ACID_GOLDEN_PROVENANCE.derivation}</dd>
          <dt>Kiểm tra độc lập</dt>
          <dd>{ACID_GOLDEN_PROVENANCE.independentCheck ? 'có' : 'không'}</dd>
          <dt>Dung sai pH*</dt>
          <dd>± {formatPhTechnical(ACID_GOLDEN_PROVENANCE.tolerances.pH ?? 0)}</dd>
        </dl>
      </section>

      {/* Limitations of applying each source to the model — §4.3 requires this
          per-source, and the disclosure renders it alongside every citation. */}
      <section className="card stack-tight">
        <h2>Giới hạn khi áp dụng nguồn vào mô hình</h2>
        <ul className="stack-tight small">
          {sources
            .filter((source) => source.limitations.length > 0)
            .map((source) => (
              <li key={source.key}>
                <strong>{source.key}</strong>: {source.limitations.join('; ')}
              </li>
            ))}
        </ul>
        <p className="small faint">
          Ngày kiểm tra và liên kết của từng nguồn được liệt kê ở phần Nguồn phía trên.
          Toàn bộ trang này là nội dung công khai của phiên bản đã khóa{' '}
          {ACID_NEUTRALIZATION_RELEASE.releaseId}.
        </p>
      </section>
    </div>
  )
}

/**
 * Badge tone per evidence status.
 *
 * A strength scale, not pass/fail: `excluded-from-model` must read as distinct because a
 * reader who mistakes it for a supporting claim would think the model rests on something
 * it explicitly rejects. Duplicated from the disclosure component rather than shared
 * because that one is scoped to the compact scenario surfaces; if a third call site
 * appears, both should move to one helper.
 */
function statusTone(status: EvidenceStatus): string {
  switch (status) {
    case 'cross-checked':
    case 'source-checked':
      return 'badge-ok'
    case 'excluded-from-model':
      return 'badge-danger'
    case 'supporting-only':
      return 'badge-warn'
    case 'model-derived':
    default:
      return ''
  }
}
