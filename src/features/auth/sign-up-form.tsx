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

const MIN_PASSWORD_LENGTH = 8

export function SignUpForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const strings = APP_STRINGS.auth
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<AuthNotice>(null)
  const [sent, setSent] = useState(false)
  const next = destinationAfterSignIn(searchParams.get('next'))
  const signInPath = `/sign-in${next === '/lab' ? '' : `?next=${encodeURIComponent(next)}`}`

  const submit = async () => {
    if (password !== confirm) { setNotice({ tone: 'danger', text: strings.errors.passwordMismatch }); return }
    if (password.length < MIN_PASSWORD_LENGTH) { setNotice({ tone: 'danger', text: strings.errors.weakPassword }); return }
    setBusy(true)
    setNotice(null)
    try {
      const { data, error } = await createSupabaseBrowserClient().auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: authCallbackUrl(globalThis.location.origin, next) } })
      if (error !== null) setNotice({ tone: 'danger', text: describeAuthError(error) })
      else if (data.session !== null) {
        // Respect projects configured without email confirmation; do not claim an email was sent.
        router.replace(next)
        router.refresh()
      } else setSent(true)
    } catch (cause) { setNotice({ tone: 'danger', text: describeAuthError(cause) }) }
    finally { setBusy(false) }
  }

  const resend = async () => {
    setBusy(true)
    setNotice(null)
    try {
      const { error } = await createSupabaseBrowserClient().auth.resend({ type: 'signup', email: email.trim(), options: { emailRedirectTo: authCallbackUrl(globalThis.location.origin, next) } })
      setNotice(error === null ? { tone: 'ok', text: strings.signedUpBody } : { tone: 'danger', text: describeAuthError(error) })
    } catch (cause) { setNotice({ tone: 'danger', text: describeAuthError(cause) }) }
    finally { setBusy(false) }
  }

  if (sent) return <AuthCard mode="sign-up" next={next} busy={busy} busyLabel="Đang gửi lại…" title={strings.signedUpTitle} notice={notice ?? { tone: 'ok', text: strings.signedUpBody }} onSubmit={() => void resend()} submitLabel={strings.resendVerification} footer={<Link href={signInPath}>Quay lại đăng nhập</Link>}><p>Kiểm tra cả mục thư rác. Bạn có thể yêu cầu gửi lại nếu chưa nhận được email.</p></AuthCard>

  return (
    <AuthCard mode="sign-up" next={next} busy={busy} busyLabel="Đang tạo tài khoản…" unavailable={!isSupabaseConfigured()} title="Tạo tài khoản" lede="Dùng email của bạn để lưu lượt thực hành và xem lại kết quả." notice={notice} onSubmit={() => void submit()} submitLabel={strings.signUp} footer={<><p>{strings.haveAccount} <Link href={signInPath}>Đăng nhập</Link></p><Link className="auth-guest-link" href="/experiments">{strings.continueAsGuest}</Link></>}>
      <AuthField id="email" label={strings.email} type="email" autoComplete="email" placeholder="ten@vidu.com" value={email} onChange={event => setEmail(event.target.value)} required />
      <AuthField id="password" label={strings.password} type="password" autoComplete="new-password" placeholder="Tạo mật khẩu" minLength={MIN_PASSWORD_LENGTH} hint={strings.passwordHint} value={password} onChange={event => setPassword(event.target.value)} required />
      <AuthField id="confirm" label={strings.confirmPassword} type="password" autoComplete="new-password" placeholder="Nhập lại mật khẩu" minLength={MIN_PASSWORD_LENGTH} value={confirm} onChange={event => setConfirm(event.target.value)} required />
    </AuthCard>
  )
}
