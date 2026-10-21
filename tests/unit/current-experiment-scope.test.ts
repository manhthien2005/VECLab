import { describe, expect, it } from 'vitest'
import { SCENARIO_KEYS } from '@/domain/process/contracts.js'
import { listCatalog } from '@/features/experiment-catalog/catalog.js'
import { EXPERIMENT_OVERVIEWS } from '@/features/experiment-catalog/overviews.js'

describe('current experiment scope', () => {
  it('serves current lessons including virgin plastic separation and cold-process soap', () => {
    expect([...SCENARIO_KEYS].sort()).toEqual(['acid-base-extraction', 'cold-process-soap', 'jar-test'])
    expect(listCatalog().map(entry => entry.scenarioKey).sort()).toEqual(['acid-base-extraction', 'cold-process-soap', 'jar-test', 'plastic-density-separation', 'water-treatment'])
  })

  it('offers each served lesson once with presentation data and a real simulator', () => {
    const served = listCatalog().map(entry => entry.scenarioKey).sort()
    expect(EXPERIMENT_OVERVIEWS.map(entry => entry.scenarioKey).sort()).toEqual(served)
    for (const card of EXPERIMENT_OVERVIEWS) {
      expect(card.image).toBeTruthy()
      expect(card.question).toBeTruthy()
    }
  })
})
