import type { AttemptRepository, AttemptSummary } from '@/application/attempts/repository.js'
import { JAR_PROJECTION_VERSION, type JarProjection } from '@/application/scenarios/jar-projection.js'
import { JAR_PROFILE, JAR_CUP_IDS, type JarState } from '@/domain/experiments/jar-test/model.js'
import type { UUID } from '@/domain/process/contracts.js'

export type JarLabRow = Pick<AttemptSummary, 'attemptId' | 'status' | 'updatedAt' | 'scenarioReleaseId'> & { projection: JarProjection | null }

function isReading(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false
  const reading = value as Record<string, unknown>
  return typeof reading.valid === 'boolean' && (reading.valueNtu === null || typeof reading.valueNtu === 'number' && Number.isFinite(reading.valueNtu))
}

/** List only the current scenario. Foreign/old projections never become fake zero values. */
function toJarLabRow(summary: AttemptSummary): JarLabRow | null {
  if (summary.scenarioKey !== 'jar-test') return null
  const value = summary.currentProjection as Partial<JarProjection> | null
  const valid = summary.scenarioReleaseId === JAR_PROFILE.releaseId && value?.scenarioKey === 'jar-test' &&
    value.scenarioReleaseId === JAR_PROFILE.releaseId && value.projectionVersion === JAR_PROJECTION_VERSION &&
    ['setup', 'rapid', 'slow', 'settling', 'completed'].includes(value.phase ?? '') &&
    typeof value.elapsedSeconds === 'number' && Number.isFinite(value.elapsedSeconds) &&
    (value.initialMeasurement === null || isReading(value.initialMeasurement)) &&
    (value.selectedCupId === null || JAR_CUP_IDS.some(id => id === value.selectedCupId)) &&
    Array.isArray(value.cups) && value.cups.every(cup => cup && JAR_CUP_IDS.includes(cup.id) &&
      Number.isFinite(cup.initialPh) && Number.isFinite(cup.doseMgL) && Array.isArray(cup.measurements) && cup.measurements.every(isReading) &&
      (cup.submittedRemovalPercent === null || typeof cup.submittedRemovalPercent === 'number' && Number.isFinite(cup.submittedRemovalPercent)) &&
      (cup.measuredRemovalPercent === null || typeof cup.measuredRemovalPercent === 'number' && Number.isFinite(cup.measuredRemovalPercent)))
  return {
    attemptId: summary.attemptId, status: summary.status, updatedAt: summary.updatedAt,
    scenarioReleaseId: summary.scenarioReleaseId, projection: valid ? value as JarProjection : null,
  }
}

export async function listJarLabRows(repository: AttemptRepository<JarState>): Promise<JarLabRow[]> {
  return (await repository.listAttempts({ scenarioKey: 'jar-test' })).flatMap(summary => {
    const row = toJarLabRow(summary)
    return row ? [row] : []
  })
}

export async function removeJarLabAttempt(repository: AttemptRepository<JarState>, id: UUID): Promise<void> {
  const attempt = await repository.getAttempt(id)
  if (attempt === null) return
  if (attempt.scenarioKey !== 'jar-test') throw new Error('Cannot delete a different scenario from the Jar lab')
  await repository.deleteAttempt(id)
}
