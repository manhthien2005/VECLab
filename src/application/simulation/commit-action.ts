import type {
  CalculationTrace,
  DomainError,
  DomainModule,
  DomainWarning,
  Observation,
  ResourceDelta,
  ResourceLedger,
  SimulationAction,
  UUID,
} from '@/domain/process/contracts.js'
import { SCENARIO_KEYS, type ScenarioKey } from '@/domain/process/contracts.js'
import { runCommand } from '@/domain/process/lifecycle.js'

/**
 * Commit an action: run it through the domain and produce the event payload a
 * route handler persists.
 *
 * This is the application layer's half of the boundary. It owns sequencing —
 * which module handles this release, what the current state is, what sequence
 * the command occupies — and it owns NOTHING about HTTP, cookies, SQL or
 * identity (docs/system-architecture.md §6.2). The caller persists the result;
 * the domain supplies the numbers.
 *
 * No actor id is threaded through here. Guest mode has no authenticated
 * principal (§10), and requiring one would force it to invent a fake id to reach
 * the same code path cloud mode uses — defeating the point of sharing it. The
 * cloud path gets its actor from the VERIFIED session when it builds the RPC
 * payload, which is where identity is actually established; echoing it back out
 * of this function would only add a second, less trustworthy copy for a caller to
 * mistake for the authoritative one.
 *
 * Splitting it this way is what keeps the engine testable without a database and
 * the route handler free of chemistry.
 */

/** An attempt as read back from storage, reduced to what committing needs. */
export type StoredAttemptSnapshot<State> = {
  attemptId: UUID
  releaseId: string
  revision: number
  lastSequence: number
  state: State
  ledger: ResourceLedger
}


export type CommitRequest<State> = {
  attempt: StoredAttemptSnapshot<State>
  action: SimulationAction
  occurredAt: Date
}

export type CommitSuccess<State> = {
  ok: true
  /** Attempt the event belongs to, echoed for the caller's RPC payload. */
  attemptId: UUID
  releaseId: string
  expectedRevision: number
  actionId: UUID
  requestFingerprint: string
  sequence: number
  actionType: string
  inputPayload: SimulationAction
  normalizedInput: Record<string, number | string | boolean>
  stateBeforeHash: string
  stateAfter: State
  stateAfterHash: string
  resourceDelta: ResourceDelta
  ledgerAfter: ResourceLedger
  calculationTrace: CalculationTrace[]
  observations: Observation[]
  warnings: DomainWarning[]
  occurredAt: Date
}

export type CommitResult<State> =
  | CommitSuccess<State>
  | { ok: false; error: DomainError }

/**
 * Run one command against a stored attempt.
 *
 * `expectedRevision` and `currentRevision` are both taken from the stored
 * snapshot, so they always agree here: the real optimistic-concurrency race is
 * detected by the database, which re-reads the row under `SELECT ... FOR UPDATE`
 * and refuses a stale revision. Passing the same number twice is not a bug — it
 * is the client stating "I read revision N", and the RPC is what decides whether
 * N is still current.
 */
export function commitAction<State>(
  module: DomainModule<State>,
  request: CommitRequest<State>,
): CommitResult<State> {
  const { attempt, action, occurredAt } = request

  const outcome = runCommand(module, {
    attemptId: attempt.attemptId,
    scenario: {
      // The scenario key comes from the release id, which the attempt already
      // locked; re-deriving it from the request body would let a caller claim a
      // different scenario than the one the attempt was created for.
      key: releaseScenarioKey(attempt.releaseId),
      releaseId: attempt.releaseId,
    },
    action,
    expectedRevision: attempt.revision,
    currentRevision: attempt.revision,
    sequence: attempt.lastSequence + 1,
    state: attempt.state,
    ledger: attempt.ledger,
  }, occurredAt)

  if (!outcome.ok) return { ok: false, error: outcome.error }

  const event = outcome.event
  return {
    ok: true,
    attemptId: attempt.attemptId,
    releaseId: attempt.releaseId,
    expectedRevision: attempt.revision,
    actionId: event.actionId,
    requestFingerprint: event.requestFingerprint,
    sequence: event.sequence,
    actionType: event.actionType,
    inputPayload: event.inputPayload,
    normalizedInput: event.normalizedInput,
    stateBeforeHash: event.stateBeforeHash,
    stateAfter: event.stateAfter,
    stateAfterHash: event.stateAfterHash,
    resourceDelta: event.resourceDelta,
    ledgerAfter: event.ledgerAfter,
    calculationTrace: event.calculationTrace,
    observations: event.observations,
    warnings: event.warnings,
    occurredAt: event.occurredAt,
  }
}

/**
 * Scenario key from a release id of the form `<scenarioKey>@<version>`.
 *
 * Parsed rather than looked up so an unknown release fails loudly here instead of
 * reaching the domain as a key that matches no module.
 */
export function releaseScenarioKey(releaseId: string): ScenarioKey {
  const separator = releaseId.indexOf('@')
  const key = separator === -1 ? releaseId : releaseId.slice(0, separator)

  // Validated against the domain's own list rather than a local switch: hardcoding
  // the three keys here would make this the SECOND place that decides what a scenario
  // is, so adding a fourth would parse as unknown until someone remembered to edit
  // both. `(SCENARIO_KEYS as readonly string[])` widens only for the includes check;
  // the returned value is still narrowed by the guard.
  if ((SCENARIO_KEYS as readonly string[]).includes(key)) {
    return key as ScenarioKey
  }

  throw new RangeError(`Cannot derive a scenario key from release id "${releaseId}"`)
}
