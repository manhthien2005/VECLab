'use client'

import { useId, useRef, useState, useEffect, useMemo } from 'react'
import { runWaterTreatmentAction, type WaterTreatmentResult } from '@/app/simulate/water-treatment/actions.js'
import { capacityAtSaturation } from '@/features/water-treatment/capacity.js'
import type { SampleCalculation } from './sample-apparatus.js'
import { PlayIcon, StopIcon, PlusIcon, BeakerIcon, SettleIcon, FilterIcon } from './icons.js'
import styles from './workbench.module.css'

/** Khối lượng nguyên tử để đổi mol/L của solver sang mg/L (khớp server action). */
const ATOMIC_WEIGHT = { Fe: 55.845, Zn: 65.38, Pb: 207.2 } as const

/**
 * Apparatus for Water Treatment — magnetic stirrer version.
 *
 * Layout (top → bottom):
 *   • Top support bar (buret stand rack) carrying NaOH/HCl name tags
 *   • Two 50 mL burets hang from the bar, tips pointing into the beaker
 *   • Flat-bottom 2 L beaker sitting on a magnetic stirrer hotplate
 *   • Stir bar (nam châm khuấy) rests inside the beaker on the flat floor
 *     and rotates when the stirrer is on; the hotplate under the beaker
 *     drives it.
 *
 * Geometry is qualitative; pH, dose and buret state are tracked by the
 * session and reflected here.
 */
export type AcidBase = 'naoh' | 'hcl'

export type ApStatus = {
  pH: number
  volumeMl: number
  stirring: boolean
  naohAddedMl: number
  hclAddedMl: number
  /** Đã lắng xong — kết tủa nằm chặt đáy cốc, chờ lọc. */
  settled: boolean
  /** Đã lọc — pha rắn đã tách, cốc chỉ còn pha lỏng (filtrate). */
  filtered: boolean
}

const BEAKER_CAPACITY_ML = 2000
const BEAKER_LEFT_X = 130
const BEAKER_RIGHT_X = 250
const BEAKER_TOP_Y = 252
const BEAKER_BOTTOM_Y = 425
const BEAKER_HEIGHT = BEAKER_BOTTOM_Y - BEAKER_TOP_Y

const BURET_CAPACITY = 50
const BURET_BODY_TOP = 36
const BURET_BODY_BOTTOM = 240
const BURET_BODY_HEIGHT = BURET_BODY_BOTTOM - BURET_BODY_TOP
const BURET_WIDTH = 22
const BURET_NAOH_CX = 152
const BURET_HCL_CX = 228

const STIRRER_CX = 190

type TreatmentStepMl = 0.1 | 0.5 | 1 | 2 | 5
const TREATMENT_STEPS: readonly TreatmentStepMl[] = [0.1, 0.5, 1, 2, 5]

export type TreatmentCalculation = Pick<WaterTreatmentResult, 'pH' | 'composition' | 'capacity_mgPerL' | 'filtrate_mgPerL' | 'precipitated_mgPerL' | 'goalStatus' | 'verificationStatus'>

const INITIAL_STATUS: ApStatus = {
  pH: 5.4,
  volumeMl: 1000,
  stirring: false,
  naohAddedMl: 0,
  hclAddedMl: 0,
  settled: false,
  filtered: false,
}

function volumeY(volumeMl: number) {
  const clamped = Math.max(0, Math.min(BEAKER_CAPACITY_ML, volumeMl))
  return BEAKER_BOTTOM_Y - (BEAKER_HEIGHT * clamped) / BEAKER_CAPACITY_ML
}

function buretLiquidTopY(remainingMl: number) {
  const clamped = Math.max(0, Math.min(BURET_CAPACITY, remainingMl))
  return BURET_BODY_BOTTOM - (BURET_BODY_HEIGHT * clamped) / BURET_CAPACITY
}

function buretTickY(ml: number) {
  return BURET_BODY_TOP + (BURET_BODY_HEIGHT * ml) / BURET_CAPACITY
}

