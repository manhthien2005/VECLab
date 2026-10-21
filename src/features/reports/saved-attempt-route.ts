import type { UUID } from '@/domain/process/contracts.js'
import { PLASTIC_PROFILE } from '@/domain/experiments/virgin-plastic-separation/model.js'

/** Never relabel a retired/unknown attempt as a current lesson. */
export function savedAttemptHref(scenarioKey: string, attemptId: UUID, view: 'attempt' | 'report', releaseId?: string): string | null {
  if (scenarioKey === 'plastic-separation' && releaseId === PLASTIC_PROFILE.releaseId) {
    return `/simulate/plastic-density-separation?attempt=${attemptId}${view === 'report' ? '&view=report' : ''}`
  }
  if (scenarioKey !== 'jar-test' && scenarioKey !== 'acid-base-extraction' && scenarioKey !== 'cold-process-soap') return null
  return `/simulate/${scenarioKey}?attempt=${attemptId}${view === 'report' ? '&view=report' : ''}`
}
