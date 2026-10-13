import { describe, expect, it } from 'vitest'
import reference from '../fixtures/jar-test/reference-cases.json'
import type { SimulationAction, UUID } from '@/domain/process/contracts.js'
import { runCommand, normalizeParameters, replayEvents, type StoredEvent } from '@/domain/process/lifecycle.js'
import { createInitialResourceLedger } from '@/domain/process/ledger.js'
import { stateHash } from '@/domain/process/hashing.js'
import { CANONICAL_UNITS, convert, lookupUnit } from '@/domain/units/index.js'
import { createJarModule } from '@/domain/experiments/jar-test/engine.js'
import {
  JAR_PROFILE, predictJarRemoval, type JarState,
} from '@/domain/experiments/jar-test/model.js'

const module = createJarModule()
const attemptId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID
const timestamp = new Date('2026-10-13T09:00:00Z')

function harness() {
  let state = module.createInitialState()
  let ledger = createInitialResourceLedger()
  let sequence = 0
  const events: StoredEvent<JarState>[] = []

  function step(
    actionType: string,
    parameters: SimulationAction['parameters'] = {},
    unitSelections: SimulationAction['unitSelections'] = {},
  ) {
    const action: SimulationAction = {
      actionId: ('c0000000-0000-4000-8000-' +
        String(sequence + 1).padStart(12, '0')) as UUID,
      actionType, parameters, unitSelections,
    }
    const outcome = runCommand(module, {
      attemptId, scenario: { key: 'jar-test', releaseId: JAR_PROFILE.releaseId },
      action, sequence: sequence + 1,
      expectedRevision: sequence, currentRevision: sequence, state, ledger,
    }, timestamp)
    if (outcome.ok) {
      sequence += 1
      state = outcome.event.stateAfter
      ledger = outcome.event.ledgerAfter
      events.push({
        sequence, actionType, undoOfSequence: null,
        stateAfter: state, stateAfterHash: outcome.event.stateAfterHash,
        resourceDelta: outcome.event.resourceDelta,
      })
    }
    return outcome
  }

  return {
    step,
    get state() { return state },
    get ledger() { return ledger },
    get events() { return events },
    goal() { return module.evaluateGoalStatus(state, ledger) },
  }
}

function accepted(result: ReturnType<ReturnType<typeof harness>['step']>) {
  expect(result.ok).toBe(true)
  if (!result.ok) throw new Error('Unexpected domain refusal: ' + result.error.code)
  return result.event
}

function prepareTwo() {
  const h = harness()
  accepted(h.step('prepare_cup', { cupId: 'A', initialPh: 9 }))
  accepted(h.step('prepare_cup', { cupId: 'B', initialPh: 5 }))
  accepted(h.step('measure_initial'))
  accepted(h.step('add_coagulant', { cupId: 'A', incrementMgL: 150 }, { incrementMgL: 'mg/L' }))
  accepted(h.step('add_coagulant', { cupId: 'B', incrementMgL: 150 }, { incrementMgL: 'mg/L' }))
  return h
}

function finishProgram(h: ReturnType<typeof harness>) {
  for (const phase of ['rapid', 'slow', 'settling']) {
    accepted(h.step('run_phase', { phase }))
  }
}

describe('Jar Test Task 1 numerical profile', () => {
  it('predicts_published_coded_values from independent printed-coefficient fixtures', () => {
    expect(reference.provenance.doi).toBe(JAR_PROFILE.sourceDoi)
    for (const row of reference.cases) {
      expect(Math.abs(
        predictJarRemoval(row.initialPh, row.doseMgL) - row.expectedRemovalPercent,
      )).toBeLessThanOrEqual(reference.tolerances.printedEquationAbsolutePercentagePoints)
    }
    expect(reference.tolerances.empiricalModelErrorPercentagePoints).toBeNull()
  })

  it('rejects nonfinite and out-of-model inputs, without clamping', () => {
    for (const [ph, dose] of [
      [Number.NaN, 150], [Infinity, 150], [7, Number.NaN],
      [4.99, 150], [9.01, 150], [7, 0], [7, 250.01],
    ]) expect(() => predictJarRemoval(ph, dose)).toThrow(RangeError)
  })
})

