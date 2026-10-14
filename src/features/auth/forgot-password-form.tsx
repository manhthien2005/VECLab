'use client'

import { useState } from 'react'
import Link from 'next/link'
import { APP_STRINGS } from '@/content/index.js'
import { createSupabaseBrowserClient } from '@/infrastructure/supabase/browser.js'
import { AuthCard, AuthField, type AuthNotice } from '@/features/auth/auth-card.js'
import { describeAuthError } from '@/features/auth/errors.js'
import { authCallbackUrl } from '@/features/auth/redirect.js'
import { isSupabaseConfigured } from '@/features/auth/is-configured.js'

export function ForgotPasswordForm() {
  const strings = APP_STRINGS.auth
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<AuthNotice>(null)
  const [sent, setSent] = useState(false)

  const submit = async () => {
    setBusy(true)
    setNotice(null)
    try {
      const { error } = await createSupabaseBrowserClient().auth.resetPasswordForEmail(email.trim(), { redirectTo: authCallbackUrl(globalThis.location.origin, '/reset-password') })
      if (error !== null) setNotice({ tone: 'danger', text: describeAuthError(error) })
      else setSent(true)
    } catch (cause) { setNotice({ tone: 'danger', text: describeAuthError(cause) }) }
    finally { setBusy(false) }
  }

  if (sent) return <AuthCard mode="forgot-password" title={strings.resetSentTitle} notice={{ tone: 'ok', text: strings.resetSentBody }} footer={<Link href="/sign-in">Quay lại đăng nhập</Link>}><p>Bạn chưa nhận được email? Kiểm tra thư rác hoặc <Link href="/forgot-password" onClick={() => setSent(false)}>gửi lại yêu cầu</Link>.</p></AuthCard>

  return <AuthCard mode="forgot-password" title={strings.forgotTitle} lede="Nhập email đã dùng để đăng ký. Chúng tôi sẽ gửi liên kết đặt mật khẩu mới nếu tài khoản tồn tại." busy={busy} busyLabel="Đang gửi yêu cầu…" unavailable={!isSupabaseConfigured()} notice={notice} onSubmit={() => void submit()} submitLabel={strings.sendReset} footer={<><Link href="/sign-in">Quay lại đăng nhập</Link><Link className="auth-guest-link" href="/experiments">{strings.continueAsGuest}</Link></>}><AuthField id="email" label={strings.email} type="email" autoComplete="email" placeholder="ten@vidu.com" value={email} onChange={event => setEmail(event.target.value)} required /></AuthCard>
}
