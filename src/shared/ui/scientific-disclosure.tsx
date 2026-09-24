import {
  ACID_NEUTRALIZATION_RELEASE,
  ACID_STRINGS,
  ACID_SOURCES,
  ACID_CLAIMS,
  EVIDENCE_REGISTER_VERSION,
} from '@/content/index.js'
import type {
  ClaimEvidenceLink,
  EvidenceSource,
  EvidenceStatus,
} from '@/content/index.js'

/**
 * Sources and model limitations, rendered together and always present.
 *
 * docs/web-application-scope.md §4.6 makes "nguồn và giới hạn mô hình" one of the
 * twelve mandatory workbench groups, and §17 states the scientific source and the
 * model's limits are PART of the experience, not a separate appendix. So this is a
 * component every scenario surface renders rather than an optional page a learner may
 * never open.
 *
 * Deep detail sits behind `<details>` (progressive disclosure, §4.6) so the full
 * register does not overwhelm a first-time learner, while the limitations themselves
 * stay visible without any interaction.
 *
 * Server Component: it reads only release metadata and the locked evidence register,
 * so nothing here needs the client runtime.
 */

type ScientificDisclosureProps = {
  /** Collapse to just the one-line disclaimer, for compact surfaces. */
  compact?: boolean
}

export function ScientificDisclosure({ compact = false }: ScientificDisclosureProps) {
  const release = ACID_NEUTRALIZATION_RELEASE

  return (
    <section className="stack-tight" aria-labelledby="disclosure-heading">
      <h2 id="disclosure-heading" className="eyebrow">
        Nguồn và giới hạn mô hình
      </h2>

      {/* Limitations are NOT behind disclosure: §4.6 item 10 requires them visible
          wherever the scenario is used, and a collapsed panel is not visible. */}
      <ul className="stack-tight small">
        {release.limitationKeys.map((key) => {
          const text = ACID_STRINGS[key as keyof typeof ACID_STRINGS]
          if (typeof text !== 'string') return null
          return <li key={key}>{text}</li>
        })}
      </ul>

      {!compact && (
        <details className="disclosure">
          <summary>
            Nguồn khoa học ({release.sourceKeys.length}) — sổ đăng ký bằng chứng{' '}
            {EVIDENCE_REGISTER_VERSION}
          </summary>
          <div className="disclosure-body stack">
            <SourceList sourceKeys={release.sourceKeys} />
            <ClaimList claimKeys={release.claimKeys} />
          </div>
        </details>
      )}
    </section>
  )
}

/** Every source the release cites, as a definition list. */
export function SourceList({ sourceKeys }: { sourceKeys: readonly string[] }) {
  const sources = sourceKeys
    .map((key) => ACID_SOURCES[key])
    .filter((source): source is EvidenceSource => source !== undefined)

  if (sources.length === 0) return null

  return (
    <div>
      <h3 className="eyebrow">Nguồn</h3>
      <dl className="stack-tight">
        {sources.map((source) => (
          <div key={source.key}>
            <dt>
              <strong>{source.key}</strong> — {source.title}
              {source.year !== null ? ` (${source.year})` : ''}
            </dt>
            <dd className="muted small">
              {source.authorsOrOrganization} · {source.sourceType}
              {source.conditions.length > 0 && (
                <>
                  {' '}
                  · Điều kiện: {source.conditions.join('; ')}
                </>
              )}
              {' · '}
              Kiểm tra ngày {source.checkedAt}
              {source.url !== '' && (
                <>
                  {' · '}
                  <a href={source.url} rel="noopener noreferrer" target="_blank">
                    liên kết
                  </a>
                </>
              )}
              {source.limitations.length > 0 && (
                <span className="faint"> · Giới hạn nguồn: {source.limitations.join('; ')}</span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

/** Every claim the release may surface, with the sources backing it. */
export function ClaimList({ claimKeys }: { claimKeys: readonly string[] }) {
  const claims = claimKeys
    .map((key) => ACID_CLAIMS[key])
    .filter((claim): claim is ClaimEvidenceLink => claim !== undefined)

  if (claims.length === 0) return null

  return (
    <div>
      <h3 className="eyebrow">Tuyên bố và bằng chứng</h3>
      <table>
        <caption className="visually-hidden">
          Mỗi tuyên bố mô hình, nguồn hỗ trợ và trạng thái bằng chứng
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
          {claims.map((claim) => (
            <tr key={claim.claimKey}>
              <td>
                <code>{claim.claimKey}</code>
                {claim.transformation !== undefined && (
                  <span className="faint small"> — {claim.transformation}</span>
                )}
              </td>
              <td>{claim.usage}</td>
              <td className="small">{claim.sourceKeys.join(', ')}</td>
              <td>
                <span className={`badge ${evidenceBadgeTone(claim.status)}`}>
                  {claim.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * Badge tone per evidence status.
 *
 * The register's five statuses are a strength scale, not a pass/fail, so the tone says
 * how much weight the claim carries rather than whether it is "good":
 *
 *   * `cross-checked` / `source-checked` — read directly against a source, strongest.
 *   * `model-derived` — computed from a sourced value by a stated transformation;
 *     legitimate but one step removed, so neutral.
 *   * `supporting-only` — context, not load-bearing for a model constant.
 *   * `excluded-from-model` — deliberately NOT used. Must read as distinct from the
 *     others: a learner who mistakes it for a supporting claim would think the model
 *     rests on something it explicitly rejects.
 */
function evidenceBadgeTone(status: EvidenceStatus): string {
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
