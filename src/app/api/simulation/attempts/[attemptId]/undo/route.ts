import { NextResponse, type NextRequest } from 'next/server'
import { undoAction } from '../../../server-session.js'
import { respond, reject } from '@/app/api/_lib/respond.js'
import { attemptRoute, type AttemptContext } from '../../../attempt-route.js'
import { undoActionSchema, parseBody, toCommitIdentity } from '../../../schemas.js'

/**
 * `POST /api/simulation/attempts/[attemptId]/undo` — revert the last action (§5.1).
 *
 * Which actions may be undone is the scenario release's decision, not this route's: the
 * session asks `undoLastAction`, which derives reversibility from the stored chain so a
 * caller cannot undo chemistry that cannot be un-mixed. A refusal therefore arrives as a
 * `DomainError` and is returned as a 200 outcome, per respond.ts.
 */

export async function POST(
  request: NextRequest,
  context: AttemptContext,
): Promise<NextResponse> {
  return attemptRoute(
    request,
    context,
    async (attemptId, body) => {
      const parsed = parseBody(undoActionSchema, body)
      if (!parsed.ok) return reject(parsed.failure)

      if (parsed.value.attemptId !== attemptId) {
        return reject({ status: 400, body: { error: 'attempt_id_mismatch' } })
      }

      return respond(await undoAction(attemptId, toCommitIdentity(parsed.value)))
    },
    { mutating: true, contextName: 'POST /attempts/[attemptId]/undo' },
  )
}
