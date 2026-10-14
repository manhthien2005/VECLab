import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import type { UUID } from '@/domain/process/contracts.js'
import { newUUID } from '@/shared/ids.js'
import { GuestAttemptRepository } from '@/application/attempts/guest-repository.js'
import type { JarState } from '@/domain/experiments/jar-test/model.js'
import { JAR_PROFILE } from '@/domain/experiments/jar-test/model.js'
import {
  fromJarReportDto, fromJarSessionDto, toJarEventDto, toJarReportDto, toJarSessionDto,
} from '@/application/simulation/jar-wire.js'
import { RemoteJarSession } from '@/application/simulation/remote-jar-session.js'
import { createJarSession } from '@/application/simulation/jar-session.js'
import { fromSessionStateDto } from '@/application/simulation/wire.js'
import { parseBody, startAttemptSchema } from '@/app/api/simulation/schemas.js'
import { POST as createRoute, GET as listRoute } from '@/app/api/simulation/attempts/route.js'
import {
  GET as loadRoute, DELETE as deleteRoute,
} from '@/app/api/simulation/attempts/[attemptId]/route.js'
import { POST as actionRoute } from '@/app/api/simulation/attempts/[attemptId]/actions/route.js'
import { POST as completeRoute } from '@/app/api/simulation/attempts/[attemptId]/complete/route.js'
import { GET as eventsRoute } from '@/app/api/simulation/attempts/[attemptId]/events/route.js'
import { POST as undoRoute } from '@/app/api/simulation/attempts/[attemptId]/undo/route.js'

const actors = vi.hoisted(() => ({
  current: '11111111-1111-4111-8111-111111111111' as string | null,
  owners: new Map<string, string>(),
}))
const ALICE = '11111111-1111-4111-8111-111111111111'
const BOB = '22222222-2222-4222-8222-222222222222'

vi.mock('@/app/api/_lib/guard.js', async (importOriginal) => {
  const real = await importOriginal<typeof import('@/app/api/_lib/guard.js')>()
  return {
    ...real,
    requireLearner: async () => actors.current === null
      ? {
          ok: false as const,
          failure: { status: 401 as const, body: { error: 'unauthorized' } },
          authHeaders: new Headers(),
        }
      : {
          ok: true as const,
          userId: actors.current as UUID,
          authHeaders: new Headers(),
        },
  }
})

/** Only a mock of storage/auth; BFF handlers and Jar session execute for real. */
vi.mock('@/application/attempts/supabase-repository.js', async () => {
  const { GuestAttemptRepository: IndexedDb } =
    await import('@/application/attempts/guest-repository.js')
  return {
    SupabaseAttemptRepository: class<State> {
      readonly storageMode = 'cloud' as const
      private readonly store = new IndexedDb<State>()
      constructor(private readonly user: UUID) {}
      async getAttempt(id: UUID) {
        if (actors.owners.get(id) !== this.user) return null
        return this.store.getAttempt(id)
      }
      async createAttempt(input: import('@/application/attempts/repository.js').CreateAttemptInput<State>) {
        const row = await this.store.createAttempt(input)
        actors.owners.set(row.attemptId, this.user)
        return row
      }
      async appendAction(input: import('@/application/attempts/repository.js').AppendActionInput<State>) {
        if (actors.owners.get(input.attemptId) !== this.user) {
          return { ok: false as const, outcome: 'not_found' as const }
        }
        return this.store.appendAction(input)
      }
      async completeAttempt(input: import('@/application/attempts/repository.js').CompleteAttemptInput<State>) {
        if (actors.owners.get(input.attemptId) !== this.user) {
          return { ok: false as const, outcome: 'not_found' as const }
        }
        return this.store.completeAttempt(input)
      }
      async getAttemptEvents(id: UUID) {
        return actors.owners.get(id) === this.user ? this.store.getAttemptEvents(id) : []
      }
      async getAttemptEventRecords(id: UUID) {
        return actors.owners.get(id) === this.user ? this.store.getAttemptEventRecords(id) : []
      }
      async listAttempts(filter: import('@/application/attempts/repository.js').AttemptFilter) {
        return (await this.store.listAttempts(filter))
          .filter((row) => actors.owners.get(row.attemptId) === this.user)
      }
      async deleteAttempt(id: UUID) {
        if (actors.owners.get(id) !== this.user) return
        await this.store.deleteAttempt(id)
        actors.owners.delete(id)
      }
    },
  }
})

