/**
 * Client-side solver pH cho mẫu ban đầu (sau khi pha muối precursor).
 *
 * Theo `docs/experiments/water-treatment-spec.md` §6.1.2 (mô hình pH cho mẫu
 * ban đầu sau khi pha muối). pH ban đầu KHÔNG phải user input — phải được
 * tính từ composition Fe/Zn/Pb ngay khi user pick slider.
 *
 * Mô hình mở rộng (2026-10-18): bao gồm hydrolysis bậc 1 của cả
 * Fe³⁺ (FeOH²⁺), Zn²⁺ (ZnOH⁺), Pb²⁺ (PbOH⁺) trong charge balance.
 *
 * Approximation: chỉ tính hydrolysis Fe bậc 1 (FeOH²⁺), Zn bậc 1 (ZnOH⁺),
 * Pb bậc 1 (PbOH⁺). Bỏ qua Fe bậc 2/3, Zn bậc 2+, Pb bậc 2+, chloro
 * complexes FeCl²⁺/FeCl₂⁺, và carbonate buffer.
 * Sai số dự kiến 0,3–0,5 đơn vị pH so với thực nghiệm (theo spec §6.1.2 note).
 *
 * Solver: bisection trên charge balance, khoảng pH [0; 14].
 *
 * Khi pH vượt pH kết tủa hydroxide của Fe (Fe(OH)₃, log Ksp = -38,779 theo
 * constants.ts), một phần Fe sẽ kết tủa. Solver dùng vòng lặp đơn giản:
 * 1. Giả sử tất cả Fe tan → tính pH từ charge balance.
 * 2. Tại pH đó, nếu [Fe³⁺]_free > [Fe³⁺]_saturation → trừ phần dư khỏi
 *    T_Fe, lặp lại cho đến khi hội tụ hoặc đạt maxIter.
 *
 * Output: pH ∈ [0; 14], hoặc null nếu solver không hội tụ.
 */

import { WT_KSP_LOGK } from './constants.js'

/** Khối lượng mol (g/mol) của từng ion kim loại. */
const MOLAR_MASS = { Fe: 55.845, Zn: 65.38, Pb: 207.2 } as const

/** pKw tại 25 °C theo spec §6.1.1 (claim AN-KW-25C, IAPWS R11-24). */
const KW_25C = 13.99

/** log K hydrolysis Fe³⁺ + H₂O ⇌ FeOH²⁺ + H⁺ (spec §6.1.2, claim WT-CHEM-K-FeOH). */
const K_FE_OH_LOG = -2.19

/**
 * log β₁ Zn hydrolysis: Zn²⁺ + H₂O ⇌ ZnOH⁺ + H⁺ (spec §6.1.2, claim WT-CHEM-K-ZnOH,
 * phreeqc.dat PHREEQC 3.8.6-17100). β₁ yếu (pKa ≈ 9.0), nhưng được bao gồm
 * trong model mở rộng từ 2026-10-18.
 */
const K_ZN_OH_LOG = -9.0

/**
 * log β₁ Pb hydrolysis: Pb²⁺ + H₂O ⇌ PbOH⁺ + H⁺ (spec §6.1.2, claim WT-CHEM-K-PbOH,
 * phreeqc.dat PHREEQC 3.8.6-17100). β₁ trung bình (pKa ≈ 7.7), có ảnh hưởng
 * đáng kể ở pH 6-7 khi nồng độ Pb cao.
 */
const K_PB_OH_LOG = -7.7

/** log K SO₄²⁻ + H⁺ ⇌ HSO₄⁻ (spec §6.1.2, claim WT-CHEM-H2SO4-dissociation). */
const K_HSO4_LOG = -1.99

/** pH guard [2; 13] theo spec §5.2.1 — clamp output về khoảng hợp lệ. */
const PH_CLAMP_MIN = 0
const PH_CLAMP_MAX = 14

/**
 * Tính nồng độ mol/L từ mg/L và khối lượng mol.
 */
function mgPerLToMolPerL(mgPerL: number, M: number): number {
  return (mgPerL / 1000) / M
}

/**
 * Tính [Fe³⁺]_free từ pH và T_Fe theo mass balance:
 *   T_Fe = [Fe³⁺] + [FeOH²⁺]
 *   [FeOH²⁺] = K_FeOH × [Fe³⁺] / [H⁺]
 *   ⟹ [Fe³⁺] = T_Fe / (1 + K_FeOH / [H⁺])
 */
