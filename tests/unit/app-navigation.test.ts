import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const session = vi.hoisted(() => ({ signedIn: false }))
vi.mock('@/features/auth/use-signed-in.js', () => ({ useSignedIn: () => session.signedIn }))
vi.mock('next/navigation', () => ({ usePathname: () => '/experiments' }))

import { AppFooterNav, AppNav } from '@/app/app-nav.js'

describe('account navigation presentation', () => {
  beforeEach(() => { session.signedIn = false })

  it('offers a guest the sign-in route without a signed-in badge', () => {
    const html = renderToStaticMarkup(createElement(AppNav))
    const accountLink = html.match(/<a[^>]*class="account-link"[^>]*>/)?.[0]
    expect(accountLink).toContain('href="/sign-in"')
    expect(accountLink).toContain('aria-label="Đăng nhập — chưa đăng nhập"')
    expect(html).not.toContain('account-status-dot')
  })

  it('offers a signed-in learner their account and a visible state marker', () => {
    session.signedIn = true
    const html = renderToStaticMarkup(createElement(AppNav))
    const accountLink = html.match(/<a[^>]*class="account-link"[^>]*>/)?.[0]
    expect(accountLink).toContain('href="/account"')
    expect(accountLink).toContain('aria-label="Tài khoản — đã đăng nhập"')
    expect(html).toContain('account-status-dot')
    expect(html).not.toContain('href="/sign-in"')
  })

  it('retains personal destinations in the grouped signed-in footer', () => {
    session.signedIn = true
    const html = renderToStaticMarkup(createElement(AppFooterNav))
    for (const href of ['/experiments', '/evidence', '/lab', '/compare', '/account']) {
      expect(html).toContain('href="' + href + '"')
    }
    expect(html).not.toContain('href="/sign-in"')
  })
})