function req(method: string, url: string, body?: unknown) {
  return new NextRequest(`http://localhost:3000${url}`, {
    method,
    ...(body === undefined ? {} : {
      body: JSON.stringify(body),
      headers: { origin: 'http://localhost:3000', 'content-type': 'application/json' },
    }),
  })
}
const route = (id: string) => ({ params: Promise.resolve({ attemptId: id }) })
const root = '/api/simulation/attempts'

async function act(id: UUID, actionType: string, parameters: Record<string, string | number | boolean>,
  actionId: UUID = newUUID(), expectedRevision: number | null = null) {
  const response = await actionRoute(req('POST', `${root}/${id}/actions`, {
    attemptId: id, actionType, actionId, expectedRevision, parameters, unitSelections: {},
  }), route(id))
  expect(response.status).toBe(200)
  return await response.json()
}

describe('Jar BFF scenario dispatch and learner boundaries (storage mocked via IndexedDB)', () => {
  beforeEach(async () => {
    actors.current = ALICE
    for (const row of await new GuestAttemptRepository<unknown>().listAttempts({})) {
      await new GuestAttemptRepository<unknown>().deleteAttempt(row.attemptId)
    }
    actors.owners.clear()
  })
  afterEach(() => { actors.current = ALICE })

  it('allows exactly Jar start while preserving acid start and rejecting injection', async () => {
    expect(parseBody(startAttemptSchema, { scenarioKey: 'jar-test' }).ok).toBe(true)
    for (const body of [
      { scenarioKey: 'jar-test', scenarioReleaseId: JAR_PROFILE.releaseId },
      { scenarioKey: 'jar-test', userId: ALICE },
      { scenarioKey: 'jar-test', acidVolumeL: 0.025, acidConcentrationMolL: 0.01 },
      { scenarioKey: 'jar-test', stateAfter: {} },
      { scenarioKey: 'jar-test', hash: 'fake' },
      { scenarioKey: 'jar-test', report: {} },
      { scenarioKey: 'jar-test', score: 100 },
      { scenarioKey: 'jar-test', resourceDelta: {} },
      { scenarioKey: 'jar-test', unexpected: true },
      { scenarioKey: 'copper-precipitation' },
      { scenarioReleaseId: JAR_PROFILE.releaseId },
    ]) {
      expect(parseBody(startAttemptSchema, body).ok, JSON.stringify(body)).toBe(false)
      expect((await createRoute(req('POST', root, body))).status).toBe(400)
    }
    const jar = await createRoute(req('POST', root, { scenarioKey: 'jar-test' }))
    expect(jar.status).toBe(200)
    const data = await jar.json()
    expect(data.state.scenarioKey).toBe('jar-test')
    expect(data.state.releaseId).toBe(JAR_PROFILE.releaseId)
    expect(data.state.report).toBeNull()
    expect(JSON.stringify(data.state)).not.toContain('currentState')

    const acid = await createRoute(req('POST', root, {}))
    expect(acid.status).toBe(200)
    const acidJson = await acid.json()
    expect(acidJson.state.releaseId).toBe('acid-neutralization@1.0.0')
    const list = await listRoute(req('GET', root))
    const listed = await list.json()
    expect(listed.attempts.map((entry: { attemptId: UUID }) => entry.attemptId))
      .toContain(acidJson.state.attemptId)
    expect(listed.attempts.map((entry: { attemptId: UUID }) => entry.attemptId))
      .not.toContain(data.state.attemptId)
  })

  it('returns identical outcomes for another learner and an absent ID on every endpoint', async () => {
    const started = await (await createRoute(req('POST', root, { scenarioKey: 'jar-test' }))).json()
    const id = started.state.attemptId as UUID
    const absent = newUUID()
    const outcomes = async (attemptId: UUID) => {
      const ctx = route(attemptId)
      return Promise.all([
        loadRoute(req('GET', `${root}/${attemptId}`), ctx),
        eventsRoute(req('GET', `${root}/${attemptId}/events`), ctx),
        actionRoute(req('POST', `${root}/${attemptId}/actions`, {
          attemptId, actionId: newUUID(), expectedRevision: null,
          actionType: 'measure_initial', parameters: {}, unitSelections: {},
        }), ctx),
        completeRoute(req('POST', `${root}/${attemptId}/complete`, {
          attemptId, actionId: newUUID(), expectedRevision: null,
        }), ctx),
        undoRoute(req('POST', `${root}/${attemptId}/undo`, {
          attemptId, actionId: newUUID(), expectedRevision: null,
        }), ctx),
      ]).then(async (results) => Promise.all(results.map(async (response) => ({
        status: response.status, body: await response.json(),
      }))))
    }
    actors.current = BOB
    const foreign = await outcomes(id)
    const missing = await outcomes(absent)
    expect(foreign).toEqual(missing)
    for (const item of foreign) expect(item).toEqual({
      status: 200, body: { ok: false, outcome: 'not_found' },
    })
    const foreignDelete = await deleteRoute(req('DELETE', `${root}/${id}`, {}), route(id))
    const absentDelete = await deleteRoute(req('DELETE', `${root}/${absent}`, {}), route(absent))
    expect(foreignDelete.status).toBe(200)
    expect(await foreignDelete.json()).toEqual(await absentDelete.json())
    actors.current = null
    const unauthorized = await loadRoute(req('GET', `${root}/${id}`), route(id))
    expect(unauthorized.status).toBe(401)
    actors.current = ALICE
    const owned = await loadRoute(req('GET', `${root}/${id}`), route(id))
    expect(owned.status).toBe(200)
    expect((await owned.json()).state.attemptId).toBe(id)
  })

  it('commits Jar intent once and returns only learner-safe events, report and retries', async () => {
    const started = await (await createRoute(req('POST', root, { scenarioKey: 'jar-test' }))).json()
    const id = started.state.attemptId as UUID
    await act(id, 'prepare_cup', { cupId: 'A', initialPh: 9 })
    await act(id, 'measure_initial', {})
    const doseId = newUUID()
    const dose = await act(id, 'add_coagulant', { cupId: 'A', incrementMgL: 150 }, doseId, 2)
    expect(dose.ok).toBe(true)
    const retry = await act(id, 'add_coagulant', { cupId: 'A', incrementMgL: 150 }, doseId, 2)
    expect(retry.ok).toBe(true)
    expect(retry.feedback.idempotentReplay).toBe(true)
    expect(retry.state.projection.cups[0].doseMgL).toBe(150)
    expect((await act(id, 'add_coagulant', { cupId: 'A', incrementMgL: 50 }, doseId)).outcome)
      .toBe('idempotency_conflict')
    expect((await act(id, 'measure_final', { cupId: 'A' }, newUUID(), 0)).outcome)
      .toBe('revision_conflict')

    for (const phase of ['rapid', 'slow', 'settling']) {
      expect((await act(id, 'run_phase', { phase })).ok).toBe(true)
    }
    const measured = await act(id, 'measure_final', { cupId: 'A' })
    expect(measured.state.projection.cups[0].measurements[0].valueNtu).toBeCloseTo(16.5125, 8)
    expect(measured.state.projection.cups[0].measuredRemovalPercent).toBeNull()
    const events = await eventsRoute(req('GET', `${root}/${id}/events`), route(id))
    const eventDto = await events.json()
    expect(eventDto.events.some((event: { measurement: { valueNtu: number } | null }) =>
      Math.abs((event.measurement?.valueNtu ?? Number.NaN) - 16.5125) < 1e-8)).toBe(true)
    for (const event of eventDto.events) {
      expect(Object.keys(event).sort()).toEqual([
        'actionId', 'actionType', 'measurement', 'occurredAt',
        'parameters', 'sequence', 'unitSelections',
      ].sort())
      expect(JSON.stringify(event)).not.toMatch(/stateAfter|stateBeforeHash|requestFingerprint|calculationTrace|resourceDelta|predicted|reference|diagnostics|score/)
    }
    const recorded = await act(id, 'record_result', { cupId: 'A', removalPercent: 86.79 })
    expect(recorded.state.projection.cups[0].measuredRemovalPercent).toBeNull()
    await act(id, 'select_result', { cupId: 'A' })
    const completionId = newUUID()
    const completeBody = { attemptId: id, actionId: completionId, expectedRevision: null }
    const finish = await completeRoute(req('POST', `${root}/${id}/complete`, completeBody), route(id))
    const finished = await finish.json()
    expect(finished.ok).toBe(true)
    expect(finished.state.status).toBe('completed')
    expect(finished.report.cups[0].measuredRemovalPercent).toBeCloseTo(86.79, 8)
    const replay = await (await completeRoute(
      req('POST', `${root}/${id}/complete`, completeBody), route(id),
    )).json()
    expect(replay.idempotentReplay).toBe(true)
    expect(replay.report).toEqual(finished.report)
    const undo = await (await undoRoute(req('POST', `${root}/${id}/undo`, {
      attemptId: id, actionId: newUUID(), expectedRevision: null,
    }), route(id))).json()
    expect(undo).toMatchObject({ ok: false, error: { code: 'JAR_UNDO_UNSUPPORTED' } })
  })
})

