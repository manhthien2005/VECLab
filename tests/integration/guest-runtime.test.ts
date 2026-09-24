import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import type { UUID } from '@/domain/process/contracts.js'
import { ACID_RELEASE_ID } from '@/domain/experiments/acid-neutralization/index.js'
import type { AcidNeutralizationState } from '@/domain/experiments/acid-neutralization/index.js'
import { GuestAttemptRepository } from '@/application/attempts/guest-repository.js'
import {
  createAcidSession,
  type AcidSessionState,
} from '@/application/simulation/acid-session.js'
import { newUUID, parseUUID } from '@/shared/ids.js'

/**
 * Guest runtime: IndexedDB store plus the session that drives it.
 *
 * This is the path a learner uses without an account, and it is the path that must
 * survive a page reload, a second tab and an interrupted request. The store carries
 * concurrency and idempotency rules that mirror `commit_attempt_event`; if they are
 * wrong the failure is silent — a dose counted twice, or one tab's work overwritten by
 * another — so it is tested here rather than left to the e2e suite.
 *
 * `fake-indexeddb` supplies the real IndexedDB API in Node, so these tests exercise the
 * adapter's transaction, key-range and index logic rather than a mock of it.
 */

function repository(): GuestAttemptRepository<AcidNeutralizationState> {
  return new GuestAttemptRepository<AcidNeutralizationState>()
}

function session(): ReturnType<typeof createAcidSession> {
  return createAcidSession(repository())
}

/** Dose each aliquot with the mix/wait/measure cycle a decision reading requires. */
async function dose(
  active: ReturnType<typeof createAcidSession>,
  attemptId: UUID,
  aliquotsMl: number[],
): Promise<AcidSessionState> {
  let state: AcidSessionState | null = null

  for (const ml of aliquotsMl) {
    for (const [actionType, parameters] of [
      ['add_base', { volumeL: ml / 1000 }],
      ['mix', {}],
      ['wait_for_stable_reading', {}],
      ['measure_ph', {}],
    ] as Array<[string, Record<string, number>]>) {
      const result = await active.apply(attemptId, actionType, parameters)
      if (!result.ok) throw new Error(`${actionType} refused: ${JSON.stringify(result)}`)
      state = result.state
    }
  }

  if (state === null) throw new Error('dose called with an empty aliquot list')
  return state
}

async function startRun(active: ReturnType<typeof createAcidSession>, route = 'naoh') {
  const started = await active.start()
  await active.apply(started.attemptId, 'select_route', { route })
  const calibrated = await active.apply(started.attemptId, 'calibrate_meter')
  if (!calibrated.ok) throw new Error('calibrate_meter refused')
  return calibrated.state
}

