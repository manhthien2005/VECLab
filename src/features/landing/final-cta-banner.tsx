import { APP_STRINGS } from '@/content/index.js'
import { ArrowRightIcon } from './icons.js'

export function FinalCtaBanner() {
  const strings = APP_STRINGS.home
  return (
    <div className="final-cta-section reveal" data-reveal-variant="invite" aria-labelledby="final-cta-heading">
      <div className="final-cta-surface">
        <div className="final-cta-content">
          <div className="final-cta-text">
            <h2 id="final-cta-heading" className="final-cta-title">{strings.finalCtaHeading}</h2>
          </div>
        </div>
        <div className="final-cta-action">
          <a className="btn final-cta-btn" href="#showcase">
            <span>{strings.finalCtaButton}</span><ArrowRightIcon aria-hidden="true" />
          </a>
        </div>
      </div>
    </div>
  )
}
