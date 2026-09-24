import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Domain boundary guard (docs/system-architecture.md §4.1).
 *
 * `src/domain/**` is the chemistry and the Process Core. It must not know about React,
 * Next, Supabase, HTTP or persistence, because:
 *
 *   * the same engine runs server-side in the BFF AND in the browser for guest mode
 *     (§10, "Chạy exact release engine trong browser"). A `next/headers` or `node:*`
 *     import in the domain makes the guest workbench fail at build time.
 *   * the golden fixtures and the 169-test suite are the scientific evidence for the
 *     locked release. If the domain could reach into infrastructure, those numbers
 *     would depend on a database, a clock or a request, and could not be reproduced.
 *
 * WHY A TEST AND NOT ONLY THE LINT RULE. eslint.config.mjs restricts these imports for
 * only files matching a recursive `src/domain` glob with a `.ts` extension. That scope
 * is the weakness: if the directory is renamed, or a `.tsx` file is added, the rule
 * silently stops matching anything and lint
 * stays green while the boundary is gone. This test walks the real tree on disk and
 * asserts against whatever files exist, so a glob that stops covering them fails here
 * instead of passing quietly.
 */

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const DOMAIN_DIR = join(ROOT, 'src', 'domain')

/**
 * Specifiers the domain must never import.
 *
 * Mirrors the `patterns` list in eslint.config.mjs. Kept in step deliberately: the two
 * halves of the boundary are supposed to assert the same thing, and a test that checks
 * fewer patterns than the lint rule would let the rule's coverage lapse unnoticed.
 */
const FORBIDDEN_SPECIFIERS = [
  'react',
  'react-dom',
  'next',
  '@supabase/ssr',
  '@supabase/supabase-js',
  '@/app',
  '@/features',
  '@/infrastructure',
  // `src/shared/ui/**` holds React components. `src/shared/**` as a whole cannot be
  // banned, because the domain genuinely depends on `@/shared/errors/domain-errors.js`,
  // and it cannot be allowed either, because that would admit React. The UI subpath is
  // therefore named here rather than relying on the general prefix rules.
  '@/shared/ui',
] as const

/**
 * External specifiers the domain may import.
 *
 * Deliberately an allowlist rather than "anything not forbidden". A new dependency — a
 * date library, a content bundle — must be added here on purpose, because whatever the
 * domain imports also has to bundle into the browser for guest mode (§10).
 *
 * `@/shared/errors/domain-errors.js` qualifies: it is pure TypeScript whose only import
 * is a TYPE from the domain's own contracts, so it adds no runtime dependency and cannot
 * pull React or a builtin back in.
 */
const ALLOWED_EXTERNAL = ['@/shared/errors/'] as const

/**
 * Node builtins, allowed with or without the `node:` prefix.
 *
 * The domain used to hash with `node:crypto`. It now carries its own SHA-256
 * (`src/domain/process/sha256.ts`) precisely so that NO builtin is imported, which is
 * what lets the identical engine bundle into a client component. Any builtin here is a
 * browser-build failure waiting to happen.
 */
const NODE_BUILTINS = [
  'assert',
  'buffer',
  'child_process',
  'crypto',
  'fs',
  'http',
  'https',
  'net',
  'os',
  'path',
  'perf_hooks',
  'process',
  'stream',
  'tls',
  'url',
  'util',
  'worker_threads',
  'zlib',
] as const

/** Every source file under `src/domain`, relative to the repo root. */
function domainFiles(dir: string = DOMAIN_DIR): string[] {
  const found: string[] = []

  for (const entry of readdirSync(dir)) {
    const absolute = join(dir, entry)
    if (statSync(absolute).isDirectory()) {
      found.push(...domainFiles(absolute))
      continue
    }
    found.push(relative(ROOT, absolute).split(sep).join('/'))
  }

  return found.sort()
}

type ImportRecord = { file: string; line: number; specifier: string }

/**
 * Static and dynamic import specifiers in one file.
 *
 * Line-oriented rather than a real parse: the goal is to catch an import that should not
 * exist, and any `from '…'` or `import('…')` on a line is enough to flag it. A dynamic
 * import is included because it is the easiest way to smuggle a dependency past a
 * `no-restricted-imports` rule.
 */
