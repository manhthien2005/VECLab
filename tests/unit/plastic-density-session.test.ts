import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { GuestAttemptRepository } from '@/application/attempts/guest-repository.js'
import { createPlasticSession } from '@/application/simulation/plastic-session.js'
import type { UUID } from '@/domain/process/contracts.js'
import type { PlasticSeparationState } from '@/domain/experiments/virgin-plastic-separation/model.js'

function guestPlasticSession() {
  const repo = new GuestAttemptRepository<PlasticSeparationState>()
  return { repo, session: createPlasticSession(repo) }
}

describe('PlasticSession Lifecycle and Persistence', () => {
  it('starts a new attempt in preparation stage', async () => {
    const { session } = guestPlasticSession()
    const attempt = await session.start()

    expect(attempt.scenarioKey).toBe('plastic-separation')
    expect(attempt.status).toBe('in_progress')
    expect(attempt.revision).toBe(0)
    expect(attempt.projection.stage).toBe('preparation')
    expect(attempt.projection.polymers).toHaveLength(6)
    expect(attempt.projection.polymers.every((p) => p.location === 'tray')).toBe(true)
  })

  it('progresses through wetting, water separation and ethanol branch', async () => {
    const { session } = guestPlasticSession()
    const started = await session.start()
    const id = started.attemptId

    const prepared = await session.apply(id, 'prepare_samples')
    expect(prepared.ok).toBe(true)
    if (!prepared.ok) return

    // 1. Load and wet
    const res1 = await session.apply(id, 'load_and_wet')
    expect(res1.ok).toBe(true)
    if (!res1.ok) return
    expect(res1.state.projection.stage).toBe('wetting')
    expect(res1.state.projection.tankLoaded).toBe(true)
    expect(res1.state.projection.wetted).toBe(true)

    // 2. Separate water
    const res2 = await session.apply(id, 'separate_water')
    expect(res2.ok).toBe(true)
    if (!res2.ok) return
    expect(res2.state.projection.waterSeparated).toBe(true)
    const pp = res2.state.projection.polymers.find((p) => p.id === 'PP')!
    expect(pp.location).toBe('water_floating')
    const ps = res2.state.projection.polymers.find((p) => p.id === 'PS')!
    expect(ps.location).toBe('water_sinking')

    // 3. Centrifuge
    const res3 = await session.apply(id, 'centrifuge_and_weigh')
    expect(res3.ok).toBe(true)
    if (!res3.ok) return
    expect(res3.state.projection.centrifuged).toBe(true)

    // 4. Select Light branch
    const res4 = await session.apply(id, 'select_branch', { branch: 'light' })
    expect(res4.ok).toBe(true)
    if (!res4.ok) return
    expect(res4.state.projection.activeBranch).toBe('light')

    // 5. Ethanol 23%
    const res5 = await session.apply(id, 'run_ethanol_preset', { concentration: 23 })
    expect(res5.ok).toBe(true)
    if (!res5.ok) return
    expect(res5.state.projection.ethanolProgress).toBe(1)
    expect(res5.state.projection.lastOutcome?.reportedRecoveries.PP).toBe(95.6)
    const res5Spin = await session.apply(id, 'centrifuge_and_weigh')
    expect(res5Spin.ok).toBe(true)
    if (!res5Spin.ok) return

    // 6. Ethanol 31%
    const res6 = await session.apply(id, 'run_ethanol_preset', { concentration: 31 })
    expect(res6.ok).toBe(true)
    if (!res6.ok) return
    expect(res6.state.projection.ethanolProgress).toBe(2)
    expect(res6.state.projection.completedBranches).toContain('light')
    const res6Spin = await session.apply(id, 'centrifuge_and_weigh')
    expect(res6Spin.ok).toBe(true)
    if (!res6Spin.ok) return

    // 7. Complete the independent heavy fraction too.
    const heavy = await session.apply(id, 'select_branch', { branch: 'heavy' })
    expect(heavy.ok).toBe(true)
    if (!heavy.ok) return
    for (const concentration of [11.5, 20, 40]) {
      const separated = await session.apply(id, 'run_nacl_preset', { concentration })
      expect(separated.ok).toBe(true)
      if (!separated.ok) return
      const spun = await session.apply(id, 'centrifuge_and_weigh')
      expect(spun.ok).toBe(true)
      if (!spun.ok) return
    }

    // 8. Summarize only after both branches.
    const res7 = await session.apply(id, 'summarize_fractions')
    expect(res7.ok).toBe(true)

    // 8. Complete
    const completeRes = await session.complete(id)
    expect(completeRes.ok).toBe(true)
    if (!completeRes.ok) return
    expect(completeRes.state.status).toBe('completed')
    expect(completeRes.report).not.toBeNull()
    expect(completeRes.report.goalStatus.goalMet).toBe(true)
  })

  it('supports idempotent replay of committed actions', async () => {
    const { session } = guestPlasticSession()
    const started = await session.start()
    const id = started.attemptId
    const actionId = 'test-idempotent-action-1' as UUID

    const res1 = await session.apply(id, 'prepare_samples', {}, {}, { actionId })
    expect(res1.ok).toBe(true)

    // Resend the same preparation action with the same action ID.
    const replayRes = await session.apply(id, 'prepare_samples', {}, {}, { actionId })
    expect(replayRes.ok).toBe(true)
    if (!replayRes.ok) return
    expect(replayRes.feedback.idempotentReplay).toBe(true)
  })

  it('rejects revision conflicts', async () => {
    const { session } = guestPlasticSession()
    const started = await session.start()
    const id = started.attemptId

    // Specify an outdated expected revision
    const res = await session.apply(
      id,
      'load_and_wet',
      {},
      {},
      { expectedRevision: 99 },
    )
    expect(res.ok).toBe(false)
    if ('outcome' in res) {
      expect(res.outcome).toBe('revision_conflict')
    }
  })

  it('reloads stored attempt accurately from repository', async () => {
    const { repo, session } = guestPlasticSession()
    const started = await session.start()
    const id = started.attemptId

    await session.apply(id, 'prepare_samples')
    await session.apply(id, 'load_and_wet')
    await session.apply(id, 'separate_water')

    // Create a new session instance over the same repo
    const newSession = createPlasticSession(repo)
    const loaded = await newSession.load(id)

    expect(loaded).not.toBeNull()
    expect(loaded?.ok).toBe(true)
    if (loaded && loaded.ok) {
      expect(loaded.state.revision).toBe(3)
      expect(loaded.state.projection.waterSeparated).toBe(true)
    }
  })
})

