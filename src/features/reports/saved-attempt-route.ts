import type { UUID } from '@/domain/process/contracts.js'

/** Never relabel a retired/unknown attempt as a current lesson. */
export function savedAttemptHref(scenarioKey: string, attemptId: UUID, view: 'attempt' | 'report'): string | null {
  if (scenarioKey !== 'jar-test' && scenarioKey !== 'acid-base-extraction') return null
  return `/simulate/${scenarioKey}?attempt=${attemptId}${view === 'report' ? '&view=report' : ''}`
}
