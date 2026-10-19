import { describe, expect, it } from 'vitest'
import { runSampleChemistry } from '@/app/simulate/water-treatment/sample-chemistry-action.js'

describe('runSampleChemistry solid-phase diagnostics', () => {
  it('reports configured phases and real final phase moles for a precipitating sample', async () => {
    const result = await runSampleChemistry({
      targetVolumeMl: 1000,
      feAddedMl: 50,
      znAddedMl: 50,
      pbAddedMl: 5,
      sourceMgL: 100,
      initialPh: 9,
    })

    expect(result.database).toBe('minteq.v4.dat')
    expect(result.configuredPhases).toEqual(['Ferrihydrite', 'Zn(OH)2(am)', 'Pb(OH)2'])
    expect(result.convergence.converged).toBe(true)
    expect(result.diagnostics).toHaveLength(3)
    expect(result.diagnostics.every((diagnostic) => diagnostic.configured)).toBe(true)
    expect(result.diagnostics.some((diagnostic) => (diagnostic.precipitatedMoles ?? 0) > 0)).toBe(true)
    expect(result.diagnostics.some((diagnostic) => (diagnostic.precipitateMassMg ?? 0) > 0)).toBe(true)
    expect(Math.abs(result.massBalance.elements.fe.residualMg)).toBeLessThan(5)
  })

  it('distinguishes SI from formation when no equilibrium phase is configured', async () => {
    const result = await runSampleChemistry({
      targetVolumeMl: 1000,
      feAddedMl: 1,
      znAddedMl: 1,
      pbAddedMl: 1,
      solidPhases: [],
    })

    expect(result.configuredPhases).toEqual([])
    expect(result.diagnostics.every((diagnostic) => diagnostic.formation === 'not_configured')).toBe(true)
    expect(result.diagnostics.every((diagnostic) => diagnostic.precipitatedMoles === null)).toBe(true)
    expect(result.diagnostics.every((diagnostic) => diagnostic.precipitateMassMg === null)).toBe(true)
    expect(result.diagnostics.some((diagnostic) => diagnostic.si !== null)).toBe(true)
  })

  it('reports configured zero separately from a rounded display value', async () => {
    const result = await runSampleChemistry({
      targetVolumeMl: 1000,
      feAddedMl: 0,
      znAddedMl: 0,
      pbAddedMl: 0,
    })

    expect(result.diagnostics.every((diagnostic) => diagnostic.configured)).toBe(true)
    expect(result.diagnostics.some((diagnostic) => diagnostic.formation === 'configured_zero' || diagnostic.formation === 'configured_unknown')).toBe(true)
    expect(result.diagnostics.every((diagnostic) => diagnostic.precipitatedMoles === null || diagnostic.precipitatedMoles === 0)).toBe(true)
  })
})