function importsOf(file: string): ImportRecord[] {
  const source = readFileSync(join(ROOT, file), 'utf8')
  const records: ImportRecord[] = []

  source.split('\n').forEach((line, index) => {
    const patterns = [
      /from\s+['"]([^'"]+)['"]/g,
      /import\s+['"]([^'"]+)['"]/g,
      /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
      /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    ]

    for (const pattern of patterns) {
      for (const match of line.matchAll(pattern)) {
        records.push({ file, line: index + 1, specifier: match[1]! })
      }
    }
  })

  return records
}

/** Whether a specifier resolves to a forbidden module. */
function isForbidden(specifier: string): string | null {
  for (const forbidden of FORBIDDEN_SPECIFIERS) {
    // Exact match or subpath: `next` covers `next/headers`, `@/features` covers
    // `@/features/x`. `react` must not match `react-dom`, so require a boundary.
    if (specifier === forbidden || specifier.startsWith(`${forbidden}/`)) {
      return forbidden
    }
  }

  const bare = specifier.startsWith('node:') ? specifier.slice(5) : specifier
  if ((NODE_BUILTINS as readonly string[]).includes(bare)) return bare

  return null
}

/**
 * Whether a specifier reaches outside the domain tree.
 *
 * Relative paths stay inside; `@/domain/...` is the tree itself addressed through the
 * alias. Everything else is external — including the allowlisted shared errors, which
 * are external but permitted, so ALLOWED_EXTERNAL is the only thing that decides whether
 * an external import is acceptable.
 */
function isExternal(specifier: string): boolean {
  if (specifier.startsWith('.')) return false
  if (specifier.startsWith('@/domain')) return false
  return !ALLOWED_EXTERNAL.some((allowed) => specifier.startsWith(allowed))
}

describe('domain boundary', () => {
  const files = domainFiles()

  it('finds the domain tree', () => {
    // Guards the guard: if the walk returns nothing the rest of the suite passes
    // vacuously, which is exactly the silent-coverage failure this file exists to catch.
    expect(files.length).toBeGreaterThan(0)
    expect(files.every((file) => file.startsWith('src/domain/'))).toBe(true)
  })

  it('contains no .tsx, so the lint glob cannot silently stop matching', () => {
    // eslint.config.mjs restricts `src/domain/**/*.ts`. A .tsx file would be outside that
    // glob and therefore unguarded by the compile-time half of the boundary.
    const tsx = files.filter((file) => file.endsWith('.tsx'))
    expect(tsx, `domain must stay .ts-only; found ${tsx.join(', ')}`).toEqual([])
  })

  it('imports nothing from react, next, supabase, app, features or infrastructure', () => {
    const violations: string[] = []

    for (const file of files) {
      for (const record of importsOf(file)) {
        const forbidden = isForbidden(record.specifier)
        if (forbidden !== null) {
          violations.push(
            `${record.file}:${record.line} imports "${record.specifier}" (forbidden: ${forbidden})`,
          )
        }
      }
    }

    expect(violations, violations.join('\n')).toEqual([])
  })

  it('imports no node builtin, so the engine bundles into the browser', () => {
    // §10 requires the exact release engine to run client-side for guest mode. A single
    // builtin import — `node:crypto` was here until the pure SHA-256 replaced it — turns
    // that into a build failure.
    const builtins = files.flatMap((file) =>
      importsOf(file)
        .filter((record) => {
          const bare = record.specifier.startsWith('node:')
            ? record.specifier.slice(5)
            : record.specifier
          return (NODE_BUILTINS as readonly string[]).includes(bare)
        })
        .map((record) => `${record.file}:${record.line} -> ${record.specifier}`),
    )

    expect(builtins, builtins.join('\n')).toEqual([])
  })

  it('imports nothing external except the allowlisted shared errors', () => {
    // The domain may import itself (relative paths) and the allowlisted pure modules.
    // Anything else — a utility package, a content bundle, a date library — is a runtime
    // dependency that would also have to bundle into the browser for guest mode (§10), so
    // admitting one must be a deliberate edit to ALLOWED_EXTERNAL, not an accident.
    const external = files.flatMap((file) =>
      importsOf(file)
        .filter((record) => isExternal(record.specifier))
        .map((record) => `${record.file}:${record.line} -> ${record.specifier}`),
    )

    expect(external, external.join('\n')).toEqual([])
  })
})
