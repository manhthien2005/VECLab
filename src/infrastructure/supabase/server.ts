import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Server Supabase client for route handlers and server components.
 *
 * Still the PUBLISHABLE key: this client runs with the learner's session cookie,
 * so RLS applies exactly as it does in the browser. The secret key is
 * reserved for the commit path, which needs to write rows on behalf of a user
 * after verifying ownership itself.
 *
 * AUTH CACHE HEADERS ARE SECURITY-RELEVANT. `@supabase/ssr` passes
 * `Cache-Control: private, no-cache, no-store, must-revalidate, max-age=0`,
 * `Expires: 0` and `Pragma: no-cache` alongside the first cookie write, because a
 * response that sets auth cookies must never be cached by a CDN or reverse proxy
 * — otherwise one user's session token can be served to a different user. The
 * project deploys to Vercel, which IS such a CDN, so dropping these headers would
 * be a real session-leak risk rather than a cosmetic omission.
 *
 * Two consequences:
 *   * a caller that can set response headers (a route handler building a
 *     NextResponse, or middleware) must pass a sink via `onAuthHeaders`;
 *   * a new client must be created per request. The library delivers the cache
 *     headers only on the FIRST cookie write from a given client, so a client
 *     reused across requests would leave later responses unguarded.
 */

/** Mutable header target the caller applies to its outgoing response. */
export type AuthHeaderSink = (headers: Record<string, string>) => void

export type SupabaseServerClientOptions = {
  /**
   * Receives the cache-control headers that must accompany the auth cookie
   * write. Omit only where no response headers can be set at all — a Server
   * Component — in which case middleware is what guards the response.
   */
  onAuthHeaders?: AuthHeaderSink
}

export async function createSupabaseServerClient(
  options: SupabaseServerClientOptions = {},
) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !publishableKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be set',
    )
  }

  const cookieStore = await cookies()
  const { onAuthHeaders } = options

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet, headers) {
        // Forward the cache headers first: if a later cookie write throws, the
        // response must still be marked non-cacheable rather than left exposed.
        if (onAuthHeaders && headers) {
          onAuthHeaders(headers)
        }

        try {
          for (const { name, value, options: cookieOptions } of cookiesToSet) {
            cookieStore.set(name, value, cookieOptions)
          }
        } catch {
          // A Server Component cannot mutate cookies; only route handlers and
          // middleware can. The session refresh then happens in middleware, so
          // nothing is lost by not setting here.
        }
      },
    },
  })
}
