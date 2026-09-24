import type { UUID } from '@/domain/process/contracts.js'

/**
 * Minting and validating UUIDs.
 *
 * `UUID` is a branded string, so a value cannot be produced by a cast alone —
 * there must be one place that constructs it, or every caller invents its own
 * `as UUID` and the brand stops meaning anything.
 *
 * Lives in `shared/`, not `domain/`: it reads the global `crypto`, which exists in
 * browsers and in Node 22+ without an import. Putting it in the domain would force
 * a `node:crypto` import into the guest path, which runs entirely in the browser
 * (docs/system-architecture.md §10).
 */

/**
 * A new v4 UUID.
 *
 * Guests mint their own attempt ids locally (§10: "Tạo guest attempt với local
 * UUID"), so this runs in the browser as well as on the server. `crypto.randomUUID`
 * is available in both secure contexts and Node 19+.
 */
export function newUUID(): UUID {
  return crypto.randomUUID() as UUID
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Whether a string is a UUID, narrowing it to the branded type.
 *
 * Needed for anything crossing a trust boundary — a dynamic route segment, a
 * request body, a row read back from IndexedDB. Validating once at the edge means
 * the domain can keep treating `UUID` as a value it never has to re-check.
 */
export function isUUID(value: string): value is UUID {
  return UUID_PATTERN.test(value)
}

/**
 * Parse a UUID from an untrusted string, or null.
 *
 * Returns null rather than throwing so callers can render "attempt not found"
 * instead of a 500 when a learner follows a stale or hand-edited link.
 */
export function parseUUID(value: string | null | undefined): UUID | null {
  return typeof value === 'string' && isUUID(value) ? value : null
}
