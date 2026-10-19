import type { PlasticItemKind } from './equipment-panel.js'
import { InfoIcon } from '@/features/workbench/icons.js'
import styles from './workbench.module.css'

export function PlasticEquipmentShelf({
  onSelectEquipment,
}: {
  onSelectEquipment?: (kind: PlasticItemKind) => void
}) {
  return (
    <section className={styles.equipmentShelf} aria-label="Dụng cụ sử dụng trong thí nghiệm">
      <button
        type="button"
        className={styles.equipmentCard}
        onClick={() => onSelectEquipment?.('pilot-tank')}
        aria-haspopup="dialog"
        aria-label="Tìm hiểu Bể pilot 800 L"
      >
        <div className={styles.equipmentCardHeader}>
          <h3>Bể pilot 800 L</h3>
          <span className={styles.equipmentActionBadge}><InfoIcon /></span>
        </div>
        <svg viewBox="0 0 180 126" role="img" aria-label="Bể pilot có dung tích hữu ích 800 lít">
          <rect x="31" y="27" width="118" height="82" rx="8" fill="#dbe7ee" stroke="#71859a" strokeWidth="3" />
          <path d="M 39 39 L 141 39 L 141 98 Q 141 102 136 102 L 44 102 Q 39 102 39 98 Z" fill="#f8fafc" stroke="#a8bac7" strokeWidth="1.5" />
          <path d="M 41 61 Q 65 57 90 61 T 139 61 L 139 98 Q 139 100 136 100 L 44 100 Q 41 100 41 98 Z" fill="#38bdf8" fillOpacity=".5" />
          <path d="M 42 61 Q 66 57 90 61 T 138 61" fill="none" stroke="#e0f2fe" strokeWidth="2" />
          <line x1="46" y1="44" x2="46" y2="94" stroke="#ffffff" strokeWidth="2" opacity=".9" />
          <rect x="56" y="108" width="68" height="6" rx="2" fill="#64748b" />
        </svg>
        <p className={styles.equipmentStatus}>Dung tích hữu ích · Nhấn để xem ảnh thật</p>
      </button>

      <button
        type="button"
        className={styles.equipmentCard}
        onClick={() => onSelectEquipment?.('centrifuge')}
        aria-haspopup="dialog"
        aria-label="Tìm hiểu Máy ly tâm 2.950 rpm"
      >
        <div className={styles.equipmentCardHeader}>
          <h3>Máy ly tâm</h3>
          <span className={styles.equipmentActionBadge}><InfoIcon /></span>
        </div>
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
        <p className={styles.equipmentStatus}>2.950 rpm · Nhấn để xem ảnh thật</p>
      </button>

      <button
        type="button"
        className={styles.equipmentCard}
        onClick={() => onSelectEquipment?.('scale')}
        aria-haspopup="dialog"
        aria-label="Tìm hiểu Cân kỹ thuật"
      >
        <div className={styles.equipmentCardHeader}>
          <h3>Cân</h3>
          <span className={styles.equipmentActionBadge}><InfoIcon /></span>
        </div>
        <svg viewBox="0 0 180 126" role="img" aria-label="Cân điện tử dùng để cân các phân đoạn nhựa">
          <rect x="30" y="48" width="120" height="64" rx="9" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2.5" />
          <rect x="43" y="59" width="94" height="25" rx="4" fill="#0f172a" />
          <text x="90" y="76" fill="#94f0b2" fontSize="12" fontFamily="ui-monospace, monospace" fontWeight="700" textAnchor="middle">— — —</text>
          <rect x="56" y="36" width="68" height="9" rx="3" fill="#cbd5e1" stroke="#94a3b8" />
          <rect x="39" y="91" width="102" height="7" rx="3" fill="#cbd5e1" />
          <circle cx="90" cy="104" r="2" fill="#94a3b8" />
        </svg>
        <p className={styles.equipmentStatus}>Cân phân đoạn · Nhấn để xem ảnh thật</p>
      </button>
    </section>
  )
}
