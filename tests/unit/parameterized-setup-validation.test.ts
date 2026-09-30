import { describe, expect, it } from 'vitest'
import {
  benchmarkSetupParams,
  createAcidScenarioConfig,
  isAcidSetupParams,
  reconstructSetupParams,
  resolveScenarioConfigForAttempt,
  validateSetupParams,
} from '@/domain/experiments/acid-neutralization/setup.js'
import {
  BENCHMARK_SAMPLE,
  EXPLORATION_RANGES,
} from '@/domain/experiments/acid-neutralization/constants.js'
import {
  benchmarkScenarioConfig,
  createAcidStateFor,
} from '@/domain/experiments/acid-neutralization/engine.js'
import {
  startAttemptSchema,
  parseBody,
} from '@/app/api/simulation/schemas.js'

describe('AcidSetupParams validation and configuration builder', () => {
  it('defaults to exact benchmark setup when parameters are omitted', () => {
    const config = createAcidScenarioConfig()
    const benchmark = benchmarkScenarioConfig()

    expect(config.constants.acidVolumeL).toBe(BENCHMARK_SAMPLE.acidVolumeL)
    expect(config.constants.acidConcentrationMolL).toBe(BENCHMARK_SAMPLE.acidConcentrationMolL)
    expect(config.constants.baseEquivalentConcentrationEqL).toBe(0.01)
    expect(config.constants.temperatureC).toBe(25.0)
    expect(config.maxBaseVolumeLByRoute.naoh).toBe(0.03)
    expect(config).toEqual(benchmark)
    expect(benchmarkSetupParams()).toEqual({
      acidVolumeL: BENCHMARK_SAMPLE.acidVolumeL,
      acidConcentrationMolL: BENCHMARK_SAMPLE.acidConcentrationMolL,
    })
  })

  it('accepts complete valid params at boundary extremes', () => {
    const minParams = {
      acidVolumeL: EXPLORATION_RANGES.acidVolumeL.min,
      acidConcentrationMolL: EXPLORATION_RANGES.acidConcentrationMolL.min,
    }
    const maxParams = {
      acidVolumeL: EXPLORATION_RANGES.acidVolumeL.max,
      acidConcentrationMolL: EXPLORATION_RANGES.acidConcentrationMolL.max,
    }

    expect(isAcidSetupParams(minParams)).toBe(true)
    expect(isAcidSetupParams(maxParams)).toBe(true)

    const minValidated = validateSetupParams(minParams)
    expect(minValidated.ok).toBe(true)
    if (minValidated.ok) {
      expect(minValidated.params.acidVolumeL).toBe(0.025)
      expect(minValidated.params.acidConcentrationMolL).toBe(0.005)
    }

    const maxValidated = validateSetupParams(maxParams)
    expect(maxValidated.ok).toBe(true)
    if (maxValidated.ok) {
      expect(maxValidated.params.acidVolumeL).toBe(0.050)
      expect(maxValidated.params.acidConcentrationMolL).toBe(0.020)
    }
  })

  it('accepts representative interior params and derives base equivalent concentration', () => {
    const interior = {
      acidVolumeL: 0.040,
      acidConcentrationMolL: 0.015,
    }

    expect(isAcidSetupParams(interior)).toBe(true)
    const validated = validateSetupParams(interior)
    expect(validated.ok).toBe(true)

    const config = createAcidScenarioConfig(interior)
    expect(config.constants.acidVolumeL).toBe(0.040)
    expect(config.constants.acidConcentrationMolL).toBe(0.015)
    // Stock equivalent concentration strictly equals sample HCl concentration per spec §3.5
    expect(config.constants.baseEquivalentConcentrationEqL).toBe(0.015)
    expect(config.constants.temperatureC).toBe(25.0)
    expect(config.maxBaseVolumeLByRoute.naoh).toBeCloseTo(1.2 * 0.040, 9)
  })

  it('rejects volumes outside exploration envelope', () => {
    const tooLow = { acidVolumeL: 0.0249, acidConcentrationMolL: 0.010 }
    const tooHigh = { acidVolumeL: 0.0501, acidConcentrationMolL: 0.010 }

    expect(isAcidSetupParams(tooLow)).toBe(false)
    expect(isAcidSetupParams(tooHigh)).toBe(false)

    const lowResult = validateSetupParams(tooLow)
    expect(lowResult.ok).toBe(false)
    if (!lowResult.ok) {
      expect(lowResult.error.code).toBe('SETUP_VOLUME_OUT_OF_RANGE')
    }

    const highResult = validateSetupParams(tooHigh)
    expect(highResult.ok).toBe(false)
    if (!highResult.ok) {
      expect(highResult.error.code).toBe('SETUP_VOLUME_OUT_OF_RANGE')
    }
  })

  it('rejects concentrations outside exploration envelope', () => {
    const tooLow = { acidVolumeL: 0.030, acidConcentrationMolL: 0.0049 }
    const tooHigh = { acidVolumeL: 0.030, acidConcentrationMolL: 0.0201 }

    expect(isAcidSetupParams(tooLow)).toBe(false)
    expect(isAcidSetupParams(tooHigh)).toBe(false)

    const lowResult = validateSetupParams(tooLow)
    expect(lowResult.ok).toBe(false)
    if (!lowResult.ok) {
      expect(lowResult.error.code).toBe('SETUP_CONCENTRATION_OUT_OF_RANGE')
    }

    const highResult = validateSetupParams(tooHigh)
    expect(highResult.ok).toBe(false)
    if (!highResult.ok) {
      expect(highResult.error.code).toBe('SETUP_CONCENTRATION_OUT_OF_RANGE')
    }
  })

  it('rejects NaN, Infinity, and non-numeric values', () => {
    for (const badValue of [NaN, Infinity, -Infinity, '0.025', null, undefined]) {
      const badVol = { acidVolumeL: badValue, acidConcentrationMolL: 0.010 }
      const badConc = { acidVolumeL: 0.025, acidConcentrationMolL: badValue }

      expect(isAcidSetupParams(badVol)).toBe(false)
      expect(isAcidSetupParams(badConc)).toBe(false)
      expect(validateSetupParams(badVol).ok).toBe(false)
      expect(validateSetupParams(badConc).ok).toBe(false)
    }
  })

  it('reconstructs AcidSetupParams truthfully from immutable initial domain state', () => {
    // Benchmark initial state
    const benchmarkConfig = benchmarkScenarioConfig()
    const benchmarkInitialState = createAcidStateFor(benchmarkConfig)
    const reconstructedBenchmark = reconstructSetupParams(benchmarkInitialState)

    expect(reconstructedBenchmark.acidVolumeL).toBe(0.025)
    expect(reconstructedBenchmark.acidConcentrationMolL).toBe(0.010)

    const resolvedBenchmark = resolveScenarioConfigForAttempt(benchmarkInitialState)
    expect(resolvedBenchmark.constants.acidVolumeL).toBe(0.025)
    expect(resolvedBenchmark.constants.acidConcentrationMolL).toBe(0.010)
    expect(resolvedBenchmark).toEqual(benchmarkConfig)

    // Parameterized initial state
    const customConfig = createAcidScenarioConfig({
      acidVolumeL: 0.045,
      acidConcentrationMolL: 0.018,
    })
    const customInitialState = createAcidStateFor(customConfig)
    const reconstructedCustom = reconstructSetupParams(customInitialState)

    expect(reconstructedCustom.acidVolumeL).toBe(0.045)
    expect(reconstructedCustom.acidConcentrationMolL).toBe(0.018)

    const resolvedCustom = resolveScenarioConfigForAttempt(customInitialState)
    expect(resolvedCustom.constants.acidVolumeL).toBe(0.045)
    expect(resolvedCustom.constants.acidConcentrationMolL).toBe(0.018)
    expect(resolvedCustom.constants.baseEquivalentConcentrationEqL).toBe(0.018)
  })

  it('guards against invalid initial states during reconstruction', () => {
    const invalidVolState = {
      ...createAcidStateFor(benchmarkScenarioConfig()),
      totalVolumeL: 0,
    }
    expect(() => reconstructSetupParams(invalidVolState)).toThrow(RangeError)

    const invalidMolesState = {
      ...createAcidStateFor(benchmarkScenarioConfig()),
      chlorideMoles: 0,
    }
    expect(() => reconstructSetupParams(invalidMolesState)).toThrow(RangeError)
  })
})

