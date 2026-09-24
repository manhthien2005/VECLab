import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { APP_STRINGS } from '@/content/index.js'
import { currentStorageMode, isSupabaseConfigured } from '@/features/auth/session.js'
import { WORKBENCH_SCENARIO_KEY } from '@/features/simulation-workbench/scenario.js'
import { WorkbenchClient } from '@/features/simulation-workbench/workbench-client.js'

/**
 * The simulation workbench (docs/web-application-scope.md §4.6).
 *
 * The central screen of the product. It is deliberately thin: everything it renders comes
 * from `WorkbenchClient`, and everything it decides is these four things.
 *
 * NOT inside a route group. §4.6's guest flow requires that a learner can complete an
 * experiment without an account, so this route is public and the storage mode is derived
 * rather than gated. Middleware guards `/lab`, `/compare` and `/account`; it does not guard
 * this, and must not — gating it would make the guest path unreachable.
 *
 * Reads cookies (through `currentStorageMode`), so it renders per request. It cannot be
 * statically generated: the same URL shows local mode to a guest and cloud mode to a signed-
 * in learner, and a statically cached render would serve one of them the other's.
 */

type WorkbenchPageProps = {
  params: Promise<{ scenarioKey: string }>
  searchParams: Promise<{ attempt?: string | string[] }>
}

export async function generateMetadata({
  params,
}: WorkbenchPageProps): Promise<Metadata> {
  const { scenarioKey } = await params

  return {
    title:
      scenarioKey === WORKBENCH_SCENARIO_KEY
        ? APP_STRINGS.workbench.title
        : APP_STRINGS.workbench.notFoundTitle,
    // A simulation is never indexable: the page is per-learner state, and its URL carries
    // an attempt id. Crawling one would cache a learner's run.
    robots: { index: false, follow: false },
  }
}

export default async function WorkbenchPage({
  params,
  searchParams,
}: WorkbenchPageProps) {
  const [{ scenarioKey }, { attempt }] = await Promise.all([params, searchParams])

  // This workbench implements exactly one release. Serving it under another scenario's URL
  // would render acid chemistry under a different label and start an attempt whose stored
  // release id does not match what ran — which §2.4 forbids and the workbench's own imports
  // cannot express.
  if (scenarioKey !== WORKBENCH_SCENARIO_KEY) {
    notFound()
  }

  // `?attempt=` carries the run to resume; absent starts a fresh one. An array means the
  // parameter was repeated, which is not a resolvable attempt, so it is treated as absent
  // rather than picking one arbitrarily and silently resuming the wrong run.
  const attemptId = typeof attempt === 'string' && attempt !== '' ? attempt : null

  const storageMode = await currentStorageMode()
  const strings = APP_STRINGS.workbench

  return (
    <div className="page stack">
      {/*
        The page owns the heading; the client component owns the status bar.

        Both used to render an `<h1>Không gian mô phỏng</h1>`, so every workbench had two
        level-one headings with identical text — a duplicate landmark for a screen reader
        and a visibly repeated title on screen. The heading belongs here because it is
        static: rendering it on the server means it is present in the first paint rather
        than appearing when the attempt finishes loading.
      */}
      <header className="stack-tight">
        <p className="eyebrow">{APP_STRINGS.brandTag}</p>
        <h1>{strings.title}</h1>
        {/* Shown only when the deployment genuinely cannot offer an account. Without it, a
            learner who signs in on an unconfigured deployment would get failures that look
            like a bug rather than missing configuration. */}
        {!isSupabaseConfigured() && (
          <p className="alert alert-info">
            <strong>{APP_STRINGS.errors.notConfiguredTitle}.</strong>{' '}
            {APP_STRINGS.errors.notConfiguredBody}
          </p>
        )}
      </header>

      <WorkbenchClient attemptId={attemptId} storageMode={storageMode} />
    </div>
  )
}
