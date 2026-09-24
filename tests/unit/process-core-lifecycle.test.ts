import { describe, expect, it } from 'vitest'

import type { SimulationAction, UUID } from '@/domain/process/contracts.js'
import {
  normalizeParameters,
  runCommand,
  replayEvents,
  undoLastAction,
  type PendingCommand,
  type StoredEvent,
} from '@/domain/process/lifecycle.js'
import { createInitialResourceLedger } from '@/domain/process/ledger.js'
import { stateHash, requestFingerprint } from '@/domain/process/hashing.js'
import {
  createAcidNeutralizationModule,
  benchmarkScenarioConfig,
  createAcidStateFor,
  ACID_RELEASE_ID,
} from '@/domain/experiments/acid-neutralization/index.js'
import type { AcidNeutralizationState } from '@/domain/experiments/acid-neutralization/index.js'

/**
 * Process Core lifecycle tests.
 *
 * The acid engine tests prove the chemistry; these prove the generic pipeline
 * (docs/system-architecture.md §6). The pipeline is what every scenario shares,
 * so a defect here is a defect in all of them.
 *
 * Tested guarantees:
 *   * units are normalized to canonical BEFORE the domain sees them (§5.1)
 *   * a rejected command commits nothing and returns a typed DomainError
 *   * the request fingerprint is stable across a retry, which is what makes a
 *     duplicate commit impossible (data model §12.1)
 *   * state hashes are computed over canonical JSON, so key order cannot change
 *     an event's identity
 *   * replay rebuilds state and detects a corrupted or gapped chain (§11)
 *   * undo is derived from the chain, so an irreversible action cannot be undone
 */

const module = createAcidNeutralizationModule()
const config = benchmarkScenarioConfig()
const ATTEMPT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID

let counter = 0
function actionId(): UUID {
  counter += 1
  return `c0000000-0000-4000-8000-${String(counter).padStart(12, '0')}` as UUID
}

function command(
  overrides: Partial<PendingCommand<AcidNeutralizationState>> & {
    action: SimulationAction
  },
): PendingCommand<AcidNeutralizationState> {
  return {
    attemptId: ATTEMPT_ID,
    scenario: { key: 'acid-neutralization', releaseId: ACID_RELEASE_ID },
    expectedRevision: 0,
    currentRevision: 0,
    sequence: 1,
    state: createAcidStateFor(config),
    ledger: createInitialResourceLedger(),
    ...overrides,
  }
}

const OCCURRED_AT = new Date('2026-09-10T08:00:00.000Z')

const VOLUME_QUANTITIES = { volumeL: 'volume' } as const

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

