/**
 * Routes that need a verified session.
 *
 * Guest work — catalog, evidence, workbench, and My Lab on IndexedDB — stays
 * reachable without an account (web scope §5.1, §14). Comparison and account
 * settings do not: they read or mutate per-learner cloud data.
 *
 * Proxy is the only caller that redirects. Pages still must not treat a route
 * group name as the guard (docs/system-architecture.md).
 */

export const SESSION_REQUIRED_PREFIXES = ['/compare', '/account'] as const

export function requiresSession(pathname: string): boolean {
  return SESSION_REQUIRED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}
