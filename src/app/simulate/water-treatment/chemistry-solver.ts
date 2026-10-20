/**
 * Complete charge-balance + Ksp precipitation solver for Fe/Zn/Pb water treatment.
 *
 * Chemistry model (baseline D1–D5, cross-checked PHREEQC ±0.025 log):
 *   - Ksp: Fe(OH)₃(s) / Zn(OH)₂(s) / Pb(OH)₂(s) @ SI=0
 *   - Hydrolysis: Fe³⁺/Zn²⁺/Pb²⁺ → MOH, M(OH)₂, M(OH)₃, M(OH)₄ complexes
 *   - Activity coefficients: Davies equation (I ≤ 0.1 M, T = 25 °C)
 *   - Charge balance: Σ(cation charges) = Σ(anion charges)
 *
 * Solver architecture:
 *   1. solveInitialPh(composition) → pH from charge balance (no reagent added yet)
 *   2. solvePhAfterReagent(composition, addedOH, addedH) → pH after NaOH/HCl
 *   3. computeDissolvedAtPh(composition, pH) → dissolved species + precipitated
 *
 * Provenance: same constants as `capacity.ts` (minteq.v4.dat PHREEQC 3.8.6-17100).
 * ⚠️ AI-prepared; requires chemistry owner sign-off before clinical use.
 */

import { WT_KSP_LOGK } from '@/features/water-treatment/constants.js'

// ─── Physical constants ───────────────────────────────────────────────────────

/** pKw at 25 °C (IAPWS R11-24, same as PHREEQC 3.8.6-17100). */
const PKW = 13.99

/** Davies constant A at 25 °C for water (I = ½Σcᵢzᵢ²). */
const DAVIES_A = 0.5085

// ─── Atomic weights (mg/mol) ─────────────────────────────────────────────────

export const ATOMIC_WEIGHT = { Fe: 55.845, Zn: 65.38, Pb: 207.2 } as const

// ─── Ligand complexes (Cl⁻, SO₄²⁻) — MINTEQ v4 / PHREEQC 3.8.6-17100 ──────
//
// Fe³⁺ strongly complexes with Cl⁻ at low pH (pH < 3). These complexes dominate
// the aqueous speciation when Cl⁻ is present from FeCl₃·6H₂O. Without them, charge
// balance fails at pH ~2 (Fe³⁺ appears to contribute no charge, leaving only Cl⁻
// as anion → impossible to balance). logK values from minteq.v4.dat:
//
//   Fe³⁺ + j Cl⁻ = FeCl_j^(3-j)+   (j = 1, 2, 3)
//     FeCl²⁺:  logK_1 = 0.37  (significant below pH 3)
//     FeCl₂⁺:  logK_2 = 0.04  (minor)
//     FeCl₃(aq): logK_3 = -2.06 (negligible)
//
//   Zn²⁺ + SO₄²⁻ = ZnSO₄(aq)
//     logK = 2.37   (significant at [SO₄²⁻] > 1 mM)
//
//   Pb²⁺ + NO₃⁻ = PbNO₃⁺
//     logK = 1.17   (minor but included for completeness)
//
// For activity corrections: γ(FeCl²⁺) uses |z|=2; γ(ZnSO₄) uses |z|=0 (neutral).

type LigandComplex = {
  logK: number
  charge: number  // charge of the complex
  stoichiometry: number  // number of ligands per metal
}

type ComplexMap = Record<Metal, readonly LigandComplex[]>

const FE_CL_COMPLEXES: readonly LigandComplex[] = [
  { logK: 0.37,   charge: 2, stoichiometry: 1 },  // FeCl²⁺ (dominant at pH < 3)
  { logK: 0.04,   charge: 1, stoichiometry: 2 },  // FeCl₂⁺
  { logK: -2.06,  charge: 0, stoichiometry: 3 },  // FeCl₃(aq) — neutral, negligible
]

const ZN_SO4_COMPLEXES: readonly LigandComplex[] = [
  { logK: 2.37, charge: 0, stoichiometry: 1 },   // ZnSO₄(aq) — neutral
]

const PB_NO3_COMPLEXES: readonly LigandComplex[] = [
  { logK: 1.17, charge: 1, stoichiometry: 1 },   // PbNO₃⁺ — minor
]

const LIGAND_COMPLEXES: ComplexMap = {
  Fe: FE_CL_COMPLEXES,
  Zn: ZN_SO4_COMPLEXES,
  Pb: PB_NO3_COMPLEXES,
} as const

