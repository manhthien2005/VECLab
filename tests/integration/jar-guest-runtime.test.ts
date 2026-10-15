import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import type { SimulationAction, UUID } from '@/domain/process/contracts.js'
import type { StoredEvent } from '@/domain/process/lifecycle.js'
import type { AttemptRepository } from '@/application/attempts/repository.js'
import { GuestAttemptRepository } from '@/application/attempts/guest-repository.js'
import { createAcidSession } from '@/application/simulation/acid-session.js'
import type { AcidNeutralizationState } from '@/domain/experiments/acid-neutralization/state.js'
import { JAR_PROFILE, createInitialJarState, type JarState } from '@/domain/experiments/jar-test/model.js'
import { createJarSession, type JarSession } from '@/application/simulation/jar-session.js'
import { newUUID } from '@/shared/ids.js'

function repository() {
  return new GuestAttemptRepository<JarState>()
}
function session(): JarSession {
  return createJarSession(repository())
}
type Parameters = SimulationAction['parameters']

/**
 * Deterministic read hooks over the real IndexedDB adapter. A second session
 * commits while this session is between two public repository reads. No fake
 * mutable state or mocking of replay/commit behavior.
 */
function interleavedRepository(hooks: {
  afterGetAttempt?: (id: UUID) => Promise<void>
  beforeGetEventRecords?: (id: UUID) => Promise<void>
  afterAppendAction?: (id: UUID) => Promise<void>
  alterEvents?: (events: readonly StoredEvent<JarState>[]) => readonly StoredEvent<JarState>[]
}): AttemptRepository<JarState> {
  const underlying = repository()
  return {
    storageMode: underlying.storageMode,
    async getAttempt(id) {
      const snapshot = await underlying.getAttempt(id)
      await hooks.afterGetAttempt?.(id)
      return snapshot
    },
    createAttempt: (input) => underlying.createAttempt(input),
    async appendAction(input) {
      const written = await underlying.appendAction(input)
      if (written.ok && written.outcome === 'committed') {
        await hooks.afterAppendAction?.(input.attemptId)
      }
      return written
    },
    completeAttempt: (input) => underlying.completeAttempt(input),
    listAttempts: (filter) => underlying.listAttempts(filter),
    deleteAttempt: (id) => underlying.deleteAttempt(id),
    async getAttemptEvents(id) {
      const stored = await underlying.getAttemptEvents(id)
      return hooks.alterEvents?.(stored) ?? stored
    },
    async getAttemptEventRecords(id) {
      await hooks.beforeGetEventRecords?.(id)
      return underlying.getAttemptEventRecords(id)
    },
  }
}

async function step(
  active: JarSession,
  id: UUID,
  actionType: string,
  parameters: Parameters = {},
  commit: { actionId?: UUID; expectedRevision?: number } = {},
) {
  const result = await active.apply(id, actionType, parameters, {}, commit)
  if (!result.ok) throw new Error(actionType + ' refused: ' + JSON.stringify(result))
  return result.state
}

async function prepare(active: JarSession, id: UUID) {
  await step(active, id, 'prepare_cup', { cupId: 'A', initialPh: 9 })
  await step(active, id, 'prepare_cup', { cupId: 'B', initialPh: 5 })
  await step(active, id, 'measure_initial')
  await step(active, id, 'add_coagulant', { cupId: 'A', incrementMgL: 150 })
  await step(active, id, 'add_coagulant', { cupId: 'B', incrementMgL: 150 })
}

async function finish(active: JarSession, id: UUID) {
  await step(active, id, 'run_phase', { phase: 'rapid' })
  await step(active, id, 'run_phase', { phase: 'slow' })
  await step(active, id, 'run_phase', { phase: 'settling' })
  await step(active, id, 'measure_final', { cupId: 'A' })
  await step(active, id, 'measure_final', { cupId: 'B' })
  await step(active, id, 'record_result', { cupId: 'A', removalPercent: 86.79 })
  await step(active, id, 'select_result', { cupId: 'A' })
}

async function clearJar() {
  for (const row of await repository().listAttempts({ scenarioKey: 'jar-test' })) {
    await repository().deleteAttempt(row.attemptId)
  }
}

