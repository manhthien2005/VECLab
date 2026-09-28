/**
 * Plastic density separation scientific diagram for the experiment showcase card.
 *
 * Authored SVG/HTML diagram showing:
 * 1. Cylindrical laboratory separation vessel with liquid medium
 * 2. Polymer pellets floating or settled at exact density stratifications
 * 3. Clean callouts with leader lines referencing authoritative values:
 *    - PP (ρ = 0,910 g/cm³) [floats at top]
 *    - HDPE (ρ = 0,953 g/cm³) [floats near meniscus]
 *    - PS (ρ = 1,040 g/cm³) [sinks in water]
 *    - PET (ρ = 1,380 g/cm³) [settles at container bottom]
 *
 * Source-backed by docs/experiments/plastic-density-separation-spec.md §4
 * and docs/scientific-evidence-register.md (PS-POLYMER-DENSITY).
 */

export function PlasticShowcaseVisual() {
  return (
    <div className="plastic-stage-container" aria-label="Sơ đồ minh họa phân loại hạt nhựa theo mật độ nổi và chìm">
      <div className="plastic-visual-canvas">
        <svg
          viewBox="0 0 340 160"
          className="plastic-showcase-svg"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-hidden="true"
        >
          <defs>
            {/* Glass vessel gradient */}
            <linearGradient id="pl-glass-wall" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
              <stop offset="12%" stopColor="#e0f2fe" stopOpacity="0.3" />
              <stop offset="88%" stopColor="#e0f2fe" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.8" />
            </linearGradient>

            {/* Liquid medium (clean water, 20 °C) */}
            <linearGradient id="pl-liquid" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#dbeafe" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#93c5fd" stopOpacity="0.45" />
            </linearGradient>

            {/* Vessel shadow */}
            <filter id="pl-vessel-shadow" x="-15%" y="-10%" width="130%" height="130%">
              <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#0f172a" floodOpacity="0.08" />
            </filter>
          </defs>

          {/* ================= LABORATORY SEPARATION VESSEL ================= */}
          <g transform="translate(24, 10)" filter="url(#pl-vessel-shadow)">
            {/* Vessel Wall */}
            <path
              d="M 10 16 L 16 128 Q 18 140 32 140 L 118 140 Q 132 140 134 128 L 140 16"
              fill="url(#pl-glass-wall)"
              stroke="#94a3b8"
              strokeWidth="1.75"
            />
            {/* Top Rim Ellipse */}
            <ellipse cx="75" cy="16" rx="65" ry="9" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.75" />

            {/* Liquid Medium */}
            <path
              d="M 12 38 Q 75 44 138 38 L 134 128 Q 132 140 118 140 L 32 140 Q 18 140 16 128 Z"
              fill="url(#pl-liquid)"
            />
            {/* Liquid Meniscus */}
            <ellipse cx="75" cy="38" rx="63" ry="7" fill="#bfdbfe" opacity="0.8" />

            {/* ================= POLYMER SAMPLES ================= */}
            {/* Level 1: PP (ρ = 0.910) - Floating on surface */}
            <g className="polymer-group-pp">
              <rect x="36" y="32" width="16" height="9" rx="3" fill="#fef08a" stroke="#ca8a04" strokeWidth="1.2" transform="rotate(-6 44 36)" />
              <rect x="62" y="30" width="18" height="9" rx="3" fill="#fef08a" stroke="#ca8a04" strokeWidth="1.2" transform="rotate(8 71 34)" />
              <rect x="92" y="33" width="15" height="8" rx="3" fill="#fef08a" stroke="#ca8a04" strokeWidth="1.2" transform="rotate(-12 99 37)" />
            </g>

            {/* Level 2: HDPE (ρ = 0.953) - Floating just below meniscus */}
            <g className="polymer-group-hdpe">
              <rect x="42" y="52" width="16" height="9" rx="3" fill="#bbf7d0" stroke="#16a34a" strokeWidth="1.2" transform="rotate(10 50 56)" />
              <rect x="74" y="50" width="18" height="9" rx="3" fill="#bbf7d0" stroke="#16a34a" strokeWidth="1.2" transform="rotate(-5 83 54)" />
              <rect x="104" y="53" width="15" height="9" rx="3" fill="#bbf7d0" stroke="#16a34a" strokeWidth="1.2" transform="rotate(14 111 57)" />
            </g>

            {/* Level 3: PS (ρ = 1.040) - Sinking in water */}
            <g className="polymer-group-ps">
              <rect x="38" y="86" width="16" height="9" rx="3" fill="#67e8f9" stroke="#0891b2" strokeWidth="1.2" transform="rotate(-8 46 90)" />
              <rect x="68" y="88" width="17" height="9" rx="3" fill="#67e8f9" stroke="#0891b2" strokeWidth="1.2" transform="rotate(15 76 92)" />
              <rect x="98" y="85" width="16" height="9" rx="3" fill="#67e8f9" stroke="#0891b2" strokeWidth="1.2" transform="rotate(-4 106 89)" />
            </g>

            {/* Level 4: PET (ρ = 1.380) - Settled at container bottom */}
            <g className="polymer-group-pet">
              <rect x="32" y="124" width="18" height="9" rx="3" fill="#334155" stroke="#0f172a" strokeWidth="1.2" transform="rotate(5 41 128)" />
              <rect x="58" y="126" width="17" height="9" rx="3" fill="#475569" stroke="#1e293b" strokeWidth="1.2" transform="rotate(-3 66 130)" />
              <rect x="84" y="125" width="19" height="9" rx="3" fill="#334155" stroke="#0f172a" strokeWidth="1.2" transform="rotate(8 93 129)" />
              <rect x="110" y="123" width="16" height="9" rx="3" fill="#475569" stroke="#1e293b" strokeWidth="1.2" transform="rotate(-10 118 127)" />
            </g>
          </g>

          {/* ================= STRATIFICATION CALLOUT LEADER LINES ================= */}
          {/* PP Callout (Y: 42) */}
          <line x1="140" y1="42" x2="200" y2="42" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" />
          <circle cx="140" cy="42" r="2.5" fill="#ca8a04" />
          <circle cx="200" cy="42" r="2" fill="#94a3b8" />

          {/* HDPE Callout (Y: 64) */}
          <line x1="148" y1="64" x2="200" y2="64" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" />
          <circle cx="148" cy="64" r="2.5" fill="#16a34a" />
          <circle cx="200" cy="64" r="2" fill="#94a3b8" />

          {/* PS Callout (Y: 98) */}
          <line x1="144" y1="98" x2="200" y2="98" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" />
          <circle cx="144" cy="98" r="2.5" fill="#0891b2" />
          <circle cx="200" cy="98" r="2" fill="#94a3b8" />

          {/* PET Callout (Y: 134) */}
          <line x1="156" y1="134" x2="200" y2="134" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" />
          <circle cx="156" cy="134" r="2.5" fill="#1e293b" />
          <circle cx="200" cy="134" r="2" fill="#94a3b8" />

          {/* ================= CALLOUT LABELS ================= */}
          <g className="plastic-callout-text" transform="translate(206, 0)">
            {/* PP Label */}
            <text x="0" y="46" fill="var(--ink, #0f172a)" fontSize="11" fontWeight="700">
              PP <tspan fill="var(--ink-muted, #64748b)" fontWeight="500">(ρ = 0,910)</tspan>
            </text>

            {/* HDPE Label */}
            <text x="0" y="68" fill="var(--ink, #0f172a)" fontSize="11" fontWeight="700">
              HDPE <tspan fill="var(--ink-muted, #64748b)" fontWeight="500">(ρ = 0,953)</tspan>
            </text>

            {/* PS Label */}
            <text x="0" y="102" fill="var(--ink, #0f172a)" fontSize="11" fontWeight="700">
              PS <tspan fill="var(--ink-muted, #64748b)" fontWeight="500">(ρ = 1,040)</tspan>
            </text>

            {/* PET Label */}
            <text x="0" y="138" fill="var(--ink, #0f172a)" fontSize="11" fontWeight="700">
              PET <tspan fill="var(--ink-muted, #64748b)" fontWeight="500">(ρ = 1,380)</tspan>
            </text>
          </g>
        </svg>
      </div>

      <div className="plastic-footer-note">
        <span className="plastic-medium-tag">Môi trường: H₂O (20 °C, ρ = 0,998 g/cm³)</span>
      </div>
    </div>
  )
}
