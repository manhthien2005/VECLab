import { useId, useLayoutEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { ToolsIcon, CloseIcon } from '@/features/workbench/icons.js'
import styles from './equipment-panel.module.css'

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

export const PLASTIC_ITEMS: Record<
  PlasticItemKind,
  {
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
> = {
  pp: {
    category: 'polymer',
    title: 'Polypropylene (PP)',
    tabLabel: 'PP',
    image: '/assets/plastic-separation/pp.jpg',
    alt: 'Ảnh chụp hạt nhựa Polypropylene (PP) nguyên sinh',
    caption: 'Mẫu hạt nhựa PP nguyên sinh thực tế dùng trong nghiên cứu pilot.',
    purpose:
      'Hạt polymer nhẹ có tỷ trọng danh định 0,900 g/cm³. Nổi trong nước máy cùng HDPE và nổi riêng ở nồng độ ethanol 23% v/v.',
    facts: [
      ['Tỷ trọng danh định', '0,900 g/cm³'],
      ['Hình thái hạt', 'Hạt tròn (pellet) · trắng đục'],
      ['Khối lượng ban đầu', '2,0 kg'],
      ['Môi trường tách', 'Nước máy (nổi) → Ethanol 23% v/v (nổi)'],
      ['Hiệu suất thu hồi', '95,60% theo bài báo Meneses Quelal (2022)'],
    ],
    steps: [
      'Chuẩn bị 2,0 kg mẫu PP cùng 5 loại nhựa còn lại trên khay mẫu.',
      'Nạp vào bể pilot 800 L, khuấy 160 rpm để làm ướt và tách sơ bộ.',
      'Thu hồi ở phân đoạn nổi nước máy, ly tâm và đưa sang nhánh nhẹ Ethanol 23% v/v.',
    ],
    note: 'Hiệu suất 95,60% là tỷ lệ thu hồi vật liệu qua cân bằng khối lượng, không biểu thị độ tinh khiết hóa học tuyệt đối.',
  },
  hdpe: {
    category: 'polymer',
    title: 'High-Density Polyethylene (HDPE)',
    tabLabel: 'HDPE',
    image: '/assets/plastic-separation/hdpe.jpg',
    alt: 'Ảnh chụp hạt nhựa High-Density Polyethylene (HDPE) nguyên sinh',
    caption: 'Mẫu hạt nhựa HDPE nguyên sinh thực tế.',
    purpose:
      'Polymer có tỷ trọng danh định 0,950 g/cm³. Nổi trong nước máy cùng PP, chìm ở ethanol 23% v/v và nổi hoàn toàn ở ethanol 31% v/v.',
    facts: [
      ['Tỷ trọng danh định', '0,950 g/cm³'],
      ['Hình thái hạt', 'Hạt trụ vát · trắng sữa'],
      ['Khối lượng ban đầu', '2,0 kg'],
      ['Môi trường tách', 'Nước máy (nổi) → Ethanol 31% v/v (nổi)'],
      ['Hiệu suất thu hồi', '99,70% theo bài báo Meneses Quelal (2022)'],
    ],
    steps: [
      'Thu hồi ở phân đoạn nổi nước máy cùng PP (thu hồi gộp 97,5%).',
      'Sau khi PP tách ra ở ethanol 23%, đưa phần chìm còn lại vào ethanol 31% v/v.',
      'HDPE nổi lên bề mặt và được vớt, ly tâm ở 2.950 rpm để làm khô.',
    ],
    note: 'Đạt thu hồi rất cao (99,70%) nhờ chênh lệch tỷ trọng rõ rệt với dung dịch ethanol 31% v/v.',
  },
  ps: {
    category: 'polymer',
    title: 'Polystyrene (PS)',
    tabLabel: 'PS',
    image: '/assets/plastic-separation/ps.jpg',
    alt: 'Ảnh chụp mảnh hạt nhựa Polystyrene (PS)',
    caption: 'Mẫu mảnh hạt nhựa PS trong suốt thực tế.',
    purpose:
      'Polymer thuộc phân đoạn nặng với tỷ trọng 1,050 g/cm³. Chìm trong nước máy và được tách nổi đầu tiên trong nhánh NaCl ở nồng độ 11–12% w/v.',
    facts: [
      ['Tỷ trọng danh định', '1,050 g/cm³'],
      ['Hình thái hạt', 'Mảnh vỡ · trong suốt'],
      ['Khối lượng ban đầu', '2,0 kg'],
      ['Môi trường tách', 'Nước máy (chìm) → NaCl 11–12% w/v (nổi)'],
      ['Hiệu suất thu hồi', '80,3% theo bài báo Meneses Quelal (2022)'],
    ],
    steps: [
      'Chìm xuống đáy bể trong bước tách nước máy cùng ABS, PA và PC.',
      'Chuyển sang nhánh nặng NaCl, chọn preset S1 (11–12% w/v).',
      'PS nổi lên bề mặt, vớt ra khay và đưa vào máy ly tâm 2.950 rpm.',
    ],
    note: 'Do tỷ trọng PS (1,050) gần với dung dịch NaCl 11% (~1,07 g/cm³), hiệu suất đạt 80,3%.',
  },
  abs: {
    category: 'polymer',
    title: 'Acrylonitrile Butadiene Styrene (ABS)',
    tabLabel: 'ABS',
    image: '/assets/plastic-separation/abs.jpg',
    alt: 'Ảnh chụp hạt nhựa Acrylonitrile Butadiene Styrene (ABS) đen mờ',
    caption: 'Mẫu hạt nhựa ABS đen mờ thực tế.',
    purpose:
      'Polymer kỹ thuật có tỷ trọng 1,070 g/cm³. Chìm trong nước máy và NaCl 11–12%, nổi chọn lọc ở dung dịch NaCl 20% w/v.',
    facts: [
      ['Tỷ trọng danh định', '1,070 g/cm³'],
      ['Hình thái hạt', 'Mảnh vỡ · đen mờ'],
      ['Khối lượng ban đầu', '2,0 kg'],
      ['Môi trường tách', 'Nước máy (chìm) → NaCl 20% w/v (nổi)'],
      ['Hiệu suất thu hồi', '84,8% theo bài báo Meneses Quelal (2022)'],
    ],
    steps: [
      'Nằm trong phần chìm sau bước NaCl 11–12% w/v.',
      'Cấp NaCl nâng nồng độ lên 20% w/v (preset S2).',
      'Khuấy đều, ABS nổi lên bề mặt và được thu hồi.',
    ],
    note: 'Thu hồi ABS đạt 84,8% sau khi đã loại bỏ hoàn toàn PS ở bước trước.',
  },
  pa: {
    category: 'polymer',
    title: 'Polyamide (PA / Nylon)',
    tabLabel: 'PA',
    image: '/assets/plastic-separation/pa.jpg',
    alt: 'Ảnh chụp hạt nhựa Polyamide (PA) màu vàng nhạt',
    caption: 'Mẫu mảnh nhựa PA (Polyamide) thực tế.',
    purpose:
      'Polymer tỷ trọng 1,140 g/cm³. Chìm trong nước máy, NaCl 11–12% và 20%; nổi ở dung dịch NaCl bão hòa cao 40% w/v.',
    facts: [
      ['Tỷ trọng danh định', '1,140 g/cm³'],
      ['Hình thái hạt', 'Mảnh dẹt · vàng nhạt'],
      ['Khối lượng ban đầu', '2,0 kg'],
      ['Môi trường tách', 'Nước máy (chìm) → NaCl 40% w/v (nổi)'],
      ['Hiệu suất thu hồi', '70,0% theo bài báo Meneses Quelal (2022)'],
    ],
    steps: [
      'Là phần chìm cùng PC sau khi đã tách PS và ABS.',
      'Nâng nồng độ NaCl lên 40% w/v (preset S3).',
      'PA nổi lên trên mặt dung dịch, PC chìm hoàn toàn xuống đáy.',
    ],
    note: 'Ở 40% w/v, PA nổi và đạt thu hồi 70,0% trong điều kiện khuấy của bể pilot.',
  },
  pc: {
    category: 'polymer',
    title: 'Polycarbonate (PC)',
    tabLabel: 'PC',
    image: '/assets/plastic-separation/pc.jpg',
    alt: 'Ảnh chụp mảnh hạt nhựa Polycarbonate (PC) xanh lam nhạt',
    caption: 'Mẫu mảnh nhựa PC nguyên sinh thực tế.',
    purpose:
      'Polymer nặng nhất trong 6 loại với tỷ trọng 1,200 g/cm³. Chìm trong tất cả các môi trường kể cả dung dịch NaCl 40% w/v.',
    facts: [
      ['Tỷ trọng danh định', '1,200 g/cm³'],
      ['Hình thái hạt', 'Mảnh vỡ · xanh lam nhạt'],
      ['Khối lượng ban đầu', '2,0 kg'],
      ['Môi trường tách', 'Nước máy (chìm) → NaCl 40% w/v (chìm)'],
      ['Hiệu suất thu hồi', '95,4% theo bài báo Meneses Quelal (2022)'],
    ],
    steps: [
      'Chìm liên tục qua các bước nước máy, NaCl 11–12%, NaCl 20% và NaCl 40%.',
      'Ở bước cuối cùng (NaCl 40% w/v), PA nổi lên còn PC lắng đọng ở đáy bể.',
      'Xả đáy hoặc cào thu hồi phân đoạn chìm cuối cùng này để đưa đi ly tâm.',
    ],
    note: 'Nhờ tỷ trọng vượt trội (1,200 g/cm³), PC chìm ổn định và đạt thu hồi 95,4%.',
  },
  'pilot-tank': {
    category: 'equipment',
    title: 'Bể pilot 800 L',
    tabLabel: 'Bể pilot 800L',
    image: '/assets/plastic-separation/pilot-tank.jpg',
    alt: 'Ảnh chụp bể pilot phân loại nhựa dung tích hữu ích 800 lít thực tế',
    caption: 'Hệ thống bể pilot quy mô 800 lít phục vụ nghiên cứu phân loại chìm–nổi.',
    purpose:
      'Chứa dung dịch phân tách (nước máy, dung dịch ethanol hoặc NaCl); được trang bị hệ thống cánh khuấy cơ học 160 rpm để làm ướt hoàn toàn hạt nhựa và duy trì động học phân tách.',
    facts: [
      ['Dung tích hữu ích', '800 lít'],
      ['Tốc độ khuấy', '160 rpm'],
      ['Thời gian khuấy làm ướt', '1 giờ (tránh bọt khí bám dính)'],
      ['Cơ chế phân tách', 'Phân tầng tỷ trọng biểu kiến (chìm / nổi)'],
    ],
    steps: [
      'Nạp nước hoặc chuẩn bị nồng độ dung dịch tương ứng.',
      'Nạp mẻ 12,0 kg hỗn hợp hạt polymer vào bể.',
      'Khởi động khuấy 160 rpm trong 1 giờ để làm ướt và phân lớp.',
    ],
    note: 'Thể tích 800 L cho phép nghiên cứu ở quy mô bán công nghiệp, phản ánh sát thực tế hơn ống đong phòng lab.',
  },
  centrifuge: {
    category: 'equipment',
    title: 'Máy ly tâm tách ẩm',
    tabLabel: 'Máy ly tâm',
    image: '/assets/plastic-separation/centrifuge.jpg',
    alt: 'Ảnh chụp máy ly tâm công nghiệp 2.950 rpm tách ẩm hạt nhựa',
    caption: 'Máy ly tâm tốc độ cao 2.950 rpm làm sạch và làm ráo hạt polymer.',
    purpose:
      'Tách độ ẩm bám dính, màng dung môi và bụi bẩn bám trên bề mặt hạt nhựa sau khi vớt ra khỏi bể pilot trước khi đem cân khối lượng.',
    facts: [
      ['Tốc độ quay', '2.950 rpm (theo bài báo Meneses Quelal et al.)'],
      ['Thời điểm vận hành', 'Sau tách nước và sau mỗi preset dung dịch'],
      ['Mục tiêu', 'Loại bỏ sai số khối lượng do chất lỏng bám dính'],
    ],
    steps: [
      'Thu gom các phân đoạn nổi hoặc chìm từ bể pilot.',
      'Đưa vào lồng ly tâm và cho quay ở 2.950 rpm.',
      'Chuyển hạt đã làm khô sang cân kỹ thuật để xác định khối lượng.',
    ],
    note: 'Bài báo không nêu thời gian ly tâm cụ thể; mô phỏng biểu diễn chuyển động ly tâm để người học nắm rõ quy trình kỹ thuật.',
  },
  scale: {
    category: 'equipment',
    title: 'Cân kỹ thuật khối lượng',
    tabLabel: 'Cân kỹ thuật',
    image: '/assets/plastic-separation/scale.jpg',
    alt: 'Ảnh chụp cân kỹ thuật đo khối lượng phân đoạn nhựa',
    caption: 'Cân kỹ thuật dùng để xác định khối lượng từng phân đoạn thu hồi.',
    purpose:
      'Xác định khối lượng thực tế của từng phân đoạn polymer sau khi ly tâm, làm cơ sở tính toán hiệu suất thu hồi (recovery rate) theo nguyên lý cân bằng vật chất.',
    facts: [
      ['Khối lượng mẻ ban đầu', '2,0 kg / loại polymer (tổng 12,0 kg)'],
      ['Đại lượng xác định', 'Khối lượng phân đoạn (kg)'],
      ['Chỉ số đánh giá', 'Hiệu suất thu hồi = (m thu hồi / m ban đầu) × 100%'],
    ],
    steps: [
      'Đặt khay thu hồi sạch lên cân và chuẩn cân (tare).',
      'Đổ mẫu hạt nhựa đã qua máy ly tâm lên cân.',
      'Ghi nhận số đo vào sổ thực hành để đối chiếu cân bằng khối lượng.',
    ],
    note: 'Cân khối lượng khô sau ly tâm là phương pháp chuẩn để đánh giá hiệu suất trong bài báo pilot.',
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
          Mẫu polymer & Thiết bị thí nghiệm
        </h2>
        <button
          type="button"
          aria-label="Đóng bảng mẫu & thiết bị"
          onClick={onClose}
        >
          <CloseIcon />
        </button>
      </header>

      <div className={styles.categoryNav} role="tablist" aria-label="Chọn nhóm thông tin">
        <button
          type="button"
          role="tab"
          aria-selected={activeCategory === 'polymer'}
          className={`${styles.categoryButton} ${activeCategory === 'polymer' ? styles.categoryButtonActive : ''}`}
          onClick={() => {
            setActiveCategory('polymer')
            if (!polymerKeys.includes(item)) onItemChange('pp')
          }}
        >
          6 mẫu polymer nguyên sinh
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeCategory === 'equipment'}
          className={`${styles.categoryButton} ${activeCategory === 'equipment' ? styles.categoryButtonActive : ''}`}
          onClick={() => {
            setActiveCategory('equipment')
            if (!equipmentKeys.includes(item)) onItemChange('pilot-tank')
          }}
        >
          Thiết bị pilot & đo lường
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
