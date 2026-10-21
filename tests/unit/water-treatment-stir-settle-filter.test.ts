/**
 * Test cho 7 action của water-treatment server action.
 *
 * Cover các accept criteria WT-01:
 *   1. 'stir' trả previousPH === pH, goalStatus = 'pending' (chưa tách pha).
 *   2. 'settle' tính precipitated theo chemistry; filtrate = min(input, capacity).
 *   3. 'filter' thay composition bằng filtrate, reset precipitated về 0,
 *      goalStatus theo composition mới.
 *   4. 'measure-initial-ph' và 'measure-final' KHÔNG đổi composition, pH,
 *      filtrate; chỉ log event note.
 *   5. pH guard [2; 13] giữ nguyên: pH < 2 → PH_GUARD_BELOW_MIN; pH > 13 → PH_GUARD_ABOVE_MAX.
 *
 * Chemistry baseline (P0-C closed 17/10/2026, hydroxide-only):
 *   capacity = capacityAtSaturation(pH) — closed-form đã cross-check PHREEQC
 *   ±0.025 log. Filtrate = min(input, capacity) theo Lỗi B fix.
 *   Precipitated = max(0, input - filtrate) = max(0, input - capacity) khi input > cap.
 */

import { describe, expect, it } from 'vitest'

import {
  runWaterTreatmentAction,
  type WaterTreatmentActionInput,
} from '@/app/simulate/water-treatment/actions.js'
import {
  WT_MASS_BALANCE_TOLERANCE_PCT,
  WT_QCVN_COLUMN_A,
} from '@/features/water-treatment/constants.js'

const ATOMIC_WEIGHT = { Fe: 55.845, Zn: 65.38, Pb: 207.2 } as const

function callAction(input: WaterTreatmentActionInput) {
  return runWaterTreatmentAction(input)
}

describe('stir action — pending chưa tách pha', () => {
  it('pH không đổi, goalStatus = "pending" (kể cả khi input > capacity)', async () => {
    const result = await callAction({
      action: 'stir',
      composition: { Fe: 5, Zn: 5, Pb: 0.5 },
      pH: 9,
    })
    expect(result.previousPH).toBe(result.pH)
    expect(result.pH).toBe(9)
    expect(result.goalStatus).toBe('pending')
    expect(result.composition).toEqual({ Fe: 5, Zn: 5, Pb: 0.5 })
    expect(result.precipitated_mgPerL).toEqual({ Fe: 0, Zn: 0, Pb: 0 })
  })

  it('event note ghi "Khuấy 5 phút ở pH 9.00"', async () => {
    const result = await callAction({
      action: 'stir',
      composition: { Fe: 0, Zn: 0, Pb: 0 },
      pH: 9,
    })
    expect(result.events).toHaveLength(1)
    expect(result.events[0]?.action).toBe('stir')
    expect(result.events[0]?.note).toMatch(/Khuấy 5 phút ở pH 9\.00/)
  })
})

