/**
 * Acid neutralization scenario module — public surface.
 *
 * The application layer imports this barrel, not the individual files, so the
 * scenario's internal decomposition (solver vs. scoring vs. resources) stays
 * private and can change without touching callers
 * (docs/system-architecture.md §4.1: a domain module owns its state, actions,
 * engine adapter and tests).
 *
 * Nothing here imports React, Next or Supabase. That boundary is asserted by
 * tests/unit/domain-boundaries.test.ts.
 */

export {
  // Release identity and the module factory — the only two things a caller
  // needs to register and run the scenario.
  ACID_RELEASE_ID,
  ACID_ACTION_TYPES,
  isAcidActionType,
  createAcidNeutralizationModule,
  benchmarkScenarioConfig,
  benchmarkConstants,
  createInitialAcidState,
  createAcidStateFor,
} from './engine.js'
export type { AcidActionType, AcidActionParameters } from './engine.js'

export { ACID_ROUTES, ACID_PHASES, isAcidRoute } from './state.js'
export type {
  AcidRoute,
  AcidPhase,
  AcidNeutralizationState,
  AcidNeutralizationConstants,
  AcidScenarioConfig,
  AcidEquilibriumResult,
  CarbonFractions,
  AliquotRecord,
  AliquotReagent,
  PermittedAliquotL,
  MeasurementRecordAcid,
} from './state.js'

export {
  MODEL_SPEC_VERSION,
  P_KW,
  KW,
  KA1_CARBONIC,
  KA2_CARBONIC,
  KH_CALCIUM,
  BENCHMARK_TARGET_PH,
  TARGET_TOLERANCE_PH,
  PERMITTED_ALIQUOTS_L,
  MAX_REAGENT_ADDITIONS,
  MAX_ACCEPTED_EVENTS,
  COST_CONVENTION_VERSION,
  SAFETY_CONVENTION_VERSION,
  SPEC_PUBLISHED_BENCHMARK_E_STAR_MMOL_EQ,
} from './constants.js'

export {
  solveEquilibrium,
  solveNaohEquilibrium,
  solveCalciumHydroxideEquilibrium,
  solveSodiumCarbonateEquilibrium,
  carbonFractions,
  solveVolumeForTargetPh,
  equilibriumInputsForBaseVolume,
  simulatedPhAtVolume,
  solutionConfigFrom,
} from './equilibrium.js'
export type {
  EquilibriumInputs,
  SolverOutcome,
  AcidSolutionConfig,
  TargetVolumeOutcome,
} from './equilibrium.js'

export {
  computeReagentMmol,
  computeReagentMassG,
  computeBaseEquivalentsMmolEq,
  computeCorrectionEquivalentsMmolEq,
  computeEgrossMmolEq,
  resolveTargetEquivalentsMmolEq,
  resolveTargetEquivalentsByRoute,
  computeRelativeCostIndex,
  computeSafetyPenalties,
  computeSafetyIndex,
  initialHclMmolFor,
  createInitialResourceLedger,
  buildFinalResourceLedger,
} from './resources.js'
export type { AcidReagentMmol, SafetyPenaltyEvaluation } from './resources.js'

export {
  evaluateSuccess,
  computePhScore,
  computeResourceScore,
  computeProcessCriteria,
  computeProcessScore,
  computeOverallScore,
  evaluateAcidScoreBreakdown,
  evaluateAcidGoalStatus,
  finalBaseAliquotMl,
  NOT_EVALUABLE_TARGET,
} from './scoring.js'
export type { AcidScoreBreakdown } from './scoring.js'

export {
  validateSelectRoute,
  validateCalibrateMeter,
  validateAddBase,
  validateMix,
  validateWaitForStableReading,
  validateMeasurePh,
  validateAddCorrectionAcid,
  validateComplete,
  validateAliquotVolume,
  validateVolumeCap,
  validateEventLimits,
  isPermittedAliquot,
  isMeasuredPhAboveTarget,
  targetDeviationCode,
  MAX_BASE_VOLUME_L_BY_ROUTE,
  maxCorrectionAcidVolumeL,
} from './validation.js'
export type { AcidPreconditionContext } from './validation.js'

export {
  checkEquilibriumInvariants,
  checkStateInvariants,
  isMeasurementCurrent,
  INVALID_REASON_CODES,
} from './invariants.js'
export type { InvalidReasonCode } from './invariants.js'
