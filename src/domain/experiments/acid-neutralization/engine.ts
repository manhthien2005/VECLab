import type {
  DomainModule,
  DomainError,
  SimulationAction,
  SimulationContext,
  SimulationResult,
  ResourceDelta,
  Observation,
  CalculationTrace,
  DomainWarning,
  ResourceLedger,
  GoalStatus,
} from '@/domain/process/contracts.js'
import { preconditionFailed } from '@/shared/errors/domain-errors.js'
import {
  KW,
  KA1_CARBONIC,
  KA2_CARBONIC,
  KH_CALCIUM,
  LOCKED_CONDITIONS,
  BENCHMARK_SAMPLE,
  BENCHMARK_TARGET_PH,
  TARGET_TOLERANCE_PH,
  SOURCE_KEYS,
  CLAIM_IDS,
  MODEL_SPEC_VERSION,
  EQUIVALENTS_PER_MOLE,
} from './constants.js'
import { solveEquilibrium } from './equilibrium.js'
import {
  checkEquilibriumInvariants,
  checkStateInvariants,
  type InvalidReasonCode,
} from './invariants.js'
import {
  computeReagentMmol,
  computeBaseEquivalentsMmolEq,
  computeCorrectionEquivalentsMmolEq,
  computeRelativeCostIndex,
  computeSafetyIndex,
  computeSafetyPenalties,
  createInitialResourceLedger,
  buildFinalResourceLedger,
  resolveTargetEquivalentsByRoute,
} from './resources.js'
import { evaluateAcidGoalStatus } from './scoring.js'
import {
  validateSelectRoute,
  validateCalibrateMeter,
  validateAddBase,
  validateMix,
  validateWaitForStableReading,
  validateMeasurePh,
  validateAddCorrectionAcid,
  validateComplete,
  isPermittedAliquot,
  MAX_BASE_VOLUME_L_BY_ROUTE,
  type AcidPreconditionContext,
} from './validation.js'
import {
  isAcidRoute,
  type AcidEquilibriumResult,
  type AcidNeutralizationState,
  type AcidNeutralizationConstants,
  type AcidScenarioConfig,
  type AcidRoute,
  type PermittedAliquotL,
} from './state.js'

/**
 * Acid neutralization engine — the domain module for release
 * `acid-neutralization@1.0.0`.
 *
 * Implements docs/experiments/acid-neutralization-spec.md. It is a pure
 * function of (state, action, frozen config): no React, no database, no I/O, no
 * wall-clock. The same event chain replays to the same final state on any
 * device (docs/system-architecture.md §1, spec §21).
 *
 * Two rules govern every transition here:
 *   1. A rejected action mutates nothing and emits no event (§13.2). Validation
 *      runs first, and a failed solver returns a DomainError rather than a
 *      partially updated state (§12).
 *   2. Any chemistry addition atomically invalidates the stale reading (§5.2):
 *      mixedSinceLastAddition, readingStable, lastMeasuredPH,
 *      lastMeasuredCompositionRevision and equilibrium all reset, and modelValid
 *      drops until the sample is mixed again. Forgetting one of these lets a
 *      learner complete on a reading that no longer describes the beaker.
 */

export const ACID_RELEASE_ID = `acid-neutralization@${MODEL_SPEC_VERSION}`

/** Action types in the order the scenario offers them (§5). */
export const ACID_ACTION_TYPES = [
  'select_route',
  'calibrate_meter',
  'add_base',
  'mix',
  'wait_for_stable_reading',
  'measure_ph',
  'add_correction_acid',
  'complete',
] as const

export type AcidActionType = (typeof ACID_ACTION_TYPES)[number]

/**
 * Whether an arbitrary string is an action type of this release.
 *
 * A guard rather than a cast: `actionType` arrives from an untrusted payload,
 * and §5.1 requires an action type outside the scenario definition to be
 * rejected rather than coerced into a switch that silently falls through.
 */
export function isAcidActionType(value: unknown): value is AcidActionType {
  return typeof value === 'string' && (ACID_ACTION_TYPES as readonly string[]).includes(value)
}

/**
 * Typed action parameters. The Process Core normalizes incoming
 * SimulationAction payloads into this shape before calling `run`, so the engine
 * never parses strings and never sees non-canonical units.
 */
export type AcidActionParameters = {
  select_route: { route: AcidRoute }
  calibrate_meter: Record<string, never>
  add_base: { volumeL: PermittedAliquotL }
  mix: Record<string, never>
  wait_for_stable_reading: Record<string, never>
  measure_ph: Record<string, never>
  add_correction_acid: { volumeL: PermittedAliquotL }
  complete: Record<string, never>
}

