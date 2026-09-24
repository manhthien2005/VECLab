import { describe, expect, it } from 'vitest'

import { ACID_STRINGS, FORBIDDEN_PHRASES, ACID_NEUTRALIZATION_LOCALE, ACID_NEUTRALIZATION_CONTENT_VERSION } from '@/content/scenarios/acid-neutralization.vi.js'
import { ACID_NEUTRALIZATION_RELEASE } from '@/content/scenarios/release-manifests.js'

/**
 * Content/wording gate.
 *
 * Enforces docs/experiments/acid-neutralization-spec.md §21 ("UI không dùng
 * 'probability', 'đạt pháp luật' hoặc 'liều nước thải'") and
 * docs/verification-and-acceptance.md §20. A wording violation is an
 * unqualified safety/compliance/dosing claim, which the project scope forbids
 * outright — this is the gate that catches it before a human reviewer has to.
 *
 * Also enforces that no messageKey or limitationKey can reach the UI unresolved:
 * an empty string in a warning panel is how a safety limitation disappears.
 */

/** Error/recovery codes from spec §12, plus the codes the domain emits. */
const SPEC_SECTION_12_CODES = [
  'METER_NOT_CALIBRATED',
  'SAMPLE_NOT_MIXED',
  'READING_NOT_STABLE',
  'TARGET_LOW',
  'TARGET_HIGH',
  'ROUTE_LOCKED',
  'CALCIUM_SOLUTION_INVALID',
  'CO2_EXCHANGE_UNMODELED',
  'TEMPERATURE_OUT_OF_SCOPE',
  'EQUILIBRIUM_NO_CONVERGENCE',
] as const

/** Safety penalty codes from spec §13.5. */
const SPEC_PENALTY_CODES = [
  'EXCESS_BASE_OVER_110_PERCENT_TARGET',
  'CORRECTION_ACID_USED',
  'FINAL_PH_OUTSIDE_6_TO_8',
] as const

const ROUTES = ['naoh', 'calcium-hydroxide', 'sodium-carbonate'] as const

const ACTIONS = [
  'select_route',
  'calibrate_meter',
  'add_base',
  'mix',
  'wait_for_stable_reading',
  'measure_ph',
  'add_correction_acid',
  'complete',
] as const

const strings = ACID_STRINGS as Record<string, string>

describe('acid neutralization vi content bundle', () => {
  it('is locked to the vi locale and release content version', () => {
    expect(ACID_NEUTRALIZATION_LOCALE).toBe(ACID_NEUTRALIZATION_RELEASE.locale)
    expect(ACID_NEUTRALIZATION_CONTENT_VERSION).toBe(ACID_NEUTRALIZATION_RELEASE.contentVersion)
  })

  it('has no forbidden compliance, probability or dosing claim in any string', () => {
    const violations: string[] = []
    for (const [key, value] of Object.entries(strings)) {
      for (const phrase of FORBIDDEN_PHRASES) {
        if (value.toLowerCase().includes(phrase.toLowerCase())) {
          violations.push(`${key}: "${phrase}"`)
        }
      }
    }
    expect(violations, violations.join('; ')).toEqual([])
  })

  it('has no empty or whitespace-only string', () => {
    for (const [key, value] of Object.entries(strings)) {
      expect(value.trim().length, `${key} is blank`).toBeGreaterThan(0)
    }
  })

  it('localizes every spec §12 error and recovery code', () => {
    for (const code of SPEC_SECTION_12_CODES) {
      expect(strings[`errors.${code}`], `errors.${code}`).toBeDefined()
    }
  })

  it('localizes every safety penalty code from spec §13.5', () => {
    for (const code of SPEC_PENALTY_CODES) {
      expect(strings[`penalties.${code}`], `penalties.${code}`).toBeDefined()
    }
  })

  it('labels every route and every action', () => {
    for (const route of ROUTES) {
      expect(strings[`routes.${route}.label`], `routes.${route}.label`).toBeDefined()
      expect(strings[`routes.${route}.description`], `routes.${route}.description`).toBeDefined()
    }
    for (const action of ACTIONS) {
      expect(strings[`actions.${action}`], `actions.${action}`).toBeDefined()
    }
  })

  it('resolves every limitation key the release manifest publishes', () => {
    // Manifest and bundle live in different files; a drift here silently drops
    // a scientific limitation from the report.
    expect(ACID_NEUTRALIZATION_RELEASE.limitationKeys.length).toBeGreaterThan(0)
    for (const key of ACID_NEUTRALIZATION_RELEASE.limitationKeys) {
      expect(strings[key], `manifest limitation ${key}`).toBeDefined()
    }
  })

  it('resolves the scenario title and summary keys the manifest publishes', () => {
    expect(strings[ACID_NEUTRALIZATION_RELEASE.titleKey]).toBeDefined()
    expect(strings[ACID_NEUTRALIZATION_RELEASE.summaryKey]).toBeDefined()
  })

  it('keeps the modelled-pH qualification wherever pH is labelled', () => {
    expect(strings['scenarios.acid-neutralization.ph-label']).toContain('pH*')
    expect(strings['scenarios.acid-neutralization.ph-explanation']).toContain('IUPAC')
  })

  it('qualifies both pedagogical indices as conventions rather than measurements', () => {
    expect(strings['resources.cost-index-explanation']).toContain('sư phạm')
    expect(strings['resources.cost-index-explanation']).toContain('Không phải tiền tệ')
    expect(strings['resources.safety-index-explanation']).toContain('sư phạm')
    // N/A must never be rendered as 0 (spec §13.5, acceptance §5.5).
    expect(strings['resources.not-evaluable']).toBeDefined()
    expect(strings['resources.not-evaluable-explanation']).toContain('Không dùng 0')
  })

  it('discloses the closed-carbon limitation for the carbonate route', () => {
    expect(strings['warnings.model.closed-carbon']).toContain('CO₂')
    expect(strings['observations.carbonate.equilibrium']).toContain('42,20')
    expect(strings['limitations.acid.closed-carbon-system']).toContain('hệ kín')
  })

  it('states the Ca(OH)2 clear-solution restriction', () => {
    expect(strings['routes.calcium-hydroxide.clarification']).toContain('không áp dụng')
    expect(strings['errors.CALCIUM_SOLUTION_INVALID']).toContain('ngoài mô hình')
  })
})
