import type { DomainError, UUID } from '@/domain/process/contracts.js'
import type { AttemptSummary, StoredAttemptEventRecord } from '@/application/attempts/repository.js'
import type {
  AcidSessionState,
  ActionFeedback,
  FinalReportSnapshot,
  WriteRefusal,
} from './acid-session.js'

/**
 * Wire format for the session methods that cross the BFF boundary.
 *
 * §9 splits the two storage modes: a guest runs the engine in the browser, an account
 * runs it server-side. The workbench must not be able to tell which one it holds, so
 * both implement `AcidSession` — the remote one by proxying these calls.
 * What crosses is JSON, and JSON has no `Date`. Every `Date` field in these types becomes
 * an ISO-8601 string — currently `FinalReportSnapshot.generatedAt`, the session state's
 * `createdAt`/`completedAt`, `StoredAttemptEventRecord.occurredAt` and the summary's three
 * timestamps. Everything else is already JSON-safe by construction: the domain state and
 * the resource ledger hold only numbers, strings, booleans, nulls, arrays and plain objects.
 *
 * This module is the single place that knows both halves of that mapping, because a
 * codec written twice drifts. The report narrowing is the concrete reason it matters:
 * `narrowReport` requires `generatedAt instanceof Date`, so a report that crossed the
 * wire without being decoded is silently dropped as a foreign schema and the learner
 * loses their finished report.
 *
 * Deliberately NOT a validator. The BFF is same-origin and the values it returns come
 * from this server's own session, so re-parsing them into a schema would add a second
 * definition of every type here with nothing to catch. The one field that genuinely
 * needs a runtime check — `generatedAt` — is checked where it is consumed, by
 * `narrowReport`, which already refuses a malformed snapshot.
/**
 * The same type with every `Date` field spelled as its JSON form.
 *
 * Mapped rather than hand-written `Omit` + override per type, because the hand-written form
 * fails silently: adding a `Date` to `AcidSessionState` leaves it typed as `Date` in the
 * DTO, `...state` spreads a real `Date` through, `JSON.stringify` turns it into a string,
 * and the decoder hands back a string typed as a `Date`. Nothing catches that — not
 * TypeScript, not the tests, not the browser — until something calls `.toISOString()` on it
 * in production.
 *
 * Deriving it means a new `Date` field changes the DTO's type automatically, so the encoder
 * stops compiling at the commit that introduces it and the conversion cannot be forgotten.
 *
 * One level deep on purpose: these types nest no `Date` below a top-level field. A
 * deep-recursive version would silently flatten the optional-property distinctions that
 * `exactOptionalPropertyTypes` exists to keep.
 */
type JsonDates<T> = {
  [K in keyof T]: [T[K]] extends [Date]
    ? string
    : [T[K]] extends [Date | null]
      ? string | null
      : T[K]
}

/** A completed report with its timestamp as an ISO string. */
export type ReportDto = JsonDates<FinalReportSnapshot>

/** Session state as the workbench receives it. */
export type SessionStateDto = JsonDates<
  Omit<AcidSessionState, 'finalReportSnapshot'>
> & {
  finalReportSnapshot: ReportDto | null
}

/** A stored event record with its timestamp as an ISO string. */
export type EventRecordDto = JsonDates<StoredAttemptEventRecord<unknown>>

/** A lab-list summary with its timestamps as ISO strings. */
export type SummaryDto = Omit<
  AttemptSummary,
  'createdAt' | 'updatedAt' | 'completedAt'
> & {
  createdAt: string
  updatedAt: string
  completedAt: string | null
}

/**
 * What the browser sends to commit one action.
 *
 * Exactly the fields §9 lists, and no more. In particular it carries no
 * `resultPayload`, no `stateAfter` and no hash: those are the trusted columns the
 * grants revoke from browser roles
 * (supabase/migrations/20260909000400_grants.sql), because the server recomputes them
 * with the locked release engine. Accepting them here would let a tampered client
 * store invented chemistry as server-verified output.
 *
 * `actionId` IS client-generated, and must stay that way: §12.1 keys idempotency on it,
 * so a request that times out and is retried has to arrive with the same id or the
 * retry writes a second event for one learner action.
 */
export type ApplyRequest = {
  attemptId: UUID
  actionType: string
  actionId: UUID
  expectedRevision: number
  parameters: Record<string, number | string | boolean>
  unitSelections: Record<string, string>
}

