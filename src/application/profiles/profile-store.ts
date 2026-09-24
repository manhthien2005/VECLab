import { createSupabaseAdminClient } from '@/infrastructure/supabase/admin.js'
import {
  displayNameOrFallback,
  normalizeDisplayName,
  type LearnerProfile,
} from './profile.js'

/**
 * Profile storage, server-side only (docs/data-and-state-model.md §17.1, §5.3).
 *
 * §17.1 is explicit that profile mutation goes through the server, and the grants make that
 * unavoidable rather than merely preferred: `authenticated` holds SELECT only on `profiles`
 * (20260909000400_grants.sql line 41), so a browser cannot write a display name even if it
 * wanted to. This module is what the BFF route handler calls, and it is the only code that
 * writes the table.
 *
 * Reads also go through the service role here rather than through RLS, for one reason: the
 * account screen renders on the server, where there is no browser client. The service role
 * bypasses RLS, so every query is scoped to a `userId` that came from a VERIFIED session —
 * the same discipline `SupabaseAttemptRepository` applies. Passing an unverified id here
 * would read another learner's profile, which is why this module takes the id as a parameter
 * and never reads it from a request body.
 *
 * Provisioning is idempotent (§5.3): sign-up creates the row, and a later read that finds
 * none creates it rather than failing. An account created before this deployment, or one whose
 * provisioning failed, must still render a correct account screen.
 */

/** A `profiles` row as returned by supabase-js: snake_case columns. */
type ProfileRow = {
  user_id: string
  display_name: string
  locale: string
  created_at: string
  updated_at: string
}

function client() {
  return createSupabaseAdminClient()
}

/**
 * Read a learner's profile, provisioning it if absent.
 *
 * `email` is NOT read from this table: §5.3 says email comes from the auth identity and is
 * not duplicated. It is passed in by the caller, which already has it from the verified
 * session, so the profile row cannot disagree with the identity that owns it.
 */
export async function readLearnerProfile(
  userId: string,
  email: string | null,
): Promise<LearnerProfile> {
  const existing = await selectProfile(userId)
  if (existing !== null) return toProfile(existing, email)

  return toProfile(await provisionProfile(userId), email)
}

/**
 * Create the profile row if it does not exist, and return it either way.
 *
 * Idempotent by construction: the insert is scoped to `user_id`, which is the primary key, so
 * a concurrent second call cannot produce two rows and a repeat call cannot fail on a
 * duplicate. The default display name comes from the column default, which is the same value
 * `DEFAULT_DISPLAY_NAME` mirrors — one source of truth in the database, restated in code only
 * so a missing row renders correctly.
 */
async function provisionProfile(userId: string): Promise<ProfileRow> {
  const { data, error } = await client()
    .from('profiles')
    .insert({ user_id: userId })
    .select()
    .single()

  // A unique violation means another request provisioned between the read and this insert.
  // That is success, not failure: re-reading returns the row the other call created.
  if (error !== null && !isUniqueViolation(error.code)) {
    throw new Error(`provision profile failed (${error.code}): ${error.message}`)
  }

  if (error === null) return data as ProfileRow

  const reread = await selectProfile(userId)
  if (reread === null) {
    throw new Error(`profile ${userId} absent immediately after provisioning`)
  }
  return reread
}

/**
 * Store a new display name.
 *
 * Normalized with the shared rule BEFORE it reaches the database, so a learner is told which
 * constraint they broke instead of receiving a raw check-constraint violation. The trimmed
 * value is what gets written, which is why the caller receives the stored name back: the
 * screen should show what was saved, not what was typed.
 *
 * Missing rows are handled by provisioning and writing once more (§5.3: provisioning is
 * idempotent). Surfacing a missing row as a failure would leave an account created before
 * this deployment permanently unable to set a name.
 */
export async function updateDisplayName(
  userId: string,
  rawName: string,
): Promise<
  | { ok: true; displayName: string }
  | { ok: false; problem: 'blank' | 'too_long' }
> {
  const normalized = normalizeDisplayName(rawName)
  if (!normalized.ok) return { ok: false, problem: normalized.problem }

  // Two passes at most. The first assumes the row exists, which is the common case since
  // sign-up provisions it; only a genuinely absent row costs the extra round trip. A bounded
  // loop rather than a recursive retry, so the limit is visible at the call site and a second
  // missing row is treated as the failure it is instead of retrying indefinitely.
  for (let pass = 0; pass < 2; pass += 1) {
    const written = await writeDisplayName(userId, normalized.value)
    if (written !== null) return { ok: true, displayName: written }

    await provisionProfile(userId)
  }

  throw new Error(`profile ${userId} absent after provisioning`)
}

/**
 * Write the name, or null when the learner has no profile row yet.
 *
 * Scoped by `user_id`, so a verified id that does not own this row updates nothing rather than
 * someone else's profile. `updated_at` is set explicitly: the column has an INSERT default but
 * no trigger to maintain it, so an update would otherwise leave a stale timestamp that the
 * account screen renders as "last changed".
 */
async function writeDisplayName(
  userId: string,
  displayName: string,
): Promise<string | null> {
  const { data, error } = await client()
    .from('profiles')
    .update({ display_name: displayName, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select()
    .single()

  if (error === null) return (data as ProfileRow).display_name
  if (isNoRows(error.code)) return null

  throw new Error(`update display name failed (${error.code}): ${error.message}`)
}

/** One row, or null when the learner has no profile yet. */
async function selectProfile(userId: string): Promise<ProfileRow | null> {
  const { data, error } = await client()
    .from('profiles')
    .select('user_id, display_name, locale, created_at, updated_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (error !== null) {
    throw new Error(`read profile failed (${error.code}): ${error.message}`)
  }

  return data === null ? null : (data as ProfileRow)
}

function toProfile(row: ProfileRow, email: string | null): LearnerProfile {
  return {
    userId: row.user_id,
    email,
    // Normalized on the way out as well as in, because a row written before the constraint
    // existed — or seeded by hand — could hold padding the screen should not render.
    displayName: displayNameOrFallback(row.display_name),
    locale: row.locale,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

/** PostgreSQL 23505: unique_violation. */
function isUniqueViolation(code: string): boolean {
  return code === '23505'
}

/** PostgreSQL PGRST116: PostgREST's "no rows returned" for `.single()`. */
function isNoRows(code: string): boolean {
  return code === 'PGRST116'
}
