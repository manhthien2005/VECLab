import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { sha256Bytes, sha256Hex, toHex } from '@/domain/process/sha256.js'
import {
  stateHash,
  requestFingerprint,
  canonicalString,
  type RequestFingerprintPayload,
} from '@/domain/process/hashing.js'
import type { UUID } from '@/domain/process/contracts.js'

/**
 * SHA-256 parity against `node:crypto`.
 *
 * The domain hashes with its own implementation so it can run in the browser
 * (docs/system-architecture.md §10). That is only safe if its output is byte-identical
 * to `createHash('sha256')`, because hashes are compared ACROSS storage modes: a guest
 * attempt imported into a cloud account is replayed with hash verification (§14.2), and
 * `request_fingerprint` decides whether a retry is the same action or a conflicting one
 * (§12.1). One differing bit would make every imported chain look corrupt, or let a
 * mutated retry be accepted as idempotent.
 *
 * These vectors pin that equivalence, including the cases a hand-rolled hash most often
 * gets wrong: the empty input, exact block boundaries (55/56/63/64/65 bytes), inputs
 * longer than 2^32 bits are out of scope but multi-byte UTF-8 is in scope — Vietnamese
 * text appears in the data being hashed.
 */

/** Digest a string with node:crypto, as lowercase hex. */
function nodeHex(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex')
}

describe('sha256Hex matches node:crypto', () => {
  it('agrees on the published test vectors', () => {
    // NIST / RFC 6234 vectors. Independent of node:crypto, so a regression in either
    // implementation shows up here rather than being masked by the parity comparison.
    expect(sha256Hex('')).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    )
    expect(sha256Hex('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    )
    expect(sha256Hex('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq')).toBe(
      '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1',
    )
  })

  it('agrees on every block-boundary length', () => {
    // 55, 56, 63, 64 and 65 bytes are where the padding and length-field logic changes
    // shape; 119/120/128 cover the second block boundary.
    const lengths = [0, 1, 3, 31, 32, 55, 56, 57, 63, 64, 65, 119, 120, 121, 127, 128, 1000]

    for (const length of lengths) {
      const text = 'a'.repeat(length)
      expect(sha256Hex(text), `${length} bytes`).toBe(nodeHex(text))
    }
  })

  it('agrees on multi-byte UTF-8 input', () => {
    // Vietnamese strings reach these hashes through messageKey data and reagent names.
    // Latin-1 encoding instead of UTF-8 would pass every ASCII vector above and still be
    // wrong here.
    const inputs = [
      'Trung hòa axit',
      'pH* là pH mô hình — Ca(OH)₂ và Na₂CO₃',
      'Không hút pipet bằng miệng. 🔬',
      'Đã khóa chất trung hòa naoh.',
      'a\u0000b\u{1F9EA}c',
    ]

    for (const text of inputs) {
      expect(sha256Hex(text), text).toBe(nodeHex(text))
    }
  })

  it('agrees on byte input of arbitrary length', () => {
    for (const length of [0, 1, 64, 65, 256]) {
      const bytes = new Uint8Array(length)
      for (let i = 0; i < length; i += 1) bytes[i] = (i * 7 + 3) % 256

      const expected = createHash('sha256').update(bytes).digest('hex')
      expect(toHex(sha256Bytes(bytes)), `${length} bytes`).toBe(expected)
    }
  })

  it('produces 64 lowercase hex characters', () => {
    expect(sha256Hex('anything')).toMatch(/^[0-9a-f]{64}$/)
  })
})

describe('domain hashes are stable across implementations', () => {
  it('stateHash equals node:crypto over the canonical string', () => {
    const state = {
      route: 'naoh',
      phase: 'ready',
      compositionRevision: 3,
      totalVolumeL: 0.0275,
      lastMeasuredPH: 6.995,
      // Vietnamese and subscript characters, as the real state carries.
      label: 'Dung dịch Ca(OH)₂ bão hòa',
    }

    expect(stateHash(state)).toBe(nodeHex(canonicalString(state)))
  })

  it('requestFingerprint equals node:crypto over the canonical payload', () => {
    const payload: RequestFingerprintPayload = {
      attemptId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' as UUID,
      scenarioReleaseId: 'acid-neutralization@1.0.0',
      actionType: 'add_base',
      normalizedParameters: { volumeL: 0.001 },
      // The unit the learner picked is part of the fingerprint, so a retry that changes
      // only the displayed unit produces a different identity rather than a replay.
      canonicalUnits: { volumeL: 'mL' },
    }

    expect(requestFingerprint(payload)).toBe(nodeHex(canonicalString(payload)))
  })

  it('rejects non-finite numbers before hashing', () => {
    // JCS has no representation for NaN or Infinity, and a non-finite value reaching
    // state means the model produced garbage. Both implementations would have to agree
    // on an encoding that does not exist, so the domain refuses instead.
    expect(() => stateHash({ ph: Number.NaN })).toThrow(RangeError)
    expect(() => stateHash({ ph: Number.POSITIVE_INFINITY })).toThrow(RangeError)
    // -0 is finite but is not the same JCS number as 0; hashing must still succeed
    // rather than throw, because it is representable.
    expect(() => stateHash({ ph: -0 })).not.toThrow()
  })
})