describe('runCommand', () => {
  it('runs an accepted action and returns a complete event record', () => {
    const outcome = runCommand(
      module,
      command({
        action: {
          actionId: actionId(),
          actionType: 'select_route',
          parameters: { route: 'naoh' },
          unitSelections: {},
        },
      }),
      OCCURRED_AT,
    )

    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return

    const event = outcome.event
    expect(event.sequence).toBe(1)
    expect(event.actionType).toBe('select_route')
    expect(event.stateBeforeHash).toBe(stateHash(createAcidStateFor(config)))
    expect(event.stateAfterHash).toBe(stateHash(event.stateAfter))
    expect(event.stateAfter.route).toBe('naoh')
    expect(event.occurredAt).toBe(OCCURRED_AT)
    expect(event.requestFingerprint).toMatch(/^[0-9a-f]{64}$/)
  })

  it('rejects a command against a different release', () => {
    const outcome = runCommand(
      module,
      command({
        scenario: { key: 'acid-neutralization', releaseId: 'acid-neutralization@2.0.0' },
        action: {
          actionId: actionId(),
          actionType: 'select_route',
          parameters: { route: 'naoh' },
          unitSelections: {},
        },
      }),
      OCCURRED_AT,
    )

    expect(outcome.ok).toBe(false)
    if (outcome.ok) return
    // `unsupported_release`, not `conflict`: refreshing can never fix a release
    // the deployment does not serve.
    expect(outcome.error.category).toBe('unsupported_release')
  })

  it('rejects a stale revision and commits nothing', () => {
    const state = createAcidStateFor(config)
    const outcome = runCommand(
      module,
      command({
        expectedRevision: 0,
        currentRevision: 3,
        state,
        action: {
          actionId: actionId(),
          actionType: 'select_route',
          parameters: { route: 'naoh' },
          unitSelections: {},
        },
      }),
      OCCURRED_AT,
    )

    expect(outcome.ok).toBe(false)
    if (outcome.ok) return
    expect(outcome.error.category).toBe('conflict')
    expect(outcome.error.code).toBe('REVISION_CONFLICT')
    // State must be untouched, not partially advanced.
    expect(state.route).toBeNull()
  })

  it('detects a stale revision the caller cannot fake by adjusting sequence', () => {
    // This is the case a `sequence - 1` derivation cannot express: same sequence,
    // but the store moved on underneath the client.
    const stale = runCommand(
      module,
      command({
        expectedRevision: 1,
        currentRevision: 2,
        sequence: 2,
        action: {
          actionId: actionId(),
          actionType: 'select_route',
          parameters: { route: 'naoh' },
          unitSelections: {},
        },
      }),
      OCCURRED_AT,
    )
    expect(stale.ok).toBe(false)

    const fresh = runCommand(
      module,
      command({
        expectedRevision: 2,
        currentRevision: 2,
        sequence: 3,
        action: {
          actionId: actionId(),
          actionType: 'select_route',
          parameters: { route: 'naoh' },
          unitSelections: {},
        },
      }),
      OCCURRED_AT,
    )
    expect(fresh.ok).toBe(true)
  })

  it('produces an identical fingerprint for a retried command', () => {
    // A network retry re-sends the same action id and payload. The fingerprint
    // must be identical so the database deduplicates it instead of double-dosing
    // the simulation (data model §12.1).
    const action: SimulationAction = {
      actionId: actionId(),
      actionType: 'add_base',
      parameters: { volumeL: 5 },
      unitSelections: { volumeL: 'mL' },
    }

    const first = runCommand(
      module,
      command({
        state: (() => {
          const selected = runCommand(
            module,
            command({
              action: {
                actionId: actionId(),
                actionType: 'select_route',
                parameters: { route: 'naoh' },
                unitSelections: {},
              },
            }),
            OCCURRED_AT,
          )
          if (!selected.ok) throw new Error('setup failed')
          return selected.event.stateAfter
        })(),
        sequence: 2,
        action,
      }),
      OCCURRED_AT,
    )
    const retry = runCommand(
      module,
      command({
        state: (() => {
          const selected = runCommand(
            module,
            command({
              action: {
                actionId: actionId(),
                actionType: 'select_route',
                parameters: { route: 'naoh' },
                unitSelections: {},
              },
            }),
            OCCURRED_AT,
          )
          if (!selected.ok) throw new Error('setup failed')
          return selected.event.stateAfter
        })(),
        sequence: 2,
        action,
      }),
      OCCURRED_AT,
    )

    expect(first.ok).toBe(true)
    expect(retry.ok).toBe(true)
    if (!first.ok || !retry.ok) return
    expect(first.event.requestFingerprint).toBe(retry.event.requestFingerprint)
    expect(first.event.stateAfterHash).toBe(retry.event.stateAfterHash)
  })

  it('normalizes units before the domain validates, so mL is accepted as a dose', () => {
    let state = createAcidStateFor(config)
    const selectRoute = runCommand(
      module,
      command({
        action: {
          actionId: actionId(),
          actionType: 'select_route',
          parameters: { route: 'naoh' },
          unitSelections: {},
        },
      }),
      OCCURRED_AT,
    )
    if (!selectRoute.ok) throw new Error('setup failed')
    state = selectRoute.event.stateAfter

    // The learner sends 5 mL. The engine must see 0.005 L, which IS a permitted
    // aliquot; 5 L is not. If normalization ran after validation this would be
    // rejected, and if it never ran the dose would be 1000x too large.
    const outcome = runCommand(
      module,
      command({
        state,
        sequence: 2,
        action: {
          actionId: actionId(),
          actionType: 'add_base',
          parameters: { volumeL: 5 },
          unitSelections: { volumeL: 'mL' },
        },
      }),
      OCCURRED_AT,
    )

    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    expect(outcome.event.normalizedInput.volumeL).toBeCloseTo(0.005, 12)
    expect(outcome.event.stateAfter.baseVolumeL).toBeCloseTo(0.005, 12)
  })

  it('returns the domain error when the action is not permitted', () => {
    const outcome = runCommand(
      module,
      command({
        action: {
          actionId: actionId(),
          actionType: 'measure_ph',
          parameters: {},
          unitSelections: {},
        },
      }),
      OCCURRED_AT,
    )

    expect(outcome.ok).toBe(false)
    if (outcome.ok) return
    expect(outcome.error.code).toBe('METER_NOT_CALIBRATED')
    expect(outcome.error.category).toBe('precondition_failed')
  })

  it('records the resource delta and advances the ledger', () => {
    const selectRoute = runCommand(
      module,
      command({
        action: {
          actionId: actionId(),
          actionType: 'select_route',
          parameters: { route: 'naoh' },
          unitSelections: {},
        },
      }),
      OCCURRED_AT,
    )
    if (!selectRoute.ok) throw new Error('setup failed')

    // Carry the ledger forward: the helper defaults to a fresh one, and a fresh
    // ledger cannot accumulate, so without this the assertion below would only
    // ever see one operation and prove nothing about accumulation.
    const outcome = runCommand(
      module,
      command({
        state: selectRoute.event.stateAfter,
        ledger: selectRoute.event.ledgerAfter,
        expectedRevision: 1,
        currentRevision: 1,
        sequence: 2,
        action: {
          actionId: actionId(),
          actionType: 'add_base',
          parameters: { volumeL: 0.005 },
          unitSelections: {},
        },
      }),
      OCCURRED_AT,
    )

    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    expect(outcome.event.resourceDelta.operationCount).toBe(1)
    expect(outcome.event.ledgerAfter.operationCount).toBe(
      selectRoute.event.ledgerAfter.operationCount + 1,
    )
    // Reagents are reported in mmol because the cost convention is per mmol.
    const naoh = outcome.event.ledgerAfter.reagents.naoh
    expect(naoh).toBeDefined()
    expect(naoh?.unit).toBe('mmol')
    expect(naoh?.amount).toBeCloseTo(0.05, 9)
  })

  it('does not depend on wall-clock time for determinism', () => {
    // `occurredAt` is supplied by the caller. Reading the clock inside the
    // pipeline would make replay non-reproducible, so two runs with the same
    // inputs must agree even when executed at different real times.
    const build = () =>
      runCommand(
        module,
        command({
          action: {
            actionId: actionId(),
            actionType: 'select_route',
            parameters: { route: 'naoh' },
            unitSelections: {},
          },
        }),
        OCCURRED_AT,
      )

    const first = build()
    const second = build()
    expect(first.ok && second.ok).toBe(true)
    if (!first.ok || !second.ok) return
    expect(first.event.stateAfterHash).toBe(second.event.stateAfterHash)
    // Fingerprints MATCH despite different action ids, and that is correct:
    // data model §7.6 defines the fingerprint over attempt id, release id, action
    // type, normalized parameters and canonical units only. Dedup is keyed on
    // (attempt_id, action_id) separately, so the fingerprint's job is to compare
    // the PAYLOAD of a retry — identical payload must hash identically.
    expect(first.event.requestFingerprint).toBe(second.event.requestFingerprint)

    // A different payload at the same attempt must not collide, or a genuine
    // second dose would be swallowed as a duplicate.
    const different = runCommand(
      module,
      command({
        action: {
          actionId: actionId(),
          actionType: 'select_route',
          parameters: { route: 'sodium-carbonate' },
          unitSelections: {},
        },
      }),
      OCCURRED_AT,
    )
    expect(different.ok).toBe(true)
    if (!different.ok) return
    expect(different.event.requestFingerprint).not.toBe(first.event.requestFingerprint)
  })
})

