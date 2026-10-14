import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AuthCard, AuthField } from '@/features/auth/auth-card.js'
import { SignInForm } from '@/features/auth/sign-in-form.js'
import { SignUpForm } from '@/features/auth/sign-up-form.js'
import { ForgotPasswordForm } from '@/features/auth/forgot-password-form.js'
import { describeAuthError } from '@/features/auth/errors.js'

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }), useSearchParams: () => new URLSearchParams('next=/account') }))
afterEach(() => vi.unstubAllEnvs())

function configure(enabled: boolean) {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', enabled ? 'http://127.0.0.1:54321' : '')
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', enabled ? 'sb_publishable_unit_test' : '')
}

describe('authentication forms', () => {
  it('keeps all forms and navigation visible while account service is unavailable', () => {
    configure(false)
    for (const Component of [SignInForm, SignUpForm, ForgotPasswordForm]) {
      const html = renderToStaticMarkup(createElement(Component))
      expect(html).toContain('id="email"')
      expect(html).toContain('Chức năng tài khoản hiện chưa sẵn sàng')
      expect(html).toContain('href="/sign-up')
      expect(html).toContain('href="/sign-in')
      expect(html).toMatch(/<button[^>]+disabled=""[^>]+type="submit"/)
      expect(html).not.toContain('NEXT_PUBLIC_')
    }
  })

  it('enables forms from the two public environment variables, preserves autofill and the safe destination', () => {
    configure(true)
    const signIn = renderToStaticMarkup(createElement(SignInForm))
    expect(signIn).toContain('autoComplete="current-password"')
    expect(signIn).toContain('/sign-up?next=%2Faccount')
    expect(signIn).toContain('/forgot-password?next=%2Faccount')
    expect(signIn).not.toContain('disabled=""')
    const signUp = renderToStaticMarkup(createElement(SignUpForm))
    expect(signUp).toContain('autoComplete="new-password"')
    expect(signUp).toContain('minLength="8"')
    expect(signUp).toContain('id="confirm"')
    expect(signUp).not.toContain('disabled=""')
    expect(renderToStaticMarkup(createElement(ForgotPasswordForm))).not.toContain('disabled=""')
  })

  it('uses a per-field password toggle and displays failure notices instead of claiming success', () => {
    const field = renderToStaticMarkup(createElement(AuthField, { id: 'confirm', label: 'Nhập lại mật khẩu', type: 'password' }))
    expect(field).toContain('aria-controls="confirm"')
    expect(field).toContain('aria-label="Hiện mật khẩu"')
    const html = renderToStaticMarkup(createElement(AuthCard, { title: 'Đã gửi email xác minh', notice: { tone: 'danger', text: 'Quá nhiều yêu cầu' } }, null))
    expect(html).toContain('role="alert"')
    expect(html).toContain('Quá nhiều yêu cầu')
  })

  it('distinguishes an unconfirmed email from wrong credentials and hides upstream messages', () => {
    configure(true)
    expect(describeAuthError({ code: 'email_not_confirmed' })).toContain('Email chưa được xác minh')
    expect(describeAuthError({ code: 'invalid_credentials', message: 'private upstream detail' })).toBe('Email hoặc mật khẩu không đúng.')
    expect(describeAuthError({ status: 429 })).toContain('Quá nhiều yêu cầu')
  })
})
