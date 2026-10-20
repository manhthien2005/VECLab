/**
 * Water Treatment experiment profile and constants.
 * Hydroxide route for Fe/Zn/Pb removal from synthetic aqueous samples.
 * Chemistry engine and session model TBD (v1 planned).
 */

export const WATER_TREATMENT_PROFILE = {
  releaseId: 'wt-v0-alpha',
  experimentKey: 'water-treatment',
  experimentName: 'Xử lý nước Fe, Zn, Pb',

  // Sample composition ranges (mg/L)
  feRange: { min: 0.5, max: 20 },
  znRange: { min: 0.5, max: 10 },
  pbRange: { min: 0.1, max: 2 },
  
  // Volume range (mL)
  volumeRange: { min: 500, max: 2000 },
  volumeDefault: 1000,

  // pH operational range
  phOperatingMin: 6,
  phOperatingMax: 9,

  // QCVN 40:2025/BTNMT Cột A limits (mg/L)
  qcvnLimits: {
    fe: 2.0,
    zn: 1.0,
    pb: 0.1,
  },

  // Procedure phases
  phases: {
    composition: { name: 'Pha nước', id: 'composition' },
    treatment: { name: 'Xử lý (khuấy, lắng, lọc)', id: 'treatment' },
    measurement: { name: 'Đo lại pH & nồng độ', id: 'measurement' },
    verification: { name: 'Đối chiếu QCVN', id: 'verification' },
  },
} as const
