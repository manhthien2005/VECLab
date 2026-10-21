import { describe, expect, it } from 'vitest'
import {
  SOAP_PROFILE, classifySoap, lyeTemperatureC, residualWaterG, theoreticalNaohG,
} from '@/domain/experiments/soap/model.js'
import {
  REFERENCE, accepted, chooseOlive, pourBoth, prepareLye, prepareOil, runSample,
  soapHarness, type SoapStepResult,
} from '../fixtures/soap-harness.js'

function rejectedWith(result: SoapStepResult, code: string) {
  expect(result.ok).toBe(false)
  if (!result.ok) expect(result.error.code).toBe(code)
}

const mL = { volumeL: 'mL' } as const

describe('soap amounts', () => {
  it('uses the locked olive midpoint for 500 g and 5% superfat', () => {
    expect(theoreticalNaohG('olive', 500, 0.05)).toBeCloseTo(64.6, 8)
    expect(lyeTemperatureC(64.6, 175, 25)).toBeCloseTo(83.9477, 3)
    expect(residualWaterG(175, 4 * 7 * 24 * 60)).toBeCloseTo(42, 0)
  })
})

describe('soap lye cup', () => {
  it('breaks the cup and fails the attempt when water hits solid NaOH', () => {
    const h = soapHarness()
    accepted(h.step('pour_naoh', { naohMassG: 20 }, { naohMassG: 'g' }))
    accepted(h.step('pour_water', { waterVolumeL: 100 }, { waterVolumeL: 'mL' }))
    expect(h.state.phase).toBe('hazard')
    expect(h.state.failure).toBe('WATER_INTO_NAOH')
    expect(classifySoap(h.state)).toBe('danger')
    rejectedWith(h.step('pour_water', { waterVolumeL: 10 }, { waterVolumeL: 'mL' }), 'ATTEMPT_COMPLETED')
    accepted(h.step('complete'))
  })

  it('rejects more water than the cup holds', () => {
    const h = soapHarness()
    rejectedWith(h.step('pour_water', { waterVolumeL: 751 }, { waterVolumeL: 'mL' }), 'ERR_OVERFLOW')
  })

  it('refuses to pour or cool a lye that is not dissolved yet', () => {
    const h = soapHarness()
    rejectedWith(h.step('pour_to_mix', { from: 'W', volumeL: 10 }, mL), 'LYE_NOT_READY')
    rejectedWith(h.step('cool_lye'), 'LYE_NOT_READY')
  })

  it('cools the hot lye once and then reports it as cool', () => {
    const h = soapHarness()
    chooseOlive(h)
    prepareLye(h)
    expect(h.state.vessels.W.temperatureC).toBe(SOAP_PROFILE.lyePourWarnC)
    rejectedWith(h.step('cool_lye'), 'ALREADY_COOL')
  })
})

describe('soap oil cup', () => {
  it('lets oil pour without a saved mass and changes type only when cups are empty of oil', () => {
    const h = soapHarness()
    accepted(h.step('pour_oil', { oilVolumeL: 100 }, { oilVolumeL: 'mL' }))
    rejectedWith(h.step('set_oil', { oilType: 'coconut' }), 'OIL_IN_CUP')
    accepted(h.step('discard_oil'))
    accepted(h.step('set_oil', { oilType: 'coconut' }))
    expect(h.state.oilType).toBe('coconut')
  })

  it('refuses more oil than the fixed oil cup holds', () => {
    const h = soapHarness()
    rejectedWith(h.step('pour_oil', { oilVolumeL: 751 }, { oilVolumeL: 'mL' }), 'ERR_OVERFLOW')
  })
})

