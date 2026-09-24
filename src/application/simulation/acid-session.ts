import type {
  CalculationTrace,
  DomainError,
  DomainWarning,
  GoalStatus,
  Observation,
  ResourceLedger,
  SimulationAction,
  UUID,
} from '@/domain/process/contracts.js'
import type {
  AcidNeutralizationState,
  AcidRoute,
  AcidScenarioConfig,
} from '@/domain/experiments/acid-neutralization/state.js'
import {
  ACID_RELEASE_ID,
  ACID_ACTION_TYPES,
  PERMITTED_ALIQUOTS_L,
  benchmarkScenarioConfig,
  buildFinalResourceLedger,
  createAcidNeutralizationModule,
  createInitialResourceLedger,
  initialHclMmolFor,
  resolveTargetEquivalentsMmolEq,
} from '@/domain/experiments/acid-neutralization/index.js'
import { replayEvents, undoLastAction } from '@/domain/process/lifecycle.js'
import { stateHash } from '@/domain/process/hashing.js'
import { ACID_ACTIONS } from '@/content/scenarios/acid-neutralization.js'
import { newUUID } from '@/shared/ids.js'
import { commitAction } from './commit-action.js'
import type {
  Attempt,
  AttemptRepository,
  AttemptSummary,
  StoredAttemptEventRecord,
  WriteResult,
} from '@/application/attempts/repository.js'
import {
  createAcidProjector,
  isAcidProjection,
  type AcidProjection,
} from '@/application/scenarios/acid-projection.js'

/**
 * Acid neutralization session: the orchestrator the workbench drives.
 *
 * One code path for both storage modes. Guest and cloud differ ONLY in which
 * `AttemptRepository` is injected (docs/system-architecture.md §10.1); the order of
 * compute-project-persist is identical, which is what makes a guest run and an
 * imported cloud run produce the same events and the same scores.
 *
 * Contains no React and no HTTP, so the workbench component only renders and
 * dispatches while this module owns the ordering rules: an action cannot be persisted
 * before its projection is built, and completion cannot be recorded without a report
 * snapshot.
 *
 * THE LEDGER IS NOT STORED, SO IT IS REPLAYED. `attempts` has no ledger column and
 * `current_state` is the bare domain state; the ledger is rebuilt by folding each
 * event's `resourceDelta` over the chain (§18 accepts loading the full chain when an
 * attempt is opened). A session therefore re-derives the ledger on load rather than
 * trusting a snapshot no store actually holds.
 */

const engine = createAcidNeutralizationModule()
const projector = createAcidProjector()
const config: AcidScenarioConfig = benchmarkScenarioConfig()

/**
 * Action types undo may revert, derived from the content definition.
 *
 * Undoability is part of the scenario release, declared once in content; reading it
 * from there means making an action reversible is a content change, not a change to
 * this orchestrator and the engine together.
 */
const UNDOABLE_ACTION_TYPES: readonly string[] = Object.values(ACID_ACTIONS)
  .filter((spec) => spec.undoable)
  .map((spec) => spec.actionType)

/** Attempt state as the session holds it between actions. */
export type AcidSessionState = {
  attemptId: UUID
  releaseId: string
  revision: number
  lastSequence: number
  status: 'in_progress' | 'completed' | 'stopped'
  domain: AcidNeutralizationState
  /** Rebuilt by replay; not stored in any attempt row. */
  ledger: ResourceLedger
  projection: AcidProjection
  finalReportSnapshot: FinalReportSnapshot | null
  /**
   * When the attempt started and, once finished, when it completed.
   *
   * §4.7 requires both on the report. They are carried here rather than re-read by the
   * report shell because the shell holds a session, not an attempt: `Attempt` already has
   * them, and dropping them on the way into session state would force the shell to reach
   * past this layer into persistence to recover two fields it is entitled to.
   */
  createdAt: Date
  completedAt: Date | null
  storageMode: 'local' | 'cloud'
}

/**
 * What the workbench shows right after an accepted action (web scope §4.6 item 8).
 *
 * Not the domain's `CommittedEvent`: that carries hashes and the full ledger, which
 * the UI never renders. Narrowing to feedback means the workbench cannot reach past
 * this layer into persistence internals, and an undo — which produces no chemistry of
 * its own — can still satisfy the same shape with empty lists rather than having to
 * fabricate a commit record.
 */
