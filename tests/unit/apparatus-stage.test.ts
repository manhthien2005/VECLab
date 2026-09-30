import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { TitrationApparatusStage } from '@/features/simulation-workbench/apparatus/titration-apparatus-stage.js'
import { BuretteAssembly } from '@/features/simulation-workbench/apparatus/burette-assembly.js'
import { ReactionBeaker } from '@/features/simulation-workbench/apparatus/reaction-beaker.js'
import { PhProbe } from '@/features/simulation-workbench/apparatus/ph-probe.js'
import { MagneticStirrer } from '@/features/simulation-workbench/apparatus/magnetic-stirrer.js'
import { DropletStream } from '@/features/simulation-workbench/apparatus/droplet-stream.js'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const APPARATUS_DIR = join(
  ROOT,
  'src',
  'features',
  'simulation-workbench',
  'apparatus',
)
const STAGE_FILE = join(APPARATUS_DIR, 'titration-apparatus-stage.tsx')
const BURETTE_FILE = join(APPARATUS_DIR, 'burette-assembly.tsx')
const BEAKER_FILE = join(APPARATUS_DIR, 'reaction-beaker.tsx')
const PROBE_FILE = join(APPARATUS_DIR, 'ph-probe.tsx')
const STIRRER_FILE = join(APPARATUS_DIR, 'magnetic-stirrer.tsx')
const DROPLET_FILE = join(APPARATUS_DIR, 'droplet-stream.tsx')
const GLOBALS_CSS = join(ROOT, 'src', 'app', 'globals.css')

describe('Titration Apparatus Stage Component Architecture (WB-R4)', () => {
  it('renders TitrationApparatusStage cleanly with React 19 SSR without errors', () => {
    const html = renderToString(
      React.createElement(TitrationApparatusStage, {
        addedBaseVolumeMl: 25,
        totalVolumeMl: 50,
        stirrerRpm: 300,
        stirrerActive: false,
        operationStage: 'idle',
      }),
    )

    expect(html).toContain('wb-apparatus-svg')
    expect(html).toContain('wb-burette-assembly')
    expect(html).toContain('wb-reaction-beaker')
    expect(html).toContain('wb-ph-probe')
    expect(html).toContain('wb-magnetic-stirrer-and-stand')
    expect(html).toContain('wb-droplet-stream')
    expect(html).toContain('role="img"')
    expect(html).toContain('Bộ dụng cụ chuẩn độ axit - bazơ VECLab')
  })

  it('renders all modular sub-components directly without throwing', () => {
    const burette = renderToString(React.createElement(BuretteAssembly, { addedBaseVolumeMl: 10 }))
    expect(burette).toContain('wb-burette-assembly')

    const beaker = renderToString(React.createElement(ReactionBeaker, { totalVolumeMl: 50 }))
    expect(beaker).toContain('wb-reaction-beaker')

    const probe = renderToString(React.createElement(PhProbe, { isSubmerged: true }))
    expect(probe).toContain('wb-ph-probe')

    const stirrer = renderToString(React.createElement(MagneticStirrer, { stirrerRpm: 300, isStirring: true }))
    expect(stirrer).toContain('wb-magnetic-stirrer-and-stand')

    const droplet = renderToString(React.createElement(DropletStream, { isDispensing: true, targetY: 450 }))
    expect(droplet).toContain('wb-droplet-stream')
  })

  it('updates burette and beaker geometry deterministically when props change', () => {
    const initialHtml = renderToString(
      React.createElement(TitrationApparatusStage, {
        addedBaseVolumeMl: 0,
        totalVolumeMl: 25,
      }),
    )

    const dosedHtml = renderToString(
      React.createElement(TitrationApparatusStage, {
        addedBaseVolumeMl: 40,
        totalVolumeMl: 65,
      }),
    )

    // Delivered text tags reflect prop values
    expect(initialHtml).toContain('0 mL')
    expect(dosedHtml).toContain('40 mL')
    expect(initialHtml).toContain('25 mL')
    expect(dosedHtml).toContain('65 mL')

    // Liquid geometries differ
    expect(initialHtml).not.toEqual(dosedHtml)
  })

  it('reflects operational stages (dispensing, mixing, calibrating, measuring) in classes and labels', () => {
    const dispensingHtml = renderToString(
      React.createElement(TitrationApparatusStage, {
        addedBaseVolumeMl: 10,
        totalVolumeMl: 35,
        operationStage: 'dispensing',
      }),
    )
    expect(dispensingHtml).toContain('is-dispensing')
    expect(dispensingHtml).toContain('Đang cấp dung dịch')

    const mixingHtml = renderToString(
      React.createElement(TitrationApparatusStage, {
        addedBaseVolumeMl: 10,
        totalVolumeMl: 35,
        operationStage: 'mixing',
        stirrerRpm: 450,
      }),
    )
    expect(mixingHtml).toContain('is-stirring')
    expect(mixingHtml).toContain('450 RPM')
    expect(mixingHtml).toContain('Đang khuấy mẫu')
  })

  it('supports explicit responsive viewMode framing (desktop full scene vs mobile focused)', () => {
    const desktopHtml = renderToString(
      React.createElement(TitrationApparatusStage, {
        addedBaseVolumeMl: 0,
        totalVolumeMl: 25,
        viewMode: 'desktop',
      }),
    )
    expect(desktopHtml).toContain('viewBox="0 0 800 600"')

    const mobileHtml = renderToString(
      React.createElement(TitrationApparatusStage, {
        addedBaseVolumeMl: 0,
        totalVolumeMl: 25,
        viewMode: 'mobile',
      }),
    )
    expect(mobileHtml).toContain('viewBox="200 185 400 380"')
  })

  it('ensures apparatus stage is a clean laboratory instrument without floating diagram callout pills', () => {
    const stageContent = readFileSync(STAGE_FILE, 'utf8')
    const buretteContent = readFileSync(BURETTE_FILE, 'utf8')
    const beakerContent = readFileSync(BEAKER_FILE, 'utf8')

    // Floating diagram tags removed
    expect(stageContent).not.toContain('wb-stage-status-badge')
    expect(buretteContent).not.toContain('wb-burette-tag-bg')
    expect(beakerContent).not.toContain('wb-beaker-vol-tag')
  })
})

