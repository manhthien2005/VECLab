/**
 * RFC 8785 JSON Canonicalization Scheme (JCS).
 *
 * `requestFingerprint` is the SHA-256 of a JCS-canonical payload containing
 * attemptId, scenarioReleaseId, actionType, normalizedParameters and
 * canonicalUnits (docs/system-architecture.md §5.1). Canonicalization is what
 * makes a retried request produce the same fingerprint, so a duplicate event
 * cannot be committed.
 *
 * JCS rules implemented here:
 *   - object members sorted by key, compared as UTF-16 code units
 *   - no whitespace between tokens
 *   - numbers serialized with the ECMAScript Number::toString algorithm
 *     (which JSON.stringify already performs and which JCS mandates)
 *   - strings escaped per RFC 8259 with shortest-form escapes
 *   - `undefined`, functions and symbols are rejected, not dropped
 */

type JsonScalar = string | number | boolean | null
type JsonValue = JsonScalar | JsonValue[] | { [key: string]: JsonValue }

/** UTF-16 code-unit ordering, as JCS requires for object key sorting. */
function compareCodeUnits(a: string, b: string): number {
  const length = Math.min(a.length, b.length)
  for (let index = 0; index < length; index += 1) {
    const left = a.charCodeAt(index)
    const right = b.charCodeAt(index)
    if (left !== right) return left - right
  }
  return a.length - b.length
}

function serializeString(value: string): string {
  let out = '"'
  for (const character of value) {
    const code = character.codePointAt(0) as number
    switch (character) {
      case '"':
        out += '\\"'
        continue
      case '\\':
        out += '\\\\'
        continue
      case '\b':
        out += '\\b'
        continue
      case '\f':
        out += '\\f'
        continue
      case '\n':
        out += '\\n'
        continue
      case '\r':
        out += '\\r'
        continue
      case '\t':
        out += '\\t'
        continue
      default:
        break
    }
    if (code < 0x20) {
      out += `\\u${code.toString(16).padStart(4, '0')}`
      continue
    }
    out += character
  }
  return `${out}"`
}

function serializeNumber(value: number): string {
  if (!Number.isFinite(value)) {
    throw new TypeError(`JCS cannot serialize non-finite number: ${value}`)
  }
  if (Object.is(value, -0)) return '0'
  return JSON.stringify(value)
}

function serialize(value: unknown): string {
  if (value === null) return 'null'

  switch (typeof value) {
    case 'boolean':
      return value ? 'true' : 'false'
    case 'number':
      return serializeNumber(value)
    case 'string':
      return serializeString(value)
    default:
      break
  }

  if (typeof value !== 'object') {
    throw new TypeError(`JCS cannot serialize value of type ${typeof value}`)
  }

  if (Array.isArray(value)) {
    return `[${value.map(serialize).join(',')}]`
  }

  const record = value as Record<string, unknown>
  const keys = Object.keys(record).filter((key) => record[key] !== undefined)
  if (keys.length !== Object.keys(record).length) {
    const dropped = Object.keys(record).filter((key) => record[key] === undefined)
    throw new TypeError(`JCS rejects explicit undefined members: ${dropped.join(', ')}`)
  }

  keys.sort(compareCodeUnits)
  const members = keys.map((key) => `${serializeString(key)}:${serialize(record[key])}`)
  return `{${members.join(',')}}`
}

export function canonicalize(value: unknown): string {
  return serialize(value)
}

export function isCanonicalJson(value: JsonValue): boolean {
  try {
    serialize(value)
    return true
  } catch {
    return false
  }
}
