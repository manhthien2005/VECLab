import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const PAGE_FILE = join(ROOT, 'src', 'app', '(public)', 'page.tsx')
const WORKBENCH_FILE = join(ROOT, 'src', 'features', 'landing', 'workbench-preview.tsx')
const GLOBALS_CSS = join(ROOT, 'src', 'app', 'globals.css')
const COPY_FILE = join(ROOT, 'src', 'content', 'app.vi.ts')

describe('WorkbenchPreview lab-cycle preview (no fake chemistry)', () => {
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

    expect(content).toContain('pulseTimerRef')
    expect(content).toContain('toastTimerRef')
    expect(content).toContain('useRef')

    expect(content).toContain('clearActiveTimers')
    expect(content).toContain('clearTimeout(pulseTimerRef.current)')
    expect(content).toContain('clearTimeout(toastTimerRef.current)')

    expect(content).toMatch(/useEffect\(\s*\(\)\s*=>\s*\{[\s\S]*?return\s*\(\)\s*=>\s*\{[\s\S]*?clearActiveTimers\(\)/)

    expect(content).toMatch(/handleAddReagent\s*=\s*\(\)\s*=>\s*\{[\s\S]*?clearActiveTimers\(\)/)
    expect(content).toMatch(/handleResetPreview\s*=\s*\(\)\s*=>\s*\{[\s\S]*?clearActiveTimers\(\)/)
  })

  it('shows locked NaOH and no other reagent picker', () => {
    const content = readFileSync(WORKBENCH_FILE, 'utf8')
    const copy = readFileSync(COPY_FILE, 'utf8')

    expect(copy).toContain("workbenchReagent: 'NaOH 0,0100 M'")
    expect(content).toContain('strings.workbenchReagent')
    expect(content).not.toContain('preview-reagent-select')
    expect(content).not.toContain('preview-volume-input')
    expect(content).not.toContain('Ca(OH)₂')
    expect(content).not.toContain('Na₂CO₃')
  })

  it('keeps a fixed illustrative pH snapshot without computing telemetry', () => {
    const content = readFileSync(WORKBENCH_FILE, 'utf8')

    expect(content).toContain('>4,8<')
    expect(content).not.toMatch(/setPh\(/)
    expect(content).not.toMatch(/ph\s*=\s*calc/i)
    expect(content).toContain('cx="180" cy="95"')

    expect(content).not.toContain('fetch(')
    expect(content).not.toContain('supabase')
    expect(content).not.toContain('localStorage')
    expect(content).not.toContain('sessionStorage')
  })

  it('uses the four-beat lab cycle and links to the full simulation', () => {
    const content = readFileSync(WORKBENCH_FILE, 'utf8')
    const copy = readFileSync(COPY_FILE, 'utf8')

    expect(copy).toContain("'Chuẩn bị mẫu', 'Thêm từng giọt', 'Đọc pH', 'Xem đường cong'")
    expect(content).toContain("const SIMULATE_HREF = '/simulate/acid-neutralization'")
    expect(content).toContain('href={SIMULATE_HREF}')
    expect(content).toContain('strings.workbenchDemoFeedback')
    expect(copy).toContain('mô phỏng cục bộ')
    expect(content).toContain('Bước {activeStepIndex + 1} / {stepCount}')
    expect(content).not.toContain('Bước 2 / 5')
  })

  it('enforces landing-scoped workbench motion tokens and reduced-motion rules in globals.css', () => {
    const css = readFileSync(GLOBALS_CSS, 'utf8')

    expect(css).toContain('.wp-action-btn:active')
    expect(css).toContain('.wp-reset-btn:active')
    expect(css).toContain('.wp-apparatus-frame.is-stirring')
    expect(css).toContain('@keyframes wp-stirring-gentle')

    expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.wp-apparatus-frame\.is-stirring[\s\S]*?animation:\s*none\s*!important/m)
    expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.wp-action-btn:active[\s\S]*?transform:\s*none\s*!important/m)
  })

  it('coordinates the local add pulse without advancing the protocol', () => {
    const content = readFileSync(WORKBENCH_FILE, 'utf8')
    const css = readFileSync(GLOBALS_CSS, 'utf8')

    expect(content).toContain('is-addition-active')
    expect(content).toContain('is-volume-pulse')
    expect(content).toContain('wp-volume-value')
    expect(content).toContain('>4,8<')
    expect(content).toContain('const activeStepIndex = 1')

    expect(css).toContain('@keyframes wp-volume-flash')
    expect(css).toContain('@keyframes wb-step-pulse')
    expect(css).toMatch(/@keyframes\s+wp-stirring-gentle\s*\{[^}]*rotate\(/m)

    expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.wb-step-active\.is-addition-active[\s\S]*?animation:\s*none\s*!important/m)
    expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.wp-volume-value\.is-volume-pulse[\s\S]*?animation:\s*none\s*!important/m)
  })
})
