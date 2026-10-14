import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const source = readFileSync(fileURLToPath(new URL('../../src/features/landing/workbench-preview.tsx', import.meta.url)), 'utf8')

describe('Static workbench concept boundary', () => {
  it('ships without client state, timers or simulation event handlers', () => {
    expect(source).not.toMatch(/['"]use client['"]|useState|useEffect|setTimeout|onClick|onChange/)
  })

  it('does not start attempts, invoke engines or access learner storage', () => {
    expect(source).not.toMatch(/fetch\(|localStorage|sessionStorage|supabase|commitAction|createJarModule/)
    expect(source).not.toMatch(/from ['"]@\/(domain|application)\//)
  })
})
