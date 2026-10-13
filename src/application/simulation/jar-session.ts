import type {
  DomainError, ResourceLedger, SimulationAction, UUID,
} from '@/domain/process/contracts.js'
import { createInitialResourceLedger } from '@/domain/process/ledger.js'
import { replayEvents, normalizeParameters } from '@/domain/process/lifecycle.js'
import { requestFingerprint, stateHash } from '@/domain/process/hashing.js'
import { modelInvalid, preconditionFailed, unsupportedRelease } from '@/shared/errors/domain-errors.js'
import { newUUID } from '@/shared/ids.js'
import {
  createJarModule, JAR_PROFILE,
} from '@/domain/experiments/jar-test/engine.js'
import type { JarState } from '@/domain/experiments/jar-test/model.js'
import {
  JAR_PROJECTION_VERSION, JAR_REPORT_SCHEMA_VERSION,
  buildJarReport, projectJar,
  type JarProjection, type JarReportSnapshot,
} from '@/application/scenarios/jar-projection.js'
import type {
  Attempt, AttemptRepository, StoredAttemptEventRecord, WriteResult,
} from '@/application/attempts/repository.js'
import { commitAction } from './commit-action.js'

const engine = createJarModule()
export type JarCommitIdentity = { actionId?: UUID; expectedRevision?: number }
export type JarWriteRefusal = Extract<WriteResult<JarState>, { ok: false }>

export type JarSessionView = {
  scenarioKey: 'jar-test'
  attemptId: UUID
  releaseId: string
  revision: number
  lastSequence: number
  status: 'in_progress' | 'completed' | 'stopped'
  storageMode: 'local' | 'cloud'
  createdAt: Date
  completedAt: Date | null
  projection: JarProjection
  report: JarReportSnapshot | null
}

export type JarActionFeedback = {
  actionType: string
  sequence: number
  idempotentReplay: boolean
}

/** UI-safe view or typed refusal. No raw state, hashes or answer key. */
export type JarActionResult =
  | { ok: true; state: JarSessionView; feedback: JarActionFeedback }
  | { ok: false; error: DomainError }
  | JarWriteRefusal

export type JarCompletionResult =
  | { ok: true; state: JarSessionView; report: JarReportSnapshot; idempotentReplay: boolean }
  | { ok: false; error: DomainError }
  | JarWriteRefusal

export type JarSession = {
  readonly storageMode: 'local' | 'cloud'
  start(): Promise<JarSessionView>
  load(attemptId: UUID): Promise<{ ok: true; state: JarSessionView } | { ok: false; error: DomainError } | null>
  apply(
    attemptId: UUID,
    actionType: string,
    parameters?: SimulationAction['parameters'],
    unitSelections?: SimulationAction['unitSelections'],
    commit?: JarCommitIdentity,
  ): Promise<JarActionResult>
  complete(attemptId: UUID, commit?: JarCommitIdentity): Promise<JarCompletionResult>
}

function invalidChain(data: DomainError['data']): DomainError {
  return modelInvalid('STATE_HASH_MISMATCH', 'errors.revisionConflict', data)
}

function isJarReport(value: unknown): value is JarReportSnapshot {
  if (value === null || typeof value !== 'object') return false
  const report = value as Partial<JarReportSnapshot>
  return report.schemaVersion === JAR_REPORT_SCHEMA_VERSION &&
    report.scenarioKey === 'jar-test' &&
    report.releaseId === JAR_PROFILE.releaseId &&
    report.generatedAt instanceof Date &&
    Array.isArray(report.cups) && Array.isArray(report.diagnostics) &&
    report.projection?.scenarioKey === 'jar-test' &&
    report.versions?.profileVersion === JAR_PROFILE.version
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
      scenarioReleaseId: JAR_PROFILE.releaseId,
      actionType,
      normalizedParameters: normalized.parameters,
      canonicalUnits: unitSelections,
    })
  } catch {
    // A malformed retry can never match a committed canonical intent.
    return null
  }
}

