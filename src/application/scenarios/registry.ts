import type { DomainModule, ScenarioReleaseManifest } from '@/domain/process/contracts.js'
import { registerRelease, canServeRelease } from '@/domain/process/index.js'
import { isReleaseSupported } from '@/content/index.js'
import {
  createAcidNeutralizationModule,
  benchmarkScenarioConfig,
  ACID_RELEASE_ID,
} from '@/domain/experiments/acid-neutralization/index.js'
import type { AcidNeutralizationState } from '@/domain/experiments/acid-neutralization/index.js'

/**
 * Release → module resolution.
 *
 * The Process Core registry holds MANIFESTS only, so registering a scenario
 * cannot execute scenario code at import time. This map holds the constructed
 * modules and is the place route handlers ask which module serves a release id.
 *
 * Accessors are typed per scenario rather than returning an erased
 * `DomainModule<unknown>`. Erasure would be wrong, not merely weaker: a caller
 * must know the concrete State type to parse a stored snapshot, to build a
 * projection and to render state-specific UI. Hiding that type here would force
 * every caller to re-assert it, scattering the one place where the release id is
 * known to imply the state shape.
 *
 * Modules are built once. Construction binds a frozen configuration and derives
 * per-route E*, which runs a nested solver, so rebuilding per request would be
 * expensive for no benefit — the configuration never changes for a release.
 */

/** Built once at module load; the configuration is frozen for the release. */
const acidModule = createAcidNeutralizationModule(benchmarkScenarioConfig())

// The application layer is the only place that legitimately imports both halves of a
// release, so it is here that "is the content locked too?" gets answered and handed to
// the domain registry. The domain must not import content itself (§4.1).
registerRelease(acidModule.manifest, isReleaseSupported(acidModule.manifest.releaseId))

/**
 * Every release this deployment can serve.
 *
 * Only acid neutralization is registered. Copper and plastic are intentionally absent
 * until their engines land: registering a scenario whose engine is missing would let an
 * attempt start and then fail mid-run, which docs/system-architecture.md §2.4 forbids.
 * The list is derived from what was registered rather than kept as a second copy, so it
 * cannot disagree with the domain registry.
 */

/**
 * The acid module for a release id, or null when it cannot be served.
 *
 * Two guards, in this order, each doing a different job:
 *   * identity — this accessor is typed to the acid state shape, so returning
 *     another scenario's module would be a type lie the compiler cannot catch.
 *     Checked first so a future second registration cannot leak through here.
 *   * `canServeRelease` — confirms the CONTENT half is locked as well as the
 *     engine, which identity alone does not establish (§2.4).
 */
export function resolveAcidModule(
  releaseId: string,
): DomainModule<AcidNeutralizationState> | null {
  if (releaseId !== acidModule.manifest.releaseId) return null
  return canServeRelease(releaseId) ? acidModule : null
}

/**
 * The acid module, throwing when the release is unavailable.
 *
 * For server callers that have already validated the release id: a null here is a
 * deployment configuration error, not a learner error, so it must not be rendered
 * as one.
 */
export function requireAcidModule(releaseId: string): DomainModule<AcidNeutralizationState> {
  const resolved = resolveAcidModule(releaseId)
  if (resolved === null) {
    throw new RangeError(`No acid module registered for release "${releaseId}"`)
  }
  return resolved
}

/** Every manifest this deployment can serve, for the catalog and diagnostics. */
export function servedReleases(): ScenarioReleaseManifest[] {
  return [acidModule.manifest]
}

export { ACID_RELEASE_ID }
