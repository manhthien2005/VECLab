import type { Metadata } from 'next'
import { APP_STRINGS } from '@/content/index.js'
import { currentStorageMode } from '@/features/auth/session.js'
import { LabClient } from '@/features/learner-lab/lab-client.js'

/**
 * `/lab` — My Lab (docs/web-application-scope.md §4.5).
 *
 * Middleware redirects a signed-out visitor here to `/sign-in`. That redirect is a
 * convenience, not the access control: this screen is reachable directly, and it shows only
 * what the session it is handed can read — a guest's own IndexedDB attempts, or a signed-in
 * learner's account attempts. Nothing here trusts the route group name, which is not part of
 * the URL and cannot be an auth boundary (docs/system-architecture.md).
 *
 * Reads cookies to pick the storage mode, so it renders per request: the same URL lists
 * different attempts for a guest and for a signed-in learner, and a cached render would show
 * one of them the other's.
 */

export const metadata: Metadata = {
  title: APP_STRINGS.lab.title,
  // A per-learner list. Indexing it would put one learner's attempts in a shared index.
  robots: { index: false, follow: false },
}

export default async function LabPage() {
  const storageMode = await currentStorageMode()

  return <LabClient storageMode={storageMode} />
}
