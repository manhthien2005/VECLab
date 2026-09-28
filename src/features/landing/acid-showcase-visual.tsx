import { ACID_INPUT_DOMAIN } from '@/content/index.js'
import { formatPh } from '@/shared/ui/format.js'

/**
 * Coded titration curve visual for the acid-neutralization showcase card.
 *
 * Implements the approved reference design:
 * - Stage header: "Đường cong pH"
 * - Coded SVG axes (Y: 0, 7, 14; X: 0, 10, 20, 30 mL)
 * - Axis title: "Thể tích NaOH (mL)"
 * - Equivalence point marker at pH* 6.995 / 25.00 mL
 * - Pure SVG/HTML, fully responsive and accessible.
 *
 * Source-backed by docs/experiments/acid-neutralization-spec.md §2 & §14.3.
 */

const BENCHMARK = ACID_INPUT_DOMAIN.benchmark

const TITRATION_CURVE_POINTS: ReadonlyArray<readonly [number, number]> = [
  [0, 2.0],
  [4, 2.18],
  [8, 2.45],
  [12, 2.9],
  [16, 3.65],
  [19, 4.6],
  [21.5, 5.5],
  [23.5, 6.3],
  [24.5, 6.8],
  [25.0, 6.995],
  [25.5, 7.2],
  [26.5, 7.7],
  [28.5, 8.6],
  [30.0, 9.4],
]

const VOLUME_MAX = 30
const PH_MAX = 14

export function AcidShowcaseVisual() {
  const width = 340
  const height = 158
  const pad = { top: 18, right: 18, bottom: 32, left: 34 }
  const plotWidth = width - pad.left - pad.right
  const plotHeight = height - pad.top - pad.bottom

  const xFor = (volumeMl: number) => pad.left + (volumeMl / VOLUME_MAX) * plotWidth
  const yFor = (ph: number) => pad.top + (1 - ph / PH_MAX) * plotHeight

  const points = TITRATION_CURVE_POINTS.map(([v, ph]) => `${xFor(v).toFixed(1)},${yFor(ph).toFixed(1)}`).join(' ')
  const targetX = xFor(25)
  const targetY = yFor(BENCHMARK.targetPH)

  return (
    <div className="acid-stage-container" aria-label="Đồ thị đường cong chuẩn độ pH theo thể tích NaOH">
      <div className="acid-stage-header">
        <span className="acid-stage-title">Đường cong pH</span>
        <span className="acid-target-tag">pH* = {formatPh(BENCHMARK.targetPH)}</span>
      </div>

      <div className="acid-visual-canvas">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="acid-showcase-svg"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="acid-curve-stroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0ea5e9" />
              <stop offset="65%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>
            <linearGradient id="acid-curve-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Gridlines */}
          {[0, 7, 14].map((tick) => (
            <line
              key={tick}
              x1={pad.left}
              x2={pad.left + plotWidth}
              y1={yFor(tick)}
              y2={yFor(tick)}
              stroke="var(--border, #e2e8f0)"
              strokeDasharray={tick === 7 ? '3 3' : undefined}
              strokeWidth={tick === 7 ? '1.2' : '1'}
              opacity={tick === 7 ? '0.9' : '0.6'}
            />
          ))}

          {/* Area under curve */}
          <polygon
            points={`${xFor(0)},${yFor(0)} ${points} ${xFor(30)},${yFor(0)}`}
            fill="url(#acid-curve-fill)"
          />

          {/* Axes */}
          <line
            x1={pad.left}
            x2={pad.left + plotWidth}
            y1={pad.top + plotHeight}
            y2={pad.top + plotHeight}
            stroke="#94a3b8"
            strokeWidth="1.2"
          />
          <line
            x1={pad.left}
            x2={pad.left}
            y1={pad.top}
            y2={pad.top + plotHeight}
            stroke="#94a3b8"
            strokeWidth="1.2"
          />

          {/* Titration Curve Polyline */}
          <polyline
            points={points}
            stroke="url(#acid-curve-stroke)"
            strokeWidth="2.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Equivalence target point */}
          <circle cx={targetX} cy={targetY} r={7} fill="#0284c7" opacity="0.2" />
          <circle cx={targetX} cy={targetY} r={4.5} fill="#0284c7" stroke="#ffffff" strokeWidth="1.5" />

          {/* Y-axis Ticks (0, 7, 14) */}
          {[0, 7, 14].map((tick) => (
            <text
              key={tick}
              x={pad.left - 6}
              y={yFor(tick) + 3.5}
              textAnchor="end"
              fill="var(--ink-muted, #64748b)"
              fontSize="10"
              fontFamily="var(--font-numeric, inherit)"
            >
              {tick}
            </text>
          ))}

          {/* X-axis Ticks (0, 10, 20, 30) */}
          {[0, 10, 20, 30].map((tick) => (
            <text
              key={tick}
              x={xFor(tick)}
              y={height - 15}
              textAnchor="middle"
              fill="var(--ink-muted, #64748b)"
              fontSize="10"
              fontFamily="var(--font-numeric, inherit)"
            >
              {tick}
            </text>
          ))}

          {/* X-axis Title */}
          <text
            x={pad.left + plotWidth / 2}
            y={height - 3}
            textAnchor="middle"
            fill="var(--ink-muted, #64748b)"
            fontSize="9.5"
            fontWeight="500"
          >
            Thể tích NaOH (mL)
          </text>
        </svg>
      </div>
    </div>
  )
}
