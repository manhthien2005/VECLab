import { ACID_INPUT_DOMAIN } from '@/content/index.js'
import { formatPh } from './format.js'

/**
 * The pH* scale with the release's target band marked.
 *
 * The product's signature element, and the one place on the page where saturated colour
 * is justified: it encodes a real quantity on a fixed 0–14 axis, so the hue IS data.
 *
 * Rendered as a CSS gradient with absolutely positioned marks rather than through a
 * charting library — it is one value on one fixed axis, and a dependency would be far
 * heavier than the SVG-free equivalent. Positions are computed from the value, so the
 * needle cannot drift from the number printed beside it.
 *
 * NO `'use client'` DIRECTIVE, deliberately. It takes props and renders markup; it holds
 * no state and calls no hook. That makes it importable from BOTH a Server Component (the
 * home page's hero panel) and a client one (the workbench's goal panel) — a `'use client'`
 * module's exports become client references on the server, which is what broke the
 * workbench route before (see `src/features/simulation-workbench/scenario.ts`).
 *
 * ACCESSIBILITY. The whole strip is one `img` with a label that states the band and the
 * current reading in words, because the needle's position is meaningless to a screen
 * reader and the colour gradient is meaningless to a colour-blind learner. The number is
 * always printed adjacent by the caller as well — the meter is reinforcement, never the
 * only carrier of the value.
 */

type PhMeterProps = {
  /** The modelled reading, or null when nothing has been measured yet. */
  phStar: number | null
  /** Band centre; defaults to the locked release's benchmark target. */
  targetPH?: number
  /** Half-width of the band; defaults to the locked release's tolerance. */
  tolerancePH?: number
}

/** The scale's fixed endpoints. pH is defined on 0–14 for this model's conditions. */
const SCALE_MIN = 0
const SCALE_MAX = 14

export function PhMeter({ phStar, targetPH, tolerancePH }: PhMeterProps) {
  const benchmark = ACID_INPUT_DOMAIN.benchmark
  const centre = targetPH ?? benchmark.targetPH
  const tolerance = tolerancePH ?? benchmark.targetTolerancePH

  const low = centre - tolerance
  const high = centre + tolerance

  /**
   * Clamped, so a value outside 0–14 parks the needle at the end of the scale instead of
   * escaping the track. The model marks such a state invalid rather than plotting it, but
   * the component must not render a mark at -40% if one ever arrives.
   */
  const percent = (ph: number): number =>
    (Math.min(Math.max(ph, SCALE_MIN), SCALE_MAX) / SCALE_MAX) * 100

  const label =
    `Thang pH từ 0 đến 14; dải mục tiêu ${formatPh(low)} đến ${formatPh(high)}; ` +
    `giá trị hiện tại ${phStar === null ? 'chưa đo' : formatPh(phStar)}`

  return (
    <div>
      <div className="meter" role="img" aria-label={label}>
        <span
          className="meter-target"
          style={{ left: `${percent(low)}%`, width: `${percent(high) - percent(low)}%` }}
        />
        {phStar !== null && (
          <span className="meter-marker" style={{ left: `${percent(phStar)}%` }} />
        )}
      </div>
      <div className="meter-scale" aria-hidden="true">
        <span>{SCALE_MIN}</span>
        <span>7</span>
        <span>{SCALE_MAX}</span>
      </div>
    </div>
  )
}
