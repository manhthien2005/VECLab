import type { ReactElement } from 'react'
import { APPARATUS_CONSTANTS, calculateBeakerLiquid } from './geometry.js'

export type ReactionBeakerProps = {
  totalVolumeMl: number
  isStirring?: boolean
  vortexIntensity?: number
  stirDurationSeconds?: number
}

/**
 * ReactionBeaker: 250 mL Pyrex-style reaction vessel.
 * Dynamic liquid fill derives deterministically from authoritative total volume.
 * Solution remains transparent / aqueous water-clear without false indicator coloration.
 */
export function ReactionBeaker({
  totalVolumeMl,
  isStirring = false,
  vortexIntensity = 0.5,
  stirDurationSeconds = 0.2,
}: ReactionBeakerProps): ReactElement {
  const { surfaceY } = calculateBeakerLiquid(totalVolumeMl)

  const leftX = APPARATUS_CONSTANTS.BEAKER_CENTER_X - APPARATUS_CONSTANTS.BEAKER_WIDTH / 2
  const rightX = APPARATUS_CONSTANTS.BEAKER_CENTER_X + APPARATUS_CONSTANTS.BEAKER_WIDTH / 2
  const topY = APPARATUS_CONSTANTS.BEAKER_TOP_Y
  const bottomY = APPARATUS_CONSTANTS.BEAKER_BOTTOM_Y
  const innerLeft = leftX + 4
  const innerRight = rightX - 4
  const innerBottom = APPARATUS_CONSTANTS.BEAKER_LIQUID_BASE_Y

  // Vortex center dip depth when actively stirring (0 to 8 px depending on intensity)
  const vortexDip = isStirring ? Math.max(2, Math.min(8, vortexIntensity * 8)) : 0

  // Liquid path with curved bottom and optional vortex dip on surface
  const liquidPath = `
    M ${innerLeft} ${surfaceY}
    Q ${APPARATUS_CONSTANTS.BEAKER_CENTER_X} ${surfaceY + vortexDip} ${innerRight} ${surfaceY}
    L ${innerRight} ${innerBottom - 8}
    Q ${innerRight} ${innerBottom} ${innerRight - 8} ${innerBottom}
    L ${innerLeft + 8} ${innerBottom}
    Q ${innerLeft} ${innerBottom} ${innerLeft} ${innerBottom - 8}
    Z
  `

  // Graduation positions (250 mL scale: 50, 100, 150, 200, 250 mL)
  const graduations = [
    { ml: 50, y: calculateBeakerLiquid(50).surfaceY },
    { ml: 100, y: calculateBeakerLiquid(100).surfaceY },
    { ml: 150, y: calculateBeakerLiquid(150).surfaceY },
    { ml: 200, y: calculateBeakerLiquid(200).surfaceY },
    { ml: 250, y: calculateBeakerLiquid(250).surfaceY },
  ]

  return (
    <g
      className={`wb-reaction-beaker ${isStirring ? 'is-stirring' : ''}`}
      aria-hidden="true"
    >
      {/* --- 1. Beaker Rear Wall & Glass Base --- */}
      <path
        d={`
          M ${leftX - 6} ${topY - 4}
          Q ${leftX - 10} ${topY - 6} ${leftX - 8} ${topY + 4}
          L ${leftX} ${topY + 8}
          L ${leftX} ${bottomY - 10}
          Q ${leftX} ${bottomY} ${leftX + 10} ${bottomY}
          L ${rightX - 10} ${bottomY}
          Q ${rightX} ${bottomY} ${rightX} ${bottomY - 10}
          L ${rightX} ${topY + 8}
          L ${rightX + 5} ${topY + 5}
        `}
        className="wb-beaker-glass-back"
      />

      {/* --- 2. Beaker Graduation Lines on Glass --- */}
      <g className="wb-beaker-graduations">
        {/* Specification & brand etchings */}
        <text
          x={leftX + 18}
          y={topY + 20}
          fontSize={8.5}
          fontWeight={600}
          fill="var(--ink-muted)"
          fontFamily="var(--font-mono)"
          letterSpacing="0.04em"
        >
          250 mL
        </text>
        <text
          x={leftX + 18}
          y={topY + 30}
          fontSize={6.5}
          fill="var(--ink-faint)"
          fontFamily="var(--font-mono)"
        >
          APPROX. VOL.
        </text>

        {graduations.map(({ ml, y }) => (
          <g key={ml}>
            {/* Major tick mark */}
            <line
              x1={leftX + 12}
              x2={leftX + 28}
              y1={y}
              y2={y}
              stroke="var(--ink-muted)"
              strokeWidth={1.4}
            />
            {/* Volume label */}
            <text
              x={leftX + 33}
              y={y + 3.5}
              fontSize={9}
              fontWeight={600}
              fontFamily="var(--font-numeric)"
              fill="var(--ink)"
            >
              {ml}
            </text>
          </g>
        ))}
      </g>

      {/* --- 3. Liquid Solution Fill (Water-Clear Aqueous Transparent) --- */}
      <path d={liquidPath} className="wb-beaker-liquid" />

      {/* Meniscus Line on Surface */}
      <path
        d={`M ${innerLeft} ${surfaceY} Q ${APPARATUS_CONSTANTS.BEAKER_CENTER_X} ${surfaceY + vortexDip} ${innerRight} ${surfaceY}`}
        className="wb-beaker-meniscus"
      />

      {/* Secondary fluid highlight reflecting light */}
      <path
        d={`M ${innerLeft + 8} ${surfaceY + 2.5} Q ${APPARATUS_CONSTANTS.BEAKER_CENTER_X} ${surfaceY + vortexDip + 2.5} ${innerRight - 8} ${surfaceY + 2.5}`}
        fill="none"
        stroke="rgba(255, 255, 255, 0.45)"
        strokeWidth={1.2}
      />

      {/* --- 4. Magnetic Stir Bar (inside liquid at beaker floor) --- */}
      <g
        className="wb-stir-bar-group"
        transform={`translate(${APPARATUS_CONSTANTS.BEAKER_CENTER_X}, ${APPARATUS_CONSTANTS.STIR_BAR_Y})`}
        style={
          {
            '--stir-duration': `${stirDurationSeconds}s`,
          } as React.CSSProperties
        }
      >
        {/* Shadow under stir bar */}
        <ellipse cx={0} cy={4} rx={18} ry={3.5} fill="rgba(0, 0, 0, 0.22)" />

        {/* Stir bar body (PTFE white laboratory magnet pill) */}
        <rect
          x={-18}
          y={-4.5}
          width={36}
          height={9}
          rx={4.5}
          className="wb-stir-bar"
        />
        {/* Center pivot ring on stir bar */}
        <rect
          x={-2.5}
          y={-5}
          width={5}
          height={10}
          rx={1.5}
          className="wb-stir-bar-ring"
        />
      </g>

      {/* --- 5. Beaker Front Glass Profile & Highlights --- */}
      <path
        d={`
          M ${leftX - 6} ${topY - 4}
          Q ${leftX - 10} ${topY - 6} ${leftX - 8} ${topY + 4}
          L ${leftX} ${topY + 8}
          L ${leftX} ${bottomY - 10}
          Q ${leftX} ${bottomY} ${leftX + 10} ${bottomY}
          L ${rightX - 10} ${bottomY}
          Q ${rightX} ${bottomY} ${rightX} ${bottomY - 10}
          L ${rightX} ${topY + 8}
          L ${rightX + 5} ${topY + 5}
        `}
        className="wb-beaker-glass-front"
      />

      {/* Vertical Glass Reflection Streak on Right */}
      <line
        x1={rightX - 10}
        x2={rightX - 10}
        y1={topY + 14}
        y2={bottomY - 16}
        className="wb-beaker-reflection"
      />
      <line
        x1={leftX + 8}
        x2={leftX + 8}
        y1={topY + 16}
        y2={bottomY - 18}
        className="wb-beaker-reflection-soft"
      />

      {/* Beaker Rim Lip Highlight */}
      <line
        x1={leftX}
        x2={rightX}
        y1={topY + 5}
        y2={topY + 5}
        stroke="rgba(255, 255, 255, 0.7)"
        strokeWidth={1.75}
      />
    </g>
  )
}