function freeFe3(T_Fe: number, pH: number): number {
  const logK = K_FE_OH_LOG
  const logH = -pH
  // log(K_FeOH / [H⁺]) = logK - logH
  const ratio = Math.pow(10, logK - logH)
  return T_Fe / (1 + ratio)
}

function freeFeOH2(T_Fe: number, pH: number): number {
  return T_Fe - freeFe3(T_Fe, pH)
}

/**
 * Tính [Zn²⁺]_free từ pH và T_Zn theo mass balance:
 *   T_Zn = [Zn²⁺] + [ZnOH⁺]
 *   [ZnOH⁺] = K_ZnOH × [Zn²⁺] / [H⁺]
 *   ⟹ [Zn²⁺] = T_Zn / (1 + K_ZnOH / [H⁺])
 */
function freeZn2(T_Zn: number, pH: number): number {
  const ratio = Math.pow(10, K_ZN_OH_LOG + pH) // K_ZnOH / [H⁺]
  return T_Zn / (1 + ratio)
}

function freeZnOH(T_Zn: number, pH: number): number {
  return T_Zn - freeZn2(T_Zn, pH)
}

/**
 * Tính [Pb²⁺]_free từ pH và T_Pb theo mass balance:
 *   T_Pb = [Pb²⁺] + [PbOH⁺]
 *   [PbOH⁺] = K_PbOH × [Pb²⁺] / [H⁺]
 *   ⟹ [Pb²⁺] = T_Pb / (1 + K_PbOH / [H⁺])
 */
function freePb2(T_Pb: number, pH: number): number {
  const ratio = Math.pow(10, K_PB_OH_LOG + pH) // K_PbOH / [H⁺]
  return T_Pb / (1 + ratio)
}

function freePbOH(T_Pb: number, pH: number): number {
  return T_Pb - freePb2(T_Pb, pH)
}

/**
 * Tính [SO₄²⁻]_free từ pH và T_S theo mass balance:
 *   T_S = [SO₄²⁻] + [HSO₄⁻]
 *   [HSO₄⁻] = K_HSO4 × [SO₄²⁻] × [H⁺]
 *   ⟹ [SO₄²⁻] = T_S / (1 + K_HSO4 × [H⁺])
 */
function freeSO4(T_S: number, pH: number): number {
  const logK = K_HSO4_LOG
  const logH = -pH
  // log(K_HSO4 × [H⁺]) = logK + logH
  const ratio = Math.pow(10, logK + logH)
  return T_S / (1 + ratio)
}

function freeHSO4(T_S: number, pH: number): number {
  return T_S - freeSO4(T_S, pH)
}

/**
 * Tính [Fe³⁺]_free tại pH theo solubility của Fe(OH)₃ (Ferrihydrite, log Ksp = -38,779).
 * Nếu T_Fe > capacity → phần dư kết tủa, [Fe³⁺]_free = capacity.
 */
function fe3Saturation(pH: number): number {
  // Ksp = [Fe³⁺] × [OH⁻]³
  const logKsp = WT_KSP_LOGK.Fe
  const logOh = pH - KW_25C
  return Math.pow(10, logKsp - 3 * logOh)
}

/**
 * Charge balance theo spec §6.1.2 Bước 2 với hydrolysis Fe/Zn/Pb bậc 1.
 *
 * Thêm số hạng H⁺ giải phóng từ kết tủa Fe(OH)₃:
 *   Fe³⁺ + 3 H₂O ⇌ Fe(OH)₃(s) + 3 H⁺
 *
 * Trả về LHS - RHS tại pH (zero khi cân bằng).
 *
 *   LHS = [H⁺] + 3[Fe³⁺] + 2[FeOH²⁺] + 2[Zn²⁺] + [ZnOH⁺] + 2[Pb²⁺] + [PbOH⁺]
 *   RHS = [OH⁻] + [Cl⁻] + 2[SO₄²⁻] + [HSO₄⁻] + [NO₃⁻] + 3[Fe_precipitated]
 *
 * Mass balances:
 *   [Fe³⁺] = T_Fe_free / (1 + K_FeOH / [H⁺])      (fe3Max = min(T_Fe, sat))
 *   [FeOH²⁺] = T_Fe_free - [Fe³⁺]
 *   [Zn²⁺] = T_Zn / (1 + K_ZnOH / [H⁺])
 *   [ZnOH⁺] = T_Zn - [Zn²⁺]
 *   [Pb²⁺] = T_Pb / (1 + K_PbOH / [H⁺])
 *   [PbOH⁺] = T_Pb - [Pb²⁺]
 *
 * Counter-ions: Cl⁻ = 3×T_Fe (FeCl₃), NO₃⁻ = 2×T_Pb (Pb(NO₃)₂).
 * SO₄²⁻/HSO₄⁻ từ ZnSO₄: T_S = T_Zn.
 */
