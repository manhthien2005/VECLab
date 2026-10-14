import { describe, expect, it } from 'vitest'
import { newUUID } from '@/shared/ids.js'
import { JAR_PROFILE } from '@/domain/experiments/jar-test/model.js'
import type { JarSessionDto, JarReportDto, JarEventDto } from '@/application/simulation/jar-wire.js'
import type { JarActionFeedback } from '@/application/simulation/jar-session.js'

/**
 * Opt-in end-to-end HTTP+BFF+local Supabase test.
 *
 * This is NOT a mock and does not silently redirect to a hosted project.
 * TL1 supplies two authenticated local learner Cookie headers and starts the
 * Next app + local Supabase. Never print credentials in assertion messages.
 *
 * RUN_JAR_CLOUD_HTTP_TESTS=1
 * JAR_CLOUD_APP_URL=http://127.0.0.1:3000
 * JAR_CLOUD_SUPABASE_URL=http://127.0.0.1:54321
 * JAR_CLOUD_LEARNER_A_COOKIE=<local-cookie>
 * JAR_CLOUD_LEARNER_B_COOKIE=<other-local-cookie>
 */
const enabled = process.env.RUN_JAR_CLOUD_HTTP_TESTS === '1'
const appUrl = process.env.JAR_CLOUD_APP_URL ?? ''
const supabaseUrl = process.env.JAR_CLOUD_SUPABASE_URL ?? ''
const cookieA = process.env.JAR_CLOUD_LEARNER_A_COOKIE ?? ''
const cookieB = process.env.JAR_CLOUD_LEARNER_B_COOKIE ?? ''

function loopback(raw: string): URL {
  const parsed = new URL(raw)
  if (parsed.protocol !== 'http:' ||
      !['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname) ||
      parsed.username || parsed.password) {
    throw new Error('Jar cloud tests must use loopback HTTP app and Supabase')
  }
  return parsed
}
if (enabled) {
  // Fail closed before making ANY request or using any credential.
  loopback(appUrl)
  loopback(supabaseUrl)
  if (!cookieA || !cookieB || cookieA === cookieB) {
    throw new Error('Jar cloud tests require two distinct local learner cookie values')
  }
}

type BffPayload = {
  ok: boolean
  outcome: string
  state: JarSessionDto
  report: JarReportDto
  feedback: JarActionFeedback
  events: JarEventDto[]
  idempotentReplay: boolean
}
const path = '/api/simulation/attempts'
async function call(
  cookie: string, method: 'GET' | 'POST' | 'DELETE', suffix: string, body?: unknown,
) {
  const target = new URL(path + suffix, appUrl)
  const response = await fetch(target, {
    method,
    cache: 'no-store',
    headers: {
      Cookie: cookie,
      Origin: new URL(appUrl).origin,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
  return { status: response.status, data: await response.json() as BffPayload }
}
function action(cookie: string, id: string, actionType: string,
  parameters: Record<string, string | number | boolean> = {},
  actionId: string = newUUID(), expectedRevision: number | null = null) {
  return call(cookie, 'POST', `/${id}/actions`, {
    attemptId: id, actionId, expectedRevision, actionType, parameters, unitSelections: {},
  })
}
const round = (value: number | null) => value === null ? null : Math.round(value * 100000000) / 100000000

describe.runIf(enabled)('Jar cloud local HTTP + real Supabase (two learners)', () => {
  it('runs one immutable attempt with owner isolation, retry, and hidden outcomes', async () => {
    let id = ''
    try {
      const started = await call(cookieA, 'POST', '', { scenarioKey: 'jar-test' })
      expect(started.status).toBe(200)
      expect(started.data.state.releaseId).toBe(JAR_PROFILE.releaseId)
      id = started.data.state.attemptId as string
      expect(started.data.state.report).toBeNull()
      expect(JSON.stringify(started.data.state)).not.toMatch(/stateAfterHash|currentState|sourceDoi/)

      const unknown = newUUID()
      for (const suffix of [`/${id}`, `/${id}/events`]) {
        const foreign = await call(cookieB, 'GET', suffix)
        const absent = await call(cookieB, 'GET', suffix.replace(id, unknown))
        expect(foreign).toEqual(absent)
        expect(foreign.data).toEqual({ ok: false, outcome: 'not_found' })
      }

      expect((await action(cookieA, id, 'prepare_cup', { cupId: 'A', initialPh: 9 })).data.ok).toBe(true)
      expect((await action(cookieA, id, 'measure_initial')).data.ok).toBe(true)
      const doseId = newUUID()
      const dose = await action(cookieA, id, 'add_coagulant', {
        cupId: 'A', incrementMgL: 150,
      }, doseId, 2)
      expect(dose.data.ok).toBe(true)
      const retry = await action(cookieA, id, 'add_coagulant', {
        cupId: 'A', incrementMgL: 150,
      }, doseId, 2)
      expect(retry.data.feedback.idempotentReplay).toBe(true)
      expect(retry.data.state.projection.cups[0].doseMgL).toBe(150)
      expect((await action(cookieA, id, 'add_coagulant', {
        cupId: 'A', incrementMgL: 50,
      }, doseId, 2)).data.outcome).toBe('idempotency_conflict')
      expect((await action(cookieA, id, 'measure_final', { cupId: 'A' }, newUUID(), 1))
        .data.outcome).toBe('revision_conflict')

      for (const phase of ['rapid', 'slow', 'settling']) {
        expect((await action(cookieA, id, 'run_phase', { phase })).data.ok).toBe(true)
      }
      const measured = await action(cookieA, id, 'measure_final', { cupId: 'A' })
      expect(round(measured.data.state.projection.cups[0].measurements[0].valueNtu)).toBe(16.5125)
      expect(measured.data.state.projection.cups[0].measuredRemovalPercent).toBeNull()
      expect((await action(cookieA, id, 'record_result', { cupId: 'A', removalPercent: 86.79 }))
        .data.state.projection.cups[0].measuredRemovalPercent).toBeNull()
      expect((await action(cookieA, id, 'select_result', { cupId: 'A' })).data.ok).toBe(true)
      const history = await call(cookieA, 'GET', `/${id}/events`)
      expect(history.status).toBe(200)
      expect(JSON.stringify(history.data.events)).not.toMatch(
        /stateAfter|stateBeforeHash|requestFingerprint|calculationTrace|resourceDelta|predicted|reference|score|diagnostics/,
      )

      const completeId = newUUID()
      const request = { attemptId: id, actionId: completeId, expectedRevision: null }
      const finished = await call(cookieA, 'POST', `/${id}/complete`, request)
      expect(finished.data.ok).toBe(true)
      expect(finished.data.report.cups[0]?.measuredRemovalPercent).toBeCloseTo(86.79, 8)
      const completedAgain = await call(cookieA, 'POST', `/${id}/complete`, request)
      expect(completedAgain.data.idempotentReplay).toBe(true)
      expect(completedAgain.data.report).toEqual(finished.data.report)
      const reopened = await call(cookieA, 'GET', `/${id}`)
      expect(reopened.data.state.status).toBe('completed')
      expect(reopened.data.state.report).toEqual(finished.data.report)
      expect(reopened.data.state.projection.cups[0].doseMgL).toBe(150)
      expect(reopened.data.state.report?.resources.reagents.alum?.amount).toBeCloseTo(0.075, 12)
    } finally {
      if (id) await call(cookieA, 'DELETE', `/${id}`, {})
    }
  })
})
