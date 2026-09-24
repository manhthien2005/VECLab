import { SCENARIO_KEYS, type ScenarioKey, type ScenarioReleaseManifest } from './contracts.js'

/**
 * Scenario release registry.
 *
 * docs/system-architecture.md §2.4: a release locks engine, scoring, state
 * schema, content, locale bundle and evidence version together. The registry is
 * the single place that decides whether a deployment can serve a given release,
 * and an in-flight attempt may only resume while its exact release is still
 * registered here.
 *
 * The registry holds manifests, not module instances. Constructing a module
 * binds a frozen configuration and derives per-route values, so instances are
 * created by the caller and cached there; keeping the registry free of instances
 * means registering a scenario cannot execute scenario code at import time.
 */

export type RegisteredRelease = {
  manifest: ScenarioReleaseManifest
  /** Whether the content half of the release is also locked (§2.4). */
  contentSupported: boolean
}

const registry = new Map<string, RegisteredRelease>()

/**
 * Register a release.
 *
 * Rejects a release whose scenario key is not part of the product scope, and rejects a
 * release whose id does not name its own scenario — a mismatch means the manifest was
 * assembled from two releases, which would silently mix an engine with another
 * scenario's content and evidence.
 *
 * `contentSupported` is SUPPLIED by the caller rather than looked up here. The domain
 * must not import the content layer: content is presentation, and depending on it would
 * invert the dependency direction the layering rules establish
 * (docs/system-architecture.md §4.1). The application registry imports both halves and
 * is therefore the only place that can answer whether they are locked together. Passing
 * `false` is still valid and still means "cannot serve" (§2.4), so the guarantee that an
 * engine without its content cannot start an attempt is preserved — it is just asserted
 * by the caller that owns the knowledge.
 */
export function registerRelease(
  manifest: ScenarioReleaseManifest,
  contentSupported: boolean,
): void {
  if (!(SCENARIO_KEYS as readonly string[]).includes(manifest.scenarioKey)) {
    throw new RangeError(
      `Cannot register unknown scenario key "${manifest.scenarioKey}"; scope is ${SCENARIO_KEYS.join(', ')}`,
    )
  }

  if (!manifest.releaseId.startsWith(`${manifest.scenarioKey}@`)) {
    throw new RangeError(
      `Release id "${manifest.releaseId}" does not match scenario key "${manifest.scenarioKey}"`,
    )
  }

  registry.set(manifest.releaseId, { manifest, contentSupported })
}

/** Whether a release can be served at all: engine registered AND content locked. */
export function canServeRelease(releaseId: string): boolean {
  const entry = registry.get(releaseId)
  return entry !== undefined && entry.contentSupported
}

export function getRegisteredRelease(releaseId: string): RegisteredRelease | undefined {
  return registry.get(releaseId)
}

/** Releases registered for one scenario, newest last by registration order. */
export function registeredReleasesFor(scenarioKey: ScenarioKey): ScenarioReleaseManifest[] {
  const manifests: ScenarioReleaseManifest[] = []
  for (const entry of registry.values()) {
    if (entry.manifest.scenarioKey === scenarioKey) manifests.push(entry.manifest)
  }
  return manifests
}

/** Snapshot of every registered release id, for diagnostics and tests. */
export function registeredReleaseIds(): string[] {
  return [...registry.keys()]
}

/**
 * Clear the registry. Test seam only: registration is process-wide and a test
 * that registers a release must not leak it into the next test file.
 */
export function clearRegistry(): void {
  registry.clear()
}

/**
 * A release is resumable only when it is still registered and its content is
 * still locked (§2.4). A learner who left a tab open overnight and returns
 * after a release was withdrawn gets a clean "not supported" rather than a
 * resume against an engine that no longer matches their stored snapshots.
 */
export function isResumable(releaseId: string): boolean {
  return canServeRelease(releaseId)
}
