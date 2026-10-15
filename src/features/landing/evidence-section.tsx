import Link from 'next/link'
import { APP_STRINGS } from '@/content/index.js'
import { ArrowRightIcon } from './icons.js'

/** A matching set of geometric symbols for the three foundations of a result. */
function EvidenceSymbol({ kind }: { kind: 'model' | 'formula' | 'sources' }) {
  return (
    <svg className="evidence-tree-emblem" viewBox="0 0 80 80" fill="none" aria-hidden="true" focusable="false">
      <path d="m40 4 31 18v36L40 76 9 58V22Z" fill="var(--surface-2)" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1.25" />
      <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {kind === 'model' && <>
          <path d="M40 31V20M31 46 22 55M49 46l9 9" />
          <rect x="29" y="31" width="22" height="18" rx="4" />
          <circle cx="40" cy="17" r="3" /><circle cx="20" cy="58" r="3" /><circle cx="60" cy="58" r="3" />
          <path d="M35 37h10m-10 6h6" />
        </>}
        {kind === 'formula' && <>
          <path d="M23 40h34M30 22l12 10m0-10L30 32M32 52h16" />
          <circle cx="54" cy="27" r="2" fill="currentColor" stroke="none" />
          <circle cx="40" cy="59" r="2" fill="currentColor" stroke="none" />
        </>}
        {kind === 'sources' && <>
          <path d="M26 18h21l9 9v35H26ZM47 18v11h9" />
          <path d="M33 36h16m-16 7h12m-12 7h8M21 25v32" />
          <path d="m43 55 3 3 6-7" />
        </>}
      </g>
    </svg>
  )
}

export function EvidenceSection() {
  const strings = APP_STRINGS.home
  const symbols = ['model', 'formula', 'sources'] as const
  return (
    <div className="evidence-section-wrap evidence-tree-section" aria-labelledby="evidence-heading">
      <svg className="evidence-tree-background" viewBox="0 0 1440 860" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <defs><pattern id="evidence-tree-dots" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="0.9" fill="currentColor" /></pattern></defs>
        <g fill="url(#evidence-tree-dots)" opacity="0.2"><rect x="24" y="150" width="200" height="230" /><rect x="1220" y="420" width="200" height="230" /></g>
        <g fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.28">
          <path d="M0 100h160l35 61h150M1440 100h-160l-35 61h-150M0 740h250l35-61h180M1440 740h-250l-35-61H975" />
          <path d="m95 420 24-42h48l24 42-24 42h-48Zm1160-155 24-42h48l24 42-24 42h-48Z" />
          <path d="M55 790h1330" strokeDasharray="2 12" />
        </g>
        <g fill="currentColor" opacity="0.4"><circle cx="345" cy="161" r="3" /><circle cx="1095" cy="161" r="3" /><circle cx="465" cy="679" r="3" /><circle cx="975" cy="679" r="3" /></g>
      </svg>
      <div className="evidence-head">
        <p className="eyebrow">{strings.evidenceEyebrow}</p>
        <h2 id="evidence-heading" className="evidence-main-heading">{strings.evidenceSectionHeading}</h2>
        <p className="lede evidence-main-lede">{strings.evidenceSectionLede}</p>
      </div>

      <div className="evidence-tree">
        <div className="evidence-tree-root">
          <svg viewBox="0 0 80 80" fill="none" aria-hidden="true" focusable="false">
            <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="1" strokeDasharray="2 6" strokeOpacity="0.4" />
            <path d="M33 22h14m-11 0v16L25 54a5 5 0 0 0 4 8h22a5 5 0 0 0 4-8L44 38V22" fill="var(--accent-soft)" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M31 48h18m-14 7h1m8-3h1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <h3>Kết quả mô phỏng</h3>
          <p>Có thể xem lại cách tính và nguồn dữ liệu</p>
        </div>
        <svg className="evidence-tree-connectors" viewBox="0 0 1200 100" preserveAspectRatio="none" fill="none" aria-hidden="true" focusable="false">
          <path d="M600 0v36M200 100V56q0-20 20-20h760q20 0 20 20v44M600 36v64" stroke="currentColor" strokeWidth="1.5" />
          <g fill="var(--surface)" stroke="currentColor" strokeWidth="1.5"><circle cx="600" cy="36" r="4" /><circle cx="200" cy="96" r="3" /><circle cx="600" cy="96" r="3" /><circle cx="1000" cy="96" r="3" /></g>
        </svg>
        <ul className="evidence-tree-branches">
          {strings.evidenceCards.map((card, index) => (
            <li key={card.title} className="evidence-tree-branch">
              <article className="evidence-tree-node">
                <EvidenceSymbol kind={symbols[index] ?? 'sources'} />
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </article>
            </li>
          ))}
        </ul>
      </div>
      <div className="evidence-tree-footer">
        <Link href="/evidence" className="evidence-tree-link"><span>Xem nguồn khoa học</span><ArrowRightIcon /></Link>
        <p>Kết quả mô phỏng không thay thế phép đo thực nghiệm.</p>
      </div>
    </div>
  )
}
