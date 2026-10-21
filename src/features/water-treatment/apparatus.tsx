'use client'

import { useId, useRef, useState, useEffect, useMemo } from 'react'
import { runWaterTreatmentAction, type WaterTreatmentResult } from '@/app/simulate/water-treatment/actions.js'
import { WT_QCVN_COLUMN_A } from './constants.js'
import type { SampleCalculation } from './sample-apparatus.js'
import { PlayIcon, StopIcon, PlusIcon, SettleIcon, FilterIcon, LockIcon } from './icons.js'
import styles from './workbench.module.css'

/**
 * Màu kết tủa theo thành phần rắn chiếm ưu thế. Kết tủa trắng (Zn/Pb) cần
 * viền xám để không chìm vào dung dịch trong/nhợt.
 */
const SOLID_STYLE: Record<keyof MetalComposition, { fill: string; edge: string }> = {
  Fe: { fill: '#A56535', edge: '#7d4522' },   // Fe(OH)₃ nâu đỏ
  Pb: { fill: '#EFE6D2', edge: '#8a7d5e' },   // Pb trắng kem
  Zn: { fill: '#F4F2EA', edge: '#7b858a' },   // Zn(OH)₂ trắng ngà
}

function colorForSolid(solid: MetalComposition): string | null {
  if (solid.Fe > 0) return SOLID_STYLE.Fe.fill
  if (solid.Pb > 0) return SOLID_STYLE.Pb.fill
  if (solid.Zn > 0) return SOLID_STYLE.Zn.fill
  return null
}

function EDGE_FOR_SOLID(solid: MetalComposition): string | null {
  if (solid.Fe > 0) return SOLID_STYLE.Fe.edge
  if (solid.Pb > 0) return SOLID_STYLE.Pb.edge
  if (solid.Zn > 0) return SOLID_STYLE.Zn.edge
  return null
}

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

/** Tổng kim loại đang có trong cốc (mg/L) — cả phần hòa tan lẫn phần rắn. */
export type MetalComposition = { Fe: number; Zn: number; Pb: number }

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
  /**
   * Tổng kim loại trong cốc (mg/L). Mặc định `null` → kế thừa tổng của mẫu Bàn 1
   * (đã hòa tan + kết tủa mang sang). Sau bước Lọc, giá trị này là filtrate —
   * pha rắn đã ra khỏi cốc nên không còn nằm trong tổng.
   */
  composition: MetalComposition | null
  /** Lượng kết tủa (mg/L) của từng kim loại đang nằm trên giấy lọc sau bước Lọc. */
  filteredSolid: MetalComposition
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

/** Màu kết tủa và khoảng pH tham khảo khi chỉnh pH bằng NaOH/HCl */
const PRECIPITATE_GUIDANCE = [
  { label: 'Fe(OH)₃ · nâu đỏ #A56535', ph: 'pH tham khảo 2–4' },
  { label: 'Zn(OH)₂ · trắng #F1F1ED', ph: 'pH tham khảo 7–8,5; có thể tan lại trong kiềm dư' },
  { label: 'Chất rắn chứa Pb · trắng kem #F2EBDD', ph: 'pH phụ thuộc cân bằng; Pb(OH)₂ chỉ là giả định đơn giản' },
] as const

/** Một bản ghi trong lịch sử lọc */
export type FilterHistoryEntry = {
  /** Thứ tự lần lọc (bắt đầu từ 1) */
  index: number
  /** Thời điểm lọc */
  timestamp: Date
  /** Kết quả tính toán lần lọc này */
  calculation: TreatmentCalculation
  /** Tổng Fe/Zn/Pb còn lại sau lọc (mg/L) */
  cumulativeRemaining: { Fe: number; Zn: number; Pb: number }
  /**
   * Tổng Fe/Zn/Pb đã lọc tích lũy (mg/L).
   * `null` khi chưa có mốc nồng độ ban đầu ở Bàn 1 để so sánh.
   */
  cumulativeFiltered: { Fe: number; Zn: number; Pb: number } | null
}

/** Một bản ghi hành động trong lịch sử thao tác */
export type ActionLogEntry = {
  timestamp: Date
  station: 'sample' | 'treatment' | 'discharge'
  action: string
  details?: string | undefined
}

