import { NextResponse, type NextRequest } from 'next/server'
import {
  assertSameOrigin,
  json,
  readJson,
  MAX_ACTION_BODY_BYTES,
} from '@/app/api/_lib/guard.js'
import { startAttempt, listAttempts } from '../server-session.js'
import { guardedResponse, respond, reject } from '@/app/api/_lib/respond.js'
import { parseBody, startAttemptSchema } from '../schemas.js'

/**
 * `POST /api/simulation/attempts` — start a fresh attempt.
 * `GET  /api/simulation/attempts` — the learner's lab list.
 *
 * The scenario is not a parameter: this deployment serves exactly one locked release, and
 * the server picks it (docs §9, §17: "scenario config comes only from build or the
 * internal registry, never from an arbitrary user payload"). Letting a client name the
 * scenario would mean trusting it to request a release this deployment can actually serve.
 *
 * The `limit` on the list is bounded rather than passed through. It is the only client-
 * controlled number on this route, and an unbounded one is a way to ask the server to read
 * and serialize every attempt a learner owns.
 */

/** Cap on the lab list. §18 notes a learner may have many attempts and the list renders
 * only projections; 50 matches `list_attempts`' own default and the lab screen's needs. */
const MAX_LIST_LIMIT = 50

export async function POST(request: NextRequest): Promise<NextResponse> {
  return guardedResponse('POST /attempts', async () => {
    // A mutation: verify Origin before doing any work (§17).
    const origin = assertSameOrigin(request)
    if (origin !== null) return reject(origin)

    // The body must be EMPTY. `startAttemptSchema` is `.strict()` with no fields, so a
    // body carrying a `scenarioKey` or any initial state is rejected rather than ignored:
    // §17 is explicit that scenario config comes only from build or the internal registry,
    // never from an arbitrary user payload. Accepting and discarding such a field would
    // hide a client that believes it can choose the scenario.
    const parsed = await readJson(request, MAX_ACTION_BODY_BYTES)
    if (!parsed.ok) return reject(parsed.failure)

    const validated = parseBody(startAttemptSchema, parsed.value)
    if (!validated.ok) return reject(validated.failure)

    return respond(await startAttempt())
  })
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return guardedResponse('GET /attempts', async () => {
    const raw = request.nextUrl.searchParams.get('limit')
    let limit: number | undefined

    if (raw !== null) {
      const parsedLimit = Number(raw)
      // A malformed or out-of-range limit is a 400, not a silent clamp: the workbench
      // builds this URL itself, so a rejection here means a bug worth surfacing rather
      // than a request quietly returning fewer rows than it asked for.
      if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > MAX_LIST_LIMIT) {
        return json({ error: 'limit_out_of_range' }, { status: 400 })
      }
      limit = parsedLimit
    }

    return respond(await listAttempts(limit))
  })
}
