import Link from 'next/link'
import { APP_STRINGS } from '@/content/index.js'
import { listCatalog } from '@/features/experiment-catalog/catalog.js'
import { ScientificDisclosure } from '@/shared/ui/scientific-disclosure.js'
import {
  ArrowRightIcon,
  BookIcon,
  CheckCircleIcon,
  GuestIcon,
  PlayIcon,
  RepeatIcon,
  WarningIcon,
  type IconComponent,
} from '@/features/landing/icons.js'
import { HeroPreview } from '@/features/landing/hero-preview.js'
import { ExperimentShowcase } from '@/features/landing/experiment-showcase.js'
import { WorkbenchPreview } from '@/features/landing/workbench-preview.js'
import { EvidenceSection } from '@/features/landing/evidence-section.js'
import { FinalCtaBanner } from '@/features/landing/final-cta-banner.js'
import { ScrollReveal } from '@/features/landing/scroll-reveal.js'

/**
 * Home page and experiment showcase (docs/web-application-scope.md §4.1), redesigned to
 * the approved landing package (design.md, reference/approved-landing.png).
 *
 * Storytelling sequence:
 * 1. Hero with interactive preview (HeroPreview)
 * 2. Learning values transition strip
 * 3. 3-experiment showcase (ExperimentShowcase)
 * 4. Interactive Workbench demonstration (WorkbenchPreview)
 * 5. Scientific Evidence & Trust (EvidenceSection)
 * 6. Final conversion banner (FinalCtaBanner)
 * 7. Scientific model disclosure & locked evidence register (ScientificDisclosure)
 *
 * Server Component reading only the release registries, statically renderable.
 * `ScrollReveal` and `WorkbenchPreview` are client leaves where needed.
 */

const TRUST_ICONS: readonly IconComponent[] = [GuestIcon, RepeatIcon, BookIcon]

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
            <span className="hero-learning-icon" aria-hidden="true">∑</span>
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

      <div className="page landing-flow">
        <ExperimentShowcase />

        <WorkbenchPreview />

        <EvidenceSection />

        <FinalCtaBanner scenarioKey={firstScenario?.scenarioKey} />

        <section className="landing-disclosure-section reveal" aria-label="Nguồn và giới hạn mô hình">
          <div className="landing-disclosure-card">
            <ScientificDisclosure />
          </div>
        </section>
      </div>
    </>
  )
}
