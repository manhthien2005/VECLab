import Image from 'next/image'
import Link from 'next/link'
import { APP_STRINGS } from '@/content/index.js'
import { FlaskIcon, LayersIcon, MoleculeIcon } from './icons.js'
import { ShowcaseCarouselTrack } from './showcase-carousel-track.js'

const CARD_ART = {
  'acid-neutralization': { Icon: FlaskIcon, image: '/assets/experiments/ph.webp', alt: 'Cốc nước, điện cực pH và buret thêm dung dịch' },
  'jar-test': { Icon: MoleculeIcon, image: '/assets/experiments/jar.webp', alt: 'Hai cốc Jar Test với cánh khuấy và bông cặn đang lắng' },
  'methylene-blue-adsorption': { Icon: LayersIcon, image: '/assets/experiments/adsorption.webp', alt: 'Dung dịch xanh methylene và than hoạt tính dùng trong hấp phụ theo mẻ' },
} as const

export function ExperimentShowcase() {
  const strings = APP_STRINGS.home
  return (
    <div className="experiment-showcase-section">
      <svg className="showcase-background-art" viewBox="0 0 1440 760" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
        <defs><pattern id="showcase-tech-dots" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="0.8" fill="currentColor" /></pattern></defs>
        <g fill="url(#showcase-tech-dots)" opacity="0.22"><rect x="28" y="100" width="220" height="180" /><rect x="1200" y="470" width="240" height="240" /></g>
        <g fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3">
          <path d="M0 370h120l65 110h150M1440 200h-120l-65 110h-155M0 660h320l45-78h220M1440 640h-260l-45-78h-190" />
          <path d="m110 320 22-38h44l22 38-22 38h-44ZM1260 390l28-48h56l28 48-28 48h-56Z" />
          <path d="M80 710h1280" strokeDasharray="2 10" />
        </g>
        <g fill="currentColor" opacity="0.45"><circle cx="335" cy="480" r="3" /><circle cx="1100" cy="310" r="3" /><circle cx="585" cy="582" r="3" /><circle cx="945" cy="562" r="3" /></g>
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
                <div className="showcase-card-title-group"><h3 className="showcase-card-title">{card.title}</h3><p className="showcase-card-summary">{card.summary}</p></div>
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
                    <p>{card.scenarioKey === 'jar-test' ? 'So sánh các mẫu nước qua bước thêm chất keo tụ, khuấy và lắng. Đánh giá độ đục để chọn điều kiện xử lý.' : 'Thay đổi lượng than hoạt tính và thời gian tiếp xúc. So sánh màu dung dịch trước và sau xử lý.'}</p>
                    <p className="muted">Bài thực hành đang được xây dựng, hiện chưa thể bắt đầu.</p>
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
