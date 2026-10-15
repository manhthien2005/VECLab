import type {
  DomainError, ResourceLedger, SimulationAction, UUID,
} from '@/domain/process/contracts.js'
import { createInitialResourceLedger } from '@/domain/process/ledger.js'
import { replayEvents, normalizeParameters } from '@/domain/process/lifecycle.js'
import { requestFingerprint, stateHash } from '@/domain/process/hashing.js'
import {
  modelInvalid, preconditionFailed, revisionConflict, unsupportedRelease,
} from '@/shared/errors/domain-errors.js'
import { newUUID } from '@/shared/ids.js'
import {
  createExtractionModule, EXTRACTION_PROFILE,
} from '@/domain/experiments/acid-base-extraction/engine.js'
import type { ExtractionState } from '@/domain/experiments/acid-base-extraction/model.js'
import {
  EXTRACTION_PROJECTION_VERSION, EXTRACTION_REPORT_SCHEMA_VERSION,
  buildExtractionReport, projectExtraction,
  type ExtractionProjection, type ExtractionReportSnapshot,
} from '@/application/scenarios/extraction-projection.js'
import type {
  Attempt, AttemptRepository, StoredAttemptEventRecord, WriteResult,
} from '@/application/attempts/repository.js'
import { commitAction } from './commit-action.js'

const engine = createExtractionModule()
/** Repository reads are separate transactions; retry a changing snapshot, never forever. */
const MAX_COHERENT_READS = 4
export type ExtractionCommitIdentity = { actionId?: UUID; expectedRevision?: number }
export type ExtractionWriteRefusal = Extract<WriteResult<ExtractionState>, { ok: false }>

export type ExtractionSessionView = {
  scenarioKey: 'acid-base-extraction'
  attemptId: UUID
  releaseId: string
  revision: number
  lastSequence: number
  status: 'in_progress' | 'completed' | 'stopped'
  storageMode: 'local' | 'cloud'
  createdAt: Date
  completedAt: Date | null
  projection: ExtractionProjection
  report: ExtractionReportSnapshot | null
}

export type ExtractionActionFeedback = {
  actionType: string
  sequence: number
  idempotentReplay: boolean
}

/** UI-safe view or typed refusal. No raw state, hashes or answer key. */
export type ExtractionActionResult =
  | { ok: true; state: ExtractionSessionView; feedback: ExtractionActionFeedback }
  | { ok: false; error: DomainError }
  | ExtractionWriteRefusal

export type ExtractionCompletionResult =
  | { ok: true; state: ExtractionSessionView; report: ExtractionReportSnapshot; idempotentReplay: boolean }
  | { ok: false; error: DomainError }
  | ExtractionWriteRefusal

export type ExtractionSession = {
  readonly storageMode: 'local' | 'cloud'
  start(): Promise<ExtractionSessionView>
  load(attemptId: UUID): Promise<{ ok: true; state: ExtractionSessionView } | { ok: false; error: DomainError } | null>
  apply(
    attemptId: UUID,
    actionType: string,
    parameters?: SimulationAction['parameters'],
    unitSelections?: SimulationAction['unitSelections'],
    commit?: ExtractionCommitIdentity,
  ): Promise<ExtractionActionResult>
  complete(attemptId: UUID, commit?: ExtractionCommitIdentity): Promise<ExtractionCompletionResult>
}

function invalidChain(data: DomainError['data']): DomainError {
  return modelInvalid('STATE_HASH_MISMATCH', 'errors.revisionConflict', data)
}

function isExtractionReport(value: unknown): value is ExtractionReportSnapshot {
  if (value === null || typeof value !== 'object') return false
  const report = value as Partial<ExtractionReportSnapshot>
  return report.schemaVersion === EXTRACTION_REPORT_SCHEMA_VERSION &&
    report.scenarioKey === 'acid-base-extraction' &&
    report.releaseId === EXTRACTION_PROFILE.releaseId &&
    report.generatedAt instanceof Date &&
    Array.isArray(report.products) && Array.isArray(report.diagnostics) &&
    report.projection?.scenarioKey === 'acid-base-extraction' &&
    report.versions?.profileVersion === EXTRACTION_PROFILE.version
}

