'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { APP_STRINGS } from '@/content/index.js'
import { AuthCard, type AuthNotice } from '@/features/auth/auth-card.js'

/**
 * The state of an emailed link (§4.4: verification, and the reset leg of forgot-password).
 *
 * `/auth/callback` redirects here with a status rather than rendering its own error page,
 * because the outcome of clicking an emailed link is something a learner needs explained in
 * words: "expired" and "already used" and "this deployment has no accounts" all require a
 * different next step, and a bare 4xx would give them none.
 *
 * Deliberately carries no detail from Supabase. The callback route collapses every exchange
 * failure into `failed` on purpose: distinguishing an expired code from an already-used one
 * tells an attacker how far a guessed link got, and the learner's next action is identical in
 * every case — ask for a new one.
 */
const STATUSES = ['ok', 'failed', 'missing_code', 'not_configured'] as const
type Status = (typeof STATUSES)[number]

function parseStatus(value: string | null): Status {
  // Anything unrecognized is treated as a failure rather than as success: a status this page
  // does not know about means the redirect did not come from our callback route, and the
  // optimistic reading would tell a learner their email is confirmed when nothing was verified.
  return STATUSES.includes(value as Status) ? (value as Status) : 'failed'
}

export function VerifyCard() {
  const status = parseStatus(useSearchParams().get('status'))
  const strings = APP_STRINGS.auth

  const notice: AuthNotice =
    status === 'ok'
      ? { tone: 'ok', text: strings.verifyOkBody }
      : status === 'not_configured'
        ? { tone: 'danger', text: strings.errors.notConfigured }
        : { tone: 'danger', text: strings.verifyFailedBody }

  const title =
    status === 'ok'
      ? strings.verifyOkTitle
      : status === 'not_configured'
        ? strings.verifyTitle
        : strings.verifyFailedTitle

  return (
    <AuthCard
      footer={
        <>
          {status === 'ok' ? (
            <p>
              <Link className="btn btn-primary" href="/lab">
                {APP_STRINGS.report.backToLab}
              </Link>
            </p>
          ) : (
            <p>
              <Link href="/sign-in">{strings.signInTitle}</Link>
              {' · '}
              <Link href="/sign-up">{strings.signUpTitle}</Link>
            </p>
          )}
          {status === 'not_configured' ? null : (
            <p>
              <Link href="/experiments">{strings.continueAsGuest}</Link>
            </p>
          )}
        </>
      }
      notice={notice}
      // Nothing to submit: this page reports the result of a link the learner already
      // clicked. With no `onSubmit`/`submitLabel` the card renders no button at all, so it
      // cannot imply an action that does nothing.
      title={title}
    >
      {status === 'not_configured' ? (
        <p className="muted small">{APP_STRINGS.errors.notConfiguredBody}</p>
      ) : null}
    </AuthCard>
  )
}
