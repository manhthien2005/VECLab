import type { ReactElement } from 'react'

export type DropletStreamProps = {
  isDispensing: boolean
  originX?: number
  originY?: number
  targetY: number
  /** Key that increments or changes when an addition commits, triggering animation */
  triggerToken?: number | string | null
}

/**
 * DropletStream: Visual feedback for titrant dispensing.
 * Pure SVG representation with CSS keyframe animation for the falling droplet.
 * Animation completion never mutates or triggers chemistry state.
 */
export function DropletStream({
  isDispensing,
  originX = 380,
  originY = 366,
  targetY,
  triggerToken,
}: DropletStreamProps): ReactElement {
  const fallDistance = Math.max(10, targetY - originY)

  return (
    <g
      className={`wb-droplet-stream ${isDispensing ? 'is-dispensing' : ''}`}
      aria-hidden="true"
    >
      {/* Jet orifice meniscus */}
      <ellipse
        cx={originX}
        cy={originY}
        rx={1.8}
        ry={1}
        className="wb-droplet-tip-meniscus"
      />

      {/* Hanging / forming droplet at tip */}
      <circle
        cx={originX}
        cy={originY + 2.5}
        r={2.2}
        className="wb-droplet-hanging"
      />

      {/* Falling droplet (animates down towards target beaker surface) */}
      <g
        key={String(triggerToken ?? (isDispensing ? 'dispense' : 'idle'))}
        className="wb-droplet-falling-wrapper"
        style={
          {
            '--droplet-fall-distance': `${fallDistance}px`,
          } as React.CSSProperties
        }
      >
        <path
          d={`M ${originX} ${originY + 4} C ${originX - 2} ${originY + 8}, ${originX - 2.5} ${originY + 11}, ${originX} ${originY + 13} C ${originX + 2.5} ${originY + 11}, ${originX + 2} ${originY + 8}, ${originX} ${originY + 4} Z`}
          className="wb-droplet-falling"
        />
      </g>
    </g>
  )
}
