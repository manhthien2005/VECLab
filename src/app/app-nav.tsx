'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSignedIn } from '@/features/auth/use-signed-in.js'
import { footerNavItems, headerNavItems } from './nav-items.js'

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
 * WHY A DISCLOSURE BELOW 60rem. Guest destinations plus the brand already
 * strain a phone row; signed-in extras would wrap. Collapsing them keeps the
 * header one row tall without removing a destination, which §10.2 requires.
 */

export function AppNav() {
  const pathname = usePathname()
  const panelId = useId()
  const navRef = useRef<HTMLElement>(null)
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
      if (event.key === 'Escape') setOpenedOn(null)
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
    <nav className="header-tools" aria-label="Điều hướng chính" ref={navRef}>
      <button
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
                {...(isCurrent ? { 'aria-current': 'page' as const } : {})}
              >
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export function AppFooterNav() {
  const signedIn = useSignedIn()
  const items = footerNavItems(signedIn)

  return (
    <nav aria-label="Liên kết chân trang" className="footer-nav">
      {items.map((item) => (
        <Link href={item.href} key={item.href}>
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
