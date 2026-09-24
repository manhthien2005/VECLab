/**
 * Small inline icons for the landing page.
 *
 * Inline SVG rather than an icon package, matching `src/app/theme-toggle.tsx`: a handful
 * of glyphs do not justify a dependency that ships hundreds, and `currentColor` makes
 * every one of them follow its caller's own colour (ink, accent, warn) with no prop.
 * Same authoring convention throughout: `viewBox 0 0 24 24`, `stroke="currentColor"`,
 * `strokeWidth="1.8"`, decorative so always `aria-hidden`.
 */

type IconProps = { className?: string }

/** Shape shared by every icon below, for callers that pick one from a list by index. */
export type IconComponent = (props: IconProps) => React.JSX.Element

export function ArrowRightIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6 6 6-6 6" />
    </svg>
  )
}

export function PlayIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 8.5v7l6-3.5-6-3.5Z" />
    </svg>
  )
}

export function CheckCircleIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m8 12.5 2.5 2.5L16 9.5" />
    </svg>
  )
}

export function GuestIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="8.5" r="3.25" />
      <path strokeLinecap="round" d="M5.5 19c1.2-3.2 3.8-4.8 6.5-4.8s5.3 1.6 6.5 4.8" />
    </svg>
  )
}

export function RepeatIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 12a8 8 0 0 1 13.6-5.7M20 12a8 8 0 0 1-13.6 5.7" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 3v3.5h-3.5M7 21v-3.5h3.5" />
    </svg>
  )
}

export function BookIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 5.5C4 4.7 4.7 4 5.5 4H12v16H5.5A1.5 1.5 0 0 1 4 18.5v-13Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 5.5c0-.8-.7-1.5-1.5-1.5H12v16h6.5a1.5 1.5 0 0 0 1.5-1.5v-13Z" />
    </svg>
  )
}

export function WarningIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.5 21.5 20h-19L12 3.5Z" />
      <path strokeLinecap="round" d="M12 10v4" />
      <circle cx="12" cy="16.8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function FlaskIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 3h4M9.5 3v6L4.8 18.2A1.6 1.6 0 0 0 6.2 20.5h11.6a1.6 1.6 0 0 0 1.4-2.3L14.5 9V3" />
      <path strokeLinecap="round" d="M7.5 15h9" />
    </svg>
  )
}

export function MoleculeIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" d="M7 8.5 12 12l6-2.5M12 12v6" />
      <circle cx="7" cy="8.5" r="2" />
      <circle cx="18" cy="9.5" r="2" />
      <circle cx="12" cy="18" r="2" />
    </svg>
  )
}

export function LayersIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m12 3 8 4.5-8 4.5-8-4.5L12 3Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m4 12 8 4.5 8-4.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m4 16.5 8 4.5 8-4.5" />
    </svg>
  )
}

export function CalculatorIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="5" y="3.5" width="14" height="17" rx="2" />
      <path strokeLinecap="round" d="M8 7.5h8M8 11.5h1m3.5 0h1m3.5 0h1M8 15h1m3.5 0h1m3.5 0h1M8 18.5h1m3.5 0h1m3.5 0h1" />
    </svg>
  )
}

export function SigmaIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 5H7l5.5 7L7 19h11" />
    </svg>
  )
}
