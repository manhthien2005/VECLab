/**
 * Process Core public surface.
 *
 * This is the ONLY module the application layer and route handlers import for
 * process concerns (docs/system-architecture.md §4.2). Reaching into
 * `lifecycle.js` or `scenario-registry.js` directly from `src/app/**` or
 * `src/infrastructure/**` bypasses the boundary that keeps the domain free of
 * Next and Supabase imports, and is rejected by
 * tests/unit/domain-boundaries.test.ts.
 */

export type {
  UUID,
  ScenarioKey,
  ScenarioRef,
  SimulationAction,
  SimulationContext,
  CalculationTrace,
  Observation,
  DomainWarning,
  ResourceDelta,
  CriterionResult,
  SimulationResult,
  SafetyPenalty,
  ResourceLedger,
  GoalStatus,
  MeasurementRecord,
  AttemptStateEnvelope,
  AttemptStatus,
  DomainErrorCategory,
  DomainError,
  ScenarioReleaseManifest,
  DomainModule,
} from './contracts.js'

export { SCENARIO_KEYS, ATTEMPT_STATUSES, DOMAIN_ERROR_CATEGORIES } from './contracts.js'

export { canonicalize, isCanonicalJson } from './canonical-json.js'

export {
  requestFingerprint,
  fingerprintFromAction,
  stateHash,
  canonicalString,
} from './hashing.js'
export type { RequestFingerprintPayload } from './hashing.js'

export {
  createInitialResourceLedger,
  applyResourceDelta,
} from './ledger.js'

export {
  normalizeParameters,
  runCommand,
  replayEvents,
  undoLastAction,
} from './lifecycle.js'
export type {
  UnitSelections,
  PendingCommand,
  CommittedEvent,
  CommandOutcome,
  ReplayResult,
  StoredEvent,
  UndoOutcome,
} from './lifecycle.js'

export {
  registerRelease,
  canServeRelease,
  getRegisteredRelease,
  registeredReleasesFor,
  registeredReleaseIds,
  clearRegistry,
  isResumable,
} from './scenario-registry.js'
export type { RegisteredRelease } from './scenario-registry.js'
