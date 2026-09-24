import type { AcidNeutralizationState } from '@/domain/experiments/acid-neutralization/state.js'
import { GuestAttemptRepository } from '@/application/attempts/guest-repository.js'
import { RemoteAcidSession } from '@/application/simulation/remote-session.js'
import { createAcidSession, type AcidSession } from '@/application/simulation/acid-session.js'

/**
 * Which `AcidSession` a screen gets, from its storage mode.
 *
 * Three screens need this — the workbench, the attempt shell and the report shell — and
 * each one picking its own implementation is how they would diverge: a report that reads
 * IndexedDB while the workbench wrote to the cloud shows a learner an empty report for a
 * run they just finished.
 *
 * §9/§10 fix the split: guest runs the engine in the browser over IndexedDB, an account
 * proxies to the BFF where the engine runs server-side. Both satisfy `AcidSession`, so no
 * screen below this can tell which it holds.
 *
 * Safe to call during render, which is why the screens can wrap it in `useMemo` rather
 * than an effect: neither constructor touches a browser API. `GuestAttemptRepository`
 * opens IndexedDB inside its async methods and caches the connection at module scope, so
 * React discarding a memoized value cannot open a second database.
 */
export function createSessionForStorageMode(storageMode: 'local' | 'cloud'): AcidSession {
  return storageMode === 'local'
    ? createAcidSession(new GuestAttemptRepository<AcidNeutralizationState>())
    : new RemoteAcidSession()
}
