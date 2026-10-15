import { createSupabaseServerClient } from '@/infrastructure/supabase/server.js'
import { displayNameOrFallback, normalizeDisplayName, type LearnerProfile } from './profile.js'

/** Public-key deployments keep presentation-only names on the authenticated identity.
 * This metadata is never used for authorization. Existing table-backed deployments
 * continue using profile-store.ts; no table or production migration is required.
 */
async function authenticatedClient(userId: string, headers: Headers) {
  const client = await createSupabaseServerClient({ onAuthHeaders: values => {
    for (const [key, value] of Object.entries(values)) headers.set(key, value)
  } })
  const { data: { user }, error } = await client.auth.getUser()
  if (error || !user || user.is_anonymous || user.id !== userId) throw new Error('Profile session is no longer valid')
  return { client, user }
}

export async function readAuthProfile(userId: string, headers: Headers): Promise<LearnerProfile> {
  const { user } = await authenticatedClient(userId, headers)
  const name: unknown = user.user_metadata.display_name
  return {
    userId: user.id, email: user.email ?? null,
    displayName: displayNameOrFallback(typeof name === 'string' ? name : null),
    locale: 'vi', createdAt: new Date(user.created_at), updatedAt: new Date(user.updated_at ?? user.created_at),
  }
}

export async function updateAuthDisplayName(userId: string, rawName: string, headers: Headers) {
  const normalized = normalizeDisplayName(rawName)
  if (!normalized.ok) return normalized
  const { client } = await authenticatedClient(userId, headers)
  const { data: { user }, error } = await client.auth.updateUser({ data: { display_name: normalized.value } })
  if (error || !user || user.id !== userId || user.user_metadata.display_name !== normalized.value) {
    throw new Error('Could not save the display name')
  }
  return { ok: true as const, displayName: normalized.value }
}
