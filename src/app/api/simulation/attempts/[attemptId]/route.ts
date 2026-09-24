import { NextResponse, type NextRequest } from 'next/server'
import { loadAttempt, removeAttempt } from '../../server-session.js'
import { respond } from '@/app/api/_lib/respond.js'
import { attemptRoute, methodNotAllowed, type AttemptContext } from '../../attempt-route.js'

/**
 * `GET    /api/simulation/attempts/[attemptId]` — resume an attempt.
 * `DELETE /api/simulation/attempts/[attemptId]` — delete it and its chain (§4.5).
 *
 * Both take the attempt id from the path and nothing from the body. The learner whose
 * attempt this is comes from the verified session, so neither route can be pointed at
 * someone else's attempt by supplying a different owner.
 */

export async function GET(
  request: NextRequest,
  context: AttemptContext,
): Promise<NextResponse> {
  // A read: no Origin check and no body, per attempt-route.ts.
  return attemptRoute(
    request,
    context,
    async (attemptId) => respond(await loadAttempt(attemptId)),
    { mutating: false, contextName: 'GET /attempts/[attemptId]' },
  )
}

export async function DELETE(
  request: NextRequest,
  context: AttemptContext,
): Promise<NextResponse> {
  return attemptRoute(
    request,
    context,
    async (attemptId) => respond(await removeAttempt(attemptId)),
    { mutating: true, contextName: 'DELETE /attempts/[attemptId]' },
  )
}

export function PUT(): NextResponse {
  // An attempt is immutable once created (§6.5): scenario, release and state are only ever
  // written by the server-only RPCs. There is deliberately no update route, so say so
  // rather than leaving the method to fall through to a generic error.
  return methodNotAllowed(['GET', 'DELETE'])
}

export function PATCH(): NextResponse {
  return methodNotAllowed(['GET', 'DELETE'])
}
