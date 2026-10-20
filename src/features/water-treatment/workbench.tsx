'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { WorkbenchFrame, type WorkbenchPane } from '@/features/workbench/frame.js'
import { ActionButton } from '@/features/workbench/action-button.js'
import { FlaskIcon, ArrowRightIcon, CheckCircleIcon } from '@/features/landing/icons.js'
import { TargetIcon, ReportIcon, SubmitIcon, CloseIcon, InfoIcon, ControlIcon } from '@/features/workbench/icons.js'
import { WaterTreatmentApparatus, type ApStatus, type AcidBase, type TreatmentCalculation, type FilterHistoryEntry } from './apparatus.js'
import { SamplePreparationApparatus, type SampleApStatus, type SampleCalculation, type MetalSolution } from './sample-apparatus.js'
import styles from './workbench.module.css'

const EQUIPMENT_LIST = [
  { id: 'distilled-water', title: 'Nước cất', description: 'Dùng để pha dung dịch' },
  { id: 'lead-chemical', title: 'Hóa chất chứa ion Chì (Pb²⁺)', description: 'Để tạo mẫu nước' },
  { id: 'iron-chemical', title: 'Hóa chất chứa ion Sắt (Fe²⁺/Fe³⁺)', description: 'Để tạo mẫu nước' },
  { id: 'zinc-chemical', title: 'Hóa chất chứa ion Kẽm (Zn²⁺)', description: 'Để tạo mẫu nước' },
  { id: 'beaker', title: 'Cốc thủy tinh 2500 mL có vạch chia', description: 'Đo lường thể tích chính xác' },
  { id: 'burette', title: 'Buret', description: 'Thêm NaOH từng mL' },
  { id: 'filter-paper', title: 'Giấy lọc', description: 'Tách pha rắn/lỏng' },
  { id: 'stirrer', title: 'Máy khuấy', description: 'Khuấy đều mẫu' },
] as const

type EquipmentId = typeof EQUIPMENT_LIST[number]['id']

const WT_PATH = '/simulate/water-treatment'

type Props = {
  attemptId: string | null
  invalidAttempt?: boolean
  storageMode: 'local'
  openReport?: boolean
  initialPane?: WorkbenchPane
}

type LoadState = 'idle' | 'loading' | 'ready' | 'missing' | 'load_error' | 'start_error'
type Issue = { message: string; conflict: boolean }

