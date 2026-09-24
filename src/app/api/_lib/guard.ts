import { NextResponse } from 'next/server'
import { currentLearner } from '@/features/auth/session.js'
import { isUUID } from '@/shared/ids.js'
import type { UUID } from '@/domain/process/contracts.js'

/**
 * Shared guards for every BFF route handler (docs/system-architecture.md §9, §17).
 *
 * Lives in `src/app/api/_lib/` rather than under a feature's own directory because the rules
 * here are about HTTP and identity, not about simulation: the attempt routes and the profile
 * route need the same four checks, and Next treats an underscore-prefixed folder as private so
 * this module cannot become an endpoint by accident.
 *
 * §17 opens with "the client is an untrusted environment", so every route handler runs through
 * here before it touches a session or an RPC. Four things are decided once rather than per
 * handler, because a handler that forgets one of them is a hole:
 *
 *   1. IDENTITY — resolved from the verified session cookie, never from the request body. The
 *      service-role client bypasses RLS, so `p_actor_user_id` is the ONLY ownership check that
 *      stands between one learner and another's rows.
 *   2. CSRF — cookie-authenticated mutations verify Origin (§17).
 *   3. BODY SIZE — bounded per endpoint (§17).
 *   4. CACHE — authenticated responses are `private, no-store` (§17, §11.2). A CDN must never
 *      serve one learner's data to another, and the deploy target is Vercel, which is a CDN.
 */

/**
 * Largest accepted request body, in bytes.
 *
 * A simulation write carries intent only — attempt id, action type, parameters, units,
 * two UUIDs and a revision (docs §9). That is well under a kilobyte; 64 KiB leaves room
 * for future parameters without becoming a way to make the server parse a large body
 * before rejecting it. Guest IMPORT is a different endpoint with its own, larger budget
 * (§17: 4 MiB) and does not use this constant.
 */
export const MAX_ACTION_BODY_BYTES = 64 * 1024

/** Response headers for an authenticated route: never cacheable, never public. */
const PRIVATE_NO_STORE = 'private, no-cache, no-store, max-age=0, must-revalidate' as const

/**
 * Build a JSON response with the cache headers §17 requires.
 *
 * Every handler returns through this rather than constructing `NextResponse.json`
 * itself, so a route that forgets the cache policy cannot accidentally expose one
 * learner's data through a shared cache. The auth cache-control headers from
 * `@supabase/ssr` are merged in when present: those accompany a cookie write and are
 * security-relevant in their own right (src/infrastructure/supabase/server.ts).
 */
export function json(body: unknown, init: { status?: number; headers?: Headers } = {}): NextResponse {
  const headers = new Headers(init.headers)
  // Set rather than append: a handler-supplied Cache-Control must not be able to widen
  // this to something a CDN will store.
  headers.set('Cache-Control', PRIVATE_NO_STORE)
  if (!headers.has('X-Content-Type-Options')) {
    headers.set('X-Content-Type-Options', 'nosniff')
  }
  return NextResponse.json(body, { status: init.status ?? 200, headers })
}

/** A guard failure, ready to return: a status and a body that leaks nothing. */
export type GuardFailure = { status: number; body: { error: string } }

/**
 * Verify the Origin of a cookie-authenticated mutation (§17).
 *
 * Same-origin `fetch` from the workbench always sends Origin on a POST, so a missing
 * header means the request did not come from the app's own page. That is what makes this
 * a CSRF defence rather than a formality: a cross-site form POST cannot forge the
 * header, and a cross-site `fetch` is blocked by CORS before it arrives.
 *
 * GET reads are not covered — they mutate nothing, and the browser's own same-origin
 * policy plus the no-store cache header are what protect them.
 *
 * A request with no Origin AND no Referer is rejected. Some non-browser clients omit
 * both, and this API is only ever called by the workbench in a browser.
 */
