import Link from 'next/link'
import { APP_STRINGS } from '@/content/index.js'
import type { CatalogEntry } from '@/features/experiment-catalog/catalog.js'

/**
 * One experiment card, as §4.1 requires on both the home page and the catalog.
 *
 * The three counts are the card's real content. A learner choosing between scenarios
 * cannot judge chemistry from a summary paragraph, but "10 tuyên bố có bằng chứng, 15
 * nguồn, 5 giới hạn công bố" says how well evidenced the release is — which is the claim
 * this product makes about itself. They render as a stat strip rather than a definition
 * list so the numbers read at a glance.
 *
 * Server-renderable: props only, no hooks, no directive.
 */
export function ScenarioCard({ entry }: { entry: CatalogEntry }) {
  const detailHref = `/experiments/${entry.scenarioKey}`

  return (
    <article className="card card-interactive scenario-card">
      <div className="stack-tight">
        <div className="row">
          <span className="badge badge-mono">{entry.releaseId}</span>
          <span className="badge badge-mono">mô hình {entry.modelSpecVersion}</span>
        </div>
        {/*
          The heading wraps the link rather than sitting beside one, so the accessible name
          of the link is the experiment's own title. A card whose only link says "Xem chi
          tiết" gives a screen-reader user a list of identical link names with no way to
          tell the scenarios apart.
        */}
        <h3>
          <Link href={detailHref}>{entry.title}</Link>
        </h3>
      </div>

      <p className="summary">{entry.summary}</p>

      <dl className="scenario-stats">
        <div>
          <dt>{APP_STRINGS.release.claims}</dt>
          <dd>{entry.claimCount}</dd>
        </div>
        <div>
          <dt>{APP_STRINGS.release.sources}</dt>
          <dd>{entry.sourceCount}</dd>
        </div>
        <div>
          <dt>{APP_STRINGS.release.limitations}</dt>
          <dd>{entry.limitationCount}</dd>
        </div>
      </dl>

      <div className="row">
        <Link className="btn btn-primary" href={`/simulate/${entry.scenarioKey}`}>
          {APP_STRINGS.experimentDetail.startNewAttempt}
        </Link>
        <Link className="btn btn-ghost" href={detailHref}>
          Xem chi tiết
          <span className="visually-hidden"> — {entry.title}</span>
        </Link>
      </div>
    </article>
  )
}
