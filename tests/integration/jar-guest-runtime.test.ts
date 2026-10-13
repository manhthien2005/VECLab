import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import type { SimulationAction, UUID } from '@/domain/process/contracts.js'
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
    expect(after.projection.cups[0]?.measuredRemovalPercent).toBeCloseTo(86.79, 8)
    expect(after.report).toBeNull()
    expect(JSON.stringify(after)).not.toContain('arithmeticCorrect')
    expect(JSON.stringify(after)).not.toContain('reference')
    expect(JSON.stringify(after)).not.toContain('goalMet')
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
