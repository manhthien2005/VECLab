import { useId, useLayoutEffect, useRef } from 'react'
import Image from 'next/image'
import { SOAP_PROFILE } from '@/domain/experiments/soap/model.js'
import { CloseIcon, ToolsIcon } from '@/features/workbench/icons.js'
import type { SoapEquipmentKind } from './equipment-art.js'
import styles from './equipment-panel.module.css'

const REQ = SOAP_PROFILE.requirements
const SOAP_EQUIPMENT_KINDS = ['ppe', 'lye', 'oils', 'mold', 'meter'] as const satisfies readonly SoapEquipmentKind[]

const EQUIPMENT: Record<SoapEquipmentKind, {
  title: string
  file: string
  alt: string
  caption: string
  purpose: string
  facts: [string, string][]
  steps: string[]
  note: string
}> = {
  ppe: {
    title: 'Kính và găng',
    file: 'ppe.webp',
    alt: 'Găng xanh, kính bảo hộ và áo blouse trong phòng thí nghiệm',
    caption: 'Ảnh nhận diện PPE. Trên bàn, kính và găng được coi là đã đeo sẵn.',
    purpose: 'Bảo vệ khi rót kiềm, dầu và khi tháo khuôn. Không có bước “đeo” riêng trên workbench.',
    facts: [['Trạng thái', 'Đã đeo sẵn'], ['Khi cần găng', 'Rót · tháo khuôn'], ['Thao tác riêng', 'Không']],
    steps: ['Bắt đầu bài mà không cần mở bước PPE.', 'Vẫn chọn cốc và thao tác như hướng dẫn trên bảng Thao tác.', 'Đọc mục này khi cần nhớ quy ước an toàn của bài.'],
    note: 'Ảnh minh họa nhận diện; không phải bằng chứng kết quả mô phỏng.',
  },
  lye: {
    title: 'NaOH và nước',
    file: 'naoh-water.jpg',
    alt: 'Rót dung dịch vào cốc thủy tinh trên bàn thí nghiệm',
    caption: 'Ảnh minh họa pha dung dịch. Trong bài luôn rót NaOH vào nước.',
    purpose: 'Pha dung dịch kiềm trong cốc W. Thứ tự sai (nước vào NaOH rắn) làm vỡ cốc và dừng thí nghiệm.',
    facts: [
      ['Nồng độ đạt', Math.round(REQ.lyeConcentration.min * 100) + '–' + Math.round(REQ.lyeConcentration.max * 100) + ' %'],
      ['Nguội trước khi đổ', '≤ ' + REQ.lyeTemperatureMaxC + ' °C'],
      ['Cốc trên bàn', 'W'],
    ],
    steps: ['Chọn cốc W.', 'Rót nước trước, rồi rót NaOH.', 'Bấm Nguội kiềm khi còn nóng; đổ sang cốc trộn khi đã hợp lệ.'],
    note: 'Ảnh không phải công thức NaOH của bài. Lượng nước và NaOH do bạn nhập.',
  },
  oils: {
    title: 'Dầu',
    file: 'oils.webp',
    alt: 'Rót chất lỏng vàng từ cốc thủy tinh vào cốc đong',
    caption: 'Ảnh minh họa rót dầu. Loại dầu và khối lượng do bạn chọn trên bàn.',
    purpose: 'Nguyên liệu béo cho xà phòng hóa. Mỗi loại có SAP và mật độ riêng để quy đổi thể tích sang khối lượng.',
    facts: [
      ['Loại dầu', 'Ô liu · dừa · cọ'],
      ['Nhiệt dầu', SOAP_PROFILE.oilTemperatureC + ' °C (cố định)'],
      ['Cốc trên bàn', 'O'],
    ],
    steps: ['Chọn cốc O và chọn loại dầu.', 'Rót dầu theo mL; ô quy đổi sang gam theo mật độ.', 'Đổ sang cốc trộn hoặc loại bỏ dầu cũ khi cần đổi loại dầu.'],
    note: 'Không suy khối lượng hoặc loại dầu thật từ ảnh minh họa.',
  },
  mold: {
    title: 'Khuôn silicone',
    file: 'mold.png',
    alt: 'Khuôn silicone nhiều ngăn dùng đổ bánh xà phòng',
    caption: 'Ảnh nhận diện khuôn. Trên bàn mỗi lần đổ là một mẫu thử.',
    purpose: 'Nhận toàn bộ hỗn hợp đã khuấy, chờ gel, tháo bánh rồi ủ trước khi đo.',
    facts: [
      ['Gel', SOAP_PROFILE.gelHours + ' giờ'],
      ['Ủ', SOAP_PROFILE.cureWeeks + ' tuần'],
      ['Số mẫu tối đa', String(SOAP_PROFILE.maxSamples)],
    ],
    steps: ['Chọn D khi hỗn hợp đã khuấy trong cốc trộn.', 'Đổ khuôn → chờ gel → tháo khuôn → chờ ủ → đo.', 'Hoàn thành thí nghiệm khi có ít nhất một mẫu (hoặc đã thất bại).'],
    note: 'Khuôn trên bàn xử lý một mẫu mỗi lần; ảnh nhiều ngăn chỉ để nhận diện.',
  },
  meter: {
    title: 'pH và cân',
    file: 'meter.png',
    alt: 'Máy đo pH cầm tay và cân phân tích phòng thí nghiệm',
    caption: 'Ảnh nhận diện thiết bị đo. Mô phỏng không tái hiện đúng mẫu máy trong ảnh.',
    purpose: 'Đọc pH và khối lượng sau khi bánh đã ủ. Chỉ phép đo đã làm mới có số trong sổ.',
    facts: [
      ['pH đạt', REQ.ph.min + '–' + REQ.ph.max],
      ['Thiếu phép đo', 'N/A (không điền 0)'],
      ['Thời điểm đo', 'Sau ' + SOAP_PROFILE.cureWeeks + ' tuần ủ'],
    ],
    steps: ['Hoàn tất đổ khuôn, gel, tháo khuôn và ủ.', 'Bấm đo trên cốc khuôn khi đã đủ điều kiện.', 'Đọc kết quả trong Sổ đo và báo cáo sau khi hoàn thành.'],
    note: 'Không có số đo thì hiện N/A. Không dùng số mô phỏng để nấu xà phòng thật.',
  },
}

