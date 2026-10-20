/**
 * Utility to generate Water Treatment report snapshot
 */

import type { WaterTreatmentReportSnapshot } from './report-types.js'
import type { SampleApStatus, SampleCalculation } from './sample-apparatus.js'
import type { ApStatus, TreatmentCalculation, FilterHistoryEntry } from './apparatus.js'

const QCVN_LIMITS = {
  fe: 2.0,
  zn: 1.0,
  pb: 0.1,
  phMin: 6,
  phMax: 9,
} as const

export function generateWaterTreatmentReport({
  attemptId,
  sampleStatus,
  sampleCalculation,
  treatmentStatus,
  treatmentCalculation,
  filterHistory,
  dischargePhase,
  dischargePH,
  ban2LockedData,
  operationCount = 0,
}: {
  attemptId: string
  sampleStatus: SampleApStatus
  sampleCalculation: SampleCalculation | null
  treatmentStatus: ApStatus
  treatmentCalculation: TreatmentCalculation | null
  filterHistory: readonly FilterHistoryEntry[]
  dischargePhase: 'pending' | 'balancing' | 'discharged'
  dischargePH: number | null
  ban2LockedData: {
    pH: number
    calculation: TreatmentCalculation
    filterHistory: FilterHistoryEntry[]
  } | null
  operationCount?: number
}): WaterTreatmentReportSnapshot {
  const diagnostics: WaterTreatmentReportSnapshot['diagnostics'] = []

  // Check completion status
  if (!sampleCalculation) {
    diagnostics.push({
      code: 'NO_INITIAL_SAMPLE',
      message: 'Chưa tính mẫu nước ban đầu',
      suggestion: 'Hoàn thành Bàn 1: thêm ion Fe/Zn/Pb vào mẫu và tính nồng độ.',
      severity: 'error',
    })
  }

  if (!ban2LockedData) {
    diagnostics.push({
      code: 'NO_BAN2_LOCKED',
      message: 'Chưa khóa kết quả xử lý ở Bàn 2',
      suggestion: 'Thêm NaOH, khuấy, lắng, lọc rồi khóa kết quả ở Bàn 2 trước khi chuyển sang Bàn 3.',
      severity: 'error',
    })
  }

  if (filterHistory.length === 0 && treatmentCalculation) {
    diagnostics.push({
      code: 'MISSING_FILTRATION',
      message: 'Chưa thực hiện lọc',
      suggestion: 'Sau khi kết tủa hình thành, cần lọc để tách pha rắn khỏi dung dịch.',
      severity: 'warning',
    })
  }

  if (dischargePhase !== 'discharged') {
    diagnostics.push({
      code: 'NO_DISCHARGE',
      message: 'Chưa hoàn thành xả thải ở Bàn 3',
      suggestion: 'Cân bằng pH trong khoảng 6-9 rồi xả thải ở Bàn 3.',
      severity: 'warning',
    })
  }

  // Extract final results
  const finalFe = ban2LockedData?.calculation.filtrate_mgPerL.Fe ?? null
  const finalZn = ban2LockedData?.calculation.filtrate_mgPerL.Zn ?? null
  const finalPb = ban2LockedData?.calculation.filtrate_mgPerL.Pb ?? null
  const finalPH = ban2LockedData?.pH ?? dischargePH ?? treatmentStatus.pH

  // Check QCVN compliance
  const feMet = finalFe !== null && finalFe <= QCVN_LIMITS.fe
  const znMet = finalZn !== null && finalZn <= QCVN_LIMITS.zn
  const pbMet = finalPb !== null && finalPb <= QCVN_LIMITS.pb
  const phMet = finalPH >= QCVN_LIMITS.phMin && finalPH <= QCVN_LIMITS.phMax

  if (finalFe !== null && !feMet) {
    diagnostics.push({
      code: 'FE_EXCEEDS_LIMIT',
      message: `Nồng độ Fe (${finalFe.toFixed(2)} mg/L) vượt giới hạn ${QCVN_LIMITS.fe} mg/L`,
      suggestion: 'Tăng pH để kết tủa thêm Fe(OH)₃. Fe kết tủa tốt ở pH > 6.',
      severity: 'error',
    })
  }

  if (finalZn !== null && !znMet) {
    diagnostics.push({
      code: 'ZN_EXCEEDS_LIMIT',
      message: `Nồng độ Zn (${finalZn.toFixed(2)} mg/L) vượt giới hạn ${QCVN_LIMITS.zn} mg/L`,
      suggestion: 'Tăng pH để kết tủa Zn(OH)₂. Zn kết tủa tốt ở pH 8-9.',
      severity: 'error',
    })
  }

  if (finalPb !== null && !pbMet) {
    diagnostics.push({
      code: 'PB_EXCEEDS_LIMIT',
      message: `Nồng độ Pb (${finalPb.toFixed(2)} mg/L) vượt giới hạn ${QCVN_LIMITS.pb} mg/L`,
      suggestion: 'Tăng pH để kết tủa Pb(OH)₂. Pb kết tủa tốt ở pH 8-9.',
      severity: 'error',
    })
  }

  if (!phMet) {
    diagnostics.push({
      code: 'PH_OUT_OF_RANGE',
      message: `pH (${finalPH.toFixed(1)}) ngoài khoảng cho phép ${QCVN_LIMITS.phMin}-${QCVN_LIMITS.phMax}`,
      suggestion: finalPH < QCVN_LIMITS.phMin
        ? 'Cần tăng pH bằng NaOH ở Bàn 3 trước khi xả thải.'
        : 'Cần giảm pH bằng HCl ở Bàn 3 trước khi xả thải.',
      severity: 'error',
    })
  }

  // Calculate removal efficiency
  const initialFe = sampleCalculation?.dissolvedMgL.fe ?? null
  const initialZn = sampleCalculation?.dissolvedMgL.zn ?? null
  const initialPb = sampleCalculation?.dissolvedMgL.pb ?? null

  const removalFe =
    initialFe !== null && finalFe !== null ? ((initialFe - finalFe) / initialFe) * 100 : null
  const removalZn =
    initialZn !== null && finalZn !== null ? ((initialZn - finalZn) / initialZn) * 100 : null
  const removalPb =
    initialPb !== null && finalPb !== null ? ((initialPb - finalPb) / initialPb) * 100 : null

  // Removal efficiency feedback
  if (removalFe !== null && removalFe < 90) {
    diagnostics.push({
      code: 'LOW_REMOVAL_FE',
      message: `Hiệu suất xử lý Fe (${removalFe.toFixed(1)}%) thấp hơn mục tiêu 90%`,
      suggestion: 'Kiểm tra pH có đủ cao để kết tủa Fe(OH)₃ không. Đảm bảo đã lọc sau khi lắng.',
      severity: 'warning',
    })
  }

  if (removalZn !== null && removalZn < 90) {
    diagnostics.push({
      code: 'LOW_REMOVAL_ZN',
      message: `Hiệu suất xử lý Zn (${removalZn.toFixed(1)}%) thấp hơn mục tiêu 90%`,
      suggestion: 'pH cần đạt 8-9 để kết tủa Zn(OH)₂ hiệu quả.',
      severity: 'warning',
    })
  }

  if (removalPb !== null && removalPb < 90) {
    diagnostics.push({
      code: 'LOW_REMOVAL_PB',
      message: `Hiệu suất xử lý Pb (${removalPb.toFixed(1)}%) thấp hơn mục tiêu 90%`,
      suggestion: 'pH cần đạt 8-9 để kết tủa Pb(OH)₂ hiệu quả.',
      severity: 'warning',
    })
  }

  const evaluable = sampleCalculation !== null && ban2LockedData !== null
  const goalMet = evaluable && feMet && znMet && pbMet && phMet

  return {
    generatedAt: new Date(),
    attemptId,
    status: 'completed',
    releaseId: 'wt-v0-alpha',
    versions: {
      profileId: 'water-treatment',
      profileVersion: '0.1.0',
    },

    sampleStatus: {
      feAddedMl: sampleStatus.feAddedMl,
      znAddedMl: sampleStatus.znAddedMl,
      pbAddedMl: sampleStatus.pbAddedMl,
      volumeMl: sampleStatus.targetVolumeMl,
    },
    sampleCalculation: sampleCalculation
      ? {
          dissolvedMgL: {
            fe: sampleCalculation.dissolvedMgL.fe,
            zn: sampleCalculation.dissolvedMgL.zn,
            pb: sampleCalculation.dissolvedMgL.pb,
          },
        }
      : null,

    treatmentStatus: {
      pH: treatmentStatus.pH,
      volumeMl: treatmentStatus.volumeMl,
      naohAddedMl: treatmentStatus.naohAddedMl,
      hclAddedMl: treatmentStatus.hclAddedMl,
      stirDurationSeconds: 0, // TODO: track actual duration
      settleDurationSeconds: 0, // TODO: track actual duration
      filterCount: filterHistory.length,
    },
    filterHistory: filterHistory.map((entry) => ({
      sequence: entry.index,
      phAfter: entry.calculation.pH,
      elapsedSeconds: 0, // TODO: track actual time
    })),
    ban2LockedData: ban2LockedData
      ? {
          finalPH: ban2LockedData.pH,
          feAfterMgL: ban2LockedData.calculation.filtrate_mgPerL.Fe,
          znAfterMgL: ban2LockedData.calculation.filtrate_mgPerL.Zn,
          pbAfterMgL: ban2LockedData.calculation.filtrate_mgPerL.Pb,
        }
      : null,

    dischargePhase: dischargePhase === 'pending' ? 'idle' : dischargePhase === 'balancing' ? 'discharging' : 'discharged',
    dischargePH,

    goalStatus: {
      evaluable,
      goalMet,
      criteria: [
        {
          key: 'fe',
          label: 'Sắt (Fe)',
          met: feMet,
          value: finalFe,
          limit: { value: QCVN_LIMITS.fe },
        },
        {
          key: 'zn',
          label: 'Kẽm (Zn)',
          met: znMet,
          value: finalZn,
          limit: { value: QCVN_LIMITS.zn },
        },
        {
          key: 'pb',
          label: 'Chì (Pb)',
          met: pbMet,
          value: finalPb,
          limit: { value: QCVN_LIMITS.pb },
        },
        {
          key: 'ph',
          label: 'pH',
          met: phMet,
          value: finalPH,
          limit: { min: QCVN_LIMITS.phMin, max: QCVN_LIMITS.phMax },
        },
      ],
    },

    resources: {
      operationCount,
      waterUsedMl: sampleStatus.targetVolumeMl,
      reagents: {
        naoh: { amount: treatmentStatus.naohAddedMl, unit: 'mL' },
        hcl: { amount: treatmentStatus.hclAddedMl, unit: 'mL' },
      },
    },

    diagnostics,

    removalEfficiency: {
      fe: removalFe,
      zn: removalZn,
      pb: removalPb,
    },
  }
}
