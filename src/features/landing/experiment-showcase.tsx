import Image from 'next/image'
import Link from 'next/link'
import { APP_STRINGS } from '@/content/index.js'
import { FlaskIcon, LayersIcon, MoleculeIcon } from './icons.js'
import { ShowcaseCarouselTrack } from './showcase-carousel-track.js'

const CARD_ART = {
  'acid-base-extraction': { Icon: FlaskIcon, image: '/assets/experiments/extraction.webp', alt: 'Phễu chiết hai pha và các bình thu mẫu' },
  'jar-test': { Icon: MoleculeIcon, image: '/assets/experiments/jar.webp', alt: 'Hai cốc Jar Test với cánh khuấy và bông cặn đang lắng' },
  'water-treatment': { Icon: LayersIcon, image: '/assets/auth-laboratory-v2.webp', alt: 'Bình khuấy và máy đo trong phòng thí nghiệm xử lý nước nhiều kim loại nặng' },
  'methylene-blue-adsorption': { Icon: LayersIcon, image: '/assets/experiments/adsorption.webp', alt: 'Dung dịch xanh methylene và than hoạt tính dùng trong hấp phụ theo mẻ' },
} as const

export function ExperimentShowcase() {
  const strings = APP_STRINGS.home
  return (
    <div className="experiment-showcase-section">
      <svg className="showcase-background-art" viewBox="0 0 1440 820" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <defs><pattern id="showcase-tech-dots" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="0.9" fill="currentColor" /></pattern></defs>
        <g fill="url(#showcase-tech-dots)" opacity="0.28">
          <rect x="32" y="28" width="250" height="140" /><rect x="1170" y="28" width="238" height="140" />
          <rect x="110" y="690" width="200" height="100" /><rect x="1130" y="690" width="200" height="100" />
        </g>
        <g fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.32">
          <path d="M0 105h140l36 62h184M1440 105h-140l-36 62h-184" />
          <path d="M0 220h70l42 73v140M1440 220h-70l-42 73v140" />
          <path d="M0 740h300l40-70h210M1440 740h-300l-40-70H890" />
          <path d="m300 72 18-31h36l18 31-18 31h-36Zm768 0 18-31h36l18 31-18 31h-36Z" />
          <ellipse cx="720" cy="590" rx="590" ry="108" opacity="0.7" />
          <ellipse cx="720" cy="590" rx="640" ry="135" strokeDasharray="2 12" opacity="0.6" />
        </g>
        <g fill="currentColor" opacity="0.55">
          <circle cx="360" cy="167" r="3" /><circle cx="1080" cy="167" r="3" />
          <circle cx="112" cy="433" r="3" /><circle cx="1328" cy="433" r="3" />
          <circle cx="550" cy="670" r="3" /><circle cx="890" cy="670" r="3" />
        </g>
      </svg>
      <div className="section-head-center">
        <p className="eyebrow">{strings.showcaseEyebrow}</p>
        <h2 id="showcase-heading" className="showcase-main-heading">{strings.showcaseHeading}</h2>
        <p className="lede showcase-lede">{strings.showcaseLede}</p>
      </div>
      <ShowcaseCarouselTrack totalSlides={strings.showcaseCards.length} headingId="showcase-heading">
        {strings.showcaseCards.map((card, idx) => {
          const { Icon, image, alt } = CARD_ART[card.scenarioKey]
          const content = (
            <>
              <div className="showcase-card-head">
                <span className="showcase-icon-box" aria-hidden="true"><Icon /></span>
                <div className="showcase-card-title-group"><h3 className="showcase-card-title">{card.title}</h3><p className="showcase-card-summary">{card.summary}</p>{!card.available && <span className="showcase-card-state">Chưa triển khai</span>}</div>
              </div>
              <div className="showcase-media-stage"><Image src={image} alt={alt} fill sizes="(max-width: 42rem) 82vw, (max-width: 66rem) 65vw, 544px" /></div>
            </>
          )
          return (
            <div key={card.scenarioKey} id={`showcase-slide-${idx}`} role="group" aria-roledescription="slide"
              aria-label={`${idx + 1} / ${strings.showcaseCards.length}: ${card.title}`} className="showcase-card" data-active={idx === 0 ? 'true' : undefined}>
              {card.available ? (
                <Link className="showcase-card-link" href={`/simulate/${card.scenarioKey}`} aria-label={`Mở thí nghiệm ${card.title}`}>{content}</Link>
              ) : (
                <details className="showcase-card-details">
                  <summary className="showcase-card-link" aria-label={`Thông tin thí nghiệm ${card.title}`}>{content}</summary>
                  <div className="showcase-experiment-note">
                    <p>{card.summary}</p>
                    <p className="muted">Chưa triển khai bài thực hành.</p>
                  </div>
                </details>
              )}
            </div>
          )
        })}
      </ShowcaseCarouselTrack>
    </div>
  )
}