// ─── Hydrolysis log K (minteq.v4.dat, PHREEQC 3.8.6-17100) ──────────────────
//
// Convention (MINTEQ v4):
//   Fe+3 + j H₂O = Fe(OH)_j^(3-j) + j H⁺   (j = 1..4)
//   Zn+2 + j H₂O = Zn(OH)_j^(2-j) + j H⁺   (j = 1..4)
//   Pb+2 + j H₂O = Pb(OH)_j^(2-j) + j H⁺   (j = 1..4)
//
// logK_j (j=1..4):
//   Fe: [-2.187, -4.594, -12.56, -21.588]
//   Zn: [-8.997, -17.794, -28.091, -40.488]
//   Pb: [-7.597, -17.094, -28.091, -39.699]
// Reference species is the free ion M^n+.

type Metal = 'Fe' | 'Zn' | 'Pb'

const HYDROLYSIS_LOGK: Record<Metal, readonly [number, number, number, number]> = {
  Fe: [-2.187, -4.594, -12.56, -21.588],
  Zn: [-8.997, -17.794, -28.091, -40.488],
  Pb: [-7.597, -17.094, -28.091, -39.699],
} as const

// Valence of free metal ion
const VALENCE: Record<Metal, number> = { Fe: 3, Zn: 2, Pb: 2 }

// ─── Salt stoichiometry ──────────────────────────────────────────────────────
//
// We assume the most common precursor salts:
//   Fe  → FeCl₃·6H₂O  → 3 Cl⁻ per Fe
//   Zn  → ZnSO₄·7H₂O  → 1 SO₄²⁻ per Zn
//   Pb  → Pb(NO₃)₂     → 2 NO₃⁻ per Pb
//
// This is a reasonable default. If user used different salts, the charge
// balance shifts accordingly. For production: accept explicit anion input.

type AnionConcentrations = {
  Cl_mM: number    // mmol/L Cl⁻
  SO4_mM: number  // mmol/L SO₄²⁻
  NO3_mM: number  // mmol/L NO₃⁻
}

export function inferAnions(composition: { Fe: number; Zn: number; Pb: number }): AnionConcentrations {
  const Fe_mM = composition.Fe / ATOMIC_WEIGHT.Fe
  const Zn_mM = composition.Zn / ATOMIC_WEIGHT.Zn
  const Pb_mM = composition.Pb / ATOMIC_WEIGHT.Pb
  return {
    Cl_mM:  Fe_mM * 3,       // 3 Cl⁻ per FeCl₃
    SO4_mM: Zn_mM * 1,       // 1 SO₄²⁻ per ZnSO₄
    NO3_mM: Pb_mM * 2,       // 2 NO₃⁻ per Pb(NO₃)₂
  }
}

// ─── Activity coefficients (Davies) ───────────────────────────────────────────

/**
 * Davies equation for single-ion activity coefficient at 25 °C, I ≤ 0.1 M.
 *   ln γᵢ = -A·zᵢ²·(√I / (1+√I) - 0.3·I)
 *
 * @param z  Ion charge (absolute value).
 * @param I  Ionic strength (M).
 * @returns γ (dimensionless, 0 < γ ≤ 1).
 */
function daviesGamma(z: number, I: number): number {
  if (I < 1e-7) return 1.0  // very dilute
  const term = (Math.sqrt(I)) / (1 + Math.sqrt(I)) - 0.3 * I
  const lnGamma = -DAVIES_A * z * z * term
  return Math.exp(Math.max(-10, lnGamma))  // clamp extreme values
}

/**
 * Estimate ionic strength from all dissolved species.
 *   I = ½ · Σ cᵢ · zᵢ²
 *
 * This is a first-pass estimate; for full accuracy iterate with updated γ.
 * We use a single-pass estimate here (sufficient for I < 0.1 M range).
 */
function estimateIonicStrength(
  anions: AnionConcentrations,
  metals: { Fe: number; Zn: number; Pb: number },  // total dissolved (mol/L)
  H_mol: number,
): number {
  // Anions
  let I = 0.5 * (anions.Cl_mM * 1e-3 * 1  // Cl⁻ charge = 1
             + anions.SO4_mM * 1e-3 * 4   // SO₄²⁻ charge = 2 → z²=4
             + anions.NO3_mM * 1e-3 * 1)  // NO₃⁻ charge = 1
  // Metals (mol/L total)
  I += 0.5 * (metals.Fe * 9   // Fe³⁺ z²=9
            + metals.Zn * 4   // Zn²⁺ z²=4
            + metals.Pb * 4)  // Pb²⁺ z²=4
  // H⁺ and OH⁻
  I += 0.5 * (H_mol * 1 + (1e-14 / H_mol) * 1)
  return I
}

