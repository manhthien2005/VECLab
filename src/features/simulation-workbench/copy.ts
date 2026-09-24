import {
  ACID_ACTIONS,
  ACID_STRINGS,
  hasAcidString,
} from '@/content/index.js'
import type { AcidStringKey } from '@/content/index.js'
import {
  isAcidRoute,
  type AcidPhase,
  type AcidRoute,
} from '@/domain/experiments/acid-neutralization/state.js'

/**
 * Localized copy for the acid workbench, reports and timeline.
 *
 * One home for every bundle key these surfaces read, for two reasons:
 *
 *   * The keys must be CHECKED. `satisfies Record<AcidRoute, AcidStringKey>` forces every
 *     route and phase to have an entry that names a key the bundle actually declares, so a
 *     renamed string or a fourth route fails the build instead of rendering a raw key such
 *     as `routes.naoh.label` to a learner.
 *   * They must not be DUPLICATED. The panels, the timeline and the action controls all
 *     need a route's label; three copies would drift, and a drift here shows up as one
 *     screen saying "NaOH" and another saying "naoh" for the same run.
 *
 * Lives beside the components rather than in `content/`, because choosing which bundle key
 * a workbench surface reads is presentation. The bundle stays the single source of the
 * wording itself.
 */

/** A key the bundle declares. Fails the build if the bundle loses it. */
export function acidText(key: AcidStringKey): string {
  return ACID_STRINGS[key]
}

export const ROUTE_LABEL_KEYS = {
  naoh: 'routes.naoh.label',
  'calcium-hydroxide': 'routes.calcium-hydroxide.label',
  'sodium-carbonate': 'routes.sodium-carbonate.label',
} as const satisfies Record<AcidRoute, AcidStringKey>

export const ROUTE_DESCRIPTION_KEYS = {
  naoh: 'routes.naoh.description',
  'calcium-hydroxide': 'routes.calcium-hydroxide.description',
  'sodium-carbonate': 'routes.sodium-carbonate.description',
} as const satisfies Record<AcidRoute, AcidStringKey>

/** Only Ca(OH)₂ carries a clarification; the others legitimately have none. */
export const ROUTE_CLARIFICATION_KEYS = {
  naoh: null,
  'calcium-hydroxide': 'routes.calcium-hydroxide.clarification',
  'sodium-carbonate': null,
} as const satisfies Record<AcidRoute, AcidStringKey | null>

export const PHASE_LABEL_KEYS = {
  setup: 'phases.setup',
  ready: 'phases.ready',
  mixed: 'phases.mixed',
  stable: 'phases.stable',
  completed: 'phases.completed',
} as const satisfies Record<AcidPhase, AcidStringKey>

export const CHARGE_BALANCE_KEYS = {
  naoh: 'formulas.charge-balance.naoh',
  'calcium-hydroxide': 'formulas.charge-balance.calcium-hydroxide',
  'sodium-carbonate': 'formulas.charge-balance.sodium-carbonate',
} as const satisfies Record<AcidRoute, AcidStringKey>

/**
 * Localized label for a route.
 *
 * Accepts an arbitrary string because routes reach the UI from stored state and from event
 * records, neither of which the compiler can vouch for. `isAcidRoute` is the domain's own
 * guard, so an unknown value falls through to the raw id rather than indexing the map with
 * a cast and producing `undefined`.
 */
export function routeLabel(route: AcidRoute | string): string {
  return isAcidRoute(route) ? acidText(ROUTE_LABEL_KEYS[route]) : route
}

/** Localized label for a phase. */
export function phaseLabel(phase: AcidPhase): string {
  return acidText(PHASE_LABEL_KEYS[phase])
}

/** A route's extra clarification, or an empty string when it has none. */
export function routeClarification(route: AcidRoute): string {
  const key = ROUTE_CLARIFICATION_KEYS[route]
  return key === null ? '' : acidText(key)
}

/**
 * The learner-facing label for an action type.
 *
 * `undo_last` and `completed` have no content spec because neither is an action the
 * learner picks: one is what the system records when they revert, the other what it
 * records when they finish. Both are labelled here rather than added to the action table,
 * which the scenario-definition gate holds to exactly the engine's action list.
 */
export function actionLabel(actionType: string): string {
  if (actionType === 'undo_last') return 'Hoàn tác thao tác cuối'
  if (actionType === 'completed') return 'Hoàn thành lượt'

  const spec = ACID_ACTIONS[actionType as keyof typeof ACID_ACTIONS]
  if (spec === undefined) return actionType

  return hasAcidString(spec.labelKey) ? acidText(spec.labelKey) : actionType
}

/**
 * Localized text for a penalty code.
 *
 * The code arrives from the projection as a plain string, so it cannot be checked at
 * compile time; `hasAcidString` narrows it at runtime instead. An unmapped code renders as
 * the code itself rather than as nothing — visible enough for a reviewer to catch, and
 * never a blank gap where a safety penalty should be explained.
 */
export function penaltyText(code: string): string {
  const key = `penalties.${code}`
  return hasAcidString(key) ? acidText(key) : code
}
