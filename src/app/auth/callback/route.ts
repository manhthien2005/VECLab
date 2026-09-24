import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/infrastructure/supabase/server.js'
import { safeNextPath } from '@/features/auth/redirect.js'
import { isSupabaseConfigured } from '@/features/auth/session.js'

/**
 * `GET /auth/callback` — the return leg of every emailed link (§4.4).
 *
 * Supabase redirects here after a learner clicks an email confirmation or a password-reset
 * link, carrying a one-time `code`. This handler exchanges it for a session and then sends the
 * learner where they were going.
 *
 * Two things make this route worth more care than the screens around it:
 *
 *   * It is the only place a session is established from a URL. The `code` is the entire
 *     proof of identity, so it is used exactly once (`exchangeCodeForSession` consumes it) and
 *     never logged, echoed back, or placed in a redirect target where it could end up in a
 *     referer header or a browser history entry another learner shares the device with.
 *   * `next` arrives from the query string, which an attacker can compose. It is validated
 *     with the same helper the sign-in screen uses, so a crafted callback link cannot turn a
 *     legitimate confirmation into a redirect off-site.
 *
 * On any failure the learner is sent to a screen that explains, rather than to a bare error
 * page: an expired link is the common case and it is recoverable by asking for a new one.
 */

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Without the publishable keys there is no session to establish. `/verify` explains that
  // state, which is where a guest-mode-only deployment should land rather than 500ing.
  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(new URL('/verify?status=not_configured', request.url))
  }

  const code = request.nextUrl.searchParams.get('code')
  const next = safeNextPath(request.nextUrl.searchParams.get('next'))

  if (code === null || code === '') {
    // No code means either a hand-edited URL or Supabase redirecting with an error. Either way
    // there is nothing to exchange, and saying so beats reporting a server failure.
    return NextResponse.redirect(new URL('/verify?status=missing_code', request.url))
  }

  // Headers are collected so the cookie write this handler performs carries the cache-control
  // headers `@supabase/ssr` requires. This response SETS an auth cookie, so a CDN storing it
  // could hand one learner's session to another — which is exactly why the sink exists.
  const authHeaders = new Headers()
  const supabase = await createSupabaseServerClient({
    onAuthHeaders: (headers) => {
      for (const [key, value] of Object.entries(headers)) authHeaders.set(key, value)
    },
  })

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error !== null) {
    // The message is not forwarded: it distinguishes an expired link from an already-used one
    // from an invalid one, which tells an attacker how far they got. The learner's next step
    // is the same in every case — ask for a fresh link — so one status covers all of them.
    return NextResponse.redirect(new URL('/verify?status=failed', request.url), {
      headers: authHeaders,
    })
  }

  // Validated above, so this is a same-origin pathname or null. `/lab` is the documented
  // post-sign-in destination (§4.5); a reset flow passes `/reset-password` instead.
  return NextResponse.redirect(new URL(next ?? '/lab', request.url), { headers: authHeaders })
}