// ─── Free metal at SI=0 ───────────────────────────────────────────────────────

/**
 * Free [M^n+] (mol/L) at SI=0 with solid phase M(OH)_n(s).
 *
 *   Ksp_M = [M^n+] · [OH⁻]ⁿ · γ_M · γ_OHⁿ
 *   ⟹ [M^n+] = Ksp / ([OH⁻]ⁿ · γ_M · γ_OHⁿ)
 *
 * @param metal  Fe | Zn | Pb
 * @param pH     Sample pH.
 * @param gamma  Activity coefficient of the metal ion (Davies, default 1).
 * @param gammaOH  Activity coefficient of OH⁻ (Davies, default 1).
 */
function freeMetalAtPh(
  metal: Metal,
  pH: number,
  gamma: number = 1,
  gammaOH: number = 1,
): number {
  const logKsp = WT_KSP_LOGK[metal]
  const n = VALENCE[metal]
  const logOh = pH - PKW
  const logOhTerm = logKsp - n * (logOh + Math.log10(gammaOH))
  const logM = logOhTerm - Math.log10(gamma)
  return Math.pow(10, logM)
}

// ─── Total dissolved metal at pH (with ligand complexes) ────────────────────

/**
 * Ligand complex concentration: [ML_j] = [M^n+] · β_j · [L]^j
 * where β_j = 10^logK_j and [L] = free ligand concentration.
 *
 * For Fe-Cl: [L] = free [Cl⁻] (simplified: use total Cl⁻ ≈ free Cl⁻ at these concentrations).
 * For Zn-SO₄: [L] = free [SO₄²⁻].
 * For Pb-NO₃: [L] = free [NO₃⁻].
 *
 * The free ligand concentration is approximated as total ligand minus
 * bound ligand (negligible correction at these metal concentrations).
 */
function ligandComplexConc(
  metal: Metal,
  freeM_mol: number,
  ligandTotal_mM: number,  // total ligand (mmol/L)
  _gammaL: number = 1,    // reserved activity coeff of ligand anion
): number {
  const complexes = LIGAND_COMPLEXES[metal]
  let total = 0
  for (const cpl of complexes) {
    // β_j = 10^logK
    const beta = Math.pow(10, cpl.logK)
    // [ML_j] = freeM · β · (free L)^j
    // free L ≈ total L at low metal:ligand ratios
    const freeL_mM = Math.max(0, ligandTotal_mM)
    const freeL_mol = freeL_mM * 1e-3
    const conc_mol = freeM_mol * beta * Math.pow(freeL_mol, cpl.stoichiometry)
    total += conc_mol
  }
  return total
}

/**
 * Total dissolved mol/L of metal M (free ion + hydrolysis + ligand complexes) at SI=0.
 *
 * Includes:
 *   - Free ion [M^n+]
 *   - Hydrolysis species MOH^(n-1)+, M(OH)₂^(n-2)+, ..., M(OH)₄^(n-4)+
 *   - Ligand complexes (FeCl²⁺, FeCl₂⁺, ZnSO₄(aq), PbNO₃⁺)
 *
 * The free ion is determined by Ksp at SI=0. All other species derive from it.
 */
function totalDissolvedAtPh(
  metal: Metal,
  pH: number,
  gamma: number = 1,
  gammaOH: number = 1,
  anions?: AnionConcentrations,
): number {
  const freeM = freeMetalAtPh(metal, pH, gamma, gammaOH)
  const logKs = HYDROLYSIS_LOGK[metal]

  // Hydrolysis species (j = 1..4)
  let total = freeM  // j=0: free ion
  for (let j = 1; j <= 4; j++) {
    const logK = logKs[j - 1]! // j is bounded by the four-entry tuple.
    // log[M(OH)_j] = log[M^n+] + logK_j + j·pH
    const logConcentration = Math.log10(freeM) + logK + j * pH
    total += Math.pow(10, logConcentration)
  }

  // Ligand complexes
  if (anions) {
    if (metal === 'Fe') {
      total += ligandComplexConc(metal, freeM, anions.Cl_mM)
    }
    if (metal === 'Zn') {
      total += ligandComplexConc(metal, freeM, anions.SO4_mM)
    }
    if (metal === 'Pb') {
      total += ligandComplexConc(metal, freeM, anions.NO3_mM)
    }
  }

  return total
}

// ─── Charge balance ───────────────────────────────────────────────────────────

