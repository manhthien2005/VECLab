import type {
  AttemptStatus,
  ResourceDelta,
  ScenarioKey,
  UUID,
} from '@/domain/process/contracts.js'
import type { StoredEvent } from '@/domain/process/lifecycle.js'
import type {
  AppendActionInput,
  Attempt,
  AttemptFilter,
  AttemptRepository,
  AttemptSummary,
  CompleteAttemptInput,
  CreateAttemptInput,
  EventPayload,
  StoredAttemptEventRecord,
  WriteResult,
} from './repository.js'
import { unsupportedRelease } from '@/shared/errors/domain-errors.js'

/**
 * Guest storage: IndexedDB (docs/system-architecture.md §10.1).
 *
 * IndexedDB rather than localStorage because the guest chain grows to hundreds of
 * events per attempt, each carrying a full state payload, calculation trace and
 * observations. §10.1 is explicit that localStorage should hold only small flags or a
 * fallback, never a long history — and localStorage's synchronous string
 * serialization would block the main thread on every commit.
 *
 * Client-only. This module must never be imported from a Server Component: it touches
 * `indexedDB`, which does not exist on the server.
 *
 * GUARDS MIRROR THE RPC, IN THE RPC'S ORDER. `commit_attempt_event` checks ownership,
 * then `(attempt_id, action_id)` idempotency, then status, then revision, then undo
 * provenance, then the event ceiling, and only then derives the sequence from the
 * locked row. Doing it in any other order would make guest and cloud disagree about
 * WHICH refusal a learner sees for the same action — and the workbench renders a
 * different message per outcome.
 *
 * CONCURRENCY. Two browser tabs share one database, so the race that exists between
 * two devices exists between two tabs. Every write re-reads the attempt inside a
 * `readwrite` transaction and compares `expectedRevision`, which IndexedDB serializes
 * per store — the same guarantee the RPC gets from `SELECT ... FOR UPDATE`.
 */

const DB_NAME = 'veclab'
const DB_VERSION = 1
const ATTEMPTS_STORE = 'attempts'
const EVENTS_STORE = 'events'

/**
 * Hard ceiling on events per attempt, mirroring `veclab_max_attempt_events()`.
 *
 * A platform limit (docs/system-architecture.md §17), not a scenario one, so it is
 * declared here rather than imported from the acid constants even though both are 500
 * today.
 */
const MAX_ATTEMPT_EVENTS = 500

/** Stored attempt row. Mirrors `public.attempts` field for field. */
type AttemptRecord<State> = {
  attemptId: UUID
  scenarioKey: ScenarioKey
  scenarioReleaseId: string
  contentLocale: string
  status: AttemptStatus
  revision: number
  lastSequence: number
  /** Bare domain state — see the repository module header for why not an envelope. */
  initialState: State
  currentState: State
  currentProjection: unknown
  projectionVersion: number
  finalReportSnapshot: unknown
  createdAt: Date
  updatedAt: Date
  completedAt: Date | null
}

/** Stored event row. Mirrors `public.attempt_events`. */
type EventRecord<State> = {
  attemptId: UUID
  sequence: number
  actionId: UUID
  requestFingerprint: string
  eventKind: 'domain_action' | 'undo_last' | 'lifecycle'
  actionType: string
  inputPayload: unknown
  normalizedInput: Record<string, number | string | boolean>
  resultPayload: unknown
  calculationTrace: unknown[]
  observations: unknown[]
  warnings: unknown[]
  resourceDelta: ResourceDelta
  stateBeforeHash: string
  stateAfter: State
  stateAfterHash: string
  undoOfSequence: number | null
  occurredAt: Date
}

/**
 * The per-kind fields a write carries.
 *
 * A discriminated union rather than optional members on the payload: an append must
 * not carry a report snapshot, and a completion must not carry undo provenance. With
 * optional fields both mistakes type-check and fail silently at runtime; the union
 * makes each impossible to express.
 */
type WriteDetail =
  | {
      kind: 'append'
      eventKind: 'domain_action' | 'undo_last' | 'lifecycle'
      actionType: string
      undoOfSequence: number | null
    }
  | { kind: 'complete'; finalReportSnapshot: unknown }

let dbPromise: Promise<IDBDatabase> | null = null