describe('Jar wire/remote codec and explicit release boundaries', () => {
  const originalFetch = globalThis.fetch
  afterEach(() => { globalThis.fetch = originalFetch; vi.restoreAllMocks() })

  it('round trips dates and refuses foreign scenario and broken timestamps', async () => {
    const guest = createJarSession(new GuestAttemptRepository<JarState>())
    const initial = await guest.start()
    const dto = toJarSessionDto(initial)
    expect(fromJarSessionDto(dto).createdAt).toBeInstanceOf(Date)
    expect(() => fromJarSessionDto({ ...dto, createdAt: 'garbage' })).toThrow()
    expect(() => fromJarSessionDto({
      ...dto, scenarioKey: 'acid-neutralization' as never,
    })).toThrow()
    expect(() => fromJarSessionDto({ ...dto, releaseId: 'jar-test@999' })).toThrow()
    expect(() => fromSessionStateDto(dto as never)).toThrow()
    expect(() => fromJarSessionDto({ ...dto, completedAt: 'not-a-date' })).toThrow()
  })

  it('round trips completed report and allowlists persisted event intent', async () => {
    const store = new GuestAttemptRepository<JarState>()
    const guest = createJarSession(store)
    const initial = await guest.start()
    const prepared = await guest.apply(initial.attemptId, 'prepare_cup',
      { cupId: 'A', initialPh: 9 })
    if (!prepared.ok) throw new Error('prepare refused')
    const measured = await guest.apply(initial.attemptId, 'measure_initial')
    if (!measured.ok) throw new Error('measurement refused')
    const completed = await guest.complete(initial.attemptId)
    if (!completed.ok) throw new Error('complete refused')
    const dto = toJarSessionDto(completed.state)
    const decoded = fromJarSessionDto(dto)
    expect(decoded.report?.generatedAt).toBeInstanceOf(Date)
    const report = fromJarReportDto(toJarReportDto(completed.report))
    expect(report.generatedAt.getTime()).toBe(completed.report.generatedAt.getTime())
    expect(() => fromJarReportDto({
      ...toJarReportDto(completed.report), generatedAt: 'broken',
    })).toThrow()
    const rows = await store.getAttemptEventRecords(initial.attemptId)
    const events = rows.map(toJarEventDto)
    expect(events.some((event) => event.actionType === 'measure_initial' &&
      event.measurement?.valueNtu === 125)).toBe(true)
    for (const event of events) {
      expect(Object.keys(event).sort()).toEqual([
        'actionId', 'actionType', 'measurement', 'occurredAt',
        'parameters', 'sequence', 'unitSelections',
      ].sort())
      expect(JSON.stringify(event)).not.toMatch(
        /stateAfter|stateBeforeHash|requestFingerprint|resourceDelta|predicted|score/,
      )
    }
  })

  it('RemoteJarSession only sends intent and preserves actionId/revision', async () => {
    const guest = createJarSession(new GuestAttemptRepository<JarState>())
    const initial = await guest.start()
    const dto = toJarSessionDto({ ...initial, storageMode: 'cloud' })
    const requests: Array<{ path: string; body: unknown }> = []
    globalThis.fetch = vi.fn().mockImplementation(async (url: string, init: RequestInit) => {
      requests.push({ path: url, body: init.body ? JSON.parse(init.body as string) : null })
      return { ok: true, json: async () => ({
        state: dto, ok: true, feedback: {
          actionType: 'prepare_cup', sequence: 1, idempotentReplay: true,
        },
      }) }
    })
    const remote = new RemoteJarSession()
    expect((await remote.start()).releaseId).toBe(JAR_PROFILE.releaseId)
    const actionId = newUUID()
    const result = await remote.apply(initial.attemptId, 'prepare_cup',
      { cupId: 'A', initialPh: 7 }, {}, { actionId, expectedRevision: 0 })
    expect(result.ok).toBe(true)
    expect(requests[0]?.body).toEqual({ scenarioKey: 'jar-test' })
    expect(requests[1]?.body).toEqual({
      attemptId: initial.attemptId,
      actionId, expectedRevision: 0,
      actionType: 'prepare_cup', parameters: { cupId: 'A', initialPh: 7 }, unitSelections: {},
    })
    expect(JSON.stringify(requests)).not.toContain('stateAfter')
  })
})
