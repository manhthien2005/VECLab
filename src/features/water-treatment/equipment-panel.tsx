'use client'

import { useId, useLayoutEffect, useRef } from 'react'
import { CloseIcon, ToolsIcon } from '@/features/workbench/icons.js'
import { WT_QCVN_COLUMN_A } from './constants.js'
import styles from './equipment-panel.module.css'

export type EquipmentKind = 'sample' | 'naoh' | 'hcl' | 'meter'

const EQUIPMENT = {
  sample: {
    title: 'Mẫu Fe, Zn, Pb',
    purpose:
      'Mẫu nước tổng hợp chứa Fe, Zn, Pb ở dạng muối tan (FeCl₃, ZnSO₄, Pb(NO₃)₂). Đây là đối tượng cần xử lý.',
    facts: [
      ['Các cation', 'Fe³⁺ · Zn²⁺ · Pb²⁺'],
      ['Anion đi kèm', 'Cl⁻ · SO₄²⁻ · NO₃⁻'],
      ['Thể tích mẫu', '500–2.000 mL'],
    ] as const,
    steps: [
      'Chọn nồng độ Fe, Zn, Pb trong Thao tác → Chọn mẫu.',
      'Bấm Đo pH ban đầu trước khi nhỏ bất kỳ giọt nào.',
      'Sau khi áp dụng composition, bạn có thể thay đổi — toàn bộ tiến trình sẽ reset.',
    ],
    note: 'Composition do solver quy đổi sang μM khi tính. pH ban đầu lấy từ composition chứ không phải user input.',
  },
  naoh: {
    title: 'NaOH 1 M',
    purpose:
      'Dung dịch NaOH 1 M dùng để tăng pH. Khi pH vượt pKsp của Fe(OH)₃, Zn(OH)₂, Pb(OH)₂, các kim loại kết tủa dưới dạng hydroxide.',
    facts: [
      ['Nồng độ stock', '1 M (≈ 40 g/L)'],
      ['Kích thước giọt', '0,01 / 0,05 / 0,1 / 0,5 mL'],
      ['Tác dụng', 'Tăng pH · sinh hydroxide'],
    ] as const,
    steps: [
      'Chọn drop size (0,05 mL là mặc định an toàn).',
      'Bấm Nhỏ giọt NaOH trong Thao tác → Kiềm hóa và lọc.',
      'Sau mỗi giọt, dùng Khuấy để đồng nhất. Tránh pH > 10,5 (Zn tan ngược do amphoteric).',
    ],
    note: 'NaOH cũng đưa Na⁺ vào dung dịch — server dùng tổng Na⁺ tích lũy để charge balance.',
  },
  hcl: {
    title: 'HCl 1 M',
    purpose:
      'Dung dịch HCl 1 M dùng để giảm pH (correct overshoot kiềm hoặc trung hòa pH cuối ở Bước 3).',
    facts: [
      ['Nồng độ stock', '1 M (≈ 36,5 g/L)'],
      ['Kích thước giọt', '0,01 / 0,05 / 0,1 / 0,5 mL'],
      ['Tác dụng', 'Giảm pH · tăng Cl⁻'],
    ] as const,
    steps: [
      'Trong Bước 2: chỉ dùng để correct overshoot kiềm khiến Zn tan ngược.',
      'Trong Bước 3: dùng để đưa pH về dải [6; 9] theo Cột A.',
      'Mỗi giọt HCl cập nhật pH ngay. Khuấy sau khi nhỏ để đồng nhất.',
    ],
    note: 'HCl đưa Cl⁻ vào dung dịch — server cộng Cl⁻ tích lũy để charge balance.',
  },
  meter: {
    title: 'Máy đo pH',
    purpose:
      'Đo pH bằng điện cực thuỷ tinh. Chỉ phép đo đã thực hiện mới có số liệu. Workbench dùng hình máy giản lược, không tái hiện đúng mẫu thiết bị trong ảnh.',
    facts: [
      ['Đại lượng đo', 'pH'],
      ['Đo pH ban đầu', 'Bắt buộc trước khi nhỏ bất kỳ giọt nào'],
      ['Đo lại pH Bước 3', 'Sau khuấy, mỗi lần đo thêm 1 hàng vào bảng'],
    ] as const,
    steps: [
      'Bước 1: Thao tác → Đo pH ban đầu, bấm Đo pH ban đầu để lấy baseline.',
      'Bước 2: Có thể đo lại sau khi chỉnh (server trả pH mới).',
      'Bước 3: Đo lại pH sau mỗi lần khuấy. Mỗi lần đo tạo 1 hàng mới trong bảng lịch sử.',
    ],
    note: 'pH ngoài [2; 13] sẽ bị pH guard từ chối (CHARGE_BALANCE_FAILED / PH_GUARD_*).',
  },
} as const

export function EquipmentPanel({
  item,
  onItemChange,
  onClose,
}: {
  item: EquipmentKind
  onItemChange: (item: EquipmentKind) => void
  onClose: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const pressedOutside = useRef(false)
  const titleId = useId()
  const content = EQUIPMENT[item]
  useLayoutEffect(() => {
    const element = dialog.current
    element?.showModal()
    return () => element?.close()
  }, [])
  return (
    <dialog
      ref={dialog}
      className={styles.panel}
      aria-labelledby={titleId}
      onPointerDown={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect()
        pressedOutside.current =
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
      }}
      onClick={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect()
        if (
          pressedOutside.current &&
          (event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom)
        ) {
          onClose()
        }
        pressedOutside.current = false
      }}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
    >
      <header className={styles.header}>
        <h2 id={titleId}>
          <ToolsIcon />
          Mẫu & dụng cụ
        </h2>
        <button type="button" aria-label="Đóng bảng mẫu & dụng cụ" onClick={onClose}>
          <CloseIcon />
        </button>
      </header>
      <nav className={styles.tabs} aria-label="Chọn mẫu hoặc dụng cụ">
        {(['sample', 'naoh', 'hcl', 'meter'] as const).map((kind) => (
          <button
            key={kind}
            type="button"
            aria-pressed={kind === item}
            onClick={() => onItemChange(kind)}
          >
            {EQUIPMENT[kind].title}
          </button>
        ))}
      </nav>
      <div className={styles.body}>
        <h3>{content.title}</h3>
        <section>
          <h4>Dùng để làm gì?</h4>
          <p>{content.purpose}</p>
        </section>
        <dl className={styles.facts}>
          {content.facts.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <section>
          <h4>Cách dùng trên workbench</h4>
          <ol>
            {content.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>
        <p className={styles.note}>
          {content.note} Mục tiêu Cột A QCVN 40:2025/BTNMT đã xác minh ngày 16/10/2026 (Fe ≤{' '}
          {WT_QCVN_COLUMN_A.Fe_mgPerL}, Zn ≤ {WT_QCVN_COLUMN_A.Zn_mgPerL}, Pb ≤{' '}
          {WT_QCVN_COLUMN_A.Pb_mgPerL} mg/L, pH {WT_QCVN_COLUMN_A.pH_min}–{WT_QCVN_COLUMN_A.pH_max}).
        </p>
      </div>
    </dialog>
  )
}