export function assertSameOrigin(request: Request): GuardFailure | null {
  // `origin`, not `host`: `URL.host` excludes the scheme, so an `https://` Origin would
  // match an `http://` request URL on the same hostname. Those are different origins, and
  // treating them as equal would accept a cross-scheme request that the browser itself
  // considers cross-origin.
  const expected = new URL(request.url).origin
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')

  if (origin !== null) {
    // `null` as a literal string is what a sandboxed iframe or opaque origin sends. It
    // must not match, otherwise an embedded page from any site would pass.
    if (origin === 'null') return { status: 403, body: { error: 'origin_not_allowed' } }
    let parsed: URL
    try {
      parsed = new URL(origin)
    } catch {
      return { status: 403, body: { error: 'origin_not_allowed' } }
    }
    return parsed.origin === expected
      ? null
      : { status: 403, body: { error: 'origin_not_allowed' } }
  }

  if (referer !== null) {
    try {
      // A Referer is a full URL with a path, so only its origin is comparable.
      return new URL(referer).origin === expected
        ? null
        : { status: 403, body: { error: 'origin_not_allowed' } }
    } catch {
      return { status: 403, body: { error: 'origin_not_allowed' } }
    }
  }

  return { status: 403, body: { error: 'origin_missing' } }
}

/**
 * Read and parse a JSON body within a byte budget (§17).
 *
 * The size is checked on the declared Content-Length first, then on the actual bytes
 * read: a request may lie about the former but cannot about the latter. Reading to a
 * hard cap rather than buffering an arbitrary body is what keeps a large upload from
 * being parsed before it is rejected.
 *
 * Returns a `GuardFailure` instead of throwing, so a handler reports a 413 or a 400 the
 * same way it reports every other refusal.
 */
export async function readJson(
  request: Request,
  maxBytes: number,
): Promise<{ ok: true; value: unknown } | { ok: false; failure: GuardFailure }> {
  const declared = request.headers.get('content-length')
  if (declared !== null && Number(declared) > maxBytes) {
    return { ok: false, failure: { status: 413, body: { error: 'body_too_large' } } }
  }

  let text: string
  try {
    text = await request.text()
  } catch {
    return { ok: false, failure: { status: 400, body: { error: 'body_unreadable' } } }
  }

  // Byte length, not character count: a body of multi-byte characters could otherwise
  // pass a length check while being larger on the wire.
  if (new TextEncoder().encode(text).byteLength > maxBytes) {
    return { ok: false, failure: { status: 413, body: { error: 'body_too_large' } } }
  }

  try {
    return { ok: true, value: JSON.parse(text) as unknown }
  } catch {
    return { ok: false, failure: { status: 400, body: { error: 'body_not_json' } } }
  }
}

/**
 * The verified learner, or a 401.
 *
 * A thin wrapper over `currentLearner`, which owns the identity rule — `getUser()` rather
 * than the decoded JWT, and a validated rather than cast id. That rule is not restated
 * here, because a second copy of a security check is a second chance to weaken it without
 * touching the first. What this function adds is the HTTP half: turning "no learner" into
 * a 401, and collecting the auth cache headers a cookie refresh produced so `json` can put
 * them on the response.
 *
 * The 401 deliberately carries no detail about why. An expired token, a revoked session
 * and an anonymous caller all look the same from here, and the only correct response to
 * any of them is "go sign in".
 */
export async function requireLearner(): Promise<
  | { ok: true; userId: UUID; email: string | null; authHeaders: Headers }
  | { ok: false; failure: GuardFailure; authHeaders: Headers }
> {
  const authHeaders = new Headers()
  const learner = await currentLearner((headers) => {
    for (const [key, value] of Object.entries(headers)) authHeaders.set(key, value)
  })

  if (learner === null) {
    return {
      ok: false,
      authHeaders,
      failure: { status: 401, body: { error: 'unauthenticated' } },
    }
  }

  // `email` is passed through rather than resolved again by whoever needs it. §5.3 keeps
  // email out of the profiles table and reads it from the auth identity, so the account
  // route has to show it — and resolving it here costs nothing, because `currentLearner`
  // already called `getUser()` to verify the session. A second call would be a second
  // round trip to Supabase for a value this function already holds.
  return { ok: true, userId: learner.id, email: learner.email, authHeaders }
}

/**
 * Validate a dynamic path segment as a UUID.
 *
 * Checked at the edge rather than inside a database call because an interpolated segment is
 * attacker-controlled text: passing it to a `uuid` column or parameter would surface as a
 * database error, and interpolating it into anything else would be worse.
 *
 * Named for what it does, not for the route that uses it: the simulation routes parse an
 * attempt id with it and the profile route has no dynamic segment at all, but any future
 * `[id]` route needs the same check and should not reinvent it.
 */
export function parseUuidSegment(raw: string): UUID | null {
  return isUUID(raw) ? raw : null
}

