import Link from 'next/link'
import { APP_STRINGS } from '@/content/index.js'
import { ArrowRightIcon } from './icons.js'

export function EvidenceSection() {
  const strings = APP_STRINGS.home
  return (
    <div className="evidence-section-wrap reveal" data-reveal-variant="settle" aria-labelledby="evidence-heading">
      <div className="evidence-head">
        <h2 id="evidence-heading" className="evidence-main-heading">{strings.evidenceSectionHeading}</h2>
        <p className="lede evidence-main-lede">{strings.evidenceSectionLede}</p>
      </div>
      <div className="evidence-layout">
        <div className="evidence-cards-grid">
          {strings.evidenceCards.map((item) => (
            <article className="evidence-card" key={item.title}>
              <h3 className="evidence-card-title">{item.title}</h3>
              <p className="evidence-card-body">{item.body}</p>
            </article>
          ))}
        </div>
        <Link className="evidence-card-action" href="/evidence">
          {strings.evidenceAction}<ArrowRightIcon aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}
