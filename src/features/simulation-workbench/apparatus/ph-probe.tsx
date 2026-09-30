import type { ReactElement } from 'react'
import { APPARATUS_CONSTANTS } from './geometry.js'

export type PhProbeProps = {
  isSubmerged: boolean
  isCalibrating?: boolean
  isMeasuring?: boolean
}

/**
 * PhProbe: Laboratory combination pH glass electrode.
 * Scaled to immerse the sensing glass bulb fully in the reaction beaker solution
 * across the entire authorized 25-150 mL volume envelope.
 * Does not own pH calculations or simulate electrode drift.
 */
export function PhProbe({
  isSubmerged,
  isCalibrating = false,
  isMeasuring = false,
}: PhProbeProps): ReactElement {
  const mountX = APPARATUS_CONSTANTS.PROBE_MOUNT_X
  const tipY = APPARATUS_CONSTANTS.PROBE_TIP_Y
  const rodX = APPARATUS_CONSTANTS.STAND_ROD_X
  const clampY = 295

  return (
    <g
      className={`wb-ph-probe ${isCalibrating ? 'is-calibrating' : ''} ${isMeasuring ? 'is-measuring' : ''} ${isSubmerged ? 'is-submerged' : ''}`}
      aria-hidden="true"
    >
      {/* Lower Lab Stand Clamp holding Probe */}
      <g className="wb-probe-clamp">
        {/* Clamp boss on vertical rod */}
        <rect
          x={rodX - 6}
          y={clampY - 8}
          width={12}
          height={16}
          rx={2}
          className="wb-stand-clamp-boss"
        />
        {/* Clamp tightening screw */}
        <path
          d={`M ${rodX - 14} ${clampY} L ${rodX - 6} ${clampY}`}
          stroke="var(--border-strong)"
          strokeWidth={3}
        />
        <circle cx={rodX - 16} cy={clampY} r={3.5} fill="var(--ink-faint)" />

        {/* Clamp extension arm extending to probe shaft */}
        <rect
          x={rodX + 6}
          y={clampY - 3}
          width={mountX - rodX - 14}
          height={6}
          rx={1}
          className="wb-stand-clamp-arm"
        />

        {/* Clamp finger gripping probe */}
        <path
          d={`M ${mountX - 8} ${clampY - 8} C ${mountX - 2} ${clampY - 12}, ${mountX + 8} ${clampY - 8}, ${mountX + 8} ${clampY + 8} C ${mountX + 8} ${clampY + 12}, ${mountX - 2} ${clampY + 12}, ${mountX - 8} ${clampY + 8} Z`}
          fill="none"
          stroke="var(--ink-muted)"
          strokeWidth={2.5}
        />
      </g>

      {/* Flexible Coaxial Cable from probe cap */}
      <path
        d={`M ${mountX} 260 C ${mountX + 15} 220, ${mountX + 60} 200, 580 190`}
        fill="none"
        stroke="var(--ink)"
        strokeWidth={3.5}
        strokeLinecap="round"
        className="wb-probe-cable"
      />

      {/* Probe Top Cap / Connector */}
      <rect
        x={mountX - 7}
        y={260}
        width={14}
        height={18}
        rx={2}
        className="wb-probe-cap"
      />
      {/* Strain relief rings */}
      <line
        x1={mountX - 5.5}
        x2={mountX + 5.5}
        y1={265}
        y2={265}
        stroke="var(--border-strong)"
        strokeWidth={1.5}
      />
      <line
        x1={mountX - 5.5}
        x2={mountX + 5.5}
        y1={270}
        y2={270}
        stroke="var(--border-strong)"
        strokeWidth={1.5}
      />

      {/* Status LED collar (illuminates/pulses during calibration or measurement) */}
      <rect
        x={mountX - 7.5}
        y={278}
        width={15}
        height={5}
        rx={1.5}
        className="wb-probe-status-collar"
      />

      {/* Electrode Main Glass/Polymer Body Shaft */}
      <rect
        x={mountX - 6}
        y={283}
        width={12}
        height={tipY - 290}
        rx={1}
        className="wb-probe-shaft"
      />

      {/* Internal Reference Electrolyte Solution Fill */}
      <rect
        x={mountX - 4}
        y={286}
        width={8}
        height={tipY - 295}
        className="wb-probe-electrolyte"
      />

      {/* Internal Ag/AgCl Reference Electrode Wire */}
      <line
        x1={mountX}
        x2={mountX}
        y1={283}
        y2={tipY - 14}
        className="wb-probe-internal-wire"
      />

      {/* Ceramic Reference Junction Diaphragm (side pin) */}
      <circle
        cx={mountX + 6}
        cy={tipY - 12}
        r={1.4}
        className="wb-probe-junction"
      />

      {/* Glass Sensing Bulb at Bottom Tip */}
      <circle
        cx={mountX}
        cy={tipY - 2}
        r={6}
        className="wb-probe-bulb"
      />
      {/* Subtle glass reflection highlight on sensing bulb */}
      <path
        d={`M ${mountX - 3.5} ${tipY - 5} A 4 4 0 0 1 ${mountX + 1.5} ${tipY - 6.5}`}
        fill="none"
        stroke="rgba(255, 255, 255, 0.75)"
        strokeWidth={1.2}
        strokeLinecap="round"
      />
    </g>
  )
}