describe('Jar Test Task 1 actions, units and ledger', () => {
  it('dose_is_additive_and_irreversible', () => {
    const h = harness()
    accepted(h.step('prepare_cup', { cupId: 'A', initialPh: 7 }))
    accepted(h.step('add_coagulant', { cupId: 'A', incrementMgL: 50 }, { incrementMgL: 'mg/L' }))
    accepted(h.step('add_coagulant', { cupId: 'A', incrementMgL: 100 }, { incrementMgL: 'mg/L' }))
    expect(h.state.cups.A?.totalDoseMgL).toBe(150)
    expect(h.state.cups.A?.compositionRevision).toBe(2)
    expect(h.ledger.reagents.alum?.unit).toBe('g')
    expect(h.ledger.reagents.alum?.amount).toBeCloseTo(0.075, 12)
    const before = stateHash(h.state)
    const beforeLedger = structuredClone(h.ledger)
    const refused = h.step('add_coagulant', { cupId: 'A', incrementMgL: 150 }, { incrementMgL: 'mg/L' })
    expect(refused.ok).toBe(false)
    if (!refused.ok) expect(refused.error.code).toBe('TOTAL_DOSE_EXCEEDED')
    expect(stateHash(h.state)).toBe(before)
    expect(h.ledger).toEqual(beforeLedger)
    expect(h.events).toHaveLength(3)
  })

  it('normalizes mass concentration only, keeping legacy density g/L', () => {
    expect(CANONICAL_UNITS.mass_concentration).toBe('mg/L')
    expect(lookupUnit('mg/L')?.quantity).toBe('mass_concentration')
    expect(convert(250, 'mg/L', 'mg/L')).toBe(250)
    expect(lookupUnit('g/L')?.quantity).toBe('density')
    expect(convert(1, 'g/L', 'g/mL')).toBeCloseTo(0.001, 12)
    const okay = normalizeParameters({ incrementMgL: 50 },
      { incrementMgL: 'mg/L' }, module.parameterQuantities)
    expect(okay.ok).toBe(true)
    if (okay.ok) expect(okay.parameters.incrementMgL).toBe(50)
    for (const unit of ['g', 'g/L']) {
      const wrong = normalizeParameters({ incrementMgL: 50 },
        { incrementMgL: unit }, module.parameterQuantities)
      expect(wrong.ok).toBe(false)
      if (!wrong.ok) expect(wrong.error.code).toBe('UNIT_QUANTITY_MISMATCH')
    }
  })

  it('does not mutate state or ledger on a bad unit in the full pipeline', () => {
    const h = harness()
    accepted(h.step('prepare_cup', { cupId: 'A', initialPh: 7 }))
    const beforeState = stateHash(h.state)
    const beforeLedger = structuredClone(h.ledger)
    const refused = h.step('add_coagulant',
      { cupId: 'A', incrementMgL: 100 }, { incrementMgL: 'g' })
    expect(refused.ok).toBe(false)
    if (!refused.ok) expect(refused.error.code).toBe('UNIT_QUANTITY_MISMATCH')
    expect(stateHash(h.state)).toBe(beforeState)
    expect(h.ledger).toEqual(beforeLedger)
    expect(h.events).toHaveLength(1)
  })

  it('rejects invalid cups, duplicate preparation, unsupported pH and dose increments', () => {
    const h = harness()
    for (const [params, code] of [
      [{ cupId: 'G', initialPh: 7 }, 'INVALID_CUP_ID'],
      [{ cupId: 'A', initialPh: 6 }, 'INITIAL_PH_OUT_OF_PROFILE'],
      [{ cupId: 'A', initialPh: Number.NaN }, 'INITIAL_PH_OUT_OF_PROFILE'],
    ] as const) {
      const refused = h.step('prepare_cup', params)
      expect(refused.ok).toBe(false)
      if (!refused.ok) expect(refused.error.code).toBe(code)
    }
    accepted(h.step('prepare_cup', { cupId: 'A', initialPh: 7 }))
    expect(h.step('prepare_cup', { cupId: 'A', initialPh: 7 }).ok).toBe(false)
    for (const incrementMgL of [0, 75, Number.NaN, Infinity, -50]) {
      expect(h.step('add_coagulant', { cupId: 'A', incrementMgL }).ok).toBe(false)
    }
    expect(h.state.cups.A?.totalDoseMgL).toBe(0)
    for (const id of ['B', 'C', 'D', 'E', 'F']) {
      accepted(h.step('prepare_cup', { cupId: id, initialPh: 5 }))
    }
    expect(Object.keys(h.state.cups)).toHaveLength(6)
    expect(h.step('prepare_cup', { cupId: 'G', initialPh: 5 }).ok).toBe(false)
  })

  it('rejects wrong phase, arbitrary rpm/duration, and locks prep/dose after rapid', () => {
    const h = harness()
    accepted(h.step('prepare_cup', { cupId: 'A', initialPh: 7 }))
    expect(h.step('run_phase', { phase: 'slow' }).ok).toBe(false)
    expect(h.step('run_phase', { phase: 'rapid' }).ok).toBe(false)
    accepted(h.step('measure_initial'))
    accepted(h.step('add_coagulant', { cupId: 'A', incrementMgL: 50 }))
    expect(h.step('run_phase', { phase: 'rapid', rpm: 100 }).ok).toBe(false)
    expect(h.step('run_phase', { phase: 'rapid', durationSeconds: 60 }).ok).toBe(false)
    accepted(h.step('run_phase', { phase: 'rapid' }))
    expect(h.state.elapsedSeconds).toBe(60)
    expect(h.step('run_phase', { phase: 'rapid' }).ok).toBe(false)
    expect(h.step('add_coagulant', { cupId: 'A', incrementMgL: 50 }).ok).toBe(false)
    expect(h.step('prepare_cup', { cupId: 'B', initialPh: 7 }).ok).toBe(false)
    accepted(h.step('run_phase', { phase: 'slow' }))
    expect(h.state.elapsedSeconds).toBe(1260)
    accepted(h.step('run_phase', { phase: 'settling' }))
    expect(h.state.elapsedSeconds).toBe(3060)
    expect(h.step('run_phase', { phase: 'slow' }).ok).toBe(false)
  })
})

