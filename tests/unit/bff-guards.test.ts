import { describe, expect, it } from 'vitest'
import {
  applyActionSchema,
  completeActionSchema,
  parseBody,
  startAttemptSchema,
  toCommitIdentity,
  undoActionSchema,
} from '@/app/api/simulation/schemas.js'
import {
  assertSameOrigin,
  readJson,
  MAX_ACTION_BODY_BYTES,
} from '@/app/api/_lib/guard.js'

/**
 * BFF boundary guards (docs/system-architecture.md §9, §17).
 *
 * These are the checks that stand between an untrusted client and the trusted columns.
 * Each test below asserts a claim the implementation's comments make, because a guard
 * whose behaviour is only documented is a guard that can be silently weakened by a
 * well-meaning edit — removing one `.strict()` or one `encode()` would still typecheck,
 * still lint, and still pass every other test in the suite.
 */

const ATTEMPT_ID = '2f0a1c3e-5b7d-4e9f-8a1b-2c3d4e5f6a7b'
const ACTION_ID = '7c4b9a1e-2d6f-4b8a-9c3e-5f7a1b2d4e6f'

/** A body that is valid on every field §9 allows. */
function validActionBody() {
  return {
    attemptId: ATTEMPT_ID,
    actionId: ACTION_ID,
    expectedRevision: 3,
    actionType: 'add_base',
    parameters: { volume: 0.5 },
    unitSelections: { volume: 'mL' },
  }
}

describe('request schemas', () => {
  it('accepts exactly the fields §9 lets a client send', () => {
    const parsed = parseBody(applyActionSchema, validActionBody())

    expect(parsed.ok).toBe(true)
    if (!parsed.ok) throw new Error('a valid body was rejected')
    expect(parsed.value.actionType).toBe('add_base')
    expect(parsed.value.parameters).toEqual({ volume: 0.5 })
    expect(parsed.value.unitSelections).toEqual({ volume: 'mL' })
  })

  it('rejects a body that smuggles server-computed output', () => {
    // The point of `.strict()`. Each of these is a trusted column: written only by the
    // server's own engine through RPC columns revoked from browser roles. If any were
    // parsed away silently, a handler added later could read it and the client would be
    // supplying chemistry the report vouches for.
    const trusted = [
      'resultPayload',
      'stateAfter',
      'stateAfterHash',
      'stateBeforeHash',
      'resourceDelta',
      'calculationTrace',
      'requestFingerprint',
      'scenarioReleaseId',
    ] as const

    for (const field of trusted) {
      const parsed = parseBody(applyActionSchema, { ...validActionBody(), [field]: 'invented' })
      expect(parsed.ok, `${field} was accepted`).toBe(false)
    }
  })

  it('rejects a start body that tries to choose the scenario', () => {
    // §17: scenario config comes only from build or the internal registry, never from a
    // user payload. A client that believes it can pick the release must be refused rather
    // than ignored, or the belief stays in the code that sent it.
    for (const body of [
      { scenarioKey: 'copper-precipitation' },
      { scenarioReleaseId: 'acid-neutralization@2.0.0' },
      { initialState: { pH: 1 } },
    ]) {
      expect(parseBody(startAttemptSchema, body).ok).toBe(false)
    }
    // An empty body is the only valid one.
    expect(parseBody(startAttemptSchema, {}).ok).toBe(true)
  })

  it('rejects a malformed id, revision, action type and parameter value', () => {
    const cases = [
      { attemptId: 'not-a-uuid' },
      { actionId: ATTEMPT_ID.replace('-', '') },
      { expectedRevision: -1 },
      { expectedRevision: 1.5 },
      { expectedRevision: '3' },
      { actionType: '' },
      { actionType: 7 },
      // A nested object where a scalar is expected: the engine declares parameter
      // quantities as numbers, so this cannot be validated by it and must stop here.
      { parameters: { volume: { $gt: 0 } } },
      // A numeric unit is a malformed body, not an unknown unit; accepting it would
      // report "unknown unit" and send a learner to look at their own input.
      { unitSelections: { volume: 5 } },
    ] as const

    for (const patch of cases) {
      const parsed = parseBody(applyActionSchema, { ...validActionBody(), ...patch })
      expect(parsed.ok, `${JSON.stringify(patch)} was accepted`).toBe(false)
    }
  })

  it('names the offending field so a broken client is diagnosable', () => {
    const parsed = parseBody(applyActionSchema, { ...validActionBody(), actionType: 7 })

    expect(parsed.ok).toBe(false)
    if (parsed.ok) throw new Error('a malformed body was accepted')
    // The field NAME is the client's own, so returning it is safe and is what turns an
    // opaque 400 into something a developer can act on. Values are not echoed.
    expect(parsed.failure.body.field).toBe('actionType')
    expect(parsed.failure.status).toBe(400)
  })

  it('carries the same commit fields on undo and complete', () => {
    const commit = { attemptId: ATTEMPT_ID, actionId: ACTION_ID, expectedRevision: 2 }

    expect(parseBody(undoActionSchema, commit).ok).toBe(true)
    expect(parseBody(completeActionSchema, commit).ok).toBe(true)
    // Neither takes an action type or parameters: undo reverts the last event and
    // complete is a lifecycle transition, so there is nothing to dose.
    expect(parseBody(undoActionSchema, { ...commit, actionType: 'add_base' }).ok).toBe(false)
    expect(parseBody(completeActionSchema, { ...commit, parameters: { volume: 1 } }).ok).toBe(false)
  })

  it('turns a null revision into an absent key', () => {
    // `CommitIdentity` marks it optional and `exactOptionalPropertyTypes` rejects an
    // explicit undefined, so null has to become a missing property. Passing null through
    // would compare `null === 3` in the store and refuse every write from a caller that
    // legitimately has not seen a revision yet.
    expect(toCommitIdentity({ actionId: ACTION_ID as never, expectedRevision: null })).toEqual({
      actionId: ACTION_ID,
    })
    expect(
      toCommitIdentity({ actionId: ACTION_ID as never, expectedRevision: 3 }),
    ).toEqual({ actionId: ACTION_ID, expectedRevision: 3 })
  })
})