export type ActionFeedback = {
  actionType: string
  sequence: number
  observations: Observation[]
  warnings: DomainWarning[]
  calculationTrace: CalculationTrace[]
  /** True when the store replayed an identical earlier action instead of writing. */
  idempotentReplay: boolean
}

/** A store refusal, passed through so the workbench branches once per outcome. */
export type WriteRefusal = Extract<WriteResult<AcidNeutralizationState>, { ok: false }>

/**
 * What the CALLER supplies about one commit, as distinct from what the server derives.
 *
 * Both fields exist because of §9: for an account, the browser sends the intent and the
 * server computes the chemistry. The browser is therefore the only party that knows two
 * facts the server cannot recover, and losing either one silently breaks a guarantee.
 *
 *   * `actionId` — the learner's action, named once. §12.1 keys idempotency on it, so a
 *     request that times out and is retried MUST carry the same id or the retry stores a
 *     second event for one click. Generated server-side per call, it would be new every
 *     retry and idempotency would never fire.
 *   * `expectedRevision` — the revision the learner was LOOKING AT when they confirmed
 *     the prediction (§7.1). If the server instead used its own fresh read, a stale tab
 *     would apply its action to a newer state it never saw, and §6.5's conflict detection
 *     would be vacuous: the value compared would always equal the value stored.
 *
 * A guest session omits both and gets the local behaviour it always had: a fresh id, and
 * the revision just read, which is correct because a single browser tab is the only
 * writer to its own IndexedDB rows.
 */
export type CommitIdentity = {
  /** Caller-generated action id. Omitted in guest mode. */
  actionId?: UUID
  /** Revision the caller last saw. Omitted in guest mode. */
  expectedRevision?: number
}

/** Result of an action: the new session state, a domain refusal, or a store refusal. */
export type SessionActionResult =
  | { ok: true; state: AcidSessionState; feedback: ActionFeedback }
  | { ok: false; error: DomainError }
  | WriteRefusal

/**
 * Immutable report snapshot, required before an attempt can complete
 * (docs/data-and-state-model.md §4.2; enforced by the `complete_attempt` RPC).
 *
 * Built from the final projection and goal status plus the resolved release metadata,
 * so a report renders from one frozen object and cannot drift if the scenario is later
 * re-released (§22 invariant 10).
 */
export type FinalReportSnapshot = {
  schemaVersion: number
  scenarioKey: 'acid-neutralization'
  releaseId: string
  generatedAt: Date
  projection: AcidProjection
  goalStatus: GoalStatus
}

const REPORT_SCHEMA_VERSION = 1

/**
 * The snapshot a session holds, narrowed from the store's untyped `unknown`.
 *
 * Returns null rather than throwing when the stored value is from another schema
 * version: an old report is still an attempt worth opening, and the workbench can
 * offer to re-run completion, but it must not render fields that are no longer there.
 */
function narrowReport(value: unknown): FinalReportSnapshot | null {
  if (typeof value !== 'object' || value === null) return null

  const candidate = value as Record<string, unknown>
  const shapeMatches =
    candidate.schemaVersion === REPORT_SCHEMA_VERSION &&
    candidate.scenarioKey === 'acid-neutralization' &&
    typeof candidate.releaseId === 'string' &&
    candidate.generatedAt instanceof Date &&
    isAcidProjection(candidate.projection)

  return shapeMatches ? (value as FinalReportSnapshot) : null
}

/**
 * Rebuild the ledger for a loaded attempt by replaying its event chain.
 *
 * `replayEvents` verifies each stored hash as it folds, so a truncated or tampered
 * chain is refused here rather than yielding a ledger that quietly disagrees with the
 * states it was derived from.
 */
