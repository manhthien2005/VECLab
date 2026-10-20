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
import { createSoapModule, SOAP_PROFILE } from '@/domain/experiments/soap/engine.js'
import type { SoapState } from '@/domain/experiments/soap/model.js'
import {
  SOAP_PROJECTION_VERSION, buildSoapReport, isSoapReport, projectSoap,
  type SoapProjection, type SoapReportSnapshot,
} from '@/application/scenarios/soap-projection.js'
import type {
  Attempt, AttemptRepository, StoredAttemptEventRecord, WriteResult,
} from '@/application/attempts/repository.js'
import { commitAction } from './commit-action.js'

const engine = createSoapModule()
const MAX_COHERENT_READS = 4
export type SoapCommitIdentity = { actionId?: UUID; expectedRevision?: number }
export type SoapWriteRefusal = Extract<WriteResult<SoapState>, { ok: false }>

export type SoapSessionView = {
  scenarioKey: 'cold-process-soap'
  attemptId: UUID
  releaseId: string
  revision: number
  lastSequence: number
  status: 'in_progress' | 'completed' | 'stopped'
  storageMode: 'local' | 'cloud'
  createdAt: Date
  completedAt: Date | null
  projection: SoapProjection
  report: SoapReportSnapshot | null
}

export type SoapActionFeedback = {
  actionType: string
  sequence: number
  idempotentReplay: boolean
}

export type SoapActionResult =
  | { ok: true; state: SoapSessionView; feedback: SoapActionFeedback }
  | { ok: false; error: DomainError }
  | SoapWriteRefusal

export type SoapCompletionResult =
  | { ok: true; state: SoapSessionView; report: SoapReportSnapshot; idempotentReplay: boolean }
  | { ok: false; error: DomainError }
  | SoapWriteRefusal

export type SoapSession = {
  readonly storageMode: 'local' | 'cloud'
  start(): Promise<SoapSessionView>
  load(attemptId: UUID): Promise<{ ok: true; state: SoapSessionView } | { ok: false; error: DomainError } | null>
  apply(
    attemptId: UUID,
    actionType: string,
    parameters?: SimulationAction['parameters'],
    unitSelections?: SimulationAction['unitSelections'],
    commit?: SoapCommitIdentity,
  ): Promise<SoapActionResult>
  complete(attemptId: UUID, commit?: SoapCommitIdentity): Promise<SoapCompletionResult>
}

function invalidChain(data: DomainError['data']): DomainError {
  return modelInvalid('STATE_HASH_MISMATCH', 'errors.revisionConflict', data)
}

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
      scenarioReleaseId: SOAP_PROFILE.releaseId,
      actionType,
      normalizedParameters: normalized.parameters,
      canonicalUnits: unitSelections,
    })
  } catch {
    return null
  }
}

