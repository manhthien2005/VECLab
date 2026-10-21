/**
 * Simple localStorage-based storage for Water Treatment reports.
 * This is a simplified approach until Water Treatment gets full event sourcing.
 */

import type { WaterTreatmentReportSnapshot } from './report-types.js'

const STORAGE_KEY = 'veclab:water-treatment:reports'
const MAX_REPORTS = 50

export type StoredReport = {
  id: string
  report: WaterTreatmentReportSnapshot
  savedAt: Date
}

/**
 * Get all stored reports, newest first
 */
export function getStoredReports(): StoredReport[] {
  if (typeof window === 'undefined') return []
  
  try {
    const json = localStorage.getItem(STORAGE_KEY)
    if (!json) return []
    
    const parsed = JSON.parse(json) as Array<{
      id: string
      report: WaterTreatmentReportSnapshot
      savedAt: string
    }>
    
    // Convert date strings back to Date objects
    return parsed.map(item => ({
      ...item,
      savedAt: new Date(item.savedAt),
      report: {
        ...item.report,
        generatedAt: new Date(item.report.generatedAt),
      },
    })).sort((a, b) => b.savedAt.getTime() - a.savedAt.getTime())
  } catch {
    return []
  }
}

/**
 * Save a report snapshot
 */
export function saveReport(report: WaterTreatmentReportSnapshot): void {
  if (typeof window === 'undefined') return
  
  try {
    const reports = getStoredReports()
    
    // Add new report
    const newReport: StoredReport = {
      id: report.attemptId,
      report,
      savedAt: new Date(),
    }
    
    // Keep only the most recent MAX_REPORTS
    const updated = [newReport, ...reports.filter(r => r.id !== report.attemptId)]
      .slice(0, MAX_REPORTS)
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (error) {
    console.error('Failed to save Water Treatment report:', error)
  }
}

/**
 * Get a specific report by ID
 */
export function getReport(attemptId: string): WaterTreatmentReportSnapshot | null {
  const reports = getStoredReports()
  const stored = reports.find(r => r.id === attemptId)
  return stored?.report ?? null
}

/**
 * Delete a report
 */
export function deleteReport(attemptId: string): void {
  if (typeof window === 'undefined') return
  
  try {
    const reports = getStoredReports().filter(r => r.id !== attemptId)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports))
  } catch (error) {
    console.error('Failed to delete Water Treatment report:', error)
  }
}

/**
 * Get summary statistics
 */
export function getReportStatistics(): {
  totalReports: number
  completedReports: number
  successfulReports: number
  averageRemovalEfficiency: { fe: number; zn: number; pb: number } | null
} {
  const reports = getStoredReports()
  
  const completed = reports.filter(r => r.report.goalStatus.evaluable)
  const successful = reports.filter(r => r.report.goalStatus.goalMet)
  
  // Calculate average removal efficiency
  let totalFe = 0, totalZn = 0, totalPb = 0, count = 0
  
  for (const { report } of completed) {
    if (report.removalEfficiency.fe !== null) {
      totalFe += report.removalEfficiency.fe
      count++
    }
    if (report.removalEfficiency.zn !== null) {
      totalZn += report.removalEfficiency.zn
    }
    if (report.removalEfficiency.pb !== null) {
      totalPb += report.removalEfficiency.pb
    }
  }
  
  return {
    totalReports: reports.length,
    completedReports: completed.length,
    successfulReports: successful.length,
    averageRemovalEfficiency: count > 0
      ? {
          fe: totalFe / count,
          zn: totalZn / count,
          pb: totalPb / count,
        }
      : null,
  }
}
