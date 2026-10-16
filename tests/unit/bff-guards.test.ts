import { describe, expect, it } from 'vitest'
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

describe('origin check', () => {
  const HOST = 'http://localhost:3000'

  function requestWith(headers: Record<string, string>): Request {
    return new Request(`${HOST}/api/profile/${ATTEMPT_ID}/actions`, {
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
    expect(assertSameOrigin(requestWith({ referer: `${HOST}/simulate/jar-test` }))).toBeNull()
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
    return new Request('http://localhost:3000/api/profile', {
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
