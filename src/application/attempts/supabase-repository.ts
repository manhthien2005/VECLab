import type { AttemptStatus, ScenarioKey, UUID } from '@/domain/process/contracts.js'
import { unsupportedRelease } from '@/shared/errors/domain-errors.js'
import { createSupabaseAdminClient } from '@/infrastructure/supabase/admin.js'
import type {
  AppendActionInput,
  Attempt,
  AttemptFilter,
  AttemptRepository,
  AttemptSummary,
  CompleteAttemptInput,
  CreateAttemptInput,
  StoredAttemptEventRecord,
  WriteResult,
} from '@/application/attempts/repository.js'
import type { StoredEvent } from '@/domain/process/lifecycle.js'
import { servedReleases } from '@/application/scenarios/registry.js'

/**
 * Server-side attempt store over the security-definer RPCs.
 *
 * The counterpart to `GuestAttemptRepository`, used only inside route handlers. It is
 * BOUND TO ONE VERIFIED USER: the service role bypasses RLS, so ownership cannot come
 * from `auth.uid()` — every RPC takes `p_actor_user_id` and checks it itself
 * (docs/data-and-state-model.md §12, supabase/migrations/20260909000400_grants.sql).
 * A handler constructs one per request from the session it authenticated, and the id is
 * therefore not a parameter the client can influence.
 *
 * It runs the engine nowhere. §9 puts that in the BFF handler, which calls
 * `createAcidSession(this)`; this class only translates between the session's typed
 * calls and the RPCs' jsonb. Keeping the split means the chemistry is written once and
 * executed server-side for accounts, exactly as §9 requires, while a guest still runs
 * the identical code in the browser (§10).
 */

/** An `attempts` row as `to_jsonb` returns it: raw snake_case columns. */
type AttemptRow = {
  id: string
  user_id: string
  scenario_key: string
  scenario_release_id: string
  content_locale: string
  status: AttemptStatus
  revision: number
  last_sequence: number
  initial_state: unknown
  current_state: unknown
  current_projection: unknown
  projection_version: number
  final_report_snapshot: unknown
  created_at: string
  updated_at: string
  completed_at: string | null
}

/** An `attempt_events` row as `to_jsonb` returns it. */
type EventRow = {
  id: string
  attempt_id: string
  action_id: string
  request_fingerprint: string
  sequence: number
  event_kind: 'domain_action' | 'undo_last' | 'lifecycle'
  action_type: string
  input_payload: unknown
  normalized_input: unknown
  result_payload: unknown
  calculation_trace: unknown
  observations: unknown
  warnings: unknown
  resource_delta: unknown
  state_before_hash: string
  state_after: unknown
  state_after_hash: string
  undo_of_sequence: number | null
  occurred_at: string
}

/** What `commit_attempt_event` returns. It does NOT return the row. */
type CommitOutcome =
  | { outcome: 'committed'; attemptId: string; eventId: string; sequence: number; revision: number }
  | { outcome: 'idempotent_replay'; attemptId: string; eventId: string; sequence: number; revision: number; event: EventRow }
  | { outcome: 'idempotency_conflict'; attemptId: string; existingEventId: string; existingSequence: number }
  | { outcome: 'revision_conflict'; attemptId: string; currentRevision: number }
  // Only the reasons `commit_attempt_event`/`complete_attempt` can produce. `forbidden`
  // also covers `attempt_id_conflict`, but solely from `create_attempt` and
  // `branch_attempt`, neither of which reaches this type — narrowing it means the
  // switch below is exhaustive and a new refusal reason cannot fall through unhandled.
  | {
      outcome: 'forbidden'
      reason: 'not_owner' | 'not_in_progress' | 'release_mismatch'
      attemptId: string
      /** Present for `release_mismatch`: what is stored versus what was asserted. */
      attemptReleaseId?: string
      requestedReleaseId?: string
      /** Present for `not_in_progress`: the status that blocked the write. */
      status?: AttemptStatus
    }
  | { outcome: 'not_found'; attemptId: string }

/** What `get_attempt` returns. */
type GetOutcome =
  | { outcome: 'found'; attempt: AttemptRow; events?: EventRow[] }
  | { outcome: 'not_found'; attemptId: string }

export class SupabaseAttemptRepository<State> implements AttemptRepository<State> {
  readonly storageMode = 'cloud' as const