describe('BFF startAttemptSchema Zod validation', () => {
  it('accepts an empty body for benchmark attempt start', () => {
    const result = parseBody(startAttemptSchema, {})
    expect(result.ok).toBe(true)
  })

  it('accepts complete, valid AcidSetupParams', () => {
    const result = parseBody(startAttemptSchema, {
      acidVolumeL: 0.040,
      acidConcentrationMolL: 0.015,
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toEqual({
        acidVolumeL: 0.040,
        acidConcentrationMolL: 0.015,
      })
    }
  })

  it('rejects partial setup payloads', () => {
    const onlyVolume = parseBody(startAttemptSchema, { acidVolumeL: 0.040 })
    expect(onlyVolume.ok).toBe(false)

    const onlyConc = parseBody(startAttemptSchema, { acidConcentrationMolL: 0.015 })
    expect(onlyConc.ok).toBe(false)
  })

  it('rejects unknown properties in setup payload', () => {
    const extraField = parseBody(startAttemptSchema, {
      acidVolumeL: 0.040,
      acidConcentrationMolL: 0.015,
      temperatureC: 30,
    })
    expect(extraField.ok).toBe(false)

    const unknownInEmpty = parseBody(startAttemptSchema, {
      scenarioKey: 'acid-neutralization',
    })
    expect(unknownInEmpty.ok).toBe(false)
  })

  it('rejects out-of-range values in start payload', () => {
    const outOfRange = parseBody(startAttemptSchema, {
      acidVolumeL: 0.010,
      acidConcentrationMolL: 0.015,
    })
    expect(outOfRange.ok).toBe(false)
  })
})
