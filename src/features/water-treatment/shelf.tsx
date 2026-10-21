'use client'

import { GuideIcon, InfoIcon, TheoryIcon, SourcesIcon } from '@/features/workbench/icons.js'
import { EquipmentArt } from './equipment-art.js'
import type { EquipmentKind } from './equipment-panel.js'
import styles from './shelf.module.css'

const SHELF_ITEMS: ReadonlyArray<{ kind: EquipmentKind; title: string; description: string }> = [
  { kind: 'sample', title: 'Mẫu Fe, Zn, Pb', description: 'Mẫu tổng hợp · 500–2.000 mL' },
  { kind: 'naoh', title: 'NaOH 1 M', description: 'Tăng pH · sinh hydroxide' },
  { kind: 'hcl', title: 'HCl 1 M', description: 'Correct overshoot · trung hòa' },
  { kind: 'meter', title: 'Máy đo pH', description: 'pH đo được · không phải mô hình' },
]

/**
 * Kệ dụng cụ cho Xử lý nước — cùng pattern với Jar Test. 4 nút dụng cụ mở
 * `EquipmentPanel` để xem mô tả chi tiết, và phần shelfHelp cung cấp lối
 * tắt tới hướng dẫn / lý thuyết / nguồn.
 */
export function WaterTreatmentShelf({
  onSelectItem,
  onOpenTour,
  guideHref,
  sourceHref,
}: {
  onSelectItem: (kind: EquipmentKind) => void
  onOpenTour: () => void
  guideHref: string
  sourceHref: string
}) {
  return (
    <div className={styles.shelfContent}>
      <div className={styles.inventory}>
        {SHELF_ITEMS.map((item) => (
          <button
            key={item.kind}
            type="button"
            className={styles.equipment}
            aria-haspopup="dialog"
            aria-label={'Tìm hiểu ' + item.title}
            onClick={() => onSelectItem(item.kind)}
          >
            <EquipmentArt kind={item.kind} />
            <span className={styles.equipmentText}>
              <strong>{item.title}</strong>
              <span>{item.description}</span>
            </span>
            <span className={styles.equipmentInfo}>
              <InfoIcon />
            </span>
          </button>
        ))}
      </div>
      <div className={styles.shelfHelp}>
        <button type="button" className={styles.guideButton} onClick={onOpenTour}>
          <GuideIcon />
          Hướng dẫn thao tác
        </button>
        <a className={styles.theoryLink} href={guideHref} target="_blank" rel="noopener noreferrer">
          <TheoryIcon />
          <span>Lý thuyết & cách làm bài</span>
        </a>
        <details>
          <summary>
            <SourcesIcon />
            Nguồn & giới hạn
          </summary>
          <p>
            Chỉ áp dụng cho composition, pH, liều NaOH/HCl và chu trình Khuấy → Lắng → Lọc đã khóa. Mẫu chỉ phục vụ mục đích học tập.
          </p>
          <a href={sourceHref} target="_blank" rel="noopener noreferrer">
            Sổ đăng ký bằng chứng khoa học — mở tab mới
          </a>
          <p>Không suy liều xử lý nước thật từ kết quả mô phỏng này.</p>
        </details>
      </div>
    </div>
  )
}
