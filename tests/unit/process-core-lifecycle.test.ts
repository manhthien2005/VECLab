import { describe, expect, it } from 'vitest'
import type { SimulationAction, UUID } from '@/domain/process/contracts.js'
import { normalizeParameters, runCommand, replayEvents, undoLastAction, type PendingCommand, type StoredEvent } from '@/domain/process/lifecycle.js'
import { createInitialResourceLedger } from '@/domain/process/ledger.js'
import { stateHash, requestFingerprint } from '@/domain/process/hashing.js'
import { createJarModule } from '@/domain/experiments/jar-test/engine.js'
import { createInitialJarState, JAR_PROFILE, type JarState } from '@/domain/experiments/jar-test/model.js'

const module = createJarModule()
const ATTEMPT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID
const RELEASE_ID = JAR_PROFILE.releaseId
const OCCURRED_AT = new Date('2026-10-16T08:00:00.000Z')
const VOLUME_QUANTITIES = { volumeL: 'volume' } as const
let counter = 0
function actionId(): UUID {
  return ('c0000000-0000-4000-8000-' + String(++counter).padStart(12, '0')) as UUID
}
function action(type = 'prepare_cup', parameters: SimulationAction['parameters'] = { cupId: 'A', initialPh: 7 }): SimulationAction {
  return { actionId: actionId(), actionType: type, parameters, unitSelections: {} }
}
function command(overrides: Partial<PendingCommand<JarState>> = {}): PendingCommand<JarState> {
  return { attemptId: ATTEMPT_ID, scenario: { key: 'jar-test', releaseId: RELEASE_ID }, expectedRevision: 0,
    currentRevision: 0, sequence: 1, state: createInitialJarState(), ledger: createInitialResourceLedger(), action: action(), ...overrides }
}
function prepared() {
  const result = runCommand(module, command(), OCCURRED_AT)
  if (!result.ok) throw new Error('Valid cup preparation was refused')
  return result.event
}
function chain(): StoredEvent<JarState>[] {
  const first = prepared()
  const second = runCommand(module, command({ state: first.stateAfter, ledger: first.ledgerAfter, sequence: 2,
    currentRevision: 1, expectedRevision: 1, action: action('add_coagulant', { cupId: 'A', incrementMgL: 50 }) }), OCCURRED_AT)
  if (!second.ok) throw new Error('Valid dose was refused')
  return [first, second.event].map(e => ({ sequence: e.sequence, actionType: e.actionType, undoOfSequence: null,
    stateAfter: e.stateAfter, stateAfterHash: e.stateAfterHash, resourceDelta: e.resourceDelta }))
}

describe('runCommand with the current Jar module', () => {
  it('builds a complete, deterministic committable event', () => {
    const input = command()
    const result = runCommand(module, input, OCCURRED_AT)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.event).toMatchObject({ sequence: 1, actionType: 'prepare_cup', occurredAt: OCCURRED_AT })
    expect(result.event.stateBeforeHash).toBe(stateHash(createInitialJarState()))
    expect(result.event.stateAfterHash).toBe(stateHash(result.event.stateAfter))
    expect(result.event.requestFingerprint).toMatch(/^[a-f0-9]{64}$/)
    expect(result.event.stateAfter.cups.A?.initialPh).toBe(7)
    const later = runCommand(module, input, new Date('2030-01-01'))
    expect(later.ok && later.event.stateAfterHash).toBe(result.event.stateAfterHash)
    expect(later.ok && later.event.requestFingerprint).toBe(result.event.requestFingerprint)
  })
  it('refuses a withdrawn release', () => {
    const result = runCommand(module, command({ scenario: { key: 'jar-test', releaseId: 'jar-test@99' } }), OCCURRED_AT)
    expect(result).toMatchObject({ ok: false, error: { code: 'UNSUPPORTED_SCENARIO_RELEASE' } })
  })
  it('refuses a stale revision even if the caller adjusts sequence', () => {
    for (const sequence of [1, 2]) {
      expect(runCommand(module, command({ expectedRevision: 0, currentRevision: 1, sequence }), OCCURRED_AT))
        .toMatchObject({ ok: false, error: { code: 'REVISION_CONFLICT' } })
    }
  })
  it('refuses an invalid action without changing the input state', () => {
    const input = command({ action: action('add_coagulant', { cupId: 'A', incrementMgL: 50 }) })
    const before = structuredClone(input.state)
    expect(runCommand(module, input, OCCURRED_AT).ok).toBe(false)
    expect(input.state).toEqual(before)
  })
  it('accepts canonical dose units and records reagent use', () => {
    const first = prepared()
    const result = runCommand(module, command({ state: first.stateAfter, ledger: first.ledgerAfter,
      sequence: 2, expectedRevision: 1, currentRevision: 1,
      action: { ...action('add_coagulant', { cupId: 'A', incrementMgL: 50 }), unitSelections: { incrementMgL: 'mg/L' } },
    }), OCCURRED_AT)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.event.stateAfter.cups.A?.totalDoseMgL).toBe(50)
    expect(result.event.resourceDelta.reagents.alum).toBeDefined()
    expect(result.event.ledgerAfter.operationCount).toBe(2)
  })
})

