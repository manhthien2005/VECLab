import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Service-role containment guard (docs/system-architecture.md §2.3, §17).
 *
 * `src/infrastructure/supabase/admin.ts` holds the service-role key, and the service role
 * BYPASSES RLS. A bundle that reaches it therefore carries the ability to read and write
 * every learner's attempts without an ownership check. If that key is shipped to a
 * browser it is public, and RLS is no longer a second line of defence — it is the only
 * one, and it is not what these RPCs rely on (they are SECURITY DEFINER precisely because
 * the service role carries no user claim).
 *
 * So the invariant is: NOTHING in a client bundle may reach that module. The workbench
 * reaches the cloud store through `RemoteAcidSession`, which posts to same-origin BFF
 * routes; `SupabaseAttemptRepository` — the only importer of `admin.ts` — is reachable
 * only from route handlers, which Next never bundles for the client.
 *
 * This is a disk scan rather than a runtime import, for the same reason as
 * domain-boundaries.test.ts: importing `admin.ts` here would only prove the test process
 * can load it, not that a browser cannot. Scanning the graph proves the reachability
 * claim, and it fails at the commit that introduces a bad import rather than at the
 * deploy that leaks the key.
 */

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const SRC = join(ROOT, 'src')

/** Module the key lives in, as a repo-relative posix path. */
const ADMIN_MODULE = 'src/infrastructure/supabase/admin.ts'

/**
 * Specifier prefix that marks a server-only entry point.
 *
 * Files under `src/app/api/` are route handlers: Next executes them on the server and
 * excludes them from client bundles, so an import from there cannot reach a browser.
 * Anything importing `admin.ts` must sit behind this boundary — directly or transitively.
 */
const SERVER_ONLY_PREFIX = join('src', 'app', 'api')

/** All TypeScript source files under `src`, as repo-relative posix paths. */
function sourceFiles(dir: string = SRC): string[] {
  const found: string[] = []

  for (const entry of readdirSync(dir)) {
    const absolute = join(dir, entry)
    if (statSync(absolute).isDirectory()) {
      found.push(...sourceFiles(absolute))
      continue
    }
    if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
      found.push(toRelative(absolute))
    }
  }

  return found
}


function toRelative(absolute: string): string {
  return relative(ROOT, absolute).split(sep).join('/')
}

/**
 * Resolve one import specifier to a repo-relative file path, or null when it is a package.
 *
 * Only the project's own alias and relative forms matter here: `@/…` and `./…`. Package
 * specifiers (`react`, `zod`) cannot be `admin.ts` and are skipped.
 */
function resolveSpecifier(from: string, specifier: string): string | null {
  let target: string
  if (specifier.startsWith('@/')) {
    target = join(SRC, specifier.slice(2))
  } else if (specifier.startsWith('.')) {
    target = resolve(dirname(join(ROOT, from)), specifier)
  } else {
    return null
  }

  // `.js` is the ESM spelling of a `.ts` source file in this project; extensionless
  // imports resolve to an index. Try each candidate the way the bundler would.
  const candidates = [
    target.replace(/\.js$/, '.ts'),
    target.replace(/\.js$/, '.tsx'),
    target,
    `${target}.ts`,
    `${target}.tsx`,
    join(target, 'index.ts'),
    join(target, 'index.tsx'),
  ]

  for (const candidate of candidates) {
    if (candidate.endsWith('.ts') || candidate.endsWith('.tsx')) {
      const normalized = toRelative(candidate)
      if (exists(normalized)) return normalized
    }
  }

  return null
}

function exists(repoRelative: string): boolean {
  try {
    statSync(join(ROOT, repoRelative))
    return true
  } catch {
    return false
  }
}

/**
 * Every import specifier in a file.
 *
 * Matches `from '…'`, bare `import '…'`, dynamic `import('…')` and `require('…')`. A
 * dynamic import still creates reachability at runtime, so it counts: a handler that
 * lazily imported `admin.ts` would put the key in whatever chunk the dynamic import lands
 * in, which for a client component is a chunk the browser downloads.
 */
