import { describe, expect, it, vi } from 'vitest'
import type { NextRequest } from 'next/server'
import { POST } from '@/app/api/water-treatment/run/route.js'

/**
 * Route handler for POST /api/water-treatment/run (WT-10 brief).
 *
 * Tests are organized so a regression in the BFF hygiene chain (size cap, JSON parse,
 * zod strict, error non-leak) is visible independently of the chemistry solver itself —
 * the chemistry is exercised through the same call path the workbench uses, so a
 * solver bug shows up as a real response, not a mocked one.
 */

function buildRequest(
  body: unknown | string,
  extraHeaders: Record<string, string> = {},
): NextRequest {
  const init: RequestInit = {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...extraHeaders },
  }
  init.body = typeof body === 'string' ? body : JSON.stringify(body)
  return new Request('http://localhost:3000/api/water-treatment/run', init) as unknown as NextRequest
}

const validInput = {
  action: 'stir',
  composition: { Fe: 1, Zn: 0.5, Pb: 0.05 },
  pH: 7,
}

describe('POST /api/water-treatment/run', () => {
  it('returns 200 with a WaterTreatmentResult for a valid input', async () => {
    const res = await POST(buildRequest(validInput))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({
      action: 'stir',
      pH: 7,
      composition: { Fe: 1, Zn: 0.5, Pb: 0.05 },
    })
    // The result shape is documented in WaterTreatmentResult; assert the fields the
    // workbench reads so a future schema drift breaks here, not in the UI.
    expect(body).toHaveProperty('previousPH')
    expect(body).toHaveProperty('capacity')
    expect(body).toHaveProperty('capacity_mgPerL')
    expect(body).toHaveProperty('filtrate_mgPerL')
    expect(body).toHaveProperty('precipitated_mgPerL')
    expect(body).toHaveProperty('pHGuardHit')
    expect(body).toHaveProperty('massBalancePct')
    expect(body).toHaveProperty('goalStatus')
    expect(body).toHaveProperty('expectedOutcome')
    expect(body).toHaveProperty('events')
  })

  it('returns 400 body_invalid when a required field is missing', async () => {
    const res = await POST(
      buildRequest({ action: 'stir', composition: { Fe: 1, Zn: 0.5, Pb: 0.05 } }),
    )
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body).toEqual({ error: 'body_invalid' })
  })

  it('returns 400 body_invalid when an unknown field is sent (zod strict)', async () => {
    // Strict schemas exist so a body carrying `email` is rejected rather than silently
    // ignored; the route must follow the same posture as /api/profile.
    const res = await POST(buildRequest({ ...validInput, attacker: 'x' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body).toEqual({ error: 'body_invalid' })
  })

  it('returns 400 body_invalid when action is not in the enum', async () => {
    const res = await POST(buildRequest({ ...validInput, action: 'destroy-lab' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body).toEqual({ error: 'body_invalid' })
  })

  it('returns 400 body_invalid when composition has an unknown key', async () => {
    const res = await POST(
      buildRequest({ ...validInput, composition: { Fe: 1, Zn: 0.5, Pb: 0.05, Cu: 9 } }),
    )
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body).toEqual({ error: 'body_invalid' })
  })

  it('returns 400 body_not_json when the body is not JSON', async () => {
    const res = await POST(buildRequest('<html></html>'))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body).toEqual({ error: 'body_not_json' })
  })

  it('returns 413 body_too_large when the body exceeds the cap', async () => {
    // 70 KiB > 64 KiB cap; chosen so the declared Content-Length and the actual bytes
    // both exceed the limit and either guard catches it.
    const oversized = JSON.stringify({ ...validInput, padding: 'x'.repeat(70_000) })
    const res = await POST(buildRequest(oversized))
    expect(res.status).toBe(413)
    const body = await res.json()
    expect(body).toEqual({ error: 'body_too_large' })
  })

  it('returns 500 internal_error and does not leak the solver message when the solver throws', async () => {
    // `guardedResponse` is what turns an unhandled rejection into a 500 with no
    // detail. The test forces the throw and asserts neither the message nor any
    // schema hint is echoed to the client.
    vi.resetModules()
    const secretMessage = 'secret chemistry blow-up: column attempts.id'
    vi.doMock('@/app/simulate/water-treatment/actions.js', () => ({
      runWaterTreatmentAction: vi.fn(async () => {
        throw new Error(secretMessage)
      }),
    }))
    try {
      const { POST: PostWithMock } = await import('@/app/api/water-treatment/run/route.js')
      const res = await PostWithMock(buildRequest(validInput))
      expect(res.status).toBe(500)
      const body = await res.json()
      expect(body).toEqual({ error: 'internal_error' })
      const bodyText = JSON.stringify(body)
      expect(bodyText).not.toContain(secretMessage)
      expect(bodyText).not.toContain('attempts.id')
    } finally {
      vi.doUnmock('@/app/simulate/water-treatment/actions.js')
      vi.resetModules()
    }
  })
})
