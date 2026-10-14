import { createAcidSession, type AcidSetupParams } from '@/application/simulation/acid-session.js'
import { createJarSession } from '@/application/simulation/jar-session.js'
import { SupabaseAttemptRepository } from '@/application/attempts/supabase-repository.js'
import type { AcidNeutralizationState } from '@/domain/experiments/acid-neutralization/state.js'
import type { JarState } from '@/domain/experiments/jar-test/model.js'
import { JAR_PROFILE } from '@/domain/experiments/jar-test/model.js'
import { ACID_RELEASE_ID } from '@/domain/experiments/acid-neutralization/index.js'
import type { UUID } from '@/domain/process/contracts.js'
import { preconditionFailed, unsupportedRelease } from '@/shared/errors/domain-errors.js'
import { toEventRecordDto, toReportDto, toSessionStateDto, toSummaryDto } from '@/application/simulation/wire.js'
import {
  toJarEventDto, toJarReportDto, toJarSessionDto,
} from '@/application/simulation/jar-wire.js'
import type { CommitIdentity } from '@/application/simulation/acid-session.js'
import { requireLearner, type GuardFailure } from '@/app/api/_lib/guard.js'

export type ServerResult<Value> =
  | { ok: true; value: Value; authHeaders: Headers }
  | { ok: false; failure: GuardFailure; authHeaders: Headers }

export type LearnerSession = {
  session: ReturnType<typeof createAcidSession>
  userId: UUID
  authHeaders: Headers
}

/** Authentication is the only source of actor identity; never take it from JSON. */
export async function learnerSession(): Promise<
  { ok: true; value: LearnerSession } |
  { ok: false; failure: GuardFailure; authHeaders: Headers }
> {
  const auth = await requireLearner()
  if (!auth.ok) return { ok: false, failure: auth.failure, authHeaders: auth.authHeaders }
  const repository = new SupabaseAttemptRepository<AcidNeutralizationState>(auth.userId)
  return {
    ok: true,
    value: {
      session: createAcidSession(repository),
      userId: auth.userId,
      authHeaders: auth.authHeaders,
    },
  }
}

async function guarded<Value>(
  run: (session: LearnerSession['session'], userId: UUID) => Promise<Value>,
): Promise<ServerResult<Value>> {
  const opened = await learnerSession()
  if (!opened.ok) {
    return { ok: false, failure: opened.failure, authHeaders: opened.authHeaders }
  }
  const { session, userId, authHeaders } = opened.value
  return { ok: true, value: await run(session, userId), authHeaders }
}

type Scenario = 'acid-neutralization' | 'jar-test'
type Absent = { ok: false; outcome: 'not_found' }
type Unsupported = { ok: false; error: ReturnType<typeof unsupportedRelease> }

/**
 * Ownership-before-dispatch gate: the service-role repository has an immutable
 * verified actor. Never inspect a foreign attempt's scenario, release or events.
 * Absent and foreign IDs return precisely the same not_found body.
 */
async function guardedAttempt<Value>(
  attemptId: UUID,
  run: (scenario: Scenario, session: LearnerSession) => Promise<Value>,
): Promise<ServerResult<Value | Absent | Unsupported>> {
  const opened = await learnerSession()
  if (!opened.ok) {
    return { ok: false, failure: opened.failure, authHeaders: opened.authHeaders }
  }
  const session = opened.value
  const lookup = new SupabaseAttemptRepository<unknown>(session.userId)
  const attempt = await lookup.getAttempt(attemptId)
  if (attempt === null) {
    return { ok: true, value: { ok: false, outcome: 'not_found' }, authHeaders: session.authHeaders }
  }
  let scenario: Scenario
  if (attempt.scenarioKey === 'acid-neutralization' &&
      attempt.scenarioReleaseId === ACID_RELEASE_ID) {
    scenario = 'acid-neutralization'
  } else if (attempt.scenarioKey === 'jar-test' &&
             attempt.scenarioReleaseId === JAR_PROFILE.releaseId) {
    scenario = 'jar-test'
  } else {
    return {
      ok: true,
      value: { ok: false, error: unsupportedRelease(attempt.scenarioReleaseId) },
      authHeaders: session.authHeaders,
    }
  }
  return { ok: true, value: await run(scenario, session), authHeaders: session.authHeaders }
}

function jarSession(userId: UUID) {
  return createJarSession(new SupabaseAttemptRepository<JarState>(userId))
}

/** Old {} / parameterized acid endpoint contract remains byte-for-byte equivalent. */
export function startAttempt(params?: AcidSetupParams) {
  return guarded(async (session) => ({ state: toSessionStateDto(await session.start(params)) }))
}

/** The only new accepted start request is exactly {scenarioKey:'jar-test'}. */
export function startJarAttempt() {
  return guarded(async (_session, userId) => ({
    state: toJarSessionDto(await jarSession(userId).start()),
  }))
}