async function rebuildLedger(
  repository: AttemptRepository<AcidNeutralizationState>,
  attempt: Attempt<AcidNeutralizationState>,
): Promise<{ ok: true; ledger: ResourceLedger } | { ok: false; error: DomainError }> {
  const events = await repository.getAttemptEvents(attempt.attemptId)

  const replay = replayEvents(
    attempt.initialState,
    createInitialResourceLedger(),
    events,
  )

  if (!replay.ok) return { ok: false, error: replay.error }

  // A ledger rebuilt from a chain that no longer ends at `current_state` describes a
  // DIFFERENT state than the one being rendered. The RPC keeps the two in step inside
  // one transaction (§22 invariant 2), so a mismatch here means the local store is
  // corrupt and must not be trusted.
  if (events.length > 0) {
    const lastEvent = events[events.length - 1]!
    if (lastEvent.sequence !== attempt.lastSequence) {
      return {
        ok: false,
        error: {
          category: 'model_invalid',
          code: 'STATE_HASH_MISMATCH',
          messageKey: 'errors.revisionConflict',
          data: { sequence: lastEvent.sequence, lastSequence: attempt.lastSequence },
        },
      }
    }
  }

  return { ok: true, ledger: replay.ledger }
}

export type AcidSession = {
  readonly storageMode: 'local' | 'cloud'
  /**
   * Stored event records, for the timeline and the report.
   *
   * READ-ONLY on purpose. This used to expose the whole `AttemptRepository`, which hands
   * out `appendAction`/`completeAttempt`. For a cloud session that write surface must not
   * exist in the browser: §9 runs the engine server-side, and `result_payload`,
   * `state_after` and the hashes are trusted columns a browser role cannot write
   * (20260909000400_grants.sql). Handing a remote session those methods would mean
   * posting invented chemistry as trusted output, defeating the hash chain, the golden
   * fixtures and report immutability.
   */
  listEvents(
    attemptId: UUID,
  ): Promise<readonly StoredAttemptEventRecord<AcidNeutralizationState>[]>
  /** Start a fresh attempt for the benchmark scenario. */
  start(): Promise<AcidSessionState>
  /**
   * Resume an attempt, or null when it is not in this store.
   *
   * Rebuilds the ledger by replay, which is what makes resuming on another device show
   * the same scores as the device that ran it (§11).
   */
  load(attemptId: UUID): Promise<
    | { ok: true; state: AcidSessionState }
    | { ok: false; error: DomainError }
    | null
  >
  /** Apply one action and persist it. */
  apply(
    attemptId: UUID,
    actionType: string,
    parameters?: Record<string, number | string | boolean>,
    unitSelections?: Record<string, string>,
    commit?: CommitIdentity,
  ): Promise<SessionActionResult>
  /** Revert the last action, if the scenario allows it (§5.1). */
  undo(attemptId: UUID, commit?: CommitIdentity): Promise<SessionActionResult>
  /** Finish the attempt: build the report snapshot and complete in one write. */
  complete(attemptId: UUID, commit?: CommitIdentity): Promise<
    | { ok: true; state: AcidSessionState; report: FinalReportSnapshot }
    | { ok: false; error: DomainError }
    | WriteRefusal
  >
  /** Summaries for the lab list. */
  list(limit?: number): Promise<AttemptSummary[]>
  /**
   * Delete one attempt and its event chain (§4.5).
   *
   * On the session rather than reached for through a repository handle, because the
   * writable half of the repository is deliberately NOT exposed: a learner-facing surface
   * that needed it would have to hold a store and could then write chemistry. Both
   * adapters cascade to the events, and both treat an already-absent attempt as success,
   * so a double-clicked delete cannot surface an error.
   */
  remove(attemptId: UUID): Promise<void>
}

/**
 * Build a session over a repository.
 *
 * The repository decides where data lives; everything else is shared. A caller in the
 * browser passes the IndexedDB adapter, a route handler passes the Postgres adapter,
 * and the workbench cannot tell the difference.
 */
