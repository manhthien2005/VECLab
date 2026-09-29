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
  const { surfaceY, volumeMl } = calculateBeakerLiquid(totalVolumeMl)

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
    L ${innerRight} ${innerBottom - 6}
    Q ${innerRight} ${innerBottom} ${innerRight - 6} ${innerBottom}
    L ${innerLeft + 6} ${innerBottom}
    Q ${innerLeft} ${innerBottom} ${innerLeft} ${innerBottom - 6}
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
          M ${leftX - 4} ${topY - 3}
          Q ${leftX - 8} ${topY - 5} ${leftX - 6} ${topY + 3}
          L ${leftX} ${topY + 6}
          L ${leftX} ${bottomY - 8}
          Q ${leftX} ${bottomY} ${leftX + 8} ${bottomY}
          L ${rightX - 8} ${bottomY}
          Q ${rightX} ${bottomY} ${rightX} ${bottomY - 8}
          L ${rightX} ${topY + 6}
          L ${rightX + 4} ${topY + 4}
        `}
        className="wb-beaker-glass-back"
      />

      {/* --- 2. Beaker Graduation Lines on Glass --- */}
      <g className="wb-beaker-graduations" opacity={0.65}>
        <text
          x={leftX + 16}
          y={topY + 16}
          fontSize={7.5}
          fill="var(--ink-faint)"
          fontFamily="var(--font-mono)"
          letterSpacing="0.04em"
        >
          250 mL
        </text>

        {graduations.map(({ ml, y }) => (
          <g key={ml}>
            {/* Major tick mark */}
            <line
              x1={leftX + 10}
              x2={leftX + 22}
              y1={y}
              y2={y}
              stroke="var(--ink-faint)"
              strokeWidth={1.2}
            />
            {/* Volume label */}
            <text
              x={leftX + 26}
              y={y + 3}
              fontSize={8}
              fontFamily="var(--font-numeric)"
              fill="var(--ink-faint)"
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
        d={`M ${innerLeft + 6} ${surfaceY + 2} Q ${APPARATUS_CONSTANTS.BEAKER_CENTER_X} ${surfaceY + vortexDip + 2} ${innerRight - 6} ${surfaceY + 2}`}
        fill="none"
        stroke="rgba(255, 255, 255, 0.4)"
        strokeWidth={1}
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
        <ellipse cx={0} cy={3} rx={14} ry={2.5} fill="rgba(0, 0, 0, 0.18)" />

        {/* Stir bar body (PTFE white laboratory magnet pill) */}
        <rect
          x={-14}
          y={-3.5}
          width={28}
          height={7}
          rx={3.5}
          className="wb-stir-bar"
        />
        {/* Center pivot ring on stir bar */}
        <rect
          x={-2}
          y={-4}
          width={4}
          height={8}
          rx={1}
          className="wb-stir-bar-ring"
        />
      </g>

      {/* --- 5. Beaker Front Glass Profile & Highlights --- */}
      <path
        d={`
          M ${leftX - 4} ${topY - 3}
          Q ${leftX - 8} ${topY - 5} ${leftX - 6} ${topY + 3}
          L ${leftX} ${topY + 6}
          L ${leftX} ${bottomY - 8}
          Q ${leftX} ${bottomY} ${leftX + 8} ${bottomY}
          L ${rightX - 8} ${bottomY}
          Q ${rightX} ${bottomY} ${rightX} ${bottomY - 8}
          L ${rightX} ${topY + 6}
          L ${rightX + 4} ${topY + 4}
        `}
        className="wb-beaker-glass-front"
      />

      {/* Vertical Glass Reflection Streak on Right */}
      <line
        x1={rightX - 8}
        x2={rightX - 8}
        y1={topY + 12}
        y2={bottomY - 14}
        className="wb-beaker-reflection"
      />
      <line
        x1={leftX + 6}
        x2={leftX + 6}
        y1={topY + 14}
        y2={bottomY - 16}
        className="wb-beaker-reflection-soft"
      />

      {/* Beaker Rim Lip Highlight */}
      <line
        x1={leftX}
        x2={rightX}
        y1={topY + 4}
        y2={topY + 4}
        stroke="rgba(255, 255, 255, 0.6)"
        strokeWidth={1.5}
      />

      {/* Volume readout tag */}
      <g
        className="wb-beaker-vol-tag"
        transform={`translate(${rightX + 8}, ${Math.min(bottomY - 15, Math.max(topY + 15, surfaceY))})`}
      >
        <rect
          x={0}
          y={-10}
          width={44}
          height={18}
          rx={3}
          className="wb-vol-tag-bg"
        />
        <text
          x={22}
          y={2.5}
          textAnchor="middle"
          fontSize={8.5}
          fontFamily="var(--font-numeric)"
          fontWeight={600}
          className="wb-vol-tag-text"
        >
          {`${volumeMl} mL`}
        </text>
      </g>
    </g>
  )
}
