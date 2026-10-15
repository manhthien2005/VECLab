'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { APP_STRINGS } from '@/content/index.js'
import { createSupabaseBrowserClient } from '@/infrastructure/supabase/browser.js'
import { AuthCard, AuthField, type AuthNotice } from '@/features/auth/auth-card.js'
import { describeAuthError } from '@/features/auth/errors.js'
import { authCallbackUrl, destinationAfterSignIn } from '@/features/auth/redirect.js'
import { isSupabaseConfigured } from '@/features/auth/is-configured.js'

export function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const strings = APP_STRINGS.auth
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<AuthNotice>(null)
  const [needsVerification, setNeedsVerification] = useState(false)
  const next = destinationAfterSignIn(searchParams.get('next'))
  const query = next === '/lab' ? '' : `?next=${encodeURIComponent(next)}`

  const submit = async () => {
    setBusy(true)
    setNotice(null)
    setNeedsVerification(false)
    try {
      const supabase = createSupabaseBrowserClient()
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (error !== null) {
        setNeedsVerification(error.code === 'email_not_confirmed')
        setNotice({ tone: 'danger', text: describeAuthError(error) })
      } else {
        router.replace(next)
        router.refresh()
      }
    } catch (cause) {
      setNotice({ tone: 'danger', text: describeAuthError(cause) })
    } finally { setBusy(false) }
  }

  const resend = async () => {
    setBusy(true)
    setNotice(null)
    try {
      const { error } = await createSupabaseBrowserClient().auth.resend({ type: 'signup', email: email.trim(), options: { emailRedirectTo: authCallbackUrl(globalThis.location.origin, next) } })
      setNotice(error ? { tone: 'danger', text: describeAuthError(error) } : { tone: 'ok', text: strings.signedUpBody })
    } catch (cause) { setNotice({ tone: 'danger', text: describeAuthError(cause) }) }
    finally { setBusy(false) }
  }

  return (
    <AuthCard mode="sign-in" next={next} busy={busy} busyLabel="Đang xử lý…" unavailable={!isSupabaseConfigured()} title={strings.signInTitle} lede={searchParams.get('next') === null ? 'Đăng nhập để mở các lượt thực hành đã lưu trong tài khoản.' : strings.nextHint} notice={notice} onSubmit={() => void submit()} submitLabel={strings.signIn} footer={<>
      {needsVerification && <button className="auth-text-button" disabled={busy} type="button" onClick={() => void resend()}>{strings.resendVerification}</button>}
      <p>{strings.needAccount} <Link href={`/sign-up${query}`}>Đăng ký tài khoản</Link></p>
      <Link className="auth-guest-link" href="/experiments">{strings.continueAsGuest}</Link>
    </>}>
      <AuthField id="email" label={strings.email} type="email" autoComplete="email" placeholder="ten@vidu.com" value={email} onChange={event => setEmail(event.target.value)} required />
      <AuthField id="password" label={strings.password} type="password" autoComplete="current-password" placeholder="Nhập mật khẩu" value={password} onChange={event => setPassword(event.target.value)} action={<Link href={`/forgot-password${query}`}>{strings.forgotLink}</Link>} required />
    </AuthCard>
  )
}
