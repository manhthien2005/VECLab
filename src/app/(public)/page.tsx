import Link from 'next/link'
import { APP_STRINGS } from '@/content/index.js'
import { ArrowRightIcon, PlayIcon, WarningIcon } from '@/features/landing/icons.js'
import { HeroPreview } from '@/features/landing/hero-preview.js'
import { ExperimentShowcase } from '@/features/landing/experiment-showcase.js'
import { WorkbenchPreview } from '@/features/landing/workbench-preview.js'
import { EvidenceSection } from '@/features/landing/evidence-section.js'
import { FinalCtaBanner } from '@/features/landing/final-cta-banner.js'
import { ScrollReveal } from '@/features/landing/scroll-reveal.js'

/** Landing overview only; science disclosures remain on detail, workbench and report routes. */
export default function HomePage() {
  const strings = APP_STRINGS.home
  return (
    <>
      <ScrollReveal />
      <section className="hero" aria-labelledby="landing-headline">
        <div className="hero-inner">
          <div className="hero-copy rise">
            <h1 className="hero-headline" id="landing-headline">
              {strings.heroHeadline.map((line) => <span key={line}>{line}</span>)}
            </h1>
            <p className="hero-lede">{strings.lede}</p>
            <div className="hero-cta-group">
              <a className="btn hero-btn-primary" href="#showcase">
                <span>{strings.heroPrimaryCta}</span><ArrowRightIcon aria-hidden="true" />
              </a>
              <a className="btn hero-btn-secondary" href="#workbench-preview">
                <PlayIcon aria-hidden="true" /><span>{strings.heroSecondaryCta}</span>
              </a>
            </div>
            <div className="hero-model-disclosure" role="note">
              <WarningIcon className="hero-model-icon" aria-hidden="true" />
              <p>{strings.modelWarning} <Link href="/evidence">Nguồn và giới hạn</Link></p>
            </div>
          </div>
          <HeroPreview />
        </div>
      </section>
      <div className="landing-flow">
        <section className="landing-section landing-section-experiments" id="showcase" aria-labelledby="showcase-heading">
          <div className="landing-section-inner"><ExperimentShowcase /></div>
        </section>
        <section className="landing-section landing-section-workbench" id="workbench-preview">
          <div className="landing-section-inner"><WorkbenchPreview /></div>
        </section>
        <section className="landing-section landing-section-evidence" id="evidence">
          <div className="landing-section-inner"><EvidenceSection /></div>
        </section>
        <section className="landing-section landing-section-cta">
          <div className="landing-section-inner"><FinalCtaBanner /></div>
        </section>
      </div>
    </>
  )
}
