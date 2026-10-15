import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { GuestAttemptRepository } from '@/application/attempts/guest-repository.js'
import { createJarSession } from '@/application/simulation/jar-session.js'
import type { JarState } from '@/domain/experiments/jar-test/model.js'
import { jarComparisonProblem, selectedJarResult } from '@/features/compare/jar-comparison.js'

describe('Jar comparison uses frozen results', () => {
  it('reads actual selected-cup measurements, keeps missing values null, and checks versions', async () => {
    const session = createJarSession(new GuestAttemptRepository<JarState>())
    const attempt = await session.start()
    const id = attempt.attemptId
    for (const [action, parameters, units] of [
      ['prepare_cup', { cupId: 'A', initialPh: 9 }, {}],
      ['measure_initial', {}, {}],
      ['add_coagulant', { cupId: 'A', incrementMgL: 150 }, { incrementMgL: 'mg/L' }],
      ['run_phase', { phase: 'rapid' }, {}],
      ['run_phase', { phase: 'slow' }, {}],
      ['run_phase', { phase: 'settling' }, {}],
      ['measure_final', { cupId: 'A' }, {}],
      ['record_result', { cupId: 'A', removalPercent: 80 }, {}],
      ['select_result', { cupId: 'A' }, {}],
    ] as const) {
      expect((await session.apply(id, action, parameters, units)).ok, action).toBe(true)
    }
    const finished = await session.complete(id)
    if (!finished.ok) throw new Error('Completion failed')
    const report = finished.report
    expect(selectedJarResult(report)).toMatchObject({ cupId: 'A', ph: 9, dose: 150, answer: 80 })
    expect(selectedJarResult(report).finalNtu).toBeCloseTo(16.5125, 4)
    expect(selectedJarResult(report).error).toBeCloseTo(6.79, 2)
    expect(jarComparisonProblem(id, report, 'other', report)).toBeNull()
    expect(jarComparisonProblem(id, report, id, report)).toContain('khác nhau')
    expect(jarComparisonProblem(id, report, 'other', { ...report, versions: { ...report.versions, scoringVersion: 'other' } })).toContain('phiên bản')
    const incomplete = await session.start()
    const completeEmpty = await session.complete(incomplete.attemptId)
    if (!completeEmpty.ok) throw new Error('Completion failed')
    expect(selectedJarResult(completeEmpty.report)).toEqual({ cupId: null, ph: null, dose: null, finalNtu: null, removal: null, answer: null, error: null })
  })
})
