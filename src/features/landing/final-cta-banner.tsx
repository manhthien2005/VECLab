import Link from 'next/link'
import { APP_STRINGS } from '@/content/index.js'
import { ArrowRightIcon, FlaskIcon } from './icons.js'

interface FinalCtaBannerProps {
  scenarioKey?: string | undefined
}

/**
 * Final CTA Section (docs/web-application-scope.md §4.1).
 *
 * Implements the approved mint/cyan surface standard from reference/approved-landing.png:
 * - Spacious rounded surface with subtle clinical mint/cyan wash.
 * - Circular emblem with laboratory icon.
 * - Bold concise heading and supporting lede.
 * - Dominant, highly accessible CTA button pointing to live Acid Neutralization simulation.
 * - Desktop horizontal composition and mobile stacked composition.
 * - Server Component.
 */
export function FinalCtaBanner({ scenarioKey = 'acid-neutralization' }: FinalCtaBannerProps) {
  const strings = APP_STRINGS.home

  return (
    <section className="final-cta-section reveal" aria-labelledby="final-cta-heading">
      <div className="final-cta-surface">
        <div className="final-cta-content">
          <div className="final-cta-emblem" aria-hidden="true">
            <FlaskIcon />
          </div>
          <div className="final-cta-text">
            <h2 id="final-cta-heading" className="final-cta-title">
              {strings.finalCtaHeading}
            </h2>
            <p className="final-cta-desc">
              {strings.finalCtaLede}
            </p>
          </div>
        </div>

        <div className="final-cta-action">
          <Link
            className="btn final-cta-btn"
            href={`/simulate/${scenarioKey}`}
          >
            <span>{strings.finalCtaButton}</span>
            <ArrowRightIcon />
          </Link>
        </div>
      </div>
    </section>
  )
}
