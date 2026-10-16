import { describe, expect, it } from 'vitest'
import type { UUID } from '@/domain/process/contracts.js'
import { savedAttemptHref } from '@/features/reports/saved-attempt-route.js'

const id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID
describe('saved attempt links', () => {
  for (const key of ['jar-test', 'acid-base-extraction']) {
    it(`keeps the identity and report intent of ${key}`, () => {
      expect(savedAttemptHref(key, id, 'attempt')).toBe(`/simulate/${key}?attempt=${id}`)
      expect(savedAttemptHref(key, id, 'report')).toBe(`/simulate/${key}?attempt=${id}&view=report`)
    })
  }
  it('refuses retired and unknown lessons without inventing a replacement', () => {
    expect(savedAttemptHref('acid-neutralization', id, 'report')).toBeNull()
    expect(savedAttemptHref('unknown', id, 'attempt')).toBeNull()
  })
})