/**
 * Open (and if needed create) the guest database.
 *
 * The promise is cached so a session opens one connection; the browser closes it with
 * the tab.
 */
function openDatabase(): Promise<IDBDatabase> {
  if (dbPromise !== null) return dbPromise

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(
        new Error(
          'IndexedDB is unavailable, so guest attempts cannot be stored on this device',
        ),
      )
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const database = request.result

      if (!database.objectStoreNames.contains(ATTEMPTS_STORE)) {
        // attemptId is the key; the lab list sorts by updatedAt, so index it.
        const attempts = database.createObjectStore(ATTEMPTS_STORE, {
          keyPath: 'attemptId',
        })
        attempts.createIndex('byUpdatedAt', 'updatedAt')
      }

      if (!database.objectStoreNames.contains(EVENTS_STORE)) {
        // [attemptId, sequence] is the unique key, matching the Postgres
        // `unique (attempt_id, sequence)` constraint.
        const events = database.createObjectStore(EVENTS_STORE, {
          keyPath: ['attemptId', 'sequence'],
        })
        // Idempotency lookups find an event by action, not by position.
        events.createIndex('byAction', ['attemptId', 'actionId'])
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Cannot open guest database'))
    request.onblocked = () => {
      reject(new Error('Guest database upgrade is blocked by another open tab'))
    }
  })

  return dbPromise
}

/** Lift an IDBRequest into a promise. */
function request<T>(idbRequest: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    idbRequest.onsuccess = () => resolve(idbRequest.result)
    idbRequest.onerror = () =>
      reject(idbRequest.error ?? new Error('IndexedDB request failed'))
  })
}

/** Resolve when a transaction commits; reject on abort. */
function committed(transaction: IDBTransaction): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () =>
      reject(transaction.error ?? new Error('IndexedDB transaction failed'))
    transaction.onabort = () =>
      reject(transaction.error ?? new Error('IndexedDB transaction aborted'))
  })
}

/**
 * Abort a transaction and swallow the resulting error.
 *
 * Called on every early return, because leaving a `readwrite` transaction open holds
 * the store lock until the microtask queue drains. The abort itself raises
 * `transaction.error`, which is expected here rather than a failure.
 */
function abort(transaction: IDBTransaction): Promise<void> {
  return new Promise<void>((resolve) => {
    transaction.onabort = () => resolve()
    transaction.onerror = () => resolve()
    transaction.oncomplete = () => resolve()
    try {
      transaction.abort()
    } catch {
      // Already finished; nothing left to abort.
      resolve()
    }
  })
}

function toAttempt<State>(record: AttemptRecord<State>): Attempt<State> {
  // Record and public shapes are identical; the copy keeps the record type private so
  // callers cannot depend on storage internals.
  return { ...record }
}

/**
 * Guest attempt repository.
 *
 * Generic in `State`; each scenario constructs one bound to its own state type.
 */
export class GuestAttemptRepository<State> implements AttemptRepository<State> {
  readonly storageMode = 'local' as const

  async getAttempt(id: UUID): Promise<Attempt<State> | null> {
    const database = await openDatabase()
    const store = database
      .transaction(ATTEMPTS_STORE, 'readonly')
      .objectStore(ATTEMPTS_STORE)

    const record = await request(
      store.get(id) as IDBRequest<AttemptRecord<State> | undefined>,
    )
    return record === undefined ? null : toAttempt(record)
  }

  async createAttempt(input: CreateAttemptInput<State>): Promise<Attempt<State>> {
    const database = await openDatabase()
    const now = new Date()

    const record: AttemptRecord<State> = {
      attemptId: input.attemptId,
      scenarioKey: input.scenarioKey,
      scenarioReleaseId: input.scenarioReleaseId,
      contentLocale: input.contentLocale,
      status: 'in_progress',
      // Fresh attempt: revision 0, no events yet (§14.1). current_state equals
      // initial_state until the first commit.
      revision: 0,
      lastSequence: 0,
      initialState: input.initialState,
      currentState: input.initialState,
      currentProjection: input.initialProjection,
      projectionVersion: input.projectionVersion,
      finalReportSnapshot: null,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
    }

    const transaction = database.transaction(ATTEMPTS_STORE, 'readwrite')
    const store = transaction.objectStore(ATTEMPTS_STORE)

    // `add` rather than `put`: re-creating an existing attempt would silently discard
    // its event history. A collision is a caller bug and must fail loudly.
    await request(store.add(record))
    await committed(transaction)

    return toAttempt(record)
  }

