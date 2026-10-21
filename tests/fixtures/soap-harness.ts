import type { SimulationAction, UUID } from '@/domain/process/contracts.js'
import { runCommand } from '@/domain/process/lifecycle.js'
import { createInitialResourceLedger } from '@/domain/process/ledger.js'
import { createSoapModule } from '@/domain/experiments/soap/engine.js'
import { SOAP_PROFILE } from '@/domain/experiments/soap/model.js'

const module = createSoapModule()
const attemptId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID
const timestamp = new Date('2026-10-18T09:00:00Z')

export type SoapStepResult = ReturnType<ReturnType<typeof soapHarness>['step']>

/** Replays soap actions through the real command pipeline. Rejected actions leave the state unchanged. */
export function soapHarness() {
  let state = module.createInitialState()
  let ledger = createInitialResourceLedger()
  let sequence = 0
  function step(
    actionType: string,
    parameters: SimulationAction['parameters'] = {},
    unitSelections: SimulationAction['unitSelections'] = {},
  ) {
    const action: SimulationAction = {
      actionId: ('c0000000-0000-4000-8000-' + String(sequence + 1).padStart(12, '0')) as UUID,
      actionType, parameters, unitSelections,
    }
    const outcome = runCommand(module, {
      attemptId, scenario: { key: 'cold-process-soap', releaseId: SOAP_PROFILE.releaseId },
      action, sequence: sequence + 1,
      expectedRevision: sequence, currentRevision: sequence, state, ledger,
    }, timestamp)
    if (outcome.ok) {
      sequence += 1
      state = outcome.event.stateAfter
      ledger = outcome.event.ledgerAfter
    }
    return outcome
  }
  return { step, get state() { return state } }
}

export type SoapHarness = ReturnType<typeof soapHarness>

export function accepted(result: SoapStepResult) {
  if (!result.ok) throw new Error('Rejected: ' + result.error.code)
  return result.event
}

/** Olive reference amounts at 5 % superfat: 64.6 g NaOH in 175 mL water, 549.45 mL oil (~500 g). */
export const REFERENCE = { naohG: 64.6, waterMl: 175, lyeMl: 205.33, oilMl: 549.45 } as const

export function chooseOlive(h: SoapHarness) {
  accepted(h.step('set_oil', { oilType: 'olive' }))
}

export function prepareLye(h: SoapHarness) {
  accepted(h.step('pour_water', { waterVolumeL: REFERENCE.waterMl }, { waterVolumeL: 'mL' }))
  accepted(h.step('pour_naoh', { naohMassG: REFERENCE.naohG }, { naohMassG: 'g' }))
  accepted(h.step('cool_lye'))
}

export function prepareOil(h: SoapHarness) {
  accepted(h.step('pour_oil', { oilVolumeL: REFERENCE.oilMl }, { oilVolumeL: 'mL' }))
}

export function pourBoth(h: SoapHarness) {
  accepted(h.step('pour_to_mix', { from: 'W', volumeL: REFERENCE.lyeMl }, { volumeL: 'mL' }))
  accepted(h.step('pour_to_mix', { from: 'O', volumeL: REFERENCE.oilMl }, { volumeL: 'mL' }))
}

/** Pour to mold, wait 24 h, unmold, cure 4 weeks and measure: records one sample. */
export function moldAndMeasure(h: SoapHarness) {
  for (const type of ['pour_to_mold', 'advance_gel', 'unmold', 'advance_cure', 'measure_sample']) accepted(h.step(type))
}

/** A whole sample from empty cups: lye, oil, mix, stir, optionally wait for trace, mold and measure. */
export function runSample(h: SoapHarness, { trace = true }: { trace?: boolean } = {}) {
  prepareLye(h)
  prepareOil(h)
  pourBoth(h)
  accepted(h.step('stir', { mode: 'machine' }))
  if (trace) accepted(h.step('advance_trace'))
  moldAndMeasure(h)
}
