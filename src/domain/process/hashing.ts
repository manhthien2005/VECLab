import { sha256Hex } from './sha256.js'
import { canonicalize } from './canonical-json.js'
import type { ScenarioRef, SimulationAction, UUID } from './contracts.js'

/**
 * Integrity and idempotency hashes.
 *
 * Both hashes are SHA-256 over RFC 8785/JCS-canonical JSON
 * (docs/data-and-state-model.md §7.6). NaN and Infinity are rejected: JCS has
 * no representation for them, and a non-finite value reaching state means the
 * model already produced garbage that must not be persisted or compared.
 *
 * `state_before_hash` / `state_after_hash` are integrity/debug aids, not
 * security signatures. `requestFingerprint` makes a retried request produce the
 * same event identity so no duplicate event can be committed; it does not prove
 * a client payload is trustworthy.
 *
 * The digest comes from `./sha256.js`, not `node:crypto`: guest mode runs this exact
 * engine in the browser (§10), where `node:crypto` does not exist. tests/unit/
 * sha256-parity.test.ts pins the output byte-for-byte against `createHash`, because
 * hashes are compared across storage modes when a guest attempt is imported.
 */

function assertNoNonFinite(value: unknown, path: string): void {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new RangeError(`Non-finite number at ${path}: ${value}`)
    }
    return
  }

  if (typeof value === 'bigint' || typeof value === 'function' || typeof value === 'symbol') {
    throw new TypeError(`Unhashable ${typeof value} at ${path}`)
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoNonFinite(item, `${path}[${index}]`))
    return
  }

  if (value !== null && typeof value === 'object') {
    for (const [key, member] of Object.entries(value as Record<string, unknown>)) {
      if (member === undefined) {
        throw new TypeError(`Explicit undefined member at ${path}.${key}`)
      }
      assertNoNonFinite(member, path ? `${path}.${key}` : key)
    }
  }
}

export type RequestFingerprintPayload = {
  attemptId: UUID
  scenarioReleaseId: string
  actionType: string
  normalizedParameters: Record<string, number | string | boolean>
  canonicalUnits: Record<string, string>
}

/**
 * SHA-256 over the JCS-canonical fingerprint payload. Key order in the input
 * object is irrelevant; canonicalization sorts it.
 */
export function requestFingerprint(payload: RequestFingerprintPayload): string {
  assertNoNonFinite(payload, '')
  return sha256Hex(canonicalize(payload))
}

/**
 * Build the fingerprint payload from a raw action plus the already-normalized
 * parameters and canonical unit selections. Normalization happens in the
 * Process Core before this call; the fingerprint only records the result.
 */
export function fingerprintFromAction(
  attemptId: UUID,
  scenario: ScenarioRef,
  action: SimulationAction,
  normalizedParameters: Record<string, number | string | boolean>,
): RequestFingerprintPayload {
  return {
    attemptId,
    scenarioReleaseId: scenario.releaseId,
    actionType: action.actionType,
    normalizedParameters,
    canonicalUnits: action.unitSelections,
  }
}

/** State integrity hash used for `state_before_hash` / `state_after_hash`. */
export function stateHash(state: unknown): string {
  assertNoNonFinite(state, '')
  return sha256Hex(canonicalize(state))
}

/** Canonical string form of a value, exposed for tests and debugging. */
export function canonicalString(value: unknown): string {
  assertNoNonFinite(value, '')
  return canonicalize(value)
}
