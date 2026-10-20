export type SoapEquipmentKind = 'ppe' | 'lye' | 'oils' | 'mold' | 'meter'

export function SoapEquipmentArt({ kind }: { kind: SoapEquipmentKind }) {
  return <svg viewBox="0 0 56 64" aria-hidden="true" fill="none" stroke="#6d8e9f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    {kind === 'ppe' ? <>
      <path d="M10 28h36v10H10Z" fill="#dce8ee"/>
      <circle cx="20" cy="33" r="6" fill="#fff"/>
      <circle cx="36" cy="33" r="6" fill="#fff"/>
      <path d="M14 48h28v8H14Z" fill="#e4f1f2"/>
    </> : kind === 'lye' ? <>
      <path d="M16 10h24v8H16Z" fill="#829fad"/>
      <path d="M14 18h28v38q0 6-14 6t-14-6Z" fill="#e5eff6"/>
      <path d="M16 38h24v16q0 4-12 4t-12-4Z" fill="#6da8b5" stroke="none"/>
    </> : kind === 'oils' ? <>
      <path d="M18 8h20v6H18Z" fill="#c9a06a"/>
      <path d="M14 14h28v42q0 6-14 6t-14-6Z" fill="#fff"/>
      <path d="M16 34h24v20q0 4-12 4t-12-4Z" fill="#caa35d" stroke="none"/>
    </> : kind === 'mold' ? <>
      <path d="M8 22h40v28H8Z" fill="#f4e4c8"/>
      <path d="M12 28h32v16H12Z" fill="#e2c89a" stroke="none"/>
      <path d="M16 34h24" stroke="#fff" strokeWidth="3"/>
    </> : <>
      <rect x="8" y="8" width="35" height="47" rx="6" fill="#dce8ee"/>
      <rect x="13" y="14" width="25" height="14" rx="2" fill="#304e5c" stroke="none"/>
      <path d="M18 21h15" stroke="#9dd6d4"/>
      <circle cx="25" cy="40" r="5" fill="#7796a5"/>
    </>}
  </svg>
}
