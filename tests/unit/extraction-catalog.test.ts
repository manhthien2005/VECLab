import { expect, it } from 'vitest'
import { listCatalog } from '@/features/experiment-catalog/catalog.js'
import { EXPERIMENT_OVERVIEWS } from '@/features/experiment-catalog/overviews.js'

it('offers exactly the five active lessons', () => {
  expect(listCatalog().map(entry => entry.scenarioKey)).toEqual(['jar-test', 'acid-base-extraction', 'plastic-density-separation', 'cold-process-soap', 'water-treatment'])
  expect(EXPERIMENT_OVERVIEWS.map(entry => entry.scenarioKey)).toEqual(['jar-test', 'water-treatment', 'acid-base-extraction', 'cold-process-soap', 'plastic-density-separation'])
  expect(EXPERIMENT_OVERVIEWS.find(entry => entry.scenarioKey === 'acid-base-extraction')?.input).toContain('A/B/N')
  expect(listCatalog().find(entry => entry.scenarioKey === 'plastic-density-separation')?.releaseId).toBe('plastic-separation@0.2.0')
})
