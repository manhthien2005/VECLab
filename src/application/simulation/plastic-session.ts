import type {
  DomainError,
  ResourceLedger,
  SimulationAction,
  UUID,
} from '@/domain/process/contracts.js'
import { createInitialResourceLedger } from '@/domain/process/ledger.js'
import { replayEvents } from '@/domain/process/lifecycle.js'
import {
  modelInvalid,
  preconditionFailed,
  unsupportedRelease,
} from '@/shared/errors/domain-errors.js'
import { newUUID } from '@/shared/ids.js'
import {
  createPlasticSeparationModule,
  PLASTIC_PROFILE,
  type PlasticSeparationState,
} from '@/domain/experiments/virgin-plastic-separation/index.js'
import {
  PLASTIC_PROJECTION_VERSION,
  PLASTIC_REPORT_SCHEMA_VERSION,
  buildPlasticReport,
  projectPlastic,
  type PlasticProjection,
  type PlasticReportSnapshot,
} from '@/application/scenarios/plastic-projection.js'
import type {
  Attempt,
  AttemptRepository,
  WriteResult,
} from '@/application/attempts/repository.js'
import { commitAction } from './commit-action.js'

const engine = createPlasticSeparationModule()

export type PlasticCommitIdentity = { actionId?: UUID; expectedRevision?: number }
export type PlasticWriteRefusal = Extract<WriteResult<PlasticSeparationState>, { ok: false }>

export type PlasticSessionView = {
  scenarioKey: 'plastic-separation'
  attemptId: UUID
  releaseId: string
  revision: number
  lastSequence: number
  status: 'in_progress' | 'completed' | 'stopped'
  storageMode: 'local' | 'cloud'
  createdAt: Date
  completedAt: Date | null
  projection: PlasticProjection
  report: PlasticReportSnapshot | null
}

export type PlasticActionFeedback = {
  actionType: string
  sequence: number
  idempotentReplay: boolean
}

export type PlasticActionResult =
  | { ok: true; state: PlasticSessionView; feedback: PlasticActionFeedback }
  | { ok: false; error: DomainError }
  | PlasticWriteRefusal

export type PlasticCompletionResult =
  | { ok: true; state: PlasticSessionView; report: PlasticReportSnapshot; idempotentReplay: boolean }
  | { ok: false; error: DomainError }
  | PlasticWriteRefusal

export type PlasticSession = {
  readonly storageMode: 'local' | 'cloud'
  start(): Promise<PlasticSessionView>
  load(attemptId: UUID): Promise<{ ok: true; state: PlasticSessionView } | { ok: false; error: DomainError } | null>
  apply(
    attemptId: UUID,
    actionType: string,
    parameters?: SimulationAction['parameters'],
    unitSelections?: SimulationAction['unitSelections'],
    commit?: PlasticCommitIdentity,
  ): Promise<PlasticActionResult>
  complete(attemptId: UUID, commit?: PlasticCommitIdentity): Promise<PlasticCompletionResult>
}

function invalidChain(data: DomainError['data']): DomainError {
  return modelInvalid('STATE_HASH_MISMATCH', 'errors.revisionConflict', data)
}

function isPlasticReport(value: unknown): value is PlasticReportSnapshot {
  if (value === null || typeof value !== 'object') return false
  const report = value as Partial<PlasticReportSnapshot>
  return (
    report.schemaVersion === PLASTIC_REPORT_SCHEMA_VERSION &&
    report.scenarioKey === 'plastic-separation' &&
    report.releaseId === PLASTIC_PROFILE.releaseId &&
    report.generatedAt instanceof Date &&
    Array.isArray(report.diagnostics) &&
    report.projection?.scenarioKey === 'plastic-separation'
  )
}