  /**
   * The learner this repository may touch. From the verified session, never from a
   * request body: a client that could set it could read and write anyone's attempts,
   * because the service role does not apply RLS.
   */
  private readonly actorUserId: UUID

  constructor(actorUserId: UUID) {
    this.actorUserId = actorUserId
  }

  async getAttempt(id: UUID): Promise<Attempt<State> | null> {
    const found = await this.get(id, false)
    return found === null ? null : toAttempt(found.attempt)
  }

  async createAttempt(input: CreateAttemptInput<State>): Promise<Attempt<State>> {
    const { data, error } = await client().rpc('create_attempt', {
      p_attempt_id: input.attemptId,
      p_actor_user_id: this.actorUserId,
      p_scenario_key: input.scenarioKey,
      p_scenario_release_id: input.scenarioReleaseId,
      p_content_locale: input.contentLocale,
      p_initial_state: input.initialState,
      p_current_projection: input.initialProjection,
      p_projection_version: input.projectionVersion,
    })
    if (error !== null) throw rpcError('create_attempt', error)

    const outcome = data as { outcome: string; attempt?: AttemptRow }
    if (outcome.outcome === 'committed' && outcome.attempt !== undefined) {
      return toAttempt(outcome.attempt)
    }
    if (outcome.outcome === 'idempotent_replay' && outcome.attempt !== undefined) {
      // A retried create for the same attempt id. §6 makes creation idempotent on the
      // id, so returning the existing row is correct rather than an error: the learner's
      // refresh must resume their run, not report a collision.
      return toAttempt(outcome.attempt)
    }
    // `forbidden`/`attempt_id_conflict`: the id belongs to someone else. Not a
    // recoverable state — the handler generated the UUID, so this is a bug or an
    // attempted takeover, and both should surface loudly rather than become an attempt.
    throw new Error(
      `create_attempt refused (${outcome.outcome}) for attempt ${input.attemptId}`,
    )
  }

  async appendAction(input: AppendActionInput<State>): Promise<WriteResult<State>> {
    const { data, error } = await client().rpc('commit_attempt_event', {
      p_attempt_id: input.attemptId,
      p_actor_user_id: this.actorUserId,
      p_scenario_release_id: input.scenarioReleaseId,
      p_expected_revision: input.expectedRevision,
      p_action_id: input.actionId,
      p_request_fingerprint: input.requestFingerprint,
      p_event_kind: input.eventKind,
      p_action_type: input.actionType,
      p_input_payload: input.inputPayload,
      p_normalized_input: input.normalizedInput,
      p_result_payload: input.resultPayload,
      p_calculation_trace: input.calculationTrace,
      p_observations: input.observations,
      p_warnings: input.warnings,
      p_resource_delta: input.resourceDelta,
      p_state_before_hash: input.stateBeforeHash,
      p_state_after: input.stateAfter,
      p_state_after_hash: input.stateAfterHash,
      p_undo_of_sequence: input.undoOfSequence,
      p_occurred_at: input.occurredAt.toISOString(),
      p_current_projection: input.nextProjection,
      p_projection_version: projectionVersionFor(input.scenarioReleaseId),
    })

    if (error !== null) return toExceptionRefusal<State>(error)
    return this.toWriteResult(input.attemptId, data as CommitOutcome)
  }

  async completeAttempt(input: CompleteAttemptInput<State>): Promise<WriteResult<State>> {
    const { data, error } = await client().rpc('complete_attempt', {
      p_attempt_id: input.attemptId,
      p_actor_user_id: this.actorUserId,
      p_scenario_release_id: input.scenarioReleaseId,
      p_expected_revision: input.expectedRevision,
      p_action_id: input.actionId,
      p_request_fingerprint: input.requestFingerprint,
      p_input_payload: input.inputPayload,
      p_normalized_input: input.normalizedInput,
      p_result_payload: input.resultPayload,
      p_calculation_trace: input.calculationTrace,
      p_observations: input.observations,
      p_warnings: input.warnings,
      p_resource_delta: input.resourceDelta,
      p_state_before_hash: input.stateBeforeHash,
      p_state_after: input.stateAfter,
      p_state_after_hash: input.stateAfterHash,
      p_occurred_at: input.occurredAt.toISOString(),
      p_current_projection: input.nextProjection,
      p_projection_version: projectionVersionFor(input.scenarioReleaseId),
      // Mandatory when completing (§4.2); the RPC raises if it is null.
      p_final_report_snapshot: input.finalReportSnapshot,
    })

    if (error !== null) return toExceptionRefusal<State>(error)
    return this.toWriteResult(input.attemptId, data as CommitOutcome)
  }

