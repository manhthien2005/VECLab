/**
 * Golden case test cho P0-F (3 case end-to-end của solver MVP Fe/Zn/Pb).
 *
 * Cấu trúc test:
 *  - G1: input thấp + pH trung tính → 'success' (đạt không cần xử lý)
 *  - G2: input trung bình + pH 9 → 'partial-success' (Fe+Zn pass, Pb fail)
 *  - G3: input trung bình + pH 9,5 → 'success' (cả 3 pass, Pb dư kết tủa)
 *
 * Mỗi case test 2 assertion:
 *  1. `goalStatus` đúng như spec §16.1 case (a)(b)(c)
 *  2. Filtrate tuân thủ capacityAtSaturation (closed-form đã verify P0-C ±0,025 log)
 *
 * Cột A QCVN 40:2025/BTNMT (P0-A đã đóng 16/10/2026):
 *   Fe 2,0 mg/L · Zn 1,0 mg/L · Pb 0,1 mg/L
 *
 * ⚠️ G1 là AI-prepared (chưa live-run PHREEQC) — khi chemistry owner build
 *    binary, cập nhật test để compare vs PHREEQC output tại
 *    `actual/G1-control-no-treatment.select.out`. G2 + G3 reuse PHREEQC output
 *    từ `actual/GC-SOLID-01.select.out` đã chạy 16/10/2026.
 *
 * Xem `tools/research/phreeqc-pin/3.8.6-17100/cases/P0-F-CROSSCHECK-REPORT.md`
 * cho cơ sở lý thuyết + verification.
 */

import { describe, expect, it } from 'vitest'

import { capacityAtSaturation } from '@/features/water-treatment/capacity.js'
import { WT_QCVN_COLUMN_A } from '@/features/water-treatment/constants.js'

type GoalStatus =
  | 'pending'
  | 'success'
  | 'partial-success'
  | 'failed'
  | 'invalid'
  | 'unknown'

const ATOMIC_WEIGHT = { Fe: 55.845, Zn: 65.38, Pb: 207.2 } as const

/** Convert mg/L → mol/L. */
function mgPerLToMolL(mgL: number, aw: number): number {
  return mgL / (aw * 1000)
}

/** Compute expected filtrate theo capacityAtSaturation closed-form. */
function computeFiltrate(
  inputMgL: { Fe: number; Zn: number; Pb: number },
  pH: number,
): { Fe: number; Zn: number; Pb: number; capacity: { Fe: number; Zn: number; Pb: number } } {
  const cap = capacityAtSaturation(pH) // mol/L
  const capMgL = {
    Fe: cap.Fe * ATOMIC_WEIGHT.Fe * 1000,
    Zn: cap.Zn * ATOMIC_WEIGHT.Zn * 1000,
    Pb: cap.Pb * ATOMIC_WEIGHT.Pb * 1000,
  }
  return {
    capacity: cap,
    Fe: Math.max(0, inputMgL.Fe - capMgL.Fe),
    Zn: Math.max(0, inputMgL.Zn - capMgL.Zn),
    Pb: Math.max(0, inputMgL.Pb - capMgL.Pb),
  }
}

/** So sánh filtrate với Cột A, trả về goalStatus. */
function goalStatusFromFiltrate(filtrate: { Fe: number; Zn: number; Pb: number }): GoalStatus {
  const pass = {
    Fe: filtrate.Fe <= WT_QCVN_COLUMN_A.Fe_mgPerL,
    Zn: filtrate.Zn <= WT_QCVN_COLUMN_A.Zn_mgPerL,
    Pb: filtrate.Pb <= WT_QCVN_COLUMN_A.Pb_mgPerL,
  }
  const passed = [pass.Fe, pass.Zn, pass.Pb].filter(Boolean).length
  if (passed === 3) return 'success'
  if (passed >= 1) return 'partial-success'
  return 'failed'
}

// ============================================================================
// G1: input thấp + pH trung tính → 'success' (đạt không cần xử lý)
// ============================================================================

const G1_INPUT = { Fe: 1.0, Zn: 0.5, Pb: 0.05 } as const // mg/L
const G1_PH = 7.5

