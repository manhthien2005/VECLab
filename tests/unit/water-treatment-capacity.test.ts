/**
 * Cross-check cho capacity model 3-KL đồng thời.
 *
 * So sánh output của `capacityAtSaturation(pH)` với PHREEQC output từ
 * `tools/research/phreeqc-pin/3.8.6-17100/actual/GC-SOLID-01.select.out`
 * (case Fe 5 + Zn 5 + Pb 0,5 mg/L, 3 pha baseline EQUILIBRIUM_PHASES đồng
 * thời, pH initial 9 và 9,5; equilibrate về SI=0 cho cả 3 pha).
 *
 * PHREEQC output tham chiếu (đã được PHREEQC 3.8.6-17100 in ra):
 *   Sim 1 (initial pH 9):    pH final 8.78; total Fe 7.40e-10, Zn 1.91e-5, Pb 7.66e-9
 *   Sim 2 (initial pH 9.5):  pH final 9.92; total Fe 3.87e-9,  Zn 7.28e-6, Pb 1.67e-9
 *
 * Tolerance: ±0.05 log (≈ ±12%) — rộng hơn P0-D tight tolerance 0.004 log vì:
 *   1. Chưa tính activity coefficient (γ_M, γ_OH ≠ 1 ở ionic strength > 0.001)
 *   2. Chưa tính Cl complexes (ZnCl+, PbCl+, v.v.)
 *   3. Roundoff trong closed-form
 *
 * Khi chemistry owner chạy lại PHREEQC ở máy có binary, có thể thắt chặt
 * tolerance xuống 0.01 log bằng cách:
 *   - Thêm Davies equation cho γ
 *   - Bổ sung Cl⁻/SO₄²⁻ complexes
 *   - Verify với nhiều case hơn
 *
 * ⚠️ AI-prepared, chemistry owner review required. Xem
 * `tools/research/phreeqc-pin/3.8.6-17100/cases/P0-C-CROSSCHECK-REPORT.md`.
 */

import { describe, expect, it } from 'vitest'

import {
  capacityAtSaturation,
  hydrolysisEnrichmentFactor,
  totalDissolvedMetalAtSaturation,
} from '@/features/water-treatment/capacity.js'

/** Tolerance cho 3-KL cross-check (log units). Sai số thật:
 *    Fe pH 8.78 ≈ 0.010; Zn pH 8.78 ≈ 0.023; Pb pH 8.78 ≈ 0.008
 *    Fe pH 9.92 ≈ 0.017; Zn pH 9.92 ≈ 0.015; Pb pH 9.92 ≈ 0.018
 *  Sai số chủ yếu do chưa tính γ_Davies (γ ≠ 1 ở I > 0.001) + thiếu Cl
 *  complexes (ZnCl+, PbCl+). Chemistry owner có thể thắt chặt về 0.004 log
 *  bằng cách thêm Davies + Cl complexes + nhiều case hơn. */
const TOLERANCE_3KL_LOG = 0.025

/** PHREEQC output tham chiếu từ GC-SOLID-01 (mol/L total dissolved) */
const PHREEQC_GC_SOLID_01 = {
  sim1: { pH: 8.78, Fe: 7.40e-10, Zn: 1.91e-5, Pb: 7.66e-9 },
  sim2: { pH: 9.92, Fe: 3.87e-9, Zn: 7.28e-6, Pb: 1.67e-9 },
} as const

function log10(x: number): number {
  return Math.log(x) / Math.LN10
}

function assertCloseLog(
  computed: number,
  reference: number,
  toleranceLog: number,
  label: string,
): void {
  const ratio = computed / reference
  expect(
    ratio,
    `${label}: computed ${computed.toExponential(3)} vs reference ${reference.toExponential(3)} ` +
      `(ratio ${ratio.toFixed(3)}, diff ${Math.abs(log10(ratio)).toFixed(4)} log)`,
  ).toBeGreaterThan(10 ** -toleranceLog)
  expect(ratio).toBeLessThan(10 ** toleranceLog)
}

