import type { AttemptRepository, AttemptSummary } from '@/application/attempts/repository.js'
import { PLASTIC_PROFILE, type PlasticSeparationState } from '@/domain/experiments/virgin-plastic-separation/model.js'
import { PLASTIC_PROJECTION_VERSION, type PlasticProjection } from '@/application/scenarios/plastic-projection.js'

export type PlasticLabRow = Pick<AttemptSummary, 'attemptId' | 'status' | 'updatedAt' | 'scenarioReleaseId'> & { projection: PlasticProjection | null }

export function toPlasticLabRow(summary: AttemptSummary): PlasticLabRow | null {
  if (summary.scenarioKey !== 'plastic-separation') return null
  const value = summary.currentProjection as Partial<PlasticProjection> | null
  const valid = summary.scenarioReleaseId === PLASTIC_PROFILE.releaseId && value?.scenarioKey === 'plastic-separation' &&
    value.scenarioReleaseId === summary.scenarioReleaseId && value.projectionVersion === PLASTIC_PROJECTION_VERSION &&
    ['preparation', 'wetting', 'water_separation', 'centrifugation', 'branch_selection', 'ethanol_branch', 'nacl_branch', 'summary', 'completed'].includes(value.stage ?? '') &&
    Array.isArray(value.completedBranches) && value.completedBranches.length <= 2 && value.completedBranches.every(branch => branch === 'light' || branch === 'heavy') &&
    Array.isArray(value.outcomesHistory) && Array.isArray(value.collectedFractions)
  return { attemptId: summary.attemptId, status: summary.status, updatedAt: summary.updatedAt, scenarioReleaseId: summary.scenarioReleaseId, projection: valid ? value as PlasticProjection : null }
}

export async function listPlasticLabRows(repository: AttemptRepository<PlasticSeparationState>): Promise<PlasticLabRow[]> {
  return (await repository.listAttempts({ scenarioKey: 'plastic-separation' })).flatMap(summary => {
    const row = toPlasticLabRow(summary)
    return row ? [row] : []
  })
}