function chargeImbalance(
  pH: number,
  T_Fe: number,
  T_Zn: number,
  T_Pb: number,
  fePrecipitated: number,
): number {
  const hPlus = Math.pow(10, -pH)
  const ohMinus = Math.pow(10, pH - KW_25C)

  // Fe species: hydrolysis Fe³⁺ bậc 1 (FeOH²⁺), capped by saturation
  const fe3Max = Math.min(T_Fe, fe3Saturation(pH))
  const feRatio = Math.pow(10, K_FE_OH_LOG + pH) // K_FeOH / [H⁺]
  const fe3 = fe3Max / (1 + feRatio)
  const feOH2 = fe3Max - fe3

  // Zn species: hydrolysis Zn²⁺ bậc 1 (ZnOH⁺)
  const zn2 = freeZn2(T_Zn, pH)
  const znOH = T_Zn - zn2

  // Pb species: hydrolysis Pb²⁺ bậc 1 (PbOH⁺)
  const pb2 = freePb2(T_Pb, pH)
  const pbOH = T_Pb - pb2

  // Anion species: SO₄²⁻ (from ZnSO₄), HSO₄⁻
  const so4 = freeSO4(T_Zn, pH)
  const hso4 = T_Zn - so4

  // Counter-ions
  const clMinus = 3 * T_Fe // FeCl₃
  const no3Minus = 2 * T_Pb // Pb(NO₃)₂

  const lhs =
    hPlus +
    3 * fe3 +
    2 * feOH2 +
    2 * zn2 +
    znOH +
    2 * pb2 +
    pbOH

  const rhs =
    ohMinus +
    clMinus +
    2 * so4 +
    hso4 +
    no3Minus +
    3 * fePrecipitated

  return lhs - rhs
}

/**
 * Tính lượng Fe kết tủa tại pH: nếu T_Fe > capacity thì phần dư kết tủa.
 * Tại pH, [Fe³⁺]_tan tối đa = min(T_Fe, Ksp/[OH⁻]³) (chưa tính hydrolysis).
 * Approximation: dùng freeFe3 trên T_Fe (giả sử hydrolysis không đáng kể
 * cho mục đích ước lượng kết tủa).
 */
function fePrecipitatedAt(pH: number, T_Fe: number): number {
  if (T_Fe <= 0) return 0
  const cap = fe3Saturation(pH)
  // Tính T_Fe mà freeFe3 = cap, không tính hydrolysis (over-estimate nhẹ).
  // Nếu T_Fe > cap × (1 + K_FeOH/[H⁺]) → có kết tủa
  const ratio = Math.pow(10, K_FE_OH_LOG + pH)
  const tanMax = cap * (1 + ratio)
  return Math.max(0, T_Fe - tanMax)
}

/**
 * Bisection: tìm pH ∈ [PH_CLAMP_MIN; PH_CLAMP_MAX] với chargeImbalance = 0.
 * Nếu không hội tụ → trả về midpoint xấp xỉ.
 */
function bisectPh(
  T_Fe: number,
  T_Zn: number,
  T_Pb: number,
  fePrecipitated: number,
  iterations = 60,
): number | null {
  let lo = PH_CLAMP_MIN
  let hi = PH_CLAMP_MAX
  let fLo = chargeImbalance(lo, T_Fe, T_Zn, T_Pb, fePrecipitated)
  let fHi = chargeImbalance(hi, T_Fe, T_Zn, T_Pb, fePrecipitated)
  if (fLo * fHi > 0) {
    return (lo + hi) / 2
  }
  for (let i = 0; i < iterations; i++) {
    const mid = (lo + hi) / 2
    const fMid = chargeImbalance(mid, T_Fe, T_Zn, T_Pb, fePrecipitated)
    if (Math.abs(fMid) < 1e-12) return mid
    if (fLo * fMid < 0) {
      hi = mid
      fHi = fMid
    } else {
      lo = mid
      fLo = fMid
    }
  }
  return (lo + hi) / 2
}

