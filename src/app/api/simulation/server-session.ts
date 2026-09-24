import { createAcidSession } from '@/application/simulation/acid-session.js'
import { SupabaseAttemptRepository } from '@/application/attempts/supabase-repository.js'
import type { AcidNeutralizationState } from '@/domain/experiments/acid-neutralization/state.js'
import type { UUID } from '@/domain/process/contracts.js'
import {
  toEventRecordDto,
  toReportDto,
  toSessionStateDto,
  toSummaryDto,
} from '@/application/simulation/wire.js'
import type { CommitIdentity } from '@/application/simulation/acid-session.js'
import { requireLearner, type GuardFailure } from '@/app/api/_lib/guard.js'

/**
 * The server half of the session seam (docs/system-architecture.md §9).
 *
 * This is where the engine actually runs for an account. The browser sent intent — an
 * action type, parameters and units — and this module builds a `SupabaseAttemptRepository`
 * bound to the VERIFIED learner, hands it to the same `createAcidSession` the guest uses,
 * and lets that session run the locked release engine. No result, state or hash ever
 * crosses this boundary inbound, which is what makes the trusted columns trustworthy.
 *
 * Sharing `createAcidSession` between here and the browser is not incidental. It is the
 * reason a guest run and an imported cloud run produce the same events and the same
 * scores: there is one implementation of compute-project-persist, and §18.5's rejection
 * of client-only computation for accounts changes WHERE it executes, not WHAT executes.
 *
 * Every function returns either a `GuardFailure` (401 for no session) or the value to
 * encode. Handlers turn that into a response; this module never touches `Request` or
 * `Response`, so it stays testable without an HTTP stack.
 */

/** Outcome of a guarded server call. */
export type ServerResult<Value> =
  | { ok: true; value: Value; authHeaders: Headers }
  | { ok: false; failure: GuardFailure; authHeaders: Headers }

/** The session for one verified learner, plus the headers its auth refresh produced. */
export type LearnerSession = {
  session: ReturnType<typeof createAcidSession>
  userId: UUID
  authHeaders: Headers
}

/**
 * Authenticate and build the session.
 *
 * One call rather than per-handler boilerplate, because the ordering is load-bearing:
 * the repository must be constructed from the VERIFIED id, and nothing may read an
 * attempt before that exists. A handler that built its own repository from a body field
 * would bypass ownership entirely, since the service role does not apply RLS.
 */
export async function learnerSession(): Promise<
  { ok: true; value: LearnerSession } | { ok: false; failure: GuardFailure; authHeaders: Headers }
> {
  const auth = await requireLearner()
  if (!auth.ok) return { ok: false, failure: auth.failure, authHeaders: auth.authHeaders }

  const repository = new SupabaseAttemptRepository<AcidNeutralizationState>(auth.userId)
  return {
    ok: true,
    value: { session: createAcidSession(repository), userId: auth.userId, authHeaders: auth.authHeaders },
  }
}

/** Wrap a session call so a 401 and a success share one return shape. */
async function guarded<Value>(
  run: (session: LearnerSession['session']) => Promise<Value>,
): Promise<ServerResult<Value>> {
  const opened = await learnerSession()
  if (!opened.ok) {
    return { ok: false, failure: opened.failure, authHeaders: opened.authHeaders }
  }
  return { ok: true, value: await run(opened.value.session), authHeaders: opened.value.authHeaders }
}

/** Start a fresh attempt. The server owns the scenario and the initial state. */
export function startAttempt() {
  return guarded(async (session) => ({ state: toSessionStateDto(await session.start()) }))
}

/** Resume an attempt, rebuilding the ledger by replay. */
export function loadAttempt(attemptId: UUID) {
  return guarded(async (session) => {
    const loaded = await session.load(attemptId)
    // null is the store saying "not yours or not there". §13.2 requires that those two
    // stay indistinguishable, so both become the same 404-shaped body.
    if (loaded === null) return { ok: false as const, outcome: 'not_found' as const }
    if (!loaded.ok) return { ok: false as const, error: loaded.error }
    return { ok: true as const, state: toSessionStateDto(loaded.state) }
  })
}

/** Run one action through the engine and commit it. */
export function applyAction(
  attemptId: UUID,
  actionType: string,
  parameters: Record<string, number | string | boolean>,
  unitSelections: Record<string, string>,
  commit: CommitIdentity,
) {
  return guarded(async (session) => {
    const result = await session.apply(attemptId, actionType, parameters, unitSelections, commit)
    if (result.ok) {
      return {
        ok: true as const,
        state: toSessionStateDto(result.state),
        feedback: result.feedback,
      }
    }
    // Refusals and domain errors are already JSON-safe and already named after the RPC's
    // outcomes, so they pass through: that shared vocabulary is what lets the workbench
    // branch once for guest and cloud.
    return result as Exclude<typeof result, { ok: true }>
  })
}

/** Revert the last action, if the scenario allows it. */
export function undoAction(attemptId: UUID, commit: CommitIdentity) {
  return guarded(async (session) => {
    const result = await session.undo(attemptId, commit)
    if (result.ok) {
      return {
        ok: true as const,
        state: toSessionStateDto(result.state),
        feedback: result.feedback,
      }
    }
    return result as Exclude<typeof result, { ok: true }>
  })
}

/** Complete: build the report snapshot and finish in one write. */
export function completeAttempt(attemptId: UUID, commit: CommitIdentity) {
  return guarded(async (session) => {
    const result = await session.complete(attemptId, commit)
    if (result.ok) {
      return {
        ok: true as const,
        state: toSessionStateDto(result.state),
        report: toReportDto(result.report),
      }
    }
    return result as Exclude<typeof result, { ok: true }>
  })
}

/** Lab-list summaries, newest first, with no state payloads (§18). */
export function listAttempts(limit?: number) {
  return guarded(async (session) => ({
    attempts: (await session.list(limit)).map(toSummaryDto),
  }))
}

/** Full event records for the timeline and the report. */
export function listEvents(attemptId: UUID) {
  return guarded(async (session) => ({
    events: (await session.listEvents(attemptId)).map(toEventRecordDto),
  }))
}

/**
 * Delete one attempt and its chain (§4.5).
 *
 * Ownership is enforced by the repository's bound actor id, which came from the verified
 * session: `delete_attempt` refuses an attempt belonging to anyone else, and a refusal is
 * indistinguishable from a successful delete of an already-absent row, so this cannot be
 * used to probe which attempt ids exist (§13.2).
 */
export function removeAttempt(attemptId: UUID) {
  return guarded(async (session) => {
    await session.remove(attemptId)
    return { deleted: true }
  })
}
