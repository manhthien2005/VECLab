import type { TitrationCurvePoint } from '@/application/scenarios/acid-titration-curve.js'
import {
  calculateNaohEquivalenceVolumeMl,
  resolveMaxBaseVolumeMl,
} from '@/application/scenarios/acid-titration-curve.js'

/**
 * Chart geometry and layout mathematics for the live titration curve (WB-R5).
 *
 * ARCHITECTURAL CONTRACT:
 * 1. Pure projection: coordinate mappings are pure mathematical functions without React state.
 * 2. Exact scientific axes:
 *    - X axis: baseVolumeMl only (cumulative NaOH). Never mixes correction acid.
 *    - Y axis: pH (locked 0 to 14 pedagogical laboratory scale).
 * 3. Dynamic boundaries:
 *    - X max derives from attempt configuration / sample volume (30 mL for benchmark, 60 mL for 50 mL).
 *    - Stoichiometric equivalence point derives mathematically from configuration.
 * 4. Zero layout drift: SVG coordinates are bounded and deterministic.
 */

export type ChartPadding = {
  readonly top: number
  readonly right: number
  readonly bottom: number
  readonly left: number
}

export type ChartDimensions = {
  readonly width: number
  readonly height: number
  readonly padding: ChartPadding
}

export type PlotArea = {
  readonly left: number
  readonly top: number
  readonly width: number
  readonly height: number
  readonly right: number
  readonly bottom: number
}

export type AxisTick = {
  readonly value: number
  readonly coordinate: number
  readonly label: string
}

/** Standard desktop plotting dimensions. */
export const DEFAULT_CHART_DIMENSIONS: ChartDimensions = {
  width: 580,
  height: 320,
  padding: {
    top: 28,
    right: 24,
    bottom: 44,
    left: 48,
  },
}

/** Standard locked pH axis domain. */
export const PH_DOMAIN = {
  min: 0,
  max: 14,
} as const

/**
 * Resolve the inner plotting rectangle inside chart padding.
 */
export function getPlotArea(dimensions: ChartDimensions = DEFAULT_CHART_DIMENSIONS): PlotArea {
  const width = Math.max(0, dimensions.width - dimensions.padding.left - dimensions.padding.right)
  const height = Math.max(0, dimensions.height - dimensions.padding.top - dimensions.padding.bottom)
  return {
    left: dimensions.padding.left,
    top: dimensions.padding.top,
    width,
    height,
    right: dimensions.padding.left + width,
    bottom: dimensions.padding.top + height,
  }
}

/**
 * Project cumulative base volume (mL) to horizontal SVG coordinate.
 * Uses baseVolumeMl only; never correction acid.
 */
export function volumeToX(
  baseVolumeMl: number,
  maxBaseVolumeMl: number,
  dimensions: ChartDimensions = DEFAULT_CHART_DIMENSIONS,
): number {
  const plot = getPlotArea(dimensions)
  if (maxBaseVolumeMl <= 0) return plot.left
  const clampedVol = Math.max(0, Math.min(baseVolumeMl, maxBaseVolumeMl))
  return plot.left + (clampedVol / maxBaseVolumeMl) * plot.width
}

/**
 * Project measured pH to vertical SVG coordinate (0 at top, 14 at bottom inverted for SVG).
 */
export function phToY(
  ph: number,
  dimensions: ChartDimensions = DEFAULT_CHART_DIMENSIONS,
  yMin = PH_DOMAIN.min,
  yMax = PH_DOMAIN.max,
): number {
  const plot = getPlotArea(dimensions)
  const range = yMax - yMin
  if (range <= 0) return plot.bottom
  const clampedPh = Math.max(yMin, Math.min(ph, yMax))
  return plot.bottom - ((clampedPh - yMin) / range) * plot.height
}

/**
 * Generate clean ticks and labels for the cumulative NaOH volume X axis.
 */
export function generateXTicks(
  maxBaseVolumeMl: number,
  dimensions: ChartDimensions = DEFAULT_CHART_DIMENSIONS,
): readonly AxisTick[] {
  const safeMax = Math.max(1, maxBaseVolumeMl)
  // Step size: 5 mL for <= 35 mL (e.g. 30 mL), 10 mL for <= 75 mL (e.g. 60 mL), 20 mL otherwise
  const step = safeMax <= 35 ? 5 : safeMax <= 75 ? 10 : 20
  const ticks: AxisTick[] = []

  for (let v = 0; v <= safeMax; v += step) {
    ticks.push({
      value: v,
      coordinate: volumeToX(v, safeMax, dimensions),
      label: String(v),
    })
  }

  // Ensure maximum boundary is present if step doesn't land on it
  const lastTick = ticks[ticks.length - 1]
  if (lastTick && lastTick.value < safeMax && safeMax - lastTick.value > step * 0.4) {
    ticks.push({
      value: safeMax,
      coordinate: volumeToX(safeMax, safeMax, dimensions),
      label: String(safeMax),
    })
  }

  return ticks
}

/**
 * Generate clean ticks and labels for the pH Y axis (0 to 14).
 */
export function generateYTicks(
  dimensions: ChartDimensions = DEFAULT_CHART_DIMENSIONS,
  yMin = PH_DOMAIN.min,
  yMax = PH_DOMAIN.max,
  step = 2,
): readonly AxisTick[] {
  const ticks: AxisTick[] = []
  for (let ph = yMin; ph <= yMax; ph += step) {
    ticks.push({
      value: ph,
      coordinate: phToY(ph, dimensions, yMin, yMax),
      label: String(ph),
    })
  }
  return ticks
}

/**
 * Generate SVG polyline coordinate string connecting authoritative measurement points.
 * Returns empty string if fewer than two points exist.
 */
export function generateTitrationCurvePointsString(
  points: readonly TitrationCurvePoint[],
  maxBaseVolumeMl: number,
  dimensions: ChartDimensions = DEFAULT_CHART_DIMENSIONS,
  yMin = PH_DOMAIN.min,
  yMax = PH_DOMAIN.max,
): string {
  if (points.length < 2) return ''
  return points
    .map((pt) => {
      const x = volumeToX(pt.baseVolumeMl, maxBaseVolumeMl, dimensions)
      const y = phToY(pt.ph, dimensions, yMin, yMax)
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')
}

/**
 * Calculate geometry for the stoichiometric equivalence reference marker.
 */
export function getEquivalenceMarkerGeometry(
  equivalenceVolumeMl: number,
  maxBaseVolumeMl: number,
  dimensions: ChartDimensions = DEFAULT_CHART_DIMENSIONS,
): {
  readonly x: number
  readonly y1: number
  readonly y2: number
  readonly labelY: number
} {
  const plot = getPlotArea(dimensions)
  const x = volumeToX(equivalenceVolumeMl, maxBaseVolumeMl, dimensions)
  return {
    x,
    y1: plot.top,
    y2: plot.bottom,
    labelY: plot.top - 8,
  }
}

export { calculateNaohEquivalenceVolumeMl, resolveMaxBaseVolumeMl }