export function createPlasticSession(
  repository: AttemptRepository<PlasticSeparationState>,
): PlasticSession {
  function view(attempt: Attempt<PlasticSeparationState>): PlasticSessionView {
    const report =
      attempt.status === 'completed' && isPlasticReport(attempt.finalReportSnapshot)
        ? attempt.finalReportSnapshot
        : null

    return {
      scenarioKey: 'plastic-separation',
      attemptId: attempt.attemptId,
      releaseId: attempt.scenarioReleaseId,
      revision: attempt.revision,
      lastSequence: attempt.lastSequence,
      status: attempt.status,
      storageMode: repository.storageMode,
      createdAt: attempt.createdAt,
      completedAt: attempt.completedAt,
      projection: projectPlastic(attempt.currentState),
      report,
    }
  }

  async function requireAttempt(
    attemptId: UUID,
  ): Promise<
    | { ok: true; loaded: { attempt: Attempt<PlasticSeparationState>; ledger: ResourceLedger } }
    | { ok: false; error: DomainError }
    | null
  > {
    const record = await repository.getAttempt(attemptId)
    if (record === null) return null

    if (record.scenarioReleaseId !== PLASTIC_PROFILE.releaseId) {
      return { ok: false, error: unsupportedRelease(record.scenarioReleaseId) }
    }

    const events = await repository.getAttemptEvents(attemptId)
    const initialLedger = createInitialResourceLedger()
    const replayed = replayEvents(record.initialState, initialLedger, events)
    if (!replayed.ok) {
      return { ok: false, error: replayed.error }
    }

    if (events.length > 0) {
      const lastEvent = events[events.length - 1]!
      if (lastEvent.sequence !== record.lastSequence) {
        return {
          ok: false,
          error: invalidChain({
            sequence: lastEvent.sequence,
            lastSequence: record.lastSequence,
          }),
        }
      }
    }

    return {
      ok: true,
      loaded: { attempt: record, ledger: replayed.ledger },
    }
  }

  return {
    get storageMode() {
      return repository.storageMode
    },

    async start() {
      const attemptId = newUUID()
      const initialState = engine.createInitialState()

      const attempt = await repository.createAttempt({
        attemptId,
        scenarioKey: 'plastic-separation',
        scenarioReleaseId: PLASTIC_PROFILE.releaseId,
        contentLocale: 'vi',
        initialState,
        initialProjection: projectPlastic(initialState),
        projectionVersion: PLASTIC_PROJECTION_VERSION,
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
      commit: PlasticCommitIdentity = {},
    ): Promise<PlasticActionResult> {
      const found = await requireAttempt(attemptId)
      if (found === null) return { ok: false, outcome: 'not_found' }
      if (!found.ok) return { ok: false, error: found.error }
      const { attempt, ledger } = found.loaded

      if (actionType === 'complete') {
        return {
          ok: false,
          error: preconditionFailed('USE_COMPLETE_METHOD', 'errors.plastic.USE_COMPLETE_METHOD'),
        }
      }

      if (commit.actionId) {
        const events = await repository.getAttemptEventRecords(attemptId)
        const existing = events.find((e) => e.actionId === commit.actionId)
        if (existing) {
          if (existing.actionType === actionType) {
            return {
              ok: true,
              state: view(attempt),
              feedback: {
                actionType,
                sequence: existing.sequence,
                idempotentReplay: true,
              },
            }
          }
          return {
            ok: false,
            outcome: 'idempotency_conflict',
            existingSequence: existing.sequence,
          }
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
          attemptId,
          releaseId: PLASTIC_PROFILE.releaseId,
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

      const written = await repository.appendAction({
        attemptId,
        scenarioReleaseId: PLASTIC_PROFILE.releaseId,
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
        nextProjection: projectPlastic(result.stateAfter),
      })

      if (!written.ok) return written

      const isReplay = written.outcome === 'idempotent_replay'
      return {
        ok: true,
        state: view(written.attempt),
        feedback: {
          actionType,
          sequence: isReplay ? written.attempt.lastSequence : result.sequence,
          idempotentReplay: isReplay,
        },
      }
    },

    async complete(
      attemptId: UUID,
      commit: PlasticCommitIdentity = {},
    ): Promise<PlasticCompletionResult> {
      const found = await requireAttempt(attemptId)
      if (found === null) return { ok: false, outcome: 'not_found' }
      if (!found.ok) return { ok: false, error: found.error }
      const { attempt, ledger } = found.loaded

      if (commit.actionId) {
        const events = await repository.getAttemptEventRecords(attemptId)
        const existing = events.find((e) => e.actionId === commit.actionId)
        if (existing) {
          if (existing.actionType === 'completed' || existing.actionType === 'complete') {
            const finalReport =
              attempt.finalReportSnapshot && isPlasticReport(attempt.finalReportSnapshot)
                ? attempt.finalReportSnapshot
                : null
            if (finalReport) {
              return {
                ok: true,
                state: view(attempt),
                report: finalReport,
                idempotentReplay: true,
              }
            }
          }
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
          attemptId,
          releaseId: PLASTIC_PROFILE.releaseId,
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

      const records = await repository.getAttemptEventRecords(attemptId)
      const report = buildPlasticReport(
        result.stateAfter,
        result.ledgerAfter,
        records,
        result.occurredAt,
      )

      const written = await repository.completeAttempt({
        attemptId,
        scenarioReleaseId: PLASTIC_PROFILE.releaseId,
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
        nextProjection: projectPlastic(result.stateAfter),
        finalReportSnapshot: report,
      })

      if (!written.ok) return written

      const finalReport =
        written.attempt.finalReportSnapshot && isPlasticReport(written.attempt.finalReportSnapshot)
          ? written.attempt.finalReportSnapshot
          : report

      return {
        ok: true,
        state: view(written.attempt),
        report: finalReport,
        idempotentReplay: written.outcome === 'idempotent_replay',
      }
    },
  }
}