describe('guest attempt lifecycle', () => {
  let active: ReturnType<typeof createAcidSession>

  beforeEach(async () => {
    active = session()
    await resetGuestStore(active)
  })

  it('starts an attempt at sequence 0 with a neutral ledger', async () => {
    const started = await active.start()

    expect(started.releaseId).toBe(ACID_RELEASE_ID)
    expect(started.storageMode).toBe('local')
    expect(started.lastSequence).toBe(0)
    expect(started.revision).toBe(0)
    expect(started.status).toBe('in_progress')
    expect(started.domain.route).toBeNull()
    expect(started.projection.phStar).toBeNull()
    // A fresh run has spent nothing, and "nothing yet" is null rather than 0 (§10.1).
    expect(started.projection.overallScore).toBeNull()
    expect(started.ledger.operationCount).toBe(0)
  })

  it('persists each accepted action as its own event in sequence', async () => {
    const state = await startRun(active)
    const events = await repository().getAttemptEvents(state.attemptId)

    expect(events.map((event) => event.actionType)).toEqual([
      'select_route',
      'calibrate_meter',
    ])
    expect(events.map((event) => event.sequence)).toEqual([1, 2])
  })

  it('rebuilds the ledger by replay after a reload', async () => {
    const state = await startRun(active)
    const dosed = await dose(active, state.attemptId, [1.0, 1.0, 0.5])

    // A fresh session, as if the learner closed the tab and came back: nothing is
    // carried over in memory, so the ledger must come from the stored chain.
    const resumed = await session().load(state.attemptId)
    expect(resumed).not.toBeNull()
    if (resumed === null || !resumed.ok) throw new Error('load failed')

    expect(resumed.state.lastSequence).toBe(dosed.lastSequence)
    expect(resumed.state.revision).toBe(dosed.revision)
    // The point of replay: reagents and operation count must match the run that
    // produced them, not start from zero.
    expect(resumed.state.ledger.reagents).toEqual(dosed.ledger.reagents)
    expect(resumed.state.ledger.operationCount).toBe(dosed.ledger.operationCount)
    expect(resumed.state.projection.phStar).toBe(dosed.projection.phStar)
  })

  it('refuses to replay a chain whose last event does not match the attempt', async () => {
    const state = await startRun(active)
    await active.apply(state.attemptId, 'mix')

    const stored = await repository().getAttempt(state.attemptId)
    expect(stored).not.toBeNull()
    if (stored === null) throw new Error('attempt vanished')

    // Simulate a corrupt local store: an event was lost, so the chain no longer ends
    // where the attempt says it does. Trusting it would pair a rebuilt ledger with a
    // state it was never derived from.
    const corrupt = { ...stored, lastSequence: stored.lastSequence + 5 }
    const database = await openGuestDatabaseForTest()
    await putAttemptForTest(database, corrupt)

    const result = await active.load(state.attemptId)
    expect(result).not.toBeNull()
    if (result === null) throw new Error('load returned null')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('STATE_HASH_MISMATCH')
  })

  it('lists attempts newest first with projections and no state payloads', async () => {
    const first = await startRun(active)
    const second = await startRun(active)

    const summaries = await active.list()
    expect(summaries.length).toBe(2)
    expect(summaries[0]!.attemptId).toBe(second.attemptId)
    expect(summaries[1]!.attemptId).toBe(first.attemptId)
    // The list must be renderable without loading any attempt.
    expect(summaries[0]).not.toHaveProperty('currentState')
    expect(summaries[0]!.currentProjection).not.toBeNull()
  })

  it('deletes an attempt together with its events', async () => {
    const state = await startRun(active)
    await repository().deleteAttempt(state.attemptId)

    expect(await repository().getAttempt(state.attemptId)).toBeNull()
    expect(await repository().getAttemptEvents(state.attemptId)).toEqual([])
  })
})