const WATER_TREATMENT_EQUIPMENT = {
  'distilled-water': {
    title: 'Nước cất',
    image: 'distilled-water',
    alt: 'Lọ nước cất trong phòng thí nghiệm',
    caption: 'Nước cất được sản xuất bằng chưng cất hoặc khử ion. Dùng làm dung môi trung tính để tránh tạp chất ion.',
    author: 'Wikimedia Commons',
    license: 'CC BY-SA 3.0',
    source: 'https://commons.wikimedia.org/wiki/File:Bottles_in_laboratory_(1).jpg',
    licenseUrl: 'https://commons.wikimedia.org/wiki/File:Bottles_in_laboratory_(1).jpg#Licensing',
    purpose: 'Làm dung môi trung tính để pha chế dung dịch chuẩn Fe, Zn, Pb. Tránh tạp chất ion từ nước máy ảnh hưởng đến kết quả.',
    facts: [['Mục đích', 'Dung môi khí giới'], ['Loại bỏ', 'Chất tan, khoáng chất'], ['Ứng dụng', 'Pha dung dịch chuẩn']],
    steps: ['Mở lọ nước cất và rót vào cốc thủy tinh.', 'Sử dụng để pha chế dung dịch ion Fe, Zn, Pb theo nồng độ yêu cầu.', 'Giữ lọ nước cất trong môi trường sạch để tránh ô nhiễm.'],
    note: 'Kiểm tra nước cất trước dùng — không có mùi, màu hay các hạt lơ lửng.',
  },
  'lead-chemical': {
    title: 'Hóa chất chứa ion Chì',
    image: 'lead-nitrate',
    alt: 'Tinh thể chì nitrat trong phòng thí nghiệm',
    caption: 'Chì nitrat Pb(NO₃)₂ dạng tinh thể. Thao tác trong bài được biểu diễn bằng dung dịch chuẩn Pb²⁺.',
    author: 'Wikimedia Commons',
    license: 'CC BY-SA 3.0',
    source: 'https://commons.wikimedia.org/wiki/File:Lead_nitrate.jpg',
    licenseUrl: 'https://commons.wikimedia.org/wiki/File:Lead_nitrate.jpg#Licensing',
    purpose: 'Tạo mẫu nước tổng hợp chứa ion Pb²⁺ ở nồng độ xác định. Khảo sát khả năng loại bỏ Pb bằng xử lý độ pH.',
    facts: [['Ion hoạt động', 'Pb²⁺'], ['Công thức', 'Pb(NO₃)₂ hoặc PbCl₂'], ['pH kết tủa', '8–9 (dạng Pb(OH)₂)'], ['Nồng độ', 'Mg/L (đơn vị khối lượng/thể tích)']],
    steps: ['Pha dung dịch Pb(NO₃)₂ với nước cất theo nồng độ thiết kế.', 'Pha vào mẫu nước để tạo mẫu chứa Pb²⁺.', 'Xử lý mẫu bằng cách tăng pH để quan sát kết tủa Pb(OH)₂.'],
    note: 'Pb²⁺ ở pH < 8 không kết tủa. Tăng pH > 9, kết tủa có thể hòa tan lại (amphoteric). Xử lý hóa chất chứa Pb theo quy định an toàn phòng thí nghiệm.',
  },
  'iron-chemical': {
    title: 'Hóa chất chứa ion Sắt',
    image: 'iron-chloride',
    alt: 'Tinh thể sắt(III) clorua trong phòng thí nghiệm',
    caption: 'Sắt(III) clorua FeCl₃ dạng tinh thể nâu. Dùng để tạo dung dịch chuẩn Fe³⁺ cho thí nghiệm xử lý nước.',
    author: 'Wikimedia Commons',
    license: 'CC BY-SA 3.0',
    source: 'https://commons.wikimedia.org/wiki/File:Iron(III)_chloride.jpg',
    licenseUrl: 'https://commons.wikimedia.org/wiki/File:Iron(III)_chloride.jpg#Licensing',
    purpose: 'Tạo mẫu nước tổng hợp chứa ion Fe³⁺ (hoặc Fe²⁺ nếu dùng FeSO₄). Khảo sát khả năng loại bỏ Fe bằng xử lý độ pH.',
    facts: [['Ion hoạt động', 'Fe³⁺ (FeCl₃) hoặc Fe²⁺ (FeSO₄)'], ['Công thức Fe³⁺', 'FeCl₃ hoặc Fe(NO₃)₃'], ['pH kết tủa Fe³⁺', '> 3 (dạng Fe(OH)₃)'], ['pH kết tủa Fe²⁺', '> 8 (dạng Fe(OH)₂)']],
    steps: ['Pha dung dịch FeCl₃ (Fe³⁺) hoặc FeSO₄ (Fe²⁺) với nước cất.', 'Pha vào mẫu nước để tạo mẫu chứa Fe.', 'Tăng pH để quan sát kết tủa hydroxide sắt.'],
    note: 'Fe³⁺ kết tủa ở pH thấp hơn Fe²⁺. Fe(OH)₃ có màu nâu đỏ. Dung dịch FeCl₃ có tính acid (pH ≈ 1) vì thủy phân.',
  },
  'zinc-chemical': {
    title: 'Hóa chất chứa ion Kẽm',
    image: 'zinc-sulfate',
    alt: 'Tinh thể kẽm sulfat xanh trong phòng thí nghiệm',
    caption: 'Kẽm sulfate ZnSO₄·7H₂O dạng tinh thể xanh nhạt. Dùng để tạo dung dịch chuẩn Zn²⁺.',
    author: 'Wikimedia Commons',
    license: 'CC BY-SA 3.0',
    source: 'https://commons.wikimedia.org/wiki/File:Zinc_sulfate.jpg',
    licenseUrl: 'https://commons.wikimedia.org/wiki/File:Zinc_sulfate.jpg#Licensing',
    purpose: 'Tạo mẫu nước tổng hợp chứa ion Zn²⁺ ở nồng độ xác định. Khảo sát khả năng loại bỏ Zn bằng xử lý độ pH.',
    facts: [['Ion hoạt động', 'Zn²⁺'], ['Công thức', 'ZnSO₄ hoặc ZnCl₂'], ['pH kết tủa', '8–9 (dạng Zn(OH)₂)'], ['Đặc tính', 'Amphoteric — Zn(OH)₂ hòa tan ở pH > 10']],
    steps: ['Pha dung dịch ZnSO₄ (hoặc ZnCl₂) với nước cất.', 'Pha vào mẫu nước để tạo mẫu chứa Zn²⁺.', 'Tăng pH để quan sát kết tủa Zn(OH)₂ ở pH 8–9.'],
    note: 'Zn(OH)₂ là amphoteric — hòa tan ở pH rất cao (> 10) do tạo ion [Zn(OH)₄]²⁻. Màu trắng của kết tủa là đặc trưng.',
  },
  beaker: {
    title: 'Cốc thủy tinh 2500 mL có vạch chia',
    image: 'beaker-marked',
    alt: 'Cốc thủy tinh 2500 mL có vạch chia mL trong phòng thí nghiệm',
    caption: 'Cốc thủy tinh 2500 mL với vạch chia mL. Dụng cụ tiêu chuẩn cho đo lường thể tích mẫu và dung dịch.',
    author: 'Wikimedia Commons',
    license: 'CC BY-SA 3.0',
    source: 'https://commons.wikimedia.org/wiki/File:Laboratory_Beakers.jpg',
    licenseUrl: 'https://commons.wikimedia.org/wiki/File:Laboratory_Beakers.jpg#Licensing',
    purpose: 'Chứa mẫu nước và các dung dịch, cho phép đo thể tích với vạch chia. Chịu nhiệt tốt, an toàn khi khuấy và đun nóng nhẹ.',
    facts: [['Dung tích', '2500 mL'], ['Độ chính xác', '±50 mL tại vạch'], ['Vạch chia', 'Từ 200–2400 mL'], ['Chịu nhiệt', 'Có thể dùng cho ứng dụng nhiệt nhẹ']],
    steps: ['Đổ mẫu nước ban đầu vào cốc theo thể tích thiết kế.', 'Dùng vạch chia để kiểm tra thể tích chính xác.', 'Khuấy đều mẫu bằng máy khuấy hoặc gậy.'],
    note: 'Vạch chia trên cốc có độ chính xác ≈ ±50 mL. Để cốc ở mặt phẳng khi đọc vạch. Không sử dụng cốc bị vỡ hoặc trầy xước.',
  },
  burette: {
    title: 'Buret',
    image: 'burette',
    alt: 'Buret 50 mL với van tam giác trong phòng thí nghiệm',
    caption: 'Buret 50 mL với van tam giác. Dùng để thêm từng giọt NaOH vào mẫu và kiểm soát tính theo từng mL.',
    author: 'Wikimedia Commons',
    license: 'CC BY-SA 3.0',
    source: 'https://commons.wikimedia.org/wiki/File:Burette.jpg',
    licenseUrl: 'https://commons.wikimedia.org/wiki/File:Burette.jpg#Licensing',
    purpose: 'Thêm NaOH từng mL vào mẫu để tăng pH từng bước. Quan sát sự hình thành kết tủa hydroxide tại các pH khác nhau.',
    facts: [['Dung tích', '50 mL'], ['Vạch chia', '0,1 mL hoặc 0,05 mL'], ['Độ chính xác', '±0,05 mL'], ['Chất lỏng dùng', 'Dung dịch NaOH chuẩn']],
    steps: ['Làm sạch buret bằng nước cất.', 'Rót dung dịch NaOH vào buret từ phía trên.', 'Tính từng mL NaOH vào mẫu qua van, ghi lại thể tích tích lũy.'],
    note: 'Đọc vạch buret ở mức mắt. Luôn kiểm tra van buret có rò nước không. Buret định lượng có độ chính xác cao hơn cốc thủy tinh.',
  },
  'filter-paper': {
    title: 'Giấy lọc',
    image: 'filter-paper',
    alt: 'Giấy lọc xếp nón và phúc hòa trắng trong phòng thí nghiệm',
    caption: 'Giấy lọc định lượng (trái) và giấy lọc thường (phải). Lựa chọn giấy lọc phù hợp tùy độ chính xác yêu cầu.',
    author: 'Wikimedia Commons',
    license: 'CC BY-SA 3.0',
    source: 'https://commons.wikimedia.org/wiki/File:Filter_papers.jpg',
    licenseUrl: 'https://commons.wikimedia.org/wiki/File:Filter_papers.jpg#Licensing',
    purpose: 'Tách pha rắn (kết tủa hydroxide Fe, Zn, Pb) khỏi pha lỏng (nước xử lý sau pH tăng). Cho phép phân tích khối lượng.',
    facts: [['Loại', 'Định lượng (quantitative) hoặc bán định lượng'], ['Độ chính xác', 'Định lượng: ±0,5 mg (hỗn dịch kết tủa)'], ['Kích thước', '9 cm hoặc 7 cm đường kính'], ['Cấp độ', '10 μm, 25 μm, 45 μm (tốc độ lọc khác)']],
    steps: ['Xếp giấy lọc nón vào phễu lọc.', 'Rót mẫu chứa kết tủa qua phễu; để kết tủa trên giấy.', 'Rửa giấy lọc với nước cất để loại bỏ tạp ion.'],
    note: 'Giấy lọc định lượng là tiêu chuẩn cho phân tích định lượng. Sau lọc, có thể sấy giấy lọc + kết tủa để xác định khối lượng.',
  },
  stirrer: {
    title: 'Máy khuấy',
    image: 'magnetic-stirrer',
    alt: 'Máy khuấy từ với thanh khuấy từ trong cốc thủy tinh',
    caption: 'Máy khuấy từ với cánh chim từ (trái) và thanh khuấy từ trong cốc (phải). Dùng để khuấy đều mẫu khi tăng pH.',
    author: 'Wikimedia Commons',
    license: 'CC BY-SA 3.0',
    source: 'https://commons.wikimedia.org/wiki/File:Magnetic_stirrer.jpg',
    licenseUrl: 'https://commons.wikimedia.org/wiki/File:Magnetic_stirrer.jpg#Licensing',
    purpose: 'Khuấy đều mẫu nước và NaOH, đẩy nhanh quá trình kết tủa, đạt cân bằng hóa học. Kiểm soát tốc độ khuấy để tránh tạo bọt.',
    facts: [['Loại', 'Máy khuấy từ (magnetic stirrer)'], ['Tốc độ', '0–1500 rpm (điều chỉnh được)'], ['Thanh khuấy', 'Thanh từ dạng "chân quỷ" hoặc "cánh chim"'], ['Chất liệu', 'Nhựa hoặc thép không gỉ']],
    steps: ['Đặt thanh khuấy từ vào cốc thủy tinh chứa mẫu.', 'Để cốc lên bàn máy khuấy từ.', 'Chọn tốc độ khuấy (50–150 rpm là phổ biến) và khởi động.'],
    note: 'Không khuấy quá mạnh để tránh tạo bọt khí. Thanh khuấy phải sạch và không bị oxy hóa. Tắt máy trước khi lấy cốc ra.',
  },
} as const

