'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { APP_STRINGS } from '@/content/index.js'

/**
 * Primary navigation.
 *
 * A client component for two reasons: marking the current page with
 * `aria-current="page"` needs the live pathname (`usePathname` is a client hook, and a
 * root layout is a Server Component that receives no pathname), and the narrow-viewport
 * panel is a disclosure with open state.
 *
 * Route groups never appear here or in hrefs — docs/system-architecture.md forbids using
 * a group name as an auth guard, and group folders are not part of the URL anyway.
 *
 * WHY A DISCLOSURE BELOW 60rem. The five destinations plus the brand do not fit on one
 * row on a phone; they used to wrap, which doubled the sticky header's height and ate a
 * quarter of a 320px-tall viewport on every scroll. Collapsing them keeps the header one
 * row tall without removing a destination, which §10.2 requires.
 */

type NavItem = {
  href: string
  label: string
}

/**
 * The five route areas a learner can navigate to directly.
 *
 * `/simulate/[scenarioKey]`, `/attempts/[attemptId]` and `/reports/[attemptId]` are
 * deliberately absent: they are reached FROM the catalog or the lab, not by guessing an
 * id, and an attempt id is not something to hand-type.
 *
 * Labels come from the content bundle rather than being typed here, so navigation wording
 * lives with the rest of the copy (§9).
 */
const NAV_ITEMS: readonly NavItem[] = [
  { href: '/experiments', label: APP_STRINGS.nav.experiments },
  { href: '/evidence', label: APP_STRINGS.nav.evidence },
  { href: '/lab', label: APP_STRINGS.nav.lab },
  { href: '/compare', label: APP_STRINGS.nav.compare },
  { href: '/account', label: APP_STRINGS.nav.account },
]

export function AppNav() {
  const pathname = usePathname()
  const panelId = useId()
  const navRef = useRef<HTMLElement>(null)

  /**
   * Open state, keyed by the route it was opened on.
   *
   * The panel must close when the learner picks a destination, and Next's client
   * navigation does not unmount this component — so something has to react to the
   * pathname changing. Storing WHICH route the panel was opened on makes "still open"
   * a derived value rather than an effect that pushes `false` after every navigation:
   * the moment `pathname` differs, `open` is false with no extra render.
   */
  const [openedOn, setOpenedOn] = useState<string | null>(null)
  const open = openedOn === pathname

  const setOpen = useCallback(
    (next: boolean) => setOpenedOn(next ? pathname : null),
    [pathname],
  )

  /**
   * Close on Escape and on a click outside.
   *
   * A panel that overlays the page must be dismissible without hitting the exact toggle
   * again — otherwise a mis-tap beside it leaves the content covered. Listeners are only
   * attached while open, so a closed nav costs nothing.
   *
   * Closes through `setOpenedOn(null)` rather than the `setOpen` wrapper: the wrapper is
   * rebuilt whenever `pathname` changes, which would re-subscribe both listeners on every
   * navigation, while React guarantees the raw setter is stable.
   */
  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setOpenedOn(null)
    }
    const onPointerDown = (event: PointerEvent): void => {
      if (!(event.target instanceof Node)) return
      if (navRef.current !== null && !navRef.current.contains(event.target)) setOpenedOn(null)
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

      {/*
        Always rendered, never conditionally mounted: above 60rem this IS the navigation
        and must be present regardless of `open`. `data-open` is what the narrow-viewport
        media query reads to collapse it, so one list serves both layouts and the links
        stay in the document for crawlers and for the keyboard.
      */}
      <ul className="app-nav" id={panelId} data-open={open ? 'true' : 'false'}>
        {NAV_ITEMS.map((item) => {
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
