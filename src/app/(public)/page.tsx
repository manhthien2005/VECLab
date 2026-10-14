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
 * 3. Workbench preview of the real 4-beat lab cycle (WorkbenchPreview)
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
        <svg className="hero-background-art" viewBox="0 0 1440 820" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
          <g fill="none" stroke="currentColor" strokeWidth="1" opacity="0.55">
            <path d="M830 0v110q0 40 40 40h290q40 0 40 40v140" />
            <path d="M1440 390h-90q-40 0-40 40v110q0 40-40 40H880" />
            <path d="M1050 820V720q0-40 40-40h270" />
          </g>
          <g fill="currentColor">
            <circle cx="80" cy="150" r="2" /><circle cx="360" cy="90" r="1.5" />
            <circle cx="670" cy="180" r="2" /><circle cx="940" cy="80" r="2" />
            <circle cx="1200" cy="330" r="3" /><circle cx="1330" cy="120" r="2" />
            <circle cx="880" cy="580" r="3" /><circle cx="1380" cy="650" r="1.5" />
            <circle cx="90" cy="670" r="1.5" /><circle cx="490" cy="700" r="2" />
            <circle cx="780" cy="740" r="1.5" /><circle cx="1360" cy="680" r="3" />
          </g>
        </svg>
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

            {/* Preserved learning values educational statements for accessibility and auditing */}
            <ul className="sr-only" aria-label={strings.learningValueHeading}>
              {strings.learningValues.map((value, idx) => (
                <li key={idx}>{value}</li>
              ))}
            </ul>

          </div>

          {/* Hero product preview frame */}
          <HeroPreview />
        </div>
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

        <section className="landing-section landing-section-disclosure reveal" data-reveal-variant="simple" aria-label="Nguồn và giới hạn mô hình">
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
