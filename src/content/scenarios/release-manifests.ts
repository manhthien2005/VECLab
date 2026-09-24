/**
 * Scenario release manifests (docs/system-architecture.md §2.4).
 *
 * A release locks engine, scoring, state schema, content, locale bundle and
 * evidence version simultaneously. Never edit a published release's content —
 * publish a new version instead. An in-flight attempt resumes only while its
 * exact release is still in the runtime registry.
 *
 * This file holds the CONTENT half of each manifest. The domain half (engine,
 * scoring, state schema versions) is declared by each domain module and
 * cross-checked against these manifests by tests/unit/release-manifest.test.ts.
 */

import type { ScenarioKey } from '@/domain/process/contracts.js'

export const CONTENT_LOCALE_DEFAULT = 'vi'

export type ScenarioReleaseContentManifest = {
  scenarioKey: ScenarioKey
  releaseId: string
  /** Display name key resolved by the content layer. */
  titleKey: string
  summaryKey: string
  locale: string
  contentVersion: string
  /** Evidence register version this release was checked against. */
  evidenceRegisterVersion: string
  /** Claim keys the UI may surface for this scenario. */
  claimKeys: string[]
  /** Source keys resolvable for citation rendering. */
  sourceKeys: string[]
  /** Limitations that must stay visible wherever the scenario is used. */
  limitationKeys: string[]
}

export const ACID_NEUTRALIZATION_RELEASE: ScenarioReleaseContentManifest = {
  scenarioKey: 'acid-neutralization',
  releaseId: 'acid-neutralization@1.0.0',
  titleKey: 'scenarios.acid-neutralization.title',
  summaryKey: 'scenarios.acid-neutralization.summary',
  locale: CONTENT_LOCALE_DEFAULT,
  contentVersion: '1.0.0',
  evidenceRegisterVersion: '1.0.0',
  claimKeys: [
    'AN-PH-DEFINITION',
    'AN-KW-25C',
    'AN-CARBONATE-CONSTANTS',
    'AN-CAOH-COMPLEX',
    'AN-CAOH2-CONCENTRATION',
    'AN-CLOSED-CARBON',
    'AN-ALIQUOT-PROCEDURE',
    'AN-MATRIX-LIMIT',
    'AN-SAFETY-WORDING',
    'AN-G01-G08',
  ],
  sourceKeys: [
    'IUPAC-PH',
    'IAPWS-KW-2024',
    'USGS-PHREEQC-1995',
    'NIST-CAOH2-1956',
    'USGS-ALK-FAQ',
    'USGS-FIELD-ALK',
    'VALENCIA-TITRATION',
    'FSU-TITRATION',
    'ASTM-D1067-16',
    'EPA-AMD-NEUTRALIZATION',
    'APPLIED-WATER-NEUTRALIZATION',
    'NIOSH-HCL',
    'NIOSH-NAOH',
    'NIOSH-CAOH2',
    'PUBCHEM-NA2CO3',
  ],
  limitationKeys: [
    'limitations.acid.ph-is-modelled-concentration',
    'limitations.acid.closed-carbon-system',
    'limitations.acid.no-dose-inference-for-unknown-sample',
    'limitations.acid.supervised-laboratory-only',
    'limitations.acid.constant-temperature-25c',
  ],
}

/**
 * Copper and plastic manifests are intentionally absent from the runtime
 * registry until their engines land. A release is registered only when engine,
 * scoring, state schema, content and evidence are locked together; registering
 * a scenario with a missing engine would let an attempt start and then fail
 * mid-run, which §2.4 forbids.
 */
export const RUNTIME_RELEASE_MANIFESTS: Record<string, ScenarioReleaseContentManifest> = {
  [ACID_NEUTRALIZATION_RELEASE.releaseId]: ACID_NEUTRALIZATION_RELEASE,
}

export function resolveReleaseManifest(releaseId: string): ScenarioReleaseContentManifest | null {
  return RUNTIME_RELEASE_MANIFESTS[releaseId] ?? null
}

export function isReleaseSupported(releaseId: string): boolean {
  return RUNTIME_RELEASE_MANIFESTS[releaseId] !== undefined
}
