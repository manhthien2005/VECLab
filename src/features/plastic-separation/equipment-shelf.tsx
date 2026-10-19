import { VIRGIN_POLYMERS } from '@/domain/experiments/virgin-plastic-separation/model.js'
import type { PlasticItemKind } from './equipment-panel.js'
import { InfoIcon } from '@/features/workbench/icons.js'
import bench from '@/features/extraction/bench.module.css'
import ui from './workbench-ui.module.css'

export function PlasticEquipmentShelf({ onSelectEquipment }: {
  onSelectEquipment?: (kind: PlasticItemKind) => void
}) {
  return <section className={bench.inventory} aria-label="Danh mục mẫu và dụng cụ">
    <button type="button" className={bench.equipment} aria-haspopup="dialog"
      aria-label="Tìm hiểu sáu mẫu nhựa" onClick={() => onSelectEquipment?.('pp')}>
      <span className={ui.sampleArt} aria-hidden="true">{VIRGIN_POLYMERS.map(polymer =>
        <span key={polymer.id} style={{ backgroundColor: polymer.colorHex }} />)}</span>
      <span className={bench.equipmentText}><strong>Sáu mẫu nhựa</strong><span>PP · HDPE · PS<br />ABS · PA · PC</span></span>
      <span className={bench.equipmentInfo}><InfoIcon /></span>
    </button>
    <button type="button" className={bench.equipment} aria-haspopup="dialog"
      aria-label="Tìm hiểu Bể pilot 800 L" onClick={() => onSelectEquipment?.('pilot-tank')}>
      <PlasticEquipmentArt kind="pilot-tank" />
      <span className={bench.equipmentText}><strong>Bể pilot</strong><span>800 L · Nước, ethanol và NaCl</span></span>
      <span className={bench.equipmentInfo}><InfoIcon /></span>
    </button>
    <button type="button" className={bench.equipment} aria-haspopup="dialog"
      aria-label="Tìm hiểu Ly tâm và cân" onClick={() => onSelectEquipment?.('centrifuge')}>
      <PlasticEquipmentArt kind="centrifuge" />
      <span className={bench.equipmentText}><strong>Ly tâm & cân</strong><span>2.950 rpm · kg quy đổi</span></span>
      <span className={bench.equipmentInfo}><InfoIcon /></span>
    </button>
  </section>
}

/** Keep the current apparatus artwork; this change only compacts the inventory. */
function PlasticEquipmentArt({ kind }: { kind: 'pilot-tank' | 'centrifuge' | 'scale' }) {
  if (kind === 'pilot-tank') return (
    <svg viewBox="0 0 180 126" role="img" aria-label="Bể pilot có dung tích hữu ích 800 lít">
          <rect x="31" y="27" width="118" height="82" rx="8" fill="#dbe7ee" stroke="#71859a" strokeWidth="3" />
          <path d="M 39 39 L 141 39 L 141 98 Q 141 102 136 102 L 44 102 Q 39 102 39 98 Z" fill="#f8fafc" stroke="#a8bac7" strokeWidth="1.5" />
          <path d="M 41 61 Q 65 57 90 61 T 139 61 L 139 98 Q 139 100 136 100 L 44 100 Q 41 100 41 98 Z" fill="#38bdf8" fillOpacity=".5" />
          <path d="M 42 61 Q 66 57 90 61 T 138 61" fill="none" stroke="#e0f2fe" strokeWidth="2" />
          <line x1="46" y1="44" x2="46" y2="94" stroke="#ffffff" strokeWidth="2" opacity=".9" />
          <rect x="56" y="108" width="68" height="6" rx="2" fill="#64748b" />
        </svg>
  )
  if (kind === 'centrifuge') return (
    <svg viewBox="0 0 180 126" role="img" aria-label="Máy ly tâm dùng trong quy trình">
          <rect x="24" y="103" width="132" height="9" rx="4" fill="#64748b" />
          <rect x="34" y="43" width="112" height="61" rx="13" fill="#dbe7ee" stroke="#71859a" strokeWidth="3" />
          <rect x="41" y="49" width="98" height="48" rx="9" fill="#f8fafc" stroke="#a8bac7" strokeWidth="1.5" />
          <circle cx="90" cy="73" r="25" fill="#d8e2eb" stroke="#8da0b2" strokeWidth="2.5" />
          <circle cx="90" cy="73" r="19" fill="#f8fafc" stroke="#b6c4d1" strokeWidth="1.5" />
          <circle cx="90" cy="73" r="5" fill="#475569" />
          {[0, 90, 180, 270].map((angle) => (
            <g key={angle} transform={`rotate(${angle} 90 73)`}>
              <rect x="87" y="53" width="6" height="13" rx="3" fill="#94a3b8" stroke="#64748b" />
            </g>
          ))}
        </svg>
  )
  return (
    <svg viewBox="0 0 180 126" role="img" aria-label="Cân điện tử dùng để cân các phân đoạn nhựa">
          <rect x="30" y="48" width="120" height="64" rx="9" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2.5" />
          <rect x="43" y="59" width="94" height="25" rx="4" fill="#0f172a" />
          <text x="90" y="76" fill="#94f0b2" fontSize="12" fontFamily="ui-monospace, monospace" fontWeight="700" textAnchor="middle">— — —</text>
          <rect x="56" y="36" width="68" height="9" rx="3" fill="#cbd5e1" stroke="#94a3b8" />
          <rect x="39" y="91" width="102" height="7" rx="3" fill="#cbd5e1" />
          <circle cx="90" cy="104" r="2" fill="#94a3b8" />
        </svg>
  )
}
