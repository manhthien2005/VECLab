import type {
  AttemptStatus,
  DomainError,
  ScenarioKey,
  UUID,
} from '@/domain/process/contracts.js'
import type { StoredEvent } from '@/domain/process/lifecycle.js'

/**
 * Storage-mode abstraction (docs/system-architecture.md §10.1).
 *
 * Guest mode runs the exact release engine IN THE BROWSER and persists to IndexedDB;
 * cloud mode runs the same engine on the server and persists through the attempt
 * RPCs. The domain, the workbench UI and the report renderer are shared, so this
 * interface is what varies.
 *
 * THE SHAPE MIRRORS THE RPC. `Attempt` carries the bare domain state, not an
 * envelope, because that is what `attempts.current_state` stores: the RPC writes
 * `current_state = p_state_after` from the single parameter it also inserts into
 * `attempt_events.state_after` (migrations/20260909000600, §22 invariant 2), and
 * `replayEvents` verifies `stateHash(event.stateAfter) === event.stateAfterHash`,
 * a hash the domain computes over the bare state.
 *
 * There is therefore no ledger column and no stored envelope. The ledger is
 * REBUILT by replaying the event chain and folding each `resourceDelta` — which is
 * why `getAttemptEvents` is part of this interface and why §18 accepts loading the
 * full chain when an attempt is opened. Ledger-derived numbers for list views come
 * from `currentProjection`, computed in the same commit (§22 invariant 11).
 *
 * Two more RPC behaviours are mirrored deliberately, because a UI that handles
 * "another device committed" must branch identically in guest and cloud mode:
 *
 *   * the SEQUENCE IS DERIVED from the stored row, never taken from the caller. The
 *     RPC computes `v_sequence := last_sequence + 1` "never from the payload"
 *     (§22 invariants 1 and 5), so there is no `sequence` input and no
 *     sequence-conflict outcome. The caller computes the same value to run the
 *     domain, and the revision check below is what detects divergence.
 *   * outcomes are named after the RPC's `outcome` field, so one switch handles both
 *     storage modes.
 */

/** What creating an attempt requires, identical in both storage modes. */
export type CreateAttemptInput<State> = {
  attemptId: UUID
  scenarioKey: ScenarioKey
  scenarioReleaseId: string
  contentLocale: string
  /** Bare domain state at sequence 0; stored verbatim as the immutable baseline. */
  initialState: State
  /** Projector output for that state, so a list view can render without replay. */
  initialProjection: unknown
  projectionVersion: number
}

/** An attempt as read back, reduced to what the UI and the commit path need. */
export type Attempt<State> = {
  attemptId: UUID
  scenarioKey: ScenarioKey
  scenarioReleaseId: string
  contentLocale: string
  status: AttemptStatus
  /** Optimistic concurrency token; the store decides whether it is current. */
  revision: number
  lastSequence: number
  initialState: State
  /** Equals `state_after` of the newest event (§22 invariant 2). */
  currentState: State
  /** Projector output for `currentState`; carries ledger-derived summaries. */
  currentProjection: unknown
  projectionVersion: number
  /**
   * Immutable report data, null until the attempt completes.
   *
   * Mandatory at completion (§4.2) and never overwritten afterwards (§22 inv. 10),
   * so the report page renders a frozen object: re-releasing the scenario cannot
   * retroactively change what a learner already completed.
   */
  finalReportSnapshot: unknown
  createdAt: Date
  updatedAt: Date
  completedAt: Date | null
}

/** List view: no state payloads, because a learner may have many attempts (§18). */
export type AttemptSummary = {
  attemptId: UUID
  scenarioKey: ScenarioKey
  scenarioReleaseId: string
  status: AttemptStatus
  revision: number
  lastSequence: number
  /** Projector output, so the lab list shows pH/cost without loading any state. */
  currentProjection: unknown
  createdAt: Date
  updatedAt: Date
  completedAt: Date | null
}

/**
 * The event payload both write kinds share, field-for-field with the parameters of
 * `commit_attempt_event`.
 *
 * Extracted as a base so an ordinary append and a terminal completion differ by
 * exactly the fields that must differ, and a store can narrow one to the other
 * without an `as`.
 *
 * Three RPC parameters are absent, deliberately:
 *
 *   * `sequence` — both stores DERIVE it from the stored row, never from the caller
 *     (§22 invariants 1 and 5). The caller computes the same number to run the domain,
 *     and the revision check is what detects divergence.
 *   * `projection_version` — the RPC accepts one, but a caller-supplied version would
 *     let a single chain mix two projectors, which §22 invariant 11 forbids. Both
 *     stores keep the attempt's existing value.
 *   * the actor id — only the cloud path has one, and the BFF supplies it from the
 *     verified session rather than from this object.
 */
export type EventPayload<State> = {
  attemptId: UUID
  /**
   * The release whose engine produced this event, as an ASSERTION.
   *
   * Not read back from the attempt row: `commit_attempt_event` compares this against the
   * stored `scenario_release_id` and refuses a mismatch (§21.2), so passing the stored
   * value would make that check vacuous — the same reason `runCommand` takes
   * `currentRevision` separately instead of deriving it. The session passes the release
   * it actually resolved its module from, which is what catches an attempt created under
   * a different release being driven by the wrong engine.
   */
  scenarioReleaseId: string
  /**
   * Revision the caller read. Compared against the stored revision so a device that
   * committed meanwhile rejects this write instead of silently overwriting it
   * (web scope §6.5).
   */
  expectedRevision: number
  actionId: UUID
  requestFingerprint: string
  inputPayload: unknown
  normalizedInput: Record<string, number | string | boolean>
  resultPayload: unknown
  calculationTrace: unknown[]
  observations: unknown[]
  warnings: unknown[]
  resourceDelta: unknown
  stateBeforeHash: string
  stateAfter: State
  stateAfterHash: string
  occurredAt: Date
  /** Projection rebuilt by the caller for `stateAfter`, in the same commit. */
  nextProjection: unknown
}

