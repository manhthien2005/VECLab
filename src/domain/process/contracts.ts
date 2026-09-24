/**
 * Process Core shared contracts.
 *
 * Source of truth: docs/system-architecture.md §5 (engine contract),
 * §5.2 (minimal shared types), §6 (Process Core lifecycle) and
 * docs/data-and-state-model.md §10 (shared state envelope).
 *
 * These names are the conceptual contract; implementations may use
 * equivalent types but must not lose information.
 */

import type { CanonicalQuantity } from '@/domain/units/index.js'

export type UUID = string & { readonly __brand: 'UUID' }

export const SCENARIO_KEYS = [
  'acid-neutralization',
  'copper-precipitation',
  'plastic-separation',
] as const

export type ScenarioKey = (typeof SCENARIO_KEYS)[number]

export type ScenarioRef = {
  key: ScenarioKey
  /** Immutable release bundle id, e.g. `acid-neutralization@1.0.0`. */
  releaseId: string
}

export type SimulationAction = {
  actionId: UUID
  actionType: string
  parameters: Record<string, number | string | boolean>
  unitSelections: Record<string, string>
}

export type SimulationContext<State> = {
  scenario: ScenarioRef
  state: State
  sequence: number
}

export type CalculationTrace = {
  equationKey: string
  inputs: Record<string, number | string>
  outputs: Record<string, number | string>
  sourceKeys: string[]
}

export type Observation = {
  code: string
  titleKey: string
  detailKey: string
  data: Record<string, number | string>
}

export type DomainWarning = {
  code: string
  severity: 'info' | 'warning' | 'blocking'
  messageKey: string
  data: Record<string, number | string>
}

export type ResourceDelta = {
  reagents: Record<string, { amount: number; unit: string }>
  waterLiters: number
  operationCount: number
  relativeCostIndexDelta: number | null
  safetyPenalties: Array<{ code: string; points: number }>
  secondaryWaste: Record<string, { amount: number; unit: string }>
}

export type CriterionResult = {
  key: string
  evaluable: boolean
  met: boolean
  actual: number | string | null
  target: number | string
  unit: string | null
}

export type SimulationResult<State> = {
  nextState: State
  observations: Observation[]
  calculationTrace: CalculationTrace[]
  warnings: DomainWarning[]
  resourceDelta: ResourceDelta
}

/** docs/data-and-state-model.md §10.1 */
export type SafetyPenalty = {
  code: string
  points: number
  committedAtSequence: number
  descriptionKey?: string
}

export type ResourceLedger = {
  reagents: Record<string, { amount: number; unit: string }>
  waterLiters: number
  operationCount: number
  relativeCostIndex: number | null
  costConventionVersion: string | null
  safetyIndex: number | null
  safetyConventionVersion: string | null
  safetyPenalties: SafetyPenalty[]
  secondaryWaste: Record<string, { amount: number; unit: string }>
}

/** docs/data-and-state-model.md §10.2 */
export type GoalStatus = {
  evaluable: boolean
  goalMet: boolean
  primaryCriteria: CriterionResult[]
  efficiencyCriteria: CriterionResult[]
  achievementPercent: number
}

export type MeasurementRecord = {
  sequence: number
  quantity: string
  value: number | null
  unit: string
  instrumentId?: string
  readingStable?: boolean
  compositionRevision?: number
}

/** docs/data-and-state-model.md §10 */
export type AttemptStateEnvelope<TDomainState> = {
  scenarioKey: ScenarioKey
  scenarioReleaseId: string
  sequence: number
  phase: string
  domain: TDomainState
  resources: ResourceLedger
  measurements: MeasurementRecord[]
  goalStatus: GoalStatus
}

export const ATTEMPT_STATUSES = ['in_progress', 'completed', 'stopped'] as const
export type AttemptStatus = (typeof ATTEMPT_STATUSES)[number]

/**
 * Stable domain error categories. Presentation maps these to localized text;
 * logic branches on the category, never on message strings.
 */
export const DOMAIN_ERROR_CATEGORIES = [
  'invalid_input',
  'precondition_failed',
  'model_invalid',
  'solver_not_converged',
  'conflict',
  'unsupported_release',
] as const

export type DomainErrorCategory = (typeof DOMAIN_ERROR_CATEGORIES)[number]

export type DomainError = {
  category: DomainErrorCategory
  code: string
  messageKey: string
  data: Record<string, number | string | boolean | null>
}

/**
 * Scenario release registry entry. A release locks engine, scoring, state
 * schema, content and evidence together (docs/system-architecture.md §6.2).
 */
export type ScenarioReleaseManifest = {
  scenarioKey: ScenarioKey
  releaseId: string
  modelSpecVersion: string
  scoringVersion: string
  stateSchemaVersion: string
  contentVersion: string
  evidenceRegisterVersion: string
  projectionVersion: number
}

/**
 * A domain module owns its state, actions, engine adapter and tests
 * (docs/system-architecture.md §4.1).
 *
 * Modules are built by a factory that binds the frozen release configuration,
 * so the Process Core stays generic: it never needs to know a scenario's
 * constants to run it.
 *
 * `run` may return a DomainError even after `validateAction` passed, because
 * the model can fail mid-computation — an equilibrium solver that does not
 * converge, or a state that turns out not evaluable. In that case the action
 * commits nothing: no event, no state change. Spec §12 is explicit that the
 * EQUILIBRIUM_NO_CONVERGENCE branch must not commit the action.
 */
export type DomainModule<State, Actions extends SimulationAction = SimulationAction> = {
  manifest: ScenarioReleaseManifest
  createInitialState(): State
  actionTypes: readonly string[]
  /**
   * Physical quantity each numeric parameter name must express, keyed by
   * parameter name.
   *
   * Required, not optional: without it the pipeline cannot distinguish a
   * legitimate unit conversion from a unit that measures something else
   * entirely. Sending `{ volumeL: 5 }` with `unitSelections: { volumeL: 'g' }`
   * would otherwise convert "5 grams" to 5, and the engine would dose 5 LITRES
   * — a 1000x error that still converges and still produces a plausible pH.
   *
   * A parameter absent from this map must not carry a unit selection; declaring
   * a unit for an undeclared parameter is rejected for the same reason.
   */
  parameterQuantities: Record<string, CanonicalQuantity>
  validateAction(context: SimulationContext<State>, action: Actions): DomainError | null
  run(context: SimulationContext<State>, action: Actions): SimulationResult<State> | DomainError
  evaluateGoalStatus(state: State, resources: ResourceLedger): GoalStatus
}
