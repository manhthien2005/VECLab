import Link from 'next/link'
import { APP_STRINGS } from '@/content/index.js'
import { listCatalog } from '@/features/experiment-catalog/catalog.js'
import { ScientificDisclosure } from '@/shared/ui/scientific-disclosure.js'
import {
  ArrowRightIcon,
  BookIcon,
  CheckCircleIcon,
  GraduationCapIcon,
  PlayIcon,
  ShieldCheckIcon,
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
 * the approved landing package (reference/approved-landing.png).
 *
 * Storytelling sequence:
 * 1. Hero with interactive preview (HeroPreview) and integrated learning value trust row
 * 2. 3-experiment showcase with centered heading (ExperimentShowcase)
 * 3. Interactive Workbench demonstration in subtle icy-blue framing (WorkbenchPreview)
 * 4. Scientific Evidence & Trust (EvidenceSection)
 * 5. Final conversion banner (FinalCtaBanner)
 * 6. Scientific model disclosure & locked evidence register (ScientificDisclosure)
 *
 * Server Component reading only the release registries, statically renderable.
 * `ScrollReveal` and `WorkbenchPreview` are client leaves where needed.
 */

const TRUST_ICONS: readonly IconComponent[] = [ShieldCheckIcon, GraduationCapIcon, BookIcon]

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

            {/* Lightweight learning value benefit row beneath CTA matching approved reference */}
            <ul className="hero-trust-strip" aria-label="Giá trị học tập và cam kết giáo dục">
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

            {/* Preserved learning values educational statements for accessibility and auditing */}
            <ul className="sr-only" aria-label={strings.learningValueHeading}>
              {strings.learningValues.map((value, idx) => (
                <li key={idx}>{value}</li>
              ))}
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

      {/* Landing Flow Sections with Distinct Chapter Framing */}
      <div className="landing-flow">
        <section className="landing-section landing-section-experiments" id="showcase">
          <div className="landing-section-inner">
            <ExperimentShowcase />
          </div>
        </section>

        <section className="landing-section landing-section-workbench" id="workbench-preview">
          <div className="landing-section-inner">
            <WorkbenchPreview />
          </div>
        </section>

        <section className="landing-section landing-section-evidence" id="evidence">
          <div className="landing-section-inner">
            <EvidenceSection />
          </div>
        </section>

        <section className="landing-section landing-section-cta">
          <div className="landing-section-inner">
            <FinalCtaBanner scenarioKey={firstScenario?.scenarioKey} />
          </div>
        </section>

        <section className="landing-section landing-section-disclosure reveal" aria-label="Nguồn và giới hạn mô hình">
          <div className="landing-section-inner">
            <div className="landing-disclosure-card">
              <ScientificDisclosure />
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
