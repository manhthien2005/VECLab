import { useId, useLayoutEffect, useRef } from 'react'
import Image from 'next/image'
import { JAR_PROFILE } from '@/domain/experiments/jar-test/model.js'
import { CloseIcon, ToolsIcon } from '@/features/workbench/icons.js'
import styles from './equipment-panel.module.css'

export type EquipmentKind = 'sample' | 'coagulant' | 'meter'
const EQUIPMENT = {
  sample: {
    title: 'Mẫu kaolin', image: 'kaolin', alt: 'Ảnh chụp mẫu khoáng kaolin màu trắng',
    caption: 'Kaolin ngoài thực tế. Trong bài, kaolin được dùng trong mẫu nước đục tổng hợp.',
    author: 'USGS / Minerals in Your World', license: 'Phạm vi công cộng',
    source: 'https://commons.wikimedia.org/wiki/File:Kaolin.jpg', licenseUrl: 'https://commons.wikimedia.org/wiki/File:Kaolin.jpg#Licensing',
    purpose: 'Mẫu nước đục là đối tượng cần khảo sát. Mỗi cốc nhận cùng thể tích mẫu, còn pH ban đầu được chọn theo các điều kiện có sẵn.',
    facts: [['Thể tích mẫu', JAR_PROFILE.aliquotVolumeL.toLocaleString('vi-VN') + ' L / cốc'], ['Dung tích cốc', JAR_PROFILE.beakerCapacityL + ' L'], ['pH ban đầu', JAR_PROFILE.availableInitialPh.join(' / ')]],
    steps: ['Chọn một cốc trên dàn hoặc trong bảng Thao tác.', 'Mở Chuẩn bị mẫu, chọn pH rồi bấm Chuẩn bị cốc.', 'Đo mẫu ban đầu trong Sổ đo trước khi chạy chương trình.'],
    note: 'pH là điều kiện ban đầu của mẫu đã chuẩn bị sẵn, không phải pH cuối sau xử lý. Không suy độ đục từ ảnh hoặc màu nước.',
  },
  coagulant: {
    title: 'Phèn nhôm', image: 'aluminium-sulfate', alt: 'Ảnh chụp tinh thể nhôm sulfat màu trắng',
    caption: 'Nhôm sulfat ở dạng tinh thể. Thao tác trong bài được biểu diễn bằng liều phèn quy đổi.',
    author: 'Chemicalinterest', license: 'Phạm vi công cộng',
    source: 'https://commons.wikimedia.org/wiki/File:Aluminium_sulfate_crystals.JPG', licenseUrl: 'https://commons.wikimedia.org/wiki/File:Aluminium_sulfate_crystals.JPG#Licensing',
    purpose: 'Chất keo tụ dùng để khảo sát khả năng giảm độ đục của mẫu. Bạn thay đổi tổng liều giữa các cốc để so sánh kết quả đo.',
    facts: [['Tổng liều', JAR_PROFILE.minDoseMgL + '–' + JAR_PROFILE.maxDoseMgL + ' mg/L'], ['Bước liều', JAR_PROFILE.doseStepMgL + ' mg/L'], ['Thời điểm cấp', 'Trước khi chạy khuấy nhanh']],
    steps: ['Chọn một cốc đã chuẩn bị và mở Cấp phèn.', 'Chọn liều tăng; kiểm tra tổng liều sau khi thêm.', 'Bấm thêm phèn. Mỗi lần thêm được cộng vào tổng liều của cốc.'],
    note: 'mg/L là liều tính trên thể tích mẫu, không phải khối lượng mg. Không tự suy liều xử lý nước thật từ hồ sơ mô phỏng này.',
  },
  meter: {
    title: 'Máy đo độ đục', image: 'turbidimeters', alt: 'Ảnh chụp các máy đo độ đục trong hệ thống xử lý nước',
    caption: 'Máy đo độ đục tại hệ thống xử lý nước. Workbench dùng hình máy giản lược, không tái hiện đúng mẫu thiết bị trong ảnh.',
    author: 'Z22', license: 'CC BY-SA 3.0',
    source: 'https://commons.wikimedia.org/wiki/File:Turbidimeters.JPG', licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
    purpose: 'Đọc độ đục bằng NTU để đối chiếu mẫu ban đầu với từng cốc sau xử lý. Chỉ phép đo đã thực hiện mới có số liệu trong sổ đo.',
    facts: [['Đại lượng đọc', 'Độ đục · NTU'], ['Đo ban đầu', 'Trước khi chạy chương trình'], ['Đo cuối hợp lệ', 'Sau khuấy nhanh, khuấy chậm và lắng']],
    steps: ['Trong Sổ đo, bấm Đo mẫu ban đầu để lấy số liệu nền.', 'Sau khi chạy đủ ba pha, chọn cốc và mở Đo & ghi kết quả.', 'Bấm Đo độ đục cuối cốc; dùng NTU đầu và cuối hợp lệ để tự tính hiệu suất.'],
    note: 'Đo sớm được lưu với N/A, không phải 0 NTU. Bạn có thể đo lại sau khi hoàn tất chương trình; lịch sử vẫn giữ phép đo trước đó.',
  },
} as const

export function EquipmentPanel({ item, onItemChange, onClose }: {
  item: EquipmentKind
  onItemChange: (item: EquipmentKind) => void
  onClose: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const content = EQUIPMENT[item]
  useLayoutEffect(() => {
    const element = dialog.current
    element?.showModal()
    return () => element?.close()
  }, [])
  return <dialog ref={dialog} className={styles.panel} aria-labelledby={titleId}
    onCancel={(event) => { event.preventDefault(); onClose() }}>
    <header className={styles.header}><h2 id={titleId}><ToolsIcon />Mẫu & dụng cụ</h2>
      <button type="button" aria-label="Đóng bảng mẫu & dụng cụ" onClick={onClose}><CloseIcon /></button></header>
    <nav className={styles.tabs} aria-label="Chọn mẫu hoặc dụng cụ">{(['sample', 'coagulant', 'meter'] as const).map(kind => <button key={kind} type="button" aria-pressed={kind === item} onClick={() => onItemChange(kind)}>{EQUIPMENT[kind].title}</button>)}</nav>
    <div className={styles.body}>
      <h3>{content.title}</h3>
      <figure><div className={styles.photo}><Image src={'/assets/jar-equipment/' + content.image + '.webp'} alt={content.alt} fill sizes="(max-width: 600px) 90vw, 500px" /></div>
        <figcaption>{content.caption}<span>Ảnh: {content.author} · <a href={content.licenseUrl} target="_blank" rel="noreferrer">{content.license}</a> · <a href={content.source} target="_blank" rel="noreferrer">Nguồn ảnh</a></span></figcaption>
      </figure>
      <section><h4>Dùng để làm gì?</h4><p>{content.purpose}</p></section>
      <dl className={styles.facts}>{content.facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      <section><h4>Cách dùng trên workbench</h4><ol>{content.steps.map(step => <li key={step}>{step}</li>)}</ol></section>
      <p className={styles.note}>{content.note}</p>
    </div>
  </dialog>
}