/** Locked constant bundle for the benchmark sample (spec §2, §6). */
export function benchmarkConstants(): AcidNeutralizationConstants {
  return {
    // LOCKED_CONDITIONS is the single place the 25 °C / 0.1 MPa lock is stated;
    // hardcoding it again here would let the two drift (§6.1 forbids changing
    // the bundle piecemeal).
    temperatureC: LOCKED_CONDITIONS.temperatureC,
    pressureMPa: LOCKED_CONDITIONS.pressureMPa,
    acidVolumeL: BENCHMARK_SAMPLE.acidVolumeL,
    acidConcentrationMolL: BENCHMARK_SAMPLE.acidConcentrationMolL,
    baseEquivalentConcentrationEqL: 0.01,
    kw: KW,
    carbonateKa1: KA1_CARBONIC,
    carbonateKa2: KA2_CARBONIC,
    calciumHydrolysisK: KH_CALCIUM,
    targetPH: BENCHMARK_TARGET_PH,
    targetTolerancePH: TARGET_TOLERANCE_PH,
  }
}

/** Frozen configuration for a benchmark run. */
export function benchmarkScenarioConfig(): AcidScenarioConfig {
  return {
    constants: benchmarkConstants(),
    maxBaseVolumeLByRoute: { ...MAX_BASE_VOLUME_L_BY_ROUTE },
  }
}

/**
 * §4.2 initial state. The sample exists and is measurable in principle, but
 * nothing has been added: no route, no composition revision, no equilibrium.
 * `modelValid` starts false because there is nothing evaluated yet, which is
 * why `complete` cannot fire before the first measurement (§5).
 */
export function createInitialAcidState(): AcidNeutralizationState {
  return {
    route: null,
    phase: 'setup',
    compositionRevision: 0,
    totalVolumeL: 0,
    chlorideMoles: 0,
    sodiumMoles: 0,
    calciumMoles: 0,
    totalInorganicCarbonMoles: 0,
    baseVolumeL: 0,
    correctionAcidVolumeL: 0,
    aliquotHistory: [],
    directionChangeCount: 0,
    meterCalibrated: false,
    mixedSinceLastAddition: false,
    readingStable: false,
    lastMeasuredPH: null,
    lastMeasuredCompositionRevision: null,
    measurements: [],
    equilibrium: null,
    modelValid: false,
    invalidReasonCodes: [],
  }
}

/**
 * Seed the sample from the frozen configuration. Kept separate from
 * `createInitialAcidState` so the initial state shape stays release-stable while
 * the sample comes from configuration.
 */
export function createAcidStateFor(config: AcidScenarioConfig): AcidNeutralizationState {
  const { acidVolumeL, acidConcentrationMolL } = config.constants
  return {
    ...createInitialAcidState(),
    phase: 'ready',
    totalVolumeL: acidVolumeL,
    chlorideMoles: acidVolumeL * acidConcentrationMolL,
    // A delivered 25.00 mL HCl sample is already homogeneous, so the very first
    // reading needs no stirring. Without this, `mix` refuses ("nothing has been
    // added") while `measure_ph` demands a mixed sample, and AN-G01 — measuring
    // the untouched sample at pH* 2.00000 — becomes unreachable.
    mixedSinceLastAddition: true,
  }
}

/**
 * §5.2 — atomically invalidate the reading after any composition change.
 *
 * Returns a fresh object rather than mutating: state is immutable and the
 * previous snapshot is what `state_before_hash` was computed from, so mutating
 * would corrupt the event log's integrity chain.
 */
function invalidateReading(state: AcidNeutralizationState): AcidNeutralizationState {
  return {
    ...state,
    mixedSinceLastAddition: false,
    readingStable: false,
    lastMeasuredPH: null,
    lastMeasuredCompositionRevision: null,
    equilibrium: null,
    modelValid: false,
    invalidReasonCodes: [],
  }
}

/** Outcome of solving the current composition and checking §16 invariants. */
type CompositionSolution =
  | {
      ok: true
      equilibrium: AcidEquilibriumResult
      modelValid: boolean
      invalidReasonCodes: InvalidReasonCode[]
    }
  | { ok: false; code: string; data: Record<string, number | string> }

/**
 * Solve the equilibrium for the composition described by `state` and run the
 * §16 invariant checks, WITHOUT storing anything back into state.
 *
 * Reads moles and volume straight off state, which are already canonical, so it
 * needs no configuration of its own.
 *
 * Splitting solve from store is what lets `add_base` honour both halves of the
 * spec at once. §12 requires a non-converging action to commit nothing, so the
 * addition must be evaluated before it is accepted. §5.2 requires the reading to
 * be invalidated by the addition and stay invalid until the sample is mixed, so
 * the solved value must NOT be recorded at addition time — an unstirred beaker
 * is not at equilibrium and reporting one would be a false measurement.
 */
function solveForComposition(state: AcidNeutralizationState): CompositionSolution {
  const route = state.route
  if (route === null) {
    return { ok: false, code: 'ROUTE_NOT_SELECTED', data: {} }
  }

  const outcome = solveEquilibrium({
    route,
    totalVolumeL: state.totalVolumeL,
    chlorideMoles: state.chlorideMoles,
    sodiumMoles: state.sodiumMoles,
    calciumMoles: state.calciumMoles,
    totalInorganicCarbonMoles: state.totalInorganicCarbonMoles,
  })

  if (!outcome.ok) {
    return { ok: false, code: outcome.code, data: outcome.data }
  }

  const violations = checkEquilibriumInvariants(outcome.result, route)
  const expectedTotalCalciumMolL =
    route === 'calcium-hydroxide' ? state.calciumMoles / state.totalVolumeL : null
  const stateViolations = checkStateInvariants(state, expectedTotalCalciumMolL)
  const invalidReasonCodes: InvalidReasonCode[] = [...violations, ...stateViolations]

  return {
    ok: true,
    equilibrium: outcome.result,
    modelValid: invalidReasonCodes.length === 0,
    invalidReasonCodes,
  }
}

