/**
 * Whether Supabase is configured at all.
 *
 * `NEXT_PUBLIC_` variables are inlined at build time, so a deployment without them has no
 * account features — and must not pretend otherwise. The content layer has copy for this
 * exact state (`APP_STRINGS.errors.notConfiguredBody`): guest mode keeps working, accounts
 * and sync do not. Middleware makes the same check before touching a session
 * (src/middleware.ts), for the same reason.
 *
 * Kept in its own module, separate from `session.ts`: this check runs in client components
 * (the auth forms, before they render), and `session.ts` imports the server-only Supabase
 * client (`next/headers`). A single shared file would pull that server-only import into every
 * client bundle that just wants this boolean.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )
}
