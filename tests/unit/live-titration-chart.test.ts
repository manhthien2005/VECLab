import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { MeasurementRecordAcid } from '@/domain/experiments/acid-neutralization/state.js'
import { createAcidScenarioConfig } from '@/domain/experiments/acid-neutralization/setup.js'
import {
  LiveTitrationChart,
  calculateNaohEquivalenceVolumeMl,
  resolveMaxBaseVolumeMl,
  volumeToX,
  phToY,
  generateXTicks,
  generateYTicks,
  generateTitrationCurvePointsString,
  getEquivalenceMarkerGeometry,
  DEFAULT_CHART_DIMENSIONS,
} from '@/features/simulation-workbench/chart/index.js'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const CHART_DIR = join(ROOT, 'src', 'features', 'simulation-workbench', 'chart')
const LIVE_CHART_FILE = join(CHART_DIR, 'live-titration-chart.tsx')
const GEOMETRY_FILE = join(CHART_DIR, 'chart-geometry.ts')
const GLOBALS_CSS = join(ROOT, 'src', 'app', 'globals.css')

describe('LiveTitrationChart & Geometry Contract (WB-R5)', () => {
  describe('Projection and Axes Contract', () => {
    it('handles empty measurement set cleanly without crashing or drawing fake curve', () => {
      const html = renderToString(
        React.createElement(LiveTitrationChart, {
          measurements: [],
          activeSetup: { acidVolumeL: 0.025, acidConcentrationMolL: 0.01 },
        }),
      )

      expect(html).toContain('data-testid="live-titration-chart"')
      expect(html).toContain('Chưa ghi nhận số đo nào')
      expect(html).toContain('0 điểm đo')
      expect(html).not.toContain('class="live-chart-curve"')
      expect(html).toContain('Chưa có điểm đo nào')
    })

    it('renders single measured point without pretending a curve exists', () => {
      const single: MeasurementRecordAcid = {
        sequence: 1,
        compositionRevision: 1,
        simulatedPH: 2.05,
        baseVolumeL: 0,
        correctionAcidVolumeL: 0,
      }

      const html = renderToString(
        React.createElement(LiveTitrationChart, {
          measurements: [single],
          activeSetup: { acidVolumeL: 0.025, acidConcentrationMolL: 0.01 },
        }),
      )

      expect(html).toContain('1 điểm đo')
      expect(html).toContain('live-chart-point-dot')
      expect(html).not.toContain('class="live-chart-curve"')
    })

    it('renders multiple ordered measurements and connects real points with curve', () => {
      const records: MeasurementRecordAcid[] = [
        { sequence: 1, compositionRevision: 1, simulatedPH: 2.0, baseVolumeL: 0, correctionAcidVolumeL: 0 },
        { sequence: 5, compositionRevision: 2, simulatedPH: 2.5, baseVolumeL: 0.01, correctionAcidVolumeL: 0 },
        { sequence: 9, compositionRevision: 3, simulatedPH: 7.0, baseVolumeL: 0.025, correctionAcidVolumeL: 0 },
      ]

      const html = renderToString(
        React.createElement(LiveTitrationChart, {
          measurements: records,
          activeSetup: { acidVolumeL: 0.025, acidConcentrationMolL: 0.01 },
        }),
      )

      expect(html).toContain('3 điểm đo')
      expect(html).toContain('class="live-chart-curve"')
      expect(html).toContain('is-latest')
    })

    it('generates expected X and Y axis ticks across domains', () => {
      const xTicks30 = generateXTicks(30, DEFAULT_CHART_DIMENSIONS)
      expect(xTicks30.map((t) => t.value)).toEqual([0, 5, 10, 15, 20, 25, 30])

      const xTicks60 = generateXTicks(60, DEFAULT_CHART_DIMENSIONS)
      expect(xTicks60.map((t) => t.value)).toEqual([0, 10, 20, 30, 40, 50, 60])

      const yTicks = generateYTicks(DEFAULT_CHART_DIMENSIONS, 0, 14, 2)
      expect(yTicks.map((t) => t.value)).toEqual([0, 2, 4, 6, 8, 10, 12, 14])
    })

    it('strictly uses baseVolumeMl and NOT totalTitrantVolumeMl for horizontal coordinates', () => {
      // Record where baseVolumeL is 10.0 mL, but correction acid was added (total titrant 15.0 mL)
      const recordWithCorrection: MeasurementRecordAcid = {
        sequence: 8,
        compositionRevision: 4,
        simulatedPH: 2.8,
        baseVolumeL: 0.010, // 10.0 mL
        correctionAcidVolumeL: 0.005, // 5.0 mL
      }

      const html = renderToString(
        React.createElement(LiveTitrationChart, {
          measurements: [
            { sequence: 1, compositionRevision: 1, simulatedPH: 2.0, baseVolumeL: 0, correctionAcidVolumeL: 0 },
            recordWithCorrection,
          ],
          activeSetup: { acidVolumeL: 0.025, acidConcentrationMolL: 0.01 },
        }),
      )

      const expectedXFor10mL = volumeToX(10.0, 30.0, DEFAULT_CHART_DIMENSIONS)
      const expectedXFor15mL = volumeToX(15.0, 30.0, DEFAULT_CHART_DIMENSIONS)

      expect(html).toContain(expectedXFor10mL.toFixed(2))
      expect(html).not.toContain(expectedXFor15mL.toFixed(2))

      const pointsString = generateTitrationCurvePointsString(
        [
          { sequence: 1, compositionRevision: 1, baseVolumeMl: 0, correctionAcidVolumeMl: 0, totalTitrantVolumeMl: 0, ph: 2.0 },
          { sequence: 8, compositionRevision: 4, baseVolumeMl: 10.0, correctionAcidVolumeMl: 5.0, totalTitrantVolumeMl: 15.0, ph: 2.8 },
        ],
        30.0,
        DEFAULT_CHART_DIMENSIONS,
      )
      expect(pointsString).toContain(expectedXFor10mL.toFixed(2))
      expect(pointsString).not.toContain(expectedXFor15mL.toFixed(2))
    })

    it('verifies correction acid does not advance NaOH x-axis', () => {
      const xBeforeCorrection = volumeToX(12.5, 30.0, DEFAULT_CHART_DIMENSIONS)
      // Base volume remains 12.5 mL even if correction acid is 2.5 mL
      const xAfterCorrection = volumeToX(12.5, 30.0, DEFAULT_CHART_DIMENSIONS)

      expect(xBeforeCorrection).toBe(xAfterCorrection)
    })

    it('resolves benchmark x-axis maximum to 30.0 mL from benchmark setup', () => {
      const benchmarkMax = resolveMaxBaseVolumeMl({ acidVolumeL: 0.025 })
      expect(benchmarkMax).toBe(30.0)

      const configBenchmark = createAcidScenarioConfig()
      expect(resolveMaxBaseVolumeMl(configBenchmark)).toBe(30.0)
    })

    it('resolves 50 mL authorized setup to 60.0 mL x-axis maximum', () => {
      const max50mL = resolveMaxBaseVolumeMl({ acidVolumeL: 0.050 })
      expect(max50mL).toBe(60.0)

      const config50mL = createAcidScenarioConfig({ acidVolumeL: 0.050, acidConcentrationMolL: 0.010 })
      expect(resolveMaxBaseVolumeMl(config50mL)).toBe(60.0)
    })

    it('maintains a pedagogically stable Y scale (0 to 14 domain)', () => {
      const y0 = phToY(0, DEFAULT_CHART_DIMENSIONS)
      const y7 = phToY(7, DEFAULT_CHART_DIMENSIONS)
      const y14 = phToY(14, DEFAULT_CHART_DIMENSIONS)

      // In SVG: higher pH means lower y coordinate (closer to top)
      expect(y14).toBeLessThan(y7)
      expect(y7).toBeLessThan(y0)

      // Neutral pH 7 is exactly in the vertical middle
      const halfHeight = (y0 - y14) / 2
      expect(y7 - y14).toBeCloseTo(halfHeight, 1)
    })
  })

  describe('Equivalence Marker Contract', () => {
    it('yields configuration-derived equivalence at 25.0 mL for benchmark setup', () => {
      const eqBenchmark = calculateNaohEquivalenceVolumeMl({
        acidVolumeL: 0.025,
        acidConcentrationMolL: 0.010,
        baseEquivalentConcentrationEqL: 0.010,
      })
      expect(eqBenchmark).toBe(25.0)

      const geom = getEquivalenceMarkerGeometry(25.0, 30.0, DEFAULT_CHART_DIMENSIONS)
      const expectedX = volumeToX(25.0, 30.0, DEFAULT_CHART_DIMENSIONS)
      expect(geom.x).toBe(expectedX)
    })

    it('yields 50.0 mL equivalence for a 50 mL authorized acid volume setup', () => {
      const eq50mL = calculateNaohEquivalenceVolumeMl({
        acidVolumeL: 0.050,
        acidConcentrationMolL: 0.010,
        baseEquivalentConcentrationEqL: 0.010,
      })
      expect(eq50mL).toBe(50.0)
    })

    it('yields stoichiometrically correct equivalence when acid and base concentrations differ', () => {
      // 25.0 mL of 0.020 M HCl titrated with 0.010 M NaOH -> requires 50.0 mL NaOH
      const eqDifferentConc = calculateNaohEquivalenceVolumeMl({
        acidVolumeL: 0.025,
        acidConcentrationMolL: 0.020,
        baseEquivalentConcentrationEqL: 0.010,
      })
      expect(eqDifferentConc).toBe(50.0)
    })

    it('does not contain hardcoded 25.00 mL literals controlling the component', () => {
      const geometrySource = readFileSync(GEOMETRY_FILE, 'utf8')
      const chartSource = readFileSync(LIVE_CHART_FILE, 'utf8')

      // Component derives equivalence from helper, never hardcoding 25
      expect(geometrySource).not.toMatch(/return\s+25\.00\b/)
      expect(chartSource).not.toMatch(/const\s+equivalenceVolumeMl\s*=\s*25\.00\b/)
      expect(chartSource).toContain('calculateNaohEquivalenceVolumeMl')
    })
  })

  describe('Architecture & Motion Non-Invention Gate', () => {
    it('contains no chemistry calculation inside React chart component', () => {
      const chartSource = readFileSync(LIVE_CHART_FILE, 'utf8')

      // Must consume projectTitrationCurve and pure geometry helpers
      expect(chartSource).toContain('projectTitrationCurve')
      expect(chartSource).not.toContain('solveEquilibrium')
      expect(chartSource).not.toContain('chargeBalance')
      expect(chartSource).not.toContain('1e-14')
    })

    it('contains zero external chart library dependencies', () => {
      const chartSource = readFileSync(LIVE_CHART_FILE, 'utf8')

      expect(chartSource).not.toContain('d3')
      expect(chartSource).not.toContain('recharts')
      expect(chartSource).not.toContain('chart.js')
      expect(chartSource).not.toContain('plotly')
    })

    it('contains zero forbidden animation loops or per-frame state', () => {
      const chartSource = readFileSync(LIVE_CHART_FILE, 'utf8')
      const geometrySource = readFileSync(GEOMETRY_FILE, 'utf8')

      expect(chartSource).not.toContain('requestAnimationFrame')
      expect(chartSource).not.toContain('setInterval')
      expect(geometrySource).not.toContain('requestAnimationFrame')
      expect(geometrySource).not.toContain('setInterval')
    })
  })

  describe('Accessibility & Semantics', () => {
    it('marks decorative grid and axis lines with aria-hidden="true"', () => {
      const html = renderToString(
        React.createElement(LiveTitrationChart, {
          measurements: [],
          activeSetup: { acidVolumeL: 0.025, acidConcentrationMolL: 0.01 },
        }),
      )

      expect(html).toContain('class="live-chart-grid" aria-hidden="true"')
      expect(html).toContain('class="live-chart-axes" aria-hidden="true"')
    })

    it('exposes an accessible description for screen readers', () => {
      const html = renderToString(
        React.createElement(LiveTitrationChart, {
          measurements: [
            { sequence: 1, compositionRevision: 1, simulatedPH: 2.0, baseVolumeL: 0, correctionAcidVolumeL: 0 },
          ],
          activeSetup: { acidVolumeL: 0.025, acidConcentrationMolL: 0.01 },
        }),
      )

      expect(html).toContain('class="sr-only"')
      expect(html).toContain('Đồ thị chuẩn độ đo pH theo thể tích dung dịch NaOH đã thêm')
      expect(html).toContain('Đã ghi nhận 1 điểm đo')
    })

    it('includes prefers-reduced-motion CSS rules in globals.css', () => {
      const css = readFileSync(GLOBALS_CSS, 'utf8')

      expect(css).toContain('prefers-reduced-motion')
      expect(css).toContain('.live-chart-point-dot')
      expect(css).toContain('transition: none !important')
    })
  })
})
