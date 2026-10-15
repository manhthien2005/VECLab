import type { ReactNode } from 'react'

function Icon({ children }: { children: ReactNode }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
}

export function TargetIcon() { return <Icon><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></Icon> }
export function GuideIcon() { return <Icon><path d="m6 3 13 10-6 1-3 6Z"/><path d="m13 14 4 6"/></Icon> }
export function TheoryIcon() { return <Icon><path d="M12 5c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1Z"/><path d="M12 5v15M6 8h3m6 0h3M6 12h3m6 0h3"/></Icon> }
export function SourcesIcon() { return <Icon><path d="M14 3H5v18h14V8Z"/><path d="M14 3v5h5M8 12h8M8 16h5"/></Icon> }
export function ReportIcon() { return <Icon><path d="M14 3H5v18h14V8Z"/><path d="M14 3v5h5M8 17v-3m4 3v-6m4 6v-4"/></Icon> }
export function ToolsIcon() { return <Icon><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V4h8v3M3 12h18M10 12v3h4v-3"/></Icon> }
export function SubmitIcon() { return <Icon><path d="M7 3h10v4H7ZM7 5H4v16h16V5h-3M8 14l3 3 5-6"/></Icon> }
export function CloseIcon() { return <Icon><path d="m6 6 12 12M18 6 6 18"/></Icon> }
export function InfoIcon() { return <Icon><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/></Icon> }
export function ControlIcon({ kind }: { kind: string }) {
  if (kind === 'prepare') return <Icon><path d="M5 3h14M6 3v16c0 3 12 3 12 0V3M6 13c4-2 8 2 12 0M14 7h4m-4 3h4"/></Icon>
  if (kind === 'dose') return <Icon><path d="m14 3 7 7-3 3-7-7ZM13 8 4 17v3h3l9-9M5 21h3"/></Icon>
  if (kind === 'program') return <Icon><path d="M12 3v15M7 16l5 2 5-2v4l-5-2-5 2ZM4 10a8 8 0 0 1 3-6m13 6a8 8 0 0 0-3-6M3 7l1 3 3-1m10 0 3 1 1-3"/></Icon>
  return <Icon><rect x="5" y="3" width="14" height="18" rx="3"/><rect x="8" y="6" width="8" height="5" rx="1"/><circle cx="12" cy="16" r="2"/></Icon>
}
