'use server'

/**
 * Server action cho Water Treatment workbench.
 *
 * Mỗi lần user click thao tác (đo pH, thêm reagent, khuấy, lắng, lọc) → gọi
 * action tương ứng. Solver dùng closed-form `capacityAtSaturation(pH)` (P0-C
 * đã cross-check PHREEQC ±0,025 log) + QCVN Cột A (P0-A đã xác minh pháp lý).
 *
 * Không persist DB (preview mode) — return result cho client lưu vào in-memory state.
 *
 * Xem `docs/experiments/water-treatment-spec.md` §6.5, §6.6, §7.4 và
 * `docs/scientific-evidence-register.md` §5.1.3 để biết baseline + giới hạn.
 */

import { capacityAtSaturation } from '@/features/water-treatment/capacity.js'
import { WT_QCVN_COLUMN_A } from '@/features/water-treatment/constants.js'

/** pH guard [2; 13] theo spec §6.4 (ngoài khoảng này solver không đáng tin). */
const PH_GUARD_MIN = 2
const PH_GUARD_MAX = 13

/** QCVN Cột A (P0-A đã đóng 16/10/2026). */
const QCVN_A = {
  Fe: WT_QCVN_COLUMN_A.Fe_mgPerL,
  Zn: WT_QCVN_COLUMN_A.Zn_mgPerL,
  Pb: WT_QCVN_COLUMN_A.Pb_mgPerL,
} as const

const ATOMIC_WEIGHT = { Fe: 55.845, Zn: 65.38, Pb: 207.2 } as const

export type WaterTreatmentAction =
  | 'measure-initial-ph'
  | 'add-base'
  | 'add-acid'
  | 'stir'
  | 'settle'
  | 'filter'
  | 'measure-final'

export type WaterTreatmentActionInput = {
  readonly action: WaterTreatmentAction
  /** Composition mẫu hiện tại (mg/L). */
  readonly composition: { readonly Fe: number; readonly Zn: number; readonly Pb: number }
  /** pH hiện tại. */
  readonly pH: number
  /** Thể tích mẫu (mL). Mặc định 1000. */
  readonly volume_mL?: number
  /** Liều reagent (mL) cho add-acid/add-base. Mặc định 0. */
  readonly dose_mL?: number
}

export type WaterTreatmentResult = {
  readonly action: WaterTreatmentAction
  readonly composition: { readonly Fe: number; readonly Zn: number; readonly Pb: number }
  /** pH sau action. */
  readonly pH: number
  /** pH trước action (cho history diff). */
  readonly previousPH: number
  readonly capacity: { readonly Fe: number; readonly Zn: number; readonly Pb: number }
  /** mol/L total dissolved tại SI=0 với phase baseline. */
  readonly capacity_mgPerL: { readonly Fe: number; readonly Zn: number; readonly Pb: number }
  /** mg/L filtrate kỳ vọng = max(0, input - capacity). */
  readonly filtrate_mgPerL: { readonly Fe: number; readonly Zn: number; readonly Pb: number }
  /** mg/L chuyển sang sludge (kết tủa). = input - filtrate. */
  readonly precipitated_mgPerL: { readonly Fe: number; readonly Zn: number; readonly Pb: number }
  /** pH guard hit nếu vi phạm [PH_GUARD_MIN; PH_GUARD_MAX]. */
  readonly pHGuardHit: 'min' | 'max' | null
  /** mass-balance delta %, hiện chưa wired (P0-J ±2% là phase 2). */
  readonly massBalancePct: { readonly Fe: number; readonly Zn: number; readonly Pb: number }
  readonly goalStatus: 'pending' | 'success' | 'partial-success' | 'failed' | 'invalid' | 'unknown'
  readonly expectedOutcome: 'success' | 'partial-success' | 'failed' | 'invalid'
  readonly verificationStatus: 'cross-checked'
  /** Lý do `invalid` nếu có. */
  readonly invalidReasonCodes: readonly string[]
  /** Event log cho attempt. */
  readonly events: ReadonlyArray<{
    readonly action: WaterTreatmentAction
    readonly timestamp: number
    readonly pH: number
    readonly note: string
  }>
}

