/**
 * Where the learner's theme choice is remembered.
 *
 * A PLAIN module — no `'use client'` — because both sides need the literal string:
 *
 *   * `layout.tsx` is a Server Component and inlines this key into the blocking script
 *     that applies the theme before first paint.
 *   * `theme-toggle.tsx` is a client component and writes the key on every toggle.
 *
 * The key lived in the toggle first, and the server layout imported it from there. Under
 * RSC that import yields a client reference rather than the string, so the bootstrap
 * script rendered as `localStorage.getItem(undefined)` — it never found a stored theme,
 * and a learner who chose dark got a white flash on every navigation, forever. Same shape
 * as the bug that made the workbench route 404; `tests/unit/server-client-boundary.test.ts`
 * now fails on either.
 */

export const THEME_STORAGE_KEY = 'veclab-theme'

/** The two themes a learner can pin. Absent means "follow the OS". */
export type Theme = 'light' | 'dark'
