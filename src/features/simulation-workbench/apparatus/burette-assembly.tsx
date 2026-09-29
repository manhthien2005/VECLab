import type { ReactElement } from 'react'
import { APPARATUS_CONSTANTS, calculateBuretteLiquid } from './geometry.js'

export type BuretteAssemblyProps = {
  addedBaseVolumeMl: number
  isDispensing?: boolean
}

/**
 * BuretteAssembly: 100 mL graduated dosing burette with stopcock valve.
 * Truthfully visualizes authorized 0-60 mL cumulative delivered NaOH without negative values.
 * Stopcock handle visibly rotates during dispensing.
 */
export function BuretteAssembly({
  addedBaseVolumeMl,
  isDispensing = false,
}: BuretteAssemblyProps): ReactElement {
  const { meniscusY, remainingMl, deliveredMl } = calculateBuretteLiquid(addedBaseVolumeMl)

  const centerX = APPARATUS_CONSTANTS.BURETTE_CENTER_X
  const tubeWidth = APPARATUS_CONSTANTS.BURETTE_TUBE_WIDTH
  const halfWidth = tubeWidth / 2
  const leftX = centerX - halfWidth
  const rightX = centerX + halfWidth
  const innerLeft = leftX + 2.5
  const innerRight = rightX - 2.5
  const topY = APPARATUS_CONSTANTS.BURETTE_TUBE_TOP_Y
  const bottomY = APPARATUS_CONSTANTS.BURETTE_TUBE_BOTTOM_Y
  const valveY = APPARATUS_CONSTANTS.BURETTE_VALVE_Y
  const tipY = APPARATUS_CONSTANTS.BURETTE_TIP_Y
  const rodX = APPARATUS_CONSTANTS.STAND_ROD_X
  const clampY = 160

  // Major graduation ticks every 10 mL (0 to 100 mL)
  const scaleTopY = APPARATUS_CONSTANTS.BURETTE_SCALE_TOP_Y
  const scaleBottomY = APPARATUS_CONSTANTS.BURETTE_SCALE_BOTTOM_Y
  const scaleHeight = scaleBottomY - scaleTopY

  const majorTicks = Array.from({ length: 11 }, (_, i) => {
    const ml = i * 10
    const y = scaleTopY + (ml / 100) * scaleHeight
    return { ml, y, label: i % 2 === 0 ? String(ml) : null }
  })

  // Minor ticks every 2 mL
  const minorTicks = Array.from({ length: 51 }, (_, i) => {
    if (i % 5 === 0) return null // Skip major ticks
    const ml = i * 2
    const y = scaleTopY + (ml / 100) * scaleHeight
    return { y }
  }).filter((t): t is { y: number } => t !== null)

  // Liquid column path inside burette from meniscus down through stopcock into the tip
  const liquidPath = `
    M ${innerLeft} ${meniscusY}
    L ${innerRight} ${meniscusY}
    L ${innerRight} ${bottomY}
    L ${centerX + 3} ${valveY + 8}
    L ${centerX + 1.5} ${tipY}
    L ${centerX - 1.5} ${tipY}
    L ${centerX - 3} ${valveY + 8}
    L ${innerLeft} ${bottomY}
    Z
  `

  return (
    <g
      className={`wb-burette-assembly ${isDispensing ? 'is-dispensing' : ''}`}
      aria-hidden="true"
    >
      {/* ================= 1. LAB STAND CLAMP (UPPER) ================= */}
      <g className="wb-burette-clamp">
        {/* Clamp boss on vertical rod */}
        <rect
          x={rodX - 6}
          y={clampY - 9}
          width={12}
          height={18}
          rx={2}
          className="wb-stand-clamp-boss"
        />
        {/* Tightening T-screw */}
        <path
          d={`M ${rodX - 16} ${clampY} L ${rodX - 6} ${clampY}`}
          stroke="var(--border-strong)"
          strokeWidth={3}
        />
        <circle cx={rodX - 18} cy={clampY} r={3.5} fill="var(--ink-faint)" />

        {/* Clamp extension arm extending to burette */}
        <rect
          x={rodX + 6}
          y={clampY - 3.5}
          width={leftX - rodX - 12}
          height={7}
          rx={1}
          className="wb-stand-clamp-arm"
        />

        {/* Two-prong clamp jaws gripping burette tube */}
        <path
          d={`
            M ${leftX - 6} ${clampY - 14}
            C ${leftX + 2} ${clampY - 16}, ${rightX + 6} ${clampY - 12}, ${rightX + 6} ${clampY - 4}
            L ${rightX + 6} ${clampY + 4}
            C ${rightX + 6} ${clampY + 12}, ${leftX + 2} ${clampY + 16}, ${leftX - 6} ${clampY + 14}
            Z
          `}
          fill="none"
          stroke="var(--ink-muted)"
          strokeWidth={3}
          strokeLinejoin="round"
        />
        {/* Rubber protective clamp sleeves */}
        <rect x={leftX - 2} y={clampY - 12} width={4} height={24} rx={1} fill="var(--danger)" opacity={0.65} />
        <rect x={rightX - 2} y={clampY - 12} width={4} height={24} rx={1} fill="var(--danger)" opacity={0.65} />
      </g>

      {/* ================= 2. BURETTE GLASS REAR & TUBE PROFILE ================= */}
      {/* Flared top filling funnel */}
      <path
        d={`
          M ${centerX - 18} 38
          L ${centerX + 18} 38
          L ${rightX} ${topY}
          L ${leftX} ${topY}
          Z
        `}
        className="wb-burette-funnel"
      />
      {/* Top rim highlight */}
      <ellipse cx={centerX} cy={38} rx={18} ry={2.5} className="wb-burette-rim" />

      {/* Main Glass Tube Background */}
      <rect
        x={leftX}
        y={topY}
        width={tubeWidth}
        height={bottomY - topY}
        className="wb-burette-glass-back"
      />

      {/* ================= 3. LIQUID COLUMN (NaOH 0,100 M AQUEOUS) ================= */}
      {remainingMl > 0 && (
        <>
          <path d={liquidPath} className="wb-burette-liquid" />

          {/* Concave Meniscus Line at current liquid level */}
          <path
            d={`M ${innerLeft} ${meniscusY} Q ${centerX} ${meniscusY + 2.5} ${innerRight} ${meniscusY}`}
            className="wb-burette-meniscus"
          />
          {/* Subtle meniscus specular reflection */}
          <ellipse
            cx={centerX}
            cy={meniscusY + 1}
            rx={halfWidth - 3}
            ry={1.2}
            fill="rgba(255, 255, 255, 0.45)"
          />
        </>
      )}

      {/* ================= 4. GRADUATION SCALE (0 to 100 mL) ================= */}
      <g className="wb-burette-scale" opacity={0.8}>
        {/* Minor ticks (every 2 mL) */}
        {minorTicks.map(({ y }, idx) => (
          <line
            key={`minor-${idx}`}
            x1={rightX - 4}
            x2={rightX - 1}
            y1={y}
            y2={y}
            stroke="var(--ink-faint)"
            strokeWidth={0.8}
          />
        ))}

        {/* Major ticks and numbers (every 10 / 20 mL) */}
        {majorTicks.map(({ ml, y, label }) => (
          <g key={`major-${ml}`}>
            <line
              x1={rightX - 9}
              x2={rightX - 1}
              y1={y}
              y2={y}
              stroke="var(--ink)"
              strokeWidth={1.2}
            />
            {label !== null && (
              <text
                x={rightX + 4}
                y={y + 3}
                fontSize={7.5}
                fontFamily="var(--font-numeric)"
                fill="var(--ink-muted)"
                textAnchor="start"
              >
                {label}
              </text>
            )}
          </g>
        ))}
      </g>

      {/* ================= 5. BURETTE FRONT GLASS & SPECULAR HIGHLIGHTS ================= */}
      {/* Front glass tube wall */}
      <rect
        x={leftX}
        y={topY}
        width={tubeWidth}
        height={bottomY - topY}
        className="wb-burette-glass-front"
      />
      {/* Left specular reflection stripe */}
      <line
        x1={leftX + 3}
        x2={leftX + 3}
        y1={topY + 4}
        y2={bottomY - 4}
        className="wb-burette-reflection"
      />

      {/* ================= 6. STOPCOCK VALVE ASSEMBLY ================= */}
      {/* Glass barrel housing around stopcock */}
      <path
        d={`
          M ${leftX + 2} ${bottomY}
          L ${rightX - 2} ${bottomY}
          L ${centerX + 8} ${valveY - 8}
          L ${centerX + 8} ${valveY + 8}
          L ${centerX + 4} ${valveY + 16}
          L ${centerX - 4} ${valveY + 16}
          L ${centerX - 8} ${valveY + 8}
          L ${centerX - 8} ${valveY - 8}
          Z
        `}
        className="wb-valve-housing"
      />

      {/* Stopcock Key / Plug Handle */}
      {/* In closed state: handle is horizontal. In dispensing state: rotates 90deg to vertical */}
      <g
        className="wb-stopcock-handle-group"
        transform={`translate(${centerX}, ${valveY}) rotate(${isDispensing ? 90 : 0})`}
      >
        {/* Valve plug pivot cylinder */}
        <circle cx={0} cy={0} r={5.5} className="wb-valve-plug-core" />
        {/* PTFE Stopcock Handle Wings */}
        <path
          d={`
            M -16 -4.5
            C -19 -4.5, -20 -2, -20 0
            C -20 2, -19 4.5, -16 4.5
            L 16 4.5
            C 19 4.5, 20 2, 20 0
            C 20 -2, 19 -4.5, 16 -4.5
            Z
          `}
          className="wb-valve-handle"
        />
        {/* Center screw / retainer ring */}
        <circle cx={0} cy={0} r={2.5} fill="var(--border-strong)" />
      </g>

      {/* Dispensing Jet Tip (tapered glass capillary) */}
      <path
        d={`
          M ${centerX - 3.5} ${valveY + 16}
          L ${centerX + 3.5} ${valveY + 16}
          L ${centerX + 1.8} ${tipY}
          L ${centerX - 1.8} ${tipY}
          Z
        `}
        className="wb-burette-tip"
      />

      {/* ================= 7. COMPACT BURETTE TELEMETRY TAG ================= */}
      <g transform={`translate(${leftX - 105}, 65)`}>
        <rect
          x={0}
          y={0}
          width={96}
          height={32}
          rx={4}
          className="wb-burette-tag-bg"
        />
        <text
          x={8}
          y={13}
          fontSize={8.5}
          fontWeight={600}
          fill="var(--ink)"
          fontFamily="var(--font-sans)"
        >
          Burette NaOH
        </text>
        <text
          x={8}
          y={24}
          fontSize={8}
          fill="var(--ink-muted)"
          fontFamily="var(--font-numeric)"
        >
          Đã thêm:{' '}
          <tspan fill="var(--accent)" fontWeight={700}>
            {`${deliveredMl} mL`}
          </tspan>
        </text>
      </g>
    </g>
  )
}
