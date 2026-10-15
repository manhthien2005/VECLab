import type { UUID } from '@/domain/process/contracts.js'
import type { StoredAttemptEventRecord } from '@/application/attempts/repository.js'
import type { JarState, JarMeasurement } from '@/domain/experiments/jar-test/model.js'
import { JAR_PROFILE } from '@/domain/experiments/jar-test/model.js'
import { JAR_PROJECTION_VERSION, JAR_REPORT_SCHEMA_VERSION } from '@/application/scenarios/jar-projection.js'
import type { JarSessionView, JarActionFeedback } from './jar-session.js'
import type { JarReportSnapshot } from '@/application/scenarios/jar-projection.js'

/** Learner-facing Jar wire contracts contain no domain state, hashes or trusted traces. */
export type JarReportDto = Omit<JarReportSnapshot, 'generatedAt'> & { generatedAt: string }
export type JarSessionDto = Omit<JarSessionView, 'createdAt' | 'completedAt' | 'report'> & {
  createdAt: string
  completedAt: string | null
  report: JarReportDto | null
}
export type JarEventDto = {
  sequence: number
  actionId: UUID
  actionType: string
  occurredAt: string
  parameters: Record<string, number | string | boolean>
  unitSelections: Record<string, string>
  measurement: {
    id: string
    cupId: string | null
    valueNtu: number | null
    valid: boolean
    invalidReason: JarMeasurement['invalidReason']
  } | null
}
export type JarActionResultDto =
  | { ok: true; state: JarSessionDto; feedback: JarActionFeedback }
  | { ok: false; error: import('@/domain/process/contracts.js').DomainError }
  | import('./jar-session.js').JarWriteRefusal
export type JarCompletionResultDto =
  | { ok: true; state: JarSessionDto; report: JarReportDto; idempotentReplay: boolean }
  | { ok: false; error: import('@/domain/process/contracts.js').DomainError }
  | import('./jar-session.js').JarWriteRefusal
export type JarLoadResultDto =
  | { ok: true; state: JarSessionDto }
  | { ok: false; error: import('@/domain/process/contracts.js').DomainError }
  | { ok: false; outcome: 'not_found' }

/** Server produces ISO-8601 strings; invalid/foreign responses fail closed on decode. */
export function parseJarTimestamp(value: unknown): Date {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) {
    throw new Error('Jar DTO contains an invalid timestamp')
  }
  const date = new Date(value)
  if (!Number.isFinite(date.getTime()) || date.toISOString() !== value) {
    throw new Error('Jar DTO contains an invalid timestamp')
  }
  return date
}