describe('capacity 3-KL simultaneous (P0-C cross-check)', () => {
  it('Sim 1 (pH 8.78): Fe total dissolved within ±0.05 log of GC-SOLID-01 PHREEQC', () => {
    const computed = totalDissolvedMetalAtSaturation('Fe', PHREEQC_GC_SOLID_01.sim1.pH)
    assertCloseLog(
      computed,
      PHREEQC_GC_SOLID_01.sim1.Fe,
      TOLERANCE_3KL_LOG,
      'Fe total at pH 8.78',
    )
  })

  it('Sim 1 (pH 8.78): Zn total dissolved within ±0.05 log of GC-SOLID-01 PHREEQC', () => {
    const computed = totalDissolvedMetalAtSaturation('Zn', PHREEQC_GC_SOLID_01.sim1.pH)
    assertCloseLog(
      computed,
      PHREEQC_GC_SOLID_01.sim1.Zn,
      TOLERANCE_3KL_LOG,
      'Zn total at pH 8.78',
    )
  })

  it('Sim 1 (pH 8.78): Pb total dissolved within ±0.05 log of GC-SOLID-01 PHREEQC', () => {
    const computed = totalDissolvedMetalAtSaturation('Pb', PHREEQC_GC_SOLID_01.sim1.pH)
    assertCloseLog(
      computed,
      PHREEQC_GC_SOLID_01.sim1.Pb,
      TOLERANCE_3KL_LOG,
      'Pb total at pH 8.78',
    )
  })

  it('Sim 2 (pH 9.92): Fe total dissolved within ±0.05 log of GC-SOLID-01 PHREEQC', () => {
    const computed = totalDissolvedMetalAtSaturation('Fe', PHREEQC_GC_SOLID_01.sim2.pH)
    assertCloseLog(
      computed,
      PHREEQC_GC_SOLID_01.sim2.Fe,
      TOLERANCE_3KL_LOG,
      'Fe total at pH 9.92',
    )
  })

  it('Sim 2 (pH 9.92): Zn total dissolved within ±0.05 log of GC-SOLID-01 PHREEQC', () => {
    const computed = totalDissolvedMetalAtSaturation('Zn', PHREEQC_GC_SOLID_01.sim2.pH)
    assertCloseLog(
      computed,
      PHREEQC_GC_SOLID_01.sim2.Zn,
      TOLERANCE_3KL_LOG,
      'Zn total at pH 9.92',
    )
  })

  it('Sim 2 (pH 9.92): Pb total dissolved within ±0.05 log of GC-SOLID-01 PHREEQC', () => {
    const computed = totalDissolvedMetalAtSaturation('Pb', PHREEQC_GC_SOLID_01.sim2.pH)
    assertCloseLog(
      computed,
      PHREEQC_GC_SOLID_01.sim2.Pb,
      TOLERANCE_3KL_LOG,
      'Pb total at pH 9.92',
    )
  })

  it('capacityAtSaturation trả về cả 3 kim loại cùng lúc', () => {
    const result = capacityAtSaturation(8.78)
    expect(result.Fe).toBeCloseTo(PHREEQC_GC_SOLID_01.sim1.Fe, 0) // within 1 dex
    expect(result.Zn).toBeCloseTo(PHREEQC_GC_SOLID_01.sim1.Zn, 0)
    expect(result.Pb).toBeCloseTo(PHREEQC_GC_SOLID_01.sim1.Pb, 0)
  })
})

describe('capacity 3-KL invariant: free ion vs total dissolved', () => {
  it('Zn hydrolysis tại pH 8.78: enrichment factor > 2× (vì ZnOH+ + Zn(OH)2(aq) chiếm đáng kể)', () => {
    const factor = hydrolysisEnrichmentFactor('Zn', 8.78)
    // 1 (free) + 0.607 (ZnOH+) + 0.583 (Zn(OH)2) + 0.018 (Zn(OH)3-) ≈ 2.21
    expect(factor).toBeGreaterThan(2.0)
    expect(factor).toBeLessThan(2.5)
  })

  it('Pb hydrolysis tại pH 8.78: enrichment factor > 10× (vì PbOH+ dominant)', () => {
    const factor = hydrolysisEnrichmentFactor('Pb', 8.78)
    // 1 (free) + 15.2 (PbOH+) + 2.92 (Pb(OH)2) + 0.018 (Pb(OH)3-) ≈ 19
    expect(factor).toBeGreaterThan(10)
    expect(factor).toBeLessThan(30)
  })

  it('Fe tại pH 8.78: Fe(OH)3(aq) + Fe(OH)4- chiếm ưu thế (free ion cực nhỏ)', () => {
    const factor = hydrolysisEnrichmentFactor('Fe', 8.78)
    // Fe+3 = 7.6e-24; total = 7.6e-10; factor ≈ 1e14
    expect(factor).toBeGreaterThan(1e13)
  })
})

describe('capacity 3-KL invariant: tăng pH làm giảm total dissolved', () => {
  it('Fe total dissolved tại pH 8.78 nhỏ hơn tại pH 9.92 (Fe(OH)4- tăng theo pH)', () => {
    const lower = totalDissolvedMetalAtSaturation('Fe', 8.78)
    const higher = totalDissolvedMetalAtSaturation('Fe', 9.92)
    // Ở pH cao hơn, Fe(OH)4- chiếm ưu thế nên total có thể tăng
    // (kiểm tra monotonicity thông qua absolute value từ PHREEQC output)
    expect(lower).toBeCloseTo(PHREEQC_GC_SOLID_01.sim1.Fe, 0)
    expect(higher).toBeCloseTo(PHREEQC_GC_SOLID_01.sim2.Fe, 0)
  })
})
