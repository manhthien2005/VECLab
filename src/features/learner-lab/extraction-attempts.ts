import type { AttemptRepository, AttemptSummary } from '@/application/attempts/repository.js'
import { resolveExtractionProfile, VESSEL_IDS, type ExtractionState } from '@/domain/experiments/acid-base-extraction/model.js'
import { EXTRACTION_PROJECTION_VERSION, type ExtractionProjection } from '@/application/scenarios/extraction-projection.js'
import type { UUID } from '@/domain/process/contracts.js'

export type ExtractionLabRow = Pick<AttemptSummary, 'attemptId' | 'status' | 'updatedAt' | 'scenarioReleaseId'> & { projection: ExtractionProjection | null }
function toExtractionLabRow(summary: AttemptSummary): ExtractionLabRow | null {
  if (summary.scenarioKey !== 'acid-base-extraction') return null
  const value = summary.currentProjection as Partial<ExtractionProjection> | null
  const valid = resolveExtractionProfile(summary.scenarioReleaseId)!==null && value?.scenarioKey === 'acid-base-extraction' &&
    value.scenarioReleaseId === summary.scenarioReleaseId && value.projectionVersion === EXTRACTION_PROJECTION_VERSION &&
    ['working', 'completed'].includes(value.phase ?? '') && Array.isArray(value.vessels) && value.vessels.length === 6 &&
    VESSEL_IDS.every(id => value.vessels!.some(v => v?.id === id && Number.isFinite(v.waterMl) && Number.isFinite(v.organicMl))) &&
    Array.isArray(value.readings) && Array.isArray(value.history) && value.submissions !== null && typeof value.submissions === 'object' && !Array.isArray(value.submissions)
  return { attemptId: summary.attemptId, status: summary.status, updatedAt: summary.updatedAt, scenarioReleaseId: summary.scenarioReleaseId, projection: valid ? value as ExtractionProjection : null }
}
export async function listExtractionLabRows(repository: AttemptRepository<ExtractionState>): Promise<ExtractionLabRow[]> {
  return (await repository.listAttempts({ scenarioKey: 'acid-base-extraction' })).flatMap(summary => {
    const row = toExtractionLabRow(summary)
    return row ? [row] : []
  })
}
export async function removeExtractionLabAttempt(repository: AttemptRepository<ExtractionState>, id: UUID): Promise<void> {
  const attempt = await repository.getAttempt(id)
  if (!attempt) return
  if (attempt.scenarioKey !== 'acid-base-extraction') throw new Error('Cannot delete a different scenario from the extraction lab')
  await repository.deleteAttempt(id)
}