export type AppendActionInput<State> = EventPayload<State> & {
  eventKind: 'domain_action' | 'undo_last' | 'lifecycle'
  actionType: string
  /** Set for `undo_last`; null otherwise. The store enforces it precedes this event. */
  undoOfSequence: number | null
}

/**
 * Result of a write.
 *
 * Named after the RPC's `outcome` values so a single switch handles both storage
 * modes. The interesting cases:
 *
 *   * `revision_conflict` — another device or tab committed first. Nothing was wrong
 *     with the action, only its position in the chain, so the write did NOT happen
 *     and the caller must reload and tell the learner to retry with a NEW action id
 *     (web scope §6.5).
 *   * `idempotent_replay` — a retry of an action already stored under the same
 *     fingerprint. Returns success without writing twice (§12.1).
 *   * `idempotency_conflict` — the same `action_id` arrived with a DIFFERENT
 *     payload. A second event is never created (§12.1); this is a client bug or a
 *     replayed-but-mutated request, and must not be silently accepted.
 */
export type WriteResult<State> =
  | { ok: true; attempt: Attempt<State>; outcome: 'committed' | 'idempotent_replay' }
  | { ok: false; outcome: 'idempotency_conflict'; existingSequence: number }
  | { ok: false; outcome: 'revision_conflict'; currentRevision: number }
  | { ok: false; outcome: 'not_in_progress'; status: AttemptStatus }
  | { ok: false; outcome: 'event_ceiling'; maxEvents: number }
  | { ok: false; outcome: 'undo_invalid'; undoOfSequence: number | null }
  | { ok: false; outcome: 'not_found' }
  | { ok: false; outcome: 'error'; error: DomainError }

/**
 * Terminal completion: append the `lifecycle`/`completed` event, flip status and
 * write the immutable report snapshot IN ONE WRITE.
 *
 * A separate method rather than a flag on `appendAction`, because the cloud path is a
 * separate RPC (`complete_attempt`) with invariants no ordinary append has: the
 * snapshot is mandatory, status may only move from `in_progress`, and no later write
 * may replace the snapshot (§4.2, §6.5, §22 inv. 6 and 10). A shared append would let
 * an ordinary action carry a snapshot, or a completion be persisted without one —
 * exactly the half-completed state the database guards exist to prevent.
 */
export type CompleteAttemptInput<State> = Omit<
  AppendActionInput<State>,
  'eventKind' | 'undoOfSequence' | 'actionType'
> & {
  /** Mandatory: an attempt may not reach `completed` without a report (§4.2). */
  finalReportSnapshot: unknown
}


/**
 * A stored event with everything a learner-facing surface renders.
 *
 * Distinct from `StoredEvent`, which carries only the four fields replay needs
 * (sequence, actionType, stateAfter/Hash, resourceDelta). The workbench timeline and
 * the report both need the rest — what was observed, what was calculated, when it
 * happened, and what an undo reverted — so widening the replay type would make every
 * replay carry payload it deliberately ignores.
 *
 * `observations`, `warnings` and `calculationTrace` are `unknown[]` here, as stored:
 * the store is a jsonb column with no schema, so narrowing to the domain types is the
 * caller's job at the point it renders, not something the repository can assert.
 */
export type StoredAttemptEventRecord<State> = StoredEvent<State> & {
  actionId: UUID
  requestFingerprint: string
  eventKind: 'domain_action' | 'undo_last' | 'lifecycle'
  inputPayload: unknown
  normalizedInput: Record<string, number | string | boolean>
  resultPayload: unknown
  calculationTrace: unknown[]
  observations: unknown[]
  warnings: unknown[]
  occurredAt: Date
}

/** Which attempts to list. */
export type AttemptFilter = {
  scenarioKey?: ScenarioKey
  status?: AttemptStatus
  /** Highest number of summaries to return, newest first. */
  limit?: number
}

/**
 * The storage seam.
 *
 * `getAttemptEvents` exists so resume and guest-import rebuild state AND LEDGER by
 * replay rather than by trusting a cached snapshot (§11): the events are the source
 * of truth, and a snapshot can be stale or from another device.
 */
export interface AttemptRepository<State> {
  getAttempt(id: UUID): Promise<Attempt<State> | null>
  createAttempt(input: CreateAttemptInput<State>): Promise<Attempt<State>>
  appendAction(input: AppendActionInput<State>): Promise<WriteResult<State>>
  /** Terminal completion: event + status flip + immutable report snapshot. */
  completeAttempt(input: CompleteAttemptInput<State>): Promise<WriteResult<State>>
  listAttempts(filter: AttemptFilter): Promise<AttemptSummary[]>
  deleteAttempt(id: UUID): Promise<void>
  /**
   * Full event records in sequence order, for the timeline and the report.
   *
   * Separate from `getAttemptEvents` on purpose: that method returns only what replay
   * needs, and the surfaces that render a learner's history need observations, traces and
   * timestamps too. One method returning a wide record would make every replay pay for
   * payload it discards; two methods make each caller's intent explicit.
   */
  getAttemptEventRecords(id: UUID): Promise<readonly StoredAttemptEventRecord<State>[]>
  /** Full chain in sequence order, oldest first, for replay. */
  getAttemptEvents(id: UUID): Promise<readonly StoredEvent<State>[]>
  /** Where the learner's data lives, so the UI can say so honestly. */
  readonly storageMode: 'local' | 'cloud'
}
