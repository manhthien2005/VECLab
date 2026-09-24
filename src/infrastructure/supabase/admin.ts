import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Service-role client for the server-only write path.
 *
 * The attempt RPCs grant EXECUTE to `service_role` and `veclab_server` ONLY
 * (supabase/migrations/20260909000400_grants.sql), so a learner's session token
 * cannot call them. That is deliberate: the service role BYPASSES RLS, so the RPC
 * itself performs the ownership, status and release checks and takes
 * `p_actor_user_id` as a parameter rather than trusting `auth.uid()`
 * (docs/data-and-state-model.md §12).
 *
 * This key must never reach the browser. It is read from a non-`NEXT_PUBLIC_`
 * variable, and the module is imported only from route handlers.
 */

let cached: SupabaseClient | null = null

export function createSupabaseAdminClient(): SupabaseClient {
  if (cached) return cached

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set on the server',
    )
  }

  cached = createClient(url, serviceRoleKey, {
    auth: {
      // No session persistence: this client acts on behalf of whoever the route
      // handler authenticated, never as a logged-in principal of its own.
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  return cached
}