function EquipmentInfoDialog({ item, onClose }: { item: EquipmentId; onClose: () => void }) {
  const equipment = EQUIPMENT_LIST.find(e => e.id === item)
  if (!equipment) return null

  const details = WATER_TREATMENT_EQUIPMENT[item as keyof typeof WATER_TREATMENT_EQUIPMENT]
  if (!details) return null

  const dialogRef = useRef<HTMLDialogElement>(null)

  useLayoutEffect(() => {
    const element = dialogRef.current
    element?.showModal()
    return () => element?.close()
  }, [])

  return (
    <dialog ref={dialogRef} className={styles.equipmentPanel} 
      onClick={(e) => {
        const bounds = e.currentTarget.getBoundingClientRect()
        if (e.clientX < bounds.left || e.clientX > bounds.right || e.clientY < bounds.top || e.clientY > bounds.bottom) {
          onClose()
        }
      }}
      onCancel={(e) => { e.preventDefault(); onClose() }}
    >
      <header className={styles.equipmentHeader}>
        <h2><InfoIcon /> Mẫu & dụng cụ</h2>
        <button type="button" aria-label="Đóng" onClick={onClose}>
          <CloseIcon />
        </button>
      </header>

      <div className={styles.equipmentBody}>
        <h3>{details.title}</h3>
        
        <figure>
          <div className={styles.equipmentPhoto}>
            <img src={`/assets/water-treatment/equipment/${details.image}.webp`} alt={details.alt} />
          </div>
          <figcaption>
            {details.caption}
            <span>Ảnh: {details.author} · <a href={details.licenseUrl} target="_blank" rel="noreferrer">{details.license}</a> · <a href={details.source} target="_blank" rel="noreferrer">Nguồn ảnh</a></span>
          </figcaption>
        </figure>

        <section>
          <h4>Dùng để làm gì?</h4>
          <p>{details.purpose}</p>
        </section>

        <dl className={styles.facts}>
          {details.facts.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>

        <section>
          <h4>Cách dùng trên workbench</h4>
          <ol>
            {details.steps.map(step => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>

        <p className={styles.equipmentNote}>{details.note}</p>
      </div>
    </dialog>
  )
}

/**
 * Water Treatment Workbench — simplified UI template.
 * Reuses Jar Test WorkbenchFrame structure for consistency.
 */
export function WaterTreatmentWorkbench(props: Props) {
  const sessionKey = JSON.stringify([
    props.storageMode, props.attemptId, props.invalidAttempt ?? false,
  ])
  return <WaterTreatmentWorkbenchSession key={sessionKey} {...props} />
}

function WaterTreatmentWorkbenchSession({ 
  attemptId, 
  invalidAttempt = false, 
  openReport = false, 
  initialPane = 'simulation' 
}: Props) {
  const [loadState, setLoadState] = useState<LoadState>(attemptId === null ? 'idle' : 'loading')
  const [issue, setIssue] = useState<Issue | null>(null)
  const [pane, setPane] = useState<WorkbenchPane>(initialPane)
  const [group, setGroup] = useState<string | null>('composition')
  const [busy, setBusy] = useState(false)
  const submitTrigger = useRef<HTMLButtonElement>(null)
  
  // Equipment dialog state (hoisted so header can render the trigger)
  const [equipmentItem, setEquipmentItem] = useState<EquipmentId | null>(null)

  // Placeholder state — will replace with real session later
  const [ready, setReady] = useState(false)

  // Apparatus animation state for WATER TREATMENT
  const [apStatus, setApStatus] = useState<ApStatus>({
    pH: 5.4,
    volumeMl: 1000,
    stirring: false,
    naohAddedMl: 0,
    hclAddedMl: 0,
    settled: false,
    filtered: false,
    composition: null,
    filteredSolid: { Fe: 0, Zn: 0, Pb: 0 },
  })

  // Apparatus animation state for SAMPLE PREPARATION
  const [sampleApStatus, setSampleApStatus] = useState<SampleApStatus>({
    pH: 7.0,
    targetVolumeMl: 1000,
    stirring: false,
    feAddedMl: 0,
    znAddedMl: 0,
    pbAddedMl: 0,
  })
  const [sampleCalculation, setSampleCalculation] = useState<SampleCalculation | null>(null)
  const [treatmentCalculation, setTreatmentCalculation] = useState<TreatmentCalculation | null>(null)
  /** Lịch sử các lần lọc cộng dồn của Bàn 2 */
  const [filterHistory, setFilterHistory] = useState<FilterHistoryEntry[]>([])
  const addDrop = useCallback((reagent: AcidBase, amountMl: number) => {
    setApStatus((prev) => {
      setTreatmentCalculation(null)
      // Thêm reagent đổi pH → kết tả cũ và kết quả lọc cũ không còn đúng.
      const resetSeparation = { settled: false, filtered: false }
      if (reagent === 'naoh') {
        const added = prev.naohAddedMl + amountMl
        const target = 12
        const pH = +(prev.pH + (target - prev.pH) * Math.min(1, amountMl * 0.18)).toFixed(6)
        return { ...prev, ...resetSeparation, naohAddedMl: added, volumeMl: prev.volumeMl + amountMl, pH }
      } else {
        const added = prev.hclAddedMl + amountMl
        const target = 1.5
        const pH = +(prev.pH + (target - prev.pH) * Math.min(1, amountMl * 0.18)).toFixed(6)
        return { ...prev, ...resetSeparation, hclAddedMl: added, volumeMl: prev.volumeMl + amountMl, pH }
      }
    })
  }, [])

  const addSampleDrop = useCallback((solution: MetalSolution, amountMl: number) => {
    setSampleApStatus((prev) => {
      const key = (solution + 'AddedMl') as 'feAddedMl' | 'znAddedMl' | 'pbAddedMl'
      const cap = solution === 'zn' ? 100 : solution === 'fe' ? 100 : 10
      const currentValue = prev[key]
      const nextValue = Math.min(cap, Math.round((currentValue + amountMl) * 100) / 100)
      if (nextValue === currentValue) return prev
      setSampleCalculation(null)
      setFilterHistory([])
      const added = {
        fe: prev.feAddedMl,
        zn: prev.znAddedMl,
        pb: prev.pbAddedMl,
      }
      added[solution] = nextValue
      return {
        ...prev,
        feAddedMl: added.fe,
        znAddedMl: added.zn,
        pbAddedMl: added.pb,
      }
    })
  }, [])
  const toggleStir = useCallback(() => {
    setApStatus((prev) => ({ ...prev, stirring: !prev.stirring }))
  }, [])

  /* Bước lắng: kết tủa đã hình thành ở pH hiện tại. Engine trả về
     `precipitated_mgPerL` + `filtrate_mgPerL` — đưa vào bảng kết quả.
     Lắng không đổi tổng kim loại trong cốc nên composition giữ nguyên. */
  const settleSample = useCallback((result: TreatmentCalculation) => {
    setTreatmentCalculation(result)
    setApStatus((prev) => ({ ...prev, settled: true }))
  }, [])

  /**
   * Đồng bộ pH cốc Bàn 2 với pH mẫu từ Bàn 1 chỉ trong lần đầu tiên mẫu
   * được tính. Sau đó pH thuộc về thao tác của người học ở Bàn 2 (thêm
   * NaOH/HCl), không bị kéo về mỗi lần Bàn 1 tính lại.
   * Reset khi người học pha mẫu mới (`resetSampleApparatus`).
   */
  const pHSyncedRef = useRef(false)
  useEffect(() => {
    if (sampleCalculation && !pHSyncedRef.current) {
      setApStatus((prev) => (prev.pH === 5.4 ? { ...prev, pH: sampleCalculation.pH } : prev))
      pHSyncedRef.current = true
    }
  }, [sampleCalculation])

  /* Bước lọc: pha rắn tách khỏi cốc → composition trong cốc là filtrate, và
     lượng kết tủa giữ lại trên giấy lọc để hiển thị.
     Mỗi lần lọc ghi thêm một dòng vào lịch sử, tính cộng dồn so với nồng độ
     ban đầu đo được ở Bàn 1. */
  const filterSample = useCallback((result: TreatmentCalculation) => {
    setTreatmentCalculation(result)
    setApStatus((prev) => ({
      ...prev,
      filtered: true,
      composition: { Fe: result.composition.Fe, Zn: result.composition.Zn, Pb: result.composition.Pb },
      filteredSolid: {
        Fe: result.precipitated_mgPerL.Fe,
        Zn: result.precipitated_mgPerL.Zn,
        Pb: result.precipitated_mgPerL.Pb,
      },
    }))
    setFilterHistory((prev) => {
      const remaining = {
        Fe: result.filtrate_mgPerL.Fe,
        Zn: result.filtrate_mgPerL.Zn,
        Pb: result.filtrate_mgPerL.Pb,
      }
      // Nồng độ ban đầu lấy từ Bàn 1; thiếu mốc thì lần lọc này chỉ còn
      // giá trị "còn lại", phần "đã lọc" để trống chứ không gán 0.
      const initial = sampleCalculation?.dissolvedMgL
      const filtered = initial
        ? {
            Fe: Math.max(0, initial.fe - remaining.Fe),
            Zn: Math.max(0, initial.zn - remaining.Zn),
            Pb: Math.max(0, initial.pb - remaining.Pb),
          }
        : null
      return [
        ...prev,
        {
          index: prev.length + 1,
          timestamp: new Date(),
          calculation: result,
          cumulativeRemaining: remaining,
          cumulativeFiltered: filtered,
        },
      ]
    })
  }, [sampleCalculation])

  const toggleSampleStir = useCallback(() => {
    setSampleApStatus((prev) => ({ ...prev, stirring: !prev.stirring }))
  }, [])

  const resetSampleApparatus = useCallback(() => {
    setSampleCalculation(null)
    setFilterHistory([])
    setSampleApStatus({ pH: 7.0, targetVolumeMl: 1000, stirring: false, feAddedMl: 0, znAddedMl: 0, pbAddedMl: 0 })
    pHSyncedRef.current = false
  }, [])
  
  useEffect(() => {
    // Simulate load
    const timer = setTimeout(() => {
      setLoadState('ready')
      setReady(true)
      setIssue(null)
    }, 500)
    
    return () => clearTimeout(timer)
  }, [])

  const header = <>
    <Link href="/" className={styles.brand} aria-label="Trang chủ VECLab">
      <span><FlaskIcon /></span>
      <strong>VECLab</strong>
    </Link>
    <Link href="/experiments" className={styles.back}>
      <ArrowRightIcon />
      Thí nghiệm
    </Link>
    <div className={styles.title}>
      <h1>Xử lý nước Fe, Zn, Pb</h1>
      <p>Hydroxide route · Mẫu tổng hợp ảo</p>
    </div>
    <div className={styles.headerActions}>
      <span className={styles.saveState} role="status" aria-live="polite">
        <CheckCircleIcon />
        {busy ? 'Đang lưu…' : ready ? 'Đã lưu trên thiết bị' : 'Lưu trên thiết bị'}
      </span>
      <button 
        ref={submitTrigger}
        className={styles.primary} 
        type="button" 
        disabled={!ready || busy}
        aria-label="Hoàn thành và lưu lượt"
        onClick={() => setBusy(true)}
      >
        <SubmitIcon />Nộp bài
      </button>
    </div>
  </>

  const notices = issue && ready ? (
    <div className={styles.error} role="alert">
      <p>{issue.message}</p>
    </div>
  ) : null

  const simulation = <>
    <div className={styles.stageHeader}>
      <div>
        <h2>Khu vực thực hành</h2>
        <p>Bàn pha mẫu (trên) → Bàn xử lý nước (dưới) · Composition → Kết tủa → Lọc</p>
      </div>
    </div>

    {ready ? (
      <>
        <section className={styles.stationBlock} aria-labelledby="station-sample">
          <header className={styles.stationLabel}>
            <h3 id="station-sample">Bàn 1 — Pha mẫu nước nhiễm kim loại</h3>
            <p>3 buret dung dịch ion Fe³⁺/Zn²⁺/Pb²⁺ · Máy khuấy từ · Cốc 2500 mL</p>
          </header>
          <SamplePreparationApparatus
            status={sampleApStatus}
            onAddDrop={addSampleDrop}
            onToggleStir={toggleSampleStir}
            onReset={resetSampleApparatus}
            onCalculate={setSampleCalculation}
            calculation={sampleCalculation}
          />
        </section>

        <section className={styles.stationBlock} aria-labelledby="station-treatment">
          <header className={styles.stationLabel}>
            <h3 id="station-treatment">Bàn 2 — Xử lý nước bằng hydroxide</h3>
            <p>2 buret NaOH/HCl 1M · Máy khuấy từ · Cốc 2500 mL · Kết tủa · Lọc · Đo lại pH</p>
          </header>
          <WaterTreatmentApparatus
            status={apStatus}
            onAddDrop={addDrop}
            onToggleStir={toggleStir}
            onSettle={settleSample}
            onFilter={filterSample}
            onCalculate={(result) => setTreatmentCalculation(result)}
            calculation={treatmentCalculation}
            filterHistory={filterHistory}
            sampleCalculation={sampleCalculation}
            sampleStatus={sampleApStatus}
          />
        </section>
      </>
    ) : loadState === 'idle' ? (
      <div className={styles.entry}>
        <h2>Xử lý nước tổng hợp chứa Fe, Zn, Pb</h2>
        <p>Thao tác xử lý: pha nước → điều chỉnh pH → tạo kết tủa → lắng → lọc.</p>
        <p className={styles.muted}>Mẫu 1 L. Thời gian mô phỏng. Kiểm tra kết quả so với QCVN 40:2025.</p>
        <button 
          type="button" 
          className={styles.primary} 
          onClick={() => {
            setLoadState('ready')
            setReady(true)
          }}
          disabled={busy}
        >
          {busy ? 'Đang tạo lượt…' : 'Bắt đầu lượt Xử lý nước'}
        </button>
      </div>
    ) : loadState === 'loading' ? (
      <p role="status">Đang mở lượt đã lưu…</p>
    ) : (
      <div role="alert">
        <h2>Không thể mở lượt</h2>
        <p>{issue?.message || 'Lỗi tải dữ liệu'}</p>
      </div>
    )}
  </>

  const controls = <>
    <div className={styles.controlsHeading}>
      <h2>Thao tác</h2>
    </div>
    {!ready || !loadState ? (
      <p className={styles.empty}>Bắt đầu lượt để thực hành xử lý nước.</p>
    ) : (
      <>
        <ControlGroup 
          id="composition" 
          title="Pha nước"
          summary="Fe/Zn/Pb + Volume"
          open={group === 'composition'}
          onToggle={() => setGroup(group === 'composition' ? null : 'composition')}
        >
          <p>Nhập nồng độ Fe, Zn, Pb (mg/L) và thể tích (mL).</p>
          <ActionButton 
            className={styles.button}
            reason={null}
            onClick={() => alert('Action: Measure initial pH')}
          >
            Đo pH ban đầu
          </ActionButton>
        </ControlGroup>

        <ControlGroup 
          id="treatment" 
          title="Xử lý kim loại dư"
          summary="Khuấy, lắng, lọc"
          open={group === 'treatment'}
          onToggle={() => setGroup(group === 'treatment' ? null : 'treatment')}
        >
          <p>Thêm NaOH để nâng pH, sau đó khuấy, lắng, lọc.</p>
          <ActionButton 
            className={styles.button}
            reason={null}
            onClick={() => alert('Action: Add NaOH')}
          >
            + NaOH (kiềm hóa)
          </ActionButton>
        </ControlGroup>

        <ControlGroup 
          id="results" 
          title="Kiểm tra kết quả"
          summary="pH & nồng độ sau xử lý"
          open={group === 'results'}
          onToggle={() => setGroup(group === 'results' ? null : 'results')}
        >
          <p>Đo lại pH và nồng độ Kim loại sau xử lý. So sánh với QCVN 40:2025 Cột A.</p>
          <ActionButton 
            className={styles.button}
            reason={null}
            onClick={() => alert('Action: Measure final')}
          >
            Đo lại pH & nồng độ
          </ActionButton>
        </ControlGroup>
      </>
    )}
  </>

  const notebook = <section tabIndex={-1} className={styles.notebook} aria-label="Sổ đo Water Treatment">
    <p className={styles.empty}>Sổ thực hành sẽ hiển thị sau khi bắt đầu lượt.</p>
  </section>

  const shelf = <div className={styles.shelfContent}>
    <div className={styles.inventory}>
      {EQUIPMENT_LIST.map(({ id, title, description }) => (
        <button 
          key={id}
          type="button" 
          className={styles.equipment}
          aria-haspopup="dialog" 
          aria-label={'Tìm hiểu ' + title} 
          onClick={() => setEquipmentItem(id)}
        >
          <div className={styles.equipmentIcon} />
          <span className={styles.equipmentText}>
            <strong>{title}</strong>
            <span>{description}</span>
          </span>
          <span className={styles.equipmentInfo}><InfoIcon /></span>
        </button>
      ))}
    </div>
    <div className={styles.shelfHelp}>
      <p className={styles.shelfNote}>Mẫu tổng hợp chứa Fe, Zn, Pb. Lượt lưu trên trình duyệt.</p>
    </div>
  </div>

  return <>
    <WorkbenchFrame 
      contentSized 
      label="Bàn thí nghiệm Water Treatment" 
      header={header} 
      notices={notices} 
      shelf={shelf}
      simulation={simulation} 
      controls={controls} 
      notebook={notebook} 
      pane={pane}
      onPaneChange={setPane}
      onShelfInfo={() => setEquipmentItem('distilled-water')}
    />
    {equipmentItem && (
      <EquipmentInfoDialog 
        item={equipmentItem} 
        onClose={() => setEquipmentItem(null)} 
      />
    )}
  </>
}

function ControlGroup({ 
  id, 
  title, 
  summary, 
  open, 
  onToggle, 
  children 
}: {
  id: string
  title: string
  summary: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return <details className={styles.controlGroup} open={open} data-testid={'wt-control-' + id}>
    <summary onClick={(e) => { e.preventDefault(); onToggle() }}>
      <span className={styles.controlIcon}><ControlIcon kind={id} /></span>
      <span className={styles.controlText}>
        <strong>{title}</strong>
        <small>{summary}</small>
      </span>
    </summary>
    <div className={styles.groupBody}>{children}</div>
  </details>
}
