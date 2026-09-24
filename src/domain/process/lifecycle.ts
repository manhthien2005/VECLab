import type {
  CalculationTrace,
  DomainError,
  DomainModule,
  DomainWarning,
  Observation,
  ResourceDelta,
  ResourceLedger,
  ScenarioRef,
  SimulationAction,
  SimulationContext,
  UUID,
} from '@/domain/process/contracts.js'
import {
  toCanonical,
  lookupUnit,
  CANONICAL_UNITS,
  type CanonicalQuantity,
} from '@/domain/units/index.js'
import {
  preconditionFailed,
  modelInvalid,
  revisionConflict,
  unsupportedRelease,
} from '@/shared/errors/domain-errors.js'
import { applyResourceDelta } from '@/domain/process/ledger.js'
import { stateHash, requestFingerprint } from '@/domain/process/hashing.js'

/**
 * Process Core lifecycle pipeline.
 *
 * docs/system-architecture.md §6 defines the one path every command takes:
 *
 *   normalize units -> validate -> run domain -> project ledger + goal status
 *   -> build the committable event (fingerprint, hashes, deltas) -> return
 *
 * This module is the generic half. It knows nothing about acid chemistry: every
 * scenario-specific behaviour arrives through the `DomainModule`, and every
 * release-specific value through its manifest. That is what lets a second
 * scenario register alongside the first without the core changing (§2.4).
 *
 * Two guarantees are load-bearing here and are the reason this pipeline exists
 * rather than calling `module.run` directly:
 *
 *   1. Nothing commits partially. Validation failure and solver failure both
 *      return a DomainError and leave state untouched (§12).
 *   2. Every accepted command produces a complete event record — fingerprint,
 *      before/after state hashes, resource delta, goal status — so a replay of
 *      the event chain reconstructs the same attempt (data model §11, §12.2).
 */

/**
 * Unit selectors the UI offered for this command, used to convert parameters to
 * canonical units before the engine sees them (§5.1).
 *
 * Maps a parameter name to the unit the user expressed it in. Parameters absent
 * from the map are assumed already canonical, which is how non-numeric and
 * dimensionless parameters are handled.
 */
export type UnitSelections = Record<string, string>

/**
 * A command as the client sends it: an untyped action plus the attempt and
 * revision it was issued against.
 */
export type PendingCommand<State> = {
  attemptId: UUID
  scenario: ScenarioRef
  /** The action to execute, as the client sent it (untyped, pre-normalization). */
  action: SimulationAction
  /**
   * Revision the client claims it read the attempt at. Compared against
   * `currentRevision` to detect a stale command.
   */
  expectedRevision: number
  /**
   * Revision the attempt actually has, read from the store by the caller.
   *
   * This is a separate input on purpose. Deriving it from `sequence` — which
   * the same caller also supplies — makes the comparison vacuous: a stale
   * command cannot be expressed without changing `sequence` too, so the check
   * can never fire. Reading it from storage is a database concern and stays in
   * the application layer (§6.2); comparing the two numbers is generic and
   * belongs here.
   */
  currentRevision: number
  /** Sequence this command would occupy, i.e. lastSequence + 1. */
  sequence: number
  state: State
  /** Ledger accumulated so far; the pipeline advances it on success. */
  ledger: ResourceLedger
}

/** The event record produced for an accepted command (data model §7). */
export type CommittedEvent<State> = {
  attemptId: UUID
  scenarioReleaseId: string
  actionId: UUID
  requestFingerprint: string
  sequence: number
  actionType: string
  inputPayload: SimulationAction
  normalizedInput: Record<string, number | string | boolean>
  stateBefore: State
  stateBeforeHash: string
  stateAfter: State
  stateAfterHash: string
  resourceDelta: ResourceDelta
  ledgerAfter: ResourceLedger
  /**
   * Typed as the contracts declare them, not as `unknown[]`.
   *
   * `SimulationResult` produces `Observation[]`, `CalculationTrace[]` and
   * `DomainWarning[]`, and persistence stores each under its own column, so widening
   * here would force every consumer to re-assert a type the domain already
   * established — and docs/system-architecture.md §5 forbids an implementation that
   * loses information relative to the contract.
   */
  calculationTrace: CalculationTrace[]
  observations: Observation[]
  warnings: DomainWarning[]
  occurredAt: Date
}

export type CommandOutcome<State> =
  | { ok: true; event: CommittedEvent<State> }
  | { ok: false; error: DomainError }

/**
 * Convert numeric parameters to canonical units (§5.1).
 *
 * Only parameters the UI declared a unit for are converted; everything else
 * passes through untouched. A non-finite result is rejected rather than
 * forwarded, because a NaN reaching the engine would propagate into stored
 * state and into every hash computed from it.
 */
