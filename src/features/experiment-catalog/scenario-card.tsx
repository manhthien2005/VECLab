import Image from 'next/image'
import Link from 'next/link'
import type { CatalogEntry } from './catalog.js'
import type { ExperimentOverview } from './overviews.js'
import { ArrowRightIcon } from '@/features/landing/icons.js'

export function ScenarioCard({ overview, entry }: { overview: ExperimentOverview; entry: CatalogEntry | undefined }) {
  const available = entry !== undefined
  return (
    <article className="experiment-library-card" aria-labelledby={`experiment-${overview.scenarioKey}`}>
      <div className="experiment-library-image">
        <Image src={overview.image} alt={overview.imageAlt} fill sizes="(max-width: 45rem) 92vw, (max-width: 70rem) 45vw, 420px" />
      </div>
      <div className="experiment-library-body">
        <div className="experiment-library-tags">
          <span className="experiment-topic">{overview.category}</span>
          <span className={`experiment-availability${available ? ' is-available' : ''}`}><span aria-hidden="true" />{available ? 'Có thể thực hành' : 'Đang xây dựng'}</span>
        </div>
        <h2 id={`experiment-${overview.scenarioKey}`}>{overview.title}</h2>
        <p className="experiment-library-description">{overview.description}</p>
        <dl className="experiment-library-facts">
          <div><dt>Đầu vào</dt><dd>{overview.input}</dd></div>
          <div><dt>Điều chỉnh</dt><dd>{overview.parameters}</dd></div>
          <div><dt>Đánh giá</dt><dd>{overview.outcome}</dd></div>
        </dl>
        <div className="experiment-library-actions">
          {available ? <>
            <Link className="btn experiment-library-start" href={`/simulate/${entry.scenarioKey}`}>Bắt đầu thực hành<ArrowRightIcon /></Link>
            <Link className="experiment-library-detail" href={`/experiments/${entry.scenarioKey}`}>Xem chi tiết<span className="sr-only"> — {overview.title}</span></Link>
          </> : (
            <details className="experiment-library-plan">
              <summary>Nội dung dự kiến<ArrowRightIcon /></summary>
              <ol>{overview.procedure.map(step => <li key={step}>{step}</li>)}</ol>
              <p>Bài này chưa mở thực hành.</p>
            </details>
          )}
        </div>
      </div>
    </article>
  )
}
