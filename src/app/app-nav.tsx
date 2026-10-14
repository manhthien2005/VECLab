'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSignedIn } from '@/features/auth/use-signed-in.js'
import { footerNavItems, headerNavItems } from './nav-items.js'
import { ThemeToggle } from './theme-toggle.js'

/**
 * Primary navigation.
 *
 * A client component for three reasons: `aria-current="page"` needs the live
 * pathname, the narrow-viewport panel is a disclosure with open state, and
 * compare/account appear only after the browser knows there is a session —
 * so the root layout can stay static for guests.
 *
 * Route groups never appear here or in hrefs — docs/system-architecture.md
 * forbids using a group name as an auth guard.
 *
 * WHY A DISCLOSURE BELOW 70rem. Guest destinations plus the brand already
 * strain a phone row; signed-in extras would wrap. Collapsing them keeps the
 * header one row tall without removing a destination, which §10.2 requires.
 */

export function AppNav() {
  const pathname = usePathname()
  const panelId = useId()
  const navRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const signedIn = useSignedIn()
  const items = headerNavItems(signedIn)

  const [openedOn, setOpenedOn] = useState<string | null>(null)
  const open = openedOn === pathname

  const setOpen = useCallback(
    (next: boolean) => setOpenedOn(next ? pathname : null),
    [pathname],
  )

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setOpenedOn(null)
        toggleRef.current?.focus()
      }
    }
    const onPointerDown = (event: PointerEvent): void => {
      if (!(event.target instanceof Node)) return
      if (navRef.current !== null && !navRef.current.contains(event.target)) {
        setOpenedOn(null)
      }
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [open])

  return (
    <div className="header-tools" ref={navRef}>
      <nav className="header-navigation" aria-label="Điều hướng chính">
        <button
          ref={toggleRef}
          className="btn btn-ghost nav-toggle"
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={open ? 'Đóng menu điều hướng' : 'Mở menu điều hướng'}
          onClick={() => setOpen(!open)}
        >
          <span className="nav-toggle-bars" aria-hidden="true" />
        </button>

        <ul className="app-nav" id={panelId} data-open={open ? 'true' : 'false'}>
          {items.map((item) => {
            const isCurrent =
              pathname === item.href || pathname.startsWith(`${item.href}/`)

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  {...(isCurrent ? { 'aria-current': 'page' as const } : {})}
                >
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
      <div className="header-actions">
        <ThemeToggle />
        <Link
          className="account-link"
          href={signedIn ? '/account' : '/sign-in'}
          aria-label={signedIn ? 'Tài khoản — đã đăng nhập' : 'Đăng nhập — chưa đăng nhập'}
          title={signedIn ? 'Đã đăng nhập · Mở tài khoản' : 'Chưa đăng nhập'}
        >
          <span className="account-icon" data-signed-in={signedIn ? 'true' : 'false'}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
              <circle cx="12" cy="8" r="3.5" />
              <path d="M5 21v-2a7 7 0 0 1 14 0v2" strokeLinecap="round" />
            </svg>
            {signedIn ? <span className="account-status-dot" aria-hidden="true" /> : null}
          </span>
          <span className="account-label">{signedIn ? 'Tài khoản' : 'Đăng nhập'}</span>
        </Link>
      </div>
    </div>
  )
}

export function AppFooterNav() {
  const signedIn = useSignedIn()
  const items = footerNavItems(signedIn)
  const groups = [
    { title: 'Khám phá', items: items.filter((item) => item.href === '/experiments' || item.href === '/evidence') },
    { title: 'Cá nhân', items: items.filter((item) => item.href !== '/experiments' && item.href !== '/evidence') },
  ]

  return (
    <nav aria-label="Liên kết chân trang" className="footer-nav">
      {groups.map((group) => (
        <div className="footer-nav-group" key={group.title}>
          <h2>{group.title}</h2>
          <ul>
            {group.items.map((item) => (
              <li key={item.href}><Link href={item.href}>{item.label}</Link></li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}
