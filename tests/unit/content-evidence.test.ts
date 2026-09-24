import { describe, expect, it } from 'vitest'

import {
  ACID_CLAIMS,
  ACID_DERIVED_VALUES,
  ACID_GOLDEN_PROVENANCE,
  ACID_SOURCES,
  ACID_NEUTRALIZATION_RELEASE,
  resolveReleaseManifest,
  isReleaseSupported,
} from '@/content/index.js'

import { CLAIM_IDS, SOURCE_KEYS, MODEL_SPEC_VERSION } from '@/domain/experiments/acid-neutralization/constants.js'

/**
 * Content/evidence gate (docs/verification-and-acceptance.md §20, §2 gate 1).
 *
 * The acceptance condition is "mọi claim/source key resolve". A trace citing a
 * key that has no register entry silently strips the citation from the report,
 * so resolution is asserted here rather than left to reviewers.
 */

describe('acid neutralization evidence registry', () => {
  it('resolves every claim key to at least one existing source', () => {
    const claims = Object.values(ACID_CLAIMS)
    expect(claims.length).toBeGreaterThan(0)

    for (const claim of claims) {
      expect(claim.sourceKeys.length, `${claim.claimKey} has no source`).toBeGreaterThan(0)
      for (const sourceKey of claim.sourceKeys) {
        expect(ACID_SOURCES[sourceKey], `${claim.claimKey} -> missing source ${sourceKey}`).toBeDefined()
      }
    }
  })

  it('carries the register metadata a citation renderer needs', () => {
    for (const [registryKey, source] of Object.entries(ACID_SOURCES)) {
      // A mismatched registry key silently breaks every claim that cites it.
      expect(source.key, `registry key ${registryKey}`).toBe(registryKey)
      expect(source.url, `${source.key} url`).toMatch(/^https:\/\//)
      expect(source.title.length, `${source.key} title`).toBeGreaterThan(0)
      expect(source.authorsOrOrganization.length, `${source.key} org`).toBeGreaterThan(0)
      expect(source.checkedAt, `${source.key} checkedAt`).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(source.locations.length, `${source.key} locations`).toBeGreaterThan(0)
      expect(source.limitations.length, `${source.key} limitations`).toBeGreaterThan(0)
    }
  })

  it('keys every claim by its own claimKey field', () => {
    for (const [registryKey, claim] of Object.entries(ACID_CLAIMS)) {
      expect(claim.claimKey, `registry key ${registryKey}`).toBe(registryKey)
    }
  })

  it('maps every derived value to an existing claim', () => {
    const derived = Object.values(ACID_DERIVED_VALUES)
    expect(derived.length).toBe(4)
    for (const value of derived) {
      expect(ACID_CLAIMS[value.claimKey], `${value.key} -> missing claim`).toBeDefined()
      expect(Number.isFinite(value.implementationValue), `${value.key} value`).toBe(true)
    }
  })

  it('exposes every claim id the domain engine cites', () => {
    for (const claimId of Object.values(CLAIM_IDS)) {
      expect(ACID_CLAIMS[claimId], `engine cites unregistered claim ${claimId}`).toBeDefined()
    }
  })

  it('exposes every source key the domain engine cites', () => {
    for (const sourceKey of Object.values(SOURCE_KEYS)) {
      expect(ACID_SOURCES[sourceKey], `engine cites unregistered source ${sourceKey}`).toBeDefined()
    }
  })

  it('records golden-case provenance against the locked constant bundle', () => {
    expect(ACID_GOLDEN_PROVENANCE.scenarioVersion).toBe(MODEL_SPEC_VERSION)
    expect(ACID_GOLDEN_PROVENANCE.independentCheck).toBe(true)
    expect(ACID_GOLDEN_PROVENANCE.tolerances.pH).toBe(0.002)
    for (const sourceKey of ACID_GOLDEN_PROVENANCE.sourceKeys) {
      expect(ACID_SOURCES[sourceKey]).toBeDefined()
    }
  })
})

describe('scenario release manifest', () => {
  it('locks content, locale and evidence version together', () => {
    const manifest = ACID_NEUTRALIZATION_RELEASE
    expect(manifest.releaseId).toBe(`acid-neutralization@${manifest.contentVersion}`)
    expect(manifest.locale).toBe('vi')
    expect(manifest.evidenceRegisterVersion).toBe(MODEL_SPEC_VERSION)
    expect(manifest.limitationKeys.length).toBeGreaterThan(0)
  })

  it('resolves every claim and source key the manifest publishes', () => {
    for (const claimKey of ACID_NEUTRALIZATION_RELEASE.claimKeys) {
      expect(ACID_CLAIMS[claimKey], `manifest claim ${claimKey}`).toBeDefined()
    }
    for (const sourceKey of ACID_NEUTRALIZATION_RELEASE.sourceKeys) {
      expect(ACID_SOURCES[sourceKey], `manifest source ${sourceKey}`).toBeDefined()
    }
  })

  it('registers only releases whose content is complete', () => {
    expect(isReleaseSupported('acid-neutralization@1.0.0')).toBe(true)
    expect(resolveReleaseManifest('acid-neutralization@1.0.0')).toBe(ACID_NEUTRALIZATION_RELEASE)
  })

  it('rejects an unpublished or mismatched release id', () => {
    // An attempt must not resume against a release that is not locked
    // (docs/system-architecture.md §2.4).
    expect(isReleaseSupported('acid-neutralization@1.0.1')).toBe(false)
    expect(isReleaseSupported('copper-precipitation@1.0.0')).toBe(false)
    expect(resolveReleaseManifest('acid-neutralization@2.0.0')).toBeNull()
    expect(isReleaseSupported('')).toBe(false)
  })
})