/** What the browser sends to undo. Same reasoning as `ApplyRequest`. */
export type UndoRequest = {
  attemptId: UUID
  actionId: UUID
  expectedRevision: number
}

/** What the browser sends to complete. Same reasoning as `ApplyRequest`. */
export type CompleteRequest = {
  attemptId: UUID
  actionId: UUID
  expectedRevision: number
}

/** `apply`/`undo` outcome. `ActionFeedback` and `WriteRefusal` carry no Date. */
export type ActionResultDto =
  | { ok: true; state: SessionStateDto; feedback: ActionFeedback }
  | { ok: false; error: DomainError }
  | WriteRefusal

/** `complete` outcome. */
export type CompleteResultDto =
  | { ok: true; state: SessionStateDto; report: ReportDto }
  | { ok: false; error: DomainError }
  | WriteRefusal

/** `load` outcome: found, a chain that failed verification, or absent from the store. */
export type LoadResultDto =
  | { ok: true; state: SessionStateDto }
  | { ok: false; error: DomainError }
  | { ok: false; outcome: 'not_found' }

// ---------------------------------------------------------------------------
// Encode: session values -> JSON.
// ---------------------------------------------------------------------------

export function toReportDto(report: FinalReportSnapshot): ReportDto {
  return { ...report, generatedAt: report.generatedAt.toISOString() }
}

export function toSessionStateDto(state: AcidSessionState): SessionStateDto {
  return {
    ...state,
    // Not covered by the spread: `...state` would put real `Date` objects into a type that
    // declares strings. TypeScript permits it because the DTO's `createdAt` widens to
    // `string` only in the mapped type, so each one is converted here and re-checked by the
    // decoder below.
    createdAt: state.createdAt.toISOString(),
    completedAt: state.completedAt === null ? null : state.completedAt.toISOString(),
    finalReportSnapshot:
      state.finalReportSnapshot === null ? null : toReportDto(state.finalReportSnapshot),
  }
}

export function toEventRecordDto<State>(
  record: StoredAttemptEventRecord<State>,
): EventRecordDto {
  // `stateAfter` is already JSON-safe; the cast keeps the DTO generic-free, which is
  // what makes it usable as a fetch response type without a type parameter at the
  // call site.
  return {
    ...(record as unknown as Omit<EventRecordDto, 'occurredAt'>),
    occurredAt: record.occurredAt.toISOString(),
  }
}

export function toSummaryDto(summary: AttemptSummary): SummaryDto {
  return {
    ...summary,
    createdAt: summary.createdAt.toISOString(),
    updatedAt: summary.updatedAt.toISOString(),
    completedAt: summary.completedAt === null ? null : summary.completedAt.toISOString(),
  }
}

// ---------------------------------------------------------------------------
// Decode: JSON -> session values.
// ---------------------------------------------------------------------------

/**
 * Rebuild the report's `Date`.
 *
 * An unparseable timestamp yields null rather than an `Invalid Date`: `narrowReport`
 * treats a malformed snapshot as foreign and returns null anyway, and an `Invalid Date`
 * that passes `instanceof Date` would instead survive narrowing and render as
 * "Invalid Date" in the report.
 */
export function fromReportDto(dto: ReportDto): FinalReportSnapshot | null {
  const generatedAt = new Date(dto.generatedAt)
  return Number.isNaN(generatedAt.getTime())
    ? null
    : { ...dto, generatedAt }
}

export function fromSessionStateDto(dto: SessionStateDto): AcidSessionState {
  return {
    ...dto,
    createdAt: new Date(dto.createdAt),
    completedAt: dto.completedAt === null ? null : new Date(dto.completedAt),
    finalReportSnapshot:
      dto.finalReportSnapshot === null ? null : fromReportDto(dto.finalReportSnapshot),
  }
}

export function fromEventRecordDto<State>(dto: EventRecordDto): StoredAttemptEventRecord<State> {
  return {
    ...(dto as unknown as Omit<StoredAttemptEventRecord<State>, 'occurredAt'>),
    occurredAt: new Date(dto.occurredAt),
  }
}

export function fromSummaryDto(dto: SummaryDto): AttemptSummary {
  return {
    ...dto,
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
    completedAt: dto.completedAt === null ? null : new Date(dto.completedAt),
  }
}
