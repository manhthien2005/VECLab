import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { AcidNeutralizationState } from '@/domain/experiments/acid-neutralization/state.js'
import {
  InstrumentTelemetryHud,
  evaluateMeasurementState,
} from '@/features/simulation-workbench/telemetry/index.js'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const TELEMETRY_DIR = join(ROOT, 'src', 'features', 'simulation-workbench', 'telemetry')
const HUD_FILE = join(TELEMETRY_DIR, 'instrument-telemetry-hud.tsx')
const GLOBALS_CSS = join(ROOT, 'src', 'app', 'globals.css')

function createMockDomainState(overrides?: Partial<AcidNeutralizationState>): AcidNeutralizationState {
  return {
    route: 'naoh',
    phase: 'ready',
    compositionRevision: 2,
    totalVolumeL: 0.025,
    chlorideMoles: 0.00025,
    sodiumMoles: 0,
    calciumMoles: 0,
    totalInorganicCarbonMoles: 0,
    baseVolumeL: 0,
    correctionAcidVolumeL: 0,
    aliquotHistory: [],
    directionChangeCount: 0,
    meterCalibrated: true,
    mixedSinceLastAddition: true,
    readingStable: true,
    lastMeasuredPH: 2.05,
    lastMeasuredCompositionRevision: 2,
    measurements: [
      { sequence: 1, compositionRevision: 2, simulatedPH: 2.05, baseVolumeL: 0, correctionAcidVolumeL: 0 },
    ],
    equilibrium: {
      hydrogenMolL: 0.0089,
      hydroxideMolL: 1.15e-12,
      simulatedPH: 2.05,
      chargeBalanceResidualMolL: 1e-15,
    },
    modelValid: true,
    invalidReasonCodes: [],
    ...overrides,
  }
}

