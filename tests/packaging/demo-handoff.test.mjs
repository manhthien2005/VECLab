import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import test from 'node:test'

const setup = resolve('scripts/demo/setup-local.mjs')
const packageScript = resolve('scripts/package-demo.mjs')

test('setup explains its prerequisites without starting Docker or writing credentials', () => {
  const result = spawnSync(process.execPath, [setup, '--help'], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /Docker/)
  assert.match(result.stdout, /\.env\.local/)
})

test('handoff copies runtime source and excludes agents, caches, logs and personal environment', () => {
  const root = mkdtempSync(join(tmpdir(), 'veclab-package-test-'))
  try {
    const source = join(root, 'source'), out = join(root, 'handoff')
    for (const folder of ['src/app', 'public', '.agents', 'node_modules', '.next', 'supabase/migrations', 'scripts/demo']) mkdirSync(join(source, folder), { recursive: true })
    writeFileSync(join(source, 'src/app/page.tsx'), 'export default function Page(){return null}')
    writeFileSync(join(source, 'public/icon.svg'), '<svg/>')
    writeFileSync(join(source, 'package.json'), JSON.stringify({ name: 'veclab', version: '1.0.0', private: true, type: 'module', scripts: { dev: 'next dev', test: 'vitest' }, dependencies: { next: '16.3.4' }, devDependencies: { typescript: '5.9.3', vitest: '5.0.0', supabase: '2.121.0' } }))
    writeFileSync(join(source, 'tsconfig.json'), JSON.stringify({ compilerOptions: {}, include: ['src/**/*.tsx', 'tests/**/*.ts'] }))
    writeFileSync(join(source, 'next.config.ts'), 'export default {}')
    writeFileSync(join(source, 'supabase/config.toml'), 'project_id = "veclab"\n[api]\nport = 54321\n[db]\nport = 54322\n[studio]\nport = 54323\n[inbucket]\nport = 54324\n')
    writeFileSync(join(source, 'supabase/migrations/20260101000000_demo.sql'), '-- versioned migration')
    writeFileSync(join(source, '.env.local'), 'SUPABASE_SECRET_KEY=must-never-be-copied')
    writeFileSync(join(source, '.agents/rules.md'), 'agent rules')
    writeFileSync(join(source, 'node_modules/cache.log'), 'cache')
    writeFileSync(join(source, '.next/build.log'), 'cache')
    writeFileSync(join(source, 'src/debug.log'), 'debug')
    const result = spawnSync(process.execPath, [packageScript, '--source', source, '--out', out], { encoding: 'utf8' })
    assert.equal(result.status, 0, result.stderr)
    assert.match(readFileSync(join(out, 'src/app/page.tsx'), 'utf8'), /Page/)
    assert.ok(!readdirSync(out).some(name => ['.agents', 'node_modules', '.next', '.env.local'].includes(name)))
    assert.deepEqual(readdirSync(join(out, 'src')), ['app'])
    const pkg = JSON.parse(readFileSync(join(out, 'package.json'), 'utf8'))
    assert.equal(pkg.scripts.test, undefined)
    assert.equal(pkg.devDependencies.vitest, undefined)
    assert.equal(pkg.devDependencies.supabase, '2.121.0')
    assert.match(readFileSync(join(out, 'supabase/config.toml'), 'utf8'), /port = 54331/)
    assert.match(readFileSync(join(out, 'next.config.ts'), 'utf8'), /agentRules:\s*false/)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('packaging refuses a nonempty destination instead of overwriting user files', () => {
  const out = mkdtempSync(join(tmpdir(), 'veclab-preserve-test-'))
  try {
    writeFileSync(join(out, 'keep.txt'), 'preserve')
    const result = spawnSync(process.execPath, [packageScript, '--out', out], { encoding: 'utf8' })
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /không rỗng/i)
    assert.equal(readFileSync(join(out, 'keep.txt'), 'utf8'), 'preserve')
  } finally { rmSync(out, { recursive: true, force: true }) }
})
