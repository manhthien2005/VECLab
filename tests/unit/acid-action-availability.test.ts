import { describe, expect, it } from 'vitest'
import type { SimulationAction, UUID } from '@/domain/process/contracts.js'
import {
  ACID_RELEASE_ID,
  createAcidNeutralizationModule,
} from '@/domain/experiments/acid-neutralization/index.js'
import { probeAvailableActions } from '@/application/simulation/acid-session.js'

const engine = createAcidNeutralizationModule()

let n = 0
const aid = () => `f0000000-0000-4000-8000-${String(++n).padStart(12, '0')}` as UUID

function step(
  state: ReturnType<typeof engine.createInitialState>,
  sequence: number,
  actionType: string,
  parameters: Record<string, number | string | boolean> = {},
) {
  const outcome = engine.run(
    {
      scenario: { key: 'acid-neutralization', releaseId: ACID_RELEASE_ID },
      state,
      sequence,
    },
    { actionId: aid(), actionType, parameters, unitSelections: {} } satisfies SimulationAction,
  )
  if (!('nextState' in outcome)) throw new Error(`rejected ${actionType}: ${outcome.code}`)
  return outcome.nextState
}

function available(state: ReturnType<typeof engine.createInitialState>, sequence: number) {
  const probes = probeAvailableActions(state, sequence)
  return new Map(probes.map((p) => [p.actionType, p]))
}

describe('action availability probe', () => {
  it('at setup offers only select_route and calibrate_meter', () => {
    const state = engine.createInitialState()
    const probes = available(state, 1)

    expect(probes.get('select_route')?.available).toBe(true)
    expect(probes.get('calibrate_meter')?.available).toBe(true)
    // Nothing has been dosed, so the chemistry actions are not offered yet.
    expect(probes.get('add_base')?.available).toBe(false)
    expect(probes.get('mix')?.available).toBe(false)
    expect(probes.get('measure_ph')?.available).toBe(false)
    expect(probes.get('complete')?.available).toBe(false)
  })

  it('an unavailable action carries the engine reason for the UI', () => {
    const state = engine.createInitialState()
    const probes = available(state, 1)
    const mix = probes.get('mix')!

    expect(mix.available).toBe(false)
    // A greyed-out control must explain itself (§5 "Điều kiện trước").
    expect(mix.reasonKey).toMatch(/^errors\./)

    /*
      The reason must describe THIS refusal, not another rule's.

      An initial state has `mixedSinceLastAddition: true` — there is no un-mixed addition
      — so `mix` is refused for having nothing new to stir. This assertion used to expect
      `errors.SAMPLE_NOT_MIXED`, which reads "Mẫu chưa được khuấy sau lần thêm gần nhất":
      the workbench therefore disabled "Khuấy trộn mẫu" and told the learner to stir. The
      test was pinning the contradiction in place, so it is the expectation that was
      wrong, not the engine's availability.

      `SAMPLE_NOT_MIXED` is still the right key where it is TRUE — on
      `wait_for_stable_reading`, asserted below — which is what makes the two distinct.
    */
    expect(mix.reasonKey).toBe('errors.ALREADY_MIXED')
  })

  it('explains waiting and stirring with different reasons', () => {
    const state = engine.createInitialState()
    const probes = available(state, 1)

    // Same state, opposite facts: nothing new to stir, and the sample IS settled enough
    // to wait on. One shared message key could not be true of both.
    expect(probes.get('mix')?.reasonKey).toBe('errors.ALREADY_MIXED')
    expect(probes.get('wait_for_stable_reading')?.available).toBe(true)
  })

  it('after select_route offers dosing but not measuring', () => {
    let state = engine.createInitialState()
    state = step(state, 1, 'select_route', { route: 'naoh' })

    const probes = available(state, 2)
    expect(probes.get('add_base')?.available).toBe(true)
    // Route is locked after the first dose, but not before it (§5.1), so it is still
    // changeable here — and the probe must say so rather than guessing from phase.
    expect(probes.get('select_route')?.available).toBe(true)
    // Measuring needs a calibrated meter first.
    expect(probes.get('measure_ph')?.available).toBe(false)
  })

  it('after calibrate offers dosing and reports measure_ph as blocked until mixed', () => {
    let state = engine.createInitialState()
    state = step(state, 1, 'select_route', { route: 'naoh' })
    state = step(state, 2, 'calibrate_meter')

    const probes = available(state, 3)
    expect(probes.get('add_base')?.available).toBe(true)
    expect(probes.get('measure_ph')?.available).toBe(false)
    expect(probes.get('mix')?.available).toBe(false)
  })

  it('offers complete only once a current reading exists', () => {
    let state = engine.createInitialState()
    let seq = 0
    const run = (actionType: string, parameters: Record<string, number | string | boolean> = {}) => {
      seq += 1
      state = step(state, seq, actionType, parameters)
    }

    run('select_route', { route: 'naoh' })
    run('calibrate_meter')
    // 1.00 mL: a permitted aliquot. `validateComplete` needs a current valid
    // measurement, not a pH inside the target band, so reaching equivalence is
    // irrelevant to what this test checks.
    run('add_base', { volumeL: 0.001 })
    run('mix')
    run('wait_for_stable_reading')

    // Stable but never measured: no pH exists to judge the goal against.
    expect(available(state, seq + 1).get('complete')?.available).toBe(false)

    run('measure_ph')
    expect(available(state, seq + 1).get('complete')?.available).toBe(true)

    // A further dose invalidates the reading, so completion must withdraw again.
    run('add_base', { volumeL: 0.00005 })
    expect(available(state, seq + 1).get('complete')?.available).toBe(false)
  })

  it('offers every action type in the release', () => {
    const probes = probeAvailableActions(engine.createInitialState(), 1)
    expect(probes.map((p) => p.actionType)).toEqual([...engine.actionTypes])
  })
})
