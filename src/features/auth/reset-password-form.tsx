'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { APP_STRINGS } from '@/content/index.js'
import { createSupabaseBrowserClient } from '@/infrastructure/supabase/browser.js'
import { AuthCard, AuthField, type AuthNotice } from '@/features/auth/auth-card.js'
import { describeAuthError } from '@/features/auth/errors.js'
import { isSupabaseConfigured } from '@/features/auth/is-configured.js'

/**
 * Set a new password (§4.4: reset password).
 *
 * Reached from `/auth/callback`, which has ALREADY exchanged the emailed one-time code for a
 * session. So by the time this form renders there is a signed-in user, and the only thing left
 * to do is `updateUser({ password })`. That ordering is why the reset link works without the
 * learner typing their old password: possession of the working email link was the proof.
 *
 * If there is no session — the learner navigated here directly, or the link expired before the
 * callback ran — this screen cannot reset anything and says so, sending them to request a new
 * link. Attempting `updateUser` without a session would fail with an opaque auth error; checking
 * first turns that into a clear next step.
 */

/** Minimum length, matching sign-up so the two screens cannot disagree on the policy. */
const MIN_PASSWORD_LENGTH = 8

export function ResetPasswordForm() {
  const router = useRouter()
  const strings = APP_STRINGS.auth

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<AuthNotice>(null)
  const [done, setDone] = useState(false)

  const submit = async () => {
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

      // The session the callback established. Absent means the link did not complete, which is
      // the common failure and deserves its own message rather than a generic auth error.
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session === null) {
        setNotice({ tone: 'danger', text: strings.verifyFailedBody })
        setBusy(false)
        return
      }

      const { error } = await supabase.auth.updateUser({ password })

      if (error !== null) {
        setNotice({ tone: 'danger', text: describeAuthError(error) })
        setBusy(false)
        return
      }

      setDone(true)
      setBusy(false)
      // The password changed under an active session, so the learner is already signed in and
      // can go straight to their lab. `refresh()` re-runs server components so any cached
      // signed-out state is discarded.
      router.replace('/lab')
      router.refresh()
    } catch (cause) {
      setNotice({ tone: 'danger', text: describeAuthError(cause) })
      setBusy(false)
    }
  }

  if (!isSupabaseConfigured()) {
    return (
      <AuthCard
        notice={{ tone: 'danger', text: strings.errors.notConfigured }}
        title={strings.resetTitle}
      >
        <p className="muted small">{APP_STRINGS.errors.notConfiguredBody}</p>
      </AuthCard>
    )
  }

  if (done) {
    // Brief success card; the router.replace above is already navigating away. Rendered so a
    // slow navigation still shows the learner their password was saved rather than a stale form.
    return (
      <AuthCard
        notice={{ tone: 'ok', text: APP_STRINGS.account.messages.passwordChanged }}
        title={strings.resetTitle}
      >
        <p className="muted small">
          <Link href="/lab">{APP_STRINGS.report.backToLab}</Link>
        </p>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      busy={busy}
      footer={
        <p>
          <Link href="/forgot-password">{strings.forgotLink}</Link>
        </p>
      }
      lede={strings.lede}
      notice={notice}
      onSubmit={() => void submit()}
      submitLabel={strings.savePassword}
      title={strings.resetTitle}
    >
      <AuthField
        autoComplete="new-password"
        hint={strings.passwordHint}
        id="password"
        label={strings.newPassword}
        minLength={MIN_PASSWORD_LENGTH}
        onChange={(event) => setPassword(event.target.value)}
        required
        type="password"
        value={password}
      />
      <AuthField
        autoComplete="new-password"
        id="confirm"
        label={strings.confirmNewPassword}
        minLength={MIN_PASSWORD_LENGTH}
        onChange={(event) => setConfirm(event.target.value)}
        required
        type="password"
        value={confirm}
      />
    </AuthCard>
  )
}
