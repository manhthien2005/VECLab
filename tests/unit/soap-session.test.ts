import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { GuestAttemptRepository } from '@/application/attempts/guest-repository.js'
import { createSoapSession } from '@/application/simulation/soap-session.js'
import { createJarSession } from '@/application/simulation/jar-session.js'
import { createExtractionSession } from '@/application/simulation/extraction-session.js'
import { createPlasticSession } from '@/application/simulation/plastic-session.js'
import type { SoapState } from '@/domain/experiments/soap/model.js'
import type { JarState } from '@/domain/experiments/jar-test/model.js'
import type { ExtractionState } from '@/domain/experiments/acid-base-extraction/model.js'
import type { PlasticSeparationState } from '@/domain/experiments/virgin-plastic-separation/model.js'
import type { UUID } from '@/domain/process/contracts.js'
import { listSoapLabRows, removeSoapLabAttempt } from '@/features/learner-lab/soap-attempts.js'

describe('soap session isolation and persistence', () => {
  it('lists only soap and refuses to load, change or delete another lesson', async () => {
    const repository = new GuestAttemptRepository<SoapState>()
    const session = createSoapSession(repository)
    const soap = await session.start()
    const otherLessons = [
      await createJarSession(new GuestAttemptRepository<JarState>()).start(),
      await createExtractionSession(new GuestAttemptRepository<ExtractionState>()).start(),
      await createPlasticSession(new GuestAttemptRepository<PlasticSeparationState>()).start(),
    ]
    expect((await listSoapLabRows(repository)).map(row => row.attemptId)).toEqual([soap.attemptId])
    for (const other of otherLessons) {
      const before = await repository.getAttempt(other.attemptId)
      expect(await session.load(other.attemptId)).toMatchObject({ ok: false })
      expect(await session.apply(other.attemptId, 'pour_water', { waterVolumeL: 100 }, { waterVolumeL: 'mL' })).toMatchObject({ ok: false })
      expect(await session.complete(other.attemptId)).toMatchObject({ ok: false })
      await expect(removeSoapLabAttempt(repository, other.attemptId)).rejects.toThrow('different scenario')
      expect(await repository.getAttempt(other.attemptId)).toEqual(before)
    }
    await removeSoapLabAttempt(repository, soap.attemptId)
    expect(await listSoapLabRows(repository)).toEqual([])
    for (const other of otherLessons) expect(await repository.getAttempt(other.attemptId)).not.toBeNull()
  })

  it('replays an action once and rejects changed requests or stale revisions', async () => {
    const repository = new GuestAttemptRepository<SoapState>()
    const session = createSoapSession(repository)
    const started = await session.start()
    const actionId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' as UUID
    const parameters = { waterVolumeL: 100 }
    const units = { waterVolumeL: 'mL' }
    const first = await session.apply(started.attemptId, 'pour_water', parameters, units, { actionId, expectedRevision: 0 })
    expect(first).toMatchObject({ ok: true, state: { revision: 1 } })
    const replay = await session.apply(started.attemptId, 'pour_water', parameters, units, { actionId, expectedRevision: 0 })
    expect(replay).toMatchObject({ ok: true, feedback: { idempotentReplay: true }, state: { revision: 1 } })
    expect(await session.apply(started.attemptId, 'pour_water', { waterVolumeL: 200 }, units, { actionId })).toMatchObject({ ok: false, outcome: 'idempotency_conflict' })
    expect(await session.apply(started.attemptId, 'pour_water', parameters, units, { expectedRevision: 0 })).toMatchObject({ ok: false, outcome: 'revision_conflict' })
    expect(await repository.getAttemptEvents(started.attemptId)).toHaveLength(1)
    const loaded = await createSoapSession(repository).load(started.attemptId)
    expect(loaded).toMatchObject({ ok: true, state: { projection: { samples: [], vessels: expect.arrayContaining([expect.objectContaining({ id: 'W', waterG: 100 })]) } } })
  })

  it('restores measured samples and the completed report from browser storage', async () => {
    const repository = new GuestAttemptRepository<SoapState>()
    const session = createSoapSession(repository)
    const started = await session.start()
    const apply: typeof session.apply = async (...args) => {
      const result = await session.apply(...args)
      expect(result.ok).toBe(true)
      return result
    }
    await apply(started.attemptId, 'pour_water', { waterVolumeL: 175 }, { waterVolumeL: 'mL' })
    await apply(started.attemptId, 'pour_naoh', { naohMassG: 64.6 }, { naohMassG: 'g' })
    await apply(started.attemptId, 'cool_lye')
    await apply(started.attemptId, 'pour_oil', { oilVolumeL: 549.45 }, { oilVolumeL: 'mL' })
    await apply(started.attemptId, 'pour_to_mix', { from: 'W', volumeL: 205.33 }, { volumeL: 'mL' })
    await apply(started.attemptId, 'pour_to_mix', { from: 'O', volumeL: 549.45 }, { volumeL: 'mL' })
    await apply(started.attemptId, 'stir', { mode: 'machine' })
    for (const action of ['advance_trace', 'pour_to_mold', 'advance_gel', 'unmold', 'advance_cure', 'measure_sample']) {
      await apply(started.attemptId, action)
    }
    const complete = await session.complete(started.attemptId)
    expect(complete).toMatchObject({ ok: true, state: { status: 'completed' }, report: { grade: 'pass' } })
    if (!complete.ok) throw new Error('Completion failed')
    expect(complete.report.projection.samples[0]?.soap.ph).toBeCloseTo(9.4, 1)
    expect(complete.report.projection.samples[0]?.soap.massG).toBeCloseTo(606.6, 0)
    expect(await createSoapSession(new GuestAttemptRepository<SoapState>()).load(started.attemptId)).toEqual({ ok: true, state: complete.state })
  })
})
