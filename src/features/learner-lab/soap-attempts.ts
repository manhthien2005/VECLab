import type { UUID } from '@/domain/process/contracts.js'
import { SOAP_PROFILE } from '@/domain/experiments/soap/model.js'
import type { SoapState } from '@/domain/experiments/soap/model.js'
import { SOAP_PROJECTION_VERSION, type SoapProjection } from '@/application/scenarios/soap-projection.js'
import type { AttemptRepository } from '@/application/attempts/repository.js'

export type SoapLabRow = {
  attemptId: UUID
  status: 'in_progress' | 'completed' | 'stopped'
  scenarioReleaseId: string
  updatedAt: Date
  projection: SoapProjection | null
}

function asProjection(value: unknown, releaseId: string): SoapProjection | null {
  if (!value || typeof value !== 'object') return null
  const projection = value as SoapProjection
  return projection.scenarioKey === 'cold-process-soap' &&
    projection.scenarioReleaseId === releaseId &&
    projection.projectionVersion === SOAP_PROJECTION_VERSION
    ? projection
    : null
}

export async function listSoapLabRows(repository: AttemptRepository<SoapState>): Promise<SoapLabRow[]> {
  return (await repository.listAttempts({ scenarioKey: 'cold-process-soap' })).flatMap((summary) => {
    if (summary.scenarioKey !== 'cold-process-soap') return []
    const valid = summary.scenarioReleaseId === SOAP_PROFILE.releaseId
    return [{
      attemptId: summary.attemptId,
      status: summary.status,
      scenarioReleaseId: summary.scenarioReleaseId,
      updatedAt: summary.updatedAt,
      projection: valid ? asProjection(summary.currentProjection, summary.scenarioReleaseId) : null,
    }]
  })
}

export async function removeSoapLabAttempt(repository: AttemptRepository<SoapState>, attemptId: UUID): Promise<void> {
  const attempt = await repository.getAttempt(attemptId)
  if (attempt !== null && attempt.scenarioKey !== 'cold-process-soap') {
    throw new Error('Cannot delete a different scenario from the soap lab')
  }
  await repository.deleteAttempt(attemptId)
}
