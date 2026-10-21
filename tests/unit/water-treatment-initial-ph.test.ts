/**
 * Test cho `solveInitialPh` — helper client-side tính pH từ composition
 * theo spec §6.1.2 (mô hình cân bằng điện tích với hydrolysis Fe/Zn/Pb bậc 1
 * + protonation SO₄²⁻ bậc 1).
 *
 * Model mở rộng (2026-10-18): bao gồm hydrolysis bậc 1 của cả
 * Fe³⁺ (FeOH²⁺, log K = -2.19), Zn²⁺ (ZnOH⁺, log β₁ = -9.0), và
 * Pb²⁺ (PbOH⁺, log β₁ = -7.7). Các claim: WT-CHEM-K-FeOH,
 * WT-CHEM-K-ZnOH, WT-CHEM-K-PbOH.
 *
 * Approximation (xem header của initial-ph.ts):
 * - Fe³⁺ hydrolysis bậc 1 (FeOH²⁺, pKa ≈ 2.19) → acid mạnh, dominates pH.
 * - Zn²⁺ hydrolysis bậc 1 (ZnOH⁺, pKa ≈ 9.0) → acid yếu, ảnh hưởng rõ
 *   ở nồng độ cao và pH 5-7.
 * - Pb²⁺ hydrolysis bậc 1 (PbOH⁺, pKa ≈ 7.7) → acid trung bình, ảnh hưởng
 *   đáng kể ở nồng độ cao và pH 6-7.
 *
 * Sanity check:
 * - Fe dominates: khi có Fe, pH ≈ Fe đơn (pH 2-4).
 * - Zn/Pb dominate: khi không có Fe, pH bị kéo xuống 5-7 tùy nồng độ.
 * - pH luôn nằm trong [0; 14].
 */

import { describe, expect, it } from 'vitest'

import {
  capacityAtPhMgPerL,
  sliderCap,
  sliderStepFeZn,
  sliderStepPb,
  solveInitialPh,
} from '../fixtures/water-treatment-initial-ph.js'

