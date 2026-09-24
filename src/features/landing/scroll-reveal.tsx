'use client'

import { useEffect } from 'react'

/**
 * Drives the `.reveal` sections on the landing page: each one lifts into place as it
 * enters the viewport, instead of the whole page appearing at once.
 *
 * Marks a section pending (hidden, per the `.reveal.is-pending` rule in globals.css) only
 * if it is not already on screen when this runs, so content already visible above the
 * fold on load never flashes hidden-then-shown. `IntersectionObserver` then reveals each
 * section once and stops watching it — a landing page tells its story once per visit, not
 * every time a learner scrolls back up past a section.
 *
 * A tiny client leaf next to a Server Component page (§3.A of the frontend taste guide):
 * it renders nothing itself and holds no state, so the page above it stays statically
 * renderable. `prefers-reduced-motion` needs no handling here — the CSS transition
 * collapses to near-zero globally (globals.css §"Reduced motion"), so this still marks
 * sections visible, just without the animated lift.
 */
/** Nothing may stay hidden past this, whether or not it ever crossed the viewport. */
const FALLBACK_REVEAL_MS = 2500

export function ScrollReveal() {
  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>('.reveal')
    if (sections.length === 0) return

    const reveal = (el: Element) => el.classList.remove('is-pending')

    if (typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          reveal(entry.target)
          observer.unobserve(entry.target)
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.1 },
    )

    const pending: Element[] = []
    for (const section of sections) {
      const rect = section.getBoundingClientRect()
      const alreadyVisible = rect.top < window.innerHeight && rect.bottom > 0
      if (alreadyVisible) continue

      section.classList.add('is-pending')
      pending.push(section)
      observer.observe(section)
    }

    /**
     * A hard floor under the observer, not a normal code path.
     *
     * `IntersectionObserver` can miss a section it should have caught — a viewport resize
     * mid-animation (exactly what a full-page screenshot tool does), a layout shift from a
     * late-loading font, a browser quirk. None of those are reasons a section should stay
     * invisible forever, so nothing here is allowed to depend solely on the observer firing.
     */
    const fallback = window.setTimeout(() => {
      for (const el of pending) reveal(el)
    }, FALLBACK_REVEAL_MS)

    return () => {
      observer.disconnect()
      window.clearTimeout(fallback)
    }
  }, [])

  return null
}
