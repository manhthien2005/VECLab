import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const PAGE_FILE = join(ROOT, 'src', 'app', '(public)', 'page.tsx')
const SHOWCASE_FILE = join(ROOT, 'src', 'features', 'landing', 'experiment-showcase.tsx')
const TRACK_FILE = join(ROOT, 'src', 'features', 'landing', 'showcase-carousel-track.tsx')
const GLOBALS_CSS = join(ROOT, 'src', 'app', 'globals.css')

describe('Experiment Showcase R16.2 Architecture and Semantics', () => {
  it('preserves page.tsx as a pure Server Component without use client', () => {
    const content = readFileSync(PAGE_FILE, 'utf8')
    expect(content).not.toMatch(/^\s*['"]use client['"]/m)
  })

  it('marks ShowcaseCarouselTrack as a Client Component leaf', () => {
    const content = readFileSync(TRACK_FILE, 'utf8')
    expect(content).toMatch(/^\s*['"]use client['"]/m)
  })

  it('ensures ShowcaseCarouselTrack does not import scientific VisualComponents or scenario datasets', () => {
    const content = readFileSync(TRACK_FILE, 'utf8')
    expect(content).not.toContain('AcidShowcaseVisual')
    expect(content).not.toContain('CopperShowcaseVisual')
    expect(content).not.toContain('PlasticShowcaseVisual')
    expect(content).not.toContain('SHOWCASE_CARDS')
  })

  it('strictly forbids autoplay and auto-rotation timers in ShowcaseCarouselTrack', () => {
    const content = readFileSync(TRACK_FILE, 'utf8')
    expect(content).not.toContain('setInterval')
    expect(content).not.toMatch(/autoplay/i)
  })

  it('ensures W3C carousel semantics are used without tablist anti-patterns', () => {
    const trackContent = readFileSync(TRACK_FILE, 'utf8')
    const showcaseContent = readFileSync(SHOWCASE_FILE, 'utf8')

    // W3C Carousel region & slide roles
    expect(trackContent).toContain('aria-roledescription="carousel"')
    expect(trackContent).toContain('role="region"')
    expect(showcaseContent).toContain('role="group"')
    expect(showcaseContent).toContain('aria-roledescription="slide"')

    // Tabs semantics must NOT be used
    expect(trackContent).not.toContain('role="tablist"')
    expect(trackContent).not.toContain('role="tab"')
    expect(showcaseContent).not.toContain('role="tablist"')
    expect(showcaseContent).not.toContain('role="tab"')

    // Outer card container must NOT be made focusable (no nested interactive controls)
    expect(showcaseContent).not.toMatch(/className=.*showcase-card.*tabIndex=\{?0\}?/i)
  })

  it('preserves exact scientific scenario statuses, routes, and cards', () => {
    const content = readFileSync(SHOWCASE_FILE, 'utf8')

    // Exactly 3 scenario cards
    expect(content).toContain("'acid-neutralization'")
    expect(content).toContain("'copper-precipitation'")
    expect(content).toContain("'plastic-density-separation'")

    // Acid neutralization is LIVE and routes to simulation
    expect(content).toMatch(/scenarioKey:\s*'acid-neutralization'[\s\S]*?isLive:\s*true/)
    expect(content).toContain('/simulate/${scenarioKey}')

    // Copper and Plastic are PREVIEW and route to /experiments
    expect(content).toMatch(/scenarioKey:\s*'copper-precipitation'[\s\S]*?isLive:\s*false/)
    expect(content).toMatch(/scenarioKey:\s*'plastic-density-separation'[\s\S]*?isLive:\s*false/)
    expect(content).toContain("'/experiments'")
  })

  it('verifies landing-scoped motion tokens and button active states in globals.css', () => {
    const css = readFileSync(GLOBALS_CSS, 'utf8')

    // Motion tokens
    expect(css).toContain('--spring-tactile:')
    expect(css).toContain('--motion-micro:')
    expect(css).toContain('--motion-state:')

    // Scoped button states
    expect(css).toContain('.hero-btn-primary:active')
    expect(css).toContain('.hero-btn-secondary:active')
    expect(css).toContain('.final-cta-btn:active')

    // Generic button classes must not be modified with R16.2 tactile springs
    expect(css).not.toMatch(/^\.btn-primary:active\s*\{[^}]*--spring-tactile/m)

    // Reduced motion overrides are landing-scoped
    expect(css).toContain('.showcase-track')
    expect(css).toContain('.showcase-card')
  })
})