describe('Jar Test Task 1 measurement, submission and replay', () => {
  it('unmeasured_is_not_zero and a premature sample remains invalid/null', () => {
    const h = prepareTwo()
    accepted(h.step('measure_final', { cupId: 'B' })) // before rapid
    expect(h.state.cups.B?.measurements[0]?.valid).toBe(false)
    expect(h.state.cups.B?.measurements[0]?.valueNtu).toBeNull()
    expect(h.state.cups.A?.measurements).toHaveLength(0)
    expect(h.goal().evaluable).toBe(false)
    finishProgram(h)
    accepted(h.step('measure_final', { cupId: 'A' }))
    accepted(h.step('record_result', { cupId: 'A', removalPercent: 86.79 }))
    accepted(h.step('select_result', { cupId: 'A' }))
    accepted(h.step('complete'))
    const a = h.state.cups.A?.measurements[0]
    expect(a?.valid).toBe(true)
    expect(a?.valueNtu).toBeCloseTo(125 * (1 - 0.8679), 9)
    expect(h.state.cups.B?.measurements[0]?.valueNtu).toBeNull()
    const goal = h.goal()
    expect(goal.evaluable).toBe(true)
    expect(goal.goalMet).toBe(true)
    expect(goal.primaryCriteria.find((x) => x.key === 'jar.cup.B.removal')?.evaluable).toBe(false)
    expect(goal.primaryCriteria.find((x) => x.key === 'jar.cup.A.removal')?.met).toBe(true)
  })

  it('complete is allowed but cannot report success without valid measurements and submission', () => {
    const h = harness()
    accepted(h.step('prepare_cup', { cupId: 'A', initialPh: 9 }))
    accepted(h.step('measure_final', { cupId: 'A' }))
    accepted(h.step('complete'))
    expect(h.goal().evaluable).toBe(false)
    expect(h.goal().goalMet).toBe(false)
    expect(h.state.cups.A?.measurements[0]?.valueNtu).toBeNull()
    expect(h.step('complete').ok).toBe(false)
    const measured = prepareTwo()
    finishProgram(measured)
    accepted(measured.step('measure_final', { cupId: 'A' }))
    accepted(measured.step('select_result', { cupId: 'A' }))
    accepted(measured.step('complete'))
    expect(measured.goal().evaluable).toBe(false) // arithmetic answer absent
  })

  it('separates a wrong learner answer from physical NTU and the other valid cup', () => {
    const h = prepareTwo()
    finishProgram(h)
    accepted(h.step('measure_final', { cupId: 'A' }))
    accepted(h.step('measure_final', { cupId: 'B' }))
    const bNtu = h.state.cups.B?.measurements[0]?.valueNtu
    const aNtu = h.state.cups.A?.measurements[0]?.valueNtu
    accepted(h.step('record_result', { cupId: 'A', removalPercent: 20 }))
    accepted(h.step('select_result', { cupId: 'A' }))
    accepted(h.step('complete'))
    expect(h.goal().evaluable).toBe(true)
    expect(h.goal().goalMet).toBe(false)
    expect(h.goal().primaryCriteria.find((x) => x.key === 'jar.cup.A.removal')?.met).toBe(true)
    expect(h.goal().efficiencyCriteria.find((x) => x.key === 'jar.cup.A.arithmetic')?.met).toBe(false)
    expect(h.goal().primaryCriteria.find((x) => x.key === 'jar.cup.B.removal')?.evaluable).toBe(true)
    expect(h.state.cups.A?.measurements[0]?.valueNtu).toBe(aNtu)
    expect(h.state.cups.B?.measurements[0]?.valueNtu).toBe(bNtu)
  })

  it('replays a fixed event sequence to the same state/ledger deterministically', () => {
    const first = prepareTwo()
    finishProgram(first)
    accepted(first.step('measure_final', { cupId: 'A' }))
    accepted(first.step('record_result', { cupId: 'A', removalPercent: 86.79 }))
    accepted(first.step('select_result', { cupId: 'A' }))
    accepted(first.step('complete'))
    const replay = replayEvents(module.createInitialState(),
      createInitialResourceLedger(), first.events)
    expect(replay.ok).toBe(true)
    if (!replay.ok) return
    expect(stateHash(replay.state)).toBe(stateHash(first.state))
    expect(replay.ledger).toEqual(first.ledger)
    const second = prepareTwo()
    finishProgram(second)
    accepted(second.step('measure_final', { cupId: 'A' }))
    accepted(second.step('record_result', { cupId: 'A', removalPercent: 86.79 }))
    accepted(second.step('select_result', { cupId: 'A' }))
    accepted(second.step('complete'))
    expect(stateHash(second.state)).toBe(stateHash(first.state))
  })
})