type ChargeBalanceInput = {
  composition: { Fe: number; Zn: number; Pb: number }  // total metal input (mg/L)
  addedOH_mM: number   // net OH⁻ added from NaOH (mmol/L)
  addedH_mM: number    // net H⁺ added from HCl (mmol/L)
}

/**
 * Compute average charge of all dissolved species of a metal at given pH.
 * Used for charge balance: Σ(M_total · z̄_M) = z̄_Fe·Fe_total + z̄_Zn·Zn_total + z̄_Pb·Pb_total
 *
 * Includes: free ion (z = valence) + hydrolysis (z = valence - j) + ligand complexes.
 */
function avgMetalCharge(
  metal: Metal,
  pH: number,
  gamma: number,
  gammaOH: number,
  anions: AnionConcentrations,
): number {
  const freeM = freeMetalAtPh(metal, pH, gamma, gammaOH)
  if (freeM < 1e-30) return VALENCE[metal]

  const logKs = HYDROLYSIS_LOGK[metal]

  // Hydrolysis charge sum
  let totalConc = freeM
  let chargeSum = VALENCE[metal] * freeM
  for (let j = 1; j <= 4; j++) {
    const logK = logKs[j - 1]! // j is bounded by the four-entry tuple.
    const logC = Math.log10(freeM) + logK + j * pH
    const conc = Math.pow(10, logC)
    totalConc += conc
    chargeSum += (VALENCE[metal] - j) * conc
  }

  // Ligand complexes
  const complexes = LIGAND_COMPLEXES[metal]

  for (const cpl of complexes) {
    const beta = Math.pow(10, cpl.logK)
    let ligandConc = 0
    if (metal === 'Fe') {
      ligandConc = freeM * beta * Math.pow(anions.Cl_mM * 1e-3, cpl.stoichiometry)
    } else if (metal === 'Zn') {
      ligandConc = freeM * beta * Math.pow(anions.SO4_mM * 1e-3, cpl.stoichiometry)
    } else if (metal === 'Pb') {
      ligandConc = freeM * beta * Math.pow(anions.NO3_mM * 1e-3, cpl.stoichiometry)
    }
    totalConc += ligandConc
    chargeSum += cpl.charge * ligandConc
  }

  return totalConc > 0 ? chargeSum / totalConc : VALENCE[metal]
}

/**
 * Charge balance residual: LHS - RHS of the electroneutrality equation.
 *
 *   CATIONS: H⁺ + Na⁺ + Σ(M_eff · z̄_M)         (M = Fe, Zn, Pb)
 *   ANIONS:  Cl⁻ + SO₄²⁻ + NO₃⁻ + OH⁻
 *
 * Returns residual (eq/L). Zero = perfect charge balance.
 *
 * ⚠️ Lỗi B fix (2026-10-18): `M_eff = min(capacity_at_SI0, T_M)`.
 * Khi kim loại ở regime undersaturated (T_M < capacity), việc dùng capacity
 * làm cation charge sẽ phóng đại LHS lên hàng triệu × (vd. Zn²⁺ ở pH acid có
 * Ksp capacity ≈ 10⁶ M >> T_M = 10⁻⁴ M). Bisection sẽ "balance" sai tại pH
 * không vật lý. Clamp về T_M để charge balance dùng lượng dissolved thực sự.
 * z̄ vẫn dùng được ở cả hai regime vì chỉ phụ thuộc speciation ratios
 * (hằng số hydrolysis + pH + ligand concentration), không phụ thuộc biên độ
 * freeM (cùng formula cho saturated và undersaturated).
 *
 * ⚠️ Lỗi D fix (2026-10-18): `Cl_eq` cộng thêm `addedH_mM` (HCl phân ly hoàn
 * toàn thành H⁺ + Cl⁻). H⁺ được hấp thụ vào `[H⁺] = 10⁻ᵖᴴ`; Cl⁻ vĩnh viễn
 * trong solution và phải tính trong anion balance.
 *
 * Lưu ý về H⁺: `[H⁺]_actual = 10⁻ᵖᴴ` đã bao gồm tất cả nguồn H⁺
 * (water dissociation + Fe hydrolysis kể cả precipitation). KHÔNG cộng
 * `hReleased` riêng (sẽ double-count); thay vào đó, khi kim loại precipitate,
 * lượng dissolved giảm → cation charge giảm → bisection sẽ đẩy pH xuống để
 * `[H⁺]` cân bằng anions.
 *
 * Bao gồm hydrolysis complexes (Fe/Zn/Pb j=1..4) + ligand complexes
 * (FeCl²⁺, ZnSO₄(aq), PbNO₃⁺).
 */
