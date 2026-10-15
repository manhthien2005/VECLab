import type { JarReportSnapshot, JarReportCup } from '@/application/scenarios/jar-projection.js'

const fmt = (n: number) => n.toLocaleString('vi-VN', { maximumFractionDigits: 2 })
export function jarReportSummary(report: JarReportSnapshot) {
  const initial = report.initialMeasurement
  const initialNtu = initial?.valid && initial.valueNtu !== null && initial.valueNtu > 0 ? initial.valueNtu : null
  const targetFinalNtu = initialNtu === null ? null : initialNtu * (1 - report.reference.targetRemovalPercent / 100)
  const missing: string[] = []
  if (initialNtu === null) missing.push('Bước 1 · Chưa có số đo mẫu ban đầu hợp lệ.')
  if (!report.cups.length) missing.push('Bước 2 · Chưa chuẩn bị cốc nào.')
  const duration = Object.values(report.reference.phases).reduce((sum, phase) => sum + phase.durationSeconds, 0)
  if (report.projection.elapsedSeconds < duration) missing.push('Bước 4 · Chưa hoàn tất cả ba pha khuấy–lắng.')
  for (const cup of report.cups) {
    if (!cup.measurements.some(m => m.valid && m.valueNtu !== null)) missing.push('Bước 5 · Cốc ' + cup.id + ': cần số đo cuối hợp lệ.')
    if (cup.submittedRemovalPercent === null) missing.push('Bước 6 · Cốc ' + cup.id + ': chưa ghi đáp số tự tính.')
  }
  if (!report.selectedCupId) missing.push('Bước 7 · Chưa chọn phương án nộp.')
  const completeCups = report.cups.filter(c => c.measuredRemovalPercent !== null && c.submittedRemovalPercent !== null).length
  return { initialNtu, targetFinalNtu, missing, completeCups }
}

/** Only compare observed cups with the same pH. This does not infer an optimum or a causal error. */
export function jarDoseObservation(cup: JarReportCup, cups: readonly JarReportCup[]): string | null {
  if (cup.measuredRemovalPercent === null) return null
  const removal = cup.measuredRemovalPercent
  const peer = cups.filter(c => c.id !== cup.id && c.initialPh === cup.initialPh && c.measuredRemovalPercent !== null && c.doseMgL !== cup.doseMgL && c.measuredRemovalPercent > removal + 1e-9).sort((a, b) => a.doseMgL - b.doseMgL)[0]
  if (!peer || peer.measuredRemovalPercent === null) return null
  return `Cùng pH ${cup.initialPh}, cốc ${peer.id} dùng ${peer.doseMgL < cup.doseMgL ? 'ít hơn' : 'nhiều hơn'} ${fmt(Math.abs(cup.doseMgL - peer.doseMgL))} mg/L và giảm đục cao hơn ${fmt(peer.measuredRemovalPercent - removal)} điểm %. Đây là so sánh các cốc đã đo, chưa chứng minh một liều tối ưu cho mẫu khác.`
}
