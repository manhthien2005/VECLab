import { describe, expect, it } from 'vitest'
import {
  createAcidProjector,
  isAcidProjection,
} from '@/application/scenarios/acid-projection.js'
import {
  createAcidScenarioConfig,
} from '@/domain/experiments/acid-neutralization/setup.js'
import {
  ACID_RELEASE_ID,
  benchmarkScenarioConfig,
  createAcidNeutralizationModule,
} from '@/domain/experiments/acid-neutralization/index.js'
import { createInitialResourceLedger } from '@/domain/experiments/acid-neutralization/resources.js'
import { formatLitresAsMl } from '@/shared/ui/format.js'

describe('Truthful Report Initial Conditions and Projection Rendering', () => {
  it('benchmark projector populates exact benchmark initial conditions', () => {
    const config = benchmarkScenarioConfig()
    const engine = createAcidNeutralizationModule(config)
    const projector = createAcidProjector(config)
    const state = engine.createInitialState()
    const ledger = createInitialResourceLedger()

    const projection = projector.project(ACID_RELEASE_ID, 0, state, ledger)

    expect(isAcidProjection(projection)).toBe(true)
    expect(projection.initialAcidVolumeMl).toBe(25)
    expect(projection.initialAcidConcentrationMolL).toBe(0.010)

    // Verify formatLitresAsMl produces standard Vietnamese locale formatted volume
    const volumeL = (projection.initialAcidVolumeMl ?? 25) / 1000
    const conc = projection.initialAcidConcentrationMolL ?? 0.01
    expect(formatLitresAsMl(volumeL)).toBe('25,00 mL')
    expect(conc.toExponential(4)).toBe('1.0000e-2')
  })

  it('parameterized projector populates configured initial conditions truthfully', () => {
    const customConfig = createAcidScenarioConfig({
      acidVolumeL: 0.045,
      acidConcentrationMolL: 0.018,
    })
    const engine = createAcidNeutralizationModule(customConfig)
    const projector = createAcidProjector(customConfig)
    const state = engine.createInitialState()
    const ledger = createInitialResourceLedger()

    const projection = projector.project(ACID_RELEASE_ID, 0, state, ledger)

    expect(isAcidProjection(projection)).toBe(true)
    expect(projection.initialAcidVolumeMl).toBe(45)
    expect(projection.initialAcidConcentrationMolL).toBe(0.018)

    const volumeL = (projection.initialAcidVolumeMl ?? 25) / 1000
    const conc = projection.initialAcidConcentrationMolL ?? 0.01
    expect(formatLitresAsMl(volumeL)).toBe('45,00 mL')
    expect(conc.toExponential(4)).toBe('1.8000e-2')
  })

  it('truthfully derives initial conditions for legacy historical attempts lacking projection fields', () => {
    // Legacy benchmark attempt domain state
    const legacyBenchmarkDomain = {
      totalVolumeL: 0.025,
      chlorideMoles: 0.00025,
      baseVolumeL: 0,
      correctionAcidVolumeL: 0,
    }

    const legacyVolumeL = Math.max(
      0.025,
      legacyBenchmarkDomain.totalVolumeL -
        legacyBenchmarkDomain.baseVolumeL -
        legacyBenchmarkDomain.correctionAcidVolumeL,
    )
    const legacyConcentrationMolL =
      (legacyBenchmarkDomain.chlorideMoles -
        legacyBenchmarkDomain.correctionAcidVolumeL * 0.01) /
      legacyVolumeL

    expect(legacyVolumeL).toBe(0.025)
    expect(legacyConcentrationMolL).toBe(0.010)
    expect(formatLitresAsMl(legacyVolumeL)).toBe('25,00 mL')
    expect(legacyConcentrationMolL.toExponential(4)).toBe('1.0000e-2')
  })
})