describe('soap mixing cup', () => {
  it('needs both lye and oil before stirring, and stirs only once per mix', () => {
    const h = soapHarness()
    rejectedWith(h.step('stir', { mode: 'hand' }), 'STIR_NEEDS_BOTH')
    prepareLye(h)
    prepareOil(h)
    pourBoth(h)
    accepted(h.step('stir', { mode: 'hand' }))
    rejectedWith(h.step('stir', { mode: 'machine' }), 'ALREADY_STIRRED')
  })

  it('requires a stir before waiting for trace and before molding', () => {
    const h = soapHarness()
    prepareLye(h)
    prepareOil(h)
    pourBoth(h)
    rejectedWith(h.step('advance_trace'), 'STIR_REQUIRED')
    rejectedWith(h.step('pour_to_mold'), 'STIR_REQUIRED_BEFORE_MOLD')
  })

  it('rejects a second lye whose concentration differs by more than 1 %', () => {
    const h = soapHarness()
    prepareLye(h)
    accepted(h.step('pour_to_mix', { from: 'W', volumeL: REFERENCE.lyeMl }, mL))
    accepted(h.step('pour_water', { waterVolumeL: 100 }, { waterVolumeL: 'mL' }))
    accepted(h.step('pour_naoh', { naohMassG: 64.6 }, { naohMassG: 'g' }))
    rejectedWith(h.step('pour_to_mix', { from: 'W', volumeL: 50 }, mL), 'LYE_INDEX_MISMATCH')
  })

  it('returns a single component to its source and discards a full mix', () => {
    const h = soapHarness()
    prepareLye(h)
    accepted(h.step('pour_to_mix', { from: 'W', volumeL: 100 }, mL))
    rejectedWith(h.step('return_to_source', { to: 'O', volumeL: 50 }, mL), 'RETURN_WRONG_TARGET')
    accepted(h.step('return_to_source', { to: 'W', volumeL: 100 }, mL))
    expect(h.state.vessels.M.waterG).toBe(0)
    prepareOil(h)
    accepted(h.step('pour_to_mix', { from: 'W', volumeL: REFERENCE.lyeMl }, mL))
    accepted(h.step('pour_to_mix', { from: 'O', volumeL: REFERENCE.oilMl }, mL))
    rejectedWith(h.step('return_to_source', { to: 'W', volumeL: 10 }, mL), 'RETURN_NOT_ALLOWED')
    accepted(h.step('discard_mix'))
    expect(h.state.vessels.M.oilG).toBe(0)
    rejectedWith(h.step('discard_mix'), 'NOTHING_TO_DISCARD')
  })
})

describe('soap mold and samples', () => {
  it('enforces the mold order', () => {
    const h = soapHarness()
    rejectedWith(h.step('advance_gel'), 'NOT_IN_MOLD')
    rejectedWith(h.step('unmold'), 'GEL_INCOMPLETE')
    rejectedWith(h.step('advance_cure'), 'NOT_UNMOLDED')
    rejectedWith(h.step('measure_sample'), 'NOT_CURED')
  })

  it('passes the olive 500 g reference recipe', () => {
    const h = soapHarness()
    runSample(h)
    const [sample] = h.state.samples
    expect(sample?.passed).toBe(true)
    expect(sample?.criteria.every((item) => item.met)).toBe(true)
    expect(sample?.soap.ph).toBeCloseTo(9.4, 1)
    expect(sample?.soap.massG).toBeCloseTo(606.6, 0)
    expect(sample?.mix.deltaTC).toBeCloseTo(5, 1)
    expect(classifySoap(h.state)).toBe('pass')
    expect(h.state.mold.stage).toBe('empty')
  })

  it('fails the thickening criterion when molded before trace', () => {
    const h = soapHarness()
    runSample(h, { trace: false })
    const [sample] = h.state.samples
    expect(sample?.passed).toBe(false)
    expect(sample?.criteria.find((item) => item.key === 'thickened_before_mold')?.met).toBe(false)
    expect(classifySoap(h.state)).toBe('fail')
  })

  it('passes the experiment when any of the samples passes, up to three samples', () => {
    const h = soapHarness()
    runSample(h, { trace: false })
    runSample(h)
    runSample(h, { trace: false })
    expect(h.state.samples.map((item) => item.passed)).toEqual([false, true, false])
    expect(classifySoap(h.state)).toBe('pass')
    rejectedWith(h.step('pour_to_mold'), 'MAX_SAMPLES')
  })

  it('needs a sample before the attempt can be completed', () => {
    const h = soapHarness()
    rejectedWith(h.step('complete'), 'NO_SAMPLE')
    runSample(h)
    accepted(h.step('complete'))
    expect(h.state.phase).toBe('completed')
  })

  it('keeps the mold busy until the sample is measured', () => {
    const h = soapHarness()
    prepareLye(h)
    prepareOil(h)
    pourBoth(h)
    accepted(h.step('stir', { mode: 'machine' }))
    accepted(h.step('pour_to_mold'))
    rejectedWith(h.step('pour_to_mold'), 'MOLD_IN_USE')
    for (const type of ['advance_gel', 'unmold', 'advance_cure']) accepted(h.step(type))
    expect(h.state.mold.stage).toBe('cured')
    accepted(h.step('measure_sample'))
    expect(h.state.samples).toHaveLength(1)
  })
})
