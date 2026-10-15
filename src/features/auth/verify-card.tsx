'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { APP_STRINGS } from '@/content/index.js'
import { AuthCard, type AuthNotice } from '@/features/auth/auth-card.js'

export function VerifyCard() {
  const status = useSearchParams().get('status')
  const strings = APP_STRINGS.auth
  const unavailable = status === 'not_configured'
  const success = status === 'ok'
  const notice: AuthNotice = unavailable ? null : success ? { tone: 'ok', text: strings.verifyOkBody } : { tone: 'danger', text: strings.verifyFailedBody }
  return <AuthCard mode="verify" unavailable={unavailable} title={success ? strings.verifyOkTitle : unavailable ? strings.verifyTitle : strings.verifyFailedTitle} notice={notice} footer={<>
    {success ? <Link className="btn auth-submit" href="/lab">Về phòng lab</Link> : <p><Link href="/sign-in">Đăng nhập</Link> · <Link href="/sign-up">Đăng ký tài khoản</Link></p>}
    <Link className="auth-guest-link" href="/experiments">{strings.continueAsGuest}</Link>
  </>}><p>{success ? 'Bạn có thể mở phòng lab và bắt đầu một lượt thực hành.' : 'Nếu liên kết không dùng được, hãy yêu cầu gửi lại email xác minh hoặc liên kết đặt lại mật khẩu.'}</p><Link href="/forgot-password">Đặt lại mật khẩu</Link></AuthCard>
}
