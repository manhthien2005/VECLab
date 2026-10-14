'use client'

import { useState, type ReactNode, type InputHTMLAttributes } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { APP_STRINGS } from '@/content/index.js'
import { FlaskIcon, ArrowRightIcon, ShieldCheckIcon, CheckCircleIcon, WarningIcon } from '@/features/landing/icons.js'
import { destinationAfterSignIn } from '@/features/auth/redirect.js'

export type AuthNotice = { tone: 'danger' | 'ok'; text: string } | null

type AuthCardProps = {
  title: string
  lede?: string
  notice: AuthNotice
  children?: ReactNode
  submitLabel?: string
  busyLabel?: string
  onSubmit?: () => void
  busy?: boolean
  disabled?: boolean
  unavailable?: boolean
  footer?: ReactNode
  mode?: 'sign-in' | 'sign-up' | 'forgot-password' | 'reset-password' | 'verify'
  next?: string
}

/** Shared frame; the individual forms own their values and authentication requests. */
export function AuthCard({ title, lede, notice, children, submitLabel, busyLabel = 'Đang xử lý…', onSubmit, busy = false, disabled = false, unavailable = false, footer, mode = 'sign-in', next }: AuthCardProps) {
  const canSubmit = onSubmit !== undefined && submitLabel !== undefined
  const destination = destinationAfterSignIn(next)
  const query = destination === '/lab' ? '' : `?next=${encodeURIComponent(destination)}`
  return (
    <div className="auth-shell">
      <AuthBackground />
      <div className="auth-layout">
        <aside className="auth-story" aria-label="Tài khoản VECLab">
          <Link className="auth-story-brand" href="/"><FlaskIcon />VECLab</Link>
          <h2>Tiếp tục bài đang làm.<br />Xem lại kết quả đã lưu.</h2>
          <p>Tài khoản giúp lưu các lượt thực hành và mở lại trên thiết bị khác.</p>
          <div className="auth-story-visual"><Image src="/assets/lab-invitation.webp" alt="" fill sizes="(max-width: 48rem) 0px, 40vw" /></div>
          <div className="auth-story-note"><ShieldCheckIcon /><p>Chưa cần tài khoản? Bạn vẫn có thể thực hành và lưu tiến độ trên trình duyệt này.</p></div>
          <Link className="auth-story-guest" href="/experiments">Khám phá thí nghiệm <ArrowRightIcon /></Link>
        </aside>
        <div className="auth-card">
          <nav className="auth-mode-nav" aria-label="Đăng nhập và đăng ký">
            <Link href={`/sign-in${query}`} aria-current={mode === 'sign-in' ? 'page' : undefined}>Đăng nhập</Link>
            <Link href={`/sign-up${query}`} aria-current={mode === 'sign-up' ? 'page' : undefined}>Đăng ký</Link>
          </nav>
          <header className="auth-card-heading"><h1>{title}</h1>{lede !== undefined && <p>{lede}</p>}</header>
          {unavailable && <div className="auth-notice is-unavailable" role="status"><WarningIcon /><p>{APP_STRINGS.auth.errors.notConfigured}</p></div>}
          {notice !== null && <div className={`auth-notice is-${notice.tone}`} role={notice.tone === 'danger' ? 'alert' : 'status'}>{notice.tone === 'ok' ? <CheckCircleIcon /> : <WarningIcon />}<p>{notice.text}</p></div>}
          {canSubmit ? (
            <form className="auth-form" aria-busy={busy} onSubmit={event => { event.preventDefault(); if (!busy && !disabled && !unavailable) onSubmit() }}>
              <fieldset disabled={busy || disabled || unavailable}><legend className="visually-hidden">{title}</legend>{children}</fieldset>
              <button className="btn auth-submit" disabled={busy || disabled || unavailable} type="submit">{busy ? busyLabel : submitLabel}{!busy && <ArrowRightIcon />}</button>
            </form>
          ) : <div className="auth-result">{children}</div>}
          {footer !== undefined && <footer className="auth-card-footer">{footer}</footer>}
        </div>
      </div>
    </div>
  )
}

export function AuthField({ id, label, hint, action, type, ...input }: {
  id: string
  label: string
  hint?: string
  action?: ReactNode
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'id'>) {
  const [revealed, setRevealed] = useState(false)
  const password = type === 'password'
  return (
    <div className="auth-field">
      <div className="auth-field-label"><label htmlFor={id}>{label}</label>{action}</div>
      <div className={`auth-input-wrap${password ? ' has-password-toggle' : ''}`}>
        <input {...input} aria-describedby={hint === undefined ? undefined : `${id}-hint`} id={id} type={password && revealed ? 'text' : type} />
        {password && <button className="auth-password-toggle" type="button" aria-label={revealed ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} aria-pressed={revealed} aria-controls={id} onClick={() => setRevealed(value => !value)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" />{revealed && <path strokeLinecap="round" d="m4 3 16 18" />}</svg></button>}
      </div>
      {hint !== undefined && <span className="auth-field-hint" id={`${id}-hint`}>{hint}</span>}
    </div>
  )
}

function AuthBackground() {
  return <svg className="auth-background" aria-hidden="true" focusable="false" width="1400" height="900" viewBox="0 0 1400 900" preserveAspectRatio="xMidYMid slice" fill="none"><g stroke="currentColor" opacity="0.17"><path d="m1150 60 36-21 36 21v42l-36 21-36-21Zm72 0 36-21 36 21v42l-36 21-36-21Zm-36 63 36-21 36 21v42l-36 21-36-21ZM1300 180v140l-44 44h-70M60 460v170l52 52v80H28m1154-67 30-17 30 17v34l-30 17-30-17Z" /><circle cx="1186" cy="364" r="4" /><circle cx="28" cy="762" r="4" /><path d="M280 90h130m-80-10v20m520 680h100" /></g></svg>
}
