import { ACID_NEUTRALIZATION_RELEASE } from '@/content/scenarios/release-manifests.js'

/**
 * Which scenario the workbench serves, and where it lives.
 *
 * A PLAIN module — deliberately not `'use client'`, and deliberately not part of
 * `workbench-client.tsx`.
 *
 * These constants used to be exported from the workbench client component, and
 * `src/app/simulate/[scenarioKey]/page.tsx` (a Server Component) imported the key from
 * there to validate its own route segment. Under React Server Components that import does
 * not yield the string: every export of a `'use client'` module is replaced by a client
 * reference, so the server saw a function, `scenarioKey !== WORKBENCH_SCENARIO_KEY` was
 * always true, and the workbench — the central screen of the product — answered 404 for
 * every request. The page rendered `notFound()` on its own valid URL.
 *
 * Keeping the constants in a module with no directive is what makes them importable from
 * BOTH sides: the server page reads the real string, and the client components get the
 * same value bundled. Anything a Server Component needs from the workbench belongs here,
 * not in the client module.
 */

/**
 * The scenario key this workbench implements.
 *
 * Read from the locked release manifest rather than restated, because the manifest is
 * already the declaration of which scenario the release is. A second copy of the key is a
 * second place to update when a second scenario lands — and a place for the route to
 * disagree with the attempt's stored release id.
 */
export const WORKBENCH_SCENARIO_KEY: string = ACID_NEUTRALIZATION_RELEASE.scenarioKey

/** The workbench route for that scenario. */
export const WORKBENCH_PATH = `/simulate/${WORKBENCH_SCENARIO_KEY}`

/** The workbench route for a specific attempt, used to resume rather than start fresh. */
export function workbenchPathForAttempt(attemptId: string): string {
  return `${WORKBENCH_PATH}?attempt=${attemptId}`
}
