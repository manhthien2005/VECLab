/**
 * Provenance + outcome contract cho skeleton workbench Water Treatment.
 * Xem `docs/experiments/water-treatment-spec.md` §6.5, §6.7.2, §4.1 và §16.1.
 */
export const WT_SOLID_PHASE = {
  Fe: 'Ferrihydrite',
  Zn: 'Zn(OH)₂(am)',
  Pb: 'Pb(OH)₂',
} as const

export const WT_KSP_LOGK = {
  Fe: -38.779,
  Zn: -15.506,
  Pb: -19.83,
} as const

export const WT_QCVN_COLUMN_A = {
  Fe_mgPerL: 2.0,
  Zn_mgPerL: 1.0,
  Pb_mgPerL: 0.1,
  pH_min: 6,
  pH_max: 9,
  source: 'Bảng 2, Thông tư 06/2025/TT-BTNMT — đã xác minh pháp lý ngày 16/10/2026',
  pdfSha256: '1fb859f91af39c31c32936fd8988f69b4d2f25805a9689afff578be4050ac5da',
} as const

/**
 * Mass-balance tolerance ±2% (P0-J) cho sample-level check, theo
 * `docs/experiments/water-treatment-spec.md` §6.6 step 5 + §7.4.5 và
 * `docs/experiments/water-treatment-evidence.md` §5.1.4 (đã chốt O9 ngày 16/10/2026).
 *
 * Công thức: `pct = |input - filtrate - precipitated| / max(input, 1e-9) × 100`
 * cho Fe/Zn/Pb. Nếu pct > tolerance ở bất kỳ nguyên tố nào →
 * `invalidReasonCodes` thêm `'MASS_BALANCE_BELOW_TOLERANCE'` và
 * `goalStatus = 'invalid'`. Với baseline hydroxide-only hiện hành
 * (filtrate + precipitated = input exact) → pct = 0% cho mọi case;
 * check vẫn được wire để guard chống chemistry bug trong tương lai.
 */
export const WT_MASS_BALANCE_TOLERANCE_PCT = 2 as const

/**
 * Hợp đồng trạng thái 3 dòng (water-treatment-spec §4.1 + evidence register §7).
 *
 * P0-A, P0-D đóng 16/10/2026; P0-C, P0-F đóng 17/10/2026:
 *   - P0-A: QCVN 40:2025/BTNMT đã xác minh pháp lý → `goalStatus` không bị khoá bởi
 *     lý do pháp lý nữa.
 *   - P0-D: 6/6 chemistry claim ở `cross-checked` + 7/7 case PHREEQC PASS trên database
 *     đã pin (PHREEQC 3.8.6-17100, minteq.v4.dat). Solver được phép dùng baseline
 *     D1–D5. Vì vậy `verificationStatus` đã lên `cross-checked`.
 *   - P0-C: closed-form capacity 3 KL cross-check vs PHREEQC ±0,025 log, user sign-off.
 *   - P0-F: 3 golden case (G1 AI-prepared + G2/G3 reuse P0-D) — solver có thể tính
 *     goalStatus end-to-end (success / partial-success / failed / invalid).
 *
 * Vì tất cả P0 blockers đã đóng, `goalStatus` rời `'unknown'` mặc định — chỉ giữ
 * `'unknown'` khi input vi phạm pH guard [2; 13] / dose cap / mass-balance (P0-J ±2%),
 * trường hợp đó gán `'invalid'` thay vì `'unknown'` theo spec §4.1.
 */
export type WaterTreatmentGoalStatus =
  | 'pending'
  | 'success'
  | 'partial-success'
  | 'failed'
  | 'invalid'
  | 'unknown'

export type WaterTreatmentVerificationStatus =
  | 'pending'
  | 'source-checked'
  | 'cross-checked'
  | 'failed'

export type WaterTreatmentOutcome = {
  readonly expectedOutcome: WaterTreatmentGoalStatus
  readonly goalStatus: WaterTreatmentGoalStatus
  readonly verificationStatus: WaterTreatmentVerificationStatus
  readonly unknownReasonCodes: readonly string[]
}
