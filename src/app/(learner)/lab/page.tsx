import type { Metadata } from 'next'
import { currentStorageMode } from '@/features/auth/session.js'
import { LabClient } from '@/features/learner-lab/lab-client.js'

/**
 * `/lab` — My Lab (docs/web-application-scope.md §4.5).
 *
 * Public. A guest's IndexedDB attempts and a signed-in learner's account
 * attempts share this URL; `currentStorageMode` picks which store to read.
 * Nothing here trusts the route group name (docs/system-architecture.md).
 *
 * Reads cookies to pick the storage mode, so it renders per request: the same URL lists
 * different attempts for a guest and for a signed-in learner, and a cached render would show
 * one of them the other's.
 */

export const metadata: Metadata = {
  title: 'Lab thực hành',
  // A per-learner list. Indexing it would put one learner's attempts in a shared index.
  robots: { index: false, follow: false },
}

export default async function LabPage() {
  const storageMode = await currentStorageMode()

  return <LabClient key={storageMode} storageMode={storageMode} />
}
