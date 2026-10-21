/**
 * Closed-form 3-KL simultaneous capacity model cho nước chứa Fe/Zn/Pb.
 *
 * Công thức cho từng kim loại M hóa trị n tại sample pH khi phase baseline
 * (Fe=Ferrihydrite / Zn=Zn(OH)₂(am) / Pb=Pb(OH)₂) đạt SI=0:
 *
 *   [M^n+]_free = Ksp_M / [OH-]^n × (1/γ_M^n+ / 1/γ_OH-^n)   (mol/L, activity)
 *   [M]_total  = Σ_{j=0..4} [M^n+]_free × 10^(log_K_j + (j-1)·pH)        (mol/L)
 *
 * Trong đó j đánh số hydrolysis step (0 = free ion, 1 = MOH^(n-1)+, ...).
 *
 * Hằng số lấy từ `minteq.v4.dat` PHREEQC 3.8.6-17100 (đã pin, SHA-256
 * `a93914e63b0c616f8506cc92739188e50c5b9a15c33b111979652f308457f4ac`).
 * Xem `tools/research/phreeqc-pin/3.8.6-17100/cases/P0-C-CROSSCHECK-REPORT.md`
 * cho cross-check vs GC-SOLID-01 PHREEQC output.
 *
 * ⚠️ AI-prepared, requires chemistry owner sign-off trước khi đánh dấu P0-C đóng
 * chính thức trong evidence register.
 */

import { WT_KSP_LOGK } from './constants'

/** pKw tại 25 °C theo IAPWS R11-24 (đã pin trong PHREEQC 3.8.6-17100) */
const WT_PKW_25C = 13.99

/**
 * Hydrolysis constants `log_k` cho Fe³⁺, Zn²⁺, Pb²⁺ theo `minteq.v4.dat`
 * (Id được ghi trong comment). Mỗi mảng có 4 phần tử:
 *   index 0: log K cho free ion (log_k của 1 hydrolysis step M + H2O ⇌ MOH + H+)
 *   index j (j≥1): log K cho M(OH)_j^{(n-j)+} ⇌ ... + j·H+
 *
 * Reaction convention theo MINTEQ v4 đã pin:
 *   Fe+3 + j H2O = Fe(OH)_j^{(3-j)+} + j H+    (j=1..4)
 *   Zn+2 + j H2O = Zn(OH)_j^{(2-j)+} + j H+    (j=1..4)
 *   Pb+2 + j H2O = Pb(OH)_j^{(2-j)+} + j H+    (j=1..4)
 */
const WT_HYDROLYSIS_LOGK = {
  Fe: [-2.187, -4.594, -12.56, -21.588] as const,
  Zn: [-8.997, -17.794, -28.091, -40.488] as const,
  Pb: [-7.597, -17.094, -28.091, -39.699] as const,
} as const

export type WaterTreatmentMetal = 'Fe' | 'Zn' | 'Pb'

/**
 * Tính `log[OH-]` từ pH (dùng pKw 13.99 theo convention MINTEQ v4).
 *
 * @param pH Sample pH (đã ổn định tại pH cuối sau equilibrate)
 */
function logOhFromPh(pH: number): number {
  return pH - WT_PKW_25C
}

/**
 * Công thức 1: nồng độ free ion `[M^n+]` tại SI=0 với phase baseline
 * (không tính hydrolysis complexes).
 *
 * Công thức gốc: SI=0 ⟺ log a_M + n·log a_OH = log Ksp
 *               ⟹ [M^n+]_act = Ksp / [OH-]^n  (γ=1)
 *               ⟹ [M^n+]_mol = [M^n+]_act / γ_M
 *
 * Approximation: γ_M ≈ γ_OH ≈ 1 cho ionic strength < 0.01 (sample nước
 * thải loãng). Sai số ở I > 0.01 nên dùng Davies để hiệu chỉnh.
 */
function freeMetalAtSaturation(
  metal: WaterTreatmentMetal,
  pH: number,
): number {
  const logKsp = WT_KSP_LOGK[metal]
  const logOh = logOhFromPh(pH)
  const valence = metal === 'Fe' ? 3 : 2
  // log[M^n+] = logKsp - valence × log[OH-]
  const logM = logKsp - valence * logOh
  return Math.pow(10, logM)
}

/**
 * Tính tổng molality của kim loại M tại SI=0, bao gồm tất cả hydrolysis
 * complexes trong `minteq.v4.dat` (Fe: 0..4, Zn: 0..4, Pb: 0..4).
 *
 * Công thức:
 *   [M]_total = Σ_{j=0..N} [M(OH)_j]   (j=0 là free ion)
 *   [M(OH)_j] = [M^n+]_free × 10^(log_K_j + j·pH)
 *
 * Ví dụ với Fe tại pH 8.78:
 *   j=0: [Fe+3] = Ksp / [OH-]^3 ≈ 7.59e-24
 *   j=1: [FeOH+2] = [Fe+3] × 10^(-2.187+8.78) = 7.59e-24 × 10^6.593 = 2.95e-17
 *   j=2: [Fe(OH)2+] = [Fe+3] × 10^(-4.594+17.56) = 7.59e-24 × 10^12.966 = 7.08e-11
 *   j=3: [Fe(OH)3(aq)] = [Fe+3] × 10^(-12.56+26.34) = 7.59e-24 × 10^13.78 = 4.59e-10
 *   j=4: [Fe(OH)4-] = [Fe+3] × 10^(-21.588+35.12) = 7.59e-24 × 10^13.532 = 2.59e-10
 *   Tổng: ≈ 7.58e-10 mol/L
 */
export function totalDissolvedMetalAtSaturation(
  metal: WaterTreatmentMetal,
  pH: number,
): number {
  const freeM = freeMetalAtSaturation(metal, pH)
  const logKs = WT_HYDROLYSIS_LOGK[metal]
  // Free ion (j=0)
  let total = freeM
  // Hydrolyzed species (j=1..N): log[M(OH)_j] = log[M^n+] + log K_j + j × pH
  for (let j = 1; j <= logKs.length; j++) {
    const logK = logKs[j - 1]
    if (logK === undefined) continue
    const logConcentration = Math.log10(freeM) + logK + j * pH
    total += Math.pow(10, logConcentration)
  }
  return total
}

/**
 * Tính tất cả 3 kim loại cùng lúc tại sample pH.
 *
 * @returns Map metal -> mol/L total dissolved tại SI=0 với phase baseline
 */
export function capacityAtSaturation(pH: number): {
  Fe: number
  Zn: number
  Pb: number
} {
  return {
    Fe: totalDissolvedMetalAtSaturation('Fe', pH),
    Zn: totalDissolvedMetalAtSaturation('Zn', pH),
    Pb: totalDissolvedMetalAtSaturation('Pb', pH),
  }
}

/**
 * Tính tỉ lệ (ratio) giữa tổng dissolved và free ion tại pH — dùng để
 * biết hydrolysis nào chiếm ưu thế (Zn tại pH 9 thường > 1.5× vì có
 * cả ZnOH+, Zn(OH)2(aq) đáng kể).
 */
export function hydrolysisEnrichmentFactor(
  metal: WaterTreatmentMetal,
  pH: number,
): number {
  const free = freeMetalAtSaturation(metal, pH)
  const total = totalDissolvedMetalAtSaturation(metal, pH)
  if (free <= 0) return 1
  return total / free
}
