import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const read = (file: string) => readFileSync(join(ROOT, file), 'utf8')

describe('UI-02 landing scope and scientific honesty', () => {
  it('keeps homepage a Server Component with honest anchor navigation', () => {
    const page = read('src/app/(public)/page.tsx')
    expect(page).not.toMatch(/^\s*['"]use client['"]/m)
    expect(page).toContain('href="#showcase"')
    expect(page).toContain('href="#workbench-preview"')
    expect(page).not.toContain('ScientificDisclosure')
  })
  it('declares three target lessons from one shared copy source', () => {
    const content = read('src/content/app.vi.ts')
    const showcase = read('src/features/landing/experiment-showcase.tsx')
    const home = content.split('  home: {')[1]?.split('  experimentDetail: {')[0] ?? ''
    expect(home).toContain("title: 'Điều chỉnh pH'")
    expect(home).toContain("title: 'Jar Test'")
    expect(home).toContain("title: 'Hấp phụ xanh methylene'")
    expect(home).toContain("status: 'Bản hiện có'")
    expect((home.match(/status: 'Đang phát triển'/g) ?? [])).toHaveLength(2)
    expect(home).not.toContain('copper-precipitation')
    expect(home).not.toContain('plastic-density-separation')
    expect(showcase).toContain('strings.showcaseCards')
    expect(showcase).not.toContain('SHOWCASE_CARDS')
  })
  it('only offers a launch link for available lessons', () => {
    const showcase = read('src/features/landing/experiment-showcase.tsx')
    expect(showcase).toContain('card.available ?')
    expect(showcase).toContain('href={card.href}')
    expect(showcase).not.toContain("'/experiments'")
  })
  it('demo changes local volume without a fabricated pH or attempt write', () => {
    const preview = read('src/features/landing/workbench-preview.tsx')
    expect(preview).toContain('setVolumeMl')
    expect(preview).toContain('Chưa đo')
    expect(preview).not.toContain('wp-chart-svg')
    expect(preview).not.toContain('fetch(')
    expect(preview).not.toContain('session.')
  })
  it('preserves carousel as a client leaf with native controls', () => {
    const track = read('src/features/landing/showcase-carousel-track.tsx')
    expect(track).toMatch(/^'use client'/)
    expect(track).toContain('aria-roledescription="carousel"')
    expect(track).not.toContain('setInterval')
  })
  it('evidence does not show Ksp, fixed source counts or third-party endorsement', () => {
    const evidence = read('src/features/landing/evidence-section.tsx')
    expect(evidence).not.toContain('K_sp')
    expect(evidence).not.toContain('19 nguồn')
    expect(evidence).not.toContain('IUPAC')
    expect(evidence).toContain('href="/evidence"')
  })
})
