import { describe, expect, it } from 'vitest'
import {
  ACID_ACTION_TYPES as ENGINE_ACTION_TYPES,
  ACID_ROUTES,
  createAcidNeutralizationModule,
} from '@/domain/experiments/acid-neutralization/index.js'
import { PERMITTED_ALIQUOTS_L } from '@/domain/experiments/acid-neutralization/constants.js'
import {
  ACID_ACTION_TYPES as CONTENT_ACTION_TYPES,
  ACID_ACTIONS,
  ACID_ROUTE_CHOICES,
  ACID_INPUT_DOMAIN,
  ACID_UNIT_SELECTIONS,
  ACID_VOLUME_DISPLAY_UNIT,
} from '@/content/scenarios/acid-neutralization.js'
import { ACID_STRINGS } from '@/content/scenarios/acid-neutralization.vi.js'
import { ACID_NEUTRALIZATION_RELEASE } from '@/content/scenarios/release-manifests.js'

/**
 * Scenario release structure gate (docs/system-architecture.md §2.4).
 *
 * The content layer MIRRORS the engine: it declares what the UI may offer so a form
 * can never present an input the engine rejects. Mirroring is only safe while the two
 * halves agree, and nothing in the type system enforces that — they are separate
 * modules with separate const arrays that happen to list the same strings today.
 *
 * This is the cross-layer gate. Wording, empty strings and label resolution within
 * the bundle itself are owned by tests/unit/content-wording.test.ts; what is asserted
 * here is the agreement BETWEEN content and engine, which no single-module test can
 * see: a renamed action, a route the engine refuses, an aliquot outside the permitted
 * set, or a unit selector the pipeline has no quantity for.
 */

const engine = createAcidNeutralizationModule()

describe('action list mirrors the engine', () => {
  it('declares exactly the engine action types, in the same order', () => {
    // Order matters: §5 fixes the order the scenario OFFERS them, and the workbench
    // lays out its controls in that order. A reordering here silently changes the UI.
    expect([...CONTENT_ACTION_TYPES]).toEqual([...ENGINE_ACTION_TYPES])
    expect([...CONTENT_ACTION_TYPES]).toEqual([...engine.actionTypes])
  })

  it('has a spec entry for every action type and no extras', () => {
    expect(Object.keys(ACID_ACTIONS).sort()).toEqual([...ENGINE_ACTION_TYPES].sort())
  })

  it('marks only select_route undoable (§5.1)', () => {
    const undoable = Object.values(ACID_ACTIONS)
      .filter((spec) => spec.undoable)
      .map((spec) => spec.actionType)

    // Chemistry is not reversible: undoing a dose would delete mass from the model.
    // Flagging an irreversible action undoable in content would make the UI offer a
    // button the engine then refuses.
    expect(undoable).toEqual(['select_route'])
  })

  it('declares every action as emitting an event', () => {
    // §6.1: every accepted action is persisted. A content entry claiming otherwise
    // would let the UI treat an action as ephemeral and skip the save indicator.
    for (const spec of Object.values(ACID_ACTIONS)) {
      expect(spec.emitsEvent, spec.actionType).toBe(true)
    }
  })

  it('declares a precondition key that resolves for every action', () => {
    // Shown as the disabled-state reason (§5 "Điều kiện trước"). The wording gate
    // covers `actions.*` labels; this covers the precondition text, which only
    // exists to be read from content and would render blank if the key drifted.
    for (const spec of Object.values(ACID_ACTIONS)) {
      expect(ACID_STRINGS, spec.preconditionKey).toHaveProperty(spec.preconditionKey)
    }
  })
})

describe('input domain matches the engine', () => {
  it('offers exactly the routes the engine accepts', () => {
    expect([...ACID_ROUTE_CHOICES].sort()).toEqual([...ACID_ROUTES].sort())
  })

  it('offers exactly the permitted aliquots, in canonical litres', () => {
    // Offering 0.25 mL would be rejected by the engine with ALIQUOT_NOT_PERMITTED,
    // so the form must not present it. This is the assertion that keeps a control
    // from offering an input the engine refuses — the stated purpose of the mirror.
    expect([...ACID_INPUT_DOMAIN.permittedAliquotsL].sort()).toEqual(
      [...PERMITTED_ALIQUOTS_L].sort(),
    )
  })

  it('declares the volume display unit among its own selectors', () => {
    expect(ACID_VOLUME_DISPLAY_UNIT).toBe('mL')
    expect([...ACID_UNIT_SELECTIONS.volume]).toContain(ACID_VOLUME_DISPLAY_UNIT)
  })

  it('declares an engine quantity for every numeric parameter', () => {
    // `parameterQuantities` is what stops a unit from being converted across
    // quantities: a 'g' selection on a volume parameter would otherwise become a
    // 1000x dose error. Every numeric parameter content offers must therefore be
    // declared by the engine, or the UI presents a unit selector the pipeline
    // cannot honour.
    const declaredQuantities = Object.keys(engine.parameterQuantities)
    const numericParams = Object.values(ACID_ACTIONS).flatMap((spec) =>
      spec.parameters
        .filter((parameter) => parameter.kind === 'numeric')
        .map((parameter) => parameter.name),
    )

    expect(numericParams).toContain('volumeL')
    for (const parameter of numericParams) {
      expect(declaredQuantities, parameter).toContain(parameter)
    }
  })

  it('declares no engine quantity for a choice parameter', () => {
    // The converse: a choice like `route` is not a quantity, so attaching a unit to
    // it is rejected by the pipeline. Content must not imply it is measurable.
    const choiceParams = Object.values(ACID_ACTIONS).flatMap((spec) =>
      spec.parameters
        .filter((parameter) => parameter.kind === 'choice')
        .map((parameter) => parameter.name),
    )

    expect(choiceParams).toContain('route')
    for (const parameter of choiceParams) {
      expect(engine.parameterQuantities, parameter).not.toHaveProperty(parameter)
    }
  })
})

describe('content manifest names the release the engine serves', () => {
  it('agrees with the engine manifest on release and scenario', () => {
    // The manifest is what binds content to a release (§2.4). If content advertised
    // one release id while the engine served another, citations and limitations
    // would be rendered against the wrong locked bundle.
    expect(ACID_NEUTRALIZATION_RELEASE.releaseId).toBe(engine.manifest.releaseId)
    expect(ACID_NEUTRALIZATION_RELEASE.scenarioKey).toBe(engine.manifest.scenarioKey)
    expect(ACID_NEUTRALIZATION_RELEASE.contentVersion).toBe(
      engine.manifest.contentVersion,
    )
    expect(ACID_NEUTRALIZATION_RELEASE.evidenceRegisterVersion).toBe(
      engine.manifest.evidenceRegisterVersion,
    )
  })
})
