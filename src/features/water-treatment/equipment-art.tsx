'use client'

import { useId } from 'react'

/**
 * Hình SVG đơn giản cho 4 mục dụng cụ/mẫu của Xử lý nước Fe/Zn/Pb. Không
 * tái hiện chi tiết thiết bị thật, chỉ dùng để gợi nhớ: mẫu, NaOH, HCl,
 * máy đo pH. Pattern giống `equipment-art.tsx` của Jar Test.
 */
export function EquipmentArt({ kind }: { kind: 'sample' | 'naoh' | 'hcl' | 'meter' }) {
  const id = useId().replaceAll(':', '')
  return (
    <svg viewBox="0 0 80 90" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="10" y1="0" x2="70" y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor="#bccbd5" />
          <stop offset=".45" stopColor="#f8fbfd" />
          <stop offset="1" stopColor="#a9bac7" />
        </linearGradient>
      </defs>
      {kind === 'sample' ? (
        <>
          <path d="M16 17v56q24 12 48 0V17" fill="#f7fafc" stroke="#95acbb" strokeWidth="1.5" />
          <path d="M19 43q21 8 42 0v28q-21 10-42 0Z" fill="#c9d6c4" />
          <ellipse cx="40" cy="17" rx="26" ry="6" fill="#fff" stroke="#95acbb" strokeWidth="1.5" />
          <text x="40" y="55" textAnchor="middle" fontSize="9" fill="#3b5560" fontWeight="700">Fe</text>
          <text x="27" y="69" textAnchor="middle" fontSize="7" fill="#3b5560" fontWeight="700">Zn</text>
          <text x="53" y="69" textAnchor="middle" fontSize="7" fill="#3b5560" fontWeight="700">Pb</text>
        </>
      ) : kind === 'naoh' ? (
        <>
          <rect x="22" y="6" width="36" height="78" rx="6" fill="#fff" stroke="#a8b4be" strokeWidth="1.5" />
          <rect x="26" y="20" width="28" height="6" fill="#fbbf24" opacity=".7" />
          <text x="40" y="55" textAnchor="middle" fontSize="14" fontWeight="800" fill="#3a4a55">NaOH</text>
          <text x="40" y="68" textAnchor="middle" fontSize="7" fill="#6b7a85">1 M</text>
          <rect x="22" y="6" width="36" height="6" fill="#fbbf24" />
        </>
      ) : kind === 'hcl' ? (
        <>
          <rect x="22" y="6" width="36" height="78" rx="6" fill="#fff" stroke="#a8b4be" strokeWidth="1.5" />
          <rect x="26" y="20" width="28" height="6" fill="#60a5fa" opacity=".7" />
          <text x="40" y="55" textAnchor="middle" fontSize="14" fontWeight="800" fill="#3a4a55">HCl</text>
          <text x="40" y="68" textAnchor="middle" fontSize="7" fill="#6b7a85">1 M</text>
          <rect x="22" y="6" width="36" height="6" fill="#60a5fa" />
        </>
      ) : (
        <>
          <rect x="17" y="9" width="46" height="73" rx="10" fill={'url(#' + id + ')'} stroke="#a0b2be" />
          <rect x="23" y="18" width="34" height="22" rx="4" fill="#334d5c" />
          <text x="40" y="33" textAnchor="middle" fontSize="9" fill="#9bd1cf" fontFamily="monospace">pH 7.0</text>
          <circle cx="40" cy="58" r="8" fill="#425c6b" />
          <circle cx="40" cy="58" r="4" stroke="#8fa4b0" />
          <rect x="33" y="68" width="14" height="6" rx="2" fill="#334d5c" />
        </>
      )}
    </svg>
  )
}
