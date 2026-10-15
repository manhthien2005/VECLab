/**
 * Routes that need a verified session.
 *
 * Guest work — catalog, evidence, workbench, and My Lab on IndexedDB — stays
 * reachable without an account. Comparison reads the same local Jar reports.
 * Account settings require a session to read or mutate the learner identity.
 *
 * Proxy is the only caller that redirects. Pages still must not treat a route
 * group name as the guard (docs/system-architecture.md).
 */

export const SESSION_REQUIRED_PREFIXES = ['/account'] as const

export function requiresSession(pathname: string): boolean {
  return SESSION_REQUIRED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}