describe('InstrumentTelemetryHud & State Truth Contract (WB-R5)', () => {
  describe('Authoritative pH and Measurement Status', () => {
    it('displays authoritative lastMeasuredPH prominently when reading is stable and current', () => {
      const domain = createMockDomainState({
        lastMeasuredPH: 2.05,
        lastMeasuredCompositionRevision: 2,
        compositionRevision: 2,
        readingStable: true,
      })

      const html = renderToString(
        React.createElement(InstrumentTelemetryHud, {
          domain,
        }),
      )

      expect(html).toContain('data-testid="instrument-telemetry-hud"')
      expect(html).toContain('2,05')
      expect(html).toContain('status-stable')
      expect(html).toContain('Ổn định')
      expect(html).not.toContain('telemetry-stale-notice')
    })

    it('displays clear pending status and retains prior reading as stale when aliquot added', () => {
      // Aliquot added: compositionRevision bumped from 2 to 3, but last measured revision is still 2
      const domain = createMockDomainState({
        compositionRevision: 3,
        lastMeasuredCompositionRevision: 2,
        lastMeasuredPH: 2.05,
        readingStable: false,
        equilibrium: {
          hydrogenMolL: 0.005,
          hydroxideMolL: 2e-12,
          simulatedPH: 2.30, // Theoretical pH of unmeasured mixture
          chargeBalanceResidualMolL: 1e-15,
        },
      })

      const evaluation = evaluateMeasurementState(domain)
      expect(evaluation.status).toBe('pending')
      expect(evaluation.isStale).toBe(true)
      expect(evaluation.label).toBe('Chờ đo')

      const html = renderToString(
        React.createElement(InstrumentTelemetryHud, {
          domain,
        }),
      )

      expect(html).toContain('status-pending')
      expect(html).toContain('Chờ đo')
      expect(html).toContain('is-stale')
      expect(html).toContain('telemetry-stale-notice')
      // Must NOT display theoretical simulatedPH (2.30)
      expect(html).not.toContain('2,30')
      // Retains prior measured value 2.05 clearly marked stale
      expect(html).toContain('2,05')
    })

    it('retains last measured pH from domain.measurements as pending/stale when engine clears lastMeasuredPH on reagent addition (WB-R5.1 regression)', () => {
      // Upon add_base, domain engine invalidateReading sets lastMeasuredPH = null, but domain.measurements preserves history
      const domain = createMockDomainState({
        compositionRevision: 3,
        lastMeasuredCompositionRevision: null,
        lastMeasuredPH: null,
        readingStable: false,
        measurements: [
          {
            sequence: 4,
            compositionRevision: 2,
            simulatedPH: 2.0,
            baseVolumeL: 0,
            correctionAcidVolumeL: 0,
          },
        ],
      })

      const evaluation = evaluateMeasurementState(domain)
      expect(evaluation.status).toBe('pending')
      expect(evaluation.isStale).toBe(true)
      expect(evaluation.label).toBe('Chờ đo')
      expect(evaluation.lastMeasuredPh).toBe(2.0)

      const html = renderToString(
        React.createElement(InstrumentTelemetryHud, {
          domain,
        }),
      )

      expect(html).toContain('status-pending')
      expect(html).toContain('Chờ đo')
      expect(html).toContain('is-stale')
      expect(html).toContain('telemetry-stale-notice')
      expect(html).toContain('2,00')
    })

    it('distinguishes uncalibrated meter state cleanly without showing fake readings', () => {
      const domain = createMockDomainState({
        meterCalibrated: false,
        lastMeasuredPH: null,
      })

      const evaluation = evaluateMeasurementState(domain)
      expect(evaluation.status).toBe('uncalibrated')
      expect(evaluation.lastMeasuredPh).toBeNull()

      const html = renderToString(
        React.createElement(InstrumentTelemetryHud, {
          domain,
        }),
      )

      expect(html).toContain('status-uncalibrated')
      expect(html).toContain('Chưa hiệu chuẩn')
      expect(html).toContain('value-placeholder')
      expect(html).toContain('—')
    })

    it('distinguishes unmeasured pre-measurement state cleanly', () => {
      const domain = createMockDomainState({
        meterCalibrated: true,
        lastMeasuredPH: null,
        measurements: [],
      })

      const evaluation = evaluateMeasurementState(domain)
      expect(evaluation.status).toBe('unmeasured')
      expect(evaluation.lastMeasuredPh).toBeNull()

      const html = renderToString(
        React.createElement(InstrumentTelemetryHud, {
          domain,
        }),
      )

      expect(html).toContain('status-unmeasured')
      expect(html).toContain('Chưa đo')
      expect(html).toContain('—')
    })
  })

  describe('Authoritative Secondary Volume and Temperature Readouts', () => {
    it('accurately displays authoritative NaOH added volume in mL', () => {
      const domain = createMockDomainState({
        baseVolumeL: 0.0125, // 12.5 mL
      })

      const html = renderToString(React.createElement(InstrumentTelemetryHud, { domain }))

      expect(html).toContain('data-testid="telemetry-naoh-volume"')
      expect(html).toContain('12,50 mL')
    })

    it('accurately displays authoritative total solution volume in mL', () => {
      const domain = createMockDomainState({
        totalVolumeL: 0.0375, // 37.5 mL
      })

      const html = renderToString(React.createElement(InstrumentTelemetryHud, { domain }))

      expect(html).toContain('data-testid="telemetry-total-volume"')
      expect(html).toContain('37,50 mL')
    })

    it('displays constant 25.0 °C scientific temperature', () => {
      const domain = createMockDomainState()

      const html = renderToString(React.createElement(InstrumentTelemetryHud, { domain }))

      expect(html).toContain('data-testid="telemetry-temperature"')
      expect(html).toContain('25,0')
      expect(html).toContain('°C')
    })

    it('displays mixing and sensor status truthfully', () => {
      const domainMixed = createMockDomainState({ mixedSinceLastAddition: true })
      const htmlMixed = renderToString(React.createElement(InstrumentTelemetryHud, { domain: domainMixed }))
      expect(htmlMixed).toContain('Đã khuấy đều')

      const domainUnmixed = createMockDomainState({ mixedSinceLastAddition: false })
      const htmlUnmixed = renderToString(React.createElement(InstrumentTelemetryHud, { domain: domainUnmixed }))
      expect(htmlUnmixed).toContain('Chưa khuấy')
    })
  })

  describe('Architecture & Formatting Truth', () => {
    it('contains no chemistry solver code or simulation calculations in HUD', () => {
      const hudSource = readFileSync(HUD_FILE, 'utf8')

      expect(hudSource).not.toContain('solveEquilibrium')
      expect(hudSource).not.toContain('chargeBalance')
      expect(hudSource).not.toContain('1e-14')
    })

    it('uses tabular numerals styling for clinical alignment', () => {
      const css = readFileSync(GLOBALS_CSS, 'utf8')

      expect(css).toContain('.telemetry-ph-value')
      expect(css).toContain('font-variant-numeric: tabular-nums')
      expect(css).toContain('.telemetry-cell-number')
    })
  })
})
