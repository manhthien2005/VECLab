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
/** Lắng: hạt rơi xuống lớp trầm tích ở đáy. */
export function SettleIcon() { return <Icon><path d="M4 18.5h16" /><path d="M12 3.5v8.5" /><path d="M8.5 9.5 12 13l3.5-3.5" /><circle cx="6.5" cy="15.2" r="1" /><circle cx="12" cy="16.2" r="1" /><circle cx="17.5" cy="15.2" r="1" /></Icon> }
/** Lọc: phễu lọc tách pha rắn khỏi pha lỏng. */
export function FilterIcon() { return <Icon><path d="M3.5 4.5h17l-6.7 7.9v6.4l-3.6 1.7v-8.1L3.5 4.5Z" /></Icon> }
/** Khóa Bàn 2: chuyển sang cân bằng pH trước khi thải. */
export function LockIcon() { return <Icon><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></Icon> }
export function MixerIcon() { return <Icon><path d="M3 6h18M6 6v12M10 6v12M14 6v12M18 6v12" /><circle cx="6" cy="18" r="1" fill="currentColor" stroke="none" /><circle cx="14" cy="18" r="1" fill="currentColor" stroke="none" /></Icon> }
export function FeIcon() { return <Icon><circle cx="12" cy="12" r="5" /><path d="M12 7v2M12 15v2M7 12h2M15 12h2" /></Icon> }
export function ZnIcon() { return <Icon><path d="M4 12 L12 4 L20 12 L12 20 Z" /><path d="M12 8v8M8 12h8" /></Icon> }
export function PbIcon() { return <Icon><circle cx="12" cy="12" r="5" /><path d="M9 9 L15 15M15 9 L9 15" /></Icon> }
export function PhIcon() { return <Icon><path d="M12 3v18M8 7H5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2h-3" /><path d="M8 14h8M8 11h5M8 17h6" /></Icon> }
export function DisposeIcon() { return <Icon><path d="M12 3v12M8 9l4-6 4 6" /><path d="M5 15h14" /><path d="M7 15v4a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-4" /></Icon> }
export function CheckCircleIcon() { return <Icon><circle cx="12" cy="12" r="9" /><path d="M9 12l2 2 4-4" /></Icon> }