export function loadAttempt(attemptId: UUID) {
  return guardedAttempt(attemptId, async (scenario, context) => {
    if (scenario === 'jar-test') {
      const loaded = await jarSession(context.userId).load(attemptId)
      if (loaded === null) return { ok: false as const, outcome: 'not_found' as const }
      if (!loaded.ok) return { ok: false as const, error: loaded.error }
      return { ok: true as const, state: toJarSessionDto(loaded.state) }
    }
    const loaded = await context.session.load(attemptId)
    if (loaded === null) return { ok: false as const, outcome: 'not_found' as const }
    if (!loaded.ok) return { ok: false as const, error: loaded.error }
    return { ok: true as const, state: toSessionStateDto(loaded.state) }
  })
}

export function applyAction(
  attemptId: UUID,
  actionType: string,
  parameters: Record<string, number | string | boolean>,
  unitSelections: Record<string, string>,
  commit: CommitIdentity,
) {
  return guardedAttempt(attemptId, async (scenario, context) => {
    if (scenario === 'jar-test') {
      const result = await jarSession(context.userId).apply(
        attemptId, actionType, parameters, unitSelections, commit,
      )
      return result.ok
        ? { ok: true as const, state: toJarSessionDto(result.state), feedback: result.feedback }
        : result
    }
    const result = await context.session.apply(attemptId, actionType, parameters, unitSelections, commit)
    return result.ok
      ? { ok: true as const, state: toSessionStateDto(result.state), feedback: result.feedback }
      : result
  })
}

/** Jar has no undo semantics. A typed refusal must never enter acid undo. */
export function undoAction(attemptId: UUID, commit: CommitIdentity) {
  return guardedAttempt(attemptId, async (scenario, context) => {
    if (scenario === 'jar-test') {
      return {
        ok: false as const,
        error: preconditionFailed('JAR_UNDO_UNSUPPORTED', 'errors.jar.JAR_UNDO_UNSUPPORTED'),
      }
    }
    const result = await context.session.undo(attemptId, commit)
    return result.ok
      ? { ok: true as const, state: toSessionStateDto(result.state), feedback: result.feedback }
      : result
  })
}

export function completeAttempt(attemptId: UUID, commit: CommitIdentity) {
  return guardedAttempt(attemptId, async (scenario, context) => {
    if (scenario === 'jar-test') {
      const result = await jarSession(context.userId).complete(attemptId, commit)
      return result.ok ? {
        ok: true as const,
        state: toJarSessionDto(result.state),
        report: toJarReportDto(result.report),
        idempotentReplay: result.idempotentReplay,
      } : result
    }
    const result = await context.session.complete(attemptId, commit)
    return result.ok
      ? { ok: true as const, state: toSessionStateDto(result.state), report: toReportDto(result.report) }
      : result
  })
}

/** This is the existing acid lab list, not a new cross-scenario Jar catalog. */
export function listAttempts(limit?: number) {
  return guarded(async (_session, userId) => ({
    attempts: (await new SupabaseAttemptRepository<AcidNeutralizationState>(userId).listAttempts({
      scenarioKey: 'acid-neutralization',
      ...(limit === undefined ? {} : { limit }),
    })).map(toSummaryDto),
  }))
}

/** Jar events are explicit learner-safe DTOs; never spread persisted records. */
export function listEvents(attemptId: UUID) {
  return guardedAttempt(attemptId, async (scenario, context) => {
    if (scenario === 'jar-test') {
      const records = await new SupabaseAttemptRepository<JarState>(context.userId)
        .getAttemptEventRecords(attemptId)
      return { events: records.map(toJarEventDto) }
    }
    return { events: (await context.session.listEvents(attemptId)).map(toEventRecordDto) }
  })
}

/**
 * Deletion remains idempotent for acid and Jar. Ownership is still checked
 * before selecting a release, while absent and foreign IDs share the previous
 * acid contract: {deleted:true} without revealing existence.
 */
export function removeAttempt(attemptId: UUID) {
  return guarded(async (_session, userId) => {
    const repository = new SupabaseAttemptRepository<unknown>(userId)
    const attempt = await repository.getAttempt(attemptId)
    if (attempt === null) return { deleted: true }
    const supported =
      (attempt.scenarioKey === 'acid-neutralization' &&
        attempt.scenarioReleaseId === ACID_RELEASE_ID) ||
      (attempt.scenarioKey === 'jar-test' &&
        attempt.scenarioReleaseId === JAR_PROFILE.releaseId)
    if (!supported) return { ok: false as const, error: unsupportedRelease(attempt.scenarioReleaseId) }
    await repository.deleteAttempt(attemptId)
    return { deleted: true }
  })
}