export function createSoapSession(repository: AttemptRepository<SoapState>): SoapSession {
  type Loaded = { attempt: Attempt<SoapState>; ledger: ResourceLedger }
  async function requireAttempt(
    attemptId: UUID,
  ): Promise<{ ok: true; loaded: Loaded } | { ok: false; error: DomainError } | null> {
    for (let read = 0; read < MAX_COHERENT_READS; read += 1) {
      const attempt = await repository.getAttempt(attemptId)
      if (attempt === null) return null
      if (attempt.scenarioKey !== 'cold-process-soap' ||
          attempt.scenarioReleaseId !== SOAP_PROFILE.releaseId) {
        return { ok: false, error: unsupportedRelease(attempt.scenarioReleaseId) }
      }
      if (attempt.initialState?.profileId !== SOAP_PROFILE.id ||
          attempt.initialState?.profileVersion !== SOAP_PROFILE.version ||
          attempt.projectionVersion !== SOAP_PROJECTION_VERSION) {
        return { ok: false, error: unsupportedRelease(attempt.scenarioReleaseId) }
      }
      const events = await repository.getAttemptEvents(attemptId)
      const replay = replayEvents(attempt.initialState, createInitialResourceLedger(), events)
      if (!replay.ok) return { ok: false, error: replay.error }
      if (events.length === attempt.lastSequence &&
          stateHash(replay.state) === stateHash(attempt.currentState)) {
        return { ok: true, loaded: { attempt, ledger: replay.ledger } }
      }
      if (read === MAX_COHERENT_READS - 1) {
        const latest = await repository.getAttempt(attemptId)
        if (latest === null) return null
        if (latest.scenarioKey !== 'cold-process-soap' ||
            latest.scenarioReleaseId !== SOAP_PROFILE.releaseId) {
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
    return { ok: false, error: invalidChain({}) }
  }

  function view(attempt: Attempt<SoapState>): SoapSessionView {
    return {
      scenarioKey: 'cold-process-soap',
      attemptId: attempt.attemptId,
      releaseId: attempt.scenarioReleaseId,
      revision: attempt.revision,
      lastSequence: attempt.lastSequence,
      status: attempt.status,
      storageMode: repository.storageMode,
      createdAt: attempt.createdAt,
      completedAt: attempt.completedAt,
      projection: projectSoap(attempt.currentState),
      report: attempt.status === 'completed' && isSoapReport(attempt.finalReportSnapshot)
        ? attempt.finalReportSnapshot
        : null,
    }
  }

  async function readAfterWrite(attemptId: UUID): Promise<
    { ok: true; state: SoapSessionView } | { ok: false; error: DomainError } | SoapWriteRefusal
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
    | { kind: 'conflict'; result: SoapWriteRefusal }
    | { kind: 'replay'; record: StoredAttemptEventRecord<SoapState> }
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

    async start(): Promise<SoapSessionView> {
      const initialState = engine.createInitialState()
      const attempt = await repository.createAttempt({
        attemptId: newUUID(),
        scenarioKey: 'cold-process-soap',
        scenarioReleaseId: SOAP_PROFILE.releaseId,
        contentLocale: 'vi',
        initialState,
        initialProjection: projectSoap(initialState),
        projectionVersion: SOAP_PROJECTION_VERSION,
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
      commit: SoapCommitIdentity = {},
    ): Promise<SoapActionResult> {
      const found = await requireAttempt(attemptId)
      if (found === null) return { ok: false, outcome: 'not_found' }
      if (!found.ok) return { ok: false, error: found.error }
      const { attempt, ledger } = found.loaded
      if (actionType === 'complete') {
        return { ok: false, error: preconditionFailed(
          'USE_COMPLETE_METHOD', 'errors.soap.USE_COMPLETE_METHOD',
        ) }
      }
      const duplicate = await existingAction(
        attemptId, commit.actionId, actionType, parameters, unitSelections,
      )
      if (duplicate.kind === 'conflict') return duplicate.result
      if (duplicate.kind === 'replay') {
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
          attemptId, releaseId: SOAP_PROFILE.releaseId,
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
        scenarioReleaseId: SOAP_PROFILE.releaseId,
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
        nextProjection: projectSoap(result.stateAfter),
      })
      if (!written.ok) return written
      const fresh = await readAfterWrite(attemptId)
      if (!fresh.ok) return fresh
      const idempotentReplay = written.outcome === 'idempotent_replay'
      let feedbackSequence = result.sequence
      if (idempotentReplay) {
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

    async complete(attemptId: UUID, commit: SoapCommitIdentity = {}): Promise<SoapCompletionResult> {
      const found = await requireAttempt(attemptId)
      if (found === null) return { ok: false, outcome: 'not_found' }
      if (!found.ok) return { ok: false, error: found.error }
      const { attempt, ledger } = found.loaded
      const duplicate = await existingAction(attemptId, commit.actionId, 'complete', {}, {})
      if (duplicate.kind === 'conflict') return duplicate.result
      if (duplicate.kind === 'replay') {
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
          attemptId, releaseId: SOAP_PROFILE.releaseId,
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
      const records = await repository.getAttemptEventRecords(attemptId)
      const report = buildSoapReport(result.stateAfter, result.ledgerAfter, records, result.occurredAt)
      const written = await repository.completeAttempt({
        attemptId,
        scenarioReleaseId: SOAP_PROFILE.releaseId,
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
        nextProjection: projectSoap(result.stateAfter),
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
