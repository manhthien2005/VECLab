import { NextResponse, type NextRequest } from 'next/server'
import { listEvents } from '../../../server-session.js'
import { respond } from '@/app/api/_lib/respond.js'
import { attemptRoute, methodNotAllowed, type AttemptContext } from '../../../attempt-route.js'

/**
 * `GET /api/simulation/attempts/[attemptId]/events` — the full chain, for timeline and report.
 *
 * Read-only. The events are append-only and produced solely by the commit routes, so
 * there is no POST/PUT here: a client that could append an event directly would bypass the
 * engine, which is the entire point of routing writes through /actions.
 *
 * Ownership is enforced by the session-bound repository (`get_attempt` refuses an attempt
 * belonging to anyone else, returning the same `not_found` as a missing one, §13.2), so a
 * guessed id discloses nothing.
 */

export async function GET(
  request: NextRequest,
  context: AttemptContext,
): Promise<NextResponse> {
  return attemptRoute(
    request,
    context,
    async (attemptId) => respond(await listEvents(attemptId)),
    { mutating: false, contextName: 'GET /attempts/[attemptId]/events' },
  )
}

export function POST(): NextResponse {
  return methodNotAllowed(['GET'])
}