export function createJarSession(repository: AttemptRepository<JarState>): JarSession {
  type Loaded = { attempt: Attempt<JarState>; ledger: ResourceLedger }
  async function requireAttempt(
    attemptId: UUID,
  ): Promise<{ ok: true; loaded: Loaded } | { ok: false; error: DomainError } | null> {
    const attempt = await repository.getAttempt(attemptId)
    if (attempt === null) return null

    // Discriminator and release BEFORE reading the initial/current state or replaying.
    if (attempt.scenarioKey !== 'jar-test' ||
        attempt.scenarioReleaseId !== JAR_PROFILE.releaseId) {
      return { ok: false, error: unsupportedRelease(attempt.scenarioReleaseId) }
    }
    if (attempt.initialState?.profileId !== JAR_PROFILE.id ||
        attempt.initialState?.profileVersion !== JAR_PROFILE.version ||
        attempt.projectionVersion !== JAR_PROJECTION_VERSION) {
      return { ok: false, error: unsupportedRelease(attempt.scenarioReleaseId) }
    }
    const events = await repository.getAttemptEvents(attemptId)
    const replay = replayEvents(attempt.initialState, createInitialResourceLedger(), events)
    if (!replay.ok) return { ok: false, error: replay.error }
    if (events.length !== attempt.lastSequence ||
        stateHash(replay.state) !== stateHash(attempt.currentState)) {
      return {
        ok: false, error: invalidChain({
          expectedSequence: attempt.lastSequence, actualSequence: events.length,
        }),
      }
    }
    return { ok: true, loaded: { attempt, ledger: replay.ledger } }
  }

  function view(attempt: Attempt<JarState>): JarSessionView {
    return {
      scenarioKey: 'jar-test',
      attemptId: attempt.attemptId,
      releaseId: attempt.scenarioReleaseId,
      revision: attempt.revision,
      lastSequence: attempt.lastSequence,
      status: attempt.status,
      storageMode: repository.storageMode,
      createdAt: attempt.createdAt,
      completedAt: attempt.completedAt,
      projection: projectJar(attempt.currentState),
      report: attempt.status === 'completed' &&
        attempt.currentState.phase === 'completed' &&
        isJarReport(attempt.finalReportSnapshot)
          ? attempt.finalReportSnapshot
          : null,
    }
  }

  async function readAfterWrite(attemptId: UUID): Promise<
    { ok: true; state: JarSessionView } | { ok: false; error: DomainError } | JarWriteRefusal
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
    | { kind: 'conflict'; result: JarWriteRefusal }
    | { kind: 'replay'; record: StoredAttemptEventRecord<JarState> }
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

    async start(): Promise<JarSessionView> {
      const initialState = engine.createInitialState()
      const attempt = await repository.createAttempt({
        attemptId: newUUID(),
        scenarioKey: 'jar-test',
        scenarioReleaseId: JAR_PROFILE.releaseId,
        contentLocale: 'vi',
        initialState,
        initialProjection: projectJar(initialState),
        projectionVersion: JAR_PROJECTION_VERSION,
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
      commit: JarCommitIdentity = {},
    ): Promise<JarActionResult> {
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
        return {
          ok: true,
          state: view(attempt),
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
          attemptId, releaseId: JAR_PROFILE.releaseId,
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
        scenarioReleaseId: JAR_PROFILE.releaseId,
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
        nextProjection: projectJar(result.stateAfter),
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

    async complete(attemptId: UUID, commit: JarCommitIdentity = {}): Promise<JarCompletionResult> {
      const found = await requireAttempt(attemptId)
      if (found === null) return { ok: false, outcome: 'not_found' }
      if (!found.ok) return { ok: false, error: found.error }
      const { attempt, ledger } = found.loaded
      const duplicate = await existingAction(attemptId, commit.actionId, 'complete', {}, {})
      if (duplicate.kind === 'conflict') return duplicate.result
      if (duplicate.kind === 'replay') {
        const existing = view(attempt)
        if (existing.report === null) {
          return { ok: false, error: invalidChain({ sequence: duplicate.record.sequence }) }
        }
        return { ok: true, state: existing, report: existing.report, idempotentReplay: true }
      }
      if (commit.expectedRevision !== undefined && commit.expectedRevision !== attempt.revision) {
        return { ok: false, outcome: 'revision_conflict', currentRevision: attempt.revision }
      }
      if (attempt.status !== 'in_progress') {
        return { ok: false, outcome: 'not_in_progress', status: attempt.status }
      }
      const result = commitAction(engine, {
        attempt: {
          attemptId, releaseId: JAR_PROFILE.releaseId,
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
      const report = buildJarReport(result.stateAfter, result.ledgerAfter, records, result.occurredAt)
      const written = await repository.completeAttempt({
        attemptId,
        scenarioReleaseId: JAR_PROFILE.releaseId,
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
        nextProjection: projectJar(result.stateAfter),
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
