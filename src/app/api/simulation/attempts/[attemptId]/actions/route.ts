import { NextResponse, type NextRequest } from 'next/server'
import { applyAction } from '../../../server-session.js'
import { respond, reject } from '@/app/api/_lib/respond.js'
import { attemptRoute, type AttemptContext } from '../../../attempt-route.js'
import { applyActionSchema, parseBody, toCommitIdentity } from '../../../schemas.js'

/**
 * `POST /api/simulation/attempts/[attemptId]/actions` — run one action (docs §9).
 *
 * THE SECURITY-CRITICAL ROUTE. What it accepts is exactly what §9 says a client sends: the
 * action type, its parameters, the units those parameters were entered in, and the two
 * concurrency facts only the browser knows (action id, expected revision).
 *
 * What it does NOT accept is any result: no `resultPayload`, no `stateAfter`, no hash, no
 * score. `applyActionSchema` is `.strict()`, so a body carrying one is rejected rather
 * than parsed away. That matters because those values are computed here by the locked
 * release engine and written through RPC columns revoked from browser roles — this route
 * is the only thing that can produce them. A handler that forwarded a client-supplied
 * result would make the hash chain, the golden fixtures and report immutability
 * decorative: any learner could post invented chemistry and receive a report vouching
 * for it.
 */

export async function POST(
  request: NextRequest,
  context: AttemptContext,
): Promise<NextResponse> {
  return attemptRoute(
    request,
    context,
    async (attemptId, body) => {
      const parsed = parseBody(applyActionSchema, body)
      if (!parsed.ok) return reject(parsed.failure)

      // The id travels in the path AND in the body: the path routes the request, the body
      // carries the commit's own identity for §12.1's idempotency key. Both are
      // client-supplied, so a mismatch means a caller writing one attempt while claiming
      // another. Rejecting beats picking a winner.
      if (parsed.value.attemptId !== attemptId) {
        return reject({ status: 400, body: { error: 'attempt_id_mismatch' } })
      }

      return respond(
        await applyAction(
          attemptId,
          parsed.value.actionType,
          parsed.value.parameters,
          parsed.value.unitSelections,
          toCommitIdentity(parsed.value),
        ),
      )
    },
    { mutating: true, contextName: 'POST /attempts/[attemptId]/actions' },
  )
}