export function createAcidSession(
  repository: AttemptRepository<AcidNeutralizationState>,
): AcidSession {
  function project(
    sequence: number,
    domain: AcidNeutralizationState,
    ledger: ResourceLedger,
  ): AcidProjection {
    return projector.project(ACID_RELEASE_ID, sequence, domain, ledger)
  }

  async function requireAttempt(
    attemptId: UUID,
  ): Promise<
    | { ok: true; attempt: Attempt<AcidNeutralizationState>; ledger: ResourceLedger }
    | { ok: false; error: DomainError }
    | null
  > {
    const attempt = await repository.getAttempt(attemptId)
    if (attempt === null) return null

    const rebuilt = await rebuildLedger(repository, attempt)
    if (!rebuilt.ok) return { ok: false, error: rebuilt.error }

    return { ok: true, attempt, ledger: rebuilt.ledger }
  }

  function sessionState(
    attempt: Attempt<AcidNeutralizationState>,
    ledger: ResourceLedger,
  ): AcidSessionState {
    return {
      attemptId: attempt.attemptId,
      releaseId: attempt.scenarioReleaseId,
      revision: attempt.revision,
      lastSequence: attempt.lastSequence,
      status: attempt.status,
      domain: attempt.currentState,
      ledger,
      projection: narrowProjection(attempt, ledger),
      finalReportSnapshot: narrowReport(attempt.finalReportSnapshot),
      createdAt: attempt.createdAt,
      completedAt: attempt.completedAt,
      storageMode: repository.storageMode,
    }
  }

  /**
   * The stored projection, or a freshly computed one.
   *
   * Narrowed with the projector's own guard rather than a local duck check, so one
   * definition decides whether a stored projection is trustworthy. A projection written
   * by an older projector version is discarded and recomputed instead of being rendered
   * with fields missing.
   */
  function narrowProjection(
    attempt: Attempt<AcidNeutralizationState>,
    ledger: ResourceLedger,
  ): AcidProjection {
    return isAcidProjection(attempt.currentProjection)
      ? attempt.currentProjection
      : project(attempt.lastSequence, attempt.currentState, ledger)
  }

  /**
   * Turn a store result into a session result.
   *
   * Lives inside the factory because building `AcidSessionState` needs `sessionState`,
   * which closes over the repository. Refusals pass through unchanged so the workbench
   * renders one message per outcome regardless of storage mode.
   *
   * Takes BOTH the pre-write and post-write ledger, because the two outcomes need
   * different ones and picking wrongly is a silent accounting bug:
   *
   *   * `committed` — the store advanced one event, so the post-write ledger matches it.
   *   * `idempotent_replay` — the store wrote NOTHING and still sits at the sequence the
   *     caller read, while the domain ran the action a second time. Pairing that
   *     re-computed ledger with the unchanged attempt would count the dose twice and
   *     show a reagent total the attempt never reached, so the pre-write ledger is
   *     correct.
   */
  function buildResult(
    written: WriteResult<AcidNeutralizationState>,
    feedback: Omit<ActionFeedback, 'idempotentReplay'>,
    ledgerBefore: ResourceLedger,
    ledgerAfter: ResourceLedger,
  ): SessionActionResult {
    if (!written.ok) return written

    const idempotentReplay = written.outcome === 'idempotent_replay'

    return {
      ok: true,
      feedback: { ...feedback, idempotentReplay },
      // State and ledger are read from what the STORE holds, not from what this module
      // computed: the store is authoritative for revision, status and sequence.
      state: sessionState(
        written.attempt,
        idempotentReplay ? ledgerBefore : ledgerAfter,
      ),
    }
  }

  return {
    storageMode: repository.storageMode,
    listEvents: (attemptId: UUID) => repository.getAttemptEventRecords(attemptId),

    async start(): Promise<AcidSessionState> {
      const attemptId = newUUID()
      const domain = engine.createInitialState()
      const ledger = createInitialResourceLedger()

      const attempt = await repository.createAttempt({
        attemptId,
        scenarioKey: 'acid-neutralization',
        scenarioReleaseId: ACID_RELEASE_ID,
        contentLocale: 'vi',
        initialState: domain,
        initialProjection: project(0, domain, ledger),
        projectionVersion: projector.version,
      })

      return sessionState(attempt, ledger)
    },

    async load(attemptId: UUID) {
      const found = await requireAttempt(attemptId)
      if (found === null) return null
      if (!found.ok) return { ok: false, error: found.error }

      return { ok: true, state: sessionState(found.attempt, found.ledger) }
    },

    async apply(
      attemptId: UUID,
      actionType: string,
      parameters: Record<string, number | string | boolean> = {},
      unitSelections: Record<string, string> = {},
      commit: CommitIdentity = {},
    ): Promise<SessionActionResult> {
      const found = await requireAttempt(attemptId)
      if (found === null) return { ok: false, outcome: 'not_found' }
      if (!found.ok) return { ok: false, error: found.error }

      const { attempt, ledger } = found

      const result = commitAction(engine, {
        attempt: {
          attemptId: attempt.attemptId,
          releaseId: attempt.scenarioReleaseId,
          revision: attempt.revision,
          lastSequence: attempt.lastSequence,
          state: attempt.currentState,
          ledger,
        },
        action: {
          actionId: commit.actionId ?? newUUID(),
          actionType,
          parameters,
          unitSelections,
        },
        occurredAt: new Date(),
      })

      if (!result.ok) return { ok: false, error: result.error }

      const nextProjection = project(
        result.sequence,
        result.stateAfter,
        result.ledgerAfter,
      )

      const written = await repository.appendAction({
        attemptId: attempt.attemptId,
        // The release THIS engine came from, not the stored row's. Asserting the
        // attempt's own value would make the store's release re-check vacuous; asserting
        // the module's catches an attempt created under a different release being driven
        // by the wrong engine (§21.2).
        scenarioReleaseId: ACID_RELEASE_ID,
        expectedRevision: commit.expectedRevision ?? attempt.revision,
        actionId: result.actionId,
        requestFingerprint: result.requestFingerprint,
        eventKind: 'domain_action',
        actionType: result.actionType,
        inputPayload: result.inputPayload,
        normalizedInput: result.normalizedInput,
        resultPayload: {
          observations: result.observations,
          warnings: result.warnings,
          calculationTrace: result.calculationTrace,
        },
        calculationTrace: result.calculationTrace,
        observations: result.observations,
        warnings: result.warnings,
        resourceDelta: result.resourceDelta,
        stateBeforeHash: result.stateBeforeHash,
        stateAfter: result.stateAfter,
        stateAfterHash: result.stateAfterHash,
        undoOfSequence: null,
        occurredAt: result.occurredAt,
        nextProjection,
      })

      return buildResult(
        written,
        {
          actionType: result.actionType,
          sequence: result.sequence,
          observations: result.observations,
          warnings: result.warnings,
          calculationTrace: result.calculationTrace,
        },
        ledger,
        result.ledgerAfter,
      )
    },

    async undo(attemptId: UUID, commit: CommitIdentity = {}): Promise<SessionActionResult> {
      const found = await requireAttempt(attemptId)
      if (found === null) return { ok: false, outcome: 'not_found' }
      if (!found.ok) return { ok: false, error: found.error }

      const { attempt, ledger } = found
      const events = await repository.getAttemptEvents(attemptId)

      // Replay starts from a FRESH initial ledger, not the current one: `undoLastAction`
      // rebuilds the prefix from the beginning, so passing the already-accumulated
      // ledger would double every dose made before the undone action.
      const outcome = undoLastAction(
        events,
        attempt.initialState,
        createInitialResourceLedger(),
        UNDOABLE_ACTION_TYPES,
      )

      if (!outcome.ok) return { ok: false, error: outcome.error }

      // Undo is recorded as a NEW event naming what it reverted, so the chain stays
      // append-only and auditable (§14.2). Its action id and fingerprint are fresh; the
      // reverted sequence travels in `undoOfSequence`.
      //
      // The delta is NEUTRAL, not an inverse. Replaying `prior + undo` must reproduce
      // the reverted ledger, and it does: `replayEvents` SETS state from each event's
      // `stateAfter` and FOLDS each delta, so dropping the undone event from the
      // replayed prefix already removes its contribution. Emitting an inverse delta
      // would subtract twice.
      const undoActionId = commit.actionId ?? newUUID()
      const sequence = attempt.lastSequence + 1
      const nextProjection = project(sequence, outcome.state, outcome.ledger)

      const written = await repository.appendAction({
        attemptId: attempt.attemptId,
        scenarioReleaseId: ACID_RELEASE_ID,
        expectedRevision: commit.expectedRevision ?? attempt.revision,
        actionId: undoActionId,
        requestFingerprint: `undo:${attempt.attemptId}:${outcome.undoOfSequence}:${undoActionId}`,
        eventKind: 'undo_last',
        actionType: 'undo_last',
        inputPayload: {
          actionId: undoActionId,
          actionType: 'undo_last',
          parameters: { undoOfSequence: outcome.undoOfSequence },
          unitSelections: {},
        },
        normalizedInput: { undoOfSequence: outcome.undoOfSequence },
        resultPayload: { undoOfSequence: outcome.undoOfSequence },
        calculationTrace: [],
        observations: [],
        warnings: [],
        resourceDelta: {
          reagents: {},
          waterLiters: 0,
          operationCount: 0,
          relativeCostIndexDelta: null,
          safetyPenalties: [],
          secondaryWaste: {},
        },
        stateBeforeHash: stateHash(attempt.currentState),
        stateAfter: outcome.state,
        stateAfterHash: stateHash(outcome.state),
        undoOfSequence: outcome.undoOfSequence,
        occurredAt: new Date(),
        nextProjection,
      })

      // Undo produces no chemistry of its own, so its feedback lists are empty. The
      // workbench renders "reverted action N" from `actionType` and `sequence`.
      return buildResult(
        written,
        {
          actionType: 'undo_last',
          sequence,
          observations: [],
          warnings: [],
          calculationTrace: [],
        },
        ledger,
        outcome.ledger,
      )
    },

    async complete(attemptId: UUID, commit: CommitIdentity = {}) {
      const found = await requireAttempt(attemptId)
      if (found === null) return { ok: false, outcome: 'not_found' as const }
      if (!found.ok) return { ok: false, error: found.error }

      const { attempt, ledger } = found

      // The engine decides whether the run MAY finish (valid model, current
      // measurement). That decision is a normal domain action; only after it is
      // accepted does the attempt row complete.
      const result = commitAction(engine, {
        attempt: {
          attemptId: attempt.attemptId,
          releaseId: attempt.scenarioReleaseId,
          revision: attempt.revision,
          lastSequence: attempt.lastSequence,
          state: attempt.currentState,
          ledger,
        },
        action: {
          actionId: commit.actionId ?? newUUID(),
          actionType: 'complete',
          parameters: {},
          unitSelections: {},
        },
        occurredAt: new Date(),
      })

      if (!result.ok) return { ok: false, error: result.error }

      const finalDomain = result.stateAfter
      // `ledgerAfter` already carries the penalties the engine committed in the
      // `complete` action's delta. buildFinalResourceLedger derives the INDICES from
      // that committed list and must not recompute it, or every penalty is counted
      // twice and the safety index is halved.
      const targetEquivalentsMmolEq =
        finalDomain.route === null
          ? null
          : resolveTargetEquivalentsMmolEq(config, finalDomain.route)

      const finalLedger = buildFinalResourceLedger(result.ledgerAfter, finalDomain, {
        initialHclMmol: initialHclMmolFor(config),
        // A null E* means the target was unreachable, so the safety rubric has nothing
        // to score against and both indices read N/A rather than inventing a number.
        modelEvaluable: finalDomain.modelValid && targetEquivalentsMmolEq !== null,
      })

      const report: FinalReportSnapshot = {
        schemaVersion: REPORT_SCHEMA_VERSION,
        scenarioKey: 'acid-neutralization',
        releaseId: ACID_RELEASE_ID,
        generatedAt: new Date(),
        projection: projector.project(
          ACID_RELEASE_ID,
          result.sequence,
          finalDomain,
          finalLedger,
        ),
        goalStatus: engine.evaluateGoalStatus(finalDomain, finalLedger),
      }

      // One write: event, status flip and the immutable snapshot together, matching the
      // `complete_attempt` RPC. A completion persisted without its snapshot is the
      // half-completed state §4.2 forbids. Event kind and action type are the store's
      // to fix, so they are not passed here.
      const written = await repository.completeAttempt({
        attemptId: attempt.attemptId,
        scenarioReleaseId: ACID_RELEASE_ID,
        expectedRevision: commit.expectedRevision ?? attempt.revision,
        actionId: result.actionId,
        requestFingerprint: result.requestFingerprint,
        inputPayload: result.inputPayload,
        normalizedInput: result.normalizedInput,
        resultPayload: report,
        calculationTrace: result.calculationTrace,
        observations: result.observations,
        warnings: result.warnings,
        resourceDelta: result.resourceDelta,
        stateBeforeHash: result.stateBeforeHash,
        stateAfter: result.stateAfter,
        stateAfterHash: result.stateAfterHash,
        occurredAt: result.occurredAt,
        nextProjection: report.projection,
        finalReportSnapshot: report,
      })

      if (!written.ok) return written

      return {
        ok: true,
        state: sessionState(written.attempt, finalLedger),
        report,
      }
    },

    list(limit?: number) {
      return repository.listAttempts(limit === undefined ? {} : { limit })
    },

    remove(attemptId: UUID) {
      return repository.deleteAttempt(attemptId)
    },
  }
}

