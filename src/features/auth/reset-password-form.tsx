'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { APP_STRINGS } from '@/content/index.js'
import { createSupabaseBrowserClient } from '@/infrastructure/supabase/browser.js'
import { AuthCard, AuthField, type AuthNotice } from '@/features/auth/auth-card.js'
import { describeAuthError } from '@/features/auth/errors.js'
import { isSupabaseConfigured } from '@/features/auth/is-configured.js'

const MIN_PASSWORD_LENGTH = 8

export function ResetPasswordForm() {
  const router = useRouter()
  const strings = APP_STRINGS.auth
  const configured = isSupabaseConfigured()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<AuthNotice>(null)
  const [sessionState, setSessionState] = useState<'checking' | 'valid' | 'invalid'>(configured ? 'checking' : 'invalid')
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!configured) return
    let cancelled = false
    void (async () => {
      try {
        const { data, error } = await createSupabaseBrowserClient().auth.getUser()
        if (cancelled) return
        const valid = error === null && data.user !== null
        setSessionState(valid ? 'valid' : 'invalid')
        if (!valid) setNotice({ tone: 'danger', text: strings.verifyFailedBody })
      } catch {
        if (!cancelled) {
          setSessionState('invalid')
          setNotice({ tone: 'danger', text: 'Chưa kiểm tra được liên kết. Vui lòng mở lại hoặc yêu cầu một liên kết mới.' })
        }
      }
    })()
    return () => { cancelled = true }
  }, [configured, strings.verifyFailedBody])

  const submit = async () => {
    if (password !== confirm) { setNotice({ tone: 'danger', text: strings.errors.passwordMismatch }); return }
    if (password.length < MIN_PASSWORD_LENGTH) { setNotice({ tone: 'danger', text: strings.errors.weakPassword }); return }
    setBusy(true)
    setNotice(null)
    try {
      const supabase = createSupabaseBrowserClient()
      const { data, error: sessionError } = await supabase.auth.getUser()
      if (sessionError !== null || data.user === null) {
        setSessionState('invalid')
        setNotice({ tone: 'danger', text: strings.verifyFailedBody })
        return
      }
      const { error } = await supabase.auth.updateUser({ password })
      if (error !== null) setNotice({ tone: 'danger', text: describeAuthError(error) })
      else {
        setDone(true)
        router.replace('/lab')
        router.refresh()
      }
    } catch (cause) { setNotice({ tone: 'danger', text: describeAuthError(cause) }) }
    finally { setBusy(false) }
  }

  if (done) return <AuthCard mode="reset-password" title="Mật khẩu đã được cập nhật" notice={{ tone: 'ok', text: APP_STRINGS.account.messages.passwordChanged }}><Link href="/lab">Về phòng lab</Link></AuthCard>

  return <AuthCard mode="reset-password" title={strings.resetTitle} lede="Đặt mật khẩu mới để tiếp tục sử dụng tài khoản." notice={notice} busy={busy} busyLabel="Đang lưu mật khẩu…" unavailable={!configured} disabled={sessionState !== 'valid'} onSubmit={() => void submit()} submitLabel={strings.savePassword} footer={<Link href="/forgot-password">Yêu cầu liên kết đặt lại mới</Link>}>
    {configured && sessionState === 'checking' && <p className="auth-checking" role="status">Đang kiểm tra liên kết…</p>}
    <AuthField id="password" label={strings.newPassword} type="password" autoComplete="new-password" placeholder="Mật khẩu mới" minLength={MIN_PASSWORD_LENGTH} hint={strings.passwordHint} value={password} onChange={event => setPassword(event.target.value)} required />
    <AuthField id="confirm" label={strings.confirmNewPassword} type="password" autoComplete="new-password" placeholder="Nhập lại mật khẩu mới" minLength={MIN_PASSWORD_LENGTH} value={confirm} onChange={event => setConfirm(event.target.value)} required />
  </AuthCard>
}
