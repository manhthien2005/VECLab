import Image from 'next/image'
import Link from 'next/link'
import { APP_STRINGS } from '@/content/index.js'
import { ArrowRightIcon } from './icons.js'

interface FinalCtaBannerProps {
  scenarioKey?: string | undefined
}

/** An invitation to the served experiment, with decorative apparatus rather than fake telemetry. */
export function FinalCtaBanner({ scenarioKey = 'acid-neutralization' }: FinalCtaBannerProps) {
  const strings = APP_STRINGS.home
  return (
    <div className="final-cta-section reveal" data-reveal-variant="invite" aria-labelledby="final-cta-heading">
      <div className="final-cta-surface">
        <div className="final-cta-content">
          <h2 id="final-cta-heading" className="final-cta-title">{strings.finalCtaHeading}</h2>
          <p className="final-cta-desc">{strings.finalCtaLede}</p>
          <Link className="btn final-cta-btn" href={`/simulate/${scenarioKey}`}>
            <span>{strings.finalCtaButton}</span><ArrowRightIcon />
          </Link>
        </div>
        <div className="final-cta-lab" aria-hidden="true">
          <div className="final-cta-image-stage">
            <Image className="final-cta-image-ambient" src="/assets/lab-invitation.webp" alt="" fill sizes="(max-width: 48rem) 85vw, 480px" />
            <Image className="final-cta-image" src="/assets/lab-invitation.webp" alt="" fill sizes="(max-width: 48rem) 85vw, 480px" />
          </div>
          <p>Thao tác · Quan sát · Đối chiếu</p>
        </div>
      </div>
    </div>
  )
}
