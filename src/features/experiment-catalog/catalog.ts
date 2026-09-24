import {
  ACID_STRINGS,
  RUNTIME_RELEASE_MANIFESTS,
  resolveReleaseManifest,
  type ScenarioReleaseContentManifest,
} from '@/content/index.js'
import { ACID_ACTIONS } from '@/content/scenarios/acid-neutralization.js'
import { servedReleases } from '@/application/scenarios/registry.js'
import type { ScenarioReleaseManifest } from '@/domain/process/contracts.js'

/**
 * The experiment catalog, as the public screens render it.
 *
 * A scenario appears here only when BOTH halves of its release are present: the
 * content manifest (titles, claims, sources) and a registered engine that can serve the
 * release id. Listing one without the other would be the failure §2.4 forbids — a card a
 * learner can click into an attempt that cannot run.
 *
 * Reads the two registries rather than a hand-maintained list, so adding a scenario is
 * one change in each registry and the catalog, the detail page and the workbench all
 * follow.
 */

/** One catalog entry: the content manifest plus the engine facts the UI displays. */
export type CatalogEntry = {
  scenarioKey: string
  releaseId: string
  title: string
  summary: string
  locale: string
  contentVersion: string
  evidenceRegisterVersion: string
  /** Model spec the engine is locked to, shown so a learner can cite the version. */
  modelSpecVersion: string
  scoringVersion: string
  projectionVersion: number
  claimCount: number
  sourceCount: number
  limitationCount: number
}

/** A permitted operation, as the detail page lists it (§4.2 "thao tác được phép"). */
export type CatalogAction = {
  actionType: string
  label: string
  /** Why the action may be unavailable, rendered as a disabled-state reason. */
  precondition: string
  /** Whether the scenario lets a learner revert it (§5.1). */
  undoable: boolean
}

/**
 * Every release this deployment can serve.
 *
 * Deterministic order (the engine registry's), so the catalog does not reshuffle between
 * renders.
 */
export function listCatalog(): CatalogEntry[] {
  return servedReleases()
    .map(toEntry)
    .filter((entry): entry is CatalogEntry => entry !== null)
}

/** The entry for one scenario key, or null when it cannot be served. */
export function findCatalogEntry(scenarioKey: string): CatalogEntry | null {
  const match = servedReleases().find(
    (manifest) => manifest.scenarioKey === scenarioKey,
  )
  return match === undefined ? null : toEntry(match)
}

/** The content manifest behind a release id, or null. */
export function manifestFor(releaseId: string): ScenarioReleaseContentManifest | null {
  return resolveReleaseManifest(releaseId)
}

/**
 * The operations a scenario permits, with their localized labels.
 *
 * Read from the content definition, which the scenario-definition gate keeps in step
 * with the engine's own action list. Counting or listing actions anywhere else would be
 * a second source of truth that could drift into offering an operation the engine
 * refuses.
 *
 * Order is the order the scenario presents them (§5), which is what the workbench lays
 * its controls out in.
 */
export function listActions(scenarioKey: string): CatalogAction[] {
  if (scenarioKey !== 'acid-neutralization') return []

  return Object.values(ACID_ACTIONS).map((spec) => ({
    actionType: spec.actionType,
    label: localized(spec.labelKey),
    precondition: localized(spec.preconditionKey),
    undoable: spec.undoable,
  }))
}

/**
 * Turn an engine manifest into a catalog entry.
 *
 * Returns null when the content manifest is missing: the engine alone is not a servable
 * scenario, because the UI has no titles, claims or limitations to render.
 */
function toEntry(manifest: ScenarioReleaseManifest): CatalogEntry | null {
  const content = resolveReleaseManifest(manifest.releaseId)
  if (content === null) return null

  return {
    scenarioKey: manifest.scenarioKey,
    releaseId: manifest.releaseId,
    title: localized(content.titleKey),
    summary: localized(content.summaryKey),
    locale: content.locale,
    contentVersion: content.contentVersion,
    evidenceRegisterVersion: content.evidenceRegisterVersion,
    modelSpecVersion: manifest.modelSpecVersion,
    scoringVersion: manifest.scoringVersion,
    projectionVersion: manifest.projectionVersion,
    claimCount: content.claimKeys.length,
    sourceCount: content.sourceKeys.length,
    limitationCount: content.limitationKeys.length,
  }
}

/** Localized text for a bundle key, falling back to the key itself. */
function localized(key: string): string {
  const value = ACID_STRINGS[key as keyof typeof ACID_STRINGS]
  return typeof value === 'string' ? value : key
}

/** Release ids this deployment can serve, for diagnostics and the API. */
export function servedReleaseIds(): string[] {
  return Object.keys(RUNTIME_RELEASE_MANIFESTS)
}