function importSpecifiers(file: string): string[] {
  const source = readFileSync(join(ROOT, file), 'utf8')
  const specifiers: string[] = []
  const patterns = [
    /from\s+['"]([^'"]+)['"]/g,
    /import\s+['"]([^'"]+)['"]/g,
    /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ]

  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      specifiers.push(match[1]!)
    }
  }

  return specifiers
}

/** Whether a file opts into the client bundle. */
function isClientComponent(file: string): boolean {
  const source = readFileSync(join(ROOT, file), 'utf8')
  // The directive must be the first statement, so scanning the head is enough — and
  // scanning the whole file would match it inside a comment or a string.
  return source.split('\n').slice(0, 5).some((line) => line.trim() === "'use client'")
}

/**
 * Every file reachable from `roots`, including the roots themselves.
 *
 * Breadth-first with a visited set: the graph is acyclic in practice but a cycle would
 * otherwise loop forever, and a cycle is itself worth not hanging on.
 */
function reachableFrom(roots: readonly string[]): Set<string> {
  const visited = new Set<string>()
  const queue = [...roots]

  while (queue.length > 0) {
    const current = queue.shift()!
    if (visited.has(current)) continue
    visited.add(current)

    for (const specifier of importSpecifiers(current)) {
      const resolved = resolveSpecifier(current, specifier)
      if (resolved !== null && !visited.has(resolved)) queue.push(resolved)
    }
  }

  return visited
}

describe('service-role containment', () => {
  const files = sourceFiles()

  it('finds the source tree it is meant to scan', () => {
    // Guards the scan itself: a renamed directory would make every assertion below pass
    // vacuously, which is worse than failing.
    expect(files.length).toBeGreaterThan(20)
    expect(files).toContain(ADMIN_MODULE)
  })

  it('is imported only from server-only layers', () => {
    const importers = files.filter((file) =>
      importSpecifiers(file).some(
        (specifier) => resolveSpecifier(file, specifier) === ADMIN_MODULE,
      ),
    )

    // At least one importer, so the test is not passing because the module went unused.
    expect(importers.length).toBeGreaterThan(0)

    for (const importer of importers) {
      // Structural rather than an allowlist of names. An allowlist has to be edited every
      // time a server-side store is added, and the edit that makes the suite green again is
      // exactly the edit that would also let a browser-side file through. These two rules
      // are about LAYER, which is the actual property: a route handler, or an
      // application-layer adapter that only route handlers may reach.
      const inServerLayer =
        importer.startsWith(`${SERVER_ONLY_PREFIX.split(sep).join('/')}/`) ||
        importer.startsWith('src/application/')
      expect(inServerLayer, `${importer} is not in a server layer`).toBe(true)

      // And it must never be opted into the client bundle, whatever layer claims it.
      expect(isClientComponent(importer), `${importer} is a client component`).toBe(false)
    }
  })

  it('is unreachable from any client component', () => {
    const clientEntries = files.filter(isClientComponent)
    expect(clientEntries.length).toBeGreaterThan(0)

    const reachable = reachableFrom(clientEntries)

    // This is the assertion that would catch a real leak: importing a service-role store
    // into the workbench, which is a client component, would put the key in a browser chunk.
    expect(reachable.has(ADMIN_MODULE)).toBe(false)

    // Structural, not a hardcoded list of the adapters that exist today. A named list only
    // protects the stores someone remembered to write down; deriving it from the scan covers
    // every importer, including one added later, with no edit here.
    const serverStores = files.filter((file) =>
      importSpecifiers(file).some(
        (specifier) => resolveSpecifier(file, specifier) === ADMIN_MODULE,
      ),
    )
    expect(serverStores.length).toBeGreaterThan(0)
    for (const store of serverStores) {
      expect(reachable.has(store), `${store} is reachable from a client component`).toBe(false)
    }
  })

  it('reaches the service role from a route handler, proving the scan follows real edges', () => {
    // The mirror image of the assertion above. A reachability test that finds nothing
    // anywhere would pass both ways, so this confirms the walk resolves `@/…` aliases and
    // `.js`→`.ts` rewrites correctly — the two things most likely to silently break it.
    const reachable = reachableFrom(['src/app/api/simulation/server-session.ts'])
    expect(reachable.has(ADMIN_MODULE)).toBe(true)
  })
})