  appendAction(input: AppendActionInput<State>): Promise<WriteResult<State>> {
    return this.write(input, {
      kind: 'append',
      eventKind: input.eventKind,
      actionType: input.actionType,
      undoOfSequence: input.undoOfSequence,
    })
  }

  completeAttempt(input: CompleteAttemptInput<State>): Promise<WriteResult<State>> {
    // Event kind and action type are HARDCODED, mirroring `complete_attempt`, which
    // takes neither as a parameter and passes 'lifecycle'/'completed' to
    // `commit_attempt_event` itself. A caller therefore cannot complete an attempt
    // while recording some other event.
    return this.write(input, {
      kind: 'complete',
      finalReportSnapshot: input.finalReportSnapshot,
    })
  }


  /**
   * The one write path, shared by ordinary appends and terminal completion.
   *
   * Shared because the two differ only in what they do to the attempt ROW after the
   * event is stored: completion additionally flips status, stamps `completed_at` and
   * writes the immutable report snapshot. Every guard before that point is identical,
   * and duplicating them is how the two would drift — a completion that skipped the
   * revision check would let one tab silently overwrite another's work.
   *
   * The per-kind fields arrive as a discriminated union rather than as optional
   * members of the payload, so the compiler rejects a completion that carries undo
   * provenance and an append that carries a report snapshot. Both would otherwise be
   * type-correct and silently wrong.
   */
  private async write(
    input: EventPayload<State>,
    detail: WriteDetail,
  ): Promise<WriteResult<State>> {
    const database = await openDatabase()

    const transaction = database.transaction(
      [ATTEMPTS_STORE, EVENTS_STORE],
      'readwrite',
    )
    const attempts = transaction.objectStore(ATTEMPTS_STORE)
    const events = transaction.objectStore(EVENTS_STORE)

    try {
      const attempt = await request(
        attempts.get(input.attemptId) as IDBRequest<AttemptRecord<State> | undefined>,
      )

      if (attempt === undefined) {
        await abort(transaction)
        return { ok: false, outcome: 'not_found' }
      }

      // Exact release re-check, in the same position the RPC puts it: after
      // `not_found`, before idempotency, status and revision
      // (20260909000600_commit_event_rpc.sql). An attempt never mixes releases (§12,
      // §21.2).
      //
      // This one matters MORE in guest mode than in cloud. IndexedDB survives a deploy,
      // so a learner who returns after a release bump is holding an attempt written by
      // the OLD engine while `input.scenarioReleaseId` names the NEW one this bundle
      // builds. Without the check, the new engine would be applied to state it was never
      // calibrated against, and every later hash and score would be computed on a
      // mixture of two models — exactly the corruption §21.2 exists to prevent.
      //
      // Checked before idempotency deliberately: a retry of an action that succeeded
      // under the old release must NOT be replayed as success, because replaying it
      // would render that event with the new projector.
      if (attempt.scenarioReleaseId !== input.scenarioReleaseId) {
        await abort(transaction)
        // The same refusal the cloud adapter produces for `release_mismatch`, so the
        // workbench's single switch reads identically in both storage modes.
        return {
          ok: false,
          outcome: 'error',
          error: unsupportedRelease(attempt.scenarioReleaseId),
        }
      }
      // Idempotency FIRST, before status and revision (§12.1): a retry of an action
      // that already succeeded must return success even though the attempt has since
      // moved on — possibly to `completed`, which the status guard below would
      // otherwise refuse.
      const existing = await request(
        events.index('byAction').get([input.attemptId, input.actionId]) as IDBRequest<
          EventRecord<State> | undefined
        >,
      )

      if (existing !== undefined) {
        await abort(transaction)

        if (existing.requestFingerprint === input.requestFingerprint) {
          return { ok: true, attempt: toAttempt(attempt), outcome: 'idempotent_replay' }
        }

        // Same action id, different payload: never create a second event (§12.1).
        return {
          ok: false,
          outcome: 'idempotency_conflict',
          existingSequence: existing.sequence,
        }
      }

      // Completed and stopped attempts accept no further write (§4.2). The report
      // snapshot is immutable once written (§22 inv. 10), so there is no path that
      // reopens a finished attempt — branching is a NEW attempt instead.
      if (attempt.status !== 'in_progress') {
        await abort(transaction)
        return { ok: false, outcome: 'not_in_progress', status: attempt.status }
      }

      // Optimistic concurrency (§13): another tab or device committed since this
      // action was computed. Nothing was wrong with the action, only its position in
      // the chain, so report the newer revision and let the UI reload (§6.5).
      if (attempt.revision !== input.expectedRevision) {
        await abort(transaction)
        return {
          ok: false,
          outcome: 'revision_conflict',
          currentRevision: attempt.revision,
        }
      }

      // Undo provenance (§14.2, §7.3). Mirrors the RPC's checks, which exist so a
      // caller gets a precise reason instead of a constraint name from the table check
      // backing them. Completion is not examined: the `complete` detail has no undo
      // field, so it cannot carry provenance at all.
      if (detail.kind === 'append') {
        const undoOfSequence = detail.undoOfSequence
        const isUndo = detail.eventKind === 'undo_last'

        if (
          (isUndo &&
            (undoOfSequence === null || undoOfSequence >= attempt.lastSequence + 1)) ||
          (!isUndo && undoOfSequence !== null)
        ) {
          await abort(transaction)
          return { ok: false, outcome: 'undo_invalid', undoOfSequence }
        }
      }

      if (attempt.lastSequence >= MAX_ATTEMPT_EVENTS) {
        await abort(transaction)
        return { ok: false, outcome: 'event_ceiling', maxEvents: MAX_ATTEMPT_EVENTS }
      }

      // Sequence is DERIVED from the stored row, never taken from the caller (§22
      // invariants 1 and 5). The caller computed the same number to run the domain;
      // if the two ever disagreed, the revision check above has already refused.
      const sequence = attempt.lastSequence + 1

      const eventRecord: EventRecord<State> = {
        attemptId: input.attemptId,
        sequence,
        actionId: input.actionId,
        requestFingerprint: input.requestFingerprint,
        eventKind: detail.kind === 'complete' ? 'lifecycle' : detail.eventKind,
        actionType: detail.kind === 'complete' ? 'completed' : detail.actionType,
        inputPayload: input.inputPayload,
        normalizedInput: input.normalizedInput,
        resultPayload: input.resultPayload,
        calculationTrace: input.calculationTrace,
        observations: input.observations,
        warnings: input.warnings,
        resourceDelta: input.resourceDelta as ResourceDelta,
        stateBeforeHash: input.stateBeforeHash,
        stateAfter: input.stateAfter,
        stateAfterHash: input.stateAfterHash,
        undoOfSequence: detail.kind === 'complete' ? null : detail.undoOfSequence,
        occurredAt: input.occurredAt,
      }

      await request(events.add(eventRecord))

      const updated: AttemptRecord<State> = {
        ...attempt,
        revision: attempt.revision + 1,
        lastSequence: sequence,
        // §22 invariant 2: current_state becomes exactly the event's state_after.
        currentState: input.stateAfter,
        currentProjection: input.nextProjection,
        // projectionVersion is inherited unchanged: it is fixed by the release
        // manifest, and letting a write carry its own would allow two projector
        // versions inside one event chain (§22 invariant 11).
        updatedAt: new Date(),
        status: detail.kind === 'complete' ? 'completed' : attempt.status,
        completedAt: detail.kind === 'complete' ? input.occurredAt : attempt.completedAt,
        finalReportSnapshot:
          detail.kind === 'complete'
            ? detail.finalReportSnapshot
            : attempt.finalReportSnapshot,
      }

      await request(attempts.put(updated))
      await committed(transaction)

      return { ok: true, attempt: toAttempt(updated), outcome: 'committed' }
    } catch (error) {
      await abort(transaction)
      throw error
    }
  }