function comparableReport(report: import('@/application/scenarios/jar-projection.js').JarReportSnapshot) {
  return {
    versions: report.versions,
    reference: report.reference,
    projection: report.projection,
    goalStatus: report.goalStatus,
    resources: report.resources,
    initialMeasurement: report.initialMeasurement && {
      ...report.initialMeasurement, actionId: '<stored>',
    },
    cups: report.cups.map((cup) => ({
      ...cup,
      measurements: cup.measurements.map((m) => ({ ...m, actionId: '<stored>' })),
    })),
    diagnostics: report.diagnostics.map((d) => ({
      ...d, actionIds: d.actionIds.map(() => '<stored>'),
    })),
  }
}

describe('Jar Task 2 guest session through IndexedDB', () => {
  beforeEach(clearJar)

  it('resume_matches_uninterrupted including measurements, resources and frozen report', async () => {
    const always = session()
    const a = await always.start()
    await prepare(always, a.attemptId)
    await finish(always, a.attemptId)
    const continuous = await always.complete(a.attemptId)
    if (!continuous.ok) throw new Error('continuous completion refused')

    const interrupted = session()
    const b = await interrupted.start()
    await step(interrupted, b.attemptId, 'prepare_cup', { cupId: 'A', initialPh: 9 })
    await step(interrupted, b.attemptId, 'prepare_cup', { cupId: 'B', initialPh: 5 })
    await step(interrupted, b.attemptId, 'measure_initial')

    // New adapter/session to model a tab reload; no in-memory context transferred.
    const resumed = session()
    const reopened = await resumed.load(b.attemptId)
    expect(reopened?.ok).toBe(true)
    if (reopened === null || !reopened.ok) throw new Error('resume refused')
    expect(reopened.state.projection.initialMeasurement?.valueNtu).toBe(125)
    await step(resumed, b.attemptId, 'add_coagulant', { cupId: 'A', incrementMgL: 150 })
    await step(resumed, b.attemptId, 'add_coagulant', { cupId: 'B', incrementMgL: 150 })
    await finish(resumed, b.attemptId)
    const resumedCompletion = await resumed.complete(b.attemptId)
    if (!resumedCompletion.ok) throw new Error('resumed completion refused')

    expect(resumedCompletion.state.projection).toEqual(continuous.state.projection)
    expect(comparableReport(resumedCompletion.report)).toEqual(comparableReport(continuous.report))
    const reloaded = await session().load(b.attemptId)
    expect(reloaded?.ok).toBe(true)
    if (!reloaded || !reloaded.ok) throw new Error('reload after completion refused')
    expect(reloaded.state.report).toEqual(resumedCompletion.report)
    expect(reloaded.state.status).toBe('completed')
    expect(resumedCompletion.report.resources.reagents.alum?.amount).toBeCloseTo(0.15, 12)
    expect(resumedCompletion.report.resources.waterLiters).toBe(1)
    const stored = await repository().getAttempt(b.attemptId)
    expect(stored?.status).toBe('completed')
    expect(stored?.finalReportSnapshot).toEqual(resumedCompletion.report)
    expect(stored?.currentState.phase).toBe('completed')
    const events = await repository().getAttemptEventRecords(b.attemptId)
    expect(events.filter((e) => e.actionType === 'completed')).toHaveLength(1)
    expect(events[events.length - 1]?.sequence).toBe(stored?.lastSequence)
  })

  it('retry_does_not_double_dose after state advances or completes; changed intent conflicts', async () => {
    const active = session()
    const start = await active.start()
    const id = start.attemptId
    await step(active, id, 'prepare_cup', { cupId: 'A', initialPh: 9 })
    await step(active, id, 'measure_initial')
    const actionId = newUUID()
    const earlierRevision = 2
    await step(active, id, 'add_coagulant', { cupId: 'A', incrementMgL: 50 }, {
      actionId, expectedRevision: earlierRevision,
    })
    await step(active, id, 'add_coagulant', { cupId: 'A', incrementMgL: 100 })
    const retry = await session().apply(id, 'add_coagulant',
      { cupId: 'A', incrementMgL: 50 }, {}, { actionId, expectedRevision: earlierRevision })
    expect(retry.ok).toBe(true)
    if (!retry.ok) throw new Error('retry refused')
    expect(retry.feedback.idempotentReplay).toBe(true)
    expect(retry.state.projection.cups[0]?.doseMgL).toBe(150)

    const altered = await active.apply(id, 'add_coagulant',
      { cupId: 'A', incrementMgL: 100 }, {}, { actionId })
    expect(altered).toMatchObject({ ok: false, outcome: 'idempotency_conflict' })
    const stale = await active.apply(id, 'measure_final', { cupId: 'A' }, {},
      { actionId: newUUID(), expectedRevision: earlierRevision })
    expect(stale).toMatchObject({ ok: false, outcome: 'revision_conflict' })
    const eventsBefore = await repository().getAttemptEventRecords(id)
    expect(eventsBefore.filter((e) => e.actionId === actionId)).toHaveLength(1)

    const completionId = newUUID()
    const finished = await active.complete(id, { actionId: completionId })
    if (!finished.ok) throw new Error('complete refused')
    const afterFinish = await session().apply(id, 'add_coagulant',
      { cupId: 'A', incrementMgL: 50 }, {}, { actionId, expectedRevision: earlierRevision })
    expect(afterFinish.ok).toBe(true)
    if (!afterFinish.ok) throw new Error('completed retry refused')
    expect(afterFinish.feedback.idempotentReplay).toBe(true)
    expect(afterFinish.state.status).toBe('completed')

    const completedAgain = await session().complete(id, {
      actionId: completionId, expectedRevision: 0,
    })
    expect(completedAgain.ok).toBe(true)
    if (!completedAgain.ok) throw new Error('completion retry refused')
    expect(completedAgain.idempotentReplay).toBe(true)
    expect(completedAgain.report).toEqual(finished.report)

    const eventsAfter = await repository().getAttemptEventRecords(id)
    expect(eventsAfter).toHaveLength(eventsBefore.length + 1)
    expect(eventsAfter.filter((e) => e.actionId === actionId)).toHaveLength(1)
    expect(eventsAfter.filter((e) => e.actionType === 'completed')).toHaveLength(1)
    expect((await repository().getAttempt(id))?.currentState.cups.A?.totalDoseMgL).toBe(150)
  })

  it('same action id from two tabs commits once and reports the stored sequence', async () => {
    const first = session()
    const second = session()
    const attempt = await first.start()
    const actionId = newUUID()
    const results = await Promise.all([
      first.apply(attempt.attemptId, 'prepare_cup', { cupId: 'A', initialPh: 7 }, {},
        { actionId, expectedRevision: 0 }),
      second.apply(attempt.attemptId, 'prepare_cup', { cupId: 'A', initialPh: 7 }, {},
        { actionId, expectedRevision: 0 }),
    ])
    const sequences: number[] = []
    const replays: boolean[] = []
    for (const result of results) {
      expect(result.ok).toBe(true)
      if (!result.ok) throw new Error('Concurrent identical action was refused')
      sequences.push(result.feedback.sequence)
      replays.push(result.feedback.idempotentReplay)
    }
    expect(sequences).toEqual([1, 1])
    expect(replays.filter(Boolean)).toHaveLength(1)
    const events = await repository().getAttemptEventRecords(attempt.attemptId)
    expect(events).toHaveLength(1)
    expect(events[0]?.actionId).toBe(actionId)
    expect(events[0]?.sequence).toBe(1)
    expect((await repository().getAttempt(attempt.attemptId))?.revision).toBe(1)
  })

  it('load reconciles a newer event chain observed after an older attempt snapshot', async () => {
    const other = session()
    const started = await other.start()
    await step(other, started.attemptId, 'prepare_cup', { cupId: 'A', initialPh: 7 })
    await step(other, started.attemptId, 'measure_initial')
    let reads = 0
    const racing = createJarSession(interleavedRepository({
      async afterGetAttempt(id) {
        reads += 1
        if (reads === 1) {
          await step(other, id, 'add_coagulant', { cupId: 'A', incrementMgL: 50 })
        }
      },
    }))
    const loaded = await racing.load(started.attemptId)
    if (!loaded || !loaded.ok) throw new Error('valid interleaved load refused')
    expect(reads).toBe(2)
    expect(loaded.state.revision).toBe(3)
    expect(loaded.state.projection.cups[0]?.doseMgL).toBe(50)
    expect(loaded.state.projection.initialMeasurement?.valueNtu).toBe(125)
    expect(loaded.state.lastSequence).toBe(3)
  })

  it('read-after-write reconciles another tab committing between attempt and events reads', async () => {
    const other = session()
    let armed = false
    let injected = false
    const racing = createJarSession(interleavedRepository({
      async afterAppendAction() { armed = true },
      async afterGetAttempt(id) {
        if (armed && !injected) {
          injected = true
          await step(other, id, 'measure_initial')
        }
      },
    }))
    const started = await racing.start()
    const result = await racing.apply(started.attemptId, 'prepare_cup',
      { cupId: 'A', initialPh: 7 })
    if (!result.ok) throw new Error('read-after-write refused')
    expect(injected).toBe(true)
    expect(result.state.revision).toBe(2)
    expect(result.state.lastSequence).toBe(2)
    expect(result.state.projection.initialMeasurement?.valueNtu).toBe(125)
    expect(result.feedback.sequence).toBe(1)
    expect((await repository().getAttempt(started.attemptId))?.revision).toBe(2)
  })

  it('duplicate apply discovered after initial load returns current revision, dose and event', async () => {
    const other = session()
    const started = await other.start()
    await step(other, started.attemptId, 'prepare_cup', { cupId: 'A', initialPh: 7 })
    await step(other, started.attemptId, 'measure_initial')
    const actionId = newUUID()
    let injected = false
    const racing = createJarSession(interleavedRepository({
      async beforeGetEventRecords(id) {
        if (!injected) {
          injected = true
          await step(other, id, 'add_coagulant', { cupId: 'A', incrementMgL: 50 },
            { actionId, expectedRevision: 2 })
        }
      },
    }))
    const reply = await racing.apply(started.attemptId, 'add_coagulant',
      { cupId: 'A', incrementMgL: 50 }, {}, { actionId, expectedRevision: 2 })
    if (!reply.ok) throw new Error('identical duplicate apply refused')
    expect(injected).toBe(true)
    expect(reply.feedback).toMatchObject({ sequence: 3, idempotentReplay: true })
    expect(reply.state.revision).toBe(3)
    expect(reply.state.projection.cups[0]?.doseMgL).toBe(50)
    const events = await repository().getAttemptEventRecords(started.attemptId)
    expect(events.filter((event) => event.actionId === actionId)).toHaveLength(1)
    expect((await repository().getAttempt(started.attemptId))?.currentState.cups.A?.totalDoseMgL)
      .toBe(50)
  })

  it('duplicate completion discovered after initial load returns stored immutable report', async () => {
    const other = session()
    const started = await other.start()
    await step(other, started.attemptId, 'prepare_cup', { cupId: 'A', initialPh: 9 })
    await step(other, started.attemptId, 'measure_initial')
    await step(other, started.attemptId, 'add_coagulant',
      { cupId: 'A', incrementMgL: 150 })
    const actionId = newUUID()
    let injected = false
    let storedReport: import('@/application/scenarios/jar-projection.js').JarReportSnapshot | null = null
    const racing = createJarSession(interleavedRepository({
      async beforeGetEventRecords(id) {
        if (!injected) {
          injected = true
          const done = await other.complete(id, { actionId, expectedRevision: 3 })
          if (!done.ok) throw new Error('concurrent completion refused')
          storedReport = done.report
        }
      },
    }))
    const result = await racing.complete(started.attemptId, {
      actionId, expectedRevision: 3,
    })
    if (!result.ok) throw new Error('identical completed retry refused')
    expect(injected).toBe(true)
    expect(result.idempotentReplay).toBe(true)
    expect(result.state.status).toBe('completed')
    expect(result.state.revision).toBe(4)
    expect(result.state.projection.cups[0]?.doseMgL).toBe(150)
    expect(result.report).toEqual(storedReport)
    expect(result.report.resources.reagents.alum?.amount).toBeCloseTo(0.075, 12)
    const events = await repository().getAttemptEventRecords(started.attemptId)
    expect(events.filter((event) => event.actionType === 'completed')).toHaveLength(1)
  })

  it('exhausted reads during continuous valid writes return conflict, not a tampering error', async () => {
    const other = session()
    const started = await other.start()
    await step(other, started.attemptId, 'prepare_cup', { cupId: 'A', initialPh: 7 })
    await step(other, started.attemptId, 'measure_initial')
    let reads = 0
    const racing = createJarSession(interleavedRepository({
      async afterGetAttempt(id) {
        reads += 1
        if (reads <= 4) {
          await step(other, id, 'add_coagulant', { cupId: 'A', incrementMgL: 50 })
        }
      },
    }))
    const reply = await racing.load(started.attemptId)
    expect(reply).toMatchObject({
      ok: false, error: { category: 'conflict', code: 'REVISION_CONFLICT' },
    })
    expect(reads).toBe(5)
    expect((await repository().getAttempt(started.attemptId))?.currentState.cups.A?.totalDoseMgL)
      .toBe(200)
  })

  it('bounds incoherent reads and still rejects genuinely tampered hashes', async () => {
    const valid = session()
    const started = await valid.start()
    await step(valid, started.attemptId, 'prepare_cup', { cupId: 'A', initialPh: 7 })
    let reads = 0
    const truncated = createJarSession(interleavedRepository({
      async afterGetAttempt() { reads += 1 },
      alterEvents: () => [],
    }))
    const inconsistent = await truncated.load(started.attemptId)
    expect(inconsistent).toMatchObject({
      ok: false, error: { code: 'STATE_HASH_MISMATCH' },
    })
    expect(reads).toBe(5) // Four pairs plus one final stability read.

    let hashReads = 0
    const corrupted = createJarSession(interleavedRepository({
      async afterGetAttempt() { hashReads += 1 },
      alterEvents: (events) => events.map((event) => ({
        ...event, stateAfterHash: 'tampered-hash',
      })),
    }))
    const invalid = await corrupted.load(started.attemptId)
    expect(invalid).toMatchObject({
      ok: false, error: { code: 'STATE_HASH_MISMATCH' },
    })
    expect(hashReads).toBe(1)
    expect((await repository().getAttempt(started.attemptId))?.revision).toBe(1)
  })

  it('wrong_release_is_not_cast_to_jar before projection, replay or writing', async () => {
    const acid = createAcidSession(new GuestAttemptRepository<AcidNeutralizationState>())
    const foreign = await acid.start()
    const jar = session()
    const refused = await jar.load(foreign.attemptId)
    expect(refused).toMatchObject({
      ok: false, error: { code: 'UNSUPPORTED_SCENARIO_RELEASE' },
    })
    const applyRefused = await jar.apply(foreign.attemptId, 'prepare_cup',
      { cupId: 'A', initialPh: 7 })
    expect(applyRefused).toMatchObject({
      ok: false, error: { code: 'UNSUPPORTED_SCENARIO_RELEASE' },
    })
    const storedAcid = await new GuestAttemptRepository<AcidNeutralizationState>()
      .getAttempt(foreign.attemptId)
    expect(storedAcid?.lastSequence).toBe(0)

    const id = newUUID()
    await repository().createAttempt({
      attemptId: id,
      scenarioKey: 'jar-test',
      scenarioReleaseId: 'jar-test@9.9.9',
      contentLocale: 'vi',
      initialState: createInitialJarState(),
      initialProjection: {},
      projectionVersion: 1,
    })
    const release = await jar.complete(id)
    expect(release).toMatchObject({
      ok: false, error: { code: 'UNSUPPORTED_SCENARIO_RELEASE' },
    })
    expect(await repository().getAttemptEvents(id)).toHaveLength(0)
    await repository().deleteAttempt(id)
    await new GuestAttemptRepository<AcidNeutralizationState>().deleteAttempt(foreign.attemptId)
  })

  it('hides future outcomes, correctness, reference and raw domain until completion', async () => {
    const active = session()
    const { attemptId } = await active.start()
    const start = await active.load(attemptId)
    if (!start || !start.ok) throw new Error('load failed')
    expect(start.state.report).toBeNull()
    expect(start.state.projection.initialMeasurement).toBeNull()
    expect(start.state.projection.cups).toEqual([])
    const before = JSON.stringify(start.state)
    expect(before).not.toContain('goalStatus')
    expect(before).not.toContain('sourceDoi')
    expect(before).not.toContain('modelSpecVersion')
    expect(before).not.toContain('currentState')
    expect(before).not.toContain('ledger')

    await step(active, attemptId, 'prepare_cup', { cupId: 'A', initialPh: 9 })
    await step(active, attemptId, 'measure_initial')
    await step(active, attemptId, 'add_coagulant', { cupId: 'A', incrementMgL: 150 })
    const early = await step(active, attemptId, 'measure_final', { cupId: 'A' })
    expect(early.projection.cups[0]?.measurements[0]?.valueNtu).toBeNull()
    expect(early.projection.cups[0]?.measurements[0]?.valid).toBe(false)
    expect(early.projection.cups[0]?.measuredRemovalPercent).toBeNull()
    await step(active, attemptId, 'run_phase', { phase: 'rapid' })
    await step(active, attemptId, 'run_phase', { phase: 'slow' })
    await step(active, attemptId, 'run_phase', { phase: 'settling' })
    const beforeRead = await active.load(attemptId)
    if (!beforeRead || !beforeRead.ok) throw new Error('load failed')
    expect(beforeRead.state.projection.cups[0]?.measurements[0]?.valueNtu).toBeNull()
    expect(beforeRead.state.projection.cups[0]?.measuredRemovalPercent).toBeNull()
    expect(beforeRead.state.report).toBeNull()
    const after = await step(active, attemptId, 'measure_final', { cupId: 'A' })
    expect(after.projection.cups[0]?.measurements[1]?.valueNtu).toBeCloseTo(16.5125, 8)
    expect(after.projection.cups[0]?.measuredRemovalPercent).toBeNull()
    expect(after.report).toBeNull()
    expect(JSON.stringify(after)).not.toContain('arithmeticCorrect')
    expect(JSON.stringify(after)).not.toContain('reference')
    expect(JSON.stringify(after)).not.toContain('goalMet')

    // Entering the learner's own calculation must not reveal the model answer.
    const submitted = await step(active, attemptId, 'record_result',
      { cupId: 'A', removalPercent: 86.79 })
    expect(submitted.projection.cups[0]?.submittedRemovalPercent).toBe(86.79)
    expect(submitted.projection.cups[0]?.measuredRemovalPercent).toBeNull()
    const reopened = await active.load(attemptId)
    if (reopened === null || !reopened.ok) throw new Error('reload refused')
    expect(reopened.state.projection.cups[0]?.measuredRemovalPercent).toBeNull()
    const completed = await active.complete(attemptId)
    if (!completed.ok) throw new Error('complete refused')
    expect(completed.report.cups[0]?.measuredRemovalPercent).toBeCloseTo(86.79, 8)
    expect(completed.state.projection.cups[0]?.measuredRemovalPercent).toBeCloseTo(86.79, 8)
  })

  it('report diagnostics cite persisted action IDs and preserve invalid/missing as null', async () => {
    const active = session()
    const { attemptId } = await active.start()
    await step(active, attemptId, 'prepare_cup', { cupId: 'A', initialPh: 9 })
    await step(active, attemptId, 'prepare_cup', { cupId: 'B', initialPh: 5 })
    await step(active, attemptId, 'measure_initial')
    await step(active, attemptId, 'add_coagulant', { cupId: 'A', incrementMgL: 150 })
    await step(active, attemptId, 'add_coagulant', { cupId: 'B', incrementMgL: 150 })
    await step(active, attemptId, 'measure_final', { cupId: 'B' }) // invalid
    await step(active, attemptId, 'run_phase', { phase: 'rapid' })
    await step(active, attemptId, 'run_phase', { phase: 'slow' })
    await step(active, attemptId, 'run_phase', { phase: 'settling' })
    await step(active, attemptId, 'measure_final', { cupId: 'A' })
    await step(active, attemptId, 'record_result', { cupId: 'A', removalPercent: 20 })
    await step(active, attemptId, 'select_result', { cupId: 'A' })
    const result = await active.complete(attemptId)
    if (!result.ok) throw new Error('complete refused')
    const report = result.report
    expect(report.versions.profileVersion).toBe(JAR_PROFILE.version)
    expect(report.reference.sourceDoi).toBe(JAR_PROFILE.sourceDoi)
    expect(report.cups.find((c) => c.id === 'A')?.arithmeticCorrect).toBe(false)
    expect(report.cups.find((c) => c.id === 'A')?.meetsTarget).toBe(true)
    expect(report.cups.find((c) => c.id === 'B')?.measuredRemovalPercent).toBeNull()
    expect(report.cups.find((c) => c.id === 'B')?.measurements[0]?.valueNtu).toBeNull()
    expect(report.goalStatus.goalMet).toBe(false)
    const saved = await repository().getAttemptEventRecords(attemptId)
    const ids = new Set(saved.map((e) => e.actionId))
    for (const diagnostic of report.diagnostics) {
      expect(diagnostic.actionIds.length).toBeGreaterThan(0)
      for (const id of diagnostic.actionIds) expect(ids.has(id)).toBe(true)
    }
    for (const cup of report.cups) {
      for (const m of cup.measurements) expect(ids.has(m.actionId)).toBe(true)
    }
    expect(report.diagnostics.map((d) => d.code)).toContain('INCORRECT_CALCULATION')
    expect(report.diagnostics.map((d) => d.code)).toContain('INVALID_FINAL_READING')
  })
})
