import type { JarReportSnapshot } from '@/application/scenarios/jar-projection.js'

/** Compare frozen reports only, never predictions or live projections. */
export function jarComparisonProblem(aId: string, a: JarReportSnapshot, bId: string, b: JarReportSnapshot): string | null {
  if (aId === bId) return 'Hãy chọn hai lượt thực hành khác nhau.'
  if (a.scenarioKey !== 'jar-test' || b.scenarioKey !== 'jar-test' ||
      a.releaseId !== b.releaseId || a.schemaVersion !== b.schemaVersion ||
      Object.keys(a.versions).length !== Object.keys(b.versions).length ||
      Object.entries(a.versions).some(([key, value]) => b.versions[key as keyof typeof b.versions] !== value)) {
    return 'Hai lượt sử dụng phiên bản mô phỏng khác nhau. Hãy xem báo cáo riêng của từng lượt.'
  }
  return null
}

export function selectedJarResult(report: JarReportSnapshot) {
  const cup = report.cups.find(item => item.id === report.selectedCupId)
  // Match the frozen report's latest valid measurement, not an earlier rejected reading.
  const reading = cup?.measurements.filter(item => item.valid && item.valueNtu !== null).at(-1)
  return {
    cupId: cup?.id ?? null,
    ph: cup?.initialPh ?? null,
    dose: cup?.doseMgL ?? null,
    finalNtu: reading?.valid ? reading.valueNtu : null,
    removal: cup?.measuredRemovalPercent ?? null,
    answer: cup?.submittedRemovalPercent ?? null,
    error: cup?.measuredRemovalPercent != null && cup.submittedRemovalPercent != null
      ? Math.abs(cup.measuredRemovalPercent - cup.submittedRemovalPercent) : null,
  }
}