describe('Titration Apparatus Scientific State Truth & Zero Chemistry Duplication', () => {
  it('ensures no apparatus component contains mutable chemistry state or performs pH calculations', () => {
    const files = [
      STAGE_FILE,
      BURETTE_FILE,
      BEAKER_FILE,
      PROBE_FILE,
      STIRRER_FILE,
      DROPLET_FILE,
    ]

    for (const file of files) {
      const content = readFileSync(file, 'utf8')

      // Zero local chemistry computation
      expect(content).not.toMatch(/chlorideMoles/)
      expect(content).not.toMatch(/sodiumMoles/)
      expect(content).not.toMatch(/Math\.log10/)
      expect(content).not.toMatch(/calcPh/)
      expect(content).not.toMatch(/setPh/)
      expect(content).not.toMatch(/equilibrium/i)

      // Zero animation loops in JS
      expect(content).not.toContain('requestAnimationFrame')
      expect(content).not.toContain('setInterval')
    }
  })

  it('ensures solution visual truth forbids pH-dependent liquid coloration and indicators', () => {
    const files = [STAGE_FILE, BEAKER_FILE, GLOBALS_CSS]

    for (const file of files) {
      const content = readFileSync(file, 'utf8')
      // No phenolphthalein pink or universal indicator color logic in apparatus
      expect(content).not.toMatch(/phenolphthalein/i)
      expect(content).not.toMatch(/pink/i)
      expect(content).not.toMatch(/indicatorColor/i)
      expect(content).not.toMatch(/rainbow/i)
    }
  })

  it('ensures changing visual stirrer RPM does not dispatch chemistry actions or alter calculations', () => {
    const stirrerContent = readFileSync(STIRRER_FILE, 'utf8')
    expect(stirrerContent).not.toMatch(/dispatch/)
    expect(stirrerContent).not.toMatch(/apply\(/)
    expect(stirrerContent).not.toMatch(/session/)
  })
})

describe('Titration Apparatus Accessibility and Reduced Motion', () => {
  it('ensures root SVG exposes concise accessibility semantics and internal nodes are aria-hidden', () => {
    const stageContent = readFileSync(STAGE_FILE, 'utf8')
    expect(stageContent).toContain('role="img"')
    expect(stageContent).toContain('<title>')
    expect(stageContent).toContain('<desc>')
    expect(stageContent).toContain('aria-hidden="true"')
  })

  it('ensures CSS contains prefers-reduced-motion overrides disabling stir and droplet animations', () => {
    const css = readFileSync(GLOBALS_CSS, 'utf8')
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
    expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?wb-stir-bar-group[\s\S]*?animation:\s*none\s*!important/m)
    expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?wb-droplet-falling-wrapper[\s\S]*?animation:\s*none\s*!important/m)
  })

  it('ensures apparatus supports both light and dark themes using semantic tokens', () => {
    const css = readFileSync(GLOBALS_CSS, 'utf8')
    expect(css).toContain('.wb-apparatus-stage-container')
    expect(css).toContain('var(--surface-raised')
    expect(css).toContain('var(--border')
    expect(css).toContain('var(--accent')
    expect(css).toContain('var(--ink')
    expect(css).toContain('var(--cyan')
  })
})