  async listAttempts(filter: AttemptFilter = {}): Promise<AttemptSummary[]> {
    const { data, error } = await client().rpc('list_attempts', {
      p_actor_user_id: this.actorUserId,
      p_scenario_release_id: releaseIdForScenarioKey(filter.scenarioKey),
      p_status: filter.status ?? null,
      p_limit: filter.limit ?? 50,
      p_offset: 0,
    })
    if (error !== null) throw rpcError('list_attempts', error)

    // `list_attempts` already builds camelCase keys, unlike the `to_jsonb` reads, so
    // only the timestamps need converting from JSON's strings to real Dates.
    const rows = (data as { attempts?: SummaryRow[] }).attempts ?? []
    return rows.map(toSummary)
  }

  async deleteAttempt(id: UUID): Promise<void> {
    const { data, error } = await client().rpc('delete_attempt', {
      p_attempt_id: id,
      p_actor_user_id: this.actorUserId,
    })
    if (error !== null) throw rpcError('delete_attempt', error)

    const outcome = (data as { outcome: string }).outcome
    if (outcome === 'not_found') {
      // Idempotent: deleting what is already gone is a success, so a double-clicked
      // "delete" in the lab list cannot surface an error to the learner.
      return
    }
    if (outcome !== 'committed') {
      // `forbidden`/`not_owner` cannot happen for a session-derived actor id; if it
      // does, something upstream passed the wrong principal and must not look like a
      // successful delete.
      throw new Error(`delete_attempt refused (${outcome}) for attempt ${id}`)
    }
  }

  async getAttemptEvents(id: UUID): Promise<readonly StoredEvent<State>[]> {
    const rows = await this.eventRows(id)
    return rows.map((row) => ({
      sequence: row.sequence,
      actionType: row.action_type,
      // Not optional: replay folds every stored event, so an undone action's delta would
      // still count without it and the rebuilt ledger would disagree with the state.
      undoOfSequence: row.undo_of_sequence,
      stateAfter: row.state_after as State,
      stateAfterHash: row.state_after_hash,
      resourceDelta: row.resource_delta as StoredEvent<State>['resourceDelta'],
    }))
  }

  async getAttemptEventRecords(
    id: UUID,
  ): Promise<readonly StoredAttemptEventRecord<State>[]> {
    const rows = await this.eventRows(id)
    return rows.map((row) => ({
      sequence: row.sequence,
      actionType: row.action_type,
      undoOfSequence: row.undo_of_sequence,
      stateAfter: row.state_after as State,
      stateAfterHash: row.state_after_hash,
      resourceDelta: row.resource_delta as StoredAttemptEventRecord<State>['resourceDelta'],
      actionId: row.action_id as UUID,
      requestFingerprint: row.request_fingerprint,
      eventKind: row.event_kind,
      inputPayload: row.input_payload,
      normalizedInput: row.normalized_input as StoredAttemptEventRecord<State>['normalizedInput'],
      resultPayload: row.result_payload,
      calculationTrace: row.calculation_trace as StoredAttemptEventRecord<State>['calculationTrace'],
      observations: row.observations as StoredAttemptEventRecord<State>['observations'],
      warnings: row.warnings as StoredAttemptEventRecord<State>['warnings'],
      // JSON has no Date; this is the one place that knows the wire format, so the rest
      // of the app holds real Dates and cannot compare a string to a timestamp.
      occurredAt: new Date(row.occurred_at),
    }))
  }

  /** One ownership-checked read of the attempt row, optionally with its event chain. */
  private async get(
    id: UUID,
    includeEvents: boolean,
  ): Promise<Extract<GetOutcome, { outcome: 'found' }> | null> {
    const { data, error } = await client().rpc('get_attempt', {
      p_attempt_id: id,
      p_actor_user_id: this.actorUserId,
      p_include_events: includeEvents,
    })
    if (error !== null) throw rpcError('get_attempt', error)

    const outcome = data as GetOutcome
    // `not_found` covers both a missing row and one this learner does not own: the RPC
    // makes them indistinguishable on purpose so a guessed UUID confirms nothing
    // (docs/verification-and-acceptance.md §13.2).
    return outcome.outcome === 'found' ? outcome : null
  }

  private async eventRows(id: UUID): Promise<readonly EventRow[]> {
    const found = await this.get(id, true)
    return found?.events ?? []
  }