describe('guest concurrency and idempotency', () => {
  let active: ReturnType<typeof createAcidSession>

  beforeEach(async () => {
    active = session()
    await resetGuestStore(active)
  })

  it('refuses a write whose expected revision is stale', async () => {
    const state = await startRun(active)

    // Two tabs read the same revision; the first write wins.
    const tabA = await repository().getAttempt(state.attemptId)
    const tabB = await repository().getAttempt(state.attemptId)
    expect(tabA).not.toBeNull()
    expect(tabB).not.toBeNull()
    if (tabA === null || tabB === null) throw new Error('attempt vanished')

    const first = await repository().appendAction({
      attemptId: state.attemptId,
      scenarioReleaseId: ACID_RELEASE_ID,
      expectedRevision: tabA.revision,
      actionId: newUUID(),
      requestFingerprint: 'fp-a',
      eventKind: 'domain_action',
      actionType: 'mix',
      inputPayload: {},
      normalizedInput: {},
      resultPayload: {},
      calculationTrace: [],
      observations: [],
      warnings: [],
      resourceDelta: neutralDelta(),
      stateBeforeHash: 'before',
      stateAfter: tabA.currentState,
      stateAfterHash: 'after-a',
      undoOfSequence: null,
      occurredAt: new Date(),
      nextProjection: tabA.currentProjection,
    })
    expect(first.ok).toBe(true)

    // The second tab still holds the old revision: nothing is written, and it is told
    // the current revision so the UI can reload (web scope §6.5).
    const second = await repository().appendAction({
      attemptId: state.attemptId,
      scenarioReleaseId: ACID_RELEASE_ID,
      expectedRevision: tabB.revision,
      actionId: newUUID(),
      requestFingerprint: 'fp-b',
      eventKind: 'domain_action',
      actionType: 'mix',
      inputPayload: {},
      normalizedInput: {},
      resultPayload: {},
      calculationTrace: [],
      observations: [],
      warnings: [],
      resourceDelta: neutralDelta(),
      stateBeforeHash: 'before',
      stateAfter: tabB.currentState,
      stateAfterHash: 'after-b',
      undoOfSequence: null,
      occurredAt: new Date(),
      nextProjection: tabB.currentProjection,
    })

    expect(second.ok).toBe(false)
    if (second.ok) throw new Error('stale write was accepted')
    expect(second.outcome).toBe('revision_conflict')
    if (second.outcome !== 'revision_conflict') return
    expect(second.currentRevision).toBe(tabA.revision + 1)

    // The refused write must not have advanced the chain.
    const events = await repository().getAttemptEvents(state.attemptId)
    expect(events.filter((event) => event.actionType === 'mix')).toHaveLength(1)
  })

  it('replays an identical retry instead of writing a second event', async () => {
    const state = await startRun(active)
    const attempt = await repository().getAttempt(state.attemptId)
    if (attempt === null) throw new Error('attempt vanished')

    const actionId = newUUID()
    const payload = {
      attemptId: state.attemptId,
      scenarioReleaseId: ACID_RELEASE_ID,
      expectedRevision: attempt.revision,
      actionId,
      requestFingerprint: 'fp-retry',
      eventKind: 'domain_action' as const,
      actionType: 'mix',
      inputPayload: {},
      normalizedInput: {},
      resultPayload: {},
      calculationTrace: [],
      observations: [],
      warnings: [],
      resourceDelta: neutralDelta(),
      stateBeforeHash: 'before',
      stateAfter: attempt.currentState,
      stateAfterHash: 'after',
      undoOfSequence: null,
      occurredAt: new Date(),
      nextProjection: attempt.currentProjection,
    }

    const first = await repository().appendAction(payload)
    expect(first.ok).toBe(true)

    // A retry that lost its response: same action id, same fingerprint. The attempt has
    // since advanced, so the status and revision guards would refuse it — idempotency
    // is checked first precisely so this succeeds.
    const retry = await repository().appendAction(payload)
    expect(retry.ok).toBe(true)
    if (!retry.ok) throw new Error('retry refused')
    expect(retry.outcome).toBe('idempotent_replay')

    const events = await repository().getAttemptEvents(state.attemptId)
    expect(events.filter((event) => event.actionType === 'mix')).toHaveLength(1)
  })

  it('refuses a reused action id carrying a different payload', async () => {
    const state = await startRun(active)
    const attempt = await repository().getAttempt(state.attemptId)
    if (attempt === null) throw new Error('attempt vanished')

    const actionId = newUUID()
    const base = {
      attemptId: state.attemptId,
      scenarioReleaseId: ACID_RELEASE_ID,
      expectedRevision: attempt.revision,
      actionId,
      eventKind: 'domain_action' as const,
      actionType: 'mix',
      inputPayload: {},
      normalizedInput: {},
      resultPayload: {},
      calculationTrace: [],
      observations: [],
      warnings: [],
      resourceDelta: neutralDelta(),
      stateBeforeHash: 'before',
      stateAfter: attempt.currentState,
      stateAfterHash: 'after',
      undoOfSequence: null,
      occurredAt: new Date(),
      nextProjection: attempt.currentProjection,
    }

    await repository().appendAction({ ...base, requestFingerprint: 'fp-1' })

    // Same id, different fingerprint: a second event must never be created (§12.1).
    const conflict = await repository().appendAction({
      ...base,
      requestFingerprint: 'fp-2',
    })

    expect(conflict.ok).toBe(false)
    if (conflict.ok) throw new Error('conflicting payload was accepted')
    expect(conflict.outcome).toBe('idempotency_conflict')
  })

  it('an undo leaves the ledger matching the reverted state', async () => {
    const started = await active.start()
    const id = started.attemptId

    // select_route is the ONLY action content marks undoable, so this is the one
    // position from which undo can succeed: dosing first would leave measure_ph last,
    // which is irreversible (§14.2 forbids undoing across that boundary).
    const routed = await active.apply(id, 'select_route', { route: 'naoh' })
    expect(routed.ok).toBe(true)
    if (!routed.ok) throw new Error('select_route refused')
    expect(routed.state.domain.route).toBe('naoh')
    expect(routed.state.ledger.operationCount).toBe(1)

    const undone = await active.undo(id)
    expect(undone.ok).toBe(true)
    if (!undone.ok) throw new Error(`undo refused: ${JSON.stringify(undone)}`)

    const reloaded = await session().load(id)
    if (reloaded === null || !reloaded.ok) throw new Error('load after undo failed')

    // The undo is a NEW event, so the chain grew even though the state went back.
    expect(reloaded.state.lastSequence).toBe(routed.state.lastSequence + 1)
    expect(reloaded.state.domain.route).toBeNull()
    // Replaying prefix + undo must not double-count: the reverted operation is gone.
    expect(reloaded.state.ledger.operationCount).toBe(0)
  })

  it('refuses to undo an action the scenario marks irreversible', async () => {
    const state = await startRun(active)
    await dose(active, state.attemptId, [1.0])

    // calibrate_meter is followed by dosing, so the last action is measure_ph, which
    // content does not mark undoable — chemistry cannot be un-mixed (§5.1).
    const events = await repository().getAttemptEvents(state.attemptId)
    expect(events[events.length - 1]!.actionType).toBe('measure_ph')

    const refused = await active.undo(state.attemptId)
    expect(refused.ok).toBe(false)
    if (refused.ok) throw new Error('irreversible action was undone')
    if ('error' in refused) expect(refused.error.code).toBe('ACTION_NOT_UNDOABLE')
  })

  it('refuses a write that asserts a release other than the attempt', async () => {
    const state = await startRun(active)
    const attempt = await repository().getAttempt(state.attemptId)
    if (attempt === null) throw new Error('attempt vanished')
    // Captured BEFORE the refused write, so the length comparison below is a real
    // before/after and not a value compared against itself.
    const eventsBefore = await repository().getAttemptEvents(state.attemptId)

    const foreign = 'acid-neutralization@9.9.9'
    const actionId = newUUID()

    const payload = {
      attemptId: state.attemptId,
      // The assertion the guard compares against. Everything else is a well-formed
      // payload for this attempt, so a refusal can only come from the release check:
      // revision, status and sequence all still agree.
      scenarioReleaseId: foreign,
      expectedRevision: attempt.revision,
      actionId,
      requestFingerprint: 'fp-foreign-release',
      eventKind: 'domain_action' as const,
      actionType: 'mix',
      inputPayload: {},
      normalizedInput: {},
      resultPayload: {},
      calculationTrace: [],
      observations: [],
      warnings: [],
      resourceDelta: neutralDelta(),
      stateBeforeHash: 'h-before',
      // Required on every append: §7.3 forbids a non-undo event carrying provenance, and
      // omitting the field entirely reads as `undefined`, which the guard rejects as
      // `undo_invalid`. The existing payloads above set it explicitly for this reason.
      undoOfSequence: null,
      stateAfter: attempt.currentState,
      stateAfterHash: 'h-after',
      occurredAt: new Date(),
      nextProjection: attempt.currentProjection,
    }

    const refused = await repository().appendAction(payload)
    expect(refused.ok).toBe(false)
    if (refused.ok) throw new Error('foreign release was committed')
    // The same refusal the cloud path produces for `release_mismatch`, so the workbench
    // branches once across storage modes.
    if (!('error' in refused)) throw new Error('refusal carried no error')
    expect(refused.error.code).toBe('UNSUPPORTED_SCENARIO_RELEASE')
    expect(refused.error.category).toBe('unsupported_release')

    // Nothing was written: the chain still ends where it did, and the attempt's own
    // release is untouched. A refusal that mutated the row would be worse than none.
    expect(await repository().getAttemptEvents(state.attemptId)).toHaveLength(
      eventsBefore.length,
    )
    const after = await repository().getAttempt(state.attemptId)
    expect(after?.scenarioReleaseId).toBe(ACID_RELEASE_ID)
    expect(after?.revision).toBe(attempt.revision)

    // The check runs BEFORE idempotency, mirroring the RPC's order. Committing the same
    // action id under the attempt's real release must succeed — proving the refusal above
    // came from the release, not from a duplicate id.
    const accepted = await repository().appendAction({
      ...payload,
      scenarioReleaseId: ACID_RELEASE_ID,
    })
    expect(accepted.ok).toBe(true)
    expect(accepted.ok && accepted.outcome).toBe('committed')
  })

  it('does not replay a stored event when the asserted release differs', async () => {
    const state = await startRun(active)
    const attempt = await repository().getAttempt(state.attemptId)
    if (attempt === null) throw new Error('attempt vanished')

    const actionId = newUUID()
    const payload = {
      attemptId: state.attemptId,
      scenarioReleaseId: ACID_RELEASE_ID,
      expectedRevision: attempt.revision,
      actionId,
      requestFingerprint: 'fp-replay-release',
      eventKind: 'domain_action' as const,
      actionType: 'mix',
      inputPayload: {},
      normalizedInput: {},
      resultPayload: {},
      calculationTrace: [],
      observations: [],
      warnings: [],
      resourceDelta: neutralDelta(),
      stateBeforeHash: 'h-before',
      undoOfSequence: null,
      stateAfter: attempt.currentState,
      stateAfterHash: 'h-after',
      occurredAt: new Date(),
      nextProjection: attempt.currentProjection,
    }

    const before = await repository().getAttemptEventRecords(state.attemptId)

    const first = await repository().appendAction(payload)
    expect(first.ok).toBe(true)

    const afterCommit = await repository().getAttemptEventRecords(state.attemptId)
    expect(afterCommit).toHaveLength(before.length + 1)
    // `startRun` has already committed several events, so the appended one is the LAST,
    // not the first. Asserting its identity is what proves the refusal below appended a
    // second event rather than merely leaving the chain at the same length.
    expect(afterCommit[afterCommit.length - 1]?.actionId).toBe(actionId)

    // Same action id and same fingerprint, which idempotency alone would answer with
    // `idempotent_replay`. It must NOT: replaying would render an event written by the
    // old release through the new projector, which is the mixture §21.2 forbids. This is
    // why the release check precedes idempotency rather than following it.
    const replayed = await repository().appendAction({
      ...payload,
      scenarioReleaseId: 'acid-neutralization@9.9.9',
    })
    expect(replayed.ok).toBe(false)
    if (replayed.ok) throw new Error('foreign release was replayed as success')
    if (!('error' in replayed)) throw new Error('refusal carried no error')
    expect(replayed.error.code).toBe('UNSUPPORTED_SCENARIO_RELEASE')

    // Unchanged by the refusal: same length, and still the same last event.
    const afterRefusal = await repository().getAttemptEventRecords(state.attemptId)
    expect(afterRefusal).toHaveLength(afterCommit.length)
    expect(afterRefusal[afterRefusal.length - 1]?.actionId).toBe(actionId)
  })
})

