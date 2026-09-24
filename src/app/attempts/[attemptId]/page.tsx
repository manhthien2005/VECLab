import type { Metadata } from 'next'
import { APP_STRINGS } from '@/content/index.js'
import { currentStorageMode } from '@/features/auth/session.js'
import { AttemptShell } from '@/features/reports/attempt-shell.js'

/**
 * `/attempts/[attemptId]` — one attempt, open in either storage mode.
 *
 * A SHARED shell with `/reports/[attemptId]`, as docs/system-architecture.md §14 requires:
 * the same component renders both, differing only in the `view` it is handed. One
 * implementation is what makes a guest report and a cloud report the same document —
 * §6.1 asks for exactly that, and two components would drift into disagreeing about the
 * same run.
 *
 * Not inside a route group, and deliberately not gated by middleware. The route is reachable
 * while signed out: a guest's attempts live in IndexedDB and only the browser can read them,
 * so the screen has to render for a guest and let the session decide where to look. The
 * route group name is not an auth boundary and is never used as one — the shell asks
 * `currentStorageMode()`, and an attempt the current mode cannot see renders as not found.
 *
 * Reads cookies, so it renders per request and cannot be cached: the same URL shows a
 * different document to a guest and to a signed-in learner.
 */

type AttemptPageProps = {
  params: Promise<{ attemptId: string }>
}

export const metadata: Metadata = {
  title: APP_STRINGS.lab.title,
  // The URL carries an attempt id, which identifies one learner's run. Indexing it would put
  // a per-learner document in a shared index.
  robots: { index: false, follow: false },
}

export default async function AttemptPage({ params }: AttemptPageProps) {
  const [{ attemptId }, storageMode] = await Promise.all([params, currentStorageMode()])

  return <AttemptShell attemptId={attemptId} storageMode={storageMode} view="attempt" />
}
