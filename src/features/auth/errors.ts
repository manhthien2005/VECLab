import { APP_STRINGS } from '@/content/index.js'
import { isSupabaseConfigured } from './is-configured.js'

/**
 * One mapping from a Supabase auth failure to the message a learner sees (§4.4).
 *
 * A single place rather than a try/catch per screen, for two reasons that are not stylistic:
 *
 *   * ACCOUNT ENUMERATION. Supabase deliberately does not say whether an email is
 *     unregistered or a password is wrong — it answers `invalid_credentials` for both. A
 *     screen that improvised its own copy from `error.message` would surface the upstream
 *     wording, which varies by code path and by configuration, and any variation is an
 *     oracle: try an email, see which message comes back, learn whether the account exists.
 *     Everything credential-shaped maps to one string here so that property holds by
 *     construction and not by each screen remembering it.
 *   * THE UNCONFIGURED CASE. `createSupabaseBrowserClient` throws when the `NEXT_PUBLIC_`
 *     keys are absent, which is a supported deployment state — guest mode keeps working
 *     (see `APP_STRINGS.errors.notConfiguredBody`). Without this mapping that throw would
 *     reach a catch block written for auth failures and be reported as "wrong password".
 */

/** Message keys the screens render, all from the content bundle. */
const errors = APP_STRINGS.auth.errors

/**
 * The error shape `@supabase/auth-js` actually produces.
 *
 * Typed structurally rather than imported, because the package exports `AuthError` only as a
 * class whose instances arrive across a bundler boundary: an `instanceof` check against it
 * fails when two copies of the module are loaded, which is a real failure mode in a Next app
 * with both client and server chunks. Reading the three fields it always sets does not
 * depend on prototype identity.
 */
type AuthFailure = {
  name?: string
  message?: string
  code?: string | undefined
  status?: number
}

/**
 * Turn a thrown auth failure into learner-facing copy.
 *
 * `unknown` in, because it is called from a `catch`: anything can be thrown, including a
 * non-error. Order matters — configuration first, then code, then status, then message —
 * so a more specific cause is never reported as a less specific one.
 */
export function describeAuthError(cause: unknown): string {
  // A missing publishable key is a deployment problem, not a bad password. Checked first
  // because every auth call would throw before reaching Supabase, and reporting those as
  // credential failures would send learners retrying a password that was never wrong.
  if (!isSupabaseConfigured()) return errors.notConfigured

  const failure = asFailure(cause)
  if (failure === null) return errors.generic

  // `code` is the stable identifier: `message` is upstream English text that can change
  // between versions and carries detail that must not reach a learner.
  switch (failure.code) {
    case 'email_exists':
    case 'user_already_exists':
    case 'identity_already_exists':
      return errors.emailTaken

    case 'weak_password':
    case 'validation_failed':
    case 'same_password':
      return errors.weakPassword

    case 'email_not_confirmed':
      // Distinct from a credential failure: the fix is to confirm, not to retype. Telling
      // the learner their password is wrong here would have them change one that works.
      return APP_STRINGS.auth.verifyFailedBody

    case 'session_expired':
    case 'session_not_found':
    case 'refresh_token_not_found':
    case 'refresh_token_already_used':
    case 'flow_state_not_found':
    case 'flow_state_expired':
      // A stale session or an expired link. Both are resolved by signing in again, and
      // neither means the learner mistyped anything.
      return errors.invalidCredentials

    case 'user_banned':
    case 'signup_disabled':
    case 'provider_disabled':
    case 'captcha_failed':
      return errors.generic

    case 'too_many_requests':
    case 'over_email_send_rate_limit':
    case 'over_sms_send_rate_limit':
      return errors.tooManyRequests

    default:
      break
  }

  // 429 is rate limiting regardless of which code accompanied it; Supabase has used both a
  // code and a bare status here across versions.
  if (failure.status === 429) return errors.tooManyRequests

  // Credentials. Collapsed deliberately — see the enumeration note above.
  // 400 with `invalid_credentials` is the documented shape; 422 appears on some
  // configurations for the same failure, and both must produce the SAME string as an
  // unrecognised credential error so no message difference leaks which case occurred.
  if (failure.code === 'invalid_credentials' || failure.status === 400 || failure.status === 422) {
    return errors.invalidCredentials
  }

  // Anything left is unexpected. The real cause is logged server-side or to the console by
  // the caller; what reaches the learner is that it failed, not why.
  return errors.generic
}

/**
 * Whether the cause looks like an auth failure carrying credentials meaning.
 *
 * Used by sign-up specifically: an email already taken is worth saying, while the same
 * failure during sign-in must stay vague. Keeping this predicate beside the mapper means the
 * two cannot disagree about what counts as credential-shaped.
 */
export function isEmailTaken(cause: unknown): boolean {
  const failure = asFailure(cause)
  return failure !== null && (failure.code === 'email_exists' || failure.code === 'user_already_exists')
}

/** Narrow a caught value to the auth error shape, or null when it is not one. */
function asFailure(cause: unknown): AuthFailure | null {
  if (typeof cause !== 'object' || cause === null) return null
  const candidate = cause as AuthFailure
  // An object with none of these fields is not an auth error, and treating it as one would
  // turn a programming bug into a message about the learner's password.
  if (
    candidate.message === undefined &&
    candidate.code === undefined &&
    candidate.status === undefined
  ) {
    return null
  }
  return candidate
}