describe('guest completion', () => {
  let active: ReturnType<typeof createAcidSession>

  beforeEach(async () => {
    active = session()
    await resetGuestStore(active)
  })

  it('completes with a report snapshot and counts each penalty once', async () => {
    const state = await startRun(active)
    // AN-G08: 27.50 mL base then 2.50 mL correction HCl. Safety must be 85 — the
    // excess-base penalty does NOT fire at exactly 1.1 x E*, and correction does.
    await dose(active, state.attemptId, [5.0, 5.0, 5.0, 5.0, 5.0, 1.0, 1.0, 0.5])
    for (const ml of [1.0, 1.0, 0.5]) {
      await active.apply(state.attemptId, 'add_correction_acid', { volumeL: ml / 1000 })
      await active.apply(state.attemptId, 'mix')
      await active.apply(state.attemptId, 'wait_for_stable_reading')
      await active.apply(state.attemptId, 'measure_ph')
    }

    const completed = await active.complete(state.attemptId)
    expect(completed.ok).toBe(true)
    if (!completed.ok) throw new Error(`complete refused: ${JSON.stringify(completed)}`)

    expect(completed.report.projection.safetyPenaltyCodes).toEqual([
      'CORRECTION_ACID_USED',
    ])
    // A double-counted penalty would make this 70 instead of 85.
    expect(completed.report.projection.safetyIndex).toBe(85)
    expect(completed.report.projection.relativeCostIndex).toBeCloseTo(1.2, 6)
    expect(completed.state.status).toBe('completed')
    expect(completed.state.finalReportSnapshot).not.toBeNull()

    const stored = await repository().getAttempt(state.attemptId)
    if (stored === null) throw new Error('attempt vanished after completion')
    expect(stored.status).toBe('completed')
    expect(stored.completedAt).not.toBeNull()
    expect(stored.finalReportSnapshot).not.toBeNull()
  })

  it('records completion as one lifecycle event', async () => {
    const state = await startRun(active)
    await dose(active, state.attemptId, [1.0, 1.0, 0.5])

    const completed = await active.complete(state.attemptId)
    if (!completed.ok) throw new Error('complete refused')

    const events = await repository().getAttemptEvents(state.attemptId)
    const lifecycle = events.filter((event) => event.actionType === 'completed')
    expect(lifecycle).toHaveLength(1)
  })

  it('refuses any further write to a completed attempt', async () => {
    const state = await startRun(active)
    await dose(active, state.attemptId, [1.0, 1.0, 0.5])
    const completed = await active.complete(state.attemptId)
    if (!completed.ok) throw new Error('complete refused')

    // The DOMAIN refuses first: `complete` set phase to 'completed', so any further
    // action fails its own precondition before the store's status guard is reached.
    // The store guard is the backstop for a write that bypasses the engine.
    const further = await active.apply(state.attemptId, 'mix')
    expect(further.ok).toBe(false)
    if (further.ok) throw new Error('completed attempt accepted an action')
    if ('error' in further) expect(further.error.code).toBe('ATTEMPT_COMPLETED')
  })

  it('refuses to complete twice', async () => {
    const state = await startRun(active)
    await dose(active, state.attemptId, [1.0, 1.0, 0.5])

    const first = await active.complete(state.attemptId)
    expect(first.ok).toBe(true)

    const second = await active.complete(state.attemptId)
    expect(second.ok).toBe(false)
  })

  it('refuses to complete a run whose reading no longer describes the sample', async () => {
    const state = await startRun(active)
    await dose(active, state.attemptId, [1.0, 1.0])
    // Add base without re-measuring. §5.2 atomically INVALIDATES the reading —
    // lastMeasuredPH becomes null and the sample is unmixed again — so the refusal is
    // READING_NOT_STABLE, the earlier of validateComplete's checks. STALE_MEASUREMENT
    // is reserved for a reading that survived but predates the current composition.
    await active.apply(state.attemptId, 'add_base', { volumeL: 0.00005 })

    const refused = await active.complete(state.attemptId)
    expect(refused.ok).toBe(false)
    if (refused.ok) throw new Error('completed on an invalidated reading')
    if ('error' in refused) expect(refused.error.code).toBe('READING_NOT_STABLE')
  })
})

