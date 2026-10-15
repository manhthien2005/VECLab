import 'fake-indexeddb/auto'
import { expect, it } from 'vitest'
import { GuestAttemptRepository } from '@/application/attempts/guest-repository.js'
import { createJarSession } from '@/application/simulation/jar-session.js'
import type { JarState } from '@/domain/experiments/jar-test/model.js'
import { jarDoseObservation, jarReportSummary } from '@/features/jar-test/report-insights.js'

it('uses observed same-pH comparisons, preserves the chosen-cup goal and quantifies the 25 NTU target', async () => {
  const session = createJarSession(new GuestAttemptRepository<JarState>()), view = await session.start()
  async function run(type: string, parameters: Record<string, string | number> = {}) { const result = await session.apply(view.attemptId, type, parameters); if (!result.ok) throw Error('Unexpected rejection: ' + type); return result }
  await run('measure_initial')
  for (const [cupId, initialPh, incrementMgL] of [['A', 7, 50], ['B', 9, 150], ['C', 9, 250], ['D', 9, 50]] as const) { await run('prepare_cup', { cupId, initialPh }); await run('add_coagulant', { cupId, incrementMgL }) }
  for (const phase of ['rapid', 'slow', 'settling']) await run('run_phase', { phase })
  for (const [cupId, removalPercent] of [['A', 51.29], ['B', 86.79], ['C', 78.06], ['D', 77.04]] as const) { await run('measure_final', { cupId }); await run('record_result', { cupId, removalPercent }) }
  await run('select_result', { cupId: 'B' })
  const result = await session.complete(view.attemptId); if (!result.ok) throw Error('Completion failed')
  expect(result.report.goalStatus.goalMet).toBe(true)
  expect(jarReportSummary(result.report)).toEqual({ initialNtu: 125, targetFinalNtu: expect.closeTo(25), missing: [], completeCups: 4 })
  expect(jarDoseObservation(result.report.cups.find(c => c.id === 'C')!, result.report.cups)).toContain('cốc B dùng ít hơn 100 mg/L và giảm đục cao hơn 8,73 điểm %')
  expect(jarDoseObservation(result.report.cups.find(c => c.id === 'A')!, result.report.cups)).toBeNull()
  expect(jarDoseObservation(result.report.cups.find(c => c.id === 'D')!, result.report.cups)).toContain('cốc B dùng nhiều hơn 100 mg/L và giảm đục cao hơn 9,75 điểm %')
})

it('keeps missing measurements missing and identifies the steps needed for a complete report', async () => {
  const session = createJarSession(new GuestAttemptRepository<JarState>()), view = await session.start()
  await session.apply(view.attemptId, 'prepare_cup', { cupId: 'A', initialPh: 7 })
  await session.apply(view.attemptId, 'measure_final', { cupId: 'A' })
  const result = await session.complete(view.attemptId); if (!result.ok) throw Error('Completion failed')
  const summary = jarReportSummary(result.report)
  expect(summary.targetFinalNtu).toBeNull()
  expect(summary.initialNtu).toBeNull()
  expect(summary.completeCups).toBe(0)
  expect(summary.missing).toContain('Bước 1 · Chưa có số đo mẫu ban đầu hợp lệ.')
  expect(summary.missing).toContain('Bước 5 · Cốc A: cần số đo cuối hợp lệ.')
  expect(summary.missing).toContain('Bước 6 · Cốc A: chưa ghi đáp số tự tính.')
  expect(jarDoseObservation(result.report.cups[0]!, result.report.cups)).toBeNull()
})