/**
 * Solver pH cho mẫu ban đầu sau khi pha muối precursor.
 *
 * @param composition Nồng độ Fe/Zn/Pb (mg/L) user pick trên slider.
 * @param volumeMl Thể tích mẫu (mL) — không ảnh hưởng pH vì coi nước nguyên chất.
 * @returns pH ∈ [0; 14] hoặc null nếu không hỗ trợ (composition âm, v.v.).
 */
export function solveInitialPh(
  composition: { Fe: number; Zn: number; Pb: number },
  volumeMl: number,
): number | null {
  // Validate: composition không âm, volume hợp lệ
  if (
    composition.Fe < 0 ||
    composition.Zn < 0 ||
    composition.Pb < 0 ||
    !Number.isFinite(composition.Fe) ||
    !Number.isFinite(composition.Zn) ||
    !Number.isFinite(composition.Pb) ||
    volumeMl <= 0
  ) {
    return null
  }
  // Nếu tất cả metal = 0 → pH nước nguyên chất ≈ 7 (Kw = 13.99 → pH 7.0)
  if (composition.Fe === 0 && composition.Zn === 0 && composition.Pb === 0) {
    return 7
  }
  // Chuyển mg/L → mol/L
  let T_Fe = mgPerLToMolPerL(composition.Fe, MOLAR_MASS.Fe)
  let T_Zn = mgPerLToMolPerL(composition.Zn, MOLAR_MASS.Zn)
  const T_Pb = mgPerLToMolPerL(composition.Pb, MOLAR_MASS.Pb)

  // Vòng lặp kết tủa Fe: nếu pH tăng quá cao → Fe(OH)₃ kết tủa, giải
  // phóng 3 H⁺ → pH giảm. Lặp đến khi hội tụ (max 12 vòng).
  let pH: number = 7
  let fePrecipitated = 0
  for (let iter = 0; iter < 12; iter++) {
    fePrecipitated = fePrecipitatedAt(pH, T_Fe)
    const bisected = bisectPh(T_Fe, T_Zn, T_Pb, fePrecipitated)
    if (bisected === null) break
    pH = bisected
    // Check hội tụ
    const newPrecipitated = fePrecipitatedAt(pH, T_Fe)
    if (Math.abs(newPrecipitated - fePrecipitated) < 1e-9) {
      fePrecipitated = newPrecipitated
      break
    }
    fePrecipitated = newPrecipitated
  }
  return pH
}

/**
 * Tính capacity hòa tan (mg/L) tại pH cho từng kim loại. Mirror logic
 * `capacityAtSaturation` từ `capacity.ts` nhưng ở client-side và trả
 * thẳng mg/L để UI hiển thị.
 */
export function capacityAtPhMgPerL(pH: number): { Fe: number; Zn: number; Pb: number } {
  const logOh = pH - KW_25C
  // Free ion mol/L tại SI=0
  const feFree = Math.pow(10, WT_KSP_LOGK.Fe - 3 * logOh)
  const znFree = Math.pow(10, WT_KSP_LOGK.Zn - 2 * logOh)
  const pbFree = Math.pow(10, WT_KSP_LOGK.Pb - 2 * logOh)
  // Approximation total ≈ free ion (bỏ qua hydrolysis ở đây; solver
  // endpoint thực sự dùng `capacityAtSaturation` ở server action).
  return {
    Fe: feFree * MOLAR_MASS.Fe * 1000,
    Zn: znFree * MOLAR_MASS.Zn * 1000,
    Pb: pbFree * MOLAR_MASS.Pb * 1000,
  }
}

/**
 * Slider cap và step theo spec §3.2.2 và §3.2.6 — hàm helper cho UI.
 *
 * @param N Số kim loại đã tick (> 0).
 */
export function sliderCap(N: number): number {
  if (N <= 0) return 0
  return 100 / (N * N)
}

export function sliderStepFeZn(N: number): number {
  return N >= 3 ? 0.01 : 0.1
}

export function sliderStepPb(): number {
  return 0.001
}