const INITIAL_STATUS: ApStatus = {
  pH: 5.4,
  volumeMl: 1000,
  stirring: false,
  naohAddedMl: 0,
  hclAddedMl: 0,
  settled: false,
  filtered: false,
  composition: null,
  filteredSolid: { Fe: 0, Zn: 0, Pb: 0 },
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
  onLockBan2,
  calculation,
  filterHistory,
  sampleCalculation,
  sampleStatus: externalSampleStatus,
  ban2Locked = false,
}: {
  status?: Partial<ApStatus>
  onAddDrop: (reagent: AcidBase, amountMl: number) => void
  onToggleStir: () => void
  /** Ghi nhận bước lắng — kết tủa chín đã kết tủa ở pH hiện tại. */
  onSettle: (result: TreatmentCalculation) => void
  /** Ghi nhận bước lọc — pha rắn tách, cốc còn filtrate. */
  onFilter: (result: TreatmentCalculation) => void
  /** Khóa Bàn 2, chuyển sang Bàn 3 cân bằng pH trước khi thải. */
  onLockBan2?: () => void
  calculation: TreatmentCalculation | null
  /** Lịch sử các lần lọc cộng dồn */
  filterHistory?: FilterHistoryEntry[]
  sampleCalculation?: SampleCalculation | null
  sampleStatus?: { feAddedMl: number; znAddedMl: number; pbAddedMl: number } | null
  /** Bàn 2 đã bị khóa - không cho thêm NaOH/HCl */
  ban2Locked?: boolean
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

  /**
   * Tổng kim loại đang ở trong cốc Bàn 2 (mg/L) — gồm cả phần đã hòa tan lẫn
   * phần kết tửa mang sang từ Bàn 1, vì cả hai cùng nằm trong cốc.
   *
   * Bàn 1 trả về `dissolvedMgL` (mg/L) và `precipitateMg` (mg tuyệt đối), nên
   * phần rắn phải quy đổi sang mg/L bằng `totalVolumeMl` trước khi cộng. Sau bước
   * Lọc, `status.composition` là filtrate và ghi đè giá trị này.
   */
  const inheritedComposition = useMemo<MetalComposition | null>(() => {
    if (!sampleCalculation) return null
    const { dissolvedMgL, precipitateMg, totalVolumeMl } = sampleCalculation
    const volumeL = totalVolumeMl / 1000
    if (!Number.isFinite(volumeL) || volumeL <= 0) return null
    return {
      Fe: dissolvedMgL.fe + precipitateMg.fe / volumeL,
      Zn: dissolvedMgL.zn + precipitateMg.zn / volumeL,
      Pb: dissolvedMgL.pb + precipitateMg.pb / volumeL,
    }
  }, [sampleCalculation])

  const treatmentComposition = status.composition ?? inheritedComposition
  const hasTreatmentSample = treatmentComposition !== null

  /**
   * Pha hòa tan / pha rắn mà cốc Bàn 2 HIỂN THỊ tại thời điểm hiện tại.
   *
   * KHÔNG cập nhật ngay khi pH đổi. Chỉ cập nhật khi người học đã thực hiện
   * bước Lắng (hoặc Lọc) — tức đã có kết quả phân bố pha do solver trả về.
   *
   * - Trước khi Lắng: hiển thị pha ban đầu mà mẫu từ Bàn 1 đã pha (ion tan,
   *   chưa có hydroxide kết tủa vì chưa thêm kiềm).
   * - Sau Lắng: dùng `filtrate_mgPerL` và `precipitated_mgPerL` từ
   *   `calculation` để hiển thị màu nước và kết tủa mới.
   * - Sau Lọc: pha rắn đã chuyển sang giấy lọc, cốc chỉ còn filtrate.
   *
   * Khi người học thêm NaOH/HCl, `addDrop` reset `settled` về `false` →
   * `displayPhases` quay về pha ban đầu cho đến khi Lắng lại.
   */
  const displayPhases = useMemo<{ dissolved: MetalComposition; solid: MetalComposition }>(() => {
    if (!sampleCalculation) {
      return { dissolved: { Fe: 0, Zn: 0, Pb: 0 }, solid: { Fe: 0, Zn: 0, Pb: 0 } }
    }
    if (status.filtered && calculation) {
      return {
        dissolved: calculation.filtrate_mgPerL,
        solid: { Fe: 0, Zn: 0, Pb: 0 },
      }
    }
    if (status.settled && calculation) {
      return {
        dissolved: calculation.filtrate_mgPerL,
        solid: calculation.precipitated_mgPerL,
      }
    }
    // Trước khi Lắng (kể cả vừa thêm NaOH/HCl): giữ nguyên pha ban đầu.
    // Chuyển đổi từ lowercase (fe,zn,pb) của sampleCalculation sang uppercase (Fe,Zn,Pb).
    const { fe: df, zn: dz, pb: dp } = sampleCalculation.dissolvedMgL
    const { fe: pf, zn: pz, pb: pp } = sampleCalculation.precipitateMg
    const volumeMl = sampleCalculation.totalVolumeMl
    const factor = volumeMl > 0 ? 1000 / volumeMl : 0
    return {
      dissolved: { Fe: df, Zn: dz, Pb: dp },
      solid: {
        Fe: pf * factor,
        Zn: pz * factor,
        Pb: pp * factor,
      },
    }
  }, [sampleCalculation, status.settled, status.filtered, calculation])

  // Tính màu dung dịch và kết tủa phản ánh mẫu đang được xử lý ở Bàn 2
  const sampleMeta = useMemo(() => {
    const noSample = {
      liquidColor: '#bcd5e0',
      precipitateColor: null as string | null,
      precipitateEdge: null as string | null,
      pptMg: 0,
      precipitateColorOnFilter: null as string | null,
      precipitatedOnFilter: false,
      /** Pha hòa tan của từng kim loại (mg/L) — dùng cho màu nước. */
      dissolved: { Fe: 0, Zn: 0, Pb: 0 } as MetalComposition,
      /** Pha rắn của từng kim loại (mg/L) — dùng cho lớp lắng đáy. */
      solid: { Fe: 0, Zn: 0, Pb: 0 } as MetalComposition,
    }

    // Mẫu chưa pha ở Bàn 1 → cốc Bàn 2 vẫn là nước cất
    if (!hasFe && !hasZn && !hasPb) return noSample

    // Đã lọc → pha rắn nằm trên giấy lọc, cốc chỉ còn filtrate trong.
    if (status.filtered) {
      const onFilter = status.filteredSolid
      return {
        liquidColor: '#dbe8ee',
        precipitateColor: null as string | null,
        precipitateEdge: null as string | null,
        pptMg: 0,
        precipitateColorOnFilter: colorForSolid(onFilter),
        precipitatedOnFilter: onFilter.Fe + onFilter.Zn + onFilter.Pb > 0,
        dissolved: { Fe: 0, Zn: 0, Pb: 0 },
        solid: { Fe: 0, Zn: 0, Pb: 0 },
      }
    }

    // Dùng displayPhases — KHÔNG dùng pH để suy ra pha tức thì. Pha tan / rắn
    // chỉ thay đổi sau khi người học nhấn "Lắng".
    const { dissolved, solid } = displayPhases
    const totalPpt = solid.Fe + solid.Zn + solid.Pb

    /**
     * Màu nước: dựa trên Fe³⁺ đã hòa tan, KHÔNG phải tổng Fe.
     * Khi Fe tan ≤ 5 mg/L (≈ 95% đã kết tủa) → nước gần như trong hoàn toàn.
     * Fe³⁺ thuần có màu vàng nâu đặc trưng; khi kết tủa hết thì mất.
     *
     * Ngưỡng: dissolved.Fe ≤ 5 mg/L → nước trong.
     * Nếu không có Fe nào trong mẫu → nước nhạt.
     */
    const totalFeInSample = treatmentComposition?.Fe ?? 0
    const feDissolvedRatio = totalFeInSample > 0 ? dissolved.Fe / totalFeInSample : 0
    const liquidColor =
      totalFeInSample <= 0 ? '#dbe8ee'
      : feDissolvedRatio <= 0.05 ? '#dbe8ee'
      : dissolved.Fe <= 1 ? '#e8edd4'
      : dissolved.Fe <= 5 ? '#eed89a'
      : dissolved.Fe <= 15 ? '#e8cb82'
      : '#F1DFA0'

    return {
      liquidColor,
      precipitateColor: colorForSolid(solid),
      precipitateEdge: EDGE_FOR_SOLID(solid),
      pptMg: totalPpt,
      precipitateColorOnFilter: null as string | null,
      precipitatedOnFilter: false,
      dissolved,
      solid,
    }
  }, [displayPhases, treatmentComposition, status.filtered, status.filteredSolid, hasFe, hasZn, hasPb])

  // Gỡ gợi ý pH cho Zn theo yêu cầu — phạm vi pH phải dựa trên bảng kết quả
  // và capacity (`capacityAtSaturation`), không hiển thị overlay cố định.

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

  // Keep the stirring latch in sync before rendering children, including reset.
  const nextHasBeenStirred = status.stirring || status.naohAddedMl > 0 || status.hclAddedMl > 0
    ? hasBeenStirred || status.stirring
    : false
  if (nextHasBeenStirred !== hasBeenStirred) {
    setHasBeenStirred(nextHasBeenStirred)
  }

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
  const settleSample = () => runStep('settle', onSettle, 'Không thể thực hiện bước lắng.')
  const filterSample = () => runStep('filter', onFilter, 'Không thể thực hiện bước lọc.')

  /**
   * Đếm số chỉ tiêu Fe/Zn/Pb trong filtrate đạt giới hạn Cột A QCVN 40:2025.
   * Dùng cùng ngưỡng với `deriveGoalStatus` ở server action
   * (`WT_QCVN_COLUMN_A`), nên bảng tổng hợp và trạng thái luôn khớp nhau.
   */
  const columnAMetCount = useMemo(() => {
    if (!calculation) return 0
    const { filtrate_mgPerL } = calculation
    const met = [
      filtrate_mgPerL.Fe <= WT_QCVN_COLUMN_A.Fe_mgPerL,
      filtrate_mgPerL.Zn <= WT_QCVN_COLUMN_A.Zn_mgPerL,
      filtrate_mgPerL.Pb <= WT_QCVN_COLUMN_A.Pb_mgPerL,
    ]
    return met.filter(Boolean).length
  }, [calculation])

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

  return <div className={styles.apparatus}>
    <div className={styles.apparatusHeader}>
      <div>

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

        {/* Hiệu ứng xoáy nước khi khuấy */}
        {status.stirring && !status.filtered && liquidDepth > 10 && (
          <g className={styles.vortex} aria-label="Lốc xoáy trên mặt nước">
            <ellipse cx={STIRRER_CX} cy={waterY + 5} rx="54" ry="8" fill="#d8bd70" fillOpacity=".28" />
            <path
              d={'M' + (BEAKER_LEFT_X + 10) + ' ' + (waterY + 3) + ' Q190 ' + (waterY + 46) + ' ' + (BEAKER_RIGHT_X - 10) + ' ' + (waterY + 3) + ' Q190 ' + (waterY + 22) + ' ' + (BEAKER_LEFT_X + 10) + ' ' + (waterY + 3)}
              fill="#d2ad54"
              fillOpacity=".28"
              stroke="#a88439"
              strokeOpacity=".5"
              strokeWidth="1.2"
            />
            <path
              d={'M' + (STIRRER_CX - 21) + ' ' + (waterY + 4) + ' Q' + STIRRER_CX + ' ' + (waterY + 24) + ' ' + (STIRRER_CX + 21) + ' ' + (waterY + 4)}
              fill="none"
              stroke="#f5e6ad"
              strokeOpacity=".75"
              strokeWidth="2"
            />
            <ellipse cx={STIRRER_CX} cy={waterY + 35} rx="12" ry="4" fill="#a56535" fillOpacity=".35" />
          </g>
        )}

        {/* Kết tủa: tách lớp theo khối lượng riêng khi lắng, hạt bay lơ lửng khi khuấy.
            Fe(OH)₃ (ρ ≈ 4.3 g/cm³) nặng nhất → đáy dưới; Pb(OH)₂ (ρ ≈ 7.4 g/cm³)
            và Zn(OH)₂ (ρ ≈ 3.0 g/cm³) nằm trên. Fe nặng nên khuấy vẫn nằm thấp;
            Zn nhẹ nên bay lên cao trong cốc. */}
        {(() => {
          const { solid } = sampleMeta
          const totalPpt = solid.Fe + solid.Zn + solid.Pb
          if (totalPpt <= 0 || liquidDepth <= 8) return null
          const cx = (BEAKER_LEFT_X + BEAKER_RIGHT_X) / 2
          const floorY = BEAKER_BOTTOM_Y - 2
          // Bề rộng trong của cốc
          const beakerInnerW = BEAKER_RIGHT_X - BEAKER_LEFT_X - 6

          /**
           * Tốc độ lắng tương đối theo Stokes: v ∝ Δρ · d² / η
           * Fe(OH)₃: Δρ lớn nhất, kích thước vón lớn → nhanh nhất → lắng sâu nhất
           * Zn(OH)₂: Δρ nhỏ, hạt mịn → chậm nhất → bay cao khi khuấy
           * Pb(OH)₂: trung bình
           * Đặt normalized settling height (1 = đáy cốc, 0 = bề mặt):
           * Fe: 1.0 (nhanh), Pb: 0.6, Zn: 0.3
           */
          const SETTLE_DEPTH = { Fe: 1.0, Pb: 0.65, Zn: 0.35 }

          // Số hạt mỗi kim loại tỷ lệ với lượng rắn (log scale để tránh 1 hạt cho lượng nhỏ)
          const metalN = (mgL: number) => Math.max(1, Math.round(Math.log1p(mgL) * 3.5))
          const feN = metalN(solid.Fe)
          const pbN = metalN(solid.Pb)
          const znN = metalN(solid.Zn)

          // Kích thước hạt: Fe vón to (vì floc lớn), Zn/Pb mịn hơn
          const feSize = (i: number) => 1.8 + ((i * 7) % 7) * 0.4     // Fe: 1.8–4.2
          const pbSize = (i: number) => 1.1 + ((i * 5) % 5) * 0.3    // Pb: 1.1–2.3
          const znSize = (i: number) => 0.8 + ((i * 3) % 4) * 0.25   // Zn: 0.8–1.8

          // Tính bề dày mỗi lớp trong lớp lắng đáy.
          // Hệ số bedPxPerMgL = 0.6 để đảm bảo ngay cả ~5 mg/L cũng thấy rõ;
          // Fe 30 mg/L → 15 px, Zn 30 mg/L → 8 px, Pb 0.05 mg/L → 0.03 px.
          // Nếu tổng vượt 30 px thì scale-down đồng đều để không tràn cốc.
          const bedPxPerMgL = 0.6
          const feBedHRaw = solid.Fe * bedPxPerMgL
          const pbBedHRaw = solid.Pb * bedPxPerMgL
          const znBedHRaw = solid.Zn * bedPxPerMgL
          const bedCap = 30
          const bedSumRaw = feBedHRaw + pbBedHRaw + znBedHRaw
          const bedScale = bedSumRaw > bedCap ? bedCap / bedSumRaw : 1
          // Cap từng lớp theo khối lượng riêng để 1 lớp không nuốt hết đáy.
          const feBedH = Math.min(18, feBedHRaw * bedScale)
          const pbBedH = Math.min(8, pbBedHRaw * bedScale)
          const znBedH = Math.min(6, znBedHRaw * bedScale)
          const totalBedH = feBedH + pbBedH + znBedH

          /**
           * Khi khuấy: hạt phân bố theo độ cao lơ lửng tương ứng.
           * Fe nặng nhất → gần đáy; Zn nhẹ nhất → bay cao.
           * Độ cao tối đa = bề dày cột nước trừ vùng lắng.
           */
          const maxSuspensionH = liquidDepth - totalBedH - 6

          /**
           * Hàm vẽ 1 nhóm hạt (khuấy hoặc lắng).
           * metal: 'Fe' | 'Pb' | 'Zn'
           */
          const renderParticles = (
            metal: 'Fe' | 'Pb' | 'Zn',
            count: number,
            sizeFn: (i: number) => number,
            fill: string,
            edge: string,
            settledTopY: number,
            settledBotY: number,
            orbitRx: number,
          ) => {
            if (count === 0) return null
            const n = Math.min(count, 10)
            if (status.stirring) {
              // Khuấy: hạt lơ lửng theo settling depth
              const settleDepth = SETTLE_DEPTH[metal]
              const suspensionTopY = floorY - totalBedH - 6 - maxSuspensionH * settleDepth
              return Array.from({ length: n }, (_, i) => {
                const phase = ((i * 7 + (metal === 'Fe' ? 3 : metal === 'Pb' ? 5 : 7)) % 12) / 12
                const spreadFraction = (i * 11 + 7) % 13 / 13
                const y = suspensionTopY + spreadFraction * maxSuspensionH * settleDepth
                const size = sizeFn(i)
                return (
                  <ellipse
                    key={metal + i}
                    cx={cx}
                    cy={y}
                    rx={size} ry={size * 0.7}
                    fill={fill} stroke={edge} strokeOpacity=".6" strokeWidth=".45"
                    className={styles.pptSwirl}
                    style={{
                      ['--swirl-a' as string]: orbitRx.toFixed(2) + 'px',
                      ['--swirl-b' as string]: (orbitRx * 0.2).toFixed(2) + 'px',
                      animationDelay: (-phase * 2.1).toFixed(2) + 's',
                    } as React.CSSProperties}
                  />
                )
              })
            } else {
              // Lắng: hạt nằm trên lớp lắng tương ứng
              return Array.from({ length: n }, (_, i) => {
                const seed = i * 13 + (metal === 'Fe' ? 5 : metal === 'Pb' ? 11 : 7)
                const xFrac = (seed % 11) / 11
                const yFrac = ((seed * 7) % 9) / 9
                const x = BEAKER_LEFT_X + 4 + xFrac * beakerInnerW
                const y = settledTopY + yFrac * (settledBotY - settledTopY)
                const size = sizeFn(i)
                return (
                  <ellipse key={metal + i}
                    cx={x} cy={y}
                    rx={size} ry={size * 0.7}
                    fill={fill} stroke={edge} strokeOpacity=".7" strokeWidth=".4" fillOpacity=".92"
                  />
                )
              })
            }
          }

          // Orbit radius nhỏ hơn cho các hạt nhẹ (Zn)
          const baseOrbitRx = Math.max(6, Math.min(26, beakerInnerW / 2 - 12))

          /**
           * Lớp lắng đáy: tách 3 lớp theo khối lượng riêng.
           * Đáy dưới cùng = Fe(OH)₃ (nặng nhất), trên = Pb(OH)₂, trên cùng = Zn(OH)₂.
           * Nếu chỉ có 1 kim loại → 1 lớp duy nhất.
           */
          const hasMultiLayer = (solid.Fe > 0 && solid.Pb > 0) || (solid.Fe > 0 && solid.Zn > 0) || (solid.Pb > 0 && solid.Zn > 0)

          return (
            <g clipPath={'url(#' + uid + 'beaker)'} data-testid="wt-precipitate">
              {/* Lớp lắng đáy */}
              {hasMultiLayer ? (
                // 3 lớp tách biệt
                <g>
                  {/* Fe — đáy dưới */}
                  {solid.Fe > 0 && (
                    <path
                      d={'M' + (BEAKER_LEFT_X + 3) + ' ' + floorY
                        + ' Q' + cx + ' ' + (floorY - feBedH - 1) + ' ' + (BEAKER_RIGHT_X - 3) + ' ' + floorY
                        + ' L' + (BEAKER_RIGHT_X - 3) + ' ' + floorY + ' Z'}
                      fill={SOLID_STYLE.Fe.fill} fillOpacity=".92"
                      stroke={SOLID_STYLE.Fe.edge} strokeOpacity=".85" strokeWidth=".8"
                    />
                  )}
                  {/* Pb — lớp giữa */}
                  {solid.Pb > 0 && (
                    <path
                      d={'M' + (BEAKER_LEFT_X + 3) + ' ' + (floorY - feBedH)
                        + ' Q' + cx + ' ' + (floorY - feBedH - pbBedH - 1) + ' ' + (BEAKER_RIGHT_X - 3) + ' ' + (floorY - feBedH)
                        + ' L' + (BEAKER_RIGHT_X - 3) + ' ' + floorY
                        + ' L' + (BEAKER_LEFT_X + 3) + ' ' + floorY + ' Z'}
                      fill={SOLID_STYLE.Pb.fill} fillOpacity=".90"
                      stroke={SOLID_STYLE.Pb.edge} strokeOpacity=".85" strokeWidth=".8"
                    />
                  )}
                  {/* Zn — trên cùng */}
                  {solid.Zn > 0 && (
                    <path
                      d={'M' + (BEAKER_LEFT_X + 3) + ' ' + (floorY - feBedH - pbBedH)
                        + ' Q' + cx + ' ' + (floorY - totalBedH - 1) + ' ' + (BEAKER_RIGHT_X - 3) + ' ' + (floorY - feBedH - pbBedH)
                        + ' L' + (BEAKER_RIGHT_X - 3) + ' ' + (floorY - feBedH)
                        + ' L' + (BEAKER_LEFT_X + 3) + ' ' + (floorY - feBedH) + ' Z'}
                      fill={SOLID_STYLE.Zn.fill} fillOpacity=".88"
                      stroke={SOLID_STYLE.Zn.edge} strokeOpacity=".85" strokeWidth=".8"
                    />
                  )}
                </g>
              ) : (
                // 1 lớp duy nhất
                <path
                  d={'M' + (BEAKER_LEFT_X + 3) + ' ' + floorY
                    + ' Q' + cx + ' ' + (floorY - totalBedH - 3) + ' ' + (BEAKER_RIGHT_X - 3) + ' ' + floorY
                    + ' Z'}
                  fill={sampleMeta.precipitateColor ?? SOLID_STYLE.Fe.fill}
                  fillOpacity=".9"
                  stroke={sampleMeta.precipitateEdge ?? SOLID_STYLE.Fe.edge}
                  strokeOpacity=".9" strokeWidth=".9"
                />
              )}

              {/* Hạt lơ lửng — Fe */}
              {renderParticles('Fe', feN, feSize, SOLID_STYLE.Fe.fill, SOLID_STYLE.Fe.edge,
                floorY - feBedH, floorY, baseOrbitRx)}

              {/* Hạt lơ lửng — Pb */}
              {renderParticles('Pb', pbN, pbSize, SOLID_STYLE.Pb.fill, SOLID_STYLE.Pb.edge,
                floorY - feBedH - pbBedH, floorY - feBedH, baseOrbitRx * 0.9)}

              {/* Hạt lơ lửng — Zn (nhẹ nhất, bay cao) */}
              {renderParticles('Zn', znN, znSize, SOLID_STYLE.Zn.fill, SOLID_STYLE.Zn.edge,
                floorY - feBedH - pbBedH - znBedH, floorY - feBedH - pbBedH, baseOrbitRx * 0.75)}
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
        {status.filtered ? (
          <button type="button" className={styles.lockButton} onClick={onLockBan2} data-testid="wt-lock-ban2">
            <LockIcon /> Khóa Bàn 2
          </button>
        ) : null}
      </div>
      <button type="button" className={styles.stirButton} data-active={status.stirring} onClick={onToggleStir} data-testid="wt-toggle-stir">
        {status.stirring ? <StopIcon /> : <PlayIcon />}
        {status.stirring ? 'Dừng khuấy' : 'Bật khuấy'}
      </button>
      <div className={styles.buretControls}>
        {(['naoh', 'hcl'] as const).map((reagent) => {
          const empty = reagent === 'naoh' ? naohEmpty : hclEmpty
          const disabled = empty || ban2Locked
          const label = reagent === 'naoh' ? 'NaOH' : 'HCl'
          return <div className={styles.buretControl} key={reagent}>
            <span>{label}</span>
            <DoseStepMenu
              solution={reagent}
              value={dropSteps[reagent]}
              onChange={(value) => setDropStep(reagent, value)}
              disabled={disabled}
            />
            <button type="button" className={styles.buretAdd} data-testid={`wt-add-${reagent}`} onClick={() => onAddDrop(reagent, dropSteps[reagent])} disabled={disabled}>
              <PlusIcon /> <span>{ban2Locked ? 'Đã khóa' : empty ? 'Đã hết' : 'Thêm'}</span>
            </button>
          </div>
        })}
      </div>
    </div>
    {calculationError ? <p className={styles.calculationError} role="alert">{calculationError}</p> : null}
    {calculation ? (
      <section className={styles.calculationPanel} aria-label="Bảng tổng hợp kết quả bàn xử lý nước">
        <div className={styles.calculationHeader}><div><strong>Kết quả xử lý nước</strong><span className={styles.calculationHeaderNote}>Bảng tổng hợp sau khuấy</span></div><span>Đơn vị: mg/L</span></div>
        <p className={styles.calculationExplanation}>So sánh lượng kim loại còn hòa tan với lượng đã chuyển thành kết tủa sau khi điều chỉnh pH.</p>
        <div className={styles.tableScroll}><table className={styles.table}><caption className={styles.tableCaption}>Kết quả Fe, Zn và Pb sau xử lý.</caption><thead><tr><th scope="col">Đại lượng</th><th scope="col">Fe</th><th scope="col">Zn</th><th scope="col">Pb</th></tr></thead><tbody>
          <tr><th scope="row">Còn hòa tan</th><td>{calculation.filtrate_mgPerL.Fe.toFixed(6)}</td><td>{calculation.filtrate_mgPerL.Zn.toFixed(6)}</td><td>{calculation.filtrate_mgPerL.Pb.toFixed(6)}</td></tr>
          <tr><th scope="row">Đã kết tủa</th><td>{calculation.precipitated_mgPerL.Fe.toFixed(6)}</td><td>{calculation.precipitated_mgPerL.Zn.toFixed(6)}</td><td>{calculation.precipitated_mgPerL.Pb.toFixed(6)}</td></tr>
          <tr><th scope="row">Giới hạn Cột A</th><td>{WT_QCVN_COLUMN_A.Fe_mgPerL.toFixed(6)}</td><td>{WT_QCVN_COLUMN_A.Zn_mgPerL.toFixed(6)}</td><td>{WT_QCVN_COLUMN_A.Pb_mgPerL.toFixed(6)}</td></tr>
        </tbody></table></div>
        <div className={styles.calculationSummary}><span>pH sau xử lý <strong>{calculation.pH.toFixed(6)}</strong></span><span>Đạt <strong>{columnAMetCount}/3</strong></span></div>

        {/* Bảng lịch sử lọc cộng dồn — hiện sau khi đã lọc ít nhất 1 lần */}
        {filterHistory && filterHistory.length > 0 && (
          <div className={styles.tableScroll} style={{ marginTop: '12px' }}><table className={styles.table}><caption className={styles.tableCaption}>Lịch sử lọc — kết quả tích lũy Fe, Zn và Pb. Cột “đã lọc” so với nồng độ ban đầu ở Bàn 1.</caption><thead><tr><th scope="col">Lần</th><th scope="col">pH</th><th scope="col">Fe còn lại</th><th scope="col">Zn còn lại</th><th scope="col">Pb còn lại</th><th scope="col">Fe đã lọc</th><th scope="col">Zn đã lọc</th><th scope="col">Pb đã lọc</th></tr></thead><tbody>
            {filterHistory.map((entry) => (
              <tr key={entry.index}>
                <th scope="row">{entry.index}</th>
                <td>{entry.calculation.pH.toFixed(2)}</td>
                <td>{entry.cumulativeRemaining.Fe.toFixed(4)}</td>
                <td>{entry.cumulativeRemaining.Zn.toFixed(4)}</td>
                <td>{entry.cumulativeRemaining.Pb.toFixed(4)}</td>
                <td>{entry.cumulativeFiltered ? entry.cumulativeFiltered.Fe.toFixed(4) : '—'}</td>
                <td>{entry.cumulativeFiltered ? entry.cumulativeFiltered.Zn.toFixed(4) : '—'}</td>
                <td>{entry.cumulativeFiltered ? entry.cumulativeFiltered.Pb.toFixed(4) : '—'}</td>
              </tr>
            ))}
          </tbody></table></div>
        )}
      </section>
    ) : null}

      <div className={styles.precipitateGuide} aria-label="Màu và pH tham khảo của kết tủa">
        <strong>Màu kết tủa và pH tham khảo</strong>
        {PRECIPITATE_GUIDANCE.map((item) => (
          <span key={item.label}>{item.label} · {item.ph}</span>
        ))}
        <span>ZnSO₄ + Pb(NO₃)₂: PbSO₄ có thể tạo chất rắn trắng, không cần tăng pH.</span>
      </div>

    <p className={styles.apparatusNote}>Mực buret, tốc độ khuấy và pH chỉ mang tính minh họa; giá trị thật lưu ở bảng dưới.</p>
  </div>
}
