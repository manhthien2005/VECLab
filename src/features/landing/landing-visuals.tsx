import { ACID_INPUT_DOMAIN } from '@/content/index.js'
import { formatPh } from '@/shared/ui/format.js'

/**
 * Illustrative titration curve for the hero device frame and the acid-neutralization
 * showcase card.
 *
 * Hand-plotted points rather than a live solve: this is marketing chrome shown before a
 * learner has run anything, so there is no real attempt to plot. Only the shape is
 * illustrative — the two numbers that matter (the equivalence volume and the target pH*)
 * are the locked release's own benchmark, read from `ACID_INPUT_DOMAIN` exactly like the
 * home page's other figures, so the picture cannot drift from the numbers printed beside
 * it (docs/experiments/acid-neutralization-spec.md §2, §14.3: 25.00 mL of 0.01000 mol/L
 * HCl reaches pH* 6.995 at +25.00 mL NaOH).
 *
 * Reuses the report's `.ph-series*` classes (src/features/reports/attempt-shell.tsx) so a
 * chart looks like the same instrument whether it is showing a real run or this preview.
 * No `'use client'`: it takes no props that change and holds no state, so it renders on
 * the server like `PhMeter`.
 */

const BENCHMARK = ACID_INPUT_DOMAIN.benchmark

/** [NaOH added in mL, illustrative pH*] — monotonic, passes through the golden case. */
const CURVE_POINTS: ReadonlyArray<readonly [number, number]> = [
  [0, 2.0],
  [3, 2.12],
  [6, 2.3],
  [9, 2.58],
  [12, 3.05],
  [14.5, 3.7],
  [16.5, 4.5],
  [18, 5.2],
  [19.5, 5.85],
  [21, 6.35],
  [22.5, 6.72],
  [24, 6.93],
  [25, 6.995],
  [26, 7.06],
  [27.5, 7.45],
  [29, 8.3],
  [30, 9.4],
]

const VOLUME_MAX = 30

type ChartSize = { width: number; height: number; padding: { top: number; right: number; bottom: number; left: number } }

const HERO_SIZE: ChartSize = { width: 540, height: 285, padding: { top: 24, right: 20, bottom: 38, left: 40 } }

function buildChart(size: ChartSize) {
  const plotWidth = size.width - size.padding.left - size.padding.right
  const plotHeight = size.height - size.padding.top - size.padding.bottom
  const xFor = (volumeMl: number) => size.padding.left + (volumeMl / VOLUME_MAX) * plotWidth
  const yFor = (ph: number) => size.padding.top + (1 - ph / 14) * plotHeight
  return { plotWidth, plotHeight, xFor, yFor }
}

/** The hero device frame's chart: axes, grid, target callout and tick labels. */
export function HeroPhChart() {
  const size = HERO_SIZE
  const { plotWidth, plotHeight, xFor, yFor } = buildChart(size)
  const low = BENCHMARK.targetPH - BENCHMARK.targetTolerancePH
  const high = BENCHMARK.targetPH + BENCHMARK.targetTolerancePH
  const points = CURVE_POINTS.map(([v, ph]) => `${xFor(v)},${yFor(ph)}`).join(' ')
  const goldenX = xFor(25)
  const goldenY = yFor(BENCHMARK.targetPH)
  const midX = xFor(18)
  const midY = yFor(5.2)

  return (
    <svg
      className="ph-series hero-chart-svg"
      viewBox={`0 0 ${size.width} ${size.height}`}
      role="img"
      aria-label={`Đường cong pH minh họa: pH* đạt ${formatPh(BENCHMARK.targetPH)} khi thêm 25 mL NaOH`}
    >
      <defs>
        <linearGradient id="hero-curve-gradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--accent)" />
          <stop offset="100%" stopColor="var(--blue)" />
        </linearGradient>
      </defs>

      {/* Target tolerance band */}
      <rect
        className="ph-series-band"
        x={size.padding.left}
        y={yFor(high)}
        width={plotWidth}
        height={Math.abs(yFor(low) - yFor(high))}
      />

      {/* Horizontal grid lines */}
      {[4, 7, 10, 14].map((tick) => (
        <line
          key={tick}
          x1={size.padding.left}
          x2={size.padding.left + plotWidth}
          y1={yFor(tick)}
          y2={yFor(tick)}
          stroke="var(--border-strong)"
          strokeDasharray="3 3"
          strokeOpacity="0.55"
        />
      ))}

      {/* Equivalence target guide line at pH 7.0 */}
      <line
        x1={size.padding.left}
        x2={size.padding.left + plotWidth}
        y1={goldenY}
        y2={goldenY}
        stroke="var(--accent)"
        strokeDasharray="4 4"
        strokeOpacity="0.4"
        strokeWidth="1"
      />

      {/* Axes */}
      <line
        className="ph-series-axis"
        x1={size.padding.left}
        x2={size.padding.left + plotWidth}
        y1={size.padding.top + plotHeight}
        y2={size.padding.top + plotHeight}
      />
      <line
        className="ph-series-axis"
        x1={size.padding.left}
        x2={size.padding.left}
        y1={size.padding.top}
        y2={size.padding.top + plotHeight}
      />

      {/* Curve and points */}
      <polyline className="ph-series-line hero-chart-line" points={points} stroke="url(#hero-curve-gradient)" strokeWidth="3.5" />

      {/* Mid-process snapshot point (pH 5.2) */}
      <circle cx={midX} cy={midY} r={7} fill="var(--blue)" opacity="0.2" />
      <circle cx={midX} cy={midY} r={3.5} fill="var(--blue)" />

      {/* Equivalence target point (pH 7.0) */}
      <circle className="ph-series-dot hero-chart-dot" cx={goldenX} cy={goldenY} r={5} />

      {/* Target callout badge at golden point */}
      <g className="hero-chart-callout" transform={`translate(${goldenX - 36}, ${goldenY - 32})`}>
        <rect x="0" y="0" width="72" height="23" rx="6" className="hero-chart-callout-box" />
        <text x="36" y="15" textAnchor="middle" className="hero-chart-callout-text">
          pH = {formatPh(BENCHMARK.targetPH)}
        </text>
      </g>

      {/* Y-axis Ticks */}
      {[0, 4, 7, 10, 14].map((tick) => (
        <text className="ph-series-tick" key={tick} textAnchor="end" x={size.padding.left - 8} y={yFor(tick) + 4}>
          {tick}
        </text>
      ))}

      {/* X-axis Ticks */}
      {[0, 10, 20, 30].map((tick) => (
        <text className="ph-series-tick" key={tick} textAnchor="middle" x={xFor(tick)} y={size.height - 14}>
          {tick}
        </text>
      ))}
      <text className="ph-series-tick-label" textAnchor="middle" x={size.padding.left + plotWidth / 2} y={size.height - 2}>
        Thời gian (phút)
      </text>
    </svg>
  )
}
