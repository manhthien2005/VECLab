import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const PAGE_FILE = join(ROOT, 'src', 'app', '(public)', 'page.tsx')
const WORKBENCH_FILE = join(ROOT, 'src', 'features', 'landing', 'workbench-preview.tsx')
const GLOBALS_CSS = join(ROOT, 'src', 'app', 'globals.css')

describe('WorkbenchPreview R16.3 Architecture, Timer Hardening and Scientific Truth', () => {
  it('preserves page.tsx as a pure Server Component without use client', () => {
    const content = readFileSync(PAGE_FILE, 'utf8')
    expect(content).not.toMatch(/^\s*['"]use client['"]/m)
  })

  it('marks WorkbenchPreview as an isolated Client Component leaf', () => {
    const content = readFileSync(WORKBENCH_FILE, 'utf8')
    expect(content).toMatch(/^\s*['"]use client['"]/m)
  })

  it('hardens timers with useRef and deterministic cleanup lifecycle', () => {
    const content = readFileSync(WORKBENCH_FILE, 'utf8')

    // Ref-based timer tracking
    expect(content).toContain('pulseTimerRef')
    expect(content).toContain('toastTimerRef')
    expect(content).toContain('useRef')

    // Centralized cancellation helper
    expect(content).toContain('clearActiveTimers')
    expect(content).toContain('clearTimeout(pulseTimerRef.current)')
    expect(content).toContain('clearTimeout(toastTimerRef.current)')

    // Unmount cleanup
    expect(content).toMatch(/useEffect\(\s*\(\)\s*=>\s*\{[\s\S]*?return\s*\(\)\s*=>\s*\{[\s\S]*?clearActiveTimers\(\)/)

    // Handlers invoke timer cancellation before scheduling new cycles
    expect(content).toMatch(/handleAddReagent\s*=\s*\(\)\s*=>\s*\{[\s\S]*?clearActiveTimers\(\)/)
    expect(content).toMatch(/handleResetPreview\s*=\s*\(\)\s*=>\s*\{[\s\S]*?clearActiveTimers\(\)/)
  })

  it('restricts reagent selector to canonical source-backed NaOH 0.0100 M', () => {
    const content = readFileSync(WORKBENCH_FILE, 'utf8')

    // Source-backed option present
    expect(content).toContain('value="naoh-001"')
    expect(content).toContain('NaOH 0,0100 M')

    // Unsupported options must NOT be selectable
    expect(content).not.toContain('value="naoh-01"')
    expect(content).not.toContain('NaOH 0,1 M')
    expect(content).not.toContain('value="caoh2"')
    expect(content).not.toContain('Ca(OH)₂')
  })

  it('strictly preserves fixed illustrative snapshot without fake dynamic scientific telemetry', () => {
    const content = readFileSync(WORKBENCH_FILE, 'utf8')

    // Fixed pH snapshot
    expect(content).toContain('>4,8<')
    expect(content).not.toMatch(/setPh\(/)
    expect(content).not.toMatch(/ph\s*=\s*calc/i)

    // Fixed chart marker coordinates
    expect(content).toContain('cx="180" cy="95"')

    // Zero backend, Supabase, or persistence calls
    expect(content).not.toContain('fetch(')
    expect(content).not.toContain('supabase')
    expect(content).not.toContain('localStorage')
    expect(content).not.toContain('sessionStorage')
  })

  it('provides feedback copy with valid link to full simulation', () => {
    const content = readFileSync(WORKBENCH_FILE, 'utf8')
    expect(content).toContain('href="/simulate/acid-neutralization"')
    expect(content).toContain('mô phỏng cục bộ')
  })

  it('enforces landing-scoped workbench motion tokens and reduced-motion rules in globals.css', () => {
    const css = readFileSync(GLOBALS_CSS, 'utf8')

    // Tactile button states
    expect(css).toContain('.wp-action-btn:active')
    expect(css).toContain('.wp-reset-btn:active')
    expect(css).toContain('.wp-stepper-btn:active')
    expect(css).toContain('.wp-tab-btn:active')

    // Apparatus stirring animation
    expect(css).toContain('.wp-apparatus-frame.is-stirring')
    expect(css).toContain('@keyframes wp-stirring-gentle')

    // Reduced motion overrides
    expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.wp-apparatus-frame\.is-stirring[\s\S]*?animation:\s*none\s*!important/m)
    expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.wp-action-btn:active[\s\S]*?transform:\s*none\s*!important/m)
  })
})
