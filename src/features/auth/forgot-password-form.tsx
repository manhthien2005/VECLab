'use client'

import { useState } from 'react'
import Link from 'next/link'
import { APP_STRINGS } from '@/content/index.js'
import { createSupabaseBrowserClient } from '@/infrastructure/supabase/browser.js'
import { AuthCard, AuthField, type AuthNotice } from '@/features/auth/auth-card.js'
import { describeAuthError } from '@/features/auth/errors.js'
import { isSupabaseConfigured } from '@/features/auth/is-configured.js'

/**
 * Request a password-reset link (§4.4: forgot password).
 *
 * This screen only asks Supabase to send an email. The link it sends returns to
 * `/auth/callback`, which exchanges its one-time code for a session and then redirects to
 * `/reset-password` — so the actual password change happens there, with a session in place.
 *
 * The success message is deliberately ambiguous: "if this email has an account, a link was
 * sent". Supabase returns success whether or not the address is registered, and echoing that
 * faithfully is the point — a screen that said "check your inbox, we sent it" would confirm
 * which of an attacker's guessed emails belong to real learners. The message here cannot be
 * used to enumerate accounts because it is identical in both cases.
 */

export function ForgotPasswordForm() {
  const strings = APP_STRINGS.auth

  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<AuthNotice>(null)
  // After a successful request the email field is replaced by the notice, so the form cannot
  // be resubmitted by reflex — which would only hit Supabase's send-rate limit.
  const [sent, setSent] = useState(false)

  const submit = async () => {
    setBusy(true)
    setNotice(null)

    try {
      const supabase = createSupabaseBrowserClient()

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        // Same callback as verification. `next` is a fixed internal path, not user input, so
        // there is nothing to validate here — the redirect target is not chosen by the caller.
        redirectTo: `${globalThis.location.origin}/auth/callback?next=${encodeURIComponent('/reset-password')}`,
      })

      if (error !== null) {
        setNotice({ tone: 'danger', text: describeAuthError(error) })
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

  if (!isSupabaseConfigured()) {
    return (
      <AuthCard
        notice={{ tone: 'danger', text: strings.errors.notConfigured }}
        title={strings.forgotTitle}
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
        notice={{ tone: 'ok', text: strings.resetSentBody }}
        title={strings.resetSentTitle}
        footer={
          <p>
            <Link href="/sign-in">{strings.signInTitle}</Link>
          </p>
        }
      >
        {/* Nothing to submit, so no button: the next step happens in the learner's inbox. */}
        <p className="muted small">{strings.lede}</p>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      busy={busy}
      footer={
        <p>
          {strings.haveAccount} <Link href="/sign-in">{strings.signInTitle}</Link>
        </p>
      }
      lede={strings.lede}
      notice={notice}
      onSubmit={() => void submit()}
      submitLabel={strings.sendReset}
      title={strings.forgotTitle}
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
    </AuthCard>
  )
}