function Buret({
  uid, color, lightColor, deepColor, cx, label, topY, remainingMl, isDripping, remainingDisplay,
}: {
  uid: string
  color: string
  lightColor: string
  deepColor: string
  cx: number
  label: string
  topY: number
  remainingMl: number
  isDripping: boolean
  remainingDisplay: string
}) {
  const leftX = cx - BURET_WIDTH / 2
  const rightX = cx + BURET_WIDTH / 2
  const liqTopY = buretLiquidTopY(remainingMl)
  const empty = remainingMl <= 0
  return <g aria-label={label}>
    {/* Clamp that grips the buret to the support bar */}
    <rect x={cx - 8} y={topY - 4} width="16" height="8" rx="1.5" fill="#5d7682" stroke="#2c4654" strokeWidth=".6" />
    {/* Cap on top of buret */}
    <path d={'M' + (leftX - 2) + ' ' + (topY + 4) + ' h' + (BURET_WIDTH + 4) + ' v6 h-' + (BURET_WIDTH + 4) + ' Z'} fill="#a7bcc8" stroke="#7591a0" strokeWidth=".6" />
    <rect x={cx - 1.5} y={topY + 2} width="3" height="3" fill="#7591a0" />

    {/* Body tube */}
    <rect x={leftX} y={BURET_BODY_TOP} width={BURET_WIDTH} height={BURET_BODY_HEIGHT} fill={'url(#' + uid + 'glass)'} stroke="#8da9b8" strokeWidth="1.4" />
    {/* Liquid inside */}
    {!empty && <g clipPath={'url(#' + uid + 'fill' + cx + ')'}>
      <rect x={leftX} y={liqTopY} width={BURET_WIDTH} height={BURET_BODY_BOTTOM - liqTopY} fill={color} />
      <ellipse cx={cx} cy={liqTopY + 1} rx={BURET_WIDTH / 2 - 1} ry="1.5" fill={lightColor} />
      <ellipse cx={cx} cy={liqTopY + 2} rx={BURET_WIDTH / 2 - 2} ry="1" fill={deepColor} opacity=".75" />
    </g>}

    {/* Tick marks: 0 at top → 50 at bottom */}
    {Array.from({ length: 11 }, (_, i) => {
      const ml = i * 5
      const y = buretTickY(ml)
      const major = i % 2 === 0
      return <g key={ml}>
        <line x1={rightX} x2={rightX + (major ? 7 : 4)} y1={y} y2={y} stroke="#365964" strokeWidth={major ? .9 : .5} />
        {major && <text x={rightX + 9} y={y + 2.5} fontSize="6.5" fill="#365964">{ml}</text>}
      </g>
    })}
    <text x={leftX - 1} y={BURET_BODY_TOP - 2} fontSize="6" fill="#365964" textAnchor="end">mL</text>

    {/* Stopcock */}
    <rect x={leftX - 3} y={BURET_BODY_BOTTOM} width={BURET_WIDTH + 6} height="9" rx="1" fill="#456475" stroke="#2c4654" strokeWidth=".6" />
    <circle cx={cx} cy={BURET_BODY_BOTTOM + 4.5} r="3" fill="#2c4654" stroke="#1a2c36" strokeWidth=".4" />
    <line x1={cx - 4} x2={cx + 4} y1={BURET_BODY_BOTTOM + 4.5} y2={BURET_BODY_BOTTOM + 4.5} stroke="#a7bcc8" strokeWidth=".6" />

    {/* Delivery tip — extends down INTO the beaker */}
    <path d={'M' + (cx - 3) + ' ' + (BURET_BODY_BOTTOM + 9) + ' h6 v18 h-6 Z'} fill="#9bb0bc" stroke="#365964" strokeWidth=".5" />
    {!empty && <path d={'M' + (cx - 1.5) + ' ' + (BURET_BODY_BOTTOM + 11) + ' v14'} stroke={color} strokeWidth="2" />}

    {/* Falling drop + stream when user just clicked +1 */}
    {isDripping && !empty && <g>
      <path d={'M' + cx + ' ' + (BURET_BODY_BOTTOM + 27) + ' v4'} stroke={color} strokeWidth="2.5" strokeLinecap="round" className={styles.dripStream} />
      <circle cx={cx} cy={BURET_BODY_BOTTOM + 32} r="2.8" fill={color} className={styles.dropFall} />
    </g>}

    {/* Remaining volume readout on the side (rack name plate shows the buret identity) */}
    <text x={rightX + 6} y={BURET_BODY_TOP + 10} fontSize="6.5" fill="#365964">{remainingDisplay}</text>
  </g>
}

