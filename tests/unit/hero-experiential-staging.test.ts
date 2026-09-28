import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const PAGE_FILE = join(ROOT, 'src', 'app', '(public)', 'page.tsx')
const HERO_PREVIEW_FILE = join(ROOT, 'src', 'features', 'landing', 'hero-preview.tsx')
const HERO_POINTER_FILE = join(ROOT, 'src', 'features', 'landing', 'hero-pointer-stage.tsx')
const LANDING_VISUALS_FILE = join(ROOT, 'src', 'features', 'landing', 'landing-visuals.tsx')
const GLOBALS_CSS = join(ROOT, 'src', 'app', 'globals.css')

describe('Hero Experiential Staging and Pointer Depth Architecture (R17.2)', () => {
  it('preserves page.tsx as a pure Server Component without use client', () => {
    const content = readFileSync(PAGE_FILE, 'utf8')
    expect(content).not.toMatch(/^\s*['"]use client['"]/m)
  })

  it('preserves hero-preview.tsx as a pure Server Component without use client', () => {
    const content = readFileSync(HERO_PREVIEW_FILE, 'utf8')
    expect(content).not.toMatch(/^\s*['"]use client['"]/m)
  })

  it('marks HeroPointerStage as a client leaf with use client directive', () => {
    const content = readFileSync(HERO_POINTER_FILE, 'utf8')
    expect(content).toMatch(/^\s*['"]use client['"]/m)
  })

  it('ensures HeroPointerStage does not import scientific domain constants, chart, or data', () => {
    const content = readFileSync(HERO_POINTER_FILE, 'utf8')
    expect(content).not.toContain('ACID_INPUT_DOMAIN')
    expect(content).not.toContain('HeroPhChart')
    expect(content).not.toContain('formatPh')
    expect(content).not.toContain('benchmark')
    expect(content).not.toContain('CURVE_POINTS')
    expect(content).not.toContain('hero-apparatus')
    expect(content).not.toContain('@/content')
    expect(content).not.toContain('@/domain')
  })

  it('ensures HeroPointerStage uses zero per-frame React setState calls', () => {
    const content = readFileSync(HERO_POINTER_FILE, 'utf8')
    expect(content).not.toContain('useState')
    expect(content).not.toContain('setState')
    expect(content).toContain('requestAnimationFrame')
    expect(content).toContain('cancelAnimationFrame')
  })

  it('ensures pointer event listeners are scoped and never attach pointermove to window or document', () => {
    const content = readFileSync(HERO_POINTER_FILE, 'utf8')
    expect(content).not.toMatch(/window\.addEventListener\s*\(\s*['"]pointermove['"]/i)
    expect(content).not.toMatch(/document\.addEventListener\s*\(\s*['"]pointermove['"]/i)
    expect(content).toContain('onPointerMove')
    expect(content).toContain('onPointerLeave')
  })

  it('ensures pointer controller gates execution behind fine pointer and reduced motion checks in JS', () => {
    const content = readFileSync(HERO_POINTER_FILE, 'utf8')
    expect(content).toContain('(hover: hover) and (pointer: fine)')
    expect(content).toContain('(prefers-reduced-motion: reduce)')
  })

  it('forbids external animation packages and imperative WAAPI Element.animate()', () => {
    const files = [PAGE_FILE, HERO_PREVIEW_FILE, HERO_POINTER_FILE]
    for (const file of files) {
      const content = readFileSync(file, 'utf8')
      expect(content).not.toMatch(/from\s+['"]framer-motion['"]/i)
      expect(content).not.toMatch(/from\s+['"]motion['"]/i)
      expect(content).not.toMatch(/from\s+['"]gsap['"]/i)
      expect(content).not.toContain('.animate(')
    }
  })

  it('preserves scientific truth literals, pH values, equation and coordinates', () => {
    const previewContent = readFileSync(HERO_PREVIEW_FILE, 'utf8')
    const visualContent = readFileSync(LANDING_VISUALS_FILE, 'utf8')

    // Fixed telemetry & equation
    expect(previewContent).toContain('5,2')
    expect(previewContent).toContain('25,0 °C')
    expect(previewContent).toContain('HCl + NaOH → NaCl + H₂O')
    expect(previewContent).toContain('ACID_INPUT_DOMAIN.benchmark')

    // Illustrative curve data points locked
    expect(visualContent).toContain('CURVE_POINTS')
    expect(visualContent).toContain('[25, 6.995]')
  })

  it('separates entrance transform ownership from pointer depth transform layer in CSS', () => {
    const css = readFileSync(GLOBALS_CSS, 'utf8')

    // Macro entrance layer owns translateY and scale
    expect(css).toContain('.hero-preview-wrapper.rise-2')
    expect(css).toContain('@keyframes hero-frame-entrance')

    // Pointer depth layer owns perspective, rotateX, rotateY
    expect(css).toContain('.hero-pointer-stage')
    expect(css).toContain('perspective: 1200px')
    expect(css).toContain('rotateX(calc(var(--hero-pointer-y, 0) * -1.2deg))')
    expect(css).toContain('rotateY(calc(var(--hero-pointer-x, 0) * 1.2deg))')

    // Nested depth elements consume CSS variables with limits
    expect(css).toContain('.hero-depth-telemetry')
    expect(css).toContain('translate3d(calc(var(--hero-pointer-x, 0) * 4px)')
    expect(css).toContain('.hero-depth-apparatus')
    expect(css).toContain('translate3d(calc(var(--hero-pointer-x, 0) * -1.5px)')
  })

  it('retires perpetual floating bobbing in favor of settled pointer depth', () => {
    const css = readFileSync(GLOBALS_CSS, 'utf8')
    expect(css).toMatch(/\.hero-float-gentle,\s*\n\s*\.hero-float-gentle-alt\s*\{\s*\n\s*animation:\s*none\s*!important;/m)
  })

  it('guarantees complete reduced-motion safety in CSS', () => {
    const css = readFileSync(GLOBALS_CSS, 'utf8')
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
    expect(css).toContain('.hero-copy.rise')
    expect(css).toContain('.hero-preview-wrapper.rise-2')
    expect(css).toContain('.hero-pointer-stage .device-frame')
    expect(css).toContain('stroke-dashoffset: 0 !important')
  })
})