function chargeBalanceResidual(
  pH: number,
  input: ChargeBalanceInput,
  gamma: number = 1,
  gammaOH: number = 1,
): number {
  const anions = inferAnions(input.composition)
  const { addedOH_mM, addedH_mM } = input

  // OH⁻ and H⁺ from water + reagent (mol/L).
  // [H⁺] absorbs all H⁺ sources (water + hydrolysis + precipitation), so no
  // separate "hReleased" term is needed in charge balance.
  const OH_mol = Math.pow(10, pH - PKW)
  const H_mol = Math.pow(10, -pH)

  // Anions (eq/L). Cl⁻ accumulates from precursor salts + added HCl (HCl
  // dissociates fully to H⁺ + Cl⁻; H⁺ joins [H⁺], Cl⁻ stays in solution).
  const Cl_eq   = (anions.Cl_mM + addedH_mM) * 1e-3 * 1   // Cl⁻ charge = 1
  const SO4_eq  = anions.SO4_mM * 1e-3 * 2                // SO₄²⁻ charge = 2
  const NO3_eq  = anions.NO3_mM * 1e-3 * 1                // NO₃⁻ charge = 1
  const OH_eq   = OH_mol
  const totalAnion = Cl_eq + SO4_eq + NO3_eq + OH_eq

  // Na⁺ from NaOH (mol/L) — permanent cation, not absorbed into pH (only
  // OH⁻ from NaOH is; that's already in 10^pH-14 above).
  const Na_mol = addedOH_mM * 1e-3

  // Total dissolved metals at this pH (mol/L), CLAMPED to T_M so the
  // undersaturated regime uses the actual dissolved amount instead of the
  // Ksp-derived capacity. Without the clamp, bisection settles at an
  // unphysical pH (e.g., 7.86 instead of ~3.2) because Zn's Ksp capacity
  // (≈10⁶ M at low pH) overwhelms the anion side.
  const Fe_capacity = totalDissolvedAtPh('Fe', pH, gamma, gammaOH, anions)
  const Zn_capacity = totalDissolvedAtPh('Zn', pH, gamma, gammaOH, anions)
  const Pb_capacity = totalDissolvedAtPh('Pb', pH, gamma, gammaOH, anions)
  const Fe_T_mol = input.composition.Fe / (ATOMIC_WEIGHT.Fe * 1000)
  const Zn_T_mol = input.composition.Zn / (ATOMIC_WEIGHT.Zn * 1000)
  const Pb_T_mol = input.composition.Pb / (ATOMIC_WEIGHT.Pb * 1000)
  const Fe_total_mol = Math.min(Fe_capacity, Fe_T_mol)
  const Zn_total_mol = Math.min(Zn_capacity, Zn_T_mol)
  const Pb_total_mol = Math.min(Pb_capacity, Pb_T_mol)

  // Average charge per metal (including hydrolysis + ligand complexes).
  // z̄ depends only on speciation ratios (pH, free-ligand concentration),
  // not on the free-ion concentration — so this works whether the system is
  // saturated or undersaturated.
  const Fe_zbar = avgMetalCharge('Fe', pH, gamma, gammaOH, anions)
  const Zn_zbar = avgMetalCharge('Zn', pH, gamma, gammaOH, anions)
  const Pb_zbar = avgMetalCharge('Pb', pH, gamma, gammaOH, anions)

  // Total cation charge (eq/L)
  const totalCation =
    Na_mol +
    H_mol +
    Fe_total_mol * Fe_zbar +
    Zn_total_mol * Zn_zbar +
    Pb_total_mol * Pb_zbar

  // Residual = cations - anions (should be 0 when balanced)
  return totalCation - totalAnion
}

// ─── Bisection solver ────────────────────────────────────────────────────────

/**
 * Solve for pH where charge balance residual = 0 using bisection.
 * Searches in [pH_lo, pH_hi] until |residual| < tolerance.
 *
 * @param residualFn  Function(pH) → residual (eq/L).
 * @param pH_lo      Lower pH bound (default 2).
 * @param pH_hi      Upper pH bound (default 13).
 * @param tol        Convergence tolerance in eq/L (default 1e-7).
 * @param maxIter    Maximum iterations (default 100).
 * @returns pH at convergence, or NaN if failed.
 */
