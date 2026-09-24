'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { APP_STRINGS } from '@/content/index.js'
import { createSupabaseBrowserClient } from '@/infrastructure/supabase/browser.js'
import { AuthCard, AuthField, type AuthNotice } from '@/features/auth/auth-card.js'
import { describeAuthError, isEmailTaken } from '@/features/auth/errors.js'
import { destinationAfterSignIn } from '@/features/auth/redirect.js'
import { isSupabaseConfigured } from '@/features/auth/is-configured.js'

/**
 * Create an account (§4.4).
 *
 * Email and password, with a confirmation email before the account can sign in. §4.4 lists
 * sign-up and verification as separate required steps, and this screen only performs the
 * first: it does NOT sign the learner in. Supabase's default configuration leaves the session
 * unconfirmed until the emailed link is used, so this screen's success state is "check your
 * inbox", not "welcome".
 *
 * Signing the learner in here anyway would be wrong twice over — it would skip the ownership
 * proof the email is for, and it would send them into the workbench with an account that
 * middleware would then bounce them out of.
 */

/** Minimum length the hint advertises. §4.4 leaves the policy to Supabase; this mirrors it. */
const MIN_PASSWORD_LENGTH = 8

export function SignUpForm() {
  const searchParams = useSearchParams()
  const strings = APP_STRINGS.auth

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<AuthNotice>(null)
  // Set once the request has been accepted, so the card stops offering a submit button that
  // would just re-register the same email.
  const [sent, setSent] = useState(false)

  const next = destinationAfterSignIn(searchParams.get('next'))

  /**
   * Where the emailed link returns to.
   *
   * One builder because two calls need it — sign-up and resend — and they must agree. If the
   * resent link carried a different or missing `next`, the learner who finally clicks it would
   * land somewhere other than the page that bounced them to sign up, which reads as a broken
   * flow rather than as the redirect it is.
   */
  const callbackUrl = (): string =>
    `${globalThis.location.origin}/auth/callback?next=${encodeURIComponent(next)}`

  const submit = async () => {
    // Checked in the browser as well as on the server because it is the one validation whose
    // failure is entirely the learner's to fix, and a round trip to learn it costs them their
    // typed password.
    if (password !== confirm) {
      setNotice({ tone: 'danger', text: strings.errors.passwordMismatch })
      return
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setNotice({ tone: 'danger', text: strings.errors.weakPassword })
      return
    }

    setBusy(true)
    setNotice(null)

    try {
      const supabase = createSupabaseBrowserClient()

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // The emailed link returns to /auth/callback, which exchanges its one-time code for
          // a session. `next` rides along so the learner lands where they were heading rather
          // than on a default page; it has already been validated by `destinationAfterSignIn`.
          emailRedirectTo: callbackUrl(),
        },
      })

      if (error !== null) {
        // An email that already has an account is worth saying specifically, because the fix
        // is to sign in instead — a learner who is told "something went wrong" will retry
        // forever. This is the one credential-adjacent message that is safe to make precise:
        // the learner already supplied this email, so confirming it is registered discloses
        // nothing they did not just claim.
        setNotice({
          tone: 'danger',
          text: isEmailTaken(error) ? strings.errors.emailTaken : describeAuthError(error),
        })
        setBusy(false)
        return
      }

      setSent(true)
      setBusy(false)
    } catch (cause) {
      setNotice({ tone: 'danger', text: describeAuthError(cause) })
      setBusy(false)
    }
  }

  /**
   * Ask for another confirmation email.
   *
   * Not a no-op behind a button that says "resend": the learner waiting on an email that never
   * arrived has exactly one thing they can do, and this is it. `resend` with type `signup`
   * re-sends the confirmation for an address that has already registered but not verified, so
   * it is the right call here and does not create a second account.
   *
   * Supabase rate-limits this, and the limit is worth surfacing rather than hiding: a learner
   * clicking repeatedly gets `over_email_send_rate_limit`, which maps to copy telling them to
   * wait. Reporting that as a generic failure would invite more clicking.
   */
  const resend = async () => {
    setBusy(true)
    setNotice(null)

    try {
      const supabase = createSupabaseBrowserClient()
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: callbackUrl() },
      })

      setNotice(
        error === null
          ? { tone: 'ok', text: strings.signedUpBody }
          : { tone: 'danger', text: describeAuthError(error) },
      )
    } catch (cause) {
      setNotice({ tone: 'danger', text: describeAuthError(cause) })
    } finally {
      setBusy(false)
    }
  }

  if (!isSupabaseConfigured()) {
    return (
      <AuthCard
        notice={{ tone: 'danger', text: strings.errors.notConfigured }}
        title={strings.signUpTitle}
        footer={
          <p>
            <Link href="/experiments">{strings.continueAsGuest}</Link>
          </p>
        }
      >
        <p className="muted small">{APP_STRINGS.errors.notConfiguredBody}</p>
      </AuthCard>
    )
  }

  if (sent) {
    return (
      <AuthCard
        busy={busy}
        notice={{ tone: 'ok', text: strings.signedUpBody }}
        onSubmit={() => void resend()}
        submitLabel={strings.resendVerification}
        title={strings.signedUpTitle}
        footer={
          <p>
            <Link href={`/sign-in?next=${encodeURIComponent(next)}`}>{strings.signInTitle}</Link>
          </p>
        }
      >
        <p className="muted small">{strings.lede}</p>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      busy={busy}
      footer={
        <p>
          {strings.haveAccount}{' '}
          <Link href={`/sign-in?next=${encodeURIComponent(next)}`}>{strings.signInTitle}</Link>
        </p>
      }
      lede={strings.lede}
      notice={notice}
      onSubmit={() => void submit()}
      submitLabel={strings.signUp}
      title={strings.signUpTitle}
    >
      <AuthField
        autoComplete="email"
        id="email"
        label={strings.email}
        onChange={(event) => setEmail(event.target.value)}
        required
        type="email"
        value={email}
      />
      <AuthField
        autoComplete="new-password"
        hint={strings.passwordHint}
        id="password"
        label={strings.password}
        minLength={MIN_PASSWORD_LENGTH}
        onChange={(event) => setPassword(event.target.value)}
        required
        type="password"
        value={password}
      />
      <AuthField
        autoComplete="new-password"
        id="confirm"
        label={strings.confirmPassword}
        minLength={MIN_PASSWORD_LENGTH}
        onChange={(event) => setConfirm(event.target.value)}
        required
        type="password"
        value={confirm}
      />
    </AuthCard>
  )
}