describe('origin check', () => {
  const HOST = 'http://localhost:3000'

  function requestWith(headers: Record<string, string>): Request {
    return new Request(`${HOST}/api/simulation/attempts/${ATTEMPT_ID}/actions`, {
      method: 'POST',
      headers,
    })
  }

  it('accepts a same-origin request', () => {
    expect(assertSameOrigin(requestWith({ origin: HOST }))).toBeNull()
    // A different path or port on the same host is a different origin and must not pass,
    // but the same host with a trailing path in the Origin header is not a thing browsers
    // send — Origin is scheme + host + port only.
    expect(assertSameOrigin(requestWith({ origin: `${HOST}/somewhere` }))).toBeNull()
  })

  it('rejects a cross-origin request', () => {
    for (const origin of ['https://evil.example', 'http://localhost:3001', 'https://localhost:3000']) {
      expect(assertSameOrigin(requestWith({ origin }))).toEqual({
        status: 403,
        body: { error: 'origin_not_allowed' },
      })
    }
  })

  it('rejects the literal string null, which a sandboxed iframe sends', () => {
    // A real bypass: `new URL('null')` throws, but a naive `origin === host` check after
    // some normalization could treat it as matching. Opaque origins must never pass.
    expect(assertSameOrigin(requestWith({ origin: 'null' }))).toEqual({
      status: 403,
      body: { error: 'origin_not_allowed' },
    })
  })

  it('falls back to referer when origin is absent', () => {
    expect(assertSameOrigin(requestWith({ referer: `${HOST}/simulate/acid-neutralization` }))).toBeNull()
    expect(assertSameOrigin(requestWith({ referer: 'https://evil.example/x' }))).toEqual({
      status: 403,
      body: { error: 'origin_not_allowed' },
    })
  })

  it('rejects a request carrying neither header', () => {
    // Same-origin fetch always sends Origin on a POST, so this is not a browser request.
    expect(assertSameOrigin(requestWith({}))).toEqual({
      status: 403,
      body: { error: 'origin_missing' },
    })
  })

  it('rejects an unparseable origin rather than throwing', () => {
    expect(assertSameOrigin(requestWith({ origin: '::not a url::' }))).toEqual({
      status: 403,
      body: { error: 'origin_not_allowed' },
    })
  })
})

describe('body limits', () => {
  function post(body: string, headers: Record<string, string> = {}): Request {
    return new Request('http://localhost:3000/api/simulation/attempts', {
      method: 'POST',
      body,
      headers: { 'content-type': 'application/json', ...headers },
    })
  }

  it('accepts a small body and parses it', async () => {
    const parsed = await readJson(post(JSON.stringify(validActionBody())), MAX_ACTION_BODY_BYTES)

    expect(parsed.ok).toBe(true)
    if (!parsed.ok) throw new Error('a small body was rejected')
    expect(parsed.value).toEqual(validActionBody())
  })

  it('rejects an oversized declared content-length without reading the body', async () => {
    const parsed = await readJson(
      post('{}', { 'content-length': String(MAX_ACTION_BODY_BYTES + 1) }),
      MAX_ACTION_BODY_BYTES,
    )

    expect(parsed).toEqual({ ok: false, failure: { status: 413, body: { error: 'body_too_large' } } })
  })

  it('rejects an oversized body that lies about its content-length', async () => {
    // The case the second check exists for: a declared length under the budget and actual
    // bytes over it. Checking only the header would parse a body larger than the limit —
    // exactly what §17's body-size rule is meant to prevent.
    const oversized = `{"actionType":"${'x'.repeat(MAX_ACTION_BODY_BYTES)}"}`
    const parsed = await readJson(
      post(oversized, { 'content-length': '10' }),
      MAX_ACTION_BODY_BYTES,
    )

    expect(parsed).toEqual({ ok: false, failure: { status: 413, body: { error: 'body_too_large' } } })
  })

  it('measures bytes, not characters', async () => {
    // A body under the limit in CHARACTERS and over it in BYTES. Counting `text.length`
    // would accept this, which is why the guard encodes before comparing.
    const wrapper = '{"actionType":""}'
    // `é` is 1 character and 2 bytes in UTF-8, so for a repeat count n:
    //   characters = n + wrapper.length,  bytes = 2n + wrapper.length
    // Both constraints have to hold at once — bytes over the limit, characters under it —
    // so n is solved from the pair rather than guessed at a number that stops working the
    // moment the limit changes.
    const count = Math.floor((MAX_ACTION_BODY_BYTES - wrapper.length) / 2) + 1
    const body = `{"actionType":"${'é'.repeat(count)}"}`

    const bytes = new TextEncoder().encode(body).byteLength
    expect(bytes).toBeGreaterThan(MAX_ACTION_BODY_BYTES)
    expect(body.length).toBeLessThan(MAX_ACTION_BODY_BYTES)

    const parsed = await readJson(post(body), MAX_ACTION_BODY_BYTES)
    expect(parsed).toEqual({ ok: false, failure: { status: 413, body: { error: 'body_too_large' } } })
  })

  it('rejects a body that is not JSON', async () => {
    const parsed = await readJson(post('<html></html>'), MAX_ACTION_BODY_BYTES)

    expect(parsed).toEqual({ ok: false, failure: { status: 400, body: { error: 'body_not_json' } } })
  })
})