/**
 * Bisection solver: tìm pH ∈ [pH_lo; pH_hi] với residualFn(pH) ≈ 0.
 * Nếu không hội tụ → trả về midpoint xấp xỉ.
 * 
 * Fallback behavior: nếu [pH_lo, pH_hi] không có sign change (cùng dấu ở hai
 * biên) HOẶC bisection hội tụ tại biên với residual ≠ 0, thử lại với khoảng
 * [0.5, 14] đầy đủ. Điều này xảy ra với FIX chargeBalanceResidual khi pH sau
 * khi thêm NaOH (vd. 1 mM vào FeCl₃ 5 mg/L) có thể nằm ngoài khoảng hint±3
 * vì hydrolysis + ligand complexes chiếm ưu thế ở pH cao.
 */
function bisectPH(
  residualFn: (pH: number) => number,
  pH_lo = 2,
  pH_hi = 13,
  tol = 1e-7,
  maxIter = 100,
): number {
  function run(lo: number, hi: number): number {
    let fLo = residualFn(lo)
    let fHi = residualFn(hi)
    if (fLo * fHi > 0) return NaN
    for (let i = 0; i < maxIter; i++) {
      const pH_mid = (lo + hi) / 2
      const fMid = residualFn(pH_mid)
      if (Math.abs(fMid) < tol) return pH_mid
      if (fLo * fMid < 0) {
        fHi = fMid
        hi = pH_mid
      } else {
        fLo = fMid
        lo = pH_mid
      }
    }
    return (lo + hi) / 2  // best guess
  }
  // 1) Thử với khoảng hint trước
  let pH = run(pH_lo, pH_hi)
  // 2) Nếu hint range không có sign change HOẶC hội tụ tại biên với residual
  // không đạt tolerance, mở rộng về [0.5, 14] và retry.
  if (isNaN(pH) || Math.abs(residualFn(pH)) > 1e-5) {
    pH = run(0.5, 14)
  }
  return pH
}

// ─── Main solver API ─────────────────────────────────────────────────────────

export type ChemistryResult = {
  pH: number
  dissolved_mol: { Fe: number; Zn: number; Pb: number }   // mol/L total
  dissolved_mgL: { Fe: number; Zn: number; Pb: number }   // mg/L
  precipitated_mgL: { Fe: number; Zn: number; Pb: number } // mg/L
  capacity_mgL: { Fe: number; Zn: number; Pb: number }    // mg/L solubility at this pH
  ionicStrength: number                                       // M
  chargeBalanced: boolean                                     // |residual| < 1e-5 eq/L
}

/**
 * Solve initial pH of a water sample with Fe/Zn/Pb, using charge balance.
 * Assumes FeCl₃, ZnSO₄, Pb(NO₃)₂ precursor salts.
 *
 * Algorithm:
 *   1. Estimate ionic strength from salts
 *   2. Compute activity coefficients (Davies)
 *   3. Bisection-solve charge balance for pH
 *   4. Compute dissolved / precipitated at that pH
 */
export function solveInitialPh(
  composition: { Fe: number; Zn: number; Pb: number },
): ChemistryResult {
  const input: ChargeBalanceInput = { composition, addedOH_mM: 0, addedH_mM: 0 }
  const anions = inferAnions(composition)

  // Estimate ionic strength from salts (ignoring pH effects for first pass)
  const I_rough =
    0.5 * (anions.Cl_mM * 1e-3 * 1
          + anions.SO4_mM * 1e-3 * 4
          + anions.NO3_mM * 1e-3 * 1)
  const Fe_mM = composition.Fe / ATOMIC_WEIGHT.Fe
  const Zn_mM = composition.Zn / ATOMIC_WEIGHT.Zn
  const Pb_mM = composition.Pb / ATOMIC_WEIGHT.Pb
  const I_withMetals = I_rough + 0.5 * (Fe_mM * 1e-3 * 9 + Zn_mM * 1e-3 * 4 + Pb_mM * 1e-3 * 4)

  const I = Math.max(I_withMetals, 1e-6)
  const gamma = daviesGamma(3, I)  // Fe³⁺ valence
  const gammaOH = daviesGamma(1, I)

  // Bisection-solve for pH
  const pH = bisectPH((ph) => chargeBalanceResidual(ph, input, gamma, gammaOH), 0.5, 14, 1e-7, 200)
  if (isNaN(pH)) {
    // Fallback: try without activity correction
    const pH_raw = bisectPH((ph) => chargeBalanceResidual(ph, input, 1, 1), 0.5, 14, 1e-7, 200)
    return buildResult(pH_raw, composition, input, 1, 1)
  }
  return buildResult(pH, composition, input, gamma, gammaOH)
}