/**
 * One action's availability at the current state.
 *
 * `available` is the engine's verdict, not the workbench's: it is whatever
 * `validateAction` returns for the action's representative parameters. `reasonKey`
 * is the messageKey the UI renders as the disabled-state reason (§5 "Điều kiện
 * trước"), so a greyed-out control always explains itself.
 */
export type ActionAvailability = {
  actionType: string
  available: boolean
  /** The engine's reason when unavailable; null when available. */
  reasonKey: string | null
  reasonData: Record<string, number | string | boolean | null>
}

/**
 * Probe which actions the learner may take now.
 *
 * Asks the DOMAIN via `validateAction` for every action type in the release, rather
 * than reimplementing the phase ladder or the volume caps in the UI. A second copy of
 * those rules in a component is exactly the drift the scenario-definition gate guards
 * against — and here it would not merely desync wording, it would offer a button the
 * engine then refuses, or grey out one the engine would accept.
 *
 * For a parameterized action the probe uses the SMALLEST permitted aliquot, which is
 * the candidate most likely to still be within the per-route cap. So `available`
 * answers "is there any dose the learner could add right now", which is the honest
 * question for enabling the control; the specific volume is validated again when the
 * action is actually applied.
 *
 * Pure and synchronous: it runs the engine's validation but never writes, so the
 * workbench can call it on every render without touching storage.
 */
