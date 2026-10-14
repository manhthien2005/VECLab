import type { DomainError, SimulationAction, UUID } from '@/domain/process/contracts.js'
import { newUUID } from '@/shared/ids.js'
import type {
  JarActionResult, JarCommitIdentity, JarCompletionResult,
  JarSession, JarSessionView,
} from './jar-session.js'
import type {
  JarActionResultDto, JarCompletionResultDto, JarLoadResultDto, JarSessionDto,
} from './jar-wire.js'
import {
  fromJarReportDto, fromJarSessionDto,
} from './jar-wire.js'

/** Cloud Jar computes no domain output on the client: only intent crosses the BFF. */
export class RemoteJarSession implements JarSession {
  readonly storageMode = 'cloud' as const

  constructor(private readonly basePath = '/api/simulation') {}

  async start(): Promise<JarSessionView> {
    const dto = await this.request<{ state: JarSessionDto }>('/attempts', 'POST',
      { scenarioKey: 'jar-test' })
    return fromJarSessionDto(dto.state)
  }

  async load(attemptId: UUID): Promise<
    { ok: true; state: JarSessionView } | { ok: false; error: DomainError } | null
  > {
    const dto = await this.request<JarLoadResultDto>(`/attempts/${attemptId}`, 'GET')
    if (dto.ok) return { ok: true, state: fromJarSessionDto(dto.state) }
    if ('error' in dto) return { ok: false, error: dto.error }
    return null
  }

  async apply(
    attemptId: UUID,
    actionType: string,
    parameters: SimulationAction['parameters'] = {},
    unitSelections: SimulationAction['unitSelections'] = {},
    commit: JarCommitIdentity = {},
  ): Promise<JarActionResult> {
    const dto = await this.request<JarActionResultDto>(
      `/attempts/${attemptId}/actions`, 'POST', {
        attemptId,
        actionType,
        parameters,
        unitSelections,
        actionId: commit.actionId ?? newUUID(),
        expectedRevision: commit.expectedRevision ?? null,
      },
    )
    return dto.ok
      ? { ok: true, state: fromJarSessionDto(dto.state), feedback: dto.feedback }
      : dto
  }

  async complete(attemptId: UUID, commit: JarCommitIdentity = {}): Promise<JarCompletionResult> {
    const dto = await this.request<JarCompletionResultDto>(
      `/attempts/${attemptId}/complete`, 'POST', {
        attemptId,
        actionId: commit.actionId ?? newUUID(),
        expectedRevision: commit.expectedRevision ?? null,
      },
    )
    if (!dto.ok) return dto
    const state = fromJarSessionDto(dto.state)
    const report = fromJarReportDto(dto.report)
    if (state.report === null ||
        state.report.generatedAt.getTime() !== report.generatedAt.getTime()) {
      throw new Error('Jar BFF completion returned inconsistent report')
    }
    return { ok: true, state, report, idempotentReplay: dto.idempotentReplay }
  }

  private async request<T>(
    path: string, method: 'GET' | 'POST', body?: unknown,
  ): Promise<T> {
    const response = await globalThis.fetch(`${this.basePath}${path}`, {
      method,
      credentials: 'same-origin',
      cache: 'no-store',
      ...(body === undefined ? {} : {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    })
    if (!response.ok) {
      // A transport/guard failure is not a declined chemistry action.
      throw new Error(`Jar BFF ${method} ${path} failed (${response.status})`)
    }
    return await response.json() as T
  }
}