export function toJarReportDto(report: JarReportSnapshot): JarReportDto {
  return { ...report, generatedAt: report.generatedAt.toISOString() }
}
export function fromJarReportDto(dto: JarReportDto): JarReportSnapshot {
  if (dto.schemaVersion !== JAR_REPORT_SCHEMA_VERSION ||
      dto.scenarioKey !== 'jar-test' || dto.releaseId !== JAR_PROFILE.releaseId ||
      dto.projection?.scenarioKey !== 'jar-test' ||
      dto.projection.scenarioReleaseId !== JAR_PROFILE.releaseId ||
      !Array.isArray(dto.cups) || !Array.isArray(dto.diagnostics) ||
      dto.versions?.profileVersion !== JAR_PROFILE.version) {
    throw new Error('Jar DTO contains an unsupported report')
  }
  return { ...dto, generatedAt: parseJarTimestamp(dto.generatedAt) }
}
export function toJarSessionDto(view: JarSessionView): JarSessionDto {
  return {
    scenarioKey: view.scenarioKey,
    attemptId: view.attemptId,
    releaseId: view.releaseId,
    revision: view.revision,
    lastSequence: view.lastSequence,
    status: view.status,
    storageMode: view.storageMode,
    createdAt: view.createdAt.toISOString(),
    completedAt: view.completedAt === null ? null : view.completedAt.toISOString(),
    projection: view.projection,
    report: view.report === null ? null : toJarReportDto(view.report),
  }
}
export function fromJarSessionDto(dto: JarSessionDto): JarSessionView {
  if (dto.scenarioKey !== 'jar-test' ||
      dto.releaseId !== JAR_PROFILE.releaseId ||
      dto.projection?.scenarioKey !== 'jar-test' ||
      dto.projection.scenarioReleaseId !== JAR_PROFILE.releaseId ||
      dto.projection.projectionVersion !== JAR_PROJECTION_VERSION ||
      !['in_progress', 'completed', 'stopped'].includes(dto.status) ||
      !['cloud', 'local'].includes(dto.storageMode) ||
      !Number.isSafeInteger(dto.revision) || dto.revision < 0 ||
      !Number.isSafeInteger(dto.lastSequence) || dto.lastSequence < 0) {
    throw new Error('Jar DTO contains an unsupported scenario or release')
  }
  if (dto.status !== 'completed' && dto.report !== null) {
    throw new Error('Jar DTO leaked a report before completion')
  }
  if (dto.status === 'completed' && (dto.report === null || dto.completedAt === null)) {
    throw new Error('Jar DTO omitted the immutable completed report')
  }
  return {
    scenarioKey: 'jar-test',
    attemptId: dto.attemptId,
    releaseId: dto.releaseId,
    revision: dto.revision,
    lastSequence: dto.lastSequence,
    status: dto.status,
    storageMode: dto.storageMode,
    createdAt: parseJarTimestamp(dto.createdAt),
    completedAt: dto.completedAt === null ? null : parseJarTimestamp(dto.completedAt),
    projection: dto.projection,
    report: dto.report === null ? null : fromJarReportDto(dto.report),
  }
}

/** Per-action intent keys: unknown future fields are never silently made public. */
const INTENT_KEYS: Record<string, readonly string[]> = {
  prepare_cup: ['cupId', 'initialPh'],
  measure_initial: [],
  add_coagulant: ['cupId', 'incrementMgL'],
  run_phase: ['phase'],
  measure_final: ['cupId'],
  record_result: ['cupId', 'removalPercent'],
  select_result: ['cupId'],
  completed: [],
}
export function toJarEventDto(record: StoredAttemptEventRecord<JarState>): JarEventDto {
  const source = record.inputPayload as {
    parameters?: Record<string, unknown>
    unitSelections?: Record<string, unknown>
  } | null
  const allowed = INTENT_KEYS[record.actionType] ?? []
  const parameters: JarEventDto['parameters'] = {}
  const unitSelections: JarEventDto['unitSelections'] = {}
  for (const key of allowed) {
    const value = source?.parameters?.[key]
    if (typeof value === 'string' || typeof value === 'boolean' ||
      (typeof value === 'number' && Number.isFinite(value))) {
      parameters[key] = value
    }
    const unit = source?.unitSelections?.[key]
    if (typeof unit === 'string') unitSelections[key] = unit
  }
  const measurement: JarMeasurement | undefined =
    record.actionType === 'measure_initial'
      ? record.stateAfter.initialMeasurement ?? undefined
      : record.actionType === 'measure_final'
        ? Object.values(record.stateAfter.cups).flatMap((cup) => cup?.measurements ?? [])
            .find((entry) => entry.sequence === record.sequence)
        : undefined
  return {
    sequence: record.sequence,
    actionId: record.actionId,
    actionType: record.actionType,
    occurredAt: record.occurredAt.toISOString(),
    parameters,
    unitSelections,
    measurement: measurement?.sequence === record.sequence ? {
      id: measurement.id,
      cupId: measurement.cupId,
      valueNtu: measurement.valid ? measurement.valueNtu : null,
      valid: measurement.valid,
      invalidReason: measurement.invalidReason,
    } : null,
  }
}