/** Map a failed solve onto the §12 error the learner should see. */
function solverFailureError(failure: { code: string; data: Record<string, number | string> }): DomainError {
  const volumeFailed = failure.code === 'MODEL_INVALID_VOLUME'
  return preconditionFailed(
    volumeFailed ? 'VOLUME_OUT_OF_RANGE' : 'EQUILIBRIUM_NO_CONVERGENCE',
    volumeFailed ? 'errors.VOLUME_OUT_OF_RANGE' : 'errors.EQUILIBRIUM_NO_CONVERGENCE',
    failure.data,
  )
}

/**
 * Molar amount of base delivered per litre of the route's stock, from the
 * frozen configuration. Derived from normality rather than hardcoded so the
 * engine cannot disagree with the solver about what the stock is.
 */
function baseMolarConcMolL(config: AcidScenarioConfig, route: AcidRoute): number {
  return config.constants.baseEquivalentConcentrationEqL / EQUIVALENTS_PER_MOLE[route]
}

/** Build the calculation trace required by §10 for the current route. */
function buildCalculationTrace(
  state: AcidNeutralizationState,
  config: AcidScenarioConfig,
  route: AcidRoute,
): CalculationTrace[] {
  const equilibrium = state.equilibrium
  if (equilibrium === null) return []

  const trace: CalculationTrace[] = []
  const totalVolumeL = state.totalVolumeL

  // Common to all routes: volume, chloride, sodium and the water ion product.
  trace.push({
    equationKey: 'acid.charge_balance.common',
    inputs: {
      totalVolumeL,
      chlorideMoles: state.chlorideMoles,
      sodiumMoles: state.sodiumMoles,
      kw: config.constants.kw,
    },
    outputs: {
      chlorideMolL: state.chlorideMoles / totalVolumeL,
      sodiumMolL: state.sodiumMoles / totalVolumeL,
      hydrogenMolL: equilibrium.hydrogenMolL,
      hydroxideMolL: equilibrium.hydroxideMolL,
      simulatedPH: equilibrium.simulatedPH,
      chargeBalanceResidualMolL: equilibrium.chargeBalanceResidualMolL,
    },
    sourceKeys: [SOURCE_KEYS.kw, SOURCE_KEYS.phDefinition],
  })

  if (route === 'calcium-hydroxide') {
    trace.push({
      equationKey: 'acid.calcium_hydroxide.speciation',
      inputs: {
        calciumMoles: state.calciumMoles,
        totalCalciumMolL: state.calciumMoles / totalVolumeL,
        calciumHydrolysisK: config.constants.calciumHydrolysisK,
      },
      outputs: {
        calciumMolL: equilibrium.calciumMolL ?? 0,
        calciumHydroxideComplexMolL: equilibrium.calciumHydroxideComplexMolL ?? 0,
      },
      sourceKeys: [SOURCE_KEYS.carbonicAndCalciumEquilibria, SOURCE_KEYS.calciumHydroxideSolubility],
    })
  }

  if (route === 'sodium-carbonate') {
    const fractions = equilibrium.carbonFractions
    const totalCarbonMolL = equilibrium.totalInorganicCarbonMolL ?? 0
    trace.push({
      equationKey: 'acid.sodium_carbonate.speciation',
      inputs: {
        totalInorganicCarbonMoles: state.totalInorganicCarbonMoles,
        totalInorganicCarbonMolL: totalCarbonMolL,
        carbonateKa1: config.constants.carbonateKa1,
        carbonateKa2: config.constants.carbonateKa2,
        kw: config.constants.kw,
      },
      outputs: {
        alpha0Co2Star: fractions?.co2Star ?? 0,
        alpha1Bicarbonate: fractions?.bicarbonate ?? 0,
        alpha2Carbonate: fractions?.carbonate ?? 0,
        co2StarMolL: (fractions?.co2Star ?? 0) * totalCarbonMolL,
        bicarbonateMolL: (fractions?.bicarbonate ?? 0) * totalCarbonMolL,
        carbonateMolL: (fractions?.carbonate ?? 0) * totalCarbonMolL,
      },
      sourceKeys: [SOURCE_KEYS.carbonicAndCalciumEquilibria, SOURCE_KEYS.co2ExchangeLimitation],
    })
  }

  return trace
}

