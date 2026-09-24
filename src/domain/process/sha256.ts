/**
 * SHA-256 over bytes, in pure TypeScript.
 *
 * WHY NOT `node:crypto`. The domain must run in BOTH environments: the BFF runs the
 * engine server-side, and guest mode runs the exact same engine in the browser
 * (docs/system-architecture.md §10, "Chạy exact release engine trong browser").
 * `node:crypto` cannot be bundled for a client component, so importing it here would
 * make the guest workbench fail at build time.
 *
 * WHY NOT Web Crypto. `crypto.subtle.digest` is the portable option but is
 * asynchronous, and the engine is synchronous end to end — `runCommand` returns a
 * result, not a promise. Threading a promise through every action handler to hash one
 * string would be a large, error-prone change to code that is otherwise pure.
 *
 * So the hash is computed here. This has no imports at all, which also tightens the
 * domain boundary: `src/domain/**` may not reach for node builtins, and now it does not
 * need the `node:crypto` exception to produce a fingerprint.
 *
 * The output must be BYTE-IDENTICAL to `createHash('sha256')` over the same UTF-8
 * bytes, because fingerprints and state hashes are compared against values written by
 * the other storage mode: a guest attempt imported into a cloud account has to replay
 * with matching hashes (§14.2 hash verification), and a single differing bit would make
 * every imported chain look corrupt. tests/unit/sha256-parity.test.ts pins that
 * equivalence, including multi-byte input.
 */

/** SHA-256 round constants: the first 32 bits of the fractional parts of the cube
 * roots of the first 64 primes. */
const K: readonly number[] = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
  0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
  0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
  0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
  0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
  0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]

/** Initial hash values: the first 32 bits of the fractional parts of the square roots
 * of the first 8 primes. */
const H_INIT: readonly number[] = [
  0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
  0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
]

/** 32-bit right rotate. */
function rotr(value: number, bits: number): number {
  return ((value >>> bits) | (value << (32 - bits))) >>> 0
}

/**
 * SHA-256 digest of a byte string, as 32 raw bytes.
 *
 * Allocation is one padded buffer plus a 64-entry schedule per invocation. The engine
 * hashes a small number of times per action (one fingerprint, two state hashes), so
 * this is not a hot loop worth a streaming API.
 */
export function sha256Bytes(message: Uint8Array): Uint8Array {
  const bitLength = message.byteLength * 8

  // Padding: 0x80, then zeros, then the 64-bit big-endian bit length, so the total is a
  // multiple of the 64-byte block. `+ 9` accounts for the 0x80 byte and the 8 length
  // bytes before rounding up.
  const paddedLength = (((message.byteLength + 9 + 63) >> 6) << 6)
  const padded = new Uint8Array(paddedLength)
  padded.set(message)
  padded[message.byteLength] = 0x80

  // Length is written big-endian across the final 8 bytes. JavaScript bitwise ops are
  // 32-bit, so the high half comes from dividing by 2^32 rather than shifting.
  const highBits = Math.floor(bitLength / 0x100000000)
  const lowBits = bitLength >>> 0
  const view = new DataView(padded.buffer)
  view.setUint32(paddedLength - 8, highBits, false)
  view.setUint32(paddedLength - 4, lowBits, false)

  const hash = H_INIT.slice()
  const schedule = new Uint32Array(64)

  for (let offset = 0; offset < paddedLength; offset += 64) {
    for (let i = 0; i < 16; i += 1) {
      schedule[i] = view.getUint32(offset + i * 4, false)
    }

    for (let i = 16; i < 64; i += 1) {
      const w15 = schedule[i - 15]!
      const w2 = schedule[i - 2]!
      const s0 = (rotr(w15, 7) ^ rotr(w15, 18) ^ (w15 >>> 3)) >>> 0
      const s1 = (rotr(w2, 17) ^ rotr(w2, 19) ^ (w2 >>> 10)) >>> 0
      schedule[i] = (schedule[i - 16]! + s0 + schedule[i - 7]! + s1) >>> 0
    }

    let [a, b, c, d, e, f, g, h] = hash as [
      number, number, number, number, number, number, number, number,
    ]

    for (let i = 0; i < 64; i += 1) {
      const S1 = (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) >>> 0
      const choose = ((e & f) ^ (~e & g)) >>> 0
      const temp1 = (h + S1 + choose + K[i]! + schedule[i]!) >>> 0
      const S0 = (rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) >>> 0
      const majority = ((a & b) ^ (a & c) ^ (b & c)) >>> 0
      const temp2 = (S0 + majority) >>> 0

      h = g
      g = f
      f = e
      e = (d + temp1) >>> 0
      d = c
      c = b
      b = a
      a = (temp1 + temp2) >>> 0
    }

    hash[0] = (hash[0]! + a) >>> 0
    hash[1] = (hash[1]! + b) >>> 0
    hash[2] = (hash[2]! + c) >>> 0
    hash[3] = (hash[3]! + d) >>> 0
    hash[4] = (hash[4]! + e) >>> 0
    hash[5] = (hash[5]! + f) >>> 0
    hash[6] = (hash[6]! + g) >>> 0
    hash[7] = (hash[7]! + h) >>> 0
  }

  const digest = new Uint8Array(32)
  const digestView = new DataView(digest.buffer)
  for (let i = 0; i < 8; i += 1) {
    digestView.setUint32(i * 4, hash[i]!, false)
  }

  return digest
}

const HEX_DIGITS = '0123456789abcdef'

/** Lowercase hex of a byte string — the form every stored hash column uses. */
export function toHex(bytes: Uint8Array): string {
  let hex = ''
  for (const byte of bytes) {
    hex += HEX_DIGITS[byte >> 4]! + HEX_DIGITS[byte & 0x0f]!
  }
  return hex
}

/**
 * SHA-256 of a string's UTF-8 bytes, as lowercase hex.
 *
 * UTF-8 encoding is the load-bearing detail: `createHash(...).update(text, 'utf8')`
 * encodes the same way, and the canonical JSON being hashed can contain non-ASCII text
 * (Vietnamese `messageKey` data, reagent names). Encoding as Latin-1 instead would
 * silently produce different digests for exactly those inputs.
 *
 * `TextEncoder` is a platform global in browsers and in Node 18+, so this needs no
 * import and stays inside the domain's dependency rules.
 */
export function sha256Hex(text: string): string {
  return toHex(sha256Bytes(new TextEncoder().encode(text)))
}
