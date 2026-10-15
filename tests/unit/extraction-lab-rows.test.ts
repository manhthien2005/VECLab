import 'fake-indexeddb/auto'
import { expect, it } from 'vitest'
import { GuestAttemptRepository } from '@/application/attempts/guest-repository.js'
import { createExtractionSession } from '@/application/simulation/extraction-session.js'
import { createJarSession } from '@/application/simulation/jar-session.js'
import type { ExtractionState } from '@/domain/experiments/acid-base-extraction/model.js'
import type { JarState } from '@/domain/experiments/jar-test/model.js'
import { listExtractionLabRows, removeExtractionLabAttempt } from '@/features/learner-lab/extraction-attempts.js'

it('lists extraction summaries and never removes a Jar attempt', async () => {
  const repository=new GuestAttemptRepository<ExtractionState>(), session=createExtractionSession(repository)
  for(const row of await repository.listAttempts({}))await repository.deleteAttempt(row.attemptId)
  const jar=await createJarSession(new GuestAttemptRepository<JarState>()).start()
  const extraction=await session.start()
  await session.apply(extraction.attemptId,'transfer',{from:'S',to:'F',phase:'all',volumeL:40},{volumeL:'mL'})
  const rows=await listExtractionLabRows(repository)
  expect(rows).toHaveLength(1)
  expect(rows[0]?.projection?.vessels.find(v=>v.id==='F')?.organicMl).toBe(40)
  expect(rows[0]?.projection?.readings).toEqual([])
  await expect(removeExtractionLabAttempt(repository,jar.attemptId)).rejects.toThrow('different scenario')
  await removeExtractionLabAttempt(repository,extraction.attemptId)
  expect(await listExtractionLabRows(repository)).toEqual([])
  expect(await repository.getAttempt(jar.attemptId)).not.toBeNull()
})