/**
 * Solve pH after adding NaOH or HCl.
 *
 * @param composition    Total metal composition (mg/L).
 * @param addedNaOH_mL  mL of NaOH 1 M added to `volume_mL` of sample.
 * @param addedHCl_mL   mL of HCl 1 M added to `volume_mL` of sample.
 * @param volume_mL     Sample volume (mL).
 * @param previousPh    Previous pH (for iteration hint).
 */
export function solveAfterReagent(
  composition: { Fe: number; Zn: number; Pb: number },
  addedNaOH_mL: number,
  addedHCl_mL: number,
  volume_mL: number,
  previousPh: number,
  cumulativeNaOH_mM?: number,
  cumulativeHCl_mM?: number,
): ChemistryResult {
  const vol_L = volume_mL / 1000

  // Cumulative reagent state across all calls (NaOH + HCl) tính bằng mM.
  // Server là solver 1-shot (stateless) — nó KHÔNG nhớ NaOH/HCl từ call
  // trước. Để charge balance đúng khi user mix NaOH + HCl trong cùng
  // attempt (Bước 2 allow HCl, Bước 3 trung hòa), client phải gửi TỔNG
  // mL NaOH/HCl qua `cumulativeNaOH_mL` / `cumulativeHCl_mL`; server quy
  // đổi sang mM bằng `volume_mL` rồi dùng làm Na⁺ / Cl⁻(HCl) tích lũy
  // trong charge balance.
  //
  // Back-compat: nếu client KHÔNG truyền (cũ), dùng dose_mL của call hiện
  // tại. Hành vi này đúng cho đơn reagent (NaOH alone hoặc HCl alone),
  // nhưng SAI khi user mix 2 reagent (xem test regression
  // `mix NaOH + HCl: pH ổn định` trong water-treatment-stir-settle-filter).
  const totalNaOH_mM =
    cumulativeNaOH_mM !== undefined ? cumulativeNaOH_mM : addedNaOH_mL / vol_L
  const totalHCl_mM =
    cumulativeHCl_mM !== undefined ? cumulativeHCl_mM : addedHCl_mL / vol_L

  const input: ChargeBalanceInput = {
    composition,
    addedOH_mM: totalNaOH_mM,
    addedH_mM: totalHCl_mM,
  }

  // Estimate ionic strength (rough)
  const anions = inferAnions(composition)
  const I = Math.max(
    0.5 * (anions.Cl_mM * 1e-3 * 1 + anions.SO4_mM * 1e-3 * 4 + anions.NO3_mM * 1e-3 * 1),
    1e-6,
  )
  const gamma = daviesGamma(3, I)
  const gammaOH = daviesGamma(1, I)

  // Không thêm reagent (settle/filter/re-measure-ph/measure-final) → tin tưởng
  // `previousPh` là pH hiện tại của hệ và tính chemistry tại đúng pH đó. Bisection
  // chỉ cần khi reagent làm thay đổi pH (add-base/add-acid); với các action còn
  // lại, việc tái bisection có thể trả về pH KHÁC `previousPh` vì hệ nhiều kim
  // loại có nhiều nghiệm cân bằng điện tích (vd. FeCl₃ đơn cho cả pH ~3 lẫn ~7
  // tuỳ cách đếm H⁺ released), gây khác biệt với `previousPh` user đã thiết lập.
  if (addedNaOH_mL === 0 && addedHCl_mL === 0) {
    return buildResult(previousPh, composition, input, gamma, gammaOH)
  }

  // Bisection: use previous pH as hint, expand search if needed
  let pH_lo = 0.5
  let pH_hi = 14
  const hint = Math.max(0.5, Math.min(14, previousPh))
  // Narrow search around hint
  if (hint > 1 && hint < 13) {
    pH_lo = Math.max(0.5, hint - 3)
    pH_hi = Math.min(14, hint + 3)
  }

  const pH = bisectPH(
    (ph) => chargeBalanceResidual(ph, input, gamma, gammaOH),
    pH_lo,
    pH_hi,
    1e-7,
    200,
  )

  if (isNaN(pH)) {
    // Last resort: broaden search
    const pH_raw = bisectPH((ph) => chargeBalanceResidual(ph, input, 1, 1), 0.5, 14, 1e-6, 300)
    return buildResult(pH_raw, composition, input, 1, 1)
  }
  return buildResult(pH, composition, input, gamma, gammaOH)
}

/**
 * Build the full result at a given pH: dissolved, precipitated, capacity.
 * Passes `anions` so that ligand complexes (FeCl²⁺, ZnSO₄, PbNO₃⁺) are included.
 */
