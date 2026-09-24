import { NextResponse, type NextRequest } from 'next/server'
import type { UUID } from '@/domain/process/contracts.js'
import {
  assertSameOrigin,
  json,
  parseUuidSegment,
  readJson,
  MAX_ACTION_BODY_BYTES,
  type GuardFailure,
} from '@/app/api/_lib/guard.js'
import { guardedResponse, reject } from '@/app/api/_lib/respond.js'

/**
 * Shared skeleton for the five `/attempts/[attemptId]/*` routes.
 *
 * They differ only in which server-session function they call, so the parts that must NOT
 * differ are decided here instead of five times over:
 *
 *   * the attempt id is validated as a UUID before anything else, because it arrives as
 *     attacker-controlled path text and would otherwise reach a `uuid` RPC parameter and
 *     fail as a database error;
 *   * mutations verify Origin (§17) and read a body bounded to `MAX_ACTION_BODY_BYTES`;
 *   * every refusal that is still an HTTP 200 — the domain and store outcomes — is passed
 *     through untouched, which is what keeps the workbench's single outcome switch working
 *     across storage modes (see respond.ts for why a 4xx here would break it).
 *
 * Reads (`GET`) skip Origin: they mutate nothing, and the browser's same-origin policy
 * plus the `private, no-store` header `json` always sets are what protect them.
 */

/**
 * The refusal for a malformed `[attemptId]` segment.
 *
 * Lives here rather than in the shared response helpers because it is about attempts, not
 * about HTTP: the profile route has no dynamic segment and should not inherit vocabulary it
 * cannot use.
 *
 * A 400 rather than a 404, because the route matched and the request itself is wrong. That
 * also discloses nothing about whether any attempt exists, which is what §13.2 requires — a
 * guessed UUID and a malformed one differ only in status, and neither says anything about
 * real data.
 */
const BAD_ATTEMPT_ID: GuardFailure = {
  status: 400,
  body: { error: 'attempt_id_malformed' },
}

/** Context Next passes to a dynamic route handler. */
export type AttemptContext = {
  params: Promise<{ attemptId: string }>
}

/** A handler that has a validated attempt id and, for mutations, a parsed body. */
export type AttemptHandler = (attemptId: UUID, body: unknown) => Promise<NextResponse>

/**
 * Run a dynamic attempt route.
 *
 * `mutating` selects whether Origin and a body are required. A GET passes `false` and
 * receives a `null` body; a POST passes `true` and a body that failed to parse becomes a
 * 400 rather than reaching the handler.
 */
export async function attemptRoute(
  request: NextRequest,
  context: AttemptContext,
  handler: AttemptHandler,
  options: { mutating: boolean; contextName: string },
): Promise<NextResponse> {
  return guardedResponse(options.contextName, async () => {
    const { attemptId } = await context.params
    const parsedId = parseUuidSegment(attemptId)
    if (parsedId === null) return reject(BAD_ATTEMPT_ID)

    if (!options.mutating) {
      return handler(parsedId, null)
    }

    const origin = assertSameOrigin(request)
    if (origin !== null) return reject(origin)

    const parsed = await readJson(request, MAX_ACTION_BODY_BYTES)
    if (!parsed.ok) return reject(parsed.failure)

    return handler(parsedId, parsed.value)
  })
}

/**
 * 405 for a method this route does not implement.
 *
 * Stated explicitly rather than left to Next's default, so the `Allow` header tells a
 * caller what IS supported and the JSON shape matches every other refusal here.
 */
export function methodNotAllowed(allow: readonly string[]): NextResponse {
  return json(
    { error: 'method_not_allowed' },
    { status: 405, headers: new Headers({ Allow: allow.join(', ') }) },
  )
}
