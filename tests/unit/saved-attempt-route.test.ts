import { describe, expect, it } from 'vitest'
import type { UUID } from '@/domain/process/contracts.js'
import { savedAttemptHref } from '@/features/reports/saved-attempt-route.js'

const id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID
describe('saved attempt links', () => {
  for (const key of ['jar-test', 'acid-base-extraction', 'cold-process-soap']) {
    it(`keeps the identity and report intent of ${key}`, () => {
      expect(savedAttemptHref(key, id, 'attempt')).toBe(`/simulate/${key}?attempt=${id}`)
      expect(savedAttemptHref(key, id, 'report')).toBe(`/simulate/${key}?attempt=${id}&view=report`)
    })
  }
  it('refuses retired and unknown lessons without inventing a replacement', () => {
    expect(savedAttemptHref('acid-neutralization', id, 'report')).toBeNull()
    expect(savedAttemptHref('unknown', id, 'attempt')).toBeNull()
  })
  it('opens only the supported plastic release and keeps report intent', () => {
    expect(savedAttemptHref('plastic-separation', id, 'report', 'plastic-separation@0.2.0'))
      .toBe(`/simulate/plastic-density-separation?attempt=${id}&view=report`)
    expect(savedAttemptHref('plastic-separation', id, 'attempt', 'plastic-separation@0.1.0')).toBeNull()
    expect(savedAttemptHref('plastic-separation', id, 'attempt')).toBeNull()
  })
})
