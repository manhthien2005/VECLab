/**
 * 3D Reference Books Visual with Academic Botanical Accent.
 *
 * Replaces the simplistic stacked bars with a refined, authored HTML/CSS/SVG visual
 * representing authoritative scientific references backing VECLab (docs/scientific-evidence-register.md).
 *
 * Source-backed category labels on spines:
 * - Top book: Environmental Treatment (U.S. EPA AMD-Neutralization / Applied Water Science)
 * - Middle book: Physical Chemistry & pH (IUPAC Gold Book / IAPWS R11-24)
 * - Bottom book: Chemical Equilibrium (USGS PHREEQC-1995 / NIST)
 *
 * Features:
 * - 3D isometric spine perspective with authentic page blocks and ribbon bookmark.
 * - Crafted SVG laboratory botanical foliage providing organic depth and academic warmth.
 * - Floating scientific assurance badge anchored to the stack.
 * - Fully vector, zero layout shift, theme-adaptive, respects prefers-reduced-motion.
 */
export function BookStackVisual() {
  return (
    <div className="book-stack-container" aria-hidden="true">
      {/* Botanical Laboratory Foliage Accent (Backdrop) */}
      <svg
        className="book-stack-foliage"
        viewBox="0 0 240 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="leaf-grad-1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="leaf-grad-2" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#0d9488" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.75" />
          </linearGradient>
          <linearGradient id="stem-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#047857" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#065f46" stopOpacity="0.8" />
          </linearGradient>
          <filter id="foliage-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#047857" floodOpacity="0.15" />
          </filter>
        </defs>

        <g filter="url(#foliage-shadow)" className="foliage-group">
          {/* Main graceful arching branch */}
          <path
            d="M 200 190 C 180 120, 130 60, 50 40"
            stroke="url(#stem-grad)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Leaf 1 (Top Left) */}
          <path
            d="M 50 40 C 35 25, 45 5, 70 12 C 85 20, 75 38, 50 40 Z"
            fill="url(#leaf-grad-1)"
          />
          <path d="M 52 38 Q 62 24 68 15" stroke="#a7f3d0" strokeWidth="0.8" strokeLinecap="round" opacity="0.6" />

          {/* Leaf 2 (Upper Middle) */}
          <path
            d="M 85 55 C 80 32, 105 20, 125 32 C 130 50, 110 60, 85 55 Z"
            fill="url(#leaf-grad-2)"
          />
          <path d="M 88 53 Q 105 40 120 34" stroke="#a7f3d0" strokeWidth="0.8" strokeLinecap="round" opacity="0.6" />

          {/* Leaf 3 (Branching Left) */}
          <path
            d="M 115 80 C 85 75, 80 98, 102 110 C 120 115, 128 95, 115 80 Z"
            fill="url(#leaf-grad-1)"
          />

          {/* Leaf 4 (Right Accent) */}
          <path
            d="M 145 95 C 150 70, 180 72, 185 92 C 180 112, 155 110, 145 95 Z"
            fill="url(#leaf-grad-2)"
          />

          {/* Leaf 5 (Small delicate tip) */}
          <path
            d="M 38 42 C 22 40, 20 28, 32 24 C 44 26, 44 38, 38 42 Z"
            fill="url(#leaf-grad-1)"
            opacity="0.9"
          />

          {/* Secondary branchlet */}
          <path
            d="M 160 120 C 190 105, 215 115, 230 130"
            stroke="url(#stem-grad)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M 230 130 C 238 118, 232 105, 218 112 C 210 122, 220 132, 230 130 Z"
            fill="url(#leaf-grad-1)"
          />
        </g>
      </svg>

      {/* 3D Stack of Reference Volumes */}
      <svg
        className="book-stack-svg"
        viewBox="0 0 340 230"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gradients for Spines */}
          <linearGradient id="spine-top" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#115e59" />
            <stop offset="35%" stopColor="#0d9488" />
            <stop offset="70%" stopColor="#0f766e" />
            <stop offset="100%" stopColor="#042f2e" />
          </linearGradient>

          <linearGradient id="spine-mid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="35%" stopColor="#475569" />
            <stop offset="70%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          <linearGradient id="spine-bot" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#cbd5e1" />
            <stop offset="35%" stopColor="#f1f5f9" />
            <stop offset="70%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>

          {/* Page Edge Gradients */}
          <linearGradient id="pages-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#fdfbf7" />
            <stop offset="50%" stopColor="#f4eee4" />
            <stop offset="100%" stopColor="#e5dcce" />
          </linearGradient>

          {/* Book Stack Cast Shadows */}
          <filter id="book-shadow-bot" x="-10%" y="-10%" width="130%" height="150%">
            <feDropShadow dx="0" dy="12" stdDeviation="10" floodColor="#0f172a" floodOpacity="0.14" />
          </filter>
          <filter id="book-shadow-mid" x="-10%" y="-10%" width="130%" height="140%">
            <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#0f172a" floodOpacity="0.18" />
          </filter>
          <filter id="book-shadow-top" x="-10%" y="-10%" width="130%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="3.5" floodColor="#0f172a" floodOpacity="0.22" />
          </filter>
        </defs>

        {/* Ambient Ground Shadow */}
        <ellipse cx="170" cy="216" rx="145" ry="10" fill="#0f172a" opacity="0.12" />

        {/* ==============================================================
            VOLUME 3 (BOTTOM): Chemical Equilibrium & Modeling (PHREEQC)
            ============================================================== */}
        <g filter="url(#book-shadow-bot)">
          {/* Base Book Pages (Side view right) */}
          <path
            d="M 270 168 L 312 176 L 310 206 L 268 198 Z"
            fill="url(#pages-grad)"
            stroke="#cbd5e1"
            strokeWidth="0.5"
          />
          {/* Page texture lines */}
          <line x1="272" y1="178" x2="310" y2="186" stroke="#d5cbbe" strokeWidth="0.6" strokeDasharray="3 2" />
          <line x1="271" y1="188" x2="309" y2="196" stroke="#d5cbbe" strokeWidth="0.6" strokeDasharray="4 2" />

          {/* Bottom Book Spine */}
          <rect
            x="20"
            y="170"
            width="254"
            height="36"
            rx="5"
            fill="url(#spine-bot)"
            stroke="#94a3b8"
            strokeWidth="0.75"
          />
          {/* Embossed Spine Ribs */}
          <line x1="45" y1="170" x2="45" y2="206" stroke="#ffffff" strokeWidth="1.2" opacity="0.7" />
          <line x1="46.5" y1="170" x2="46.5" y2="206" stroke="#94a3b8" strokeWidth="1" opacity="0.5" />
          <line x1="245" y1="170" x2="245" y2="206" stroke="#ffffff" strokeWidth="1.2" opacity="0.7" />
          <line x1="246.5" y1="170" x2="246.5" y2="206" stroke="#94a3b8" strokeWidth="1" opacity="0.5" />

          {/* Embossed Foil Lettering */}
          <text
            x="145"
            y="193"
            textAnchor="middle"
            fill="#334155"
            fontFamily="var(--font-sans), system-ui, sans-serif"
            fontSize="10.5"
            fontWeight="750"
            letterSpacing="0.12em"
          >
            CHEMICAL EQUILIBRIUM &amp; DATA
          </text>
        </g>

        {/* ==============================================================
            VOLUME 2 (MIDDLE): Physical Chemistry & Constants (IUPAC / IAPWS)
            Slightly rotated perspective stack
            ============================================================== */}
        <g filter="url(#book-shadow-mid)" transform="translate(10, -5)">
          {/* Middle Pages Block (Right) */}
          <path
            d="M 262 125 L 302 133 L 300 163 L 260 155 Z"
            fill="url(#pages-grad)"
            stroke="#cbd5e1"
            strokeWidth="0.5"
          />
          <line x1="264" y1="135" x2="300" y2="143" stroke="#d5cbbe" strokeWidth="0.6" strokeDasharray="3 2" />
          <line x1="263" y1="145" x2="299" y2="153" stroke="#d5cbbe" strokeWidth="0.6" strokeDasharray="4 2" />

          {/* Middle Book Spine */}
          <rect
            x="24"
            y="126"
            width="242"
            height="35"
            rx="4.5"
            fill="url(#spine-mid)"
            stroke="#1e293b"
            strokeWidth="0.75"
          />
          {/* Metallic Silver Spine Accent Bars */}
          <line x1="48" y1="126" x2="48" y2="161" stroke="#94a3b8" strokeWidth="1.2" opacity="0.7" />
          <line x1="236" y1="126" x2="236" y2="161" stroke="#94a3b8" strokeWidth="1.2" opacity="0.7" />

          {/* Gold / Silver Foil Lettering */}
          <text
            x="142"
            y="148"
            textAnchor="middle"
            fill="#f1f5f9"
            fontFamily="var(--font-sans), system-ui, sans-serif"
            fontSize="10"
            fontWeight="700"
            letterSpacing="0.14em"
          >
            PHYSICAL CHEMISTRY · IUPAC / IAPWS
          </text>
        </g>

        {/* ==============================================================
            VOLUME 1 (TOP): Environmental Treatment (U.S. EPA / AMD)
            Offset top volume with bookmark ribbon
            ============================================================== */}
        <g filter="url(#book-shadow-top)" transform="translate(16, -12)">
          {/* Top Pages Block (Right) */}
          <path
            d="M 252 82 L 290 89 L 288 119 L 250 112 Z"
            fill="url(#pages-grad)"
            stroke="#99f6e4"
            strokeWidth="0.4"
          />
          <line x1="254" y1="92" x2="288" y2="99" stroke="#d5cbbe" strokeWidth="0.6" strokeDasharray="3 2" />
          <line x1="253" y1="102" x2="287" y2="109" stroke="#d5cbbe" strokeWidth="0.6" strokeDasharray="4 2" />

          {/* Silk Bookmark Ribbon dangling out */}
          <path
            d="M 276 96 C 285 110, 275 130, 282 145 L 288 143 L 282 135 C 280 120, 288 108, 280 96 Z"
            fill="#f59e0b"
            opacity="0.95"
          />

          {/* Top Book Spine */}
          <rect
            x="26"
            y="82"
            width="230"
            height="36"
            rx="5"
            fill="url(#spine-top)"
            stroke="#0f766e"
            strokeWidth="0.8"
          />
          {/* Gold Embossed Spine Accents */}
          <line x1="50" y1="82" x2="50" y2="118" stroke="#5eead4" strokeWidth="1.2" opacity="0.8" />
          <line x1="226" y1="82" x2="226" y2="118" stroke="#5eead4" strokeWidth="1.2" opacity="0.8" />

          {/* Foil Stamped Title */}
          <text
            x="138"
            y="105"
            textAnchor="middle"
            fill="#ffffff"
            fontFamily="var(--font-sans), system-ui, sans-serif"
            fontSize="10"
            fontWeight="750"
            letterSpacing="0.14em"
          >
            ENVIRONMENTAL WATER TREATMENT
          </text>
        </g>
      </svg>

      {/* Floating Scientific Assurance Badge (Restrained depth object) */}
      <div className="book-stack-floating-pill" role="note" aria-label="Nguồn thẩm định tiêu chuẩn">
        <span className="floating-pill-dot" />
        <span className="floating-pill-title">IUPAC · IAPWS · EPA</span>
        <span className="floating-pill-divider">·</span>
        <span className="floating-pill-count">19 nguồn kiểm chứng</span>
      </div>
    </div>
  )
}
