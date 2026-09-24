/**
 * The post-sign-in destination (docs/web-application-scope.md §4.4).
 *
 * Middleware appends `?next=<pathname>` when it bounces a signed-out learner away from
 * `/lab`, `/compare` or `/account`, so signing in can put them back where they were heading
 * rather than dumping everyone on the lab.
 *
 * That parameter is attacker-controlled, because it is in a URL a learner can be handed:
 * `/sign-in?next=https://evil.example` is a link anyone can construct and send. Passing it
 * straight to the router makes this an OPEN REDIRECT — the standard attack is a phishing
 * email whose link looks like it stays on this site, signs the learner in for real, and then
 * lands them on a look-alike page that harvests what they type next.
 *
 * So it is validated rather than trusted, and the validation is a strict pathname shape rather
 * than a blocklist. Blocklists fail on the cases nobody listed: `//host`, `/\host`,
 * `https:/host`, `javascript:alert(1)`, and percent-encoded spellings of all of those.
 */

/**
 * The safe destination, or null when `next` is absent or unusable.
 *
 * Accepts only a same-origin relative path:
 *
 *   * must start with exactly one `/` — a bare `host` or an absolute URL fails;
 *   * must NOT start with `//` or `/\` — those are protocol-relative and browsers resolve
 *     them to another origin, which is the single most common bypass;
 *   * must contain no control characters, which would let a crafted value smuggle a second
 *     request or truncate a log line.
 *
 * Anything else returns null and the caller falls back to a known-good destination, so a
 * malformed link signs the learner in and sends them somewhere safe instead of failing.
 */
export function safeNextPath(value: string | null | undefined): string | null {
  if (typeof value !== 'string' || value === '') return null
  if (!value.startsWith('/')) return null
  if (value.startsWith('//')) return null
  // `/\evil.example` is normalized to `//evil.example` by every browser, so it is the same
  // bypass with one character changed.
  if (value.startsWith('/\\')) return null

  // Control characters and whitespace: a URL containing them is either malformed or trying
  // to hide a second value from a log or a validator that splits on them.
  for (const character of value) {
    const code = character.codePointAt(0) ?? 0
    if (code <= 0x20 || code === 0x7f) return null
  }

  return value
}

/**
 * Where a learner goes after signing in.
 *
 * The `next` parameter when it is usable, otherwise the lab — which is what §4.5 calls the
 * main starting point after sign-in. One function so no screen picks its own fallback and
 * none of them forgets to validate.
 */
export function destinationAfterSignIn(next: string | null | undefined): string {
  return safeNextPath(next) ?? '/lab'
}