describe('solveInitialPh (spec §6.1.2 — charge balance, hydrolysis Fe bậc 1, protonation SO₄)', () => {
  it('trả pH nước nguyên chất ≈ 7 khi composition = 0', () => {
    expect(solveInitialPh({ Fe: 0, Zn: 0, Pb: 0 }, 1000)).toBe(7)
  })

  it('trả pH hợp lệ trong khoảng [0; 14] cho input dương', () => {
    const pH = solveInitialPh({ Fe: 10, Zn: 5, Pb: 0.1 }, 1000)
    expect(pH).not.toBeNull()
    expect(pH).toBeGreaterThan(0)
    expect(pH).toBeLessThan(14)
  })

  it('Zn đơn lẻ (ZnSO₄) → pH giảm từ ~6.5 (thấp) xuống ~5.0 (rất cao) khi nồng độ tăng', () => {
    // Model mở rộng: Zn hydrolysis sinh H⁺, nồng độ cao → pH acid rõ rệt.
    // Probe: Zn 5 → 6.53, Zn 50 → 6.06, Zn 100 → 5.91, Zn 5000 → 5.06.
    const ph5 = solveInitialPh({ Fe: 0, Zn: 5, Pb: 0 }, 1000)
    const ph50 = solveInitialPh({ Fe: 0, Zn: 50, Pb: 0 }, 1000)
    const ph100 = solveInitialPh({ Fe: 0, Zn: 100, Pb: 0 }, 1000)
    const ph5000 = solveInitialPh({ Fe: 0, Zn: 5000, Pb: 0 }, 1000)
    expect(ph5).not.toBeNull()
    expect(ph50).not.toBeNull()
    expect(ph100).not.toBeNull()
    expect(ph5000).not.toBeNull()
    // pH giảm monotonic với nồng độ
    expect(ph5!).toBeGreaterThan(ph50!)
    expect(ph50!).toBeGreaterThan(ph100!)
    expect(ph100!).toBeGreaterThan(ph5000!)
    // Zn 5-100 mg/L: pH 5.9-6.6; Zn 5000 mg/L: pH ~5.0 (rất acidic)
    expect(ph100!).toBeGreaterThan(5.8)
    expect(ph100!).toBeLessThan(6.8)
    expect(ph5000!).toBeGreaterThan(4.5)
    expect(ph5000!).toBeLessThan(5.5)
  })

  it('Fe tan (Fe³⁺ là acid mạnh, hydrolysis bậc 1) → pH acid mạnh 2-3', () => {
    // Fe³⁺ có pKa1 (Fe³⁺ + H₂O ⇌ FeOH²⁺ + H⁺) ≈ 2.19 → acid mạnh.
    // 50 mg/L Fe = 0.895 mM; hydrolysis giải phóng H⁺ → pH ≈ 2-3.
    // Fe(OH)₃ kết tủa cũng GIẢI PHÓNG H⁺ (Fe³⁺ + 3H₂O → Fe(OH)₃↓ + 3H⁺),
    // không trung hòa như giả định trước.
    const pH = solveInitialPh({ Fe: 50, Zn: 0, Pb: 0 }, 1000)
    expect(pH).not.toBeNull()
    expect(pH!).toBeGreaterThan(1.5)
    expect(pH!).toBeLessThan(4)
  })

  it('Zn đơn lẻ (ZnSO₄ — Zn²⁺ hydrolysis bậc 1, pKa ≈ 9.0) → pH acid yếu 5.9-6.6', () => {
    // ZnSO₄: H₂SO₄ (acid mạnh) cung cấp SO₄²⁻ + Zn²⁺ (base yếu với hydrolysis ZnOH⁺).
    // Model mở rộng: Zn²⁺ + H₂O ⇌ ZnOH⁺ + H⁺ (log β₁ = -9.0).
    // Probe: Zn 5 → 6.53, Zn 50 → 6.06, Zn 100 → 5.91.
    const ph5 = solveInitialPh({ Fe: 0, Zn: 5, Pb: 0 }, 1000)
    const ph50 = solveInitialPh({ Fe: 0, Zn: 50, Pb: 0 }, 1000)
    const ph100 = solveInitialPh({ Fe: 0, Zn: 100, Pb: 0 }, 1000)
    expect(ph5).not.toBeNull()
    expect(ph50).not.toBeNull()
    expect(ph100).not.toBeNull()
    // pH acid yếu: 5.9-6.6 (thấp hơn nước nguyên chất 7.0)
    for (const p of [ph5!, ph50!, ph100!]) {
      expect(p).toBeGreaterThan(5.8)
      expect(p).toBeLessThan(6.8)
    }
    // pH giảm khi Zn tăng (nhiều Zn²⁺ hydrolysis hơn → nhiều H⁺ hơn)
    expect(ph5!).toBeGreaterThan(ph50!)
    expect(ph50!).toBeGreaterThan(ph100!)
  })

  it('Pb đơn lẻ (Pb(NO₃)₂ — Pb²⁺ hydrolysis bậc 1, pKa ≈ 7.7) → pH acid 6.1-6.9', () => {
    // Pb²⁺ + H₂O ⇌ PbOH⁺ + H⁺ (log β₁ = -7.7). pKa gần pH trung tính nên
    // ảnh hưởng rõ rệt: nồng độ cao → pH thấp hơn đáng kể.
    // Probe: Pb 0.05 → 6.92, Pb 0.5 → 6.63, Pb 5 → 6.16.
    const ph005 = solveInitialPh({ Fe: 0, Zn: 0, Pb: 0.05 }, 1000)
    const ph05 = solveInitialPh({ Fe: 0, Zn: 0, Pb: 0.5 }, 1000)
    const ph5 = solveInitialPh({ Fe: 0, Zn: 0, Pb: 5 }, 1000)
    expect(ph005).not.toBeNull()
    expect(ph05).not.toBeNull()
    expect(ph5).not.toBeNull()
    for (const p of [ph005!, ph05!, ph5!]) {
      expect(p).toBeGreaterThan(5.8)
      expect(p).toBeLessThan(7.2)
    }
    expect(ph005!).toBeGreaterThan(ph05!)
    expect(ph05!).toBeGreaterThan(ph5!)
  })

  // --- 3 kim loại đơn lẻ (precursor salts: FeCl₃ / ZnSO₄ / Pb(NO₃)₂) ---

  it('Fe đơn lẻ (FeCl₃ — Fe³⁺ hydrolysis bậc 1, pKa ≈ 2.19) → pH acid 2-3 ở nồng độ thường', () => {
    // Probe: Fe 5 → 3.28, Fe 50 → 2.38, Fe 100 → 2.17
    const ph5 = solveInitialPh({ Fe: 5, Zn: 0, Pb: 0 }, 1000)
    const ph50 = solveInitialPh({ Fe: 50, Zn: 0, Pb: 0 }, 1000)
    const ph100 = solveInitialPh({ Fe: 100, Zn: 0, Pb: 0 }, 1000)
    expect(ph5).not.toBeNull()
    expect(ph50).not.toBeNull()
    expect(ph100).not.toBeNull()
    for (const p of [ph5!, ph50!, ph100!]) {
      expect(p).toBeGreaterThan(1.5)
      expect(p).toBeLessThan(4)
    }
    // pH giảm khi Fe tăng (nồng độ acid cao hơn → pH thấp hơn)
    expect(ph5!).toBeGreaterThan(ph50!)
    expect(ph50!).toBeGreaterThan(ph100!)
  })

  // --- Tổ hợp 2 kim loại ---

  it('Fe + Zn (FeCl₃ + ZnSO₄) → pH dominated bởi Fe hydrolysis (Fe pKa ≈ 2.19 ≪ Zn pKa ≈ 9.0)', () => {
    // Probe: Fe+Zn (50,50) → 2.3755 (giống Fe 50 alone).
    // Fe hydrolysis mạnh hơn Zn rất nhiều (pKa 2.19 vs 9.0) nên Fe chiếm ưu thế tuyệt đối.
    const phFeZn = solveInitialPh({ Fe: 50, Zn: 50, Pb: 0 }, 1000)
    const phFeOnly = solveInitialPh({ Fe: 50, Zn: 0, Pb: 0 }, 1000)
    expect(phFeZn).not.toBeNull()
    expect(phFeOnly).not.toBeNull()
    // Cả hai cùng nằm trong miền acid
    expect(phFeZn!).toBeLessThan(4)
    expect(phFeZn!).toBeGreaterThan(1.5)
    // Zn thêm vào không thay đổi pH đáng kể (model không tính Zn hydrolysis)
    expect(phFeZn!).toBeCloseTo(phFeOnly!, 2)
  })

  it('Fe + Pb (FeCl₃ + Pb(NO₃)₂) → pH dominated bởi Fe hydrolysis', () => {
    // Probe: Fe+Pb (50,0.5) → 2.3755 (giống Fe 50 alone).
    const phFePb = solveInitialPh({ Fe: 50, Zn: 0, Pb: 0.5 }, 1000)
    const phFeOnly = solveInitialPh({ Fe: 50, Zn: 0, Pb: 0 }, 1000)
    expect(phFePb).not.toBeNull()
    expect(phFeOnly).not.toBeNull()
    expect(phFePb!).toBeLessThan(4)
    expect(phFePb!).toBeGreaterThan(1.5)
    expect(phFePb!).toBeCloseTo(phFeOnly!, 2)
  })

  it('Zn + Pb (ZnSO₄ + Pb(NO₃)₂, không có Fe) → pH acid 5.8-6.3 (cả hai hydrolysis)', () => {
    // Cả Zn (pKa ≈ 9.0) và Pb (pKa ≈ 7.7) đều hydrolysis và kéo pH xuống.
    // Probe: Zn 50 + Pb 0.5 → 6.0428.
    const phZnPb = solveInitialPh({ Fe: 0, Zn: 50, Pb: 0.5 }, 1000)
    expect(phZnPb).not.toBeNull()
    expect(phZnPb!).toBeGreaterThan(5.8)
    expect(phZnPb!).toBeLessThan(6.5)
  })

  // --- Tổ hợp 3 kim loại ---

  it('Fe + Zn + Pb (đủ 3 muối) → pH dominated bởi Fe hydrolysis', () => {
    // Probe: Fe+Zn+Pb (50,50,0.5) → 2.3755 (giống Fe 50 alone).
    // Tổ hợp này mô phỏng precursor mix đầy đủ cho bài pH / Jar Test.
    const phAll = solveInitialPh({ Fe: 50, Zn: 50, Pb: 0.5 }, 1000)
    const phFeOnly = solveInitialPh({ Fe: 50, Zn: 0, Pb: 0 }, 1000)
    expect(phAll).not.toBeNull()
    expect(phFeOnly).not.toBeNull()
    expect(phAll!).toBeLessThan(4)
    expect(phAll!).toBeGreaterThan(1.5)
    expect(phAll!).toBeCloseTo(phFeOnly!, 2)
  })

  it('Fe thấp + Zn + Pb → pH acid yếu hơn nhưng vẫn < 4', () => {
    // Probe: Fe+Zn+Pb (5,5,0.05) → 3.2776
    const phAll = solveInitialPh({ Fe: 5, Zn: 5, Pb: 0.05 }, 1000)
    expect(phAll).not.toBeNull()
    expect(phAll!).toBeGreaterThan(2)
    expect(phAll!).toBeLessThan(5)
  })

  // --- Monotonicity (Fe dominates; Zn/Pb contribute acid in extended model) ---

  it('pH giảm monotonic khi Fe tăng (Fe hydrolysis bậc 1 mạnh nhất)', () => {
    const ph1 = solveInitialPh({ Fe: 1, Zn: 0, Pb: 0 }, 1000)
    const ph10 = solveInitialPh({ Fe: 10, Zn: 0, Pb: 0 }, 1000)
    const ph100 = solveInitialPh({ Fe: 100, Zn: 0, Pb: 0 }, 1000)
    expect(ph1!).toBeGreaterThan(ph10!)
    expect(ph10!).toBeGreaterThan(ph100!)
  })

  it('pH giảm khi tăng Zn (Zn²⁺ hydrolysis sinh H⁺, log β₁ = -9.0)', () => {
    // Model mở rộng: Zn hydrolysis kéo pH xuống tỉ lệ với nồng độ Zn.
    const ph1 = solveInitialPh({ Fe: 0, Zn: 1, Pb: 0 }, 1000)
    const ph50 = solveInitialPh({ Fe: 0, Zn: 50, Pb: 0 }, 1000)
    const ph100 = solveInitialPh({ Fe: 0, Zn: 100, Pb: 0 }, 1000)
    expect(ph1!).toBeGreaterThan(ph50!)
    expect(ph50!).toBeGreaterThan(ph100!)
  })

  it('pH giảm khi tăng Pb (Pb²⁺ hydrolysis sinh H⁺, log β₁ = -7.7)', () => {
    // Pb hydrolysis mạnh hơn Zn (pKa 7.7 vs 9.0) nên ảnh hưởng rõ hơn.
    const ph005 = solveInitialPh({ Fe: 0, Zn: 0, Pb: 0.05 }, 1000)
    const ph1 = solveInitialPh({ Fe: 0, Zn: 0, Pb: 1 }, 1000)
    const ph10 = solveInitialPh({ Fe: 0, Zn: 0, Pb: 10 }, 1000)
    expect(ph005!).toBeGreaterThan(ph1!)
    expect(ph1!).toBeGreaterThan(ph10!)
  })

  it('trả null khi composition âm', () => {
    expect(solveInitialPh({ Fe: -1, Zn: 0, Pb: 0 }, 1000)).toBeNull()
  })

  it('trả null khi volume ≤ 0', () => {
    expect(solveInitialPh({ Fe: 10, Zn: 0, Pb: 0 }, 0)).toBeNull()
  })

  it('pH không phụ thuộc volume (charge balance, mô hình lý tưởng)', () => {
    const ph1L = solveInitialPh({ Fe: 10, Zn: 5, Pb: 0.1 }, 1000)
    const ph2L = solveInitialPh({ Fe: 10, Zn: 5, Pb: 0.1 }, 2000)
    expect(ph1L).toBeCloseTo(ph2L!, 5)
  })

  // ============================================================================
  // Comprehensive matrix: 1-metal × concentration, 2-metal × concentration,
  // 3-metal × concentration, edge cases (Fe rất thấp, kim loại rất cao).
  // ============================================================================

  // --- Fe đơn lẻ nồng độ biên (rất thấp / rất cao) ---

  it('Fe cực thấp (0.1 mg/L) → pH acid yếu ~5 (Fe hydrolysis vẫn dominates)', () => {
    // Probe: Fe=0.1 → pH 4.97. Fe chỉ cần 0.1 mg/L đã tạo pH acid do pKa 2.19.
    const pH = solveInitialPh({ Fe: 0.1, Zn: 0, Pb: 0 }, 1000)
    expect(pH).not.toBeNull()
    expect(pH!).toBeGreaterThan(4.5)
    expect(pH!).toBeLessThan(5.5)
  })

  it('Fe rất cao (200/500/1000 mg/L) → pH acid cực mạnh 1.5-2.5', () => {
    // Probe: Fe 200 → 2.02, Fe 500 → 1.84, Fe 1000 → 1.70.
    // Fe(OH)₃ kết tủa mạnh nhưng mỗi Fe kết tủa giải phóng 3 H⁺.
    const ph200 = solveInitialPh({ Fe: 200, Zn: 0, Pb: 0 }, 1000)
    const ph500 = solveInitialPh({ Fe: 500, Zn: 0, Pb: 0 }, 1000)
    const ph1000 = solveInitialPh({ Fe: 1000, Zn: 0, Pb: 0 }, 1000)
    expect(ph200).not.toBeNull()
    expect(ph500).not.toBeNull()
    expect(ph1000).not.toBeNull()
    for (const p of [ph200!, ph500!, ph1000!]) {
      expect(p).toBeGreaterThan(1.5)
      expect(p).toBeLessThan(2.5)
    }
    // pH giảm khi Fe tăng
    expect(ph200!).toBeGreaterThan(ph500!)
    expect(ph500!).toBeGreaterThan(ph1000!)
  })

  // --- Zn đơn lẻ nồng độ biên ---

  it('Zn cực thấp (1 mg/L) → pH gần trung tính 6.5-7.0 (ZnOH⁺ yếu)', () => {
    // Probe: Zn 1 → 6.80. Ở nồng độ rất thấp, Zn hydrolysis đóng góp < 1% H⁺.
    const pH = solveInitialPh({ Fe: 0, Zn: 1, Pb: 0 }, 1000)
    expect(pH).not.toBeNull()
    expect(pH!).toBeGreaterThan(6.5)
    expect(pH!).toBeLessThan(7.0)
  })

  it('Zn cực cao (1000/2000 mg/L) → pH acid rõ rệt 5.2-5.5', () => {
    // Probe: Zn 1000 → 5.41, Zn 2000 → 5.26. Ở nồng độ cao ZnOH⁺ sinh H⁺ nhiều.
    const ph1000 = solveInitialPh({ Fe: 0, Zn: 1000, Pb: 0 }, 1000)
    const ph2000 = solveInitialPh({ Fe: 0, Zn: 2000, Pb: 0 }, 1000)
    expect(ph1000).not.toBeNull()
    expect(ph2000).not.toBeNull()
    expect(ph1000!).toBeGreaterThan(5.2)
    expect(ph1000!).toBeLessThan(5.6)
    expect(ph2000!).toBeGreaterThan(5.0)
    expect(ph2000!).toBeLessThan(5.5)
    expect(ph2000!).toBeLessThan(ph1000!)
  })

  // --- Pb đơn lẻ nồng độ biên ---

  it('Pb cực cao (10/50 mg/L) → pH acid 5.5-6.1 (PbOH⁺ mạnh hơn ZnOH⁺)', () => {
    // Probe: Pb 10 → 6.01, Pb 50 → 5.66. pKa Pb ≈ 7.7 gần pH trung tính.
    const ph10 = solveInitialPh({ Fe: 0, Zn: 0, Pb: 10 }, 1000)
    const ph50 = solveInitialPh({ Fe: 0, Zn: 0, Pb: 50 }, 1000)
    expect(ph10).not.toBeNull()
    expect(ph50).not.toBeNull()
    expect(ph10!).toBeGreaterThan(5.8)
    expect(ph10!).toBeLessThan(6.2)
    expect(ph50!).toBeGreaterThan(5.4)
    expect(ph50!).toBeLessThan(5.9)
    expect(ph50!).toBeLessThan(ph10!)
  })

  // --- 2-metal với Fe thấp ---

  it('Fe thấp + Zn cao (Fe=1, Zn=100) → pH trung gian 3.5-4.5 (Fe vẫn dominates)', () => {
    // Probe: Fe=1, Zn=100 → 3.97. Fe dù rất thấp vẫn đủ dominate nhờ pKa 2.19.
    const pH = solveInitialPh({ Fe: 1, Zn: 100, Pb: 0 }, 1000)
    expect(pH).not.toBeNull()
    expect(pH!).toBeGreaterThan(3.5)
    expect(pH!).toBeLessThan(4.5)
  })

  it('Fe thấp + Pb cao (Fe=1, Pb=10) → pH trung gian 3.5-4.5 (Fe dominates)', () => {
    // Probe: Fe=1, Pb=10 → 3.97. Tương tự Fe+Zn, Fe pKa rất thấp.
    const pH = solveInitialPh({ Fe: 1, Zn: 0, Pb: 10 }, 1000)
    expect(pH).not.toBeNull()
    expect(pH!).toBeGreaterThan(3.5)
    expect(pH!).toBeLessThan(4.5)
  })

  it('Fe cực thấp + Zn/Pb (Fe=0.5, Zn=50) → pH 4.0-4.5', () => {
    // Probe: Fe=0.5, Zn=50 → 4.27. Fe giảm → pH tăng, Zn hydrolysis gánh một phần.
    const pH = solveInitialPh({ Fe: 0.5, Zn: 50, Pb: 0 }, 1000)
    expect(pH).not.toBeNull()
    expect(pH!).toBeGreaterThan(4.0)
    expect(pH!).toBeLessThan(4.5)
  })

  it('Fe cực thấp + Zn (Fe=0.1, Zn=50) → pH 4.5-5.0 (Fe suy yếu, Zn nổi lên)', () => {
    // Probe: Fe=0.1, Zn=50 → 4.97. Khi Fe < 0.5 mg/L, Zn hydrolysis ngang Fe.
    const pH = solveInitialPh({ Fe: 0.1, Zn: 50, Pb: 0 }, 1000)
    expect(pH).not.toBeNull()
    expect(pH!).toBeGreaterThan(4.5)
    expect(pH!).toBeLessThan(5.2)
  })

  it('2-metal không Fe ở nồng độ thấp (Zn=0.5, Pb=0.005) → pH gần 7', () => {
    // Probe: Zn=0.5, Pb=0.005 → 6.87. Nồng độ cực thấp, hydrolysis gần như bằng 0.
    const pH = solveInitialPh({ Fe: 0, Zn: 0.5, Pb: 0.005 }, 1000)
    expect(pH).not.toBeNull()
    expect(pH!).toBeGreaterThan(6.5)
    expect(pH!).toBeLessThan(7.0)
  })

  it('2-metal không Fe ở nồng độ trung bình (Zn=10, Pb=0.1) → pH 6.0-6.5', () => {
    // Probe: Zn=10, Pb=0.1 → 6.38. Cả hai hydrolysis đều đóng góp.
    const pH = solveInitialPh({ Fe: 0, Zn: 10, Pb: 0.1 }, 1000)
    expect(pH).not.toBeNull()
    expect(pH!).toBeGreaterThan(6.0)
    expect(pH!).toBeLessThan(6.6)
  })

  // --- 3-metal với nồng độ thấp ---

  it('3-metal low mix (Fe=1, Zn=1, Pb=1) → pH 3.5-4.5 (Fe vẫn dominates)', () => {
    // Probe: Fe=1, Zn=1, Pb=1 → 3.97. Fe 1 mg/L vẫn đủ pH acid.
    const pH = solveInitialPh({ Fe: 1, Zn: 1, Pb: 1 }, 1000)
    expect(pH).not.toBeNull()
    expect(pH!).toBeGreaterThan(3.5)
    expect(pH!).toBeLessThan(4.5)
  })

  it('3-metal medium mix (Fe=10, Zn=10, Pb=10) → pH 2.5-3.5', () => {
    // Probe: Fe=10, Zn=10, Pb=10 → 2.99.
    const pH = solveInitialPh({ Fe: 10, Zn: 10, Pb: 10 }, 1000)
    expect(pH).not.toBeNull()
    expect(pH!).toBeGreaterThan(2.5)
    expect(pH!).toBeLessThan(3.5)
  })

  it('3-metal high mix (Fe=100, Zn=500, Pb=50) → pH 1.5-2.5 (Fe rất cao)', () => {
    // Probe: Fe=100, Zn=500, Pb=50 → 2.17. Fe 100 mg/L → pH rất acid.
    const pH = solveInitialPh({ Fe: 100, Zn: 500, Pb: 50 }, 1000)
    expect(pH).not.toBeNull()
    expect(pH!).toBeGreaterThan(1.5)
    expect(pH!).toBeLessThan(2.5)
  })

  it('3-metal Fe cực thấp (Fe=0.1, Zn=100, Pb=10) → pH 4.5-5.2', () => {
    // Probe: Fe=0.1, Zn=100, Pb=10 → 4.96. Fe rất yếu → Zn/Pb gánh pH.
    const pH = solveInitialPh({ Fe: 0.1, Zn: 100, Pb: 10 }, 1000)
    expect(pH).not.toBeNull()
    expect(pH!).toBeGreaterThan(4.5)
    expect(pH!).toBeLessThan(5.2)
  })
})