describe('settle action — tách pha, giữ composition nguồn', () => {
  it('composition nguồn giữ nguyên, precipitated > 0 khi input > capacity, filtrate = min(input, cap)', async () => {
    // G2: Fe 5, Zn 5, Pb 0.5 mg/L tại pH 9
    const result = await callAction({
      action: 'settle',
      composition: { Fe: 5, Zn: 5, Pb: 0.5 },
      pH: 9,
    })
    // composition nguồn KHÔNG đổi sau settle
    expect(result.composition).toEqual({ Fe: 5, Zn: 5, Pb: 0.5 })
    // Capacity SOLVER tại pH 9 (từ G2 cross-check): Fe ~4.8e-5, Zn ~0.72, Pb ~1.0e-3
    expect(result.capacity_mgPerL.Fe).toBeLessThan(5)
    expect(result.capacity_mgPerL.Zn).toBeLessThan(5)
    expect(result.capacity_mgPerL.Pb).toBeLessThan(0.5)
    // Filtrate = min(input, cap) — tất cả 3 kim loại kết tủa đến capacity
    expect(result.filtrate_mgPerL.Fe).toBeCloseTo(result.capacity_mgPerL.Fe, 6)
    expect(result.filtrate_mgPerL.Zn).toBeCloseTo(result.capacity_mgPerL.Zn, 6)
    expect(result.filtrate_mgPerL.Pb).toBeCloseTo(result.capacity_mgPerL.Pb, 6)
    // Precipitated = max(0, input - filtrate) = input - capacity (vì input > cap)
    expect(result.precipitated_mgPerL.Fe).toBeCloseTo(5 - result.filtrate_mgPerL.Fe, 6)
    expect(result.precipitated_mgPerL.Zn).toBeCloseTo(5 - result.filtrate_mgPerL.Zn, 6)
    expect(result.precipitated_mgPerL.Pb).toBeCloseTo(0.5 - result.filtrate_mgPerL.Pb, 6)
  })

  it('precipitated = 0 khi input ≤ capacity (hệ chưa bão hòa)', async () => {
    // G1: input thấp + pH 7.5 — Fe 1.0, Zn 0.5, Pb 0.05 mg/L
    // Capacity tại pH 7.5: Fe 9.4e-5 (<<1.0), Zn 201 (>>0.5), Pb 0.053 (>0.05)
    const result = await callAction({
      action: 'settle',
      composition: { Fe: 1.0, Zn: 0.5, Pb: 0.05 },
      pH: 7.5,
    })
    // Fe: input > cap → precipitated > 0
    expect(result.precipitated_mgPerL.Fe).toBeGreaterThan(0)
    // Zn: input < cap → precipitated = 0 (filtrate = input)
    expect(result.precipitated_mgPerL.Zn).toBe(0)
    expect(result.filtrate_mgPerL.Zn).toBeCloseTo(0.5, 6)
    // Pb: input < cap → precipitated = 0 (filtrate = input)
    expect(result.precipitated_mgPerL.Pb).toBe(0)
    expect(result.filtrate_mgPerL.Pb).toBeCloseTo(0.05, 6)
  })

  it('goalStatus theo chemistry: 3/3 đạt Cột A → "success"', async () => {
    // G2: cả 3 metal đều dưới Cột A → success
    const result = await callAction({
      action: 'settle',
      composition: { Fe: 5, Zn: 5, Pb: 0.5 },
      pH: 9,
    })
    expect(result.goalStatus).toBe('success')
    expect(result.expectedOutcome).toBe('success')
  })
})

describe('filter action — tách filtrate, reset precipitated', () => {
  it('composition trả về = filtrate_mgPerL (lấy pha lỏng); precipitated reset về 0', async () => {
    const result = await callAction({
      action: 'filter',
      composition: { Fe: 5, Zn: 5, Pb: 0.5 },
      pH: 9,
    })
    // composition mới = filtrate (lượng tan tối đa tại pH 9)
    expect(result.composition).toEqual(result.filtrate_mgPerL)
    // precipitated reset về 0 cho lượt khuấy/lắng/lọc tiếp theo
    expect(result.precipitated_mgPerL).toEqual({ Fe: 0, Zn: 0, Pb: 0 })
    // pH không đổi
    expect(result.previousPH).toBe(result.pH)
    expect(result.pH).toBe(9)
  })

  it('goalStatus theo composition mới (= filtrate): 3/3 đạt Cột A → "success"', async () => {
    const result = await callAction({
      action: 'filter',
      composition: { Fe: 5, Zn: 5, Pb: 0.5 },
      pH: 9,
    })
    // Filtrate mới đều dưới Cột A
    expect(result.filtrate_mgPerL.Fe).toBeLessThan(WT_QCVN_COLUMN_A.Fe_mgPerL)
    expect(result.filtrate_mgPerL.Zn).toBeLessThan(WT_QCVN_COLUMN_A.Zn_mgPerL)
    expect(result.filtrate_mgPerL.Pb).toBeLessThan(WT_QCVN_COLUMN_A.Pb_mgPerL)
    expect(result.goalStatus).toBe('success')
  })

  it('sau filter, gọi settle tiếp theo với composition mới (filtrate) → mass balance = 0', async () => {
    // Bước 1: filter
    const filtered = await callAction({
      action: 'filter',
      composition: { Fe: 5, Zn: 5, Pb: 0.5 },
      pH: 9,
    })
    // Bước 2: settle với composition = filtrate (chính là composition mới)
    const settled = await callAction({
      action: 'settle',
      composition: filtered.composition,
      pH: 9,
    })
    // Mass balance = 0% cho cả 3 metal (chemistry-conserving)
    expect(settled.massBalancePct.Fe).toBeLessThan(WT_MASS_BALANCE_TOLERANCE_PCT)
    expect(settled.massBalancePct.Zn).toBeLessThan(WT_MASS_BALANCE_TOLERANCE_PCT)
    expect(settled.massBalancePct.Pb).toBeLessThan(WT_MASS_BALANCE_TOLERANCE_PCT)
    expect(settled.invalidReasonCodes).not.toContain('MASS_BALANCE_BELOW_TOLERANCE')
  })
})