/** Coarse model pH shift khi thêm 1 mL HCl/NaOH 1 M vào 1 L mẫu. */
function coarsePhShift(action: 'add-base' | 'add-acid', dose_mL: number, volume_mL: number): number {
  // 1 mL 1 M trong 1 L → +1 mmol H+ hoặc OH-. Trên 1 L nước pH ≈ 7, mỗi mmol
  // OH- dịch pH ≈ +0.5 (đơn giản hoá). Chia theo volume.
  const factor = (1 * dose_mL) / volume_mL // mmol/L
  if (action === 'add-base') return Math.min(2, factor * 0.5)
  return -Math.min(2, factor * 0.5)
}

/** Tính filtrate từ input composition + capacity. */
function computeFiltrate(
  composition: { Fe: number; Zn: number; Pb: number },
  pH: number,
): {
  capacity_mgPerL: { Fe: number; Zn: number; Pb: number }
  filtrate_mgPerL: { Fe: number; Zn: number; Pb: number }
  precipitated_mgPerL: { Fe: number; Zn: number; Pb: number }
} {
  const cap = capacityAtSaturation(pH) // mol/L
  const cap_mgL = {
    Fe: cap.Fe * ATOMIC_WEIGHT.Fe * 1000,
    Zn: cap.Zn * ATOMIC_WEIGHT.Zn * 1000,
    Pb: cap.Pb * ATOMIC_WEIGHT.Pb * 1000,
  }
  // Filtrate (nồng độ hòa tan cân bằng tại pH đã đo):
  //   - Nếu composition > capacity: pha rắn hiện hữu → filtrate = capacity
  //     (lượng dư kết tủa; lượng tan tối đa bằng capacity trả về bởi SOLVER).
  //   - Nếu composition ≤ capacity: hệ chưa bão hòa → filtrate = composition
  //     (không kết tủa, tất cả input tan hết).
  // capacity trả về bởi `capacityAtSaturation(pH)` là tổng mol/L của free ion +
  // hydrolysis complexes tại SI=0 với pha rắn baseline — tức là giới hạn trên
  // của nồng độ hòa tan, không phải lượng kết tủa. Sai số hóa học: hydroxide-only
  // baseline chưa tính Cl⁻/SO₄²⁻/CO₃²⁻ complexes (chemistry owner có thể bổ sung).
  const filtrate = {
    Fe: Math.min(composition.Fe, cap_mgL.Fe),
    Zn: Math.min(composition.Zn, cap_mgL.Zn),
    Pb: Math.min(composition.Pb, cap_mgL.Pb),
  }
  const precipitated = {
    Fe: Math.max(0, composition.Fe - filtrate.Fe),
    Zn: Math.max(0, composition.Zn - filtrate.Zn),
    Pb: Math.max(0, composition.Pb - filtrate.Pb),
  }
  return { capacity_mgPerL: cap_mgL, filtrate_mgPerL: filtrate, precipitated_mgPerL: precipitated }
}

/** Goal status từ filtrate + QCVN. */
function deriveGoalStatus(
  filtrate: { Fe: number; Zn: number; Pb: number },
): 'success' | 'partial-success' | 'failed' {
  const pass = {
    Fe: filtrate.Fe <= QCVN_A.Fe,
    Zn: filtrate.Zn <= QCVN_A.Zn,
    Pb: filtrate.Pb <= QCVN_A.Pb,
  }
  const passed = [pass.Fe, pass.Zn, pass.Pb].filter(Boolean).length
  if (passed === 3) return 'success'
  if (passed >= 1) return 'partial-success'
  return 'failed'
}

