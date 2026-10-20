import { describe, expect, it } from 'vitest'
import { projectPlastic } from '@/application/scenarios/plastic-projection.js'
import { createPlasticSeparationModule, OUTCOMES } from '@/domain/experiments/virgin-plastic-separation/index.js'
import { plasticSceneFor, plasticTankParticles } from '@/features/plastic-separation/motion.js'

const initial = () => projectPlastic(createPlasticSeparationModule().createInitialState())
describe('plastic scene projections', () => {
  it('keeps the tank empty until loading, and never invents a concentration after selecting a branch', () => {
    expect(plasticTankParticles(initial())).toEqual([])
    expect(plasticTankParticles({ ...initial(), wetted: true, activeBranch: 'heavy', lastOutcome: OUTCOMES.water })).toEqual([])
  })
  it('places water PP/HDPE above PS/ABS/PA/PC, with a stable illustrative layout', () => {
    const p = { ...initial(), wetted: true, waterSeparated: true, lastOutcome: OUTCOMES.water }
    const points = plasticTankParticles(p)
    expect([...new Set(points.filter(point => point.location === 'floating').map(point => point.id))]).toEqual(['PP', 'HDPE'])
    expect([...new Set(points.filter(point => point.location === 'sinking').map(point => point.id))]).toEqual(['PS', 'ABS', 'PA', 'PC'])
    expect(Math.max(...points.filter(point => point.location === 'floating').map(point => point.y))).toBeLessThan(Math.min(...points.filter(point => point.location === 'sinking').map(point => point.y)))
    expect(plasticTankParticles({ ...p, revision: 99 })).toEqual(points)
  })
  it('keeps reintroduced PP in ethanol 31 and shows HDPE sinking without revealing mass', () => {
    const p = { ...initial(), wetted: true, activeBranch: 'light' as const, lastOutcome: OUTCOMES.ethanol_31, pendingCentrifugation: true }
    const points = plasticTankParticles(p)
    expect(points.filter(point => point.id === 'PP').every(point => point.location === 'floating')).toBe(true)
    expect(points.filter(point => point.id === 'HDPE').every(point => point.location === 'sinking')).toBe(true)
    expect(points).toHaveLength(16)
    expect(points.every(point => !('massKg' in point) && !('recoveryPercent' in point))).toBe(true)
  })
  it('shows only PA and PC in the final NaCl separation, not previously collected PS or ABS', () => {
    const points = plasticTankParticles({ ...initial(), wetted: true, activeBranch: 'heavy', lastOutcome: OUTCOMES.nacl_40 })
    expect([...new Set(points.map(point => point.id))]).toEqual(['PA', 'PC'])
    expect(points.filter(point => point.location === 'floating').map(point => point.id)).toEqual(Array(8).fill('PA'))
    expect(points.filter(point => point.location === 'sinking').map(point => point.id)).toEqual(Array(8).fill('PC'))
  })
  it('restores a static scene by state while committed action cues choose the relevant instrument', () => {
    expect(plasticSceneFor(initial())).toBe('samples')
    expect(plasticSceneFor({ ...initial(), wetted: true }, 'load_and_wet')).toBe('tank')
    expect(plasticSceneFor({ ...initial(), wetted: true }, 'centrifuge_and_weigh')).toBe('weigh')
    expect(plasticSceneFor({ ...initial(), stage: 'completed' }, 'centrifuge_and_weigh')).toBe('fractions')
  })
})
