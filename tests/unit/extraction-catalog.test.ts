import { expect, it } from 'vitest'
import { listCatalog } from '@/features/experiment-catalog/catalog.js'
import { EXPERIMENT_OVERVIEWS } from '@/features/experiment-catalog/overviews.js'

it('offers the three active lessons, with adsorption still planned', () => {
  expect(listCatalog().map(entry => entry.scenarioKey)).toEqual(['jar-test', 'acid-base-extraction', 'plastic-density-separation'])
  expect(EXPERIMENT_OVERVIEWS.map(entry => entry.scenarioKey)).toEqual(['jar-test', 'acid-base-extraction', 'plastic-density-separation', 'methylene-blue-adsorption'])
  expect(EXPERIMENT_OVERVIEWS.find(entry => entry.scenarioKey === 'acid-base-extraction')?.input).toContain('A/B/N')
  expect(listCatalog().find(entry => entry.scenarioKey === 'plastic-density-separation')?.releaseId).toBe('plastic-separation@0.2.0')
})