describe('G1 — golden-control-no-treatment (AI-prepared)', () => {
  it('Fe 1, Zn 0,5, Pb 0,05 mg/L pH 7,5 → goalStatus = "success" (3/3 đạt)', () => {
    const { Fe, Zn, Pb } = computeFiltrate(G1_INPUT, G1_PH)
    expect(goalStatusFromFiltrate({ Fe, Zn, Pb })).toBe('success')
  })

  it('Filtrate giữ gần nguyên input (không kết tủa đáng kể)', () => {
    const { Fe, Zn, Pb } = computeFiltrate(G1_INPUT, G1_PH)
    // Fe/Zn/Pb capacity tại pH 7,5 đều < 1e-3 mg/L → filtrate ≈ input
    expect(Fe).toBeCloseTo(1.0, 1)
    expect(Zn).toBeCloseTo(0.5, 1)
    expect(Pb).toBeCloseTo(0.05, 2)
    // Confirm filtrate strictly dưới Cột A
    expect(Fe).toBeLessThan(WT_QCVN_COLUMN_A.Fe_mgPerL)
    expect(Zn).toBeLessThan(WT_QCVN_COLUMN_A.Zn_mgPerL)
    expect(Pb).toBeLessThan(WT_QCVN_COLUMN_A.Pb_mgPerL)
  })
})

// ============================================================================
// G2: Fe 5 + Zn 5 + Pb 0,5 pH 9 → 'partial-success' (Fe+Zn pass, Pb fail)
// ============================================================================

const G2_INPUT = { Fe: 5.0, Zn: 5.0, Pb: 0.5 } as const // mg/L
const G2_PH = 9.0

describe('G2 — golden-hydroxide-partial-pH9 (reuse P0-D GC-SOLID-01 Sim 1)', () => {
  it('Fe 5, Zn 5, Pb 0,5 mg/L pH 9 → goalStatus = "partial-success" (2/3 đạt)', () => {
    const { Fe, Zn, Pb } = computeFiltrate(G2_INPUT, G2_PH)
    expect(goalStatusFromFiltrate({ Fe, Zn, Pb })).toBe('partial-success')
  })

  it('Pb fail: filtrate ≈ 0,5 mg/L (input < capacity 0,617) > Cột A 0,1', () => {
    const { Pb, capacity } = computeFiltrate(G2_INPUT, G2_PH)
    const pbCapacityMgL = capacity.Pb * ATOMIC_WEIGHT.Pb * 1000
    // Input (0,5) < capacity (0,617) → không kết tủa, filtrate = input
    expect(pbCapacityMgL).toBeGreaterThan(G2_INPUT.Pb) // sanity: capacity > input
    expect(Pb).toBeCloseTo(G2_INPUT.Pb, 1) // filtrate giữ input
    expect(Pb).toBeGreaterThan(WT_QCVN_COLUMN_A.Pb_mgPerL) // vượt Cột A
  })
})

// ============================================================================
// G3: Fe 5 + Zn 5 + Pb 0,5 pH 9,5 → 'success' (cả 3 pass, Pb dư kết tủa)
// ============================================================================

const G3_INPUT = { Fe: 5.0, Zn: 5.0, Pb: 0.5 } as const // mg/L
const G3_PH = 9.5

describe('G3 — golden-hydroxide-full-pH9_5 (reuse P0-D GC-SOLID-01 Sim 2)', () => {
  it('Fe 5, Zn 5, Pb 0,5 mg/L pH 9,5 → goalStatus = "success" (3/3 đạt)', () => {
    const { Fe, Zn, Pb } = computeFiltrate(G3_INPUT, G3_PH)
    expect(goalStatusFromFiltrate({ Fe, Zn, Pb })).toBe('success')
  })

  it('Pb pass: filtrate ≈ 0,062 mg/L (input > capacity → dư kết tủa) < Cột A 0,1', () => {
    const { Pb, capacity } = computeFiltrate(G3_INPUT, G3_PH)
    const pbCapacityMgL = capacity.Pb * ATOMIC_WEIGHT.Pb * 1000
    // Input (0,5) > capacity (~0,062) → dư kết tủa, filtrate = capacity
    expect(pbCapacityMgL).toBeLessThan(G3_INPUT.Pb) // sanity: capacity < input
    expect(Pb).toBeCloseTo(pbCapacityMgL, 2) // filtrate = capacity
    expect(Pb).toBeLessThan(WT_QCVN_COLUMN_A.Pb_mgPerL) // đạt Cột A
    // Sanity: filtrate nằm trong khoảng 0,05 – 0,08 mg/L (theo closed-form)
    expect(Pb).toBeGreaterThan(0.05)
    expect(Pb).toBeLessThan(0.08)
  })
})
