import { createBrowserClient } from '@supabase/ssr'

/**
 * Browser Supabase client.
 *
 * Only the publishable key is exposed here: every authorization decision is
 * enforced by RLS in the database (supabase/migrations/20260909000500_rls.sql),
 * never by client code. A malicious browser can read any row RLS permits for
 * its own token and nothing else.
 */
export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !publishableKey) {
    // A missing key is a deployment configuration error. Throwing here surfaces
    // it immediately instead of rendering an app that silently cannot persist.
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be set',
    )
  }

  return createBrowserClient(url, publishableKey)
}
