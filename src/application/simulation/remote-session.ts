import type { DomainError, UUID } from '@/domain/process/contracts.js'
import type { AttemptSummary, StoredAttemptEventRecord } from '@/application/attempts/repository.js'
import type { AcidNeutralizationState } from '@/domain/experiments/acid-neutralization/state.js'
import { newUUID } from '@/shared/ids.js'
import type {
  AcidSession,
  AcidSessionState,
  CommitIdentity,
  FinalReportSnapshot,
  SessionActionResult,
  WriteRefusal,
} from './acid-session.js'
import type {
  ActionResultDto,
  CompleteResultDto,
  EventRecordDto,
  LoadResultDto,
  ReportDto,
  SessionStateDto,
  SummaryDto,
} from './wire.js'
import {
  fromEventRecordDto,
  fromReportDto,
  fromSessionStateDto,
  fromSummaryDto,
} from './wire.js'

/**
 * Cloud session: the same `AcidSession` the guest uses, with the chemistry on the server.
 *
 * §9 and §10 split the two storage modes at exactly one place — who runs the engine.
 * A guest runs the locked release engine in the browser (§10); an account runs it
 * server-side (§9), because `result_payload`, `state_after` and the state hashes are
 * trusted columns that browser roles cannot write
 * (supabase/migrations/20260909000400_grants.sql).
 *
 * So this class proxies `AcidSession` over the BFF rather than proxying a repository.
 * That distinction is the whole point: a repository adapter would have to accept
 * engine output from the browser and forward it, which is precisely the write the
 * grants forbid. Proxying the session means the browser sends intent — action type,
 * parameters, units — and receives computed state, and there is no method by which it
 * could supply a result.
 *
 * The workbench holds an `AcidSession` and cannot tell which implementation it has, so
 * guest and account runs render identically and refuse identically.
 *
 * SECURITY: no credentials here. Every method posts to same-origin `/api/simulation/*`;
 * the BFF authenticates the session cookie, resolves ownership and calls the
 * service-role RPCs. A leaked key in this bundle would be useless, since EXECUTE on
 * those RPCs is granted to `service_role` and `veclab_server` only.
 */

type RequestOptions = {
  method: 'GET' | 'POST' | 'DELETE'
  body?: unknown
}

export class RemoteAcidSession implements AcidSession {
  readonly storageMode = 'cloud' as const

  /**
   * Base path of the BFF.
   *
   * Same-origin and relative, so it works behind a preview deployment without
   * configuration and cannot be repointed at another origin by a stray env var.
   */
  private readonly basePath: string

  constructor(basePath = '/api/simulation') {
    this.basePath = basePath
  }

  /**
   * Start a fresh attempt.
   *
   * Takes no parameters because the server owns the scenario: it picks the locked
   * release and computes the initial state and projection itself. A client-supplied
   * initial state would let a learner begin from an arbitrary composition and still
   * receive a report claiming it was the benchmark run.
   */
  async start(): Promise<AcidSessionState> {
    const response = await this.fetch<{ state: SessionStateDto }>('/attempts', {
      method: 'POST',
      body: {},
    })
    return fromSessionStateDto(response.state)
  }

  async load(
    attemptId: UUID,
  ): Promise<
    | { ok: true; state: AcidSessionState }
    | { ok: false; error: DomainError }
    | null
  > {
    const response = await this.fetch<LoadResultDto>(`/attempts/${attemptId}`, {
      method: 'GET',
    })
    if (response.ok) return { ok: true, state: fromSessionStateDto(response.state) }
    // Narrowed on `error`, which exactly one failure variant carries: a compound
    // `'outcome' in response && …` would not narrow, because `outcome` could in
    // principle hold a value other than the one compared.
    if ('error' in response) return { ok: false, error: response.error }
    // What remains is `not_found`: the store saying "not yours, or not there". The
    // session contract reports absence as null, which the workbench already renders as
    // "cannot open" — and which deliberately does not distinguish a guessed UUID from a
    // real one the learner does not own (docs/verification-and-acceptance.md §13.2).
    return null
  }

  async apply(
    attemptId: UUID,
    actionType: string,
    parameters: Record<string, number | string | boolean> = {},
    unitSelections: Record<string, string> = {},
    commit: CommitIdentity = {},
  ): Promise<SessionActionResult> {
    const response = await this.fetch<ActionResultDto>(
      `/attempts/${attemptId}/actions`,
      {
        method: 'POST',
        body: {
          attemptId,
          actionType,
          // Generated here, before the request, so a retry of a timed-out write carries
          // the SAME id and §12.1 replays the stored event instead of appending a second
          // one for a single learner action.
          actionId: commit.actionId ?? newUUID(),
          expectedRevision: commit.expectedRevision ?? null,
          parameters,
          unitSelections,
        },
      },
    )
    return decodeActionResult(response)
  }

  async undo(
    attemptId: UUID,
    commit: CommitIdentity = {},
  ): Promise<SessionActionResult> {
    const response = await this.fetch<ActionResultDto>(`/attempts/${attemptId}/undo`, {
      method: 'POST',
      body: {
        attemptId,
        actionId: commit.actionId ?? newUUID(),
        expectedRevision: commit.expectedRevision ?? null,
      },
    })
    return decodeActionResult(response)
  }

