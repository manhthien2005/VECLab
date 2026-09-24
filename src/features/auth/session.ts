import { createSupabaseServerClient, type AuthHeaderSink } from '@/infrastructure/supabase/server.js'
import { isSupabaseConfigured } from './is-configured.js'
import { isUUID } from '@/shared/ids.js'
import type { UUID } from '@/domain/process/contracts.js'

export { isSupabaseConfigured } from './is-configured.js'

/**
 * Where a learner's data lives, and why.
 *
 * This is the single decision point for storage mode, so every screen that has to choose
 * between the guest runtime and the account runtime agrees. Deriving it per page would
 * let two screens disagree about the same learner — which is how an attempt gets written
 * to IndexedDB while another screen tells them it is syncing.
 *
 * §6.1 fixes the principle: the browser is the source of truth for a guest, the database
 * for an account. §5.1 adds the constraint that decides the ordering below: a guest must
 * be able to complete all three experiments WITHOUT creating an account, so guest mode is
 * the default and account mode is the opt-in, never the reverse.
 */

/** The verified learner, or null for a guest. */
export type Learner = { id: UUID; email: string | null }

/**
 * The current learner from the session cookie.
 *
 * THE one place identity is resolved, and the reason is that the rule is easy to get
 * subtly wrong:
 *
 *   * `getUser()`, not `getSession()`. Only the former confirms with Supabase that the
 *     session still exists and has not been revoked. A revoked session carrying a
 *     still-parseable JWT would otherwise route a learner into cloud mode, where every
 *     BFF call then 401s — visibly broken, instead of quietly running as a guest.
 *   * the id is validated, not cast. It becomes `p_actor_user_id` on a service-role RPC
 *     call, which is the ONLY ownership check that applies there (RLS is bypassed), so a
 *     malformed value must not reach it.
 *
 * `onAuthHeaders` exists for callers that own a response — the BFF's route handlers.
 * `@supabase/ssr` delivers its cache-control headers on the first cookie write, and a
 * response that sets an auth cookie must never be stored by a CDN or one learner's token
 * can be served to another. Server Components cannot set headers, so they pass nothing and
 * middleware guards the response instead (src/middleware.ts).
 *
 * Returns null when Supabase is not configured rather than throwing: an unconfigured
 * deployment is a supported state for guest use (§5.1), and public routes must render.
 */
export async function currentLearner(
  onAuthHeaders?: AuthHeaderSink,
): Promise<Learner | null> {
  if (!isSupabaseConfigured()) return null

  const supabase = await createSupabaseServerClient(
    onAuthHeaders === undefined ? {} : { onAuthHeaders },
  )
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user === null) return null
  if (!isUUID(user.id)) return null

  return { id: user.id, email: user.email ?? null }
}

/**
 * Storage mode for the current request.
 *
 * `'cloud'` only for a verified learner; everyone else — an anonymous visitor, and
 * everyone on an unconfigured deployment — gets `'local'`.
 */
export async function currentStorageMode(): Promise<'local' | 'cloud'> {
  return (await currentLearner()) === null ? 'local' : 'cloud'
}