  /**
   * Turn an RPC outcome into the interface's result.
   *
   * `committed` returns only ids and the new revision — NOT the row — so the attempt is
   * re-read to hand the session the full snapshot it needs. That second read is inside
   * the same request and sees the just-committed transaction, so it cannot return a
   * stale row.
   */
  private async toWriteResult(
    attemptId: UUID,
    outcome: CommitOutcome,
  ): Promise<WriteResult<State>> {
    switch (outcome.outcome) {
      case 'committed':
      case 'idempotent_replay': {
        const reread = await this.getAttempt(attemptId)
        if (reread === null) {
          // Committed and then unreadable in the same request: a deleted row or a broken
          // ownership check. Reporting success with no state would leave the workbench
          // rendering a state it cannot trust.
          throw new Error(`attempt ${attemptId} vanished after a ${outcome.outcome} write`)
        }
        return { ok: true, attempt: reread, outcome: outcome.outcome }
      }
      case 'idempotency_conflict':
        return { ok: false, outcome: 'idempotency_conflict', existingSequence: outcome.existingSequence }
      case 'revision_conflict':
        return { ok: false, outcome: 'revision_conflict', currentRevision: outcome.currentRevision }
      case 'not_found':
        return { ok: false, outcome: 'not_found' }
      case 'forbidden':
        return forbiddenToRefusal<State>(outcome)
    }
  }
}

/** `list_attempts` summary row: camelCase, ISO timestamps. */
type SummaryRow = {
  attemptId: string
  scenarioKey: string
  scenarioReleaseId: string
  status: AttemptStatus
  revision: number
  lastSequence: number
  currentProjection: unknown
  projectionVersion: number
  parentAttemptId: string | null
  parentSequence: number | null
  createdAt: string
  updatedAt: string
  completedAt: string | null
}

function client() {
  return createSupabaseAdminClient()
}

/**
 * The projection version locked by a release manifest.
 *
 * Read from the registry rather than taken from the write payload, because a
 * caller-supplied version would let one event chain mix two projectors — which §22
 * invariant 11 forbids and which is why `EventPayload` has no such field. Deriving it
 * here is also provably equal to the stored row's value: `commit_attempt_event` refuses
 * a release that differs from the attempt's (line 146 of the RPC), so by the time this
 * number is written the release has been asserted to match.
 *
 * An unknown release cannot be silently defaulted — that would stamp a projector version
 * the manifest never declared onto a chain. It throws, which surfaces as a 500 rather
 * than as corrupt data.
 */
function projectionVersionFor(releaseId: string): number {
  const manifest = servedReleases().find((entry) => entry.releaseId === releaseId)
  if (manifest === undefined) {
    throw new Error(`no served release manifest for ${releaseId}`)
  }
  return manifest.projectionVersion
}

/**
 * The release id a scenario key filters on, or a value that matches nothing.
 *
 * `list_attempts` filters by release id while the interface filters by scenario key, so
 * this maps between them through what is actually served. An unserved scenario returns a
 * sentinel that no row can equal, which yields an empty list — the correct answer, since
 * this deployment holds nothing for it. Returning null instead would mean "no filter"
 * and hand back every attempt the learner owns.
 */
function releaseIdForScenarioKey(scenarioKey: ScenarioKey | undefined): string | null {
  if (scenarioKey === undefined) return null
  const manifest = servedReleases().find((entry) => entry.scenarioKey === scenarioKey)
  return manifest?.releaseId ?? `\u0000unserved:${scenarioKey}`
}

/**
 * Map a `forbidden` reason onto the outcome vocabulary the workbench branches on.
 *
 * The RPC collapses several distinct refusals into `forbidden` + `reason`, while the
 * interface names them separately so the learner sees an accurate message. The mapping
 * is not cosmetic:
 *
 *   * `not_owner` → `not_found`. A learner must not learn that an attempt they do not
 *     own exists (§13.2); the workbench then says "cannot open", same as a bad UUID.
 *   * `not_in_progress` → `not_in_progress`, carrying the stored status so the UI can
 *     distinguish "already completed" from "stopped".
 *   * `release_mismatch` / `attempt_id_conflict` → `error` with `unsupportedRelease`.
 *     Neither is a learner action being declined: both mean the server asked to commit
 *     against a release or an attempt that does not match, which is a deployment or
 *     handler bug. Surfacing them as domain errors keeps them visible in the UI instead
 *     of silently looking like a normal refusal.
 */
