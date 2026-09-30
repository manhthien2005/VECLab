'use client'

import { useId, useMemo, useState } from 'react'
import type { MeasurementRecordAcid } from '@/domain/experiments/acid-neutralization/state.js'
import type { AcidSetupParams } from '@/domain/experiments/acid-neutralization/setup.js'
import type { AcidScenarioConfig } from '@/domain/experiments/acid-neutralization/state.js'
import {
  projectTitrationCurve,
  type TitrationCurvePoint,
} from '@/application/scenarios/acid-titration-curve.js'
import {
  DEFAULT_CHART_DIMENSIONS,
  PH_DOMAIN,
  calculateNaohEquivalenceVolumeMl,
  generateTitrationCurvePointsString,
  generateXTicks,
  generateYTicks,
  getEquivalenceMarkerGeometry,
  getPlotArea,
  phToY,
  resolveMaxBaseVolumeMl,
  volumeToX,
} from './chart-geometry.js'
import { formatMl, formatPh } from '@/shared/ui/format.js'

export type LiveTitrationChartProps = {
  /** Authoritative measurement records from domain state. */
  readonly measurements?: readonly MeasurementRecordAcid[] | null
  /** Active attempt configuration parameters. */
  readonly activeSetup?: AcidSetupParams | null
  /** Complete scenario configuration if available. */
  readonly config?: AcidScenarioConfig | null
  /** Optional container class name. */
  readonly className?: string
  /** Optional container ID. */
  readonly id?: string
  /** Callback when user inspects a measurement point. */
  readonly onPointSelect?: (point: TitrationCurvePoint | null) => void
}

/**
 * LiveTitrationChart (WB-R5).
 *
 * SVG-first scientific titration curve plotting authoritative measured pH
 * against cumulative added NaOH volume (baseVolumeMl).
 *
 * ARCHITECTURAL CONTRACT:
 * 1. Truth first: consumes `projectTitrationCurve(domain.measurements)`.
 * 2. Zero fabrication: never synthesizes intermediate points or interpolates chemistry.
 * 3. Exact axes:
 *    - X axis: `baseVolumeMl` only (correction acid is excluded). Max volume dynamically derived.
 *    - Y axis: pH (0 to 14 pedagogical laboratory scale).
 * 4. Equivalence derivation: stoichiometric equivalence volume calculated from active configuration.
 * 5. Accessibility: accessible summary, reduced-motion compliance, restrained announcements.
 */
