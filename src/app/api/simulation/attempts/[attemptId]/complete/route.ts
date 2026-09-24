import { NextResponse, type NextRequest } from 'next/server'
import { completeAttempt } from '../../../server-session.js'
import { respond, reject } from '@/app/api/_lib/respond.js'
import { attemptRoute, type AttemptContext } from '../../../attempt-route.js'
import { completeActionSchema, parseBody, toCommitIdentity } from '../../../schemas.js'

/**
 * `POST /api/simulation/attempts/[attemptId]/complete` — finish a run (§4.2, §5.4).
 *
 * The report snapshot is NOT in the body and cannot be. The server builds it from the
 * engine's own output, because a client-supplied report would be the one value that makes
 * every other guarantee meaningless: the snapshot is what an immutable completed report
 * renders from, forever, without recomputation (§15.1, §22 inv. 10).
 *
 * Whether the run MAY finish is the engine's call — it requires a valid model and a
 * measurement that still describes the current composition. So a learner who dosed more
 * base after their last reading gets a domain refusal, not a report.
 */

export async function POST(
  request: NextRequest,
  context: AttemptContext,
): Promise<NextResponse> {
  return attemptRoute(
    request,
    context,
    async (attemptId, body) => {
      const parsed = parseBody(completeActionSchema, body)
      if (!parsed.ok) return reject(parsed.failure)

      if (parsed.value.attemptId !== attemptId) {
        return reject({ status: 400, body: { error: 'attempt_id_mismatch' } })
      }

      return respond(await completeAttempt(attemptId, toCommitIdentity(parsed.value)))
    },
    { mutating: true, contextName: 'POST /attempts/[attemptId]/complete' },
  )
}
