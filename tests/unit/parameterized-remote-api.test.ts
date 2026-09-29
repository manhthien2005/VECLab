import { afterEach, describe, expect, it, vi } from 'vitest'
import { RemoteAcidSession } from '@/application/simulation/remote-session.js'
import type { SessionStateDto } from '@/application/simulation/wire.js'
import { POST } from '@/app/api/simulation/attempts/route.js'
import { NextRequest } from 'next/server'
import type { UUID } from '@/domain/process/contracts.js'
import { createInitialResourceLedger } from '@/domain/experiments/acid-neutralization/resources.js'

describe('RemoteAcidSession and Start Attempt BFF Contract', () => {
  const originalFetch = globalThis.fetch

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
  })

  function mockSessionResponse(initialVolumeMl = 25, initialConc = 0.01): SessionStateDto {
    return {
      attemptId: '11111111-1111-4111-8111-111111111111' as UUID,
      releaseId: 'acid-neutralization@1.0.0',
      revision: 1,
      lastSequence: 0,
      status: 'in_progress',
      domain: {
        route: null,
        phase: 'setup',
        compositionRevision: 0,
        totalVolumeL: initialVolumeMl / 1000,
        chlorideMoles: (initialVolumeMl / 1000) * initialConc,
        sodiumMoles: 0,
        calciumMoles: 0,
        totalInorganicCarbonMoles: 0,
        baseVolumeL: 0,
        correctionAcidVolumeL: 0,
        aliquotHistory: [],
        directionChangeCount: 0,
        meterCalibrated: false,
        mixedSinceLastAddition: false,
        readingStable: false,
        lastMeasuredPH: null,
        lastMeasuredCompositionRevision: null,
        measurements: [],
        equilibrium: null,
        modelValid: false,
        invalidReasonCodes: [],
      },
      ledger: createInitialResourceLedger(),
      projection: {
        scenarioReleaseId: 'acid-neutralization@1.0.0',
        sequence: 0,
        phase: 'setup',
        route: null,
        phStar: null,
        measurementCurrent: false,
        modelValid: false,
        goalMet: false,
        overallScore: null,
        phScore: 0,
        resourceScore: null,
        processScore: 0,
        grossEquivalentsMmolEq: null,
        targetEquivalentsMmolEq: null,
        baseVolumeMl: 0,
        correctionAcidVolumeMl: 0,
        totalVolumeMl: initialVolumeMl,
        operationCount: 0,
        relativeCostIndex: null,
        safetyIndex: null,
        safetyPenaltyCodes: [],
        invalidReasonCodes: [],
        initialAcidVolumeMl: initialVolumeMl,
        initialAcidConcentrationMolL: initialConc,
      },
      finalReportSnapshot: null,
      createdAt: new Date().toISOString(),
      completedAt: null,
      storageMode: 'cloud',
    }
  }

  it('RemoteAcidSession.start() sends empty object and deserializes benchmark session state', async () => {
    let capturedBody: unknown = null
    globalThis.fetch = vi.fn().mockImplementation(async (_url, init) => {
      capturedBody = JSON.parse(init.body)
      return {
        ok: true,
        json: async () => ({ state: mockSessionResponse(25, 0.01) }),
      }
    })

    const remote = new RemoteAcidSession()
    const state = await remote.start()

    expect(capturedBody).toEqual({})
    expect(state.domain.totalVolumeL).toBe(0.025)
    expect(state.projection.initialAcidVolumeMl).toBe(25)
    expect(state.projection.initialAcidConcentrationMolL).toBe(0.010)
    expect(state.storageMode).toBe('cloud')
  })

  it('RemoteAcidSession.start(params) sends atomic setup payload and receives parameterized state', async () => {
    let capturedBody: unknown = null
    globalThis.fetch = vi.fn().mockImplementation(async (_url, init) => {
      capturedBody = JSON.parse(init.body)
      return {
        ok: true,
        json: async () => ({ state: mockSessionResponse(50, 0.015) }),
      }
    })

    const remote = new RemoteAcidSession()
    const state = await remote.start({
      acidVolumeL: 0.050,
      acidConcentrationMolL: 0.015,
    })

    expect(capturedBody).toEqual({
      acidVolumeL: 0.050,
      acidConcentrationMolL: 0.015,
    })
    expect(state.domain.totalVolumeL).toBe(0.050)
    expect(state.projection.initialAcidVolumeMl).toBe(50)
    expect(state.projection.initialAcidConcentrationMolL).toBe(0.015)
  })

  it('route handler rejects client-supplied initial_state or scenarioKey with 400', async () => {
    const bodies = [
      { initialState: { totalVolumeL: 0.050 } },
      { scenarioKey: 'acid-neutralization' },
      { scenarioReleaseId: 'acid-neutralization@1.0.0' },
      { acidVolumeL: 0.025 }, // partial
      { acidConcentrationMolL: 0.010 }, // partial
      { acidVolumeL: 0.010, acidConcentrationMolL: 0.010 }, // out of range
      { acidVolumeL: 0.025, acidConcentrationMolL: 0.010, extra: true }, // unknown property
    ]

    for (const body of bodies) {
      const req = new NextRequest('http://localhost:3000/api/simulation/attempts', {
        method: 'POST',
        headers: {
          origin: 'http://localhost:3000',
          'content-type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const res = await POST(req)
      expect(res.status, `body ${JSON.stringify(body)} should return 400`).toBe(400)
      const data = await res.json()
      expect(data.error).toBeDefined()
    }
  })
})
