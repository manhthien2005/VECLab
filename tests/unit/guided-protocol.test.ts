import { describe, expect, it } from 'vitest'
import type { ActionAvailability } from '@/application/simulation/acid-session.js'
import type { AcidNeutralizationState } from '@/domain/experiments/acid-neutralization/state.js'
import {
  guidedFeedbackLine,
  resolveNextGuidedAction,
} from '@/features/simulation-workbench/guidance/protocol.js'

function avail(types: readonly string[]): ActionAvailability[] {
  return types.map((actionType) => ({
    actionType,
    available: true,
    reasonKey: null,
    reasonData: {},
  }))
}

function domain(overrides: Partial<AcidNeutralizationState>): AcidNeutralizationState {
  return {
    route: 'naoh',
    phase: 'ready',
    compositionRevision: 1,
    totalVolumeL: 0.025,
    chlorideMoles: 0.00025,
    sodiumMoles: 0,
    calciumMoles: 0,
    totalInorganicCarbonMoles: 0,
    baseVolumeL: 0,
    correctionAcidVolumeL: 0,
    aliquotHistory: [],
    directionChangeCount: 0,
    meterCalibrated: true,
    mixedSinceLastAddition: true,
    readingStable: false,
    lastMeasuredPH: null,
    lastMeasuredCompositionRevision: null,
    measurements: [],
    equilibrium: null,
    modelValid: false,
    invalidReasonCodes: [],
    ...overrides,
  }
}

describe('resolveNextGuidedAction', () => {
  it('starts with select_route when that action is available', () => {
    expect(
      resolveNextGuidedAction(null, avail(['select_route', 'calibrate_meter', 'add_base'])),
    ).toBe('select_route')
  })

  it('asks for calibration after the route is chosen', () => {
    expect(
      resolveNextGuidedAction(
        domain({ route: 'naoh', meterCalibrated: false }),
        avail(['select_route', 'calibrate_meter', 'add_base']),
      ),
    ).toBe('calibrate_meter')
  })

  it('asks to wait after the meter is calibrated, even if calibrate stays available', () => {
    expect(
      resolveNextGuidedAction(
        domain({
          route: 'naoh',
          meterCalibrated: true,
          readingStable: false,
        }),
        avail([
          'select_route',
          'calibrate_meter',
          'wait_for_stable_reading',
          'add_base',
        ]),
      ),
    ).toBe('wait_for_stable_reading')
  })

  it('reads the untouched sample before the first dose', () => {
    const sample = domain({ meterCalibrated: true, readingStable: false })
    expect(
      resolveNextGuidedAction(
        sample,
        avail(['add_base', 'wait_for_stable_reading', 'measure_ph']),
      ),
    ).toBe('wait_for_stable_reading')
  })

  it('measures after the reading is stable', () => {
    expect(
      resolveNextGuidedAction(
        domain({ readingStable: true }),
        avail(['add_base', 'wait_for_stable_reading', 'measure_ph']),
      ),
    ).toBe('measure_ph')
  })

  it('doses next after a current measurement', () => {
    expect(
      resolveNextGuidedAction(
        domain({
          readingStable: true,
          lastMeasuredPH: 2.05,
          lastMeasuredCompositionRevision: 1,
        }),
        avail(['add_base', 'measure_ph']),
      ),
    ).toBe('add_base')
  })

  it('keeps adding after a dose until the learner finishes the batch', () => {
    expect(
      resolveNextGuidedAction(
        domain({
          baseVolumeL: 0.001,
          mixedSinceLastAddition: false,
          readingStable: false,
          lastMeasuredPH: null,
          compositionRevision: 2,
        }),
        avail(['mix', 'wait_for_stable_reading', 'add_base']),
      ),
    ).toBe('add_base')
  })

  it('mixes after the learner finishes dosing', () => {
    expect(
      resolveNextGuidedAction(
        domain({
          baseVolumeL: 0.001,
          mixedSinceLastAddition: false,
          readingStable: false,
          lastMeasuredPH: null,
          compositionRevision: 2,
        }),
        avail(['mix', 'wait_for_stable_reading', 'add_base']),
        { dosingFinished: true },
      ),
    ).toBe('mix')
  })
})

describe('guidedFeedbackLine', () => {
  it('pairs the last action with the next step', () => {
    expect(guidedFeedbackLine('calibrate_meter', 'wait_for_stable_reading')).toBe(
      'Đã hiệu chuẩn máy đo pH. Tiếp theo: chờ số đọc ổn định.',
    )
  })

  it('tells the learner they can add again after a dose', () => {
    expect(guidedFeedbackLine('add_base', 'add_base')).toBe(
      'Đã thêm dung dịch NaOH. Bạn có thể thêm tiếp, hoặc bấm Thêm xong.',
    )
  })
})
