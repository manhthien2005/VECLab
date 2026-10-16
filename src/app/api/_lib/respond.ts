import { NextResponse } from 'next/server'
import type { GuardFailure } from './guard.js'
import { json } from './guard.js'

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
  console.error(`[api] ${context}`, cause)
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

