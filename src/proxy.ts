import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Session refresh and cache-guard Proxy.
 *
 * This is the canonical place the session cookie gets refreshed, for two reasons
 * documented by `@supabase/ssr`: a Server Component cannot mutate cookies, and
 * the library delivers its auth cache headers only on the first cookie write from
 * a given client. Proxy runs on every request, can write cookies, and owns
 * the outgoing response, so it can apply those headers reliably.
 *
 * The headers matter: a response that sets auth cookies must never be cached by a
 * CDN, otherwise one learner's session token can be served to another. The deploy
 * target is Vercel, which is such a CDN.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

/**
 * Route groups that require a session. Everything else — the public catalog, the
 * evidence register, the auth screens themselves and the guest workbench — stays
 * reachable without signing in, because a guest must be able to complete all
 * three experiments before creating an account (web scope §14).
 */
const LEARNER_PREFIXES = ['/lab', '/compare', '/account']

function requiresSession(pathname: string): boolean {
  return LEARNER_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  // Without configured credentials the app cannot authenticate at all. Rather
  // than throwing inside Proxy — which surfaces as an opaque 500 on every
  // request — fall through to the app shell, which reports the misconfiguration
  // where a developer will actually see it.
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    return response
  }

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet, headers) {
        // Apply the cache-control headers BEFORE the cookies, so a response that
        // ends up setting an auth cookie is never left cacheable.
        if (headers) {
          for (const [key, value] of Object.entries(headers)) {
            response.headers.set(key, value)
          }
        }

        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value)
        }
        // Rebuild the response from the mutated request so the refreshed cookies
        // travel onward to the route handler.
        response = NextResponse.next({ request })
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options)
        }
      },
    },
  })

  // Reading the user forces a token refresh when the access token has expired,
  // which is the whole reason this Proxy exists. `data.user` is null for a
  // guest, which is a normal state rather than an error.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user === null && requiresSession(request.nextUrl.pathname)) {
    const signInUrl = request.nextUrl.clone()
    signInUrl.pathname = '/sign-in'
    // Carry the destination so sign-in can return the learner to where they were
    // heading instead of dropping them on the catalog (web scope §11.4).
    signInUrl.searchParams.set('next', request.nextUrl.pathname)
    return NextResponse.redirect(signInUrl)
  }

  return response
}

export const config = {
  // Static assets and Next internals never need a session check; excluding them
  // keeps Proxy off the hot path for every image, font and chunk.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
