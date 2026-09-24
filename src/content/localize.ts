import { ACID_STRINGS, type AcidStringKey } from './scenarios/acid-neutralization.vi.js'

/**
 * String resolution for the UI.
 *
 * The domain returns a `messageKey` plus a `data` record and NEVER a sentence
 * (docs/system-architecture.md: text lives in content, not in engine code). This
 * module is the single place that turns those into display text, so every surface
 * renders the same wording for the same key and a missing key is caught in one
 * place instead of printing `undefined` across six screens.
 *
 * Placeholder syntax is `{name}`, resolved from the domain's `data` record — e.g.
 * `observations.route.locked` carries `{route}`.
 */

export type StringTable = Record<string, string>

/** Placeholder values the domain may supply alongside a message key. */
export type MessageData = Record<string, string | number | boolean | null>

const PLACEHOLDER = /\{([A-Za-z_][A-Za-z0-9_]*)\}/g

/**
 * Resolve a message key against the vi bundle, interpolating `{name}` placeholders.
 *
 * Returns the key itself when it has no entry, rather than throwing: a missing
 * string must degrade to something a reviewer can recognise in the UI, and must not
 * crash a render of an otherwise valid attempt. The scenario-definition and
 * content-wording gates are what keep keys from going missing in the first place.
 *
 * A placeholder with no matching datum is left verbatim for the same reason —
 * silently substituting an empty string would hide a wiring bug as clean-looking
 * text.
 */
export function resolveMessage(
  messageKey: string,
  data: MessageData = {},
  strings: StringTable = ACID_STRINGS,
): string {
  const template = strings[messageKey]
  if (template === undefined) return messageKey

  return template.replace(PLACEHOLDER, (match, name: string) => {
    const value = data[name]
    return value === undefined || value === null ? match : String(value)
  })
}

/**
 * Resolve a typed key from the acid bundle.
 *
 * Compile-time checked, for keys known at the call site — labels, preconditions and
 * section headings. `resolveMessage` is for keys that arrive at runtime from the
 * domain (error codes, observation codes), which cannot be checked statically.
 */
export function acidString(
  key: AcidStringKey,
  data: MessageData = {},
): string {
  return resolveMessage(key, data, ACID_STRINGS)
}

/** Whether a key exists in the acid bundle, for conditional rendering. */
export function hasAcidString(key: string): key is AcidStringKey {
  return Object.prototype.hasOwnProperty.call(ACID_STRINGS, key)
}