/** Route-dependent observations the learner must be shown (§13.1). */
function buildObservations(
  state: AcidNeutralizationState,
  route: AcidRoute,
  sequence: number,
): Observation[] {
  const observations: Observation[] = []
  const equilibrium = state.equilibrium
  if (equilibrium === null) return observations

  const baseEquivalentsMmolEq = computeBaseEquivalentsMmolEq(state)
  observations.push({
    code: 'OBSERVATION_BASE_EQUIVALENTS',
    titleKey: 'observations.equivalence.approaching',
    detailKey: 'observations.equivalence.approaching',
    data: {
      sequence,
      baseEquivalentsMmolEq,
      simulatedPH: equilibrium.simulatedPH,
    },
  })

  if (route === 'sodium-carbonate') {
    // §9.3: this is the single most misunderstood result in the scenario, so
    // the closed-carbon explanation must accompany every carbonate reading.
    observations.push({
      code: 'OBSERVATION_CARBONATE_EQUILIBRIUM',
      titleKey: 'observations.carbonate.equilibrium',
      detailKey: 'observations.carbonate.equilibrium',
      data: {
        sequence,
        totalInorganicCarbonMolL: equilibrium.totalInorganicCarbonMolL ?? 0,
        alpha0: equilibrium.carbonFractions?.co2Star ?? 0,
        alpha1: equilibrium.carbonFractions?.bicarbonate ?? 0,
        alpha2: equilibrium.carbonFractions?.carbonate ?? 0,
      },
    })
  }

  if (route === 'calcium-hydroxide') {
    observations.push({
      code: 'OBSERVATION_CALCIUM_COMPLEX',
      titleKey: 'observations.calcium.complex',
      detailKey: 'observations.calcium.complex',
      data: {
        sequence,
        calciumMolL: equilibrium.calciumMolL ?? 0,
        calciumHydroxideComplexMolL: equilibrium.calciumHydroxideComplexMolL ?? 0,
      },
    })
  }

  if (state.correctionAcidVolumeL > 0) {
    observations.push({
      code: 'OBSERVATION_CORRECTION_APPLIED',
      titleKey: 'observations.correction.applied',
      detailKey: 'observations.correction.applied',
      data: {
        sequence,
        correctionAcidVolumeL: state.correctionAcidVolumeL,
        correctionEquivalentsMmolEq: computeCorrectionEquivalentsMmolEq(state),
      },
    })
  }

  return observations
}

/**
 * Limitations that must stay visible whenever this scenario is used
 * (docs/scientific-evidence-register.md §2 requirement 7). These are not
 * errors: they are model boundaries the learner could otherwise misread as
 * real-world guarantees.
 */
function buildWarnings(route: AcidRoute, state: AcidNeutralizationState): DomainWarning[] {
  const warnings: DomainWarning[] = [
    {
      code: 'LIMIT_IDEAL_ACTIVITY',
      severity: 'info',
      messageKey: 'warnings.model.ideal-activity',
      data: {},
    },
    {
      code: 'LIMIT_NO_KINETICS',
      severity: 'info',
      messageKey: 'warnings.model.no-kinetics',
      data: {},
    },
    {
      code: 'LIMIT_MATRIX',
      severity: 'info',
      messageKey: 'warnings.model.matrix-limit',
      data: {},
    },
    {
      code: 'SAFETY_SUPERVISED_LAB',
      severity: 'warning',
      messageKey: 'warnings.safety.supervised-lab',
      data: {},
    },
  ]

  if (route === 'sodium-carbonate') {
    warnings.push({
      code: 'CO2_EXCHANGE_UNMODELED',
      severity: 'warning',
      messageKey: 'warnings.model.closed-carbon',
      data: {
        totalInorganicCarbonMoles: state.totalInorganicCarbonMoles,
      },
    })
  }

  // §16.2/§12: an invalid model must be surfaced as blocking, because the run
  // cannot be completed and the indices must read N/A rather than a number.
  if (!state.modelValid && state.invalidReasonCodes.length > 0) {
    warnings.push({
      code: 'MODEL_INVALID',
      severity: 'blocking',
      messageKey: 'errors.EQUILIBRIUM_NO_CONVERGENCE',
      data: { invalidReasonCodes: state.invalidReasonCodes.join(',') },
    })
  }

  return warnings
}

/**
 * ResourceDelta carrying the chemistry facts of one action (§13.2).
 *
 * Units are mmol because the cost convention is defined per mmol (§13.4). The
 * engine deliberately reports reagent amounts and operation counts only — the
 * cost and safety indices are rubric, owned by resources.ts/scoring.ts.
 */
function resourceDeltaForAddition(
  route: AcidRoute,
  reagent: 'base' | 'correction-acid',
  volumeL: number,
  config: AcidScenarioConfig,
): ResourceDelta {
  const volumeMl = volumeL * 1000
  const reagents: ResourceDelta['reagents'] = {}

  if (reagent === 'correction-acid') {
    reagents.correctionHcl = {
      amount: volumeMl * config.constants.acidConcentrationMolL,
      unit: 'mmol',
    }
  } else {
    const molarConcMolL = baseMolarConcMolL(config, route)
    const amountMmol = volumeMl * molarConcMolL
    switch (route) {
      case 'naoh':
        reagents.naoh = { amount: amountMmol, unit: 'mmol' }
        break
      case 'calcium-hydroxide':
        reagents.calciumHydroxide = { amount: amountMmol, unit: 'mmol' }
        break
      case 'sodium-carbonate':
        reagents.sodiumCarbonate = { amount: amountMmol, unit: 'mmol' }
        break
    }
  }

  return {
    reagents,
    // No water addition is modelled in this scenario (§19 excludes dilution).
    waterLiters: 0,
    operationCount: 1,
    relativeCostIndexDelta: null,
    safetyPenalties: [],
    secondaryWaste: {},
  }
}

