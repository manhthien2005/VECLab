import Link from 'next/link'
import { APP_STRINGS } from '@/content/index.js'
import { ArrowRightIcon } from './icons.js'
import { ShowcaseCarouselTrack } from './showcase-carousel-track.js'

/** These diagrams are schematic only, not model-derived observations. */
function ScenarioSketch({ scenarioKey }: { scenarioKey: string }) {
  const jar = scenarioKey === 'jar-test'
  const adsorption = scenarioKey === 'methylene-blue-adsorption'
  return (
    <svg className="landing-scenario-visual" viewBox="0 0 320 170" role="img"
      aria-label={jar ? 'Minh họa hai cốc và hai cánh khuấy Jar Test' :
        adsorption ? 'Minh họa bình tiếp xúc than hoạt tính theo mẻ' :
        'Minh họa cốc và dụng cụ thêm NaOH'}>
      <g fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M58 41v86q0 15 15 15h72q15 0 15-15V41" />
        {jar ? <path d="M187 41v86q0 15 15 15h72q15 0 15-15V41" /> : null}
        {jar ? <path d="M108 15v94m-15 0h30m115-94v94m-15 0h30" /> : null}
        {!jar && !adsorption ? <path d="M110 7v77m-7 0h14M101 7h18" /> : null}
        {adsorption ? <path d="M105 12v32m-7-12h14" /> : null}
      </g>
      <path d="M61 88h96v39q0 12-12 12H73q-12 0-12-12Z" fill="#3ba7ad" opacity=".3" />
      {jar ? <path d="M190 94h96v33q0 12-12 12h-72q-12 0-12-12Z" fill="#3ba7ad" opacity=".19" /> : null}
      {adsorption ? <g fill="currentColor" opacity=".65"><circle cx="95" cy="113" r="4"/><circle cx="120" cy="124" r="5"/><circle cx="139" cy="103" r="3"/><circle cx="80" cy="132" r="3"/></g> : null}
      {!jar && !adsorption ? <g fill="#0284c7"><circle cx="110" cy="85" r="3"/><circle cx="110" cy="95" r="2"/></g> : null}
      {jar ? <g fill="currentColor" opacity=".45"><circle cx="97" cy="116" r="3"/><circle cx="123" cy="125" r="4"/><circle cx="228" cy="118" r="3"/><circle cx="250" cy="128" r="5"/></g> : null}
    </svg>
  )
}

export function ExperimentShowcase() {
  const strings = APP_STRINGS.home
  const cards = strings.showcaseCards
  return (
    <div className="experiment-showcase-section reveal" data-reveal-variant="focus">
      <div className="section-head-center">
        <h2 id="showcase-heading" className="showcase-main-heading">{strings.showcaseHeading}</h2>
        <p className="lede showcase-lede">{strings.showcaseLede}</p>
      </div>
      <ShowcaseCarouselTrack totalSlides={cards.length} headingId="showcase-heading">
        {cards.map((card, idx) => (
          <article key={card.scenarioKey} id={'showcase-slide-' + idx}
            role="group" aria-roledescription="slide"
            aria-label={(idx + 1) + ' / ' + cards.length + ': ' + card.title}
            className={'showcase-card ' + (card.available ? 'showcase-card-live' : 'showcase-card-preview')}
            data-active={idx === 0 ? 'true' : undefined}>
            <span className={'showcase-status-badge ' + (card.available ? 'showcase-status-live' : 'showcase-status-upcoming')}>{card.status}</span>
            <div className="showcase-card-head">
              <div className="showcase-card-title-group">
                <h3 className="showcase-card-title">{card.title}</h3>
                <p className="showcase-card-summary">{card.summary}</p>
              </div>
            </div>
            <div className="showcase-media-stage"><ScenarioSketch scenarioKey={card.scenarioKey} /></div>
            <div className="showcase-card-footer">
              {card.available ? (
                <Link className="showcase-cta-link cta-live" href={card.href}>
                  <span>{card.actionLabel}</span><ArrowRightIcon className="showcase-cta-arrow" aria-hidden="true" />
                </Link>
              ) : <span className="showcase-unavailable">Nội dung bài đang được xây dựng</span>}
            </div>
          </article>
        ))}
      </ShowcaseCarouselTrack>
    </div>
  )
}
