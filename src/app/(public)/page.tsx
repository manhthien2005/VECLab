import Link from 'next/link'
import { APP_STRINGS } from '@/content/index.js'
import { listCatalog } from '@/features/experiment-catalog/catalog.js'
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
 * 3. Static concept preview of the planned workbench (WorkbenchPreview)
 * 4. Scientific Evidence & Trust (EvidenceSection)
 * 5. Final conversion banner (FinalCtaBanner)
 *
 * Server Component reading only the release registries, statically renderable.
 * `ScrollReveal` handles page reveals; the workbench concept is static server markup.
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
          <defs>
            <pattern id="hero-tech-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M40 0H0v40" fill="none" stroke="currentColor" strokeWidth="0.65" />
            </pattern>
            <pattern id="hero-tech-dots" width="9" height="9" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="currentColor" />
            </pattern>
            <path id="hero-tech-hexagon" d="M-24 0l12-21h24L24 0 12 21h-24Z" />
          </defs>
          <rect width="1440" height="820" fill="url(#hero-tech-grid)" opacity="0.085" />
          <g fill="url(#hero-tech-dots)" opacity="0.26">
            <rect x="670" y="92" width="260" height="98" />
            <rect x="1260" y="238" width="180" height="134" />
            <rect x="144" y="622" width="244" height="104" />
            <rect x="1060" y="698" width="250" height="122" />
          </g>
          <g fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" opacity="0.45">
            <path d="M780 0l72 124h246l72 124h270" />
            <path d="M960 74h206l82 142h192" />
            <path d="M1440 430h-168l-76 132H940l-64 110H620" />
            <path d="M1440 474h-136l-84 146H982l-62 108H596" />
            <path d="M1440 122h-86l-74 128v106" />
            <path d="M0 590h88l80 138h250l54-94h120" />
            <path d="M0 632h64l76 132h302l54-94h140" />
            <path d="M1090 820l58-100h168l58-100h66" />
            <use href="#hero-tech-hexagon" transform="translate(1244 132) scale(1.2)" />
            <use href="#hero-tech-hexagon" transform="translate(1310 148) scale(.55)" />
            <use href="#hero-tech-hexagon" transform="translate(708 704) scale(1.4)" />
            <use href="#hero-tech-hexagon" transform="translate(772 744) scale(.65)" />
            <use href="#hero-tech-hexagon" transform="translate(76 710) scale(.7)" />
          </g>
          <g fill="currentColor" opacity="0.65">
            <circle cx="852" cy="124" r="3.5" /><circle cx="960" cy="74" r="3" />
            <circle cx="1280" cy="356" r="3.5" /><circle cx="940" cy="562" r="3" />
            <circle cx="620" cy="672" r="4" /><circle cx="596" cy="728" r="3" />
            <circle cx="88" cy="590" r="3.5" /><circle cx="592" cy="634" r="3" />
            <circle cx="1316" cy="720" r="3" /><circle cx="636" cy="670" r="3" />
          </g>
          <g fill="currentColor" opacity="0.35">
            <circle cx="90" cy="160" r="1.5" /><circle cx="380" cy="112" r="1.5" />
            <circle cx="638" cy="310" r="2" /><circle cx="702" cy="396" r="1.5" />
            <circle cx="456" cy="710" r="2" /><circle cx="1004" cy="682" r="1.5" />
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

      </div>
    </>
  )
}
