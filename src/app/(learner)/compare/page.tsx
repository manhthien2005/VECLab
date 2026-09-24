import type { Metadata } from 'next'
import { APP_STRINGS } from '@/content/index.js'
import { currentStorageMode } from '@/features/auth/session.js'
import { CompareClient } from '@/features/compare/compare-client.js'

/**
 * `/compare` — comparison of two attempts (docs/web-application-scope.md §4.8).
 *
 * This route was referenced by the primary navigation and guarded by middleware
 * (`LEARNER_PREFIXES` in `src/middleware.ts`) while no page existed for it, so every
 * learner who followed the "So sánh" link reached a 404. The comparability rules in
 * `src/features/compare/comparison.ts` were already written and unit-tested; only the
 * screen was missing.
 *
 * Thin, like the other attempt-backed routes: it decides the storage mode and hands it
 * over. The comparison cannot be rendered on the server because a guest's attempts live
 * in IndexedDB, and because §4.8 requires this screen to work in both storage modes with
 * the same rules.
 *
 * Reads cookies (through `currentStorageMode`), so it renders per request and cannot be
 * statically cached: the same URL shows local attempts to a guest and cloud attempts to a
 * signed-in learner.
 */

export const metadata: Metadata = {
  title: APP_STRINGS.compare.title,
  description: APP_STRINGS.compare.lede,
  // A comparison URL leads to two of one learner's runs; it is never indexable.
  robots: { index: false, follow: false },
}

export default async function ComparePage() {
  const storageMode = await currentStorageMode()

  return <CompareClient storageMode={storageMode} />
}
