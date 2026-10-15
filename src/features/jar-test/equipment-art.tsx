import { useId } from 'react'

export function EquipmentArt({ kind }: { kind: 'sample' | 'coagulant' | 'meter' }) {
  const id = useId().replaceAll(':', '')
  return <svg viewBox="0 0 80 90" fill="none" aria-hidden="true">
    <defs><linearGradient id={id} x1="10" y1="0" x2="70" y2="0" gradientUnits="userSpaceOnUse">
      <stop stopColor="#bccbd5" /><stop offset=".45" stopColor="#f8fbfd" /><stop offset="1" stopColor="#a9bac7" />
    </linearGradient></defs>
    {kind === 'sample' ? <>
      <path d="M16 17v56q24 12 48 0V17" fill="#f7fafc" stroke="#95acbb" strokeWidth="1.5" />
      <path d="M19 43q21 8 42 0v28q-21 10-42 0Z" fill="#d0d7d6" />
      <ellipse cx="40" cy="17" rx="26" ry="6" fill="#fff" stroke="#95acbb" strokeWidth="1.5" />
      <path d="M23 25v40" stroke="#fff" strokeWidth="3" /><path d="M48 51h8m-8 9h8" stroke="#93a5ad" />
    </> : kind === 'coagulant' ? <>
      <path d="m14 57 26-35 26 35" fill="#f3f3ef" stroke="#c6cfcc" />
      <path d="m26 49 14-27 9 28" stroke="#fff" strokeWidth="3" />
      <ellipse cx="40" cy="61" rx="29" ry="8" fill="#e0e6e9" stroke="#a8bac5" />
      <path d="M11 61q5 20 29 20t29-20" fill={'url(#' + id + ')'} stroke="#a8bac5" />
    </> : <>
      <rect x="17" y="9" width="46" height="73" rx="10" fill={'url(#' + id + ')'} stroke="#a0b2be" />
      <rect x="23" y="18" width="34" height="25" rx="4" fill="#334d5c" />
      <path d="M34 30h12" stroke="#e6f0ef" strokeWidth="2" />
      <circle cx="40" cy="61" r="9" fill="#425c6b" /><circle cx="40" cy="61" r="5" stroke="#8fa4b0" />
    </>}
  </svg>
}