describe('uuid helpers', () => {
  it('accepts a v4 id and rejects malformed input', () => {
    expect(parseUUID(newUUID())).not.toBeNull()
    expect(parseUUID('not-a-uuid')).toBeNull()
    expect(parseUUID(null)).toBeNull()
    expect(parseUUID(undefined)).toBeNull()
  })
})

function neutralDelta() {
  return {
    reagents: {},
    waterLiters: 0,
    operationCount: 0,
    relativeCostIndexDelta: null,
    safetyPenalties: [],
    secondaryWaste: {},
  }
}

/**
 * Empty the guest store between tests.
 *
 * `fake-indexeddb` keeps the database alive for the whole file, so attempts created by
 * one test would otherwise be visible to the next. Deleting through the public API
 * rather than dropping the database keeps the adapter's own event cascade under test.
 */
async function resetGuestStore(
  active: ReturnType<typeof createAcidSession>,
): Promise<void> {
  for (const summary of await active.list()) {
    await repository().deleteAttempt(summary.attemptId)
  }
}

/**
 * Direct database access for the corruption test.
 *
 * Reaches past the repository on purpose: that test needs a row the repository would
 * never write, and the only honest way to get one is to write it directly.
 */
async function openGuestDatabaseForTest(): Promise<IDBDatabase> {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('veclab', 1)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function putAttemptForTest(
  database: IDBDatabase,
  record: unknown,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction('attempts', 'readwrite')
    transaction.objectStore('attempts').put(record)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}
