import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { GuestAttemptRepository } from '@/application/attempts/guest-repository.js'
import { createJarSession } from '@/application/simulation/jar-session.js'
import type { JarState } from '@/domain/experiments/jar-test/model.js'
import { newUUID } from '@/shared/ids.js'
import { listJarLabRows, removeJarLabAttempt } from '@/features/learner-lab/jar-attempts.js'

const repository = new GuestAttemptRepository<JarState>()
const session = createJarSession(repository)
beforeEach(async () => {
  for (const row of await repository.listAttempts({})) await repository.deleteAttempt(row.attemptId)
})
async function unrelatedRecord() {
  return new GuestAttemptRepository<object>().createAttempt({
    attemptId: newUUID(), scenarioKey: 'acid-neutralization', scenarioReleaseId: 'acid-neutralization@1.0.0',
    contentLocale: 'vi', initialState: { legacyFixture: true }, initialProjection: { phStar: 7 }, projectionVersion: 1,
  })
}

describe('Jar lab reads actual browser summaries', () => {
  it('excludes old lessons and preserves dose, missing readings and completed state', async () => {
    await unrelatedRecord()
    const started = await session.start()
    await session.apply(started.attemptId, 'prepare_cup', { cupId: 'A', initialPh: 9 })
    await session.apply(started.attemptId, 'add_coagulant', { cupId: 'A', incrementMgL: 50 }, { incrementMgL: 'mg/L' })
    await session.apply(started.attemptId, 'measure_final', { cupId: 'A' })
    const rows = await listJarLabRows(repository)
    expect(rows).toHaveLength(1)
    expect(rows[0]?.status).toBe('in_progress')
    expect(rows[0]?.projection?.cups[0]).toMatchObject({ id: 'A', initialPh: 9, doseMgL: 50, measuredRemovalPercent: null, submittedRemovalPercent: null })
    expect(rows[0]?.projection?.cups[0]?.measurements[0]?.valueNtu).toBeNull()
    await session.complete(started.attemptId)
    const completed = (await listJarLabRows(repository))[0]!
    expect(completed.status).toBe('completed')
    expect(completed.projection?.initialMeasurement).toBeNull()
    expect(completed.projection?.cups[0]?.measuredRemovalPercent).toBeNull()
  })
  it('deletes only the requested Jar attempt and refuses deletion of another lesson', async () => {
    const unrelated = await unrelatedRecord()
    const started = await session.start()
    await expect(removeJarLabAttempt(repository, unrelated.attemptId)).rejects.toThrow('different scenario')
    expect(await repository.getAttempt(unrelated.attemptId)).not.toBeNull()
    await removeJarLabAttempt(repository, started.attemptId)
    expect(await repository.getAttempt(started.attemptId)).toBeNull()
    expect(await repository.getAttempt(unrelated.attemptId)).not.toBeNull()
  })
})
