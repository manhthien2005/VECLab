import { describe, expect, it } from 'vitest'
import { projectPlastic } from '@/application/scenarios/plastic-projection.js'
import { createPlasticSeparationModule, OUTCOMES } from '@/domain/experiments/virgin-plastic-separation/index.js'
import { plasticFractionReadout, plasticSubmissionChecks, plasticWorkbenchContext, plasticWeighingLabel } from '@/features/plastic-separation/readouts.js'
import { PLASTIC_ITEMS } from '@/features/plastic-separation/equipment-panel.js'
import { toPlasticLabRow } from '@/features/learner-lab/plastic-attempts.js'
import type { AttemptSummary } from '@/application/attempts/repository.js'
import type { UUID } from '@/domain/process/contracts.js'

function recordedFractions() {
  return {
    ...projectPlastic(createPlasticSeparationModule().createInitialState()),
    collectedFractions: [
      { fractionId: 'pp', polymerId: 'PP' as const, mediumUsed: 'Ethanol 23% v/v', stageKind: 'ethanol_23' as const, behavior: 'floating' as const, reportedRecoveryPercent: 95.6 },
      { fractionId: 'hdpe', polymerId: 'HDPE' as const, mediumUsed: 'Ethanol 31% v/v', stageKind: 'ethanol_31' as const, behavior: 'sinking' as const, reportedRecoveryPercent: 99.7 },
    ],
  }
}

describe('plastic workbench readouts', () => {

  it('points the scene and controls to weighing while a fraction is pending', () => {
    const p = { ...recordedFractions(), samplesPrepared: true, wetted: true, waterSeparated: true, centrifuged: true, pendingCentrifugation: true, activeBranch: 'light' as const, lastOutcome: OUTCOMES.ethanol_23 }
    expect(plasticWorkbenchContext(p)).toMatchObject({ group: 'weigh', label: 'Ly tâm & cân', medium: 'Ethanol 23% v/v' })
    expect(plasticWeighingLabel(p)).toBe('Chưa ghi nhận')
  })
  it('does not call a newly selected NaCl branch water or show a concentration not yet run', () => {
    const p = { ...recordedFractions(), samplesPrepared: true, wetted: true, waterSeparated: true, centrifuged: true, activeBranch: 'heavy' as const, lastOutcome: OUTCOMES.water }
    expect(plasticWorkbenchContext(p)).toMatchObject({ group: 'separate', medium: 'NaCl · chưa chạy mức nồng độ' })
  })
  it('asks for the remaining branch instead of offering another completed concentration', () => {
    const p = { ...recordedFractions(), samplesPrepared: true, wetted: true, waterSeparated: true, centrifuged: true, activeBranch: 'light' as const, completedBranches: ['light' as const] }
    expect(plasticWorkbenchContext(p).next).toBe('Chọn nhánh còn lại để tiếp tục.')
  })
  it('shows each final NaCl fraction separately and never treats unrecorded mass as zero', () => {
    expect(plasticWeighingLabel(recordedFractions())).toBe('Chưa ghi nhận')
    const p = { ...recordedFractions(), weighedMassKg: 3.308, weighedFractions: { PA: { massKg: 1.4, recoveryPercent: 70 }, PC: { massKg: 1.908, recoveryPercent: 95.4 } } }
    expect(plasticWeighingLabel(p)).toBe('PA ≈ 1,40 kg · PC ≈ 1,908 kg')
  })
  it('keeps earlier readings but hides the latest fraction until weighing is committed', () => {
    const projection = { ...recordedFractions(), pendingCentrifugation: true, lastOutcome: OUTCOMES.ethanol_31 }
    expect(plasticFractionReadout(projection, 'PP', 2)?.massKg).toBeCloseTo(1.912)
    expect(plasticFractionReadout(projection, 'HDPE', 2)).toBeNull()
    expect(plasticFractionReadout(projection, 'PC', 2)).toBeNull()
    expect(plasticFractionReadout({ ...projection, pendingCentrifugation: false }, 'HDPE', 2)?.massKg).toBeCloseTo(1.994)
  })
  it('uses the saved report feed mass rather than assuming the current profile', () => {
    expect(plasticFractionReadout(recordedFractions(), 'PP', 1)?.massKg).toBeCloseTo(0.956)
  })
  it('requires both branches, final weighing and summary before submission', () => {
    const initial = recordedFractions()
    expect(plasticSubmissionChecks(initial).every(check => check.done)).toBe(false)
    const ready = { ...initial, samplesPrepared: true, wetted: true, waterSeparated: true, centrifuged: true, stage: 'summary' as const, completedBranches: ['light' as const, 'heavy' as const] }
    expect(plasticSubmissionChecks(ready).every(check => check.done)).toBe(true)
    expect(plasticSubmissionChecks({ ...ready, completedBranches: ['light'] }).every(check => check.done)).toBe(false)
    expect(plasticSubmissionChecks({ ...ready, pendingCentrifugation: true }).every(check => check.done)).toBe(false)
  })
  it('keeps sample copy aligned with the profile and the HDPE sinking fraction', () => {
    expect(PLASTIC_ITEMS.pp.facts).toContainEqual(['Khối lượng riêng danh định', '0,910 g/cm³'])
    expect(PLASTIC_ITEMS.hdpe.facts).toContainEqual(['Khối lượng riêng danh định', '0,953 g/cm³'])
    expect(PLASTIC_ITEMS.hdpe.facts.find(([label]) => label === 'Phân đoạn ghi nhận')?.[1]).toContain('chìm')
    expect(PLASTIC_ITEMS.scale.steps.join(' ')).not.toMatch(/tare|trừ bì|hiệu chuẩn/)
  })
  it('preserves unsupported saved runs without relabelling them as current', () => {
    const summary: AttemptSummary = {
      attemptId: '123e4567-e89b-42d3-a456-426614174000' as UUID,
      scenarioKey: 'plastic-separation', scenarioReleaseId: 'plastic-separation@0.2.0', status: 'in_progress',
      revision: 0, lastSequence: 0, currentProjection: recordedFractions(),
      createdAt: new Date('2026-10-19T00:00:00Z'), updatedAt: new Date('2026-10-19T00:00:00Z'), completedAt: null,
    }
    expect(toPlasticLabRow(summary)?.projection).not.toBeNull()
    expect(toPlasticLabRow({ ...summary, scenarioReleaseId: 'plastic-separation@0.1.0' }))
      .toMatchObject({ attemptId: summary.attemptId, scenarioReleaseId: 'plastic-separation@0.1.0', projection: null })
    expect(toPlasticLabRow({ ...summary, currentProjection: { stage: 'unknown' } })?.projection).toBeNull()
    expect(toPlasticLabRow({ ...summary, scenarioKey: 'jar-test' })).toBeNull()
  })
})
