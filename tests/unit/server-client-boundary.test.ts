import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * React Server Component boundary guard.
 *
 * THE BUG THIS EXISTS FOR. `src/app/simulate/[scenarioKey]/page.tsx` is a Server
 * Component. It imported `WORKBENCH_SCENARIO_KEY` — a plain string constant — from
 * `workbench-client.tsx`, which carries `'use client'`. Under RSC every export of a
 * `'use client'` module is replaced by a CLIENT REFERENCE on the server: the page did not
 * receive `'acid-neutralization'`, it received a function. Its own route guard,
 *
 *     if (scenarioKey !== WORKBENCH_SCENARIO_KEY) notFound()
 *
 * was therefore true for every request, and the workbench — the central screen of the
 * product — answered 404 on its own valid URL.
 *
 * Nothing caught it. It type-checks (TypeScript sees the declared `string`), it lints, and
 * all 207 unit tests passed, because the failure only exists at the RSC serialization
 * boundary at runtime. Only opening the page in a browser revealed it.
 *
 * THE RULE. A Server Component may import a client COMPONENT — that is what a client
 * reference is for — but never a plain value from a `'use client'` module. Shared
 * constants belong in a module with no directive, importable from both sides
 * (`src/features/simulation-workbench/scenario.ts` is the one this bug produced).
 *
 * HOW COMPONENTS ARE TOLD APART FROM VALUES. By the JSX convention the codebase already
 * follows: a PascalCase binding is a component, anything else is a value. That is a
 * heuristic, but it is the same one React itself uses to decide whether `<foo />` is an
 * element or a tag, so a violation of it would already be a problem. Type-only imports are
 * erased before they reach the bundler and are skipped.
 */

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const APP_DIR = join(ROOT, 'src', 'app')
const SRC_DIR = join(ROOT, 'src')

/** Files whose module graph the server renders. */
const SOURCE_EXTENSIONS = ['.ts', '.tsx'] as const

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) return walk(full)
    return SOURCE_EXTENSIONS.some((ext) => full.endsWith(ext)) ? [full] : []
  })
}

/** Whether a module opts into the client bundle. */
function isClientModule(file: string): boolean {
  const head = readFileSync(file, 'utf8').slice(0, 400)
  return /^\s*(['"])use client\1/m.test(head)
}

/**
 * Resolve an import specifier to a file on disk.
 *
 * Source imports use explicit `.js` specifiers (NodeNext-style ESM) while the files are
 * `.ts`/`.tsx`; `next.config.ts` bridges that with webpack's `extensionAlias`, and this
 * mirrors the same mapping. Returns null for a package import, which cannot be a local
 * `'use client'` module.
 */
function resolveSpecifier(fromFile: string, specifier: string): string | null {
  let base: string

  if (specifier.startsWith('@/')) {
    base = join(SRC_DIR, specifier.slice('@/'.length))
  } else if (specifier.startsWith('.')) {
    base = resolve(dirname(fromFile), specifier)
  } else {
    return null
  }

  const withoutJs = base.endsWith('.js') ? base.slice(0, -'.js'.length) : base

  for (const candidate of [
    `${withoutJs}.ts`,
    `${withoutJs}.tsx`,
    join(withoutJs, 'index.ts'),
    join(withoutJs, 'index.tsx'),
  ]) {
    if (existsSync(candidate)) return candidate
  }

  return null
}

/** One named binding pulled out of an import statement. */
type Binding = { name: string; typeOnly: boolean }

/**
 * Named bindings of every non-type import in a file, with their specifier.
 *
 * A regex rather than a parser: the import syntax used across this codebase is plain
 * (`import { a, b as c } from 'x'`), and adding a TypeScript parser as a test dependency
 * to read it would be heavier than the check itself.
 */
function namedImports(source: string): Array<{ specifier: string; bindings: Binding[] }> {
  const out: Array<{ specifier: string; bindings: Binding[] }> = []
  const pattern = /import\s+(type\s+)?\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g

  for (const match of source.matchAll(pattern)) {
    const statementIsTypeOnly = match[1] !== undefined
    const clause = match[2] ?? ''
    const specifier = match[3] ?? ''

    const bindings = clause
      .split(',')
      .map((part) => part.trim())
      .filter((part) => part.length > 0)
      .map((part) => {
        const inlineTypeOnly = part.startsWith('type ')
        const body = inlineTypeOnly ? part.slice('type '.length) : part
        // `a as b` binds `b`; the local name is what the file actually uses.
        const local = body.split(/\s+as\s+/).pop() ?? body
        return { name: local.trim(), typeOnly: statementIsTypeOnly || inlineTypeOnly }
      })

    out.push({ specifier, bindings })
  }

  return out
}

/** React's own convention: a component starts with a capital letter. */
function looksLikeComponent(name: string): boolean {
  return /^[A-Z]/.test(name) && !/^[A-Z0-9_]+$/.test(name)
}

describe('server/client module boundary', () => {
  const appFiles = walk(APP_DIR).filter((file) => !isClientModule(file))

  it('finds the app router files to check', () => {
    // A resolver or directory rename that silently matched nothing would make every
    // assertion below vacuously pass.
    expect(appFiles.length).toBeGreaterThan(5)
  })

  it('never imports a non-component value from a "use client" module', () => {
    const violations: string[] = []

    for (const file of appFiles) {
      const source = readFileSync(file, 'utf8')

      for (const { specifier, bindings } of namedImports(source)) {
        const target = resolveSpecifier(file, specifier)
        if (target === null || !isClientModule(target)) continue

        for (const binding of bindings) {
          // Types are erased at build time, so they never become client references.
          if (binding.typeOnly || looksLikeComponent(binding.name)) continue

          violations.push(
            `${relative(ROOT, file).split(sep).join('/')} imports "${binding.name}" ` +
              `from client module ${relative(ROOT, target).split(sep).join('/')}`,
          )
        }
      }
    }

    expect(
      violations,
      'A Server Component receives a client reference, not the value. Move the shared ' +
        'constant or helper into a module with no "use client" directive.\n' +
        violations.join('\n'),
    ).toEqual([])
  })

  it('serves the workbench scenario key as a real string', () => {
    // The concrete regression: the constant the simulate route compares its segment
    // against must be a plain module, so the page reads the value rather than a reference.
    const scenarioModule = join(
      SRC_DIR,
      'features',
      'simulation-workbench',
      'scenario.ts',
    )

    expect(existsSync(scenarioModule)).toBe(true)
    expect(isClientModule(scenarioModule)).toBe(false)
  })
})