function DoseStepMenu({
  solution,
  value,
  disabled,
  onChange,
}: {
  solution: AcidBase
  value: TreatmentStepMl
  disabled: boolean
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const menuId = `treatment-dose-step-${solution}`

  return (
    <div className={styles.doseStepMenu}>
      <button
        type="button"
        className={styles.doseStepTrigger}
        aria-label={`Bước thêm ${solution === 'naoh' ? 'NaOH' : 'HCl'}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
      >
        {value} mL
      </button>
      {open ? (
        <div id={menuId} className={styles.doseStepMenuList} role="listbox" aria-label={`Chọn bước thêm ${solution === 'naoh' ? 'NaOH' : 'HCl'}`}>
          {TREATMENT_STEPS.map((step) => (
            <button
              type="button"
              role="option"
              aria-selected={step === value}
              className={styles.doseStepOption}
              key={step}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange(String(step))
                setOpen(false)
              }}
            >
              {step} mL
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
export function WaterTreatmentApparatus({
  status: external,
  onAddDrop,
  onToggleStir,
  onSettle,
  onFilter,
  onCalculate,
  calculation,
  sampleCalculation,
  sampleStatus: externalSampleStatus,
}: {
  status?: Partial<ApStatus>
  onAddDrop: (reagent: AcidBase, amountMl: number) => void
  onToggleStir: () => void
  /** Ghi nhận bước lắng — kết tủa chín đã kết tủa ở pH hiện tại. */
  onSettle: (result: TreatmentCalculation) => void
  /** Ghi nhận bước lọc — pha rắn tách, cốc còn filtrate. */
  onFilter: (result: TreatmentCalculation) => void
  onCalculate: (result: TreatmentCalculation) => void
  calculation: TreatmentCalculation | null
  sampleCalculation?: SampleCalculation | null
  sampleStatus?: { feAddedMl: number; znAddedMl: number; pbAddedMl: number } | null
}) {
  const uid = useId().replaceAll(':', '')
  const status: ApStatus = { ...INITIAL_STATUS, ...external }
  const waterY = volumeY(status.volumeMl)
  const liquidDepth = BEAKER_BOTTOM_Y - waterY

  // Thông tin mẫu từ Bàn 1: dùng cho màu dung dịch + kết tủa ở Bàn 2
  const sampleStatus = externalSampleStatus ?? null
  const hasFe = Boolean(sampleStatus && sampleStatus.feAddedMl > 0)
  const hasZn = Boolean(sampleStatus && sampleStatus.znAddedMl > 0)
  const hasPb = Boolean(sampleStatus && sampleStatus.pbAddedMl > 0)

  /** Nồng độ kim loại đang trong cốc (mg/L) — lấy từ kết quả pha mẫu ở Bàn 1.
   *  Không có mẫu thì cốc Bàn 2 là nước cất → không có kim loại nào để xử lý. */
  const treatmentComposition = useMemo(() => {
    const dissolved = sampleCalculation?.dissolvedMgL
    if (!dissolved) return null
    return { Fe: dissolved.fe, Zn: dissolved.zn, Pb: dissolved.pb }
  }, [sampleCalculation])
  const hasTreatmentSample = treatmentComposition !== null

  // Tính màu dung dịch và kết tủa phản ánh mẫu đang được xử lý ở Bàn 2
  const sampleMeta = useMemo(() => {
    const noSample = { liquidColor: '#bcd5e0', precipitateColor: null as string | null, precipitateEdge: null as string | null, pptMg: 0, precipitateColorOnFilter: null as string | null, precipitatedOnFilter: false }

    // Mẫu chưa pha ở Bàn 1 → cốc Bàn 2 vẫn là nước cất
    if (!hasFe && !hasZn && !hasPb) return noSample

    // Kết tủa đã có ở Bàn 1 (lúc pha mẫu)
    const fePpt = sampleCalculation?.precipitateMg?.fe || 0
    const znPpt = sampleCalculation?.precipitateMg?.zn || 0
    const pbPpt = sampleCalculation?.precipitateMg?.pb || 0

    // Kết tủa do xử lý ở Bàn 2. Ưu tiên số đo đã commit; nếu người học chưa
    // bấm Tính/Lắng/Lọc thì dùng cùng công thức capacity để dự báo kết tủa
    // đang hình thành — đây là hiện tượng quan sát được, không phải số đo mới.
    const measuredPpt = calculation?.precipitated_mgPerL
    let est = { Fe: 0, Zn: 0, Pb: 0 }
    if (!calculation && treatmentComposition) {
      const cap = capacityAtSaturation(status.pH)
      const capMgL = {
        Fe: cap.Fe * ATOMIC_WEIGHT.Fe * 1000,
        Zn: cap.Zn * ATOMIC_WEIGHT.Zn * 1000,
        Pb: cap.Pb * ATOMIC_WEIGHT.Pb * 1000,
      }
      // Lượng kết tủa = input − lượng còn hòa tan (min(input, capacity)),
      // đúng công thức mà server action dùng cho `settle`.
      est = {
        Fe: Math.max(0, treatmentComposition.Fe - Math.min(treatmentComposition.Fe, capMgL.Fe)),
        Zn: Math.max(0, treatmentComposition.Zn - Math.min(treatmentComposition.Zn, capMgL.Zn)),
        Pb: Math.max(0, treatmentComposition.Pb - Math.min(treatmentComposition.Pb, capMgL.Pb)),
      }
    }
    const treatedFe = measuredPpt?.Fe || est.Fe
    const treatedZn = measuredPpt?.Zn || est.Zn
    const treatedPb = measuredPpt?.Pb || est.Pb

    const totalPpt = fePpt + znPpt + pbPpt + treatedFe + treatedZn + treatedPb

    // Màu dung dịch: Fe³⁺ vàng nâu, Zn²⁺/Pb²⁺ gần như trong
    const liquidColor = hasFe ? '#F1DFA0' : '#F4F6F8'

    // Màu kết tủa theo thành phần kết tủa chiếm ưu thế. Kết tủa trắng
    // (Zn/Pb) vẽ thêm viền xám để không chìm vào dung dịch trong/nhợt.
    const feTotal = fePpt + treatedFe
    const pbTotal = pbPpt + treatedPb
    let precipitateColor: string | null = null
    let precipitateEdge: string | null = null
    if (totalPpt > 0) {
      if (feTotal > 0) {
        precipitateColor = '#A56535'                  // Fe(OH)₃ nâu đỏ
        precipitateEdge = '#7d4522'
      } else if (pbTotal > 0) {
        precipitateColor = '#EFE6D2'                  // Pb trắng kem
        precipitateEdge = '#8a7d5e'
      } else {
        precipitateColor = '#F4F2EA'                  // Zn(OH)₂ trắng ngà
        // Kết túa trắng trên dung dịch trong cần viền đậm hơn mới thấy;
        // đây là ranh giới hạt, không phải màu của kết túa.
        precipitateEdge = '#7b858a'
      }
    }

    // Đã lọc → pha rắn nằm trên giấy lọc, cốc chỉ còn filtrate trong
    if (status.filtered) {
      return {
        liquidColor: '#dbe8ee',
        precipitateColor: null as string | null,
        precipitateEdge: null as string | null,
        pptMg: 0,
        precipitateColorOnFilter: precipitateColor,
        precipitatedOnFilter: totalPpt > 0,
      }
    }
    return {
      liquidColor,
      precipitateColor,
      precipitateEdge,
      pptMg: totalPpt,
      precipitateColorOnFilter: null as string | null,
      precipitatedOnFilter: false,
    }
  }, [sampleCalculation, calculation, treatmentComposition, status.pH, status.filtered, hasFe, hasZn, hasPb])

  // Gợi ý vùng pH kết tủa để người học hiểu vì sao pH 7 chưa có kết tủa nhưng
  // pH 9 thì có, và vì sao tăng pH quá cao kết tủa lại tan bớt.
  const znAdvice = (() => {
    if (!hasZn || !hasFe && !hasPb) return null
    if (sampleMeta.pptMg <= 0) return 'Zn chưa kết tủa ở pH này — thử pH 8–10.'
    if (status.pH >= 11) return 'Zn(OH)₂ là base lưỡng phân: pH quá cao thì kết tủa tan lại.'
    if (status.pH >= 9.5) return 'Gần đỉnh kết tủa Zn. Tăng pH thêm sẽ làm kết tủa tan dần.'
    return null
  })()

  const liquidColor = sampleMeta.liquidColor

  // Buret remaining volume — wrap after draining a full buret
  const wrapMod = (n: number) => n % (BURET_CAPACITY + 1)
  const naohRemaining = BURET_CAPACITY - wrapMod(status.naohAddedMl)
  const hclRemaining = BURET_CAPACITY - wrapMod(status.hclAddedMl)
  const naohEmpty = naohRemaining <= 0
  const hclEmpty = hclRemaining <= 0

  // Animation trigger: brief drop when added
  const [activeDrop, setActiveDrop] = useState<{ reagent: AcidBase; tick: number } | null>(null)
  const [hasBeenStirred, setHasBeenStirred] = useState(false)
  const [dropSteps, setDropSteps] = useState<Record<AcidBase, TreatmentStepMl>>({ naoh: 1, hcl: 1 })
  const lastAdded = useRef({ naoh: status.naohAddedMl, hcl: status.hclAddedMl })
  useEffect(() => {
    if (status.naohAddedMl !== lastAdded.current.naoh) {
      setActiveDrop({ reagent: 'naoh', tick: Date.now() })
    } else if (status.hclAddedMl !== lastAdded.current.hcl) {
      setActiveDrop({ reagent: 'hcl', tick: Date.now() })
    }
    lastAdded.current = { naoh: status.naohAddedMl, hcl: status.hclAddedMl }
  }, [status.naohAddedMl, status.hclAddedMl])
  useEffect(() => {
    if (!activeDrop) return
    const t = setTimeout(() => setActiveDrop(null), 800)
    return () => clearTimeout(t)
  }, [activeDrop])

  useEffect(() => {
    const shouldBeMarkedStirred = status.stirring || status.naohAddedMl > 0 || status.hclAddedMl > 0
    setHasBeenStirred((current) => {
      const next = shouldBeMarkedStirred ? current || status.stirring : false
      return next === current ? current : next
    })
  }, [status.stirring, status.naohAddedMl, status.hclAddedMl])

  const hasFinishedStirring = hasBeenStirred && !status.stirring
  const setDropStep = (reagent: AcidBase, value: string) => {
    const amount = Number(value) as TreatmentStepMl
    if (TREATMENT_STEPS.includes(amount)) setDropSteps((current) => ({ ...current, [reagent]: amount }))
  }
  const [calculationBusy, setCalculationBusy] = useState(false)
  const [calculationError, setCalculationError] = useState<string | null>(null)

  const runStep = async (
    action: 'measure-final' | 'settle' | 'filter',
    commit: (result: TreatmentCalculation) => void,
    fallbackError: string,
  ) => {
    if (!treatmentComposition || calculationBusy) return
    setCalculationBusy(true)
    setCalculationError(null)
    try {
      const result = await runWaterTreatmentAction({
        action,
        composition: treatmentComposition,
        pH: status.pH,
        volume_mL: status.volumeMl,
      })
      commit(result)
    } catch (error) {
      setCalculationError(error instanceof Error ? error.message : fallbackError)
    } finally {
      setCalculationBusy(false)
    }
  }

  const calculateTreatment = () => runStep(
    'measure-final',
    onCalculate,
    'Không thể tính kết quả xử lý nước.',
  )
  const settleSample = () => runStep('settle', onSettle, 'Không thể thực hiện bước lắng.')
  const filterSample = () => runStep('filter', onFilter, 'Không thể thực hiện bước lọc.')

  // Điều kiện mở/đóng nút theo đúng trình tự: khuấy → lắng → lọc
  const canSettle = hasTreatmentSample && hasFinishedStirring && !status.settled && !status.filtered && !calculationBusy
  const canFilter = hasTreatmentSample && status.settled && !status.filtered && !calculationBusy

  // Nút luôn giữ lý do khi bị khoá để không bỏ lửng người học giữa chừng
  const noSampleReason = 'Pha mẫu và tính ở Bàn 1 trước khi xử lý ở Bàn 2.'
  const settleTitle = status.filtered ? 'Đã lọc — cần pha mẫu mới để lắng lại.'
    : status.settled ? 'Đã lắng. Bấm “Lọc” để tách pha rắn.'
    : !hasTreatmentSample ? noSampleReason
    : !hasFinishedStirring ? 'Bật khuấy rồi dừng máy để kết tủa hình thành.'
    : 'Cho kết tủa lắng xuống đáy cốc.'
  const filterTitle = status.filtered ? 'Đã lọc — pha rắn đã tách khỏi cốc.'
    : !status.settled ? 'Bấm “Lắng” trước rồi mới lọc.'
    : 'Lọc bỏ pha rắn, thu pha lỏng (filtrate).'
  const calculateTitle = !hasTreatmentSample ? noSampleReason
    : hasFinishedStirring ? 'Tính pH và lượng kim loại còn lại sau xử lý'
    : 'Hãy khuấy xong rồi dừng máy trước khi tính'

  return <div className={styles.apparatus}>
    <div className={styles.apparatusHeader}>
      <div>
        <h2>Bàn xử lý nước</h2>
        <p>Máy khuấy từ · 2 buret NaOH/HCl 1 M · cốc 2 L đế bằng</p>
      </div>
    </div>

    <div className={styles.apparatusStage} aria-label="Bàn thí nghiệm với máy khuấy từ, cốc 2L đế bằng và hai buret treo phía trên">
      <div className={styles.volumeModel} aria-label="Mô hình thể tích dung dịch trong cốc">
        <div className={styles.volumeModelHeader}>
          <strong>Thể tích trong cốc</strong>
        </div>
        <div className={styles.volumeModelGrid}>
          <div className={styles.volumeModelRow}>
            <span className={styles.volumeModelLabel}>
              <span className={styles.volumeDot} data-solution="water" />
              Nước mẫu
            </span>
            <span className={styles.volumeModelValue}>{INITIAL_STATUS.volumeMl} mL</span>
          </div>
          <div className={styles.volumeModelDivider} />
          <div className={styles.volumeModelRow}>
            <span className={styles.volumeModelLabel}>
              <span className={styles.volumeDot} data-solution="naoh" />
              NaOH 1 M
            </span>
            <span className={styles.volumeModelValue}>{status.naohAddedMl} mL</span>
          </div>
          <div className={styles.volumeModelRow}>
            <span className={styles.volumeModelLabel}>
              <span className={styles.volumeDot} data-solution="hcl" />
              HCl 1 M
            </span>
            <span className={styles.volumeModelValue}>{status.hclAddedMl} mL</span>
          </div>
          <div className={styles.volumeModelDivider} />
          <div className={styles.volumeModelRow}>
            <span className={styles.volumeModelLabel}>
              <span className={styles.volumeDotGray} />
              Tổng chất thêm
            </span>
            <span className={styles.volumeModelValue}>{status.naohAddedMl + status.hclAddedMl} mL</span>
          </div>
          <div className={styles.volumeModelRow} data-total>
            <span className={styles.volumeModelLabel}>
              <span className={styles.volumeDotAccent} />
              Tổng cộng
            </span>
            <span className={styles.volumeModelValue}>{status.volumeMl} mL</span>
          </div>
        </div>
      </div>
      <svg viewBox="0 0 380 470" className={styles.apparatusSvg} role="img" aria-label="Sơ đồ bàn xử lý nước: hai buret NaOH và HCl 1M treo trên giá, máy khuấy từ dưới đáy cốc, cốc 2L đế bằng ở giữa">
        <defs>
          <linearGradient id={uid + 'glass'}>
            <stop offset="0" stopColor="#cedfe8" stopOpacity=".55" />
            <stop offset=".3" stopColor="#fff" stopOpacity=".08" />
            <stop offset=".8" stopColor="#e0edf3" stopOpacity=".12" />
            <stop offset="1" stopColor="#c6dbe5" stopOpacity=".5" />
          </linearGradient>
          <linearGradient id={uid + 'steel'} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#78929f" />
            <stop offset=".4" stopColor="#e9f1f5" />
            <stop offset=".65" stopColor="#bacdd7" />
            <stop offset="1" stopColor="#6f8999" />
          </linearGradient>
          <linearGradient id={uid + 'platform'} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#cfdce4" />
            <stop offset="1" stopColor="#7a8c95" />
          </linearGradient>
          <linearGradient id={uid + 'bar'} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#b8c7d0" />
            <stop offset=".5" stopColor="#dde8ee" />
            <stop offset="1" stopColor="#b8c7d0" />
          </linearGradient>
          <clipPath id={uid + 'fill' + BURET_NAOH_CX}>
            <rect x={BURET_NAOH_CX - BURET_WIDTH / 2} y={buretLiquidTopY(naohRemaining)} width={BURET_WIDTH} height={BURET_BODY_BOTTOM - buretLiquidTopY(naohRemaining)} />
          </clipPath>
          <clipPath id={uid + 'fill' + BURET_HCL_CX}>
            <rect x={BURET_HCL_CX - BURET_WIDTH / 2} y={buretLiquidTopY(hclRemaining)} width={BURET_WIDTH} height={BURET_BODY_BOTTOM - buretLiquidTopY(hclRemaining)} />
          </clipPath>
          {/* Kẹp kết tủa bên trong thành cốc */}
          <clipPath id={uid + 'beaker'}>
            <rect x={BEAKER_LEFT_X + 1} y={BEAKER_TOP_Y + 4} width={BEAKER_RIGHT_X - BEAKER_LEFT_X - 2} height={BEAKER_HEIGHT - 4} />
          </clipPath>
        </defs>

        {/* Top support bar (buret stand rack) */}
        <rect x="20" y="6" width="340" height="12" rx="2" fill={'url(#' + uid + 'steel)'} />
        <rect x="18" y="6" width="344" height="2" fill="#dde8ee" />
        {/* Rack name plates for the burets */}
        <g>
          <rect x={BURET_NAOH_CX - 32} y="4" width="64" height="14" rx="2" fill={'url(#' + uid + 'bar)'} stroke="#557586" strokeWidth=".6" />
          <text x={BURET_NAOH_CX} y="14.5" textAnchor="middle" fontSize="8.5" fill="#0e3a45" fontWeight="700">NaOH 1 M</text>
        </g>
        <g>
          <rect x={BURET_HCL_CX - 28} y="4" width="56" height="14" rx="2" fill={'url(#' + uid + 'bar)'} stroke="#557586" strokeWidth=".6" />
          <text x={BURET_HCL_CX} y="14.5" textAnchor="middle" fontSize="8.5" fill="#5a3208" fontWeight="700">HCl 1 M</text>
        </g>
        {/* End posts */}
        <rect x="18" y="18" width="6" height="14" fill={'url(#' + uid + 'steel)'} />
        <rect x="356" y="18" width="6" height="14" fill={'url(#' + uid + 'steel)'} />

        {/* NaOH buret (left) */}
        <Buret
          uid={uid} cx={BURET_NAOH_CX} topY={26}
          color="#1f8a99" lightColor="#75c3d0" deepColor="#1a6e7a"
          label="NaOH 1 M" remainingMl={naohRemaining}
          isDripping={activeDrop?.reagent === 'naoh'}
          remainingDisplay={naohRemaining + ' mL'}
        />

        {/* HCl buret (right) */}
        <Buret
          uid={uid} cx={BURET_HCL_CX} topY={26}
          color="#b26516" lightColor="#e3a14d" deepColor="#8a4d10"
          label="HCl 1 M" remainingMl={hclRemaining}
          isDripping={activeDrop?.reagent === 'hcl'}
          remainingDisplay={hclRemaining + ' mL'}
        />

        {/* Beaker — FLAT BOTTOM, slight rounding on top edges */}
        <path d={'M' + BEAKER_LEFT_X + ' ' + (BEAKER_TOP_Y + 4) + ' Q' + BEAKER_LEFT_X + ' ' + BEAKER_TOP_Y + ' ' + (BEAKER_LEFT_X + 4) + ' ' + BEAKER_TOP_Y + ' H' + (BEAKER_RIGHT_X - 4) + ' Q' + BEAKER_RIGHT_X + ' ' + BEAKER_TOP_Y + ' ' + BEAKER_RIGHT_X + ' ' + (BEAKER_TOP_Y + 4) + ' V' + BEAKER_BOTTOM_Y + ' H' + BEAKER_LEFT_X + ' Z'} fill={'url(#' + uid + 'glass)'} stroke="#557586" strokeWidth="2" />
        {/* Spout lips */}
        <path d={'M' + (BEAKER_LEFT_X - 1) + ' ' + (BEAKER_TOP_Y - 1) + ' l-6 -3 l7 -2'} fill="none" stroke="#8da9b8" strokeWidth="1.4" strokeLinecap="round" />
        <path d={'M' + (BEAKER_RIGHT_X + 1) + ' ' + (BEAKER_TOP_Y - 1) + ' l6 -3 l-7 -2'} fill="none" stroke="#8da9b8" strokeWidth="1.4" strokeLinecap="round" />

        {/* Liquid — flat bottom */}
        <path d={'M' + (BEAKER_LEFT_X + 2) + ' ' + waterY + ' H' + (BEAKER_RIGHT_X - 2) + ' V' + (BEAKER_BOTTOM_Y - 1) + ' H' + (BEAKER_LEFT_X + 2) + ' Z'} fill={liquidColor} fillOpacity=".78" />
        <ellipse cx={(BEAKER_LEFT_X + BEAKER_RIGHT_X) / 2} cy={waterY} rx={(BEAKER_RIGHT_X - BEAKER_LEFT_X - 4) / 2} ry="3.5" fill={liquidColor} stroke="#6b8a99" strokeWidth="1" />

        {/* Kết tủa: lớp lắng đáy cốc khi dừng, hạt quanh trục tung khi khuấy.
            Vị trí do React đặt; chuyển động do .pptSwirl trên từng hạt. */}
        {(() => {
          const pptColor = sampleMeta.precipitateColor
          const pptEdge = sampleMeta.precipitateEdge ?? '#7d6a52'
          if (!pptColor || liquidDepth <= 8) return null
          const cx = (BEAKER_LEFT_X + BEAKER_RIGHT_X) / 2
          const floorY = BEAKER_BOTTOM_Y - 2
          // Bề dày lớp lắng từ lượng kết tủa đã biết (0 → 16 px)
          const bedHeight = Math.min(16, Math.max(3, sampleMeta.pptMg * 0.8))
          const numParticles = Math.min(14, Math.max(4, Math.round(sampleMeta.pptMg * 1.2)))
          // Bán kính quỹ đạo giữ trong thành cốc: bề rộng trong /2 trừ lề an toàn
          const orbitRx = Math.max(6, Math.min(26, (BEAKER_RIGHT_X - BEAKER_LEFT_X) / 2 - 12))
          const orbitRy = Math.max(2, orbitRx * 0.22)

          return (
            <g clipPath={'url(#' + uid + 'beaker)'} data-testid="wt-precipitate">
              {/* Lớp kết tủa lắng đáy — luôn hiện, dày dần theo lượng kết tủa */}
              <path
                d={'M' + (BEAKER_LEFT_X + 3) + ' ' + floorY + ' Q' + cx + ' ' + (floorY - bedHeight - 4) + ' ' + (BEAKER_RIGHT_X - 3) + ' ' + floorY + ' Z'}
                fill={pptColor} fillOpacity=".9"
                stroke={pptEdge} strokeOpacity=".9" strokeWidth="1"
              />

              {status.stirring ? (
                // Khuấy: hạt quay quanh trục tung giữa cốc.
                // cx đặt đúng trục; mọi dịch chuyển ngang do .pptSwirl đảm nhiệm.
                Array.from({ length: numParticles }, (_, i) => {
                  const s1 = (i * 7 + 3) % 11
                  const s2 = (i * 13 + 5) % 13
                  const phase = ((i * 5) % 12) / 12
                  const y = floorY - bedHeight - 4 - ((s2 / 13) * Math.min(46, liquidDepth - 14))
                  const size = 1.3 + ((s1 + s2) % 5) * 0.3
                  return (
                    <ellipse
                      key={i}
                      cx={cx}
                      cy={y}
                      rx={size} ry={size * 0.72}
                      fill={pptColor} stroke={pptEdge} strokeOpacity=".7" strokeWidth=".55"
                      className={styles.pptSwirl}
                      style={{
                        ['--swirl-a' as string]: orbitRx.toFixed(2) + 'px',
                        ['--swirl-b' as string]: orbitRy.toFixed(2) + 'px',
                        // Lệch pha để các hạt không chạy đồng pha
                        animationDelay: (-phase * 1.9).toFixed(2) + 's',
                      } as React.CSSProperties}
                    />
                  )
                })
              ) : (
                // Dừng: hạt nằm yên trên lớp lắng
                Array.from({ length: numParticles }, (_, i) => {
                  const s1 = (i * 7 + 3) % 11
                  const s2 = (i * 13 + 5) % 13
                  const x = BEAKER_LEFT_X + 8 + ((s1 / 11) * (BEAKER_RIGHT_X - BEAKER_LEFT_X - 16))
                  const y = floorY - bedHeight * (0.35 + ((s2 / 13) * 0.6))
                  const size = 1.3 + ((s1 + s2) % 5) * 0.3
                  return (
                    <ellipse key={i} cx={x} cy={y} rx={size} ry={size * 0.72}
                      fill={pptColor} stroke={pptEdge} strokeOpacity=".75" strokeWidth=".5" fillOpacity=".95" />
                  )
                })
              )}
            </g>
          )
        })()}

        {/* Stir bar (nam châm khuấy) — sits on the flat bottom, spins when stirring */}
        {status.volumeMl > 50 && liquidDepth > 6 && <g>
          <rect
            className={status.stirring ? styles.stirBarSpin : styles.stirBar}
            x={STIRRER_CX - 22} y={BEAKER_BOTTOM_Y - 9} width="44" height="6" rx="3"
            fill="#e6ebee" stroke="#7e8a92" strokeWidth=".6"
            data-testid="wt-stirbar"
          />
          <rect x={STIRRER_CX - 18} y={BEAKER_BOTTOM_Y - 8.5} width="36" height="1.4" rx=".7" fill="#f4f7f9" pointerEvents="none" />
        </g>}

        {/* Glass highlights */}
        <path d={'M' + (BEAKER_LEFT_X + 6) + ' ' + (BEAKER_TOP_Y + 18) + ' v140'} stroke="#fff" strokeWidth="3" strokeOpacity=".75" />
        <path d={'M' + (BEAKER_RIGHT_X - 6) + ' ' + (BEAKER_TOP_Y + 18) + ' v140'} stroke="#afc9d4" strokeWidth="1.2" strokeOpacity=".5" />

        {/* Beaker graduations — every 200 mL */}
        {Array.from({ length: 10 }, (_, i) => {
          const ml = (i + 1) * 200
          const y = volumeY(ml)
          const major = (i + 1) % 2 === 0
          return <g key={ml}>
            <line x1={major ? BEAKER_LEFT_X - 8 : BEAKER_LEFT_X - 4} x2={BEAKER_LEFT_X - 1} y1={y} y2={y} stroke="#365964" strokeWidth={major ? 1 : .55} />
            {major && <text x={BEAKER_LEFT_X - 10} y={y + 2.5} textAnchor="end" fontSize="6.5" fill="#365964">{ml}</text>}
          </g>
        })}
        <text x={BEAKER_LEFT_X - 10} y={BEAKER_TOP_Y - 2} textAnchor="end" fontSize="6" fill="#365964">mL</text>

        {/* Magnetic stirrer hotplate — sits UNDER the beaker bottom */}
        <rect x="70" y="430" width="240" height="22" rx="3" fill={'url(#' + uid + 'platform)'} stroke="#557586" strokeWidth="1" />
        <rect x="70" y="430" width="240" height="2" fill="#e7eff4" />
        {/* Vent slots on the platform */}
        {Array.from({ length: 6 }, (_, i) => <rect key={'vent' + i} x={120 + i * 14} y={446} width="9" height="2" rx="1" fill="#5d7682" opacity=".55" />)}
        {/* Power indicator */}
        <g>
          <circle cx="92" cy="441" r="4.5" fill={status.stirring ? '#cc7a1e' : '#456475'} className={status.stirring ? styles.indicatorOn : undefined} />
          <text x="92" y="459" textAnchor="middle" fontSize="5.5" fill="#365964">Power</text>
        </g>
        {/* Speed dial */}
        <g>
          <circle cx="288" cy="441" r="6" fill="#3f576a" stroke="#1a2c36" strokeWidth=".6" />
          <line x1="288" y1="441" x2="288" y2="437" stroke="#dde8ee" strokeWidth="1" strokeLinecap="round" transform={'rotate(' + (status.stirring ? 90 : 0) + ' 288 441)'} className={status.stirring ? undefined : undefined} />
          <circle cx="288" cy="441" r="1.2" fill="#a7bcc8" />
          <text x="288" y="459" textAnchor="middle" fontSize="5.5" fill="#365964">Tốc độ</text>
        </g>
        <text x="190" y="464" textAnchor="middle" fontSize="7.5" fill="#365964" fontWeight="650">Máy khuấy từ</text>
      </svg>

      {/* Đã lọc: phễu + giấy lọc ghép vào miệng cốc, pha rắn bị giữ lại trên giấy */}
      {status.filtered ? <div className={styles.filterStage} data-testid="wt-filter-stage">
        <svg viewBox="0 0 380 470" aria-hidden="true" focusable="false">
          <g>
            {/* Giấy lọc gấp nhẹ ở miệng cốc */}
            <path
              d={'M' + (BEAKER_LEFT_X + 8) + ' ' + (BEAKER_TOP_Y + 6) + ' H' + (BEAKER_RIGHT_X - 8) + ' L' + (BEAKER_RIGHT_X - 16) + ' ' + (BEAKER_TOP_Y + 20) + ' H' + (BEAKER_LEFT_X + 16) + ' Z'}
              fill="#efe7d8" stroke="#b8ab93" strokeWidth=".8"
            />
            <path
              d={'M' + (BEAKER_LEFT_X + 16) + ' ' + (BEAKER_TOP_Y + 20) + ' H' + (BEAKER_RIGHT_X - 16)}
              stroke="#c8bda6" strokeWidth=".6" strokeDasharray="3 2.5"
            />
            {/* Kết tủa giữ lại trên giấy lọc */}
            {sampleMeta.precipitatedOnFilter ? <ellipse
              cx={(BEAKER_LEFT_X + BEAKER_RIGHT_X) / 2} cy={BEAKER_TOP_Y + 9} rx="34" ry="3.6"
              fill={sampleMeta.precipitateColorOnFilter ?? '#A56535'} fillOpacity=".9"
            /> : null}
            <text x={(BEAKER_LEFT_X + BEAKER_RIGHT_X) / 2} y={BEAKER_TOP_Y - 4} textAnchor="middle" fontSize="6.5" fill="#365964" fontWeight="650">Filtrate trong cốc</text>
          </g>
        </svg>
      </div> : null}
    </div>

    <div className={styles.apparatusControls}>
      <div className={styles.separationControls} role="group" aria-label="Bước lắng và lọc sau khi khuấy">
        <button type="button" className={styles.settleButton} onClick={settleSample} disabled={!canSettle} data-done={status.settled || status.filtered} title={settleTitle} data-testid="wt-settle">
          <SettleIcon /> {status.settled || status.filtered ? 'Đã lắng' : calculationBusy ? 'Đang xử lý…' : 'Lắng'}
        </button>
        <button type="button" className={styles.filterButton} onClick={filterSample} disabled={!canFilter} data-done={status.filtered} title={filterTitle} data-testid="wt-filter">
          <FilterIcon /> {status.filtered ? 'Đã lọc' : calculationBusy ? 'Đang xử lý…' : 'Lọc'}
        </button>
      </div>
      <button type="button" className={styles.stirButton} data-active={status.stirring} onClick={onToggleStir} data-testid="wt-toggle-stir">
        {status.stirring ? <StopIcon /> : <PlayIcon />}
        {status.stirring ? 'Dừng khuấy' : 'Bật khuấy'}
      </button>
      <button type="button" className={styles.calculateButton} onClick={calculateTreatment} disabled={!hasFinishedStirring || calculationBusy || !hasTreatmentSample} title={calculateTitle} data-testid="wt-calculate">
        <BeakerIcon /> {calculationBusy ? 'Đang tính…' : 'Tính toán'}
      </button>
      <div className={styles.buretControls}>
        {(['naoh', 'hcl'] as const).map((reagent) => {
          const empty = reagent === 'naoh' ? naohEmpty : hclEmpty
          const label = reagent === 'naoh' ? 'NaOH' : 'HCl'
          return <div className={styles.buretControl} key={reagent}>
            <span>{label}</span>
            <DoseStepMenu
              solution={reagent}
              value={dropSteps[reagent]}
              onChange={(value) => setDropStep(reagent, value)}
              disabled={empty}
            />
            <button type="button" className={styles.buretAdd} data-testid={`wt-add-${reagent}`} onClick={() => onAddDrop(reagent, dropSteps[reagent])} disabled={empty}>
              <PlusIcon /> <span>{empty ? 'Đã hết' : 'Thêm'}</span>
            </button>
          </div>
        })}
      </div>
    </div>
    {znAdvice ? <p className={styles.pptAdvice} role="status">{znAdvice}</p> : null}
    {calculationError ? <p className={styles.calculationError} role="alert">{calculationError}</p> : null}
    {calculation ? (
      <section className={styles.calculationPanel} aria-label="Bảng tổng hợp kết quả bàn xử lý nước">
        <div className={styles.calculationHeader}><div><strong>Kết quả xử lý nước</strong><span className={styles.calculationHeaderNote}>Bảng tổng hợp sau khuấy</span></div><span>Đơn vị: mg/L</span></div>
        <p className={styles.calculationExplanation}>So sánh lượng kim loại còn hòa tan với lượng đã chuyển thành kết tủa sau khi điều chỉnh pH.</p>
        <div className={styles.tableScroll}><table className={styles.table}><caption className={styles.tableCaption}>Kết quả Fe, Zn và Pb sau xử lý.</caption><thead><tr><th scope="col">Đại lượng</th><th scope="col">Fe</th><th scope="col">Zn</th><th scope="col">Pb</th></tr></thead><tbody>
          <tr><th scope="row">Còn hòa tan</th><td>{calculation.filtrate_mgPerL.Fe.toFixed(6)}</td><td>{calculation.filtrate_mgPerL.Zn.toFixed(6)}</td><td>{calculation.filtrate_mgPerL.Pb.toFixed(6)}</td></tr>
          <tr><th scope="row">Đã kết tủa</th><td>{calculation.precipitated_mgPerL.Fe.toFixed(6)}</td><td>{calculation.precipitated_mgPerL.Zn.toFixed(6)}</td><td>{calculation.precipitated_mgPerL.Pb.toFixed(6)}</td></tr>
          <tr><th scope="row">Giới hạn Cột A</th><td>2.000000</td><td>1.000000</td><td>0.100000</td></tr>
        </tbody></table></div>
        <div className={styles.calculationSummary}><span>pH sau xử lý <strong>{calculation.pH.toFixed(6)}</strong></span><span>Trạng thái <strong>{calculation.goalStatus}</strong></span></div>
      </section>
    ) : null}

    <p className={styles.apparatusNote}>Mực buret, tốc độ khuấy và pH chỉ mang tính minh họa; giá trị thật lưu ở bảng dưới.</p>
  </div>
}