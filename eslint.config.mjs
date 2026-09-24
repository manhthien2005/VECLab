import js from '@eslint/js'
import next from 'eslint-config-next'
import globals from 'globals'
import tseslint from 'typescript-eslint'

/**
 * Flat config.
 *
 * Two decisions here are load-bearing rather than cosmetic:
 *
 * 1. `typescript-eslint`'s `no-unused-vars` REPLACES the base rule for TS files.
 *    The base rule does not understand TypeScript syntax, so it reports false
 *    positives on parameter properties (`constructor(readonly code: string)`)
 *    and on parameter names inside type-only signatures
 *    (`(hydrogenMolL: number) => number`), neither of which is dead code.
 *
 * 2. Type-aware linting is deliberately NOT enabled. It requires a `project`
 *    service and roughly multiplies lint time; the guarantees it adds
 *    (no-floating-promises and friends) are better covered here by the explicit
 *    typecheck gate plus the domain boundary test.
 */

/** Paths that are build output or generated, never linted. */
const IGNORES = [
  '.next/**',
  'node_modules/**',
  'e2e-report/**',
  'test-results/**',
  'playwright-report/**',
  'coverage/**',
  'supabase/.temp/**',
  'next-env.d.ts',
  '.agents/**',
  '.claude/**',
  'reference/**',
]

export default tseslint.config(
  { ignores: IGNORES },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...next,
  {
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
      ecmaVersion: 2023,
      sourceType: 'module',
    },
    rules: {
      // The base rule misreads TypeScript; the TS-aware one is enabled below.
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrors: 'all',
        },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    // Domain must stay free of React, Next, Supabase, content and UI imports, and of
    // every node builtin. This is the compile-time half of the boundary;
    // tests/unit/domain-boundaries.test.ts asserts the same list at runtime, because a
    // glob here can silently stop matching files (a rename, or a .tsx added to the
    // domain) while lint stays green.
    //
    // No builtins, not even `node:crypto`: guest mode bundles this exact engine into a
    // client component (docs/system-architecture.md §10), where they do not exist. The
    // domain carries its own SHA-256 in src/domain/process/sha256.ts for that reason.
    // The `node:*` pattern below covers the prefixed form this codebase uses;
    // domain-boundaries.test.ts additionally checks bare names such as `crypto`.
    //
    // `@/content/*` is forbidden because content is presentation: depending on it
    // inverts the layering (§4.1). The application registry supplies the "is content
    // locked?" answer to registerRelease instead. `@/shared/errors/*` remains allowed —
    // it is pure TypeScript whose only import is a type from the domain's own contracts.
    files: ['src/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            'react',
            'react-dom',
            'next/*',
            '@supabase/*',
            '@/app/*',
            '@/features/*',
            '@/infrastructure/*',
            '@/content/*',
            '@/shared/ui/*',
            'node:*',
          ],
        },
      ],
    },
  },
  {
    // Test files legitimately assign a `module` variable holding the domain
    // module under test; the Next.js rule targets bundler module objects.
    files: ['tests/**/*.ts'],
    rules: {
      '@next/next/no-assign-module-variable': 'off',
    },
  },
)
