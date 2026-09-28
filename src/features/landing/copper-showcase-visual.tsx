/**
 * Copper precipitation scientific diagram for the experiment showcase card.
 *
 * Authored pure SVG/HTML diagram showing:
 * 1. Initial aqueous Cu²⁺ solution in laboratory beaker
 * 2. Directional reaction arrow
 * 3. Resulting Cu(OH)₂(s) royal-blue precipitate settling at beaker bottom
 * 4. Authoritative reaction formula: Cu²⁺(aq) + 2OH⁻(aq) → Cu(OH)₂(s)
 *
 * Source-backed by docs/experiments/copper-precipitation-spec.md §1 & §2.
 */

export function CopperShowcaseVisual() {
  return (
    <div className="copper-stage-container" aria-label="Sơ đồ minh họa phản ứng kết tủa Cu²⁺ tạo Cu(OH)₂">
      <div className="copper-visual-canvas">
        <svg
          viewBox="0 0 340 148"
          className="copper-showcase-svg"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-hidden="true"
        >
          <defs>
            {/* Glass gradients */}
            <linearGradient id="cu-glass-wall" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
              <stop offset="15%" stopColor="#e0f2fe" stopOpacity="0.25" />
              <stop offset="85%" stopColor="#e0f2fe" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.8" />
            </linearGradient>

            {/* Left beaker solution: dilute Cu2+ (light cyan-blue) */}
            <linearGradient id="cu-sol-initial" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.55" />
            </linearGradient>

            {/* Right beaker supernatant (lighter blue) */}
            <linearGradient id="cu-sol-supernatant" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0.4" />
            </linearGradient>

            {/* Cu(OH)2 precipitate (rich royal blue flocculent mass) */}
            <linearGradient id="cu-precipitate" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="50%" stopColor="#0369a1" />
              <stop offset="100%" stopColor="#075985" />
            </linearGradient>

            {/* Beaker drop shadow */}
            <filter id="cu-beaker-shadow" x="-10%" y="-10%" width="120%" height="130%">
              <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#0c4a6e" floodOpacity="0.1" />
            </filter>
          </defs>

          {/* ================= LEFT BEAKER: Cu²⁺ (aq) ================= */}
          <g transform="translate(36, 12)" filter="url(#cu-beaker-shadow)">
            {/* Beaker Body */}
            <rect
              x="0"
              y="10"
              width="90"
              height="100"
              rx="10"
              fill="url(#cu-glass-wall)"
              stroke="#94a3b8"
              strokeWidth="1.75"
            />
            {/* Beaker Lip & Rim */}
            <ellipse cx="45" cy="10" rx="46" ry="6" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.75" />
            <path d="M-3 10 C-3 6, 2 6, 8 7" stroke="#94a3b8" strokeWidth="1.5" fill="none" />

            {/* Liquid Fill */}
            <path
              d="M 2 46 Q 45 49 88 46 L 88 100 Q 88 108 80 108 L 10 108 Q 2 108 2 100 Z"
              fill="url(#cu-sol-initial)"
            />
            {/* Liquid Meniscus */}
            <ellipse cx="45" cy="46" rx="43" ry="5" fill="#bae6fd" opacity="0.8" />

            {/* Graduation Markings */}
            <line x1="10" y1="56" x2="22" y2="56" stroke="#64748b" strokeWidth="1.2" opacity="0.75" />
            <line x1="10" y1="70" x2="18" y2="70" stroke="#64748b" strokeWidth="1" opacity="0.5" />
            <line x1="10" y1="84" x2="22" y2="84" stroke="#64748b" strokeWidth="1.2" opacity="0.75" />
            <line x1="10" y1="98" x2="18" y2="98" stroke="#64748b" strokeWidth="1" opacity="0.5" />

            {/* Spec Label */}
            <text x="45" y="78" textAnchor="middle" fill="#0369a1" fontSize="11" fontWeight="600" opacity="0.9">
              Cu²⁺ (aq)
            </text>
          </g>

          {/* ================= CENTER TRANSFORMATION ARROW ================= */}
          <g transform="translate(154, 68)">
            <circle cx="16" cy="0" r="14" fill="var(--surface-2, #f1f5f9)" stroke="var(--border, #cbd5e1)" strokeWidth="1" />
            <path
              d="M 9 0 L 23 0 M 18 -4 L 23 0 L 18 4"
              stroke="#0284c7"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>

          {/* ================= RIGHT BEAKER: Cu(OH)₂ (s) PRECIPITATE ================= */}
          <g transform="translate(214, 12)" filter="url(#cu-beaker-shadow)">
            {/* Beaker Body */}
            <rect
              x="0"
              y="10"
              width="90"
              height="100"
              rx="10"
              fill="url(#cu-glass-wall)"
              stroke="#94a3b8"
              strokeWidth="1.75"
            />
            {/* Beaker Lip & Rim */}
            <ellipse cx="45" cy="10" rx="46" ry="6" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.75" />
            <path d="M-3 10 C-3 6, 2 6, 8 7" stroke="#94a3b8" strokeWidth="1.5" fill="none" />

            {/* Supernatant Liquid */}
            <path
              d="M 2 46 Q 45 49 88 46 L 88 78 L 2 78 Z"
              fill="url(#cu-sol-supernatant)"
            />
            {/* Liquid Meniscus */}
            <ellipse cx="45" cy="46" rx="43" ry="5" fill="#e0f2fe" opacity="0.8" />

            {/* Precipitate Layer (Solid Cu(OH)2 at bottom) */}
            <path
              d="M 2 78 C 18 75, 34 82, 50 77 C 68 73, 76 80, 88 76 L 88 100 Q 88 108 80 108 L 10 108 Q 2 108 2 100 Z"
              fill="url(#cu-precipitate)"
            />
            {/* Flocculent particle textures */}
            <circle cx="28" cy="72" r="3.5" fill="#0284c7" opacity="0.85" />
            <circle cx="48" cy="70" r="4.5" fill="#0369a1" opacity="0.9" />
            <circle cx="68" cy="73" r="3" fill="#0284c7" opacity="0.8" />
            <circle cx="38" cy="85" r="2.5" fill="#38bdf8" opacity="0.6" />
            <circle cx="58" cy="88" r="3" fill="#38bdf8" opacity="0.6" />

            {/* Graduation Markings */}
            <line x1="10" y1="56" x2="22" y2="56" stroke="#64748b" strokeWidth="1.2" opacity="0.75" />
            <line x1="10" y1="70" x2="18" y2="70" stroke="#64748b" strokeWidth="1" opacity="0.5" />
            <line x1="10" y1="84" x2="22" y2="84" stroke="#ffffff" strokeWidth="1.2" opacity="0.8" />
            <line x1="10" y1="98" x2="18" y2="98" stroke="#ffffff" strokeWidth="1" opacity="0.6" />

            {/* Precipitate Label */}
            <text x="45" y="99" textAnchor="middle" fill="#f0f9ff" fontSize="10.5" fontWeight="700">
              Cu(OH)₂ (s)
            </text>
          </g>
        </svg>
      </div>

      {/* Authoritative chemical equation footer */}
      <div className="copper-equation-footer">
        <span className="copper-formula-token">Cu<sup>2+</sup><sub>(aq)</sub></span>
        <span className="copper-formula-operator">+</span>
        <span className="copper-formula-token">2OH<sup>−</sup><sub>(aq)</sub></span>
        <span className="copper-formula-arrow">→</span>
        <span className="copper-formula-product">Cu(OH)<sub>2</sub><sub>(s)</sub></span>
      </div>
    </div>
  )
}
