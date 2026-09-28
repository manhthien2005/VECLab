import Link from 'next/link'
import { APP_STRINGS } from '@/content/index.js'
import {
  ArrowRightIcon,
  FlaskIcon,
  LayersIcon,
  MoleculeIcon,
  type IconComponent,
} from './icons.js'
import { AcidShowcaseVisual } from './acid-showcase-visual.js'
import { CopperShowcaseVisual } from './copper-showcase-visual.js'
import { PlasticShowcaseVisual } from './plastic-showcase-visual.js'

type BadgeTone = 'icon-badge-blue' | 'icon-badge-green' | 'icon-badge-teal'

interface ShowcaseCardConfig {
  scenarioKey: string
  title: string
  summary: string
  isLive: boolean
  Icon: IconComponent
  tone: BadgeTone
  VisualComponent: () => React.JSX.Element
}

const SHOWCASE_CARDS: readonly ShowcaseCardConfig[] = [
  {
    scenarioKey: 'acid-neutralization',
    title: 'Trung hòa axit',
    summary: 'Khám phá quá trình trung hòa, theo dõi sự thay đổi pH theo thời gian.',
    isLive: true,
    Icon: FlaskIcon,
    tone: 'icon-badge-blue',
    VisualComponent: AcidShowcaseVisual,
  },
  {
    scenarioKey: 'copper-precipitation',
    title: 'Kết tủa Cu²⁺',
    summary: 'Quan sát quá trình tạo kết tủa, theo dõi nồng độ ion trong dung dịch.',
    isLive: false,
    Icon: MoleculeIcon,
    tone: 'icon-badge-green',
    VisualComponent: CopperShowcaseVisual,
  },
  {
    scenarioKey: 'plastic-density-separation',
    title: 'Phân loại nhựa',
    summary: 'Tìm hiểu tính chất, tách và nhận diện các loại nhựa phổ biến.',
    isLive: false,
    Icon: LayersIcon,
    tone: 'icon-badge-teal',
    VisualComponent: PlasticShowcaseVisual,
  },
]

export function ExperimentShowcase() {
  const strings = APP_STRINGS.home

  return (
    <div className="experiment-showcase-section reveal">
      {/* Centered Section Heading matching approved reference */}
      <div className="section-head-center">
        <p className="eyebrow">{strings.showcaseEyebrow}</p>
        <h2 className="showcase-main-heading">{strings.showcaseHeading}</h2>
        <p className="lede showcase-lede">{strings.showcaseLede}</p>
      </div>

      {/* 3-Card Scientific Grid */}
      <div className="showcase-grid">
        {SHOWCASE_CARDS.map((card, idx) => {
          const { scenarioKey, title, summary, isLive, Icon, tone, VisualComponent } = card
          const href = isLive ? `/simulate/${scenarioKey}` : '/experiments'

          return (
            <div
              key={scenarioKey}
              className={`showcase-card ${isLive ? 'showcase-card-live' : 'showcase-card-preview'}`}
              style={{ '--card-index': idx } as React.CSSProperties}
            >
              {/* Honest Capability / Status Badge */}
              {!isLive ? (
                <span className="showcase-status-badge showcase-status-upcoming">
                  {strings.comingSoonBadge}
                </span>
              ) : (
                <span className="showcase-status-badge showcase-status-live">
                  Khả dụng
                </span>
              )}

              {/* Card Header: Icon + Title + Summary */}
              <div className="showcase-card-head">
                <span className={`icon-badge ${tone} showcase-icon-box`} aria-hidden="true">
                  <Icon />
                </span>
                <div className="showcase-card-title-group">
                  <h3 className="showcase-card-title">{title}</h3>
                  <p className="showcase-card-summary">{summary}</p>
                </div>
              </div>

              {/* Dedicated Scientific Visual Stage */}
              <div className="showcase-media-stage">
                <VisualComponent />
              </div>

              {/* Card Bottom Action */}
              <div className="showcase-card-footer">
                <Link
                  className={`showcase-cta-link ${isLive ? 'cta-live' : 'cta-preview'}`}
                  href={href}
                  aria-label={`${isLive ? strings.showcaseCtaLabel : strings.comingSoonCta}: ${title}`}
                >
                  <span>{isLive ? strings.showcaseCtaLabel : strings.comingSoonCta}</span>
                  <ArrowRightIcon className="showcase-cta-arrow" />
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