export function normalizeParameters(
  parameters: Record<string, number | string | boolean>,
  unitSelections: UnitSelections,
  parameterQuantities: Record<string, CanonicalQuantity>,
):
  | { ok: true; parameters: Record<string, number | string | boolean> }
  | { ok: false; error: DomainError } {
  // A unit selection for a parameter the module never declared a quantity for
  // cannot be validated, so it is refused rather than ignored. Accepting it
  // would mean trusting a number whose unit nobody defined.
  for (const name of Object.keys(unitSelections)) {
    if (parameterQuantities[name] === undefined) {
      return {
        ok: false,
        error: preconditionFailed('UNDECLARED_PARAMETER_UNIT', 'errors.ALIQUOT_NOT_PERMITTED', {
          parameter: name,
          unit: unitSelections[name] as string,
        }),
      }
    }
  }

  const normalized: Record<string, number | string | boolean> = {}

  for (const [name, value] of Object.entries(parameters)) {
    const unit = unitSelections[name]
    if (unit === undefined || typeof value !== 'number') {
      normalized[name] = value
      continue
    }

    const declaredQuantity = parameterQuantities[name]
    if (declaredQuantity === undefined) {
      // Unreachable: the loop above already refused every unit selection whose
      // parameter has no declared quantity. Kept as a loud failure rather than a
      // `continue`, because skipping here would silently DROP the parameter from
      // the normalized payload — the engine would then see no dose at all.
      return {
        ok: false,
        error: preconditionFailed('UNDECLARED_PARAMETER_UNIT', 'errors.ALIQUOT_NOT_PERMITTED', {
          parameter: name,
          unit,
        }),
      }
    }

    // Order matters. `canonicalUnitOf` and `toCanonical` both throw UnitError for
    // an unknown unit, so existence is checked FIRST; only then can the quantity
    // check and the conversion run without throwing. Each failure mode is a
    // distinct DomainError code, which the learner-facing message depends on.
    const definition = lookupUnit(unit)
    if (definition === undefined) {
      return {
        ok: false,
        error: preconditionFailed('UNKNOWN_UNIT', 'errors.ALIQUOT_NOT_PERMITTED', {
          parameter: name,
          unit,
        }),
      }
    }

    // Reject a unit that measures a different quantity BEFORE converting.
    // `toCanonical(5, 'g')` happily returns 5, so without this a volume
    // parameter carrying a mass unit would reach the engine as 5 LITRES instead
    // of 5 millilitres — a 1000x dose error that still converges and still
    // produces a plausible pH, which is what makes it dangerous.
    if (definition.quantity !== declaredQuantity) {
      return {
        ok: false,
        error: preconditionFailed('UNIT_QUANTITY_MISMATCH', 'errors.ALIQUOT_NOT_PERMITTED', {
          parameter: name,
          unit,
          actualQuantity: definition.quantity,
          expectedQuantity: declaredQuantity,
          expectedCanonicalUnit: CANONICAL_UNITS[declaredQuantity],
        }),
      }
    }

    // Existence and quantity are both settled, so this cannot throw UnitError.
    const canonical = toCanonical(value, unit)

    if (!Number.isFinite(canonical)) {
      return {
        ok: false,
        error: modelInvalid('NON_CANONICAL_VALUE', 'errors.EQUILIBRIUM_NO_CONVERGENCE', {
          parameter: name,
          value,
          unit,
        }),
      }
    }

    normalized[name] = canonical
  }

  return { ok: true, parameters: normalized }
}

/**
 * Execute one command through the full pipeline.
 *
 * `occurredAt` is supplied by the caller rather than read from the clock, so a
 * replay can reproduce an event exactly. Reading `new Date()` here would make
 * the event chain non-deterministic and break replay equality (data model §11).
 */