/**
 * A retry can arrive after another action or after completion. Match the
 * canonical intent against the stored fingerprint BEFORE evaluating new state.
 * Completion uses the domain action 'complete' (stored as lifecycle 'completed').
 */
function fingerprintFor(
  attemptId: UUID,
  actionType: string,
  parameters: SimulationAction['parameters'],
  unitSelections: SimulationAction['unitSelections'],
): string | null {
  const normalized = normalizeParameters(parameters, unitSelections, engine.parameterQuantities)
  if (!normalized.ok) return null
  try {
    return requestFingerprint({
      attemptId,
      scenarioReleaseId: EXTRACTION_PROFILE.releaseId,
      actionType,
      normalizedParameters: normalized.parameters,
      canonicalUnits: unitSelections,
    })
  } catch {
    // A malformed retry can never match a committed canonical intent.
    return null
  }
}

export function createExtractionSession(repository: AttemptRepository<ExtractionState>): ExtractionSession {
  type Loaded = { attempt: Attempt<ExtractionState>; ledger: ResourceLedger }
  async function requireAttempt(
    attemptId: UUID,
  ): Promise<{ ok: true; loaded: Loaded } | { ok: false; error: DomainError } | null> {
    for (let read = 0; read < MAX_COHERENT_READS; read += 1) {
      const attempt = await repository.getAttempt(attemptId)
      if (attempt === null) return null

      // Check discriminator/release BEFORE casting or replaying foreign state.
      if (attempt.scenarioKey !== 'acid-base-extraction' ||
          attempt.scenarioReleaseId !== EXTRACTION_PROFILE.releaseId) {
        return { ok: false, error: unsupportedRelease(attempt.scenarioReleaseId) }
      }
      if (attempt.initialState?.profileId !== EXTRACTION_PROFILE.id ||
          attempt.initialState?.profileVersion !== EXTRACTION_PROFILE.version ||
          attempt.projectionVersion !== EXTRACTION_PROJECTION_VERSION) {
        return { ok: false, error: unsupportedRelease(attempt.scenarioReleaseId) }
      }

      // Attempt and events have independent read transactions. An action may
      // commit between them: a newer event chain is not evidence of tampering
      // against the older attempt snapshot. Re-read both as a pair, bounded.
      const events = await repository.getAttemptEvents(attemptId)
      const replay = replayEvents(attempt.initialState, createInitialResourceLedger(), events)
      if (!replay.ok) return { ok: false, error: replay.error }
      if (events.length === attempt.lastSequence &&
          stateHash(replay.state) === stateHash(attempt.currentState)) {
        return { ok: true, loaded: { attempt, ledger: replay.ledger } }
      }
      if (read === MAX_COHERENT_READS - 1) {
        // The read budget ended. Distinguish ongoing legitimate writes
        // from a stable yet inconsistent persisted chain. Never label a
        // changing revision as tampering.
        const latest = await repository.getAttempt(attemptId)
        if (latest === null) return null
        if (latest.scenarioKey !== 'acid-base-extraction' ||
            latest.scenarioReleaseId !== EXTRACTION_PROFILE.releaseId) {
          return { ok: false, error: unsupportedRelease(latest.scenarioReleaseId) }
        }
        if (latest.revision !== attempt.revision ||
            latest.lastSequence !== attempt.lastSequence) {
          return {
            ok: false, error: revisionConflict({
              attemptId, expectedRevision: attempt.revision, currentRevision: latest.revision,
            }),
          }
        }
        return {
          ok: false, error: invalidChain({
            expectedSequence: attempt.lastSequence, actualSequence: events.length,
          }),
        }
      }
    }
    // Defensive unreachable branch; the loop either reads a coherent pair or refuses.
    return { ok: false, error: invalidChain({}) }
  }

  function view(attempt: Attempt<ExtractionState>): ExtractionSessionView {
    return {
      scenarioKey: 'acid-base-extraction',
      attemptId: attempt.attemptId,
      releaseId: attempt.scenarioReleaseId,
      revision: attempt.revision,
      lastSequence: attempt.lastSequence,
      status: attempt.status,
      storageMode: repository.storageMode,
      createdAt: attempt.createdAt,
      completedAt: attempt.completedAt,
      projection: projectExtraction(attempt.currentState),
      report: attempt.status === 'completed' &&
        attempt.currentState.phase === 'completed' &&
        isExtractionReport(attempt.finalReportSnapshot)
          ? attempt.finalReportSnapshot
          : null,
    }
  }

  async function readAfterWrite(attemptId: UUID): Promise<
    { ok: true; state: ExtractionSessionView } | { ok: false; error: DomainError } | ExtractionWriteRefusal
  > {
    const found = await requireAttempt(attemptId)
    if (found === null) return { ok: false, outcome: 'not_found' }
    if (!found.ok) return { ok: false, error: found.error }
    return { ok: true, state: view(found.loaded.attempt) }
  }

  async function existingAction(
    attemptId: UUID,
    actionId: UUID | undefined,
    actionType: string,
    parameters: SimulationAction['parameters'],
    unitSelections: SimulationAction['unitSelections'],
  ): Promise<
    | { kind: 'new' }
    | { kind: 'conflict'; result: ExtractionWriteRefusal }
    | { kind: 'replay'; record: StoredAttemptEventRecord<ExtractionState> }
  > {
    if (!actionId) return { kind: 'new' }
    const events = await repository.getAttemptEventRecords(attemptId)
    const record = events.find((event) => event.actionId === actionId)
    if (!record) return { kind: 'new' }
    const fingerprint = fingerprintFor(attemptId, actionType, parameters, unitSelections)
    if (fingerprint !== null && record.requestFingerprint === fingerprint) {
      return { kind: 'replay', record }
    }
    return {
      kind: 'conflict',
      result: { ok: false, outcome: 'idempotency_conflict', existingSequence: record.sequence },
    }
  }

  return {
    storageMode: repository.storageMode,

    async start(): Promise<ExtractionSessionView> {
      const initialState = engine.createInitialState()
      const attempt = await repository.createAttempt({
        attemptId: newUUID(),
        scenarioKey: 'acid-base-extraction',
        scenarioReleaseId: EXTRACTION_PROFILE.releaseId,
        contentLocale: 'vi',
        initialState,
        initialProjection: projectExtraction(initialState),
        projectionVersion: EXTRACTION_PROJECTION_VERSION,
      })
      return view(attempt)
    },

    async load(attemptId: UUID) {
      const found = await requireAttempt(attemptId)
      if (found === null || !found.ok) return found
      return { ok: true, state: view(found.loaded.attempt) }
    },

    async apply(
      attemptId: UUID,
      actionType: string,
      parameters: SimulationAction['parameters'] = {},
      unitSelections: SimulationAction['unitSelections'] = {},
      commit: ExtractionCommitIdentity = {},
    ): Promise<ExtractionActionResult> {
      const found = await requireAttempt(attemptId)
      if (found === null) return { ok: false, outcome: 'not_found' }
      if (!found.ok) return { ok: false, error: found.error }
      const { attempt, ledger } = found.loaded
      // Completion MUST use completeAttempt, never appendAction.
      if (actionType === 'complete') {
        return { ok: false, error: preconditionFailed(
          'USE_COMPLETE_METHOD', 'errors.jar.USE_COMPLETE_METHOD',
        ) }
      }
      const duplicate = await existingAction(
        attemptId, commit.actionId, actionType, parameters, unitSelections,
      )
      if (duplicate.kind === 'conflict') return duplicate.result
      if (duplicate.kind === 'replay') {
        // The event lookup may have observed a commit newer than 'attempt'.
        // Refresh the coherent attempt + ledger so revision, dose and report
        // always describe the same stored snapshot.
        const fresh = await readAfterWrite(attemptId)
        if (!fresh.ok) return fresh
        return {
          ok: true,
          state: fresh.state,
          feedback: {
            actionType, sequence: duplicate.record.sequence, idempotentReplay: true,
          },
        }
      }
      if (commit.expectedRevision !== undefined && commit.expectedRevision !== attempt.revision) {
        return { ok: false, outcome: 'revision_conflict', currentRevision: attempt.revision }
      }
      if (attempt.status !== 'in_progress') {
        return { ok: false, outcome: 'not_in_progress', status: attempt.status }
      }
      const result = commitAction(engine, {
        attempt: {
          attemptId, releaseId: EXTRACTION_PROFILE.releaseId,
          revision: attempt.revision, lastSequence: attempt.lastSequence,
          state: attempt.currentState, ledger,
        },
        action: {
          actionId: commit.actionId ?? newUUID(),
          actionType, parameters, unitSelections,
        },
        occurredAt: new Date(),
      })
      if (!result.ok) return { ok: false, error: result.error }

      const written = await repository.appendAction({
        attemptId,
        scenarioReleaseId: EXTRACTION_PROFILE.releaseId,
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
        nextProjection: projectExtraction(result.stateAfter),
      })
      if (!written.ok) return written
      const fresh = await readAfterWrite(attemptId)
      if (!fresh.ok) return fresh
      const idempotentReplay = written.outcome === 'idempotent_replay'
      let feedbackSequence = result.sequence
      if (idempotentReplay) {
        // Another tab won the race between our duplicate lookup and the write.
        // The stored event's original sequence, not the speculative one, is authoritative.
        const events = await repository.getAttemptEventRecords(attemptId)
        const existing = events.find((event) => event.actionId === result.actionId)
        if (!existing) {
          return { ok: false, error: invalidChain({ sequence: result.sequence }) }
        }
        feedbackSequence = existing.sequence
      }
      return {
        ok: true, state: fresh.state,
        feedback: { actionType, sequence: feedbackSequence, idempotentReplay },
      }
    },

    async complete(attemptId: UUID, commit: ExtractionCommitIdentity = {}): Promise<ExtractionCompletionResult> {
      const found = await requireAttempt(attemptId)
      if (found === null) return { ok: false, outcome: 'not_found' }
      if (!found.ok) return { ok: false, error: found.error }
      const { attempt, ledger } = found.loaded
      const duplicate = await existingAction(attemptId, commit.actionId, 'complete', {}, {})
      if (duplicate.kind === 'conflict') return duplicate.result
      if (duplicate.kind === 'replay') {
        // A concurrent complete may have committed after our initial read.
        // Load its immutable report from the now-completed stored attempt.
        const fresh = await readAfterWrite(attemptId)
        if (!fresh.ok) return fresh
        if (fresh.state.report === null) {
          return { ok: false, error: invalidChain({ sequence: duplicate.record.sequence }) }
        }
        return {
          ok: true, state: fresh.state, report: fresh.state.report, idempotentReplay: true,
        }
      }
      if (commit.expectedRevision !== undefined && commit.expectedRevision !== attempt.revision) {
        return { ok: false, outcome: 'revision_conflict', currentRevision: attempt.revision }
      }
      if (attempt.status !== 'in_progress') {
        return { ok: false, outcome: 'not_in_progress', status: attempt.status }
      }
      const result = commitAction(engine, {
        attempt: {
          attemptId, releaseId: EXTRACTION_PROFILE.releaseId,
          revision: attempt.revision, lastSequence: attempt.lastSequence,
          state: attempt.currentState, ledger,
        },
        action: {
          actionId: commit.actionId ?? newUUID(),
          actionType: 'complete', parameters: {}, unitSelections: {},
        },
        occurredAt: new Date(),
      })
      if (!result.ok) return { ok: false, error: result.error }

      // Every diagnostic references already committed actions; completion's own
      // event has no measurements to evidence and is written with this report.
      const records = await repository.getAttemptEventRecords(attemptId)
      const report = buildExtractionReport(result.stateAfter, result.ledgerAfter, records, result.occurredAt)
      const written = await repository.completeAttempt({
        attemptId,
        scenarioReleaseId: EXTRACTION_PROFILE.releaseId,
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
        nextProjection: projectExtraction(result.stateAfter),
        finalReportSnapshot: report,
      })
      if (!written.ok) return written
      const fresh = await readAfterWrite(attemptId)
      if (!fresh.ok) return fresh
      const storedReport = fresh.state.report
      if (storedReport === null) {
        return { ok: false, error: invalidChain({ sequence: result.sequence }) }
      }
      return {
        ok: true, state: fresh.state, report: storedReport,
        idempotentReplay: written.outcome === 'idempotent_replay',
      }
    },

  }
}