export function probeAvailableActions(
  state: AcidNeutralizationState,
  sequence: number,
): readonly ActionAvailability[] {
  const context = {
    scenario: {
      key: 'acid-neutralization' as const,
      releaseId: ACID_RELEASE_ID,
    },
    state,
    sequence,
  }

  return ACID_ACTION_TYPES.map((actionType) => {
    const probeAction: SimulationAction = {
      actionId: PROBE_ACTION_ID,
      actionType,
      parameters: probeParametersFor(actionType),
      unitSelections: {},
    }

    const error = engine.validateAction(context, probeAction)

    return {
      actionType,
      available: error === null,
      reasonKey: error?.messageKey ?? null,
      reasonData: error?.data ?? {},
    }
  })
}

/**
 * A stable, obviously-invalid action id for probing.
 *
 * Validation never persists, so the id is never stored; a fixed value keeps the probe
 * deterministic and makes it obvious in a trace that no real action was created.
 */
const PROBE_ACTION_ID = '00000000-0000-4000-8000-000000000000' as UUID

/**
 * Representative parameters for probing an action's availability.
 *
 * `add_base` and `add_correction_acid` need a volume; the smallest permitted aliquot
 * is used so the probe reflects "any dose still possible" rather than accidentally
 * tripping the per-route cap with a large one. Every other action takes none.
 */
function probeParametersFor(
  actionType: string,
): Record<string, number | string | boolean> {
  if (actionType === 'add_base' || actionType === 'add_correction_acid') {
    return { volumeL: SMALLEST_PERMITTED_ALIQUOT_L }
  }
  if (actionType === 'select_route') {
    // A route must be named to validate; naoh is representative and the probe only
    // asks whether choosing is possible now, not which is best.
    return { route: 'naoh' }
  }
  return {}
}

/** Smallest permitted aliquot, from the frozen scenario constants. */
const SMALLEST_PERMITTED_ALIQUOT_L = PERMITTED_ALIQUOTS_L[0]!

/** The acid route type, re-exported so workbench callers need one import. */
export type { AcidRoute }