  async listAttempts(filter: AttemptFilter = {}): Promise<AttemptSummary[]> {
    const database = await openDatabase()
    const store = database
      .transaction(ATTEMPTS_STORE, 'readonly')
      .objectStore(ATTEMPTS_STORE)

    const records = await request(store.getAll() as IDBRequest<AttemptRecord<State>[]>)

    const matching = records.filter((record) => {
      if (filter.scenarioKey !== undefined && record.scenarioKey !== filter.scenarioKey) {
        return false
      }
      if (filter.status !== undefined && record.status !== filter.status) return false
      return true
    })

    // Newest first, matching `attempts_user_updated_idx`.
    matching.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())

    const limited = filter.limit !== undefined ? matching.slice(0, filter.limit) : matching

    // No state payloads in the summary: a learner may have dozens of attempts and the
    // lab list renders only the projection (§18).
    return limited.map((record) => ({
      attemptId: record.attemptId,
      scenarioKey: record.scenarioKey,
      scenarioReleaseId: record.scenarioReleaseId,
      status: record.status,
      revision: record.revision,
      lastSequence: record.lastSequence,
      currentProjection: record.currentProjection,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      completedAt: record.completedAt,
    }))
  }

  async deleteAttempt(id: UUID): Promise<void> {
    const database = await openDatabase()

    const transaction = database.transaction(
      [ATTEMPTS_STORE, EVENTS_STORE],
      'readwrite',
    )
    const attempts = transaction.objectStore(ATTEMPTS_STORE)
    const events = transaction.objectStore(EVENTS_STORE)

    try {
      // Cascade manually: IndexedDB has no foreign keys, and the Postgres schema
      // cascades event deletes with the attempt.
      const keys = await request(
        events.getAllKeys(
          IDBKeyRange.bound([id, 0], [id, Number.MAX_SAFE_INTEGER]),
        ) as IDBRequest<IDBValidKey[]>,
      )

      for (const key of keys) {
        await request(events.delete(key))
      }

      await request(attempts.delete(id))
      await committed(transaction)
    } catch (error) {
      await abort(transaction)
      throw error
    }
  }

  async getAttemptEvents(id: UUID): Promise<readonly StoredEvent<State>[]> {
    const records = await this.readEventRecords(id)

    // Only the fields replay needs. `undoOfSequence` is not optional here: replay
    // folds every stored event, so without it an undone action's delta would still be
    // counted and the rebuilt ledger would disagree with the state beside it. The rest
    // of each event stays in the store for `getAttemptEventRecords`, which the timeline
    // and the report read.
    return records.map((record) => ({
      sequence: record.sequence,
      actionType: record.actionType,
      undoOfSequence: record.undoOfSequence,
      stateAfter: record.stateAfter,
      stateAfterHash: record.stateAfterHash,
      resourceDelta: record.resourceDelta,
    }))
  }

  async getAttemptEventRecords(
    id: UUID,
  ): Promise<readonly StoredAttemptEventRecord<State>[]> {
    const records = await this.readEventRecords(id)

    // Every stored field is already on the record, so this widens the type rather than
    // re-reading: the store keeps the full event precisely so the report can show
    // observations and traces without a second query.
    return records.map((record) => ({
      sequence: record.sequence,
      actionType: record.actionType,
      undoOfSequence: record.undoOfSequence,
      stateAfter: record.stateAfter,
      stateAfterHash: record.stateAfterHash,
      resourceDelta: record.resourceDelta,
      actionId: record.actionId,
      requestFingerprint: record.requestFingerprint,
      eventKind: record.eventKind,
      inputPayload: record.inputPayload,
      normalizedInput: record.normalizedInput,
      resultPayload: record.resultPayload,
      calculationTrace: record.calculationTrace,
      observations: record.observations,
      warnings: record.warnings,
      occurredAt: record.occurredAt,
    }))
  }

  /**
   * Fetch one attempt's event rows in sequence order.
   *
   * Shared by both readers because both need the same bound on the compound key:
   * `[attemptId, sequence]` ranging over this attempt's whole sequence space returns its
   * events already ordered, which is what replay requires and what a timeline renders.
   */
  private async readEventRecords(id: UUID): Promise<EventRecord<State>[]> {
    const database = await openDatabase()
    const store = database
      .transaction(EVENTS_STORE, 'readonly')
      .objectStore(EVENTS_STORE)

    return request(
      store.getAll(
        IDBKeyRange.bound([id, 0], [id, Number.MAX_SAFE_INTEGER]),
      ) as IDBRequest<EventRecord<State>[]>,
    )
  }
}
