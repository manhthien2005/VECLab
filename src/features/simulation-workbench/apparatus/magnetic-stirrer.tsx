import type { ReactElement } from 'react'
import { APPARATUS_CONSTANTS } from './geometry.js'

export type MagneticStirrerProps = {
  stirrerRpm?: number
  isStirring?: boolean
}

/**
 * MagneticStirrer: Laboratory magnetic stir plate and heavy support stand.
 * Provides plausible physical footing for the reaction beaker.
 * Stirrer RPM is operational visual telemetry only and does not alter chemistry.
 */
export function MagneticStirrer({
  stirrerRpm = 300,
  isStirring = false,
}: MagneticStirrerProps): ReactElement {
  const plateLeft = APPARATUS_CONSTANTS.BEAKER_CENTER_X - APPARATUS_CONSTANTS.STIRRER_WIDTH / 2
  const plateRight = APPARATUS_CONSTANTS.BEAKER_CENTER_X + APPARATUS_CONSTANTS.STIRRER_WIDTH / 2
  const plateTop = APPARATUS_CONSTANTS.STIRRER_PLATE_TOP_Y
  const bodyBottom = APPARATUS_CONSTANTS.STIRRER_BODY_BOTTOM_Y

  const baseLeft = APPARATUS_CONSTANTS.STAND_BASE_X
  const baseWidth = APPARATUS_CONSTANTS.STAND_BASE_WIDTH
  const baseTop = APPARATUS_CONSTANTS.STAND_BASE_Y
  const rodX = APPARATUS_CONSTANTS.STAND_ROD_X
  const rodTop = APPARATUS_CONSTANTS.STAND_ROD_TOP_Y

  return (
    <g className="wb-magnetic-stirrer-and-stand" aria-hidden="true">
      {/* ================= 1. LABORATORY RETORT STAND ================= */}
      {/* Heavy Cast-Iron Stand Base Plate */}
      <g className="wb-stand-base">
        {/* Base shadow */}
        <rect
          x={baseLeft - 2}
          y={baseTop + 14}
          width={baseWidth + 4}
          height={6}
          rx={3}
          fill="rgba(0, 0, 0, 0.22)"
        />
        {/* Main cast iron plate */}
        <rect
          x={baseLeft}
          y={baseTop}
          width={baseWidth}
          height={16}
          rx={3}
          className="wb-stand-plate"
        />
        {/* Top chamfer / highlight on base */}
        <line
          x1={baseLeft + 2}
          x2={baseLeft + baseWidth - 2}
          y1={baseTop + 1}
          y2={baseTop + 1}
          stroke="rgba(255, 255, 255, 0.35)"
          strokeWidth={1}
        />
        {/* Rubber leveling feet */}
        <rect x={baseLeft + 12} y={baseTop + 15} width={14} height={3} rx={1} fill="var(--ink)" />
        <rect x={baseLeft + baseWidth - 26} y={baseTop + 15} width={14} height={3} rx={1} fill="var(--ink)" />
      </g>

      {/* Vertical Solid Stainless Steel Rod */}
      <g className="wb-stand-rod">
        {/* Mounting socket collar on base */}
        <rect
          x={rodX - 7}
          y={baseTop - 6}
          width={14}
          height={7}
          rx={1.5}
          className="wb-stand-rod-socket"
        />
        {/* Upright cylindrical rod */}
        <rect
          x={rodX - 4}
          y={rodTop}
          width={8}
          height={baseTop - rodTop}
          rx={2}
          className="wb-stand-rod-steel"
        />
        {/* Steel specular highlight along length */}
        <line
          x1={rodX - 1.5}
          x2={rodX - 1.5}
          y1={rodTop + 2}
          y2={baseTop - 2}
          stroke="rgba(255, 255, 255, 0.55)"
          strokeWidth={1.2}
        />
        {/* Top rod dome cap */}
        <ellipse cx={rodX} cy={rodTop + 1} rx={4} ry={2} fill="var(--border-strong)" />
      </g>

      {/* ================= 2. MAGNETIC STIRRER INSTRUMENT ================= */}
      <g className="wb-stirrer-chassis">
        {/* Stirrer chassis drop shadow */}
        <rect
          x={plateLeft + 4}
          y={bodyBottom - 2}
          width={APPARATUS_CONSTANTS.STIRRER_WIDTH - 8}
          height={8}
          rx={4}
          fill="rgba(0, 0, 0, 0.25)"
        />

        {/* Stirrer Main Housing Body */}
        <path
          d={`
            M ${plateLeft + 4} ${plateTop + 8}
            L ${plateLeft} ${bodyBottom - 4}
            Q ${plateLeft} ${bodyBottom} ${plateLeft + 4} ${bodyBottom}
            L ${plateRight - 4} ${bodyBottom}
            Q ${plateRight} ${bodyBottom} ${plateRight} ${bodyBottom - 4}
            L ${plateRight - 4} ${plateTop + 8}
            Z
          `}
          className="wb-stirrer-body"
        />

        {/* White Ceramic / Chemically-Resistant Top Plate */}
        <rect
          x={plateLeft}
          y={plateTop}
          width={APPARATUS_CONSTANTS.STIRRER_WIDTH}
          height={8}
          rx={2}
          className="wb-stirrer-top-plate"
        />
        {/* Beaker positioning ring on top plate */}
        <circle
          cx={APPARATUS_CONSTANTS.BEAKER_CENTER_X}
          cy={plateTop + 4}
          r={APPARATUS_CONSTANTS.BEAKER_WIDTH / 2 - 4}
          fill="none"
          stroke="var(--border)"
          strokeWidth={1}
          strokeDasharray="4 3"
          opacity={0.6}
        />

        {/* Front Control Panel Recess */}
        <rect
          x={plateLeft + 12}
          y={plateTop + 14}
          width={APPARATUS_CONSTANTS.STIRRER_WIDTH - 24}
          height={26}
          rx={3}
          className="wb-stirrer-front-panel"
        />

        {/* Status / Stirring Pilot LED */}
        <circle
          cx={plateLeft + 24}
          cy={plateTop + 27}
          r={3.5}
          className={`wb-stirrer-led ${isStirring ? 'is-active' : ''}`}
        />

        {/* Digital RPM Readout */}
        <g transform={`translate(${plateLeft + 36}, ${plateTop + 18})`}>
          <rect
            x={0}
            y={0}
            width={76}
            height={18}
            rx={2}
            className="wb-stirrer-lcd"
          />
          <text
            x={38}
            y={13}
            textAnchor="middle"
            fontSize={10.5}
            fontFamily="var(--font-mono)"
            fontWeight={700}
            className="wb-stirrer-lcd-text"
          >
            {isStirring ? `${stirrerRpm} RPM` : 'STIR OFF'}
          </text>
        </g>

        {/* Rotary Speed Knob */}
        <g transform={`translate(${plateRight - 36}, ${plateTop + 27})`}>
          <circle cx={0} cy={0} r={9} className="wb-stirrer-knob-base" />
          <circle cx={0} cy={0} r={7} className="wb-stirrer-knob" />
          {/* Knob pointer indicator */}
          <line
            x1={0}
            y1={-1}
            x2={isStirring ? 3.5 : -3.5}
            y2={isStirring ? -5.5 : 5.5}
            stroke="var(--accent-contrast)"
            strokeWidth={1.75}
            strokeLinecap="round"
          />
        </g>
      </g>
    </g>
  )
}