/** Delta for a non-reagent action: an operation happened, nothing was consumed. */
const EMPTY_OPERATION_DELTA: ResourceDelta = {
  reagents: {},
  waterLiters: 0,
  operationCount: 1,
  relativeCostIndexDelta: null,
  safetyPenalties: [],
  secondaryWaste: {},
}

function noOperationDelta(): ResourceDelta {
  return { ...EMPTY_OPERATION_DELTA, reagents: {}, secondaryWaste: {} }
}

/**
 * Factory binding a frozen configuration to the engine.
 *
 * The Process Core stays generic because everything scenario-specific — sample,
 * normality, target, volume caps — arrives through `config`, and everything
 * release-specific through the manifest. Two releases can therefore coexist in
 * the runtime registry without the core knowing either (§2.4).
 */
export function createAcidNeutralizationModule(
  config: AcidScenarioConfig = benchmarkScenarioConfig(),
): DomainModule<AcidNeutralizationState> {
  const { constants } = config

  /**
   * Per-route E* for this run's target, resolved by inverting the model
   * (§14.3). Computed once per module because the config is frozen: deriving it
   * on every action would re-run a nested solver for no benefit.
   *
   * Shared with the projection factory (resources.ts) so a projection can never
   * score an attempt against a different E* than the engine that produced it.
   */
  const targetEquivalentsByRoute = resolveTargetEquivalentsByRoute(config)

  function preconditionContext(
    state: AcidNeutralizationState,
    sequence: number,
  ): AcidPreconditionContext {
    return {
      acidVolumeL: constants.acidVolumeL,
      temperatureC: constants.temperatureC,
      routeSelection: state.route,
      totalAcceptedEvents: sequence,
    }
  }

  /**
   * Append an accepted measurement. The log is the evidence for the §14.4
   * procedure criterion, so it records the composition revision the reading
   * belongs to — a reading detached from a revision cannot be trusted on
   * replay.
   */
  function recordMeasurement(
    state: AcidNeutralizationState,
    sequence: number,
    simulatedPH: number,
  ): AcidNeutralizationState {
    return {
      ...state,
      lastMeasuredPH: simulatedPH,
      lastMeasuredCompositionRevision: state.compositionRevision,
      measurements: [
        ...state.measurements,
        {
          sequence,
          compositionRevision: state.compositionRevision,
          simulatedPH,
          baseVolumeL: state.baseVolumeL,
          correctionAcidVolumeL: state.correctionAcidVolumeL,
        },
      ],
    }
  }

  /**
   * Apply one action. Every branch either returns a DomainError (committing
   * nothing) or a complete SimulationResult with the new immutable state.
   */
  function runAction(
    state: AcidNeutralizationState,
    actionType: AcidActionType,
    parameters: Record<string, number | string | boolean>,
    sequence: number,
  ): SimulationResult<AcidNeutralizationState> | DomainError {
    const context = preconditionContext(state, sequence)
    const route = state.route

    switch (actionType) {
      case 'select_route': {
        const selected = parameters.route
        if (!isAcidRoute(selected)) {
          return preconditionFailed('ROUTE_NOT_SELECTED', 'errors.ROUTE_NOT_SELECTED', {
            route: typeof selected === 'string' ? selected : '',
          })
        }
        const error = validateSelectRoute(state, context)
        if (error) return error

        const nextRoute = selected
        const withRoute: AcidNeutralizationState = { ...state, route: nextRoute }

        // Solve the delivered sample now. Before a route exists the engine cannot
        // know which model applies, and `mix` refuses an un-dosed sample as
        // having nothing to stir, so this is the only point at which the
        // untouched sample can be modelled at all. Without it AN-G01 — pH*
        // 2.00000 before any base is added (§15) — is unreachable: `measure_ph`
        // would find no equilibrium to report.
        //
        // This stores a composition model, not a measurement. `lastMeasuredPH`
        // stays null until the learner actually measures, so no reading is
        // claimed that nobody took.
        const baseline = solveForComposition(withRoute)
        if (!baseline.ok) return solverFailureError(baseline)

        const resolved: AcidNeutralizationState = {
          ...withRoute,
          equilibrium: baseline.equilibrium,
          modelValid: baseline.modelValid,
          invalidReasonCodes: baseline.invalidReasonCodes,
        }

        return {
          nextState: resolved,
          observations: [
            {
              code: 'OBSERVATION_ROUTE_LOCKED',
              titleKey: 'observations.route.locked',
              detailKey: 'observations.route.locked',
              data: { route: nextRoute },
            },
          ],
          calculationTrace: buildCalculationTrace(resolved, config, nextRoute),
          warnings: buildWarnings(nextRoute, resolved),
          resourceDelta: noOperationDelta(),
        }
      }

      case 'calibrate_meter': {
        const error = validateCalibrateMeter(state, context)
        if (error) return error
        return {
          nextState: { ...state, meterCalibrated: true },
          observations: [],
          calculationTrace: [],
          warnings: route !== null ? buildWarnings(route, state) : [],
          resourceDelta: noOperationDelta(),
        }
      }

      case 'add_base':
      case 'add_correction_acid': {
        if (route === null) {
          return preconditionFailed('ROUTE_NOT_SELECTED', 'errors.ROUTE_NOT_SELECTED', {})
        }
        const requestedVolumeL = parameters.volumeL
        // Narrow once here: the guard makes `volumeL` a PermittedAliquotL, so the
        // AliquotRecord below needs no cast. The validators re-check the same
        // constraint for their own error reporting, but narrowing cannot travel
        // back out of a function that returns an error, so it is done here too.
        if (typeof requestedVolumeL !== 'number' || !isPermittedAliquot(requestedVolumeL)) {
          return preconditionFailed('ALIQUOT_NOT_PERMITTED', 'errors.ALIQUOT_NOT_PERMITTED', {
            volumeL: typeof requestedVolumeL === 'number' ? requestedVolumeL : 0,
          })
        }
        const volumeL = requestedVolumeL

        const isCorrection = actionType === 'add_correction_acid'
        const validationError = isCorrection
          ? validateAddCorrectionAcid(state, context, volumeL, constants.targetPH)
          : validateAddBase(state, context, volumeL)
        if (validationError) return validationError

        const baseMolarConcMolLValue = baseMolarConcMolL(config, route)
        const addedMoles = volumeL * baseMolarConcMolLValue

        // §5.2: any composition change invalidates the previous reading first,
        // then applies the chemistry on top of that clean baseline.
        const invalidated = invalidateReading(state)

        let nextState: AcidNeutralizationState
        if (isCorrection) {
          const correctionMoles = volumeL * config.constants.acidConcentrationMolL
          nextState = {
            ...invalidated,
            // Correction is a direction change: base then acid (§13.2).
            directionChangeCount: invalidated.directionChangeCount + 1,
            compositionRevision: invalidated.compositionRevision + 1,
            correctionAcidVolumeL: invalidated.correctionAcidVolumeL + volumeL,
            totalVolumeL: invalidated.totalVolumeL + volumeL,
            chlorideMoles: invalidated.chlorideMoles + correctionMoles,
            // §4.2 ladder is setup -> ready -> mixed -> stable -> completed.
            // A dose leaves the sample un-stirred, and `invalidateReading` sets
            // mixedSinceLastAddition false, so the honest phase is 'ready'
            // (awaiting mix). Marking it 'mixed' would contradict that flag and
            // let a UI show "mixed" for a beaker that has not been stirred.
            phase: 'ready',
            aliquotHistory: [
              ...invalidated.aliquotHistory,
              {
                sequence,
                route,
                reagent: 'correction-acid',
                volumeL,
                compositionRevision: invalidated.compositionRevision + 1,
              },
            ],
          }
        } else {
          nextState = {
            ...invalidated,
            compositionRevision: invalidated.compositionRevision + 1,
            baseVolumeL: invalidated.baseVolumeL + volumeL,
            totalVolumeL: invalidated.totalVolumeL + volumeL,
            phase: 'ready',
            sodiumMoles:
              route === 'naoh'
                ? invalidated.sodiumMoles + addedMoles
                : route === 'sodium-carbonate'
                  ? invalidated.sodiumMoles + 2 * addedMoles
                  : invalidated.sodiumMoles,
            calciumMoles:
              route === 'calcium-hydroxide'
                ? invalidated.calciumMoles + addedMoles
                : invalidated.calciumMoles,
            totalInorganicCarbonMoles:
              route === 'sodium-carbonate'
                ? invalidated.totalInorganicCarbonMoles + addedMoles
                : invalidated.totalInorganicCarbonMoles,
            aliquotHistory: [
              ...invalidated.aliquotHistory,
              {
                sequence,
                route,
                reagent: 'base',
                volumeL,
                compositionRevision: invalidated.compositionRevision + 1,
              },
            ],
          }
        }

        // Total inorganic carbon is conserved by a correction addition (§16.2):
        // HCl adds chloride and volume but no carbon, so it is not touched.
        //
        // The composition is solved here only to decide whether the action may
        // commit (§12: a non-converging action commits nothing). The solved
        // value is deliberately NOT stored, because §5.2 keeps the reading
        // invalid until the sample is mixed — an unstirred beaker is not at
        // equilibrium, so reporting one here would be a false measurement.
        const probed = solveForComposition(nextState)
        if (!probed.ok) return solverFailureError(probed)

        // nextState already carries the §5.2 invalidation: equilibrium null,
        // modelValid false, reading cleared. `mix` is what repopulates it.
        const resolved = nextState
        const resourceDelta = isCorrection
          ? resourceDeltaForAddition(route, 'correction-acid', volumeL, config)
          : resourceDeltaForAddition(route, 'base', volumeL, config)

        const trace = buildCalculationTrace(resolved, config, route)
        // The composition change itself is the trace the learner needs, even
        // before a reading exists.
        trace.unshift({
          equationKey: isCorrection
            ? 'acid.correction.composition'
            : 'acid.addition.composition',
          inputs: {
            route,
            addedVolumeL: volumeL,
            addedReagentMmol: isCorrection
              ? volumeL * 1000 * constants.acidConcentrationMolL
              : volumeL * 1000 * baseMolarConcMolLValue,
            compositionRevision: resolved.compositionRevision,
          },
          outputs: {
            totalVolumeL: resolved.totalVolumeL,
            chlorideMoles: resolved.chlorideMoles,
            sodiumMoles: resolved.sodiumMoles,
            calciumMoles: resolved.calciumMoles,
            totalInorganicCarbonMoles: resolved.totalInorganicCarbonMoles,
          },
          sourceKeys: [
            isCorrection ? CLAIM_IDS.safetyWording : CLAIM_IDS.kw25C,
          ],
        })

        return {
          nextState: resolved,
          observations: isCorrection
            ? [
                {
                  code: 'OBSERVATION_CORRECTION_APPLIED',
                  titleKey: 'observations.correction.applied',
                  detailKey: 'observations.correction.applied',
                  data: { sequence, correctionAcidVolumeL: resolved.correctionAcidVolumeL },
                },
              ]
            : [],
          calculationTrace: trace,
          warnings: buildWarnings(route, resolved),
          resourceDelta,
        }
      }

      case 'mix': {
        const error = validateMix(state, context)
        if (error) return error
        if (route === null) {
          return preconditionFailed('ROUTE_NOT_SELECTED', 'errors.ROUTE_NOT_SELECTED', {})
        }

        // §5.2: mixing resolves the equilibrium for the current composition
        // revision and records it. This is the only step that makes modelValid
        // meaningful, and the only one that stores an equilibrium result.
        const mixed: AcidNeutralizationState = {
          ...state,
          mixedSinceLastAddition: true,
          // §4.2 phase ladder is setup -> ready -> mixed -> stable -> completed;
          // `mix` is the transition that earns 'mixed'.
          phase: 'mixed',
        }
        const recomputed = solveForComposition(mixed)
        if (!recomputed.ok) return solverFailureError(recomputed)

        const resolved: AcidNeutralizationState = {
          ...mixed,
          equilibrium: recomputed.equilibrium,
          modelValid: recomputed.modelValid,
          invalidReasonCodes: recomputed.invalidReasonCodes,
        }

        return {
          nextState: resolved,
          observations: buildObservations(resolved, route, sequence),
          calculationTrace: buildCalculationTrace(resolved, config, route),
          warnings: buildWarnings(route, resolved),
          resourceDelta: noOperationDelta(),
        }
      }

      case 'wait_for_stable_reading': {
        const error = validateWaitForStableReading(state, context)
        if (error) return error
        // §5.3: this is an operating rule, not a kinetic model. No time is
        // simulated and no seconds are claimed.
        return {
          nextState: { ...state, readingStable: true, phase: 'stable' },
          observations: [],
          calculationTrace: [],
          warnings: route !== null ? buildWarnings(route, state) : [],
          resourceDelta: noOperationDelta(),
        }
      }

      case 'measure_ph': {
        const error = validateMeasurePh(state, context)
        if (error) return error
        if (route === null) {
          return preconditionFailed('ROUTE_NOT_SELECTED', 'errors.ROUTE_NOT_SELECTED', {})
        }
        const equilibrium = state.equilibrium
        if (equilibrium === null) {
          return preconditionFailed(
            'EQUILIBRIUM_NO_CONVERGENCE',
            'errors.EQUILIBRIUM_NO_CONVERGENCE',
            {},
          )
        }

        const measured = recordMeasurement(state, sequence, equilibrium.simulatedPH)
        return {
          nextState: measured,
          observations: buildObservations(measured, route, sequence),
          calculationTrace: buildCalculationTrace(measured, config, route),
          warnings: buildWarnings(route, measured),
          resourceDelta: noOperationDelta(),
        }
      }

      case 'complete': {
        const error = validateComplete(state, context)
        if (error) return error
        if (route === null) {
          return preconditionFailed('ROUTE_NOT_SELECTED', 'errors.ROUTE_NOT_SELECTED', {})
        }

        const targetEquivalentsMmolEq = targetEquivalentsByRoute[route]
        // §13.5: penalties commit at completion, because the excess-base and
        // final-pH tests both depend on the final measurement.
        const penalties = computeCommittedPenalties(state, targetEquivalentsMmolEq, sequence)

        const finalResourceDelta: ResourceDelta = {
          ...noOperationDelta(),
          safetyPenalties: penalties.map((penalty) => ({
            code: penalty.code,
            points: penalty.points,
          })),
        }

        return {
          nextState: { ...state, phase: 'completed' },
          observations: buildObservations(state, route, sequence),
          calculationTrace: buildCalculationTrace(state, config, route),
          warnings: buildWarnings(route, state),
          resourceDelta: finalResourceDelta,
        }
      }
    }
  }

  /**
   * Penalties committed at completion. Kept here rather than in resources.ts
   * because committing is an engine lifecycle decision: rejected actions must
   * never produce a penalty (§13.5), and only the engine knows an action was
   * accepted.
   */
  function computeCommittedPenalties(
    state: AcidNeutralizationState,
    targetEquivalentsMmolEq: number | null,
    sequence: number,
  ): Array<{ code: string; points: number }> {
    // Not evaluable, or no resolvable E*, means no penalty list at all (§13.5):
    // the indices read N/A rather than reporting a clean run.
    if (!state.modelValid || targetEquivalentsMmolEq === null) return []

    const { penalties } = computeSafetyPenalties(state, {
      targetEquivalentsMmolEq,
      sequence,
      modelEvaluable: true,
    })
    return penalties.map((penalty) => ({ code: penalty.code, points: penalty.points }))
  }

  return {
    manifest: {
      scenarioKey: 'acid-neutralization',
      releaseId: ACID_RELEASE_ID,
      modelSpecVersion: MODEL_SPEC_VERSION,
      scoringVersion: MODEL_SPEC_VERSION,
      stateSchemaVersion: MODEL_SPEC_VERSION,
      contentVersion: MODEL_SPEC_VERSION,
      evidenceRegisterVersion: '1.0.0',
      projectionVersion: 1,
    },

    createInitialState: () => createAcidStateFor(config),

    actionTypes: ACID_ACTION_TYPES,

    /**
     * `volumeL` is the only unit-carrying parameter in this scenario, and it is
     * always a volume (§3.2). `route` is a choice with no quantity, so it is
     * deliberately absent — declaring a quantity for it would invite a caller to
     * send a unit for a string.
     */
    parameterQuantities: {
      volumeL: 'volume',
    },

    validateAction(
      actionContext: SimulationContext<AcidNeutralizationState>,
      action: SimulationAction,
    ): DomainError | null {
      const { state, sequence } = actionContext
      const context = preconditionContext(state, sequence)
      const parameters = action.parameters

      switch (action.actionType) {
        case 'select_route':
          return validateSelectRoute(state, context)
        case 'calibrate_meter':
          return validateCalibrateMeter(state, context)
        case 'add_base':
          return typeof parameters.volumeL === 'number'
            ? validateAddBase(state, context, parameters.volumeL)
            : preconditionFailed('ALIQUOT_NOT_PERMITTED', 'errors.ALIQUOT_NOT_PERMITTED', {})
        case 'mix':
          return validateMix(state, context)
        case 'wait_for_stable_reading':
          return validateWaitForStableReading(state, context)
        case 'measure_ph':
          return validateMeasurePh(state, context)
        case 'add_correction_acid':
          return typeof parameters.volumeL === 'number'
            ? validateAddCorrectionAcid(
                state,
                context,
                parameters.volumeL,
                constants.targetPH,
              )
            : preconditionFailed('ALIQUOT_NOT_PERMITTED', 'errors.ALIQUOT_NOT_PERMITTED', {})
        case 'complete':
          return validateComplete(state, context)
        default:
          // §5.1: an action type outside the scenario definition is rejected,
          // never silently ignored.
          return preconditionFailed('UNKNOWN_ACTION_TYPE', 'errors.unsupportedRelease', {
            actionType: action.actionType,
            releaseId: ACID_RELEASE_ID,
          })
      }
    },

    run(
      actionContext: SimulationContext<AcidNeutralizationState>,
      action: SimulationAction,
    ): SimulationResult<AcidNeutralizationState> | DomainError {
      // Validate again inside run: the Process Core validates before calling,
      // but a module must not trust its caller to have done so.
      const validationError = this.validateAction(actionContext, action)
      if (validationError) return validationError

      // validateAction already rejects an unknown type via its default branch;
      // the guard restates that here so the value is actually AcidActionType
      // instead of a coerced string, and so the two checks cannot drift.
      if (!isAcidActionType(action.actionType)) {
        return preconditionFailed('UNKNOWN_ACTION_TYPE', 'errors.unsupportedRelease', {
          actionType: action.actionType,
          releaseId: ACID_RELEASE_ID,
        })
      }
      const actionType = action.actionType
      return runAction(
        actionContext.state,
        actionType,
        action.parameters,
        actionContext.sequence,
      )
    },

    evaluateGoalStatus(
      state: AcidNeutralizationState,
      resources: ResourceLedger,
    ): GoalStatus {
      const route = state.route
      if (route === null) {
        // No route means nothing was ever dosed: the run is not evaluable
        // rather than a zero-score failure.
        return {
          evaluable: false,
          goalMet: false,
          primaryCriteria: [],
          efficiencyCriteria: [],
          achievementPercent: 0,
        }
      }
      return evaluateAcidGoalStatus(
        state,
        resources,
        targetEquivalentsByRoute[route],
        constants.targetPH,
      )
    },
  }
}

// Re-exported so callers can build a ledger for a completed attempt without
// reaching into resources.ts directly.
export {
  createInitialResourceLedger,
  buildFinalResourceLedger,
  computeRelativeCostIndex,
  computeSafetyIndex,
  computeReagentMmol,
}