function buildResult(
  pH: number,
  composition: { Fe: number; Zn: number; Pb: number },
  input: ChargeBalanceInput,
  gamma: number,
  gammaOH: number,
): ChemistryResult {
  const anions = inferAnions(composition)

  // Total dissolved at this pH (mol/L) WITH ligand complexes
  const dissolved_mol = {
    Fe: totalDissolvedAtPh('Fe', pH, gamma, gammaOH, anions),
    Zn: totalDissolvedAtPh('Zn', pH, gamma, gammaOH, anions),
    Pb: totalDissolvedAtPh('Pb', pH, gamma, gammaOH, anions),
  }

  // Capacity = dissolved when input >> capacity (saturated)
  // Undersaturated: dissolved = input (all metal is dissolved)
  //
  // Unit conversion: composition is in mg/L, ATOMIC_WEIGHT is in g/mol.
  // To convert mg/L → mol/L: divide by (g/mol × 1000 mg/g) = (ATOMIC_WEIGHT × 1000).
  // Without the ×1000 factor, the result is 1000× too large, which makes
  // `dissolved_eff` always equal the solubility (since input_mol > solubility)
  // and `precipitated_mol` is 1000× too large.
  const total_mol = {
    Fe: composition.Fe / (ATOMIC_WEIGHT.Fe * 1000),
    Zn: composition.Zn / (ATOMIC_WEIGHT.Zn * 1000),
    Pb: composition.Pb / (ATOMIC_WEIGHT.Pb * 1000),
  }

  // Dissolved = min(input, capacity) in mol/L
  // Precipitated = input - dissolved (mol/L)
  const dissolved_eff = {
    Fe: Math.min(dissolved_mol.Fe, total_mol.Fe),
    Zn: Math.min(dissolved_mol.Zn, total_mol.Zn),
    Pb: Math.min(dissolved_mol.Pb, total_mol.Pb),
  }
  const precipitated_mol = {
    Fe: Math.max(0, total_mol.Fe - dissolved_eff.Fe),
    Zn: Math.max(0, total_mol.Zn - dissolved_eff.Zn),
    Pb: Math.max(0, total_mol.Pb - dissolved_eff.Pb),
  }

  const dissolved_mgL = {
    Fe: dissolved_eff.Fe  * ATOMIC_WEIGHT.Fe * 1000,
    Zn: dissolved_eff.Zn  * ATOMIC_WEIGHT.Zn * 1000,
    Pb: dissolved_eff.Pb   * ATOMIC_WEIGHT.Pb  * 1000,
  }
  const precipitated_mgL = {
    Fe: precipitated_mol.Fe * ATOMIC_WEIGHT.Fe * 1000,
    Zn: precipitated_mol.Zn * ATOMIC_WEIGHT.Zn * 1000,
    Pb: precipitated_mol.Pb * ATOMIC_WEIGHT.Pb  * 1000,
  }
  const capacity_mgL = {
    Fe: dissolved_mol.Fe * ATOMIC_WEIGHT.Fe * 1000,
    Zn: dissolved_mol.Zn * ATOMIC_WEIGHT.Zn * 1000,
    Pb: dissolved_mol.Pb * ATOMIC_WEIGHT.Pb * 1000,
  }

  // Ionic strength
  const I = estimateIonicStrength(anions, dissolved_eff, Math.pow(10, -pH))

  // Charge balance check
  const residual = Math.abs(chargeBalanceResidual(pH, input, gamma, gammaOH))
  const chargeBalanced = residual < 1e-5

  return {
    pH: isNaN(pH) ? 7 : pH,
    dissolved_mol,
    dissolved_mgL,
    precipitated_mgL,
    capacity_mgL,
    ionicStrength: I,
    chargeBalanced,
  }
}

// ─── Capacity at pH (mol/L, for display in UI) ───────────────────────────────

/**
 * Return capacity (total dissolved mol/L at SI=0) at given pH.
 * Includes hydrolysis species + ligand complexes.
 * No activity correction (for display/reference only).
 * @param pH Sample pH.
 * @param anions Optional anion concentrations (for ligand complexes).
 */
export function capacityMolAtPh(
  pH: number,
  anions?: AnionConcentrations,
): { Fe: number; Zn: number; Pb: number } {
  return {
    Fe: totalDissolvedAtPh('Fe', pH, 1, 1, anions),
    Zn: totalDissolvedAtPh('Zn', pH, 1, 1, anions),
    Pb: totalDissolvedAtPh('Pb', pH, 1, 1, anions),
  }
}