export function runCommand<State>(
  module: DomainModule<State>,
  command: PendingCommand<State>,
  occurredAt: Date,
): CommandOutcome<State> {
  const {
    attemptId,
    scenario,
    action,
    expectedRevision,
    currentRevision,
    sequence,
    state,
    ledger,
  } = command

  // Release lock (§2.4): an attempt never mixes releases. A module built for a
  // different release cannot evaluate this action, and running it would produce
  // numbers the stored snapshots cannot be compared against.
  //
  // `unsupported_release`, not `conflict`: nothing raced here, so a revision
  // conflict would tell the learner to refresh and retry — which can never
  // succeed while the deployment serves a different release.
  if (module.manifest.releaseId !== scenario.releaseId) {
    return {
      ok: false,
      error: unsupportedRelease(scenario.releaseId),
    }
  }

  // Optimistic concurrency (§13). Checked before any work so a stale command
  // cannot produce a side effect or an event.
  if (expectedRevision !== currentRevision) {
    return {
      ok: false,
      error: revisionConflict({
        attemptId,
        expectedRevision,
        currentRevision,
      }),
    }
  }

  if (action.actionId === null || action.actionId === undefined) {
    return {
      ok: false,
      error: preconditionFailed('MISSING_ACTION_ID', 'errors.unsupportedRelease', {
        actionType: action.actionType,
      }),
    }
  }

  // 1. Normalize to canonical units before validation, so validators compare
  //    against canonical thresholds (§5.1).
  const normalization = normalizeParameters(
    action.parameters,
    action.unitSelections,
    module.parameterQuantities,
  )
  if (!normalization.ok) return { ok: false, error: normalization.error }

  const normalizedAction: SimulationAction = {
    ...action,
    parameters: normalization.parameters,
  }

  const context: SimulationContext<State> = { scenario, state, sequence }

  // 2. Validate. The module re-validates inside run(), so a caller cannot skip
  //    this by invoking run() directly; checking here first lets the pipeline
  //    report the failure without entering the domain at all.
  const validationError = module.validateAction(context, normalizedAction)
  if (validationError) return { ok: false, error: validationError }

  // 3. Run the domain model. A returned DomainError means the model could not
  //    evaluate the action (solver failure, non-evaluable state); nothing is
  //    committed and state is unchanged (§12).
  const stateBeforeHash = stateHash(state)
  const outcome = module.run(context, normalizedAction)
  if ('nextState' in outcome === false) {
    return { ok: false, error: outcome as DomainError }
  }
  const result = outcome

  // 4. Project the ledger and goal status from the domain facts (§10).
  const ledgerAfter = applyResourceDelta(ledger, result.resourceDelta, sequence)

  const stateAfterHash = stateHash(result.nextState)

  // 5. Build the fingerprint over the NORMALIZED payload, so a retry that
  //    re-sends the same command with the same units hashes identically and is
  //    recognized as a duplicate instead of double-dosing (§12.1).
  const fingerprint = requestFingerprint({
    attemptId,
    scenarioReleaseId: scenario.releaseId,
    actionType: action.actionType,
    normalizedParameters: normalization.parameters,
    canonicalUnits: action.unitSelections,
  })

  return {
    ok: true,
    event: {
      attemptId,
      scenarioReleaseId: scenario.releaseId,
      actionId: action.actionId,
      requestFingerprint: fingerprint,
      sequence,
      actionType: action.actionType,
      inputPayload: normalizedAction,
      normalizedInput: normalization.parameters,
      stateBefore: state,
      stateBeforeHash,
      stateAfter: result.nextState,
      stateAfterHash,
      resourceDelta: result.resourceDelta,
      ledgerAfter,
      calculationTrace: result.calculationTrace,
      observations: result.observations,
      warnings: result.warnings,
      occurredAt,
    },
  }
}

/**
 * Replay an ordered event chain to rebuild attempt state (§11).
 *
 * Replays from `initialState` by re-applying each stored event's own recorded
 * `stateAfter`, then verifies it against the stored `stateAfterHash`. A
 * mismatch means the chain was corrupted or truncated, which must fail loudly:
 * silently resuming from a tampered snapshot is how a learner resumes into a
 * state their events never produced.
 */
export type ReplayResult<State> =
  | { ok: true; state: State; ledger: ResourceLedger; eventsVerified: number }
  | { ok: false; error: DomainError; failedAtSequence: number | null }

export type StoredEvent<State> = {
  sequence: number
  /**
   * Which action produced this event. Stored so undo can decide reversibility
   * from the chain itself; without it the caller would have to restate the last
   * action type, and a restatement that contradicts the chain would let an
   * irreversible action be undone (§5.1, §14.2).
   */
  actionType: string
  /**
   * Sequence this event reverts, or null for an ordinary action.
   *
   * Required for replay to be correct. An undo is APPENDED, never deleted (§14.2),
   * so rebuilding a chain folds every stored event — and folding a reverted action's
   * delta would count the dose it undid. Carrying the reverted sequence lets replay
   * skip exactly the events a later undo cancelled.
   *
   * The delta cannot be compensated by storing a negative inverse instead:
   * `safetyPenalties` is appended as a list, and `operationCount` as a counter, so no
   * inverse delta expresses "this action never happened".
   */
  undoOfSequence: number | null
  stateAfter: State
  stateAfterHash: string
  resourceDelta: ResourceDelta
}