export function LiveTitrationChart({
  measurements,
  activeSetup = null,
  config = null,
  className = '',
  id,
  onPointSelect,
}: LiveTitrationChartProps) {
  const generatedId = useId()
  const chartId = id ?? `titration-chart-${generatedId.replace(/:/g, '')}`
  const summaryId = `${chartId}-summary`

  const [activePointIndex, setActivePointIndex] = useState<number | null>(null)

  // 1. Consume shared projection directly from authoritative domain measurements
  const projection = useMemo(() => {
    return projectTitrationCurve(measurements ?? [])
  }, [measurements])

  // 2. Resolve dynamic X-axis maximum (30 mL benchmark, 60 mL 50 mL sample, etc.)
  const maxBaseVolumeMl = useMemo(() => {
    return resolveMaxBaseVolumeMl(config ?? activeSetup)
  }, [config, activeSetup])

  // 3. Resolve stoichiometric equivalence volume derived mathematically from configuration
  const equivalenceVolumeMl = useMemo(() => {
    return calculateNaohEquivalenceVolumeMl(config ?? activeSetup ?? { acidVolumeL: 0.025 })
  }, [config, activeSetup])

  const dimensions = DEFAULT_CHART_DIMENSIONS
  const plot = useMemo(() => getPlotArea(dimensions), [dimensions])

  // 4. Generate ticks
  const xTicks = useMemo(
    () => generateXTicks(maxBaseVolumeMl, dimensions),
    [maxBaseVolumeMl, dimensions],
  )
  const yTicks = useMemo(
    () => generateYTicks(dimensions, PH_DOMAIN.min, PH_DOMAIN.max, 2),
    [dimensions],
  )

  // 5. Generate polyline string strictly between real measured points
  const pointsString = useMemo(() => {
    return generateTitrationCurvePointsString(
      projection.points,
      maxBaseVolumeMl,
      dimensions,
      PH_DOMAIN.min,
      PH_DOMAIN.max,
    )
  }, [projection.points, maxBaseVolumeMl, dimensions])

  // 6. Equivalence reference marker geometry
  const eqMarker = useMemo(() => {
    return getEquivalenceMarkerGeometry(equivalenceVolumeMl, maxBaseVolumeMl, dimensions)
  }, [equivalenceVolumeMl, maxBaseVolumeMl, dimensions])

  const activePoint = activePointIndex !== null ? projection.points[activePointIndex] ?? null : null

  const handlePointFocus = (index: number) => {
    setActivePointIndex(index)
    onPointSelect?.(projection.points[index] ?? null)
  }

  const handlePointBlur = () => {
    setActivePointIndex(null)
    onPointSelect?.(null)
  }

  const latestPoint = projection.lastPoint

  return (
    <div
      id={chartId}
      className={`live-titration-chart-container ${className}`}
      data-testid="live-titration-chart"
      role="region"
      aria-label="Đồ thị chuẩn độ pH theo thể tích NaOH"
      aria-describedby={summaryId}
      tabIndex={0}
    >
      {/* Screen-reader accessible summary */}
      <div id={summaryId} className="sr-only">
        Đồ thị chuẩn độ đo pH theo thể tích dung dịch NaOH đã thêm.
        {projection.count === 0 ? (
          ' Chưa ghi nhận số đo nào. Cần thực hiện đo pH để hiển thị đường cong chuẩn độ.'
        ) : (
          ` Đã ghi nhận ${projection.count} điểm đo. Số đo mới nhất: pH ${formatPh(latestPoint?.ph ?? null)} tại ${formatMl(latestPoint?.baseVolumeMl ?? 0)} NaOH.`
        )}
        {` Điểm tương đương lý thuyết: ${formatMl(equivalenceVolumeMl)}.`}
      </div>

      <div className="live-titration-chart-header">
        <div className="live-titration-chart-title">
          <span className="live-titration-chart-heading">Đồ thị chuẩn độ</span>
          <span className="live-titration-chart-count-badge">
            {`${projection.count} điểm đo`}
          </span>
        </div>
        <div className="live-titration-chart-legend">
          <span className="legend-item legend-data">
            <span className="legend-dot" aria-hidden="true" />
            <span>Số đo thực nghiệm</span>
          </span>
          <span className="legend-item legend-eq">
            <span className="legend-line-dashed" aria-hidden="true" />
            <span>Điểm tương đương ({formatMl(equivalenceVolumeMl)})</span>
          </span>
        </div>
      </div>

      <div className="live-titration-chart-svg-wrapper">
        <svg
          className="live-titration-chart-svg"
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          role="img"
          aria-label={`Biểu đồ pH từ 0 đến 14 theo thể tích NaOH từ 0 đến ${maxBaseVolumeMl} mL`}
        >
          <defs>
            {/* Soft grid pattern or gradients if needed */}
            <linearGradient id="eq-line-fade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--warn)" stopOpacity="0.8" />
              <stop offset="100%" stopColor="var(--warn)" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {/* Plot background */}
          <rect
            className="live-chart-plot-bg"
            x={plot.left}
            y={plot.top}
            width={plot.width}
            height={plot.height}
            aria-hidden="true"
          />

          {/* Neutral pH 7 reference guide (subtle) */}
          <line
            className="live-chart-neutral-guide"
            x1={plot.left}
            y1={phToY(7, dimensions)}
            x2={plot.right}
            y2={phToY(7, dimensions)}
            aria-hidden="true"
          />

          {/* Grid lines (decorative, hidden from screen readers) */}
          <g className="live-chart-grid" aria-hidden="true">
            {/* Horizontal pH gridlines */}
            {yTicks.map((tick) => (
              <line
                key={`y-grid-${tick.value}`}
                className="live-chart-grid-line-h"
                x1={plot.left}
                y1={tick.coordinate}
                x2={plot.right}
                y2={tick.coordinate}
              />
            ))}
            {/* Vertical volume gridlines */}
            {xTicks.map((tick) => (
              <line
                key={`x-grid-${tick.value}`}
                className="live-chart-grid-line-v"
                x1={tick.coordinate}
                y1={plot.top}
                x2={tick.coordinate}
                y2={plot.bottom}
              />
            ))}
          </g>

          {/* Stoichiometric equivalence reference line */}
          {equivalenceVolumeMl <= maxBaseVolumeMl && (
            <g
              className="live-chart-equivalence-group"
              aria-label={`Điểm tương đương lý thuyết tại ${formatMl(equivalenceVolumeMl)}`}
            >
              <line
                className="live-chart-equivalence-line"
                x1={eqMarker.x}
                y1={eqMarker.y1}
                x2={eqMarker.x}
                y2={eqMarker.y2}
              />
              {/* Equivalence tag badge */}
              <g
                className="live-chart-equivalence-badge"
                transform={`translate(${eqMarker.x}, ${eqMarker.labelY})`}
                aria-hidden="true"
              >
                <text className="live-chart-equivalence-text" textAnchor="middle">
                  Điểm tương đương: {formatMl(equivalenceVolumeMl)}
                </text>
              </g>
            </g>
          )}

          {/* Titration data curve (visual connecting segment between real measured points only) */}
          {projection.count >= 2 && (
            <polyline
              className="live-chart-curve"
              points={pointsString}
              aria-hidden="true"
            />
          )}

          {/* Measured data points */}
          <g className="live-chart-points-group">
            {projection.points.map((pt, idx) => {
              const cx = volumeToX(pt.baseVolumeMl, maxBaseVolumeMl, dimensions)
              const cy = phToY(pt.ph, dimensions)
              const isLatest = idx === projection.count - 1
              const isFocused = activePointIndex === idx

              return (
                <g
                  key={`point-${pt.sequence}-${pt.compositionRevision}`}
                  className={`live-chart-point-item ${isLatest ? 'is-latest' : 'is-history'} ${isFocused ? 'is-focused' : ''}`}
                  onMouseEnter={() => handlePointFocus(idx)}
                  onMouseLeave={handlePointBlur}
                  onClick={() => handlePointFocus(idx)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Điểm đo #${idx + 1}: NaOH ${formatMl(pt.baseVolumeMl)}, pH ${formatPh(pt.ph)}${isLatest ? ' (mới nhất)' : ''}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handlePointFocus(idx)
                    }
                  }}
                >
                  {/* Subtle hit target for easy mouse hover */}
                  <circle
                    className="live-chart-hit-target"
                    cx={cx}
                    cy={cy}
                    r={12}
                    aria-hidden="true"
                  />

                  {/* Latest point halo/ring */}
                  {isLatest && (
                    <circle
                      className="live-chart-point-halo"
                      cx={cx}
                      cy={cy}
                      r={7}
                      aria-hidden="true"
                    />
                  )}

                  {/* Solid data point marker */}
                  <circle
                    className="live-chart-point-dot"
                    cx={cx}
                    cy={cy}
                    r={isLatest ? 4.5 : 3.5}
                    aria-hidden="true"
                  />
                </g>
              )
            })}
          </g>

          {/* Axes lines */}
          <g className="live-chart-axes" aria-hidden="true">
            {/* Y axis line */}
            <line
              className="live-chart-axis-line"
              x1={plot.left}
              y1={plot.top}
              x2={plot.left}
              y2={plot.bottom}
            />
            {/* X axis line */}
            <line
              className="live-chart-axis-line"
              x1={plot.left}
              y1={plot.bottom}
              x2={plot.right}
              y2={plot.bottom}
            />
          </g>

          {/* Y axis ticks and labels */}
          <g className="live-chart-y-ticks" aria-hidden="true">
            {yTicks.map((tick) => (
              <g key={`y-tick-${tick.value}`} transform={`translate(${plot.left}, ${tick.coordinate})`}>
                <line className="live-chart-tick-mark" x1={-4} y1={0} x2={0} y2={0} />
                <text className="live-chart-tick-label" x={-8} y={3} textAnchor="end">
                  {tick.label}
                </text>
              </g>
            ))}
            {/* Y axis title */}
            <text
              className="live-chart-axis-title live-chart-axis-title-y"
              x={plot.left - 28}
              y={plot.top + plot.height / 2}
              textAnchor="middle"
              transform={`rotate(-90, ${plot.left - 28}, ${plot.top + plot.height / 2})`}
            >
              pH
            </text>
          </g>

          {/* X axis ticks and labels */}
          <g className="live-chart-x-ticks" aria-hidden="true">
            {xTicks.map((tick) => (
              <g key={`x-tick-${tick.value}`} transform={`translate(${tick.coordinate}, ${plot.bottom})`}>
                <line className="live-chart-tick-mark" x1={0} y1={0} x2={0} y2={4} />
                <text className="live-chart-tick-label" x={0} y={16} textAnchor="middle">
                  {tick.label}
                </text>
              </g>
            ))}
            {/* X axis title */}
            <text
              className="live-chart-axis-title live-chart-axis-title-x"
              x={plot.left + plot.width / 2}
              y={dimensions.height - 8}
              textAnchor="middle"
            >
              Thể tích NaOH đã thêm (mL)
            </text>
          </g>

          {/* Active tooltip popover when a point is hovered/selected */}
          {activePoint && (
            <g
              className="live-chart-tooltip"
              transform={`translate(${Math.min(
                Math.max(volumeToX(activePoint.baseVolumeMl, maxBaseVolumeMl, dimensions), plot.left + 50),
                plot.right - 50,
              )}, ${Math.max(phToY(activePoint.ph, dimensions) - 30, plot.top + 16)})`}
              aria-hidden="true"
            >
              <rect
                className="live-chart-tooltip-bg"
                x={-60}
                y={-14}
                width={120}
                height={26}
                rx={6}
              />
              <text className="live-chart-tooltip-text" x={0} y={4} textAnchor="middle">
                {formatMl(activePoint.baseVolumeMl)} • pH {formatPh(activePoint.ph)}
              </text>
            </g>
          )}

          {/* Empty state message inside plot area if no points recorded */}
          {projection.count === 0 && (
            <g className="live-chart-empty-state" aria-hidden="true">
              <text
                className="live-chart-empty-text"
                x={plot.left + plot.width / 2}
                y={plot.top + plot.height / 2 - 8}
                textAnchor="middle"
              >
                Chưa có điểm đo nào
              </text>
              <text
                className="live-chart-empty-subtext"
                x={plot.left + plot.width / 2}
                y={plot.top + plot.height / 2 + 14}
                textAnchor="middle"
              >
                Ghi nhận số đo pH để vẽ đường cong chuẩn độ
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Accessible footer note indicating active point inspection details outside SVG */}
      {activePoint && (
        <div className="live-titration-chart-inspection" aria-live="polite">
          <span className="inspection-label">Điểm được chọn:</span>
          <span className="inspection-value">
            NaOH {formatMl(activePoint.baseVolumeMl)} — pH {formatPh(activePoint.ph)}
          </span>
          {activePoint.correctionAcidVolumeMl > 0 && (
            <span className="inspection-correction">
              (HCl bù: {formatMl(activePoint.correctionAcidVolumeMl)})
            </span>
          )}
        </div>
      )}
    </div>
  )
}
