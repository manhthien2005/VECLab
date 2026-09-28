import Link from 'next/link'
import { APP_STRINGS } from '@/content/index.js'
import { listCatalog } from '@/features/experiment-catalog/catalog.js'
import { ScientificDisclosure } from '@/shared/ui/scientific-disclosure.js'
import {
  ArrowRightIcon,
  BookIcon,
  CalculatorIcon,
  CheckCircleIcon,
  FlaskIcon,
  GuestIcon,
  PlayIcon,
  RepeatIcon,
  SigmaIcon,
  WarningIcon,
  type IconComponent,
} from '@/features/landing/icons.js'
import { BookStack } from '@/features/landing/landing-visuals.js'
import { HeroPreview } from '@/features/landing/hero-preview.js'
import { ExperimentShowcase } from '@/features/landing/experiment-showcase.js'
import { WorkbenchPreview } from '@/features/landing/workbench-preview.js'
import { ScrollReveal } from '@/features/landing/scroll-reveal.js'

/**
 * Home page and experiment showcase (docs/web-application-scope.md §4.1), redesigned to
 * the approved landing package (design.md, reference/approved-landing.png).
 *
 * Core storytelling sections redesigned in R14.2:
 * - 3-experiment showcase (ExperimentShowcase)
 * - Workbench demonstration (WorkbenchPreview)
 *
 * Server Component reading only the release registries, so it is statically renderable.
 * `ScrollReveal` and `WorkbenchPreview` are client leaves where needed, so everything else
 * stays server-rendered.
 */

const TRUST_ICONS: readonly IconComponent[] = [GuestIcon, RepeatIcon, BookIcon]

type BadgeTone = 'icon-badge-blue' | 'icon-badge-green' | 'icon-badge-teal'

const EVIDENCE_ICONS: ReadonlyArray<{ Icon: IconComponent; tone: BadgeTone }> = [
  { Icon: CalculatorIcon, tone: 'icon-badge-blue' },
  { Icon: SigmaIcon, tone: 'icon-badge-teal' },
  { Icon: BookIcon, tone: 'icon-badge-green' },
]

export default function HomePage() {
  const catalog = listCatalog()
  const strings = APP_STRINGS.home
  const firstScenario = catalog[0]

  return (
    <>
      <ScrollReveal />

      <section className="hero">
        <div className="hero-inner">
          <div className="hero-copy rise">
            <p className="hero-eyebrow">{strings.heroEyebrow}</p>
            <h1 className="hero-headline">
              {strings.heroHeadline.map((line, idx) => (
                <span
                  key={line}
                  className={idx === strings.heroHeadline.length - 1 ? 'hero-headline-accent' : undefined}
                >
                  {line}
                </span>
              ))}
            </h1>
            <p className="hero-lede">{strings.lede}</p>

            <div className="hero-cta-group">
              {firstScenario !== undefined && (
                <Link
                  className="btn hero-btn-primary"
                  href={`/simulate/${firstScenario.scenarioKey}`}
                >
                  <span>{strings.heroPrimaryCta}</span>
                  <ArrowRightIcon />
                </Link>
              )}
              <a className="btn hero-btn-secondary" href="#workbench-preview">
                <PlayIcon />
                <span>{strings.heroSecondaryCta}</span>
              </a>
            </div>

            {/* Lightweight trust and confidence strip */}
            <ul className="hero-trust-strip">
              {strings.trustItems.map((item, index) => {
                const Icon = TRUST_ICONS[index] ?? CheckCircleIcon
                return (
                  <li className="hero-trust-item" key={item.label}>
                    <Icon className="hero-trust-icon" />
                    <span>{item.label}</span>
                    <span className="sr-only"> ({item.hint})</span>
                  </li>
                )
              })}
            </ul>

            {/* Compact refined scientific model limitation disclosure */}
            <div className="hero-model-disclosure" role="note" aria-label="Giới hạn mô hình giáo dục">
              <WarningIcon className="hero-model-icon" />
              <p>
                <strong>Mô hình học tập:</strong> {strings.modelWarning}
              </p>
            </div>
          </div>

          {/* Hero product preview frame */}
          <HeroPreview />
        </div>
      </section>

      {/* Relocated learning value content (quiet, supporting strip outside the primary first-fold copy) */}
      <section className="hero-learning-strip reveal" aria-label={strings.learningValueHeading}>
        <div className="hero-learning-inner">
          <div className="hero-learning-header">
            <SigmaIcon className="hero-learning-icon" />
            <span>{strings.learningValueHeading}</span>
          </div>
          <ul className="hero-learning-items">
            {strings.learningValues.map((value, idx) => (
              <li key={idx} className="hero-learning-item">
                <span className="hero-learning-bullet" aria-hidden="true">•</span>
                <span>{value}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="page stack-loose">

        <ExperimentShowcase />

        <WorkbenchPreview />

        <section className="stack reveal" id="evidence">
          <div className="stack-tight">
            <p className="eyebrow">{strings.evidenceEyebrow}</p>
            <h2>{strings.evidenceSectionHeading}</h2>
            <p className="lede">{strings.evidenceSectionLede}</p>
          </div>

          <div className="evidence-section">
            <div className="evidence-cards">
              {strings.evidenceCards.map((card, index) => {
                const meta = EVIDENCE_ICONS[index] ?? EVIDENCE_ICONS[0]!
                const { Icon, tone } = meta
                return (
                  <div className="evidence-card" key={card.title}>
                    <span className={`icon-badge icon-badge-sm ${tone}`}>
                      <Icon />
                    </span>
                    <h3>{card.title}</h3>
                    <p>{card.body}</p>
                    <Link href="/evidence">
                      Xem chi tiết
                      <ArrowRightIcon />
                    </Link>
                  </div>
                )
              })}
            </div>
            <div className="evidence-illustration">
              <BookStack />
            </div>
          </div>
        </section>

        <section className="final-cta reveal">
          <div className="final-cta-body">
            <span className="icon-badge icon-badge-teal" aria-hidden="true">
              <FlaskIcon />
            </span>
            <div className="final-cta-copy">
              <h2>{strings.finalCtaHeading}</h2>
              <p>{strings.finalCtaLede}</p>
            </div>
          </div>
          {firstScenario !== undefined && (
            <Link className="btn btn-primary btn-lg" href={`/simulate/${firstScenario.scenarioKey}`}>
              {strings.finalCtaButton}
              <ArrowRightIcon />
            </Link>
          )}
        </section>

        <ScientificDisclosure />
      </div>
    </>
  )
}
