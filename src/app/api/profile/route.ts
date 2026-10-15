import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import {
  assertSameOrigin,
  json,
  readJson,
  requireLearner,
  MAX_ACTION_BODY_BYTES,
  type GuardFailure,
} from '@/app/api/_lib/guard.js'
import { guardedResponse, reject } from '@/app/api/_lib/respond.js'
import { readLearnerProfile, updateDisplayName } from '@/application/profiles/profile-store.js'
import { readAuthProfile, updateAuthDisplayName } from '@/application/profiles/auth-profile-store.js'

/**
 * Own-profile API. Identity, CSRF and private/no-store guards apply to both stores.
 * Deployments with a server secret retain their existing profiles table.
 * With the two public auth variables only, presentation names are stored through
 * the learner's authenticated Auth client; metadata never grants permissions.
 */

/**
 * The change-display-name body.
 *
 * `.strict()` for the same reason as the simulation schemas: an unknown key is a request this
 * API does not define, and accepting it silently is how a handler later grows one that writes
 * something the client chose. It also means a body carrying `email` is rejected — a caller
 * sending it believes they can change their login, and should be told they cannot rather than
 * have the field quietly ignored.
 *
 * Length is bounded at 200 characters here and the real rule (1–80 after trim, §5.3) is applied
 * by `normalizeDisplayName` in the store, which is shared with provisioning. Bounding twice is
 * deliberate: this cap is about not parsing an arbitrarily large string; that one is the domain
 * rule, and a learner must be told which they broke.
 */
const displayNameSchema = z.object({ displayName: z.string().max(200) }).strict()

export async function GET(): Promise<NextResponse> {
  return guardedResponse('GET /api/profile', async () => {
    const auth = await requireLearner()
    if (!auth.ok) return reject(auth.failure, auth.authHeaders)

    const profile = process.env.SUPABASE_SECRET_KEY
      ? await readLearnerProfile(auth.userId, auth.email)
      : await readAuthProfile(auth.userId, auth.authHeaders)

    return json(
      {
        email: profile.email,
        displayName: profile.displayName,
        locale: profile.locale,
        // ISO string rather than a Date: JSON has no Date, and the account screen renders this
        // as text. Converting here keeps the wire format in one place.
        updatedAt: profile.updatedAt.toISOString(),
      },
      { status: 200, headers: auth.authHeaders },
    )
  })
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return guardedResponse('POST /api/profile', async () => {
    // A cookie-authenticated mutation, so Origin is verified before any work (§17).
    const origin = assertSameOrigin(request)
    if (origin !== null) return reject(origin)

    const auth = await requireLearner()
    if (!auth.ok) return reject(auth.failure, auth.authHeaders)

    const parsed = await readJson(request, MAX_ACTION_BODY_BYTES)
    if (!parsed.ok) return reject(parsed.failure, auth.authHeaders)

    const validated = displayNameSchema.safeParse(parsed.value)
    if (!validated.success) {
      // 400, with the field name but not the value: echoing the learner's own input back into a
      // log or a UI is how a stored name becomes someone else's XSS payload. §5.3 requires
      // rendering to escape it, and not round-tripping it here is the first line of that.
      return json(
        { error: 'body_invalid', field: 'displayName' },
        { status: 400, headers: auth.authHeaders },
      )
    }

    const result = process.env.SUPABASE_SECRET_KEY
      ? await updateDisplayName(auth.userId, validated.data.displayName)
      : await updateAuthDisplayName(auth.userId, validated.data.displayName, auth.authHeaders)

    if (!result.ok) {
      // The two ways §5.3's constraint can fail, named separately because the learner's fix
      // differs: one needs typing, the other needs deleting characters. A generic 400 would
      // leave them guessing which.
      const failure: GuardFailure =
        result.problem === 'too_long'
          ? { status: 400, body: { error: 'display_name_too_long' } }
          : { status: 400, body: { error: 'display_name_blank' } }
      return reject(failure, auth.authHeaders)
    }

    // `result.displayName` is the trimmed value the store actually wrote, returned so the
    // screen shows what was saved rather than what was typed — which differ whenever the
    // learner padded the field with spaces.
    return json({ displayName: result.displayName }, { status: 200, headers: auth.authHeaders })
  })
}
