import { useId, useLayoutEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { ToolsIcon, CloseIcon } from '@/features/workbench/icons.js'
import styles from './equipment-panel.module.css'
import { VIRGIN_POLYMERS, PLASTIC_PROFILE, OUTCOMES, type PolymerId, type SeparationKind } from '@/domain/experiments/virgin-plastic-separation/model.js'

export type PlasticItemKind =
  | 'pp'
  | 'hdpe'
  | 'ps'
  | 'abs'
  | 'pa'
  | 'pc'
  | 'pilot-tank'
  | 'centrifuge'
  | 'scale'

type PlasticItemContent = {
  category: 'polymer' | 'equipment'
  title: string
  tabLabel: string
  image: string
  alt: string
  caption: string
  purpose: string
  facts: [string, string][]
  steps: string[]
  note: string
}

const FINAL_STAGE: Record<PolymerId, SeparationKind> = { PP: 'ethanol_23', HDPE: 'ethanol_31', PS: 'nacl_11_12', ABS: 'nacl_20', PA: 'nacl_40', PC: 'nacl_40' }
const polymerItems = Object.fromEntries(VIRGIN_POLYMERS.map(polymer => {
  const outcome = OUTCOMES[FINAL_STAGE[polymer.id]]
  const behavior = outcome.floating.includes(polymer.id) ? 'nổi' : 'chìm'
  const recovery = outcome.reportedRecoveries[polymer.id]
  return [polymer.id.toLowerCase(), {
    category: 'polymer', title: polymer.name + ' (' + polymer.id + ')', tabLabel: polymer.id,
    image: '/assets/plastic-separation/' + polymer.id.toLowerCase() + '.jpg',
    alt: 'Ảnh minh họa mẫu ' + polymer.id, caption: 'Ảnh minh họa mẫu; không phải bằng chứng xác nhận mẫu của nghiên cứu.',
    purpose: polymer.id === 'PP' || polymer.id === 'HDPE' ? 'Thuộc nhóm nổi trong nước, tiếp tục phân loại trong nhánh ethanol.' : 'Thuộc nhóm chìm trong nước, tiếp tục phân loại trong nhánh NaCl.',
    facts: [
      ['Khối lượng riêng danh định', polymer.nominalDensity], ['Hình thái trong hồ sơ', polymer.formVi], ['Kích thước', polymer.sizeRangeMm],
      ['Khối lượng cấp liệu', PLASTIC_PROFILE.sampleFeedMassKg.toLocaleString('vi-VN', { minimumFractionDigits: 1 }) + ' kg'],
      ['Phân đoạn ghi nhận', outcome.mediumVi + ' · ' + behavior], ['Thu hồi tham khảo', recovery == null ? 'Chưa có dữ liệu' : recovery.toLocaleString('vi-VN') + '%'],
    ],
    steps: ['Chuẩn bị cùng năm mẫu còn lại, nạp mẫu và ghi nhận làm ướt.', 'Ghi nhận tách sơ bộ trong nước, sau đó ly tâm và cân.', 'Chọn nhánh tương ứng và chạy lần lượt các mức nồng độ; ly tâm và cân sau mỗi bước.'],
    note: 'Màu trên mô phỏng dùng để nhận diện. Tỷ lệ thu hồi lấy từ hồ sơ, không biểu thị độ tinh khiết; khối lượng được quy đổi, không phải phép đo mới.',
  } satisfies PlasticItemContent]
})) as Record<Lowercase<PolymerId>, PlasticItemContent>

export const PLASTIC_ITEMS: Record<PlasticItemKind, PlasticItemContent> = {
  ...polymerItems,
  'pilot-tank': {
    category: 'equipment', title: 'Bể pilot 800 L', tabLabel: 'Bể pilot', image: '/assets/plastic-separation/pilot-tank.jpg', alt: 'Ảnh minh họa bể phân loại', caption: 'Ảnh minh họa thiết bị; điều kiện của bài thực hành được ghi bên dưới.',
    purpose: 'Minh họa các bước làm ướt và phân loại nổi–chìm trong nước, ethanol hoặc NaCl theo hồ sơ.',
    facts: [['Thể tích tham khảo', '800 L'], ['Tốc độ khuấy tham khảo', '160 rpm'], ['Làm ướt', '1 giờ trong điều kiện nghiên cứu'], ['Môi trường', 'Nước máy · ethanol · NaCl']],
    steps: ['Chuẩn bị sáu mẫu trong bảng Thao tác.', 'Chọn nạp mẫu và làm ướt, rồi ghi nhận tách sơ bộ.', 'Chọn nhánh và mức nồng độ cố định để tiếp tục.'],
    note: 'Không tự điều chỉnh thể tích hay tốc độ khuấy trong bài này. Chuyển động không mô phỏng dòng chảy hoặc thời gian xử lý thực tế.',
  },
  centrifuge: {
    category: 'equipment', title: 'Máy ly tâm tách ẩm', tabLabel: 'Máy ly tâm', image: '/assets/plastic-separation/centrifuge.jpg', alt: 'Ảnh minh họa máy ly tâm', caption: 'Ảnh minh họa thiết bị ly tâm.',
    purpose: 'Giới thiệu bước tách ẩm trước khi ghi nhận khối lượng của phân đoạn. Trên VECLab, ly tâm và cân được ghi nhận bằng cùng một nút.',
    facts: [['Tốc độ tham khảo', '2.950 rpm'], ['Thực hiện sau', 'Tách nước và từng mức nồng độ'], ['Thời lượng thực', 'Không suy ra từ thời gian minh họa']],
    steps: ['Ghi nhận một bước tách trong bảng Thao tác.', 'Chọn “Ghi nhận ly tâm phân đoạn & Cân mẫu”.', 'Xem kết quả quy đổi trong sổ thực hành.'],
    note: 'Bài học không tạo phép đo mới và không dùng thời lượng chuyển động để tính kết quả khoa học.',
  },
  scale: {
    category: 'equipment', title: 'Cân khối lượng phân đoạn', tabLabel: 'Cân', image: '/assets/plastic-separation/scale.jpg', alt: 'Ảnh minh họa cân kỹ thuật', caption: 'Ảnh minh họa cân; giá trị trong bài là khối lượng quy đổi.',
    purpose: 'Đối chiếu khối lượng quy đổi từ khối lượng cấp liệu và tỷ lệ thu hồi tham khảo, thay vì mô phỏng một phép cân thực nghiệm mới.',
    facts: [['Cấp liệu', '2,0 kg / loại · 12,0 kg tổng cộng'], ['Công thức', 'm quy đổi = m cấp liệu × thu hồi / 100'], ['Đơn vị', 'kg'], ['Chưa ghi nhận', 'Giữ trống; không tính là 0']],
    steps: ['Hoàn tất bước tách cần ghi nhận.', 'Chọn nút ly tâm và cân trong bảng Thao tác.', 'Mở sổ để đối chiếu phân đoạn, tỷ lệ thu hồi và khối lượng quy đổi.'],
    note: 'Bài hiện chưa có thao tác hiệu chuẩn hoặc trừ bì riêng. Thu hồi không đồng nghĩa với độ tinh khiết.',
  },
}

export function PlasticEquipmentPanel({
  item,
  onItemChange,
  onClose,
}: {
  item: PlasticItemKind
  onItemChange: (item: PlasticItemKind) => void
  onClose: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const pressedOutside = useRef(false)
  const titleId = useId()
  const content = PLASTIC_ITEMS[item]
  const [activeCategory, setActiveCategory] = useState<'polymer' | 'equipment'>(
    content.category
  )

  useLayoutEffect(() => {
    const element = dialog.current
    element?.showModal()
    return () => element?.close()
  }, [])

  const polymerKeys: PlasticItemKind[] = ['pp', 'hdpe', 'ps', 'abs', 'pa', 'pc']
  const equipmentKeys: PlasticItemKind[] = ['pilot-tank', 'centrifuge', 'scale']
  const currentKeys = activeCategory === 'polymer' ? polymerKeys : equipmentKeys

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
        <button
          type="button"
          aria-label="Đóng bảng mẫu & thiết bị"
          onClick={onClose}
        >
          <CloseIcon />
        </button>
      </header>

      <div className={styles.categoryNav} role="group" aria-label="Chọn nhóm thông tin">
        <button
          type="button"
          aria-pressed={activeCategory === 'polymer'}
          className={`${styles.categoryButton} ${activeCategory === 'polymer' ? styles.categoryButtonActive : ''}`}
          onClick={() => {
            setActiveCategory('polymer')
            if (!polymerKeys.includes(item)) onItemChange('pp')
          }}
        >
          Mẫu nhựa
        </button>
        <button
          type="button"
          aria-pressed={activeCategory === 'equipment'}
          className={`${styles.categoryButton} ${activeCategory === 'equipment' ? styles.categoryButtonActive : ''}`}
          onClick={() => {
            setActiveCategory('equipment')
            if (!equipmentKeys.includes(item)) onItemChange('pilot-tank')
          }}
        >
          Thiết bị
        </button>
      </div>

      <nav className={styles.tabs} aria-label="Chọn mẫu hoặc thiết bị">
        {currentKeys.map((kind) => (
          <button
            key={kind}
            type="button"
            className={styles.tabButton}
            aria-pressed={kind === item}
            onClick={() => onItemChange(kind)}
          >
            {PLASTIC_ITEMS[kind].tabLabel}
          </button>
        ))}
      </nav>

      <div className={styles.body}>
        <h3>{content.title}</h3>
        <figure>
          <div className={styles.photo}>
            <Image
              src={content.image}
              alt={content.alt}
              fill
              sizes="(max-width: 600px) 90vw, 640px"
            />
          </div>
          <figcaption>
            <strong>{content.caption}</strong>
          </figcaption>
        </figure>

        <section>
          <h4>Đặc điểm & vai trò trong quy trình</h4>
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
          <h4>Cách thao tác trên VECLab</h4>
          <ol>
            {content.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>

        <p className={styles.note}>
          <strong>Ghi chú khoa học:</strong> {content.note}
        </p>
      </div>
    </dialog>
  )
}
