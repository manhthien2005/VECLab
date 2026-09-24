/**
 * Content layer public surface.
 *
 * UI renders citations, limitations, scenario definitions and localized wording
 * from here and never re-hardcodes metadata in components
 * (docs/scientific-evidence-register.md §7).
 *
 * Every module below is re-exported flat, matching the evidence barrel. The export
 * names across `scenarios/acid-neutralization.ts`,
 * `scenarios/acid-neutralization.vi.ts`, `scenarios/release-manifests.ts` and
 * `evidence/**` are disjoint — verified, not assumed — so nothing is shadowed.
 * Adding a module here whose names overlap an existing one is a build error, which
 * is the right place to find out.
 */

export * from './evidence/index.js'
export * from './scenarios/acid-neutralization.js'
export * from './scenarios/acid-neutralization.vi.js'
export {
  ACID_NEUTRALIZATION_RELEASE,
  RUNTIME_RELEASE_MANIFESTS,
  CONTENT_LOCALE_DEFAULT,
  resolveReleaseManifest,
  isReleaseSupported,
} from './scenarios/release-manifests.js'

export type { ScenarioReleaseContentManifest } from './scenarios/release-manifests.js'

export { resolveMessage, acidString, hasAcidString } from './localize.js'
export type { MessageData, StringTable } from './localize.js'

export { APP_STRINGS, storageModeLabel } from './app.vi.js'
