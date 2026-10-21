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
        <Image src={overview.image} alt={overview.imageAlt} fill sizes="(max-width: 58rem) 92vw, 420px" loading={available ? 'eager' : 'lazy'} />
      </div>
      <div className="experiment-library-body">
        <div className="experiment-library-tags">
          <span className="experiment-topic">{overview.category}</span>
          <span className={`experiment-availability${available ? ' is-available' : ''}`}><span aria-hidden="true" />{available ? 'Có thể thực hành · Lưu trên trình duyệt' : 'Chưa triển khai'}</span>
        </div>
        <h2 id={`experiment-${overview.scenarioKey}`}>{overview.title}</h2>
        <p className="experiment-library-question">{overview.question}</p>
        <p className="experiment-library-learning"><span>Bạn sẽ học</span>{overview.learning}</p>
        <dl className="experiment-library-facts">
          <div><dt>Mẫu và hóa chất</dt><dd>{overview.input}</dd></div>
          <div><dt>Thông số khảo sát</dt><dd>{overview.parameters}</dd></div>
          <div><dt>Kết quả theo dõi</dt><dd>{overview.outcome}</dd></div>
        </dl>
        <details className="experiment-library-plan">
          <summary>{available ? 'Dụng cụ và kiến thức cần có' : 'Chuẩn bị và quy trình dự kiến'}<ArrowRightIcon /></summary>
          <dl className="experiment-library-preparation">
            <div><dt>{available ? 'Dụng cụ' : 'Dụng cụ dự kiến'}</dt><dd>{overview.tools}</dd></div>
            <div><dt>Kiến thức cơ bản</dt><dd>{overview.prerequisites}</dd></div>
          </dl>
          {!available && <>
            <p className="experiment-library-procedure-label">Quy trình dự kiến</p>
            <ol>{overview.procedure.map(step => <li key={step}>{step}</li>)}</ol>
          </>}
        </details>
        <div className="experiment-library-actions">
          {available ? <>
            <Link className="btn experiment-library-start" href={`/simulate/${entry.scenarioKey}`}>Bắt đầu thực hành<ArrowRightIcon /></Link>
            <Link className="experiment-library-detail" href={`/experiments/${entry.scenarioKey}`}>Xem chi tiết<span className="sr-only"> — {overview.title}</span></Link>
            {overview.scenarioKey === 'water-treatment' && (
              <Link className="experiment-library-mylab" href="/experiments/water-treatment/my-lab">Lab của tôi</Link>
            )}
          </> : (
            <p className="experiment-library-unavailable">Chưa triển khai bài thực hành.</p>
          )}
        </div>
      </div>
    </article>
  )
}