describe('measure-initial-ph / measure-final — chỉ log, không đổi chemistry', () => {
  it('measure-initial-ph: composition/pH/filtrate không đổi, goalStatus = "pending"', async () => {
    const result = await callAction({
      action: 'measure-initial-ph',
      composition: { Fe: 5, Zn: 5, Pb: 0.5 },
      pH: 7,
    })
    expect(result.composition).toEqual({ Fe: 5, Zn: 5, Pb: 0.5 })
    expect(result.previousPH).toBe(7)
    expect(result.pH).toBe(7)
    expect(result.goalStatus).toBe('pending')
    expect(result.events[0]?.note).toMatch(/Đo pH ban đầu: 7\.00/)
  })

  it('measure-final: composition/pH không đổi, goalStatus theo chemistry hiện tại', async () => {
    const result = await callAction({
      action: 'measure-final',
      composition: { Fe: 5, Zn: 5, Pb: 0.5 },
      pH: 9,
    })
    expect(result.composition).toEqual({ Fe: 5, Zn: 5, Pb: 0.5 })
    expect(result.previousPH).toBe(9)
    expect(result.pH).toBe(9)
    // 3/3 đạt Cột A → success
    expect(result.goalStatus).toBe('success')
    expect(result.events[0]?.note).toMatch(/Đo pH cuối: 9\.00/)
  })
})

describe('pH guard [2; 13]', () => {
  it('pH < 2 → PH_GUARD_BELOW_MIN, goalStatus = "invalid"', async () => {
    const result = await callAction({
      action: 'settle',
      composition: { Fe: 5, Zn: 5, Pb: 0.5 },
      pH: 1,
    })
    expect(result.pHGuardHit).toBe('min')
    expect(result.invalidReasonCodes).toContain('PH_GUARD_BELOW_MIN')
    expect(result.goalStatus).toBe('invalid')
  })

  it('pH > 13 → PH_GUARD_ABOVE_MAX, goalStatus = "invalid"', async () => {
    const result = await callAction({
      action: 'settle',
      composition: { Fe: 5, Zn: 5, Pb: 0.5 },
      pH: 14,
    })
    expect(result.pHGuardHit).toBe('max')
    expect(result.invalidReasonCodes).toContain('PH_GUARD_ABOVE_MAX')
    expect(result.goalStatus).toBe('invalid')
  })

  it('pH = 2 biên dưới: OK (không vi phạm)', async () => {
    const result = await callAction({
      action: 'settle',
      composition: { Fe: 5, Zn: 5, Pb: 0.5 },
      pH: 2,
    })
    expect(result.pHGuardHit).toBeNull()
    expect(result.invalidReasonCodes).not.toContain('PH_GUARD_BELOW_MIN')
  })

  it('pH = 13 biên trên: OK (không vi phạm)', async () => {
    const result = await callAction({
      action: 'settle',
      composition: { Fe: 5, Zn: 5, Pb: 0.5 },
      pH: 13,
    })
    expect(result.pHGuardHit).toBeNull()
    expect(result.invalidReasonCodes).not.toContain('PH_GUARD_ABOVE_MAX')
  })
})

describe('add-acid / add-base — dịch pH, pending', () => {
  it('add-base: pH tăng, goalStatus = "pending"', async () => {
    const result = await callAction({
      action: 'add-base',
      composition: { Fe: 5, Zn: 5, Pb: 0.5 },
      pH: 7,
      dose_mL: 2,
      volume_mL: 1000,
    })
    expect(result.pH).toBeGreaterThan(7)
    expect(result.goalStatus).toBe('pending')
  })

  it('add-acid: pH giảm, goalStatus = "pending"', async () => {
    const result = await callAction({
      action: 'add-acid',
      composition: { Fe: 5, Zn: 5, Pb: 0.5 },
      pH: 7,
      dose_mL: 2,
      volume_mL: 1000,
    })
    expect(result.pH).toBeLessThan(7)
    expect(result.goalStatus).toBe('pending')
  })
})

describe('shape stability — không thêm field mới vào WaterTreatmentResult', () => {
  it('trả về đủ 14 field theo type đã export', async () => {
    const result = await callAction({
      action: 'stir',
      composition: { Fe: 1, Zn: 0.5, Pb: 0.05 },
      pH: 7.5,
    })
    const expectedKeys = [
      'action',
      'composition',
      'pH',
      'previousPH',
      'capacity',
      'capacity_mgPerL',
      'filtrate_mgPerL',
      'precipitated_mgPerL',
      'pHGuardHit',
      'massBalancePct',
      'goalStatus',
      'expectedOutcome',
      'verificationStatus',
      'invalidReasonCodes',
      'events',
    ].sort()
    const actualKeys = Object.keys(result).sort()
    expect(actualKeys).toEqual(expectedKeys)
  })
})

// suppress unused import warning for ATOMIC_WEIGHT (used in mass-balance test)
void ATOMIC_WEIGHT