  async complete(
    attemptId: UUID,
    commit: CommitIdentity = {},
  ): Promise<
    | { ok: true; state: AcidSessionState; report: FinalReportSnapshot }
    | { ok: false; error: DomainError }
    | WriteRefusal
  > {
    const response = await this.fetch<CompleteResultDto>(
      `/attempts/${attemptId}/complete`,
      {
        method: 'POST',
        body: {
          attemptId,
          actionId: commit.actionId ?? newUUID(),
          expectedRevision: commit.expectedRevision ?? null,
        },
      },
    )
    if (response.ok) {
      return {
        state: fromSessionStateDto(response.state),
        ok: true,
        report: decodeReport(response.report),
      }
    }
    return response as { ok: false; error: DomainError } | WriteRefusal
  }

  async list(limit?: number): Promise<AttemptSummary[]> {
    const query = new URLSearchParams()
    if (limit !== undefined) query.set('limit', String(limit))
    const suffix = query.toString() === '' ? '' : `?${query.toString()}`
    const response = await this.fetch<{ attempts: SummaryDto[] }>(`/attempts${suffix}`, {
      method: 'GET',
    })
    return response.attempts.map(fromSummaryDto)
  }

  /**
   * Delete one attempt (§4.5).
   *
   * The BFF resolves ownership from the verified session, so there is no user id to send:
   * a body could only ever be ignored, and accepting one would suggest otherwise.
   */
  async remove(attemptId: UUID): Promise<void> {
    await this.fetch<{ deleted: boolean }>(`/attempts/${attemptId}`, { method: 'DELETE' })
  }

  async listEvents(
    attemptId: UUID,
  ): Promise<readonly StoredAttemptEventRecord<AcidNeutralizationState>[]> {
    const response = await this.fetch<{ events: EventRecordDto[] }>(
      `/attempts/${attemptId}/events`,
      { method: 'GET' },
    )
    return response.events.map((dto) => fromEventRecordDto<AcidNeutralizationState>(dto))
  }

  /**
   * One BFF round trip.
   *
   * Throws on transport or server failure rather than returning a refusal. Those are not
   * the store declining an action — they are the store being unreachable — and reporting
   * them as refusals would tell a learner their action was rejected when nothing was ever
   * evaluated. The workbench surfaces a thrown error as a distinct banner.
   */
  private async fetch<Payload>(path: string, options: RequestOptions): Promise<Payload> {
    // Conditional spread rather than passing `headers: undefined` / `body: undefined`:
    // `exactOptionalPropertyTypes` rejects an explicit undefined for an optional
    // property, and omitting the key is what actually means "no body".
    const init: RequestInit = {
      method: options.method,
      // Never cache a per-user read or a write: a cached attempt list would show another
      // learner's data after a sign-in change (§11.2 cache rules).
      cache: 'no-store',
      credentials: 'same-origin',
      ...(options.body === undefined
        ? {}
        : {
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(options.body),
          }),
    }

    const response = await globalThis.fetch(`${this.basePath}${path}`, init)

    if (!response.ok) {
      throw new Error(
        `BFF ${options.method} ${path} failed (${response.status}): ${await safeText(response)}`,
      )
    }

    return (await response.json()) as Payload
  }
}

/**
 * Decode an action result.
 *
 * A successful result carries state with a Date-encoded report, so it needs the codec.
 * The two failure shapes do not: `DomainError` is four JSON-safe fields and every
 * `WriteRefusal` variant is numbers, strings and a nullable number, so they pass through
 * untouched. That is why the refusal branch is a widening rather than a translation —
 * matching the RPC's outcome names in the shared `WriteResult` type is what makes one
 * switch in the workbench handle both storage modes.
 */
function decodeActionResult(dto: ActionResultDto): SessionActionResult {
  if (dto.ok) {
    return {
      ok: true,
      state: fromSessionStateDto(dto.state),
      feedback: dto.feedback,
    }
  }
  return dto as { ok: false; error: DomainError } | WriteRefusal
}

/**
 * Rebuild the report's `generatedAt`.
 *
 * `complete` returns a report the workbench renders immediately, so it must hold a real
 * `Date` like the guest path does. The codec already decodes one and returns null when
 * the timestamp is unparseable — which cannot happen for a report this server encoded
 * with `toISOString()`. Throwing there, rather than substituting an epoch date, keeps a
 * corrupted report from being printed with a fabricated timestamp, and matches `fetch`,
 * which likewise throws on an unusable server response.
 */
function decodeReport(dto: ReportDto): FinalReportSnapshot {
  const report = fromReportDto(dto)
  if (report === null) {
    throw new Error(`BFF returned a report with an unparseable generatedAt: ${dto.generatedAt}`)
  }
  return report
}

/** Read a failed response body without throwing when it has none. */
async function safeText(response: Response): Promise<string> {
  try {
    return (await response.text()).slice(0, 400)
  } catch {
    return ''
  }
}