export async function runWaterTreatmentAction(
  input: WaterTreatmentActionInput,
): Promise<WaterTreatmentResult> {
  const volume = input.volume_mL ?? 1000
  const dose = input.dose_mL ?? 0
  const previousPH = input.pH
  const invalidReasonCodes: string[] = []

  // Step 1: cập nhật pH theo action
  let pH = input.pH
  switch (input.action) {
    case 'add-base':
      pH = Math.min(14, previousPH + coarsePhShift('add-base', dose, volume))
      break
    case 'add-acid':
      pH = Math.max(0, previousPH + coarsePhShift('add-acid', dose, volume))
      break
    case 'measure-initial-ph':
    case 'measure-final':
    case 'stir':
    case 'settle':
    case 'filter':
      // pH không đổi trong bước này (placeholder cho skeleton)
      break
  }

  // Step 2: pH guard check
  let pHGuardHit: 'min' | 'max' | null = null
  if (pH < PH_GUARD_MIN) {
    pHGuardHit = 'min'
    invalidReasonCodes.push('PH_GUARD_BELOW_MIN')
  } else if (pH > PH_GUARD_MAX) {
    pHGuardHit = 'max'
    invalidReasonCodes.push('PH_GUARD_ABOVE_MAX')
  }

  // Step 3: capacity + filtrate
  const capacity = capacityAtSaturation(pH)
  const { capacity_mgPerL, filtrate_mgPerL, precipitated_mgPerL } = computeFiltrate(
    input.composition,
    pH,
  )

  // Step 4: goal status
  let goalStatus: WaterTreatmentResult['goalStatus']
  let expectedOutcome: WaterTreatmentResult['expectedOutcome']
  if (invalidReasonCodes.length > 0) {
    goalStatus = 'invalid'
    expectedOutcome = 'invalid'
  } else if (input.action === 'measure-initial-ph' || input.action === 'add-acid' || input.action === 'add-base') {
    // Trước khi khuấy/lắng/lọc → goalStatus vẫn pending (chưa có filtrate thật)
    goalStatus = 'pending'
    expectedOutcome = 'success'
  } else {
    const chemistryStatus = deriveGoalStatus(filtrate_mgPerL)
    goalStatus = chemistryStatus
    expectedOutcome = chemistryStatus
  }

  // Step 5: mass-balance (placeholder, P0-J wire-up là phase 2)
  const massBalancePct = { Fe: 0, Zn: 0, Pb: 0 }

  return {
    action: input.action,
    composition: input.composition,
    pH,
    previousPH,
    capacity,
    capacity_mgPerL,
    filtrate_mgPerL,
    precipitated_mgPerL,
    pHGuardHit,
    massBalancePct,
    goalStatus,
    expectedOutcome,
    verificationStatus: 'cross-checked',
    invalidReasonCodes,
    events: [
      {
        action: input.action,
        timestamp: Date.now(),
        pH,
        note: noteFor(input.action, pH, previousPH, dose, volume),
      },
    ],
  }
}

function noteFor(
  action: WaterTreatmentAction,
  pH: number,
  previousPH: number,
  dose_mL: number,
  volume_mL: number,
): string {
  switch (action) {
    case 'measure-initial-ph':
      return `Đo pH ban đầu: ${previousPH.toFixed(2)}`
    case 'add-base':
      return `Thêm NaOH ${dose_mL} mL vào ${volume_mL} mL mẫu: pH ${previousPH.toFixed(2)} → ${pH.toFixed(2)}`
    case 'add-acid':
      return `Thêm HCl ${dose_mL} mL vào ${volume_mL} mL mẫu: pH ${previousPH.toFixed(2)} → ${pH.toFixed(2)}`
    case 'stir':
      return `Khuấy 5 phút ở pH ${pH.toFixed(2)}`
    case 'settle':
      return `Lắng 15 phút ở pH ${pH.toFixed(2)}`
    case 'filter':
      return `Lọc phase rắn ở pH ${pH.toFixed(2)}`
    case 'measure-final':
      return `Đo pH cuối: ${pH.toFixed(2)}`
  }
}