describe('capacityAtPhMgPerL (mirror capacity.ts cho client-side UI)', () => {
  it('trả capacity Fe/Zn/Pb tại pH cho trước', () => {
    const cap = capacityAtPhMgPerL(8.78)
    expect(cap.Fe).toBeGreaterThan(0)
    expect(cap.Zn).toBeGreaterThan(0)
    expect(cap.Pb).toBeGreaterThan(0)
  })

  it('capacity giảm khi pH tăng (hydroxide route)', () => {
    const capPh7 = capacityAtPhMgPerL(7)
    const capPh9 = capacityAtPhMgPerL(9)
    expect(capPh9.Fe).toBeLessThan(capPh7.Fe)
    expect(capPh9.Zn).toBeLessThan(capPh7.Zn)
    expect(capPh9.Pb).toBeLessThan(capPh7.Pb)
  })

  it('Fe capacity ≈ 0 ở pH ≥ 5 (Fe(OH)₃ kết tủa hoàn toàn)', () => {
    // log Ksp Fe(OH)₃ = -38.779 → ở pH 5, [Fe³⁺]_sat ≈ 10^(-38.779 + 3×(5-13.99))
    // = 10^(-38.779 - 26.97) = 10^-65.75 mol/L → về cơ bản bằng 0 mg/L.
    // Probe xác nhận: pH 5-10 đều cho Fe capacity = 0.000.
    for (const pH of [5, 6, 7, 8, 9, 10]) {
      const cap = capacityAtPhMgPerL(pH)
      expect(cap.Fe).toBeLessThan(1e-6)
    }
  })

  it('Zn capacity giảm 100× mỗi đơn vị pH (Zn(OH)₂ ksp, 2 OH⁻)', () => {
    // [Zn²⁺]_sat = Ksp / [OH⁻]² ∝ 10^(-2 × pH) → tăng 1 pH = giảm 100× capacity.
    // Probe: pH 7 ≈ 1947 mg/L, pH 8 ≈ 19.5 mg/L, pH 9 ≈ 0.195 mg/L.
    const cap7 = capacityAtPhMgPerL(7)
    const cap8 = capacityAtPhMgPerL(8)
    const cap9 = capacityAtPhMgPerL(9)
    expect(cap8.Zn).toBeCloseTo(cap7.Zn / 100, 6)
    expect(cap9.Zn).toBeCloseTo(cap7.Zn / 10000, 4)
  })

  it('Pb capacity giảm 100× mỗi đơn vị pH (Pb(OH)₂ ksp, 2 OH⁻)', () => {
    const cap7 = capacityAtPhMgPerL(7)
    const cap8 = capacityAtPhMgPerL(8)
    const cap9 = capacityAtPhMgPerL(9)
    expect(cap8.Pb).toBeCloseTo(cap7.Pb / 100, 6)
    expect(cap9.Pb).toBeCloseTo(cap7.Pb / 10000, 4)
  })

  it('capacity không âm tại pH biên (pH 0 và pH 14)', () => {
    const cap0 = capacityAtPhMgPerL(0)
    const cap14 = capacityAtPhMgPerL(14)
    expect(cap0.Fe).toBeGreaterThanOrEqual(0)
    expect(cap0.Zn).toBeGreaterThanOrEqual(0)
    expect(cap0.Pb).toBeGreaterThanOrEqual(0)
    expect(cap14.Fe).toBeGreaterThanOrEqual(0)
    expect(cap14.Zn).toBeGreaterThanOrEqual(0)
    expect(cap14.Pb).toBeGreaterThanOrEqual(0)
  })
})

describe('slider cap & step helpers (spec §3.2.2, §3.2.6)', () => {
  it('N=1 → cap = 100 mg/L', () => {
    expect(sliderCap(1)).toBe(100)
  })

  it('N=2 → cap = 25 mg/L', () => {
    expect(sliderCap(2)).toBe(25)
  })

  it('N=3 → cap = 100/9 ≈ 11.11 mg/L', () => {
    expect(sliderCap(3)).toBeCloseTo(11.111, 2)
  })

  it('N=0 → cap = 0', () => {
    expect(sliderCap(0)).toBe(0)
  })

  it('Fe/Zn step = 0.1 khi N < 3', () => {
    expect(sliderStepFeZn(1)).toBe(0.1)
    expect(sliderStepFeZn(2)).toBe(0.1)
  })

  it('Fe/Zn step = 0.01 khi N = 3', () => {
    expect(sliderStepFeZn(3)).toBe(0.01)
  })

  it('Pb step luôn = 0.001 (P0-H đã khóa)', () => {
    expect(sliderStepPb()).toBe(0.001)
  })
})
