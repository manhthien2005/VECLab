import type { SVGProps } from 'react'

function Icon(props: SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props} />
}

export function PlayIcon() { return <Icon><polygon points="6 4 20 12 6 20" fill="currentColor" stroke="none" /></Icon> }
export function StopIcon() { return <Icon><rect x="6" y="6" width="12" height="12" rx="1.5" fill="currentColor" stroke="none" /></Icon> }
export function PlusIcon() { return <Icon><path d="M12 5v14M5 12h14" /></Icon> }
export function ResetIcon() { return <Icon><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></Icon> }
export function DropIcon() { return <Icon><path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11Z" /></Icon> }
export function BeakerIcon() { return <Icon><path d="M9 3v6L4 19a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3l-5-10V3" /><path d="M8 3h8M7 14h10" /></Icon> }