function forbiddenToRefusal<State>(
  outcome: Extract<CommitOutcome, { outcome: 'forbidden' }>,
): WriteResult<State> {
  switch (outcome.reason) {
    case 'not_owner':
      return { ok: false, outcome: 'not_found' }
    case 'not_in_progress':
      return {
        ok: false,
        outcome: 'not_in_progress',
        // The RPC includes the stored status; defaulting would claim 'in_progress' for
        // an attempt that just refused a write because it is not.
        status: outcome.status ?? 'completed',
      }
    case 'release_mismatch':
      // The shared helper, not a hand-built error: `unsupported_release` is already the
      // domain's answer for "this deployment cannot serve that release"
      // (src/domain/process/lifecycle.ts), and the workbench has copy for its
      // `messageKey`. Building a second shape here would need a second string.
      return {
        ok: false,
        outcome: 'error',
        error: unsupportedRelease(outcome.requestedReleaseId ?? outcome.attemptReleaseId ?? ''),
      }
  }
}

/**
 * Map a raised RPC exception onto a refusal.
 *
 * Two refusals arrive as exceptions rather than as an `outcome`, because the RPC raises
 * them before it can return: `program_limit_exceeded` is the event ceiling and
 * `object_not_in_prerequisite_state` is an undo whose target sequence is out of range
 * (supabase/migrations/20260909000600_commit_event_rpc.sql). Both are ordinary,
 * learner-reachable conditions the workbench already has copy for, so they become the
 * matching refusal instead of a 500.
 *
 * Everything else is rethrown: `invalid_parameter_value` and `serialization_failure`
 * mean the server built a malformed call or lost a race it should have won, and neither
 * should be presented to a learner as their action being declined.
 */
function toExceptionRefusal<State>(error: {
  code: string
  message: string
}): WriteResult<State> {
  switch (error.code) {
    case 'program_limit_exceeded':
      return { ok: false, outcome: 'event_ceiling', maxEvents: MAX_ATTEMPT_EVENTS }
    case 'object_not_in_prerequisite_state': {
      // The undo range check raises with the offending sequence in its message. Parsing
      // it is the only way to recover the number the RPC did not return structurally;
      // when it is absent the refusal is still accurate, just without the detail.
      const match = /undo sequence (\d+)/.exec(error.message)
      const undoOfSequence = match?.[1] === undefined ? null : Number(match[1])
      return {
        ok: false,
        outcome: 'undo_invalid',
        undoOfSequence: Number.isNaN(undoOfSequence ?? Number.NaN) ? null : undoOfSequence,
      }
    }
    default:
      throw rpcError('commit', error)
  }
}

/**
 * The event ceiling, mirrored from `veclab_max_attempt_events()`.
 *
 * Duplicated as a literal because the refusal type carries a number and the RPC raises
 * before returning one. `MAX_ATTEMPT_EVENTS` in the guest adapter is the same constant
 * for the same reason: the ceiling is a property of the data model, and a learner must
 * see the same limit in both storage modes.
 */
const MAX_ATTEMPT_EVENTS = 500

/** Wrap an RPC failure so the log carries which call failed. */
function rpcError(fn: string, error: { code: string; message: string }): Error {
  return new Error(`${fn} failed (${error.code}): ${error.message}`)
}

function toSummary(row: SummaryRow): AttemptSummary {
  return {
    attemptId: row.attemptId as UUID,
    scenarioKey: row.scenarioKey as ScenarioKey,
    scenarioReleaseId: row.scenarioReleaseId,
    status: row.status,
    revision: row.revision,
    lastSequence: row.lastSequence,
    currentProjection: row.currentProjection,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
    completedAt: row.completedAt === null ? null : new Date(row.completedAt),
  }
}

function toAttempt<State>(row: AttemptRow): Attempt<State> {
  return {
    attemptId: row.id as UUID,
    scenarioKey: row.scenario_key as ScenarioKey,
    scenarioReleaseId: row.scenario_release_id,
    contentLocale: row.content_locale,
    status: row.status,
    revision: row.revision,
    lastSequence: row.last_sequence,
    initialState: row.initial_state as State,
    currentState: row.current_state as State,
    currentProjection: row.current_projection,
    projectionVersion: row.projection_version,
    finalReportSnapshot: row.final_report_snapshot,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    completedAt: row.completed_at === null ? null : new Date(row.completed_at),
  }
}