export function SoapEquipmentPanel({ item, onItemChange, onClose }: {
  item: SoapEquipmentKind
  onItemChange: (item: SoapEquipmentKind) => void
  onClose: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const pressedOutside = useRef(false)
  const titleId = useId()
  const content = EQUIPMENT[item]
  useLayoutEffect(() => {
    const element = dialog.current
    const opener = document.activeElement
    element?.showModal()
    return () => {
      element?.close()
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus()
    }
  }, [])
  return <dialog ref={dialog} className={styles.panel} aria-labelledby={titleId}
    onPointerDown={(event) => {
      const bounds = event.currentTarget.getBoundingClientRect()
      pressedOutside.current = event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom
    }}
    onClick={(event) => {
      const bounds = event.currentTarget.getBoundingClientRect()
      if (pressedOutside.current && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) onClose()
      pressedOutside.current = false
    }}
    onCancel={(event) => { event.preventDefault(); onClose() }}>
    <header className={styles.header}>
      <h2 id={titleId}><ToolsIcon />Mẫu & dụng cụ</h2>
      <button type="button" aria-label="Đóng bảng mẫu & dụng cụ" onClick={onClose}><CloseIcon /></button>
    </header>
    <nav className={styles.tabs} aria-label="Chọn mẫu hoặc dụng cụ">
      {SOAP_EQUIPMENT_KINDS.map((kind) => (
        <button key={kind} type="button" aria-pressed={kind === item} onClick={() => onItemChange(kind)}>{EQUIPMENT[kind].title}</button>
      ))}
    </nav>
    <div className={styles.body}>
      <h3>{content.title}</h3>
      <figure>
        <div className={styles.photo}>
          <Image src={'/assets/soap-equipment/' + content.file} alt={content.alt} fill sizes="(max-width: 600px) 90vw, 500px" />
        </div>
        <figcaption>{content.caption}</figcaption>
      </figure>
      <section><h4>Dùng để làm gì?</h4><p>{content.purpose}</p></section>
      <dl className={styles.facts}>{content.facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      <section><h4>Cách dùng trên workbench</h4><ol>{content.steps.map((step) => <li key={step}>{step}</li>)}</ol></section>
      <p className={styles.note}>{content.note}</p>
    </div>
  </dialog>
}
