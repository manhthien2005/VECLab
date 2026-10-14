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
          <svg className="final-cta-lab-svg" viewBox="0 0 440 310" fill="none" focusable="false">
            <defs><pattern id="cta-lab-dots" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="0.8" fill="currentColor" /></pattern></defs>
            <g stroke="currentColor" strokeWidth="1.1" opacity="0.25">
              <path d="M0 68h45l25 43M440 230h-52l-28-49M0 276h100l24-42M440 36h-80l-20 35" />
              <circle cx="222" cy="156" r="120" strokeDasharray="2 8" />
              <path d="m370 88 13-23h26l13 23-13 23h-26Z" />
            </g>
            <g fill="url(#cta-lab-dots)" opacity="0.28"><rect x="12" y="148" width="58" height="98" /><rect x="356" y="18" width="72" height="44" /></g>
            <rect x="77" y="34" width="274" height="242" rx="14" fill="var(--surface)" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.35" />
            <path d="M77 63h274" stroke="currentColor" strokeOpacity="0.2" />
            <g fill="currentColor" opacity="0.5"><circle cx="92" cy="49" r="2" /><circle cx="102" cy="49" r="2" /><circle cx="112" cy="49" r="2" /></g>
            <path d="M106 246h215M122 241V88m-6 0h44m-38 16h33" stroke="var(--ink-muted)" strokeWidth="2" strokeLinecap="round" />
            <path d="M244 80h16v55l-8 16-8-16Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M248 89h8m-8 9h5m-5 9h8m-8 9h5M252 151v9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <path d="M162 147h105l-7 78a8 8 0 0 1-8 7h-75a8 8 0 0 1-8-7Z" fill="var(--surface)" stroke="var(--ink-muted)" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M167 181h96l-4 44a7 7 0 0 1-7 6h-75a7 7 0 0 1-7-6Z" fill="var(--accent-soft)" />
            <path className="final-cta-waterline" d="M168 181q23-4 46 0t47 0" stroke="currentColor" strokeWidth="1.5" />
            <path d="M177 164h9m-8 13h5m-4 14h8m-7 13h5" stroke="var(--ink-muted)" strokeWidth="1.2" strokeLinecap="round" />
            <rect x="158" y="233" width="112" height="13" rx="4" fill="var(--surface-2)" stroke="var(--ink-muted)" strokeWidth="1.2" />
            <rect x="202" y="212" width="25" height="5" rx="2.5" fill="var(--surface)" stroke="currentColor" strokeWidth="1" />
            <path d="M153 101h43v77" stroke="var(--ink-muted)" strokeWidth="2" strokeLinecap="round" />
            <path d="M196 178v29" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            <circle className="final-cta-drop" cx="252" cy="162" r="2.8" fill="currentColor" />
            <g stroke="currentColor" strokeWidth="1.2" opacity="0.65"><path d="M292 108h30m-30 9h19M292 196h30m-30 9h19" /><circle cx="303" cy="169" r="9" /><path d="M299 169h8m-4-4v8" /></g>
          </svg>
          <p>Thao tác · Quan sát · Đối chiếu</p>
        </div>
      </div>
    </div>
  )
}