describe('replayEvents with current Jar snapshots', () => {
  it('restores state and cumulative resources', () => {
    const events = chain()
    const result = replayEvents(createInitialJarState(), createInitialResourceLedger(), events)
    expect(result).toMatchObject({ ok: true, state: { cups: { A: { initialPh: 7, totalDoseMgL: 50 } } }, eventsVerified: 2 })
    if (!result.ok) return
    expect(result.ledger.operationCount).toBe(2)
    expect(result.ledger.reagents).not.toEqual({})
  })
  it('refuses corrupted state hashes and gapped or duplicated sequences', () => {
    const events = chain()
    const first = events[0]!
    for (const altered of [[{ ...first, stateAfterHash: 'tampered' }], [{ ...first, sequence: 2 }], [first, first]]) {
      expect(replayEvents(createInitialJarState(), createInitialResourceLedger(), altered).ok).toBe(false)
    }
  })
  it('returns the initial state and ledger for an empty chain', () => {
    expect(replayEvents(createInitialJarState(), createInitialResourceLedger(), []))
      .toMatchObject({ ok: true, state: createInitialJarState(), ledger: createInitialResourceLedger(), eventsVerified: 0 })
  })
})

describe('normalizeParameters', () => {
  it('converts a declared unit to canonical', () => {
    const result = normalizeParameters({ volumeL: 5 }, { volumeL: 'mL' }, VOLUME_QUANTITIES)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    // 5 mL -> 0.005 L. The engine only ever sees litres, so a unit the learner
    // picked cannot change what the chemistry computes.
    expect(result.parameters.volumeL).toBeCloseTo(0.005, 12)
  })

  it('leaves parameters without a declared unit untouched', () => {
    const result = normalizeParameters({ route: 'naoh', flag: true }, {}, VOLUME_QUANTITIES)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.parameters).toEqual({ route: 'naoh', flag: true })
  })

  it('rejects a unit declared for a parameter with no quantity', () => {
    // `route` is a choice, not a quantity. Accepting a unit for it would mean
    // trusting a number whose unit nobody defined.
    const result = normalizeParameters({ route: 'naoh' }, { route: 'mL' }, VOLUME_QUANTITIES)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe('UNDECLARED_PARAMETER_UNIT')
  })

  it('rejects an unknown unit instead of guessing', () => {
    const result = normalizeParameters({ volumeL: 5 }, { volumeL: 'gallons' }, VOLUME_QUANTITIES)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe('UNKNOWN_UNIT')
  })

  it('rejects a unit that crosses quantity', () => {
    // The dangerous case: toCanonical(5, 'g') happily returns 5, so without the
    // quantity check a 5 mL dose sent with unit 'g' would reach the engine as
    // 5 LITRES — a 1000x error that still converges to a plausible pH.
    const result = normalizeParameters({ volumeL: 5 }, { volumeL: 'g' }, VOLUME_QUANTITIES)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe('UNIT_QUANTITY_MISMATCH')
    expect(result.error.data.expectedCanonicalUnit).toBe('L')
  })
})

