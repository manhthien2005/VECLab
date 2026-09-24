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

const HERO_SIZE: ChartSize = { width: 520, height: 300, padding: { top: 16, right: 14, bottom: 30, left: 36 } }
const MINI_SIZE: ChartSize = { width: 320, height: 190, padding: { top: 10, right: 8, bottom: 4, left: 8 } }

function buildChart(size: ChartSize) {
  const plotWidth = size.width - size.padding.left - size.padding.right
  const plotHeight = size.height - size.padding.top - size.padding.bottom
  const xFor = (volumeMl: number) => size.padding.left + (volumeMl / VOLUME_MAX) * plotWidth
  const yFor = (ph: number) => size.padding.top + (1 - ph / 14) * plotHeight
  return { plotWidth, plotHeight, xFor, yFor }
}

/** The hero device frame's chart: axes, target band and tick labels. */
export function HeroPhChart() {
  const size = HERO_SIZE
  const { plotWidth, plotHeight, xFor, yFor } = buildChart(size)
  const low = BENCHMARK.targetPH - BENCHMARK.targetTolerancePH
  const high = BENCHMARK.targetPH + BENCHMARK.targetTolerancePH
  const points = CURVE_POINTS.map(([v, ph]) => `${xFor(v)},${yFor(ph)}`).join(' ')
  const goldenX = xFor(25)
  const goldenY = yFor(BENCHMARK.targetPH)

  return (
    <svg
      className="ph-series hero-chart-svg"
      viewBox={`0 0 ${size.width} ${size.height}`}
      role="img"
      aria-label={`Đường cong pH minh họa: pH* đạt ${formatPh(BENCHMARK.targetPH)} khi thêm 25 mL NaOH`}
    >
      <rect
        className="ph-series-band"
        x={size.padding.left}
        y={yFor(high)}
        width={plotWidth}
        height={Math.abs(yFor(low) - yFor(high))}
      />
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
      <polyline className="ph-series-line hero-chart-line" points={points} />
      <circle className="ph-series-dot hero-chart-dot" cx={goldenX} cy={goldenY} r={4} />
      {[0, 7, 14].map((tick) => (
        <text className="ph-series-tick" key={tick} textAnchor="end" x={size.padding.left - 8} y={yFor(tick) + 4}>
          {tick}
        </text>
      ))}
      {[0, 15, 30].map((tick) => (
        <text className="ph-series-tick" key={tick} textAnchor="middle" x={xFor(tick)} y={size.height - 8}>
          {tick}
        </text>
      ))}
    </svg>
  )
}

/** The compact curve on the acid-neutralization showcase card: shape only, no axes. */
export function MiniPhCurve() {
  const size = MINI_SIZE
  const { xFor, yFor } = buildChart(size)
  const points = CURVE_POINTS.map(([v, ph]) => `${xFor(v)},${yFor(ph)}`).join(' ')
  const goldenX = xFor(25)
  const goldenY = yFor(BENCHMARK.targetPH)

  return (
    <svg className="ph-series mini-chart-svg" viewBox={`0 0 ${size.width} ${size.height}`} aria-hidden="true">
      <polyline className="ph-series-line" points={points} />
      <circle className="ph-series-dot" cx={goldenX} cy={goldenY} r={4.5} />
    </svg>
  )
}

/**
 * Decorative stack of three reference "books" for the evidence section.
 *
 * The supplied asset (`assets/evidence-books.svg`) bakes English spine titles into the
 * raster, which would read as a translation slip on an otherwise all-Vietnamese page.
 * design.md §21 allows redrawing the motif without text for exactly this reason, so this
 * is plain CSS shapes: no localization to maintain, no text to get out of sync.
 */
export function BookStack() {
  return (
    <div className="book-stack" aria-hidden="true">
      <span className="book-spine book-spine-1" />
      <span className="book-spine book-spine-2" />
      <span className="book-spine book-spine-3" />
    </div>
  )
}