export function replayEvents<State>(
  initialState: State,
  initialLedger: ResourceLedger,
  events: readonly StoredEvent<State>[],
): ReplayResult<State> {
  // Events must be strictly ordered from 1 with no gaps or repeats. A gap means
  // the client received a partial chain, and replaying that would reconstruct a
  // state that never existed.
  for (let index = 0; index < events.length; index += 1) {
    const event = events[index]
    if (event === undefined || event.sequence !== index + 1) {
      return {
        ok: false,
        error: preconditionFailed('EVENT_SEQUENCE_GAP', 'errors.revisionConflict', {
          expectedSequence: index + 1,
          actualSequence: event?.sequence ?? -1,
        }),
        failedAtSequence: event?.sequence ?? null,
      }
    }
  }

  // Sequences a later undo reverted. Collected up front so the fold below can skip
  // them in one pass; an undo of an undo is impossible (§14.2 forbids undoing a
  // non-reversible action, and `undo_last` is not one), so no chain can cancel a
  // cancellation.
  const reverted = new Set<number>()
  for (const event of events) {
    if (event.undoOfSequence !== null) reverted.add(event.undoOfSequence)
  }

  let state = initialState
  let ledger = initialLedger

  for (const event of events) {
    const computedHash = stateHash(event.stateAfter)
    if (computedHash !== event.stateAfterHash) {
      return {
        ok: false,
        error: modelInvalid('STATE_HASH_MISMATCH', 'errors.revisionConflict', {
          sequence: event.sequence,
          storedHash: event.stateAfterHash,
          computedHash,
        }),
        failedAtSequence: event.sequence,
      }
    }

    // A reverted event contributes nothing: neither its state nor its delta. The undo
    // event that cancelled it carries the authoritative post-reversion state, and its
    // delta is neutral by construction.
    //
    // Its hash is still verified above — integrity of the stored chain is checked for
    // every event, including ones replay then skips.
    if (reverted.has(event.sequence)) continue

    state = event.stateAfter
    ledger = applyResourceDelta(ledger, event.resourceDelta, event.sequence)
  }

  return { ok: true, state, ledger, eventsVerified: events.length }
}

/** Result of an undo request: the state to return to, or a typed refusal. */
export type UndoOutcome<State> =
  | { ok: true; state: State; ledger: ResourceLedger; undoOfSequence: number }
  | { ok: false; error: DomainError }

/**
 * Undo the last accepted action (§14.2).
 *
 * Everything this needs is derived from the event chain: the last event names
 * its own action type and sequence. That is deliberate. Accepting those as
 * separate arguments would let a caller claim the last action was `select_route`
 * when the chain says `add_base`, and undoing an irreversible chemical addition
 * is exactly the mistake §5.1 exists to prevent.
 *
 * Undo is expressed as a NEW event carrying `undoOfSequence` rather than by
 * deleting the undone event, so the timeline stays append-only and auditable.
 * The caller records that event; this function returns the state to return to.
 */
export function undoLastAction<State>(
  events: readonly StoredEvent<State>[],
  initialState: State,
  initialLedger: ResourceLedger,
  undoableActionTypes: readonly string[],
): UndoOutcome<State> {
  if (events.length === 0) {
    return {
      ok: false,
      error: preconditionFailed('NOTHING_TO_UNDO', 'errors.revisionConflict', {
        eventCount: 0,
      }),
    }
  }

  const lastEvent = events[events.length - 1]
  if (lastEvent === undefined) {
    return {
      ok: false,
      error: preconditionFailed('NOTHING_TO_UNDO', 'errors.revisionConflict', {
        eventCount: events.length,
      }),
    }
  }
  // Verify the event being undone BEFORE replaying the ones kept. `replayEvents`
  // only checks the events it walks, and undo drops the last one, so without
  // this a corrupted chain whose only event is tampered with would undo
  // successfully: the caller would append an undo event onto a log whose
  // integrity was never established.
  const lastEventHash = stateHash(lastEvent.stateAfter)
  if (lastEventHash !== lastEvent.stateAfterHash) {
    return {
      ok: false,
      error: modelInvalid('STATE_HASH_MISMATCH', 'errors.revisionConflict', {
        sequence: lastEvent.sequence,
        storedHash: lastEvent.stateAfterHash,
        computedHash: lastEventHash,
      }),
    }
  }

  if (!undoableActionTypes.includes(lastEvent.actionType)) {
    return {
      ok: false,
      error: preconditionFailed('ACTION_NOT_UNDOABLE', 'errors.revisionConflict', {
        actionType: lastEvent.actionType,
        sequence: lastEvent.sequence,
        undoableActionTypes: undoableActionTypes.join(','),
      }),
    }
  }

  // Replay everything except the last event: that is the state the undo returns
  // to. Hash verification still applies, so a corrupted chain cannot be undone
  // into a state nobody recorded.
  const prior = events.slice(0, -1)
  const replay = replayEvents(initialState, initialLedger, prior)
  if (!replay.ok) return { ok: false, error: replay.error }

  return {
    ok: true,
    state: replay.state,
    ledger: replay.ledger,
    undoOfSequence: lastEvent.sequence,
  }
}
