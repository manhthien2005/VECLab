import { expect, it } from 'vitest'
import { listCatalog } from '@/features/experiment-catalog/catalog.js'
import { EXPERIMENT_OVERVIEWS } from '@/features/experiment-catalog/overviews.js'

it('offers extraction and Jar sessions, with adsorption still planned', () => {
  expect(listCatalog().map(entry => entry.scenarioKey)).toEqual(['jar-test', 'acid-base-extraction'])
  expect(EXPERIMENT_OVERVIEWS.map(entry => entry.scenarioKey)).toEqual(['jar-test', 'acid-base-extraction', 'methylene-blue-adsorption'])
  expect(EXPERIMENT_OVERVIEWS.find(entry => entry.scenarioKey === 'acid-base-extraction')?.input).toContain('A/B/N')
})
