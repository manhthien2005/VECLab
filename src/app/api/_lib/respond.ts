import { NextResponse } from 'next/server'
import type { GuardFailure } from './guard.js'
import { json } from './guard.js'

/**
 * Status semantics for the simulation BFF.
 *
 * The split is unusual and deliberate, so it is stated once here rather than left to each
 * handler's judgement:
 *
 *   * HTTP 200 — the server evaluated the request. This INCLUDES every domain and store
 *     refusal: `revision_conflict`, `not_in_progress`, `undo_invalid`, `event_ceiling`,
 *     `not_found` and any `DomainError`. They are outcomes, not failures.
 *   * HTTP 4xx/5xx — the server did NOT evaluate it. Unauthenticated, malformed body,
 *     cross-origin, or an exception.
 *
 * Why this matters: `RemoteAcidSession.fetch` throws on any non-2xx, because a transport
 * or server failure must not be reported to a learner as "your action was rejected" when
 * nothing was evaluated. If a `revision_conflict` came back as a 409 it would surface as
 * a thrown error banner, and the workbench's single outcome switch — the thing that makes
 * guest and cloud refusals read identically — would never fire for it.
 *
 * The corollary is that a refusal body must be distinguishable from a success body by its
 * `ok` field, which is exactly the shape `WriteResult` and `SessionActionResult` already
 * have. Nothing here invents a status vocabulary.
 */

/** A guarded server call's outcome, as produced by `server-session.ts`. */
export type ServerOutcome<Value> =
  | { ok: true; value: Value; authHeaders: Headers }
  | { ok: false; failure: GuardFailure; authHeaders: Headers }

/**
 * Encode a guarded result as a response.
 *
 * Merges the auth cache headers the session refresh produced with the private/no-store
 * headers `json` always sets, so a response that wrote a cookie can never be stored by a
 * CDN and served to another learner (src/infrastructure/supabase/server.ts, §17).
 */
export function respond<Value>(outcome: ServerOutcome<Value>): NextResponse {
  if (!outcome.ok) {
    return json(outcome.failure.body, {
      status: outcome.failure.status,
      headers: outcome.authHeaders,
    })
  }
  return json(outcome.value, { status: 200, headers: outcome.authHeaders })
}

/**
 * Encode a guard failure from a handler that had not yet reached the session — a bad
 * body, a cross-origin POST, a malformed attempt id.
 */
export function reject(failure: GuardFailure, authHeaders?: Headers): NextResponse {
  return json(failure.body, {
    status: failure.status,
    ...(authHeaders === undefined ? {} : { headers: authHeaders }),
  })
}

/**
 * The 500 path.
 *
 * Logs the real cause and returns a body that carries none of it. §15 requires
 * correlation and cause to be observable server-side; §17 requires that they are not
 * handed to an untrusted client, where a stack trace or a database message would disclose
 * schema and internal state.
 */
export function serverError(cause: unknown, context: string): NextResponse {
  // `console.error` is allowed by the lint config precisely for this: a failure the
  // server cannot report to the learner still has to reach whoever operates it.
  console.error(`[simulation-bff] ${context}`, cause)
  return json({ error: 'internal_error' }, { status: 500 })
}

/**
 * Run a handler body, converting any throw into a 500 that leaks nothing.
 *
 * Wrapping rather than trusting each handler to catch: an unhandled rejection inside a
 * route handler becomes a generic Next error page, which is both unhelpful in the log and
 * inconsistent with the JSON contract the workbench expects.
 */
export async function guardedResponse(
  context: string,
  run: () => Promise<NextResponse>,
): Promise<NextResponse> {
  try {
    return await run()
  } catch (cause) {
    return serverError(cause, context)
  }
}

