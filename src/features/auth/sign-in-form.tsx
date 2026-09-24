'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { APP_STRINGS } from '@/content/index.js'
import { createSupabaseBrowserClient } from '@/infrastructure/supabase/browser.js'
import { AuthCard, AuthField, type AuthNotice } from '@/features/auth/auth-card.js'
import { describeAuthError } from '@/features/auth/errors.js'
import { destinationAfterSignIn } from '@/features/auth/redirect.js'
import { isSupabaseConfigured } from '@/features/auth/is-configured.js'

/**
 * Sign in (§4.4).
 *
 * Email and password only. §4.4 excludes Google, Microsoft, Apple and social sign-in, so
 * there is no provider button here — adding one would be a scope change, not a convenience.
 *
 * Client component: the credentials are posted from the browser to Supabase with the
 * publishable key, and the session cookie is set by `@supabase/ssr` in the browser client. A
 * server action would work too, but it would put the password through this deployment's logs
 * and error reporting on the way, for no gain — authorization is still enforced by RLS in the
 * database, not by anything here.
 */

export function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const strings = APP_STRINGS.auth

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<AuthNotice>(null)

  /**
   * Where to go after a successful sign-in.
   *
   * Validated on every render rather than captured once, because `?next=` is part of the URL
   * and the workbench can change it without remounting this component. The helper rejects
   * anything that is not a same-origin path, so a crafted `?next=https://evil.example` lands
   * on the lab instead of leaving the site — an open redirect here would make a phishing link
   * that signs the learner in for real before handing them to a look-alike page.
   */
  const next = destinationAfterSignIn(searchParams.get('next'))

  const submit = async () => {
    setBusy(true)
    setNotice(null)

    try {
      const supabase = createSupabaseBrowserClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })

      if (error !== null) {
        setNotice({ tone: 'danger', text: describeAuthError(error) })
        setBusy(false)
        return
      }

      // No error and no notice: navigate. `refresh()` re-runs the server components so the
      // middleware sees the new cookie — without it, `/lab` would render from the pre-sign-in
      // request and bounce back to this screen with a valid session in place.
      router.replace(next)
      router.refresh()
    } catch (cause) {
      // `createSupabaseBrowserClient` throws when the publishable key is missing, which is a
      // supported deployment state: guest mode still works and accounts do not. Reporting it
      // as a credential failure would have the learner retype a correct password.
      setNotice({ tone: 'danger', text: describeAuthError(cause) })
      setBusy(false)
    }
  }

  // An unconfigured deployment cannot sign anyone in. Saying so up front is better than
  // letting the learner type a password and be told afterwards.
  if (!isSupabaseConfigured()) {
    return (
      <AuthCard
        notice={{ tone: 'danger', text: strings.errors.notConfigured }}
        title={strings.signInTitle}
        footer={<GuestLink />}
      >
        <p className="muted small">{APP_STRINGS.errors.notConfiguredBody}</p>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      busy={busy}
      footer={
        <>
          <p>
            {strings.needAccount}{' '}
            <Link href={`/sign-up${nextQuery(next)}`}>{strings.signUpTitle}</Link>
          </p>
          <p>
            <Link href={`/forgot-password${nextQuery(next)}`}>{strings.forgotLink}</Link>
          </p>
          <GuestLink />
        </>
      }
      lede={searchParams.get('next') === null ? strings.lede : strings.nextHint}
      notice={notice}
      onSubmit={() => void submit()}
      submitLabel={strings.signIn}
      title={strings.signInTitle}
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
        autoComplete="current-password"
        id="password"
        label={strings.password}
        onChange={(event) => setPassword(event.target.value)}
        required
        type="password"
        value={password}
      />
    </AuthCard>
  )
}

/**
 * Carry `?next=` through to the other auth screens.
 *
 * A learner who arrived via a middleware redirect and then chooses "create an account"
 * should still end up where they were heading. `destinationAfterSignIn` has already
 * validated `next`, so this re-encodes a known-safe pathname rather than forwarding raw
 * input — and it is omitted entirely when the fallback applied, so the URL does not grow a
 * parameter that means nothing.
 */
function nextQuery(next: string): string {
  return next === '/lab' ? '' : `?next=${encodeURIComponent(next)}`
}

/** The way out for a learner who does not want an account (§5.1: guest must work). */
function GuestLink() {
  return (
    <p>
      <Link href="/experiments">{APP_STRINGS.auth.continueAsGuest}</Link>
    </p>
  )
}
