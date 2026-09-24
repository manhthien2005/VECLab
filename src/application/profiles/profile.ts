/**
 * Learner profile rules (docs/data-and-state-model.md §5.2, §5.3).
 *
 * Deliberately free of Supabase and of React so the same normalization governs every path
 * that touches a display name: the read that renders it, the write that stores it, and the
 * provisioning that creates a row when none exists. One definition, because a rule enforced in
 * only one of those three places is a rule the others can violate.
 *
 * §5.3 also fixes what a profile is NOT: no role (the MVP has learners only), no password, no
 * refresh token or JWT, and no duplicated email — email is read from the auth identity. None of
 * those fields exist in this type, so none of them can leak into a query or a response by
 * accident.
 */

/** The display-name default the database itself uses, mirrored so provisioning agrees. */
export const DEFAULT_DISPLAY_NAME = 'Người học'

/** §5.3: 1–80 characters AFTER trim. */
export const DISPLAY_NAME_MIN_LENGTH = 1
export const DISPLAY_NAME_MAX_LENGTH = 80

/** Why a display name was rejected. Maps to copy in the content layer. */
export type DisplayNameProblem = 'too_long' | 'blank'

export type DisplayNameResult =
  | { ok: true; value: string }
  | { ok: false; problem: DisplayNameProblem }

/**
 * Normalize a display name exactly as the database's check constraint will.
 *
 * `trim` first, then measure, mirroring `char_length(btrim(display_name)) between 1 and 80`.
 * Getting the order wrong is the whole risk here: checking length before trimming would accept
 * a name of 80 spaces (which the database then rejects with an opaque constraint violation)
 * and would reject an 81-character name whose trailing space is irrelevant.
 *
 * Returns a problem rather than throwing, because both outcomes are ordinary learner input
 * errors that need a message, not a 500.
 */
export function normalizeDisplayName(raw: string): DisplayNameResult {
  const value = raw.trim()

  if (value.length < DISPLAY_NAME_MIN_LENGTH) return { ok: false, problem: 'blank' }
  if (value.length > DISPLAY_NAME_MAX_LENGTH) return { ok: false, problem: 'too_long' }

  return { ok: true, value }
}

/**
 * What the account screen shows.
 *
 * `email` comes from the auth identity rather than from a column (§5.3), which is why it is
 * read-only on this screen: changing it would mean changing the login, and the two must not be
 * allowed to diverge.
 */
export type LearnerProfile = {
  userId: string
  email: string | null
  displayName: string
  locale: string
  createdAt: Date
  updatedAt: Date
}

/**
 * The name to show for a learner whose profile row is missing.
 *
 * Provisioning is idempotent and happens on sign-up, but a row can legitimately be absent —
 * an account created before this deployment, or a provisioning failure that has not been
 * retried. Falling back to the database's own default keeps the screen correct instead of
 * rendering nothing, and matches what the row would have said had it been created.
 */
export function displayNameOrFallback(name: string | null | undefined): string {
  const result = name === null || name === undefined ? null : normalizeDisplayName(name)
  return result !== null && result.ok ? result.value : DEFAULT_DISPLAY_NAME
}