describe('undoLastAction', () => {
  function storedChain(actionTypes: string[]): StoredEvent<JarState>[] {
    // Hashes are computed from the states so replay verification passes; the
    // states themselves only need to be self-consistent for these checks.
    return actionTypes.map((actionType, index) => {
      const stateAfter = {
        ...createInitialJarState(),
        elapsedSeconds: index + 1,
      }
      return {
        sequence: index + 1,
        actionType,
        // These are the actions an undo MAY revert, not undo events themselves.
        undoOfSequence: null,
        stateAfter,
        stateAfterHash: stateHash(stateAfter),
        resourceDelta: {
          reagents: {},
          waterLiters: 0,
          operationCount: 1,
          relativeCostIndexDelta: null,
          safetyPenalties: [],
          secondaryWaste: {},
        },
      }
    })
  }

  it('undoes the last action when the module declares it undoable', () => {
    const events = storedChain(['prepare_cup'])
    const outcome = undoLastAction(
      events,
      createInitialJarState(),
      createInitialResourceLedger(),
      ['prepare_cup'],
    )

    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    expect(outcome.undoOfSequence).toBe(1)
    expect(outcome.state.cups).toEqual({})
  })

  it('refuses to undo an irreversible action', () => {
    // Chemistry that has been added cannot be un-reacted (spec §5.1). Only
    // prepare_cup is undoable in this scenario, and only as the last action.
    const events = storedChain(['prepare_cup', 'add_coagulant'])
    const outcome = undoLastAction(
      events,
      createInitialJarState(),
      createInitialResourceLedger(),
      ['prepare_cup'],
    )

    expect(outcome.ok).toBe(false)
    if (outcome.ok) return
    expect(outcome.error.code).toBe('ACTION_NOT_UNDOABLE')
    expect(outcome.error.data.actionType).toBe('add_coagulant')
  })

  it('decides reversibility from the chain, not from a caller claim', () => {
    // The signature takes no action-type argument, so a caller cannot claim the
    // last action was `prepare_cup` while the chain records `add_coagulant`. This is
    // the guarantee the old 7-argument form could not make.
    const events = storedChain(['prepare_cup', 'add_coagulant'])
    const undoable = ['prepare_cup'] as const

    const outcome = undoLastAction(
      events,
      createInitialJarState(),
      createInitialResourceLedger(),
      undoable,
    )
    expect(outcome.ok).toBe(false)
  })

  it('returns the ledger as it stood before the undone action', () => {
    const events = storedChain(['prepare_cup', 'measure_initial'])
    const outcome = undoLastAction(
      events,
      createInitialJarState(),
      createInitialResourceLedger(),
      ['measure_initial'],
    )

    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    // Only the first event remains, so one operation is counted.
    expect(outcome.ledger.operationCount).toBe(1)
  })

  it('refuses to undo an empty chain', () => {
    const outcome = undoLastAction(
      [],
      createInitialJarState(),
      createInitialResourceLedger(),
      ['prepare_cup'],
    )
    expect(outcome.ok).toBe(false)
    if (outcome.ok) return
    expect(outcome.error.code).toBe('NOTHING_TO_UNDO')
  })

  it('refuses to undo a corrupted chain', () => {
    const events = storedChain(['prepare_cup'])
    const corrupted = [{ ...events[0], stateAfterHash: 'deadbeef' }] as StoredEvent<JarState>[]

    const outcome = undoLastAction(
      corrupted,
      createInitialJarState(),
      createInitialResourceLedger(),
      ['prepare_cup'],
    )
    expect(outcome.ok).toBe(false)
  })
})

describe('fingerprint stability', () => {
  it('is independent of object key order', () => {
    const a = requestFingerprint({
      attemptId: ATTEMPT_ID,
      scenarioReleaseId: RELEASE_ID,
      actionType: 'add_coagulant',
      normalizedParameters: { volumeL: 0.005, flag: true },
      canonicalUnits: { volumeL: 'L' },
    })
    // Same values, different insertion order. JCS sorts keys, so the fingerprint
    // must not change — otherwise a retry could double-commit.
    const b = requestFingerprint({
      canonicalUnits: { volumeL: 'L' },
      normalizedParameters: { flag: true, volumeL: 0.005 },
      actionType: 'add_coagulant',
      scenarioReleaseId: RELEASE_ID,
      attemptId: ATTEMPT_ID,
    })

    expect(a).toBe(b)
  })

  it('changes when any fingerprint field changes', () => {
    const base = {
      attemptId: ATTEMPT_ID,
      scenarioReleaseId: RELEASE_ID,
      actionType: 'add_coagulant',
      normalizedParameters: { volumeL: 0.005 },
      canonicalUnits: { volumeL: 'L' },
    }

    expect(requestFingerprint(base)).not.toBe(
      requestFingerprint({ ...base, normalizedParameters: { volumeL: 0.001 } }),
    )
    expect(requestFingerprint(base)).not.toBe(
      requestFingerprint({ ...base, actionType: 'mix' }),
    )
    expect(requestFingerprint(base)).not.toBe(
      requestFingerprint({ ...base, scenarioReleaseId: 'jar-test@99' }),
    )
  })

  it('rejects a non-finite parameter rather than hashing garbage', () => {
    expect(() =>
      requestFingerprint({
        attemptId: ATTEMPT_ID,
        scenarioReleaseId: RELEASE_ID,
        actionType: 'add_coagulant',
        normalizedParameters: { volumeL: Number.NaN },
        canonicalUnits: {},
      }),
    ).toThrow()
  })
})
