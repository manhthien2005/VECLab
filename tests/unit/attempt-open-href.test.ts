import { describe, expect, it } from 'vitest'
import type { UUID } from '@/domain/process/contracts.js'
import { attemptOpenHref, type AttemptRow } from '@/features/attempts/attempt-table.js'
import { workbenchPathForAttempt } from '@/features/simulation-workbench/scenario.js'

const ATTEMPT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID

function row(status: AttemptRow['status']): AttemptRow {
  return {
    attemptId: ATTEMPT_ID,
    status,
    releaseId: 'acid-neutralization@1.0.0',
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    phStar: null,
    overallScore: null,
  }
}

describe('attemptOpenHref', () => {
  it('resumes an in-progress run on the workbench', () => {
    expect(attemptOpenHref(row('in_progress'))).toBe(workbenchPathForAttempt(ATTEMPT_ID))
  })

  it('opens completed and stopped runs on the attempt document', () => {
    expect(attemptOpenHref(row('completed'))).toBe(`/attempts/${ATTEMPT_ID}`)
    expect(attemptOpenHref(row('stopped'))).toBe(`/attempts/${ATTEMPT_ID}`)
  })
})
