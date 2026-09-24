'use client'

import { useCallback, useSyncExternalStore } from 'react'
import { THEME_STORAGE_KEY, type Theme } from './theme-storage.js'

/**
 * Light/dark switch.
 *
 * THREE states, not two. "system" is the default and follows the OS, which is what most
 * learners actually want; choosing light or dark stamps `data-theme` on `<html>` and pins
 * it. The CSS is written so the OS preference applies only while no explicit choice is
 * stamped, which is why this component writes an attribute rather than a class.
 *
 * The attribute is applied EARLIER than this component mounts — by the blocking script in
 * `layout.tsx` — so the page never paints the wrong theme first. This component handles
 * only the change and the label.
 *
 * WHY `useSyncExternalStore` AND NOT AN EFFECT. The theme lives in two places React does
 * not own: a DOM attribute and the OS media query. Mirroring them into `useState` from an
 * effect means rendering once with a guessed value and then again with the real one —
 * cascading renders that React's own lint rule (`react-hooks/set-state-in-effect`) exists
 * to prevent. `useSyncExternalStore` is the primitive for exactly this shape: subscribe to
 * the external source, read it synchronously, and get a server snapshot for the pass where
 * neither source exists.
 */

/** Broadcast when this component pins a theme, so the snapshot is re-read immediately. */
const THEME_CHANGE_EVENT = 'veclab:theme-change'

/** What the document is currently showing, regardless of how it was decided. */
function readTheme(): Theme {
  const stamped = document.documentElement.dataset.theme
  if (stamped === 'light' || stamped === 'dark') return stamped

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Two sources to watch.
 *
 * The media query covers a laptop switching to dark at sunset while the learner has NOT
 * pinned a choice. The custom event covers this component's own writes: a DOM attribute
 * change fires nothing on its own, so without it the icon would not flip until the next
 * unrelated render.
 */
function subscribe(onChange: () => void): () => void {
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  media.addEventListener('change', onChange)
  window.addEventListener(THEME_CHANGE_EVENT, onChange)

  return () => {
    media.removeEventListener('change', onChange)
    window.removeEventListener(THEME_CHANGE_EVENT, onChange)
  }
}

/**
 * The server pass has no document and no media query.
 *
 * Returning 'light' unconditionally is safe because the markup this produces is identical
 * either way apart from which icon is inside the button, and `useSyncExternalStore`
 * re-reads on the client immediately after hydration.
 */
function serverSnapshot(): Theme {
  return 'light'
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, readTheme, serverSnapshot)

  const toggle = useCallback(() => {
    const next: Theme = readTheme() === 'dark' ? 'light' : 'dark'

    document.documentElement.dataset.theme = next

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      // Storage unavailable (private window, blocked site data). The theme still applies
      // to this page; it just will not be remembered. Nothing to tell the learner about.
    }

    window.dispatchEvent(new Event(THEME_CHANGE_EVENT))
  }, [])

  const isDark = theme === 'dark'
  const label = isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'

  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}

/* Inline SVG rather than an icon package: two icons do not justify a dependency that
   ships hundreds, and `currentColor` makes them follow the button's own hover state. */

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path
        strokeLinecap="round"
        d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
      />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"
      />
    </svg>
  )
}