describe('replayEvents', () => {
  /** Build a stored chain by running real actions. */
  function buildChain(
    actionCount: number,
  ): { events: StoredEvent<AcidNeutralizationState>[]; finalState: AcidNeutralizationState } {
    const events: StoredEvent<AcidNeutralizationState>[] = []
    let state = createAcidStateFor(config)
    let sequence = 0

    const push = (action: SimulationAction) => {
      sequence += 1
      const outcome = runCommand(
        module,
        command({ state, sequence, action }),
        OCCURRED_AT,
      )
      if (!outcome.ok) throw new Error(`chain build failed at ${action.actionType}`)
      events.push({
        sequence: outcome.event.sequence,
        actionType: outcome.event.actionType,
        // buildChain only runs ordinary actions, never an undo, so nothing is reverted.
        undoOfSequence: null,
        stateAfter: outcome.event.stateAfter,
        stateAfterHash: outcome.event.stateAfterHash,
        resourceDelta: outcome.event.resourceDelta,
      })
      state = outcome.event.stateAfter
    }

    push({
      actionId: actionId(),
      actionType: 'select_route',
      parameters: { route: 'naoh' },
      unitSelections: {},
    })
    push({
      actionId: actionId(),
      actionType: 'calibrate_meter',
      parameters: {},
      unitSelections: {},
    })
    for (let index = 2; index < actionCount; index += 1) {
      push({
        actionId: actionId(),
        actionType: 'add_base',
        parameters: { volumeL: 0.005 },
        unitSelections: {},
      })
    }

    return { events, finalState: state }
  }

  it('rebuilds the same state a live run produced', () => {
    const { events, finalState } = buildChain(6)
    const replay = replayEvents(createAcidStateFor(config), createInitialResourceLedger(), events)

    expect(replay.ok).toBe(true)
    if (!replay.ok) return
    expect(stateHash(replay.state)).toBe(stateHash(finalState))
    expect(replay.eventsVerified).toBe(events.length)
  })

  it('accumulates the ledger across replayed events', () => {
    const { events } = buildChain(6)
    const replay = replayEvents(createAcidStateFor(config), createInitialResourceLedger(), events)

    expect(replay.ok).toBe(true)
    if (!replay.ok) return
    // 1 select + 1 calibrate + 4 add_base = 6 operations.
    expect(replay.ledger.operationCount).toBe(6)
    expect(replay.ledger.reagents.naoh?.amount).toBeCloseTo(0.2, 9)
  })

  it('detects a corrupted state snapshot', () => {
    const { events } = buildChain(6)
    const tampered = events.map((event, index) =>
      index === 3 ? { ...event, stateAfterHash: 'deadbeef' } : event,
    )

    const replay = replayEvents(createAcidStateFor(config), createInitialResourceLedger(), tampered)
    expect(replay.ok).toBe(false)
    if (replay.ok) return
    expect(replay.error.code).toBe('STATE_HASH_MISMATCH')
    expect(replay.failedAtSequence).toBe(4)
  })

  it('rejects a gapped chain', () => {
    const { events } = buildChain(6)
    const gapped = events.filter((event) => event.sequence !== 3)

    const replay = replayEvents(createAcidStateFor(config), createInitialResourceLedger(), gapped)
    expect(replay.ok).toBe(false)
    if (replay.ok) return
    expect(replay.error.code).toBe('EVENT_SEQUENCE_GAP')
  })

  it('replays an empty chain to the initial state', () => {
    const initial = createAcidStateFor(config)
    const replay = replayEvents(initial, createInitialResourceLedger(), [])

    expect(replay.ok).toBe(true)
    if (!replay.ok) return
    expect(replay.state).toBe(initial)
    expect(replay.eventsVerified).toBe(0)
  })
})

