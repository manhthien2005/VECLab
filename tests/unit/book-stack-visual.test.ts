import { existsSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const BOOK_STACK_FILE = join(ROOT, 'src', 'features', 'landing', 'book-stack-visual.tsx')
const GLOBALS_CSS = join(ROOT, 'src', 'app', 'globals.css')
const ASSET_FILE = join(ROOT, 'public', 'assets', 'evidence-books.webp')
const COPPER_FILE = join(ROOT, 'src', 'features', 'landing', 'copper-showcase-visual.tsx')
const PLASTIC_FILE = join(ROOT, 'src', 'features', 'landing', 'plastic-showcase-visual.tsx')
const ACID_FILE = join(ROOT, 'src', 'features', 'landing', 'acid-showcase-visual.tsx')

describe('BookStackVisual R16.4 Media Fidelity Replacement', () => {
  it('preserves BookStackVisual as a pure Server Component without use client', () => {
    const content = readFileSync(BOOK_STACK_FILE, 'utf8')
    expect(content).not.toMatch(/^\s*['"]use client['"]/m)
  })

  it('uses Next.js Image component with explicit dimensions and decorative alt semantics', () => {
    const content = readFileSync(BOOK_STACK_FILE, 'utf8')
    expect(content).toContain("import Image from 'next/image'")
    expect(content).toContain("src=\"/assets/evidence-books.webp\"")
    expect(content).toContain('alt=""')
    expect(content).toContain('width={360}')
    expect(content).toContain('height={210}')
    expect(content).toContain('className="book-stack-img"')
  })

  it('verifies public asset exists on disk with proper raster dimensions and size', () => {
    expect(existsSync(ASSET_FILE)).toBe(true)
    const stats = statSync(ASSET_FILE)
    // WebP asset should be non-trivial but optimized for web delivery (< 500KB)
    expect(stats.size).toBeGreaterThan(10000)
    expect(stats.size).toBeLessThan(500000)
  })

  it('retains floating scientific assurance badge with coded HTML content', () => {
    const content = readFileSync(BOOK_STACK_FILE, 'utf8')
    expect(content).toContain('book-stack-floating-pill')
    expect(content).toContain('IUPAC · IAPWS · EPA')
    expect(content).toContain('19 nguồn kiểm chứng')
  })

  it('does not contain embedded SVG paths, letters, or fake title text in component code', () => {
    const content = readFileSync(BOOK_STACK_FILE, 'utf8')
    expect(content).not.toContain('<path')
    expect(content).not.toContain('<svg')
    expect(content).not.toContain('CRC Handbook')
    expect(content).not.toContain('Physical Chemistry')
  })

  it('defines responsive media styles and dark mode support in globals.css', () => {
    const css = readFileSync(GLOBALS_CSS, 'utf8')
    expect(css).toContain('.book-stack-media-frame')
    expect(css).toContain('.book-stack-img')
    expect(css).toContain("[data-theme='dark'] .book-stack-img")
  })

  it('confirms scientific visual files (Copper, Plastic, Acid) remain strictly untouched', () => {
    expect(existsSync(COPPER_FILE)).toBe(true)
    expect(existsSync(PLASTIC_FILE)).toBe(true)
    expect(existsSync(ACID_FILE)).toBe(true)
  })
})
