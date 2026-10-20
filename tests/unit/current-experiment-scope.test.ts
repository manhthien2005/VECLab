import { describe, expect, it } from 'vitest'
import { SCENARIO_KEYS } from '@/domain/process/contracts.js'
import { listCatalog } from '@/features/experiment-catalog/catalog.js'
import { EXPERIMENT_OVERVIEWS } from '@/features/experiment-catalog/overviews.js'

describe('current experiment scope', () => {
  it('serves current lessons including virgin plastic separation and cold-process soap', () => {
    expect([...SCENARIO_KEYS].sort()).toEqual(['acid-base-extraction', 'cold-process-soap', 'jar-test'])
    expect(listCatalog().map(entry => entry.scenarioKey).sort()).toEqual(['acid-base-extraction', 'cold-process-soap', 'jar-test', 'plastic-density-separation'])
  })

  it('keeps the adsorption introduction without inventing a runnable lesson', () => {
    const card = EXPERIMENT_OVERVIEWS.find(entry => entry.scenarioKey === 'methylene-blue-adsorption')
    expect(card?.title).toBe('Hấp phụ xanh methylene')
    expect(card?.image).toBe('/assets/experiments/adsorption.webp')
    expect(listCatalog().some(entry => entry.scenarioKey === 'methylene-blue-adsorption')).toBe(false)
  })
})