describe('undoLastAction', () => {
  function storedChain(actionTypes: string[]): StoredEvent<AcidNeutralizationState>[] {
    // Hashes are computed from the states so replay verification passes; the
    // states themselves only need to be self-consistent for these checks.
    return actionTypes.map((actionType, index) => {
      const stateAfter = {
        ...createAcidStateFor(config),
        compositionRevision: index + 1,
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
    const events = storedChain(['select_route'])
    const outcome = undoLastAction(
      events,
      createAcidStateFor(config),
      createInitialResourceLedger(),
      ['select_route'],
    )

    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    expect(outcome.undoOfSequence).toBe(1)
    expect(outcome.state.route).toBeNull()
  })

  it('refuses to undo an irreversible action', () => {
    // Chemistry that has been added cannot be un-reacted (spec §5.1). Only
    // select_route is undoable in this scenario, and only as the last action.
    const events = storedChain(['select_route', 'add_base'])
    const outcome = undoLastAction(
      events,
      createAcidStateFor(config),
      createInitialResourceLedger(),
      ['select_route'],
    )

    expect(outcome.ok).toBe(false)
    if (outcome.ok) return
    expect(outcome.error.code).toBe('ACTION_NOT_UNDOABLE')
    expect(outcome.error.data.actionType).toBe('add_base')
  })

  it('decides reversibility from the chain, not from a caller claim', () => {
    // The signature takes no action-type argument, so a caller cannot claim the
    // last action was `select_route` while the chain records `add_base`. This is
    // the guarantee the old 7-argument form could not make.
    const events = storedChain(['select_route', 'add_base'])
    const undoable = ['select_route'] as const

    const outcome = undoLastAction(
      events,
      createAcidStateFor(config),
      createInitialResourceLedger(),
      undoable,
    )
    expect(outcome.ok).toBe(false)
  })

  it('returns the ledger as it stood before the undone action', () => {
    const events = storedChain(['select_route', 'calibrate_meter'])
    const outcome = undoLastAction(
      events,
      createAcidStateFor(config),
      createInitialResourceLedger(),
      ['calibrate_meter'],
    )

    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    // Only the first event remains, so one operation is counted.
    expect(outcome.ledger.operationCount).toBe(1)
  })

  it('refuses to undo an empty chain', () => {
    const outcome = undoLastAction(
      [],
      createAcidStateFor(config),
      createInitialResourceLedger(),
      ['select_route'],
    )
    expect(outcome.ok).toBe(false)
    if (outcome.ok) return
    expect(outcome.error.code).toBe('NOTHING_TO_UNDO')
  })

  it('refuses to undo a corrupted chain', () => {
    const events = storedChain(['select_route'])
    const corrupted = [{ ...events[0], stateAfterHash: 'deadbeef' }] as StoredEvent<AcidNeutralizationState>[]

    const outcome = undoLastAction(
      corrupted,
      createAcidStateFor(config),
      createInitialResourceLedger(),
      ['select_route'],
    )
    expect(outcome.ok).toBe(false)
  })
})

describe('fingerprint stability', () => {
  it('is independent of object key order', () => {
    const a = requestFingerprint({
      attemptId: ATTEMPT_ID,
      scenarioReleaseId: ACID_RELEASE_ID,
      actionType: 'add_base',
      normalizedParameters: { volumeL: 0.005, flag: true },
      canonicalUnits: { volumeL: 'L' },
    })
    // Same values, different insertion order. JCS sorts keys, so the fingerprint
    // must not change — otherwise a retry could double-commit.
    const b = requestFingerprint({
      canonicalUnits: { volumeL: 'L' },
      normalizedParameters: { flag: true, volumeL: 0.005 },
      actionType: 'add_base',
      scenarioReleaseId: ACID_RELEASE_ID,
      attemptId: ATTEMPT_ID,
    })

    expect(a).toBe(b)
  })

  it('changes when any fingerprint field changes', () => {
    const base = {
      attemptId: ATTEMPT_ID,
      scenarioReleaseId: ACID_RELEASE_ID,
      actionType: 'add_base',
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
      requestFingerprint({ ...base, scenarioReleaseId: 'acid-neutralization@2.0.0' }),
    )
  })

  it('rejects a non-finite parameter rather than hashing garbage', () => {
    expect(() =>
      requestFingerprint({
        attemptId: ATTEMPT_ID,
        scenarioReleaseId: ACID_RELEASE_ID,
        actionType: 'add_base',
        normalizedParameters: { volumeL: Number.NaN },
        canonicalUnits: {},
      }),
    ).toThrow()
  })
})
