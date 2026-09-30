'use client'

import { useId } from 'react'
import type { AcidNeutralizationState } from '@/domain/experiments/acid-neutralization/state.js'
import type { AcidSetupParams } from '@/domain/experiments/acid-neutralization/setup.js'
import { formatMl, formatPh } from '@/shared/ui/format.js'

export type TelemetryMeasurementStatus = 'stable' | 'pending' | 'uncalibrated' | 'unmeasured'

export type InstrumentTelemetryHudProps = {
  /** Authoritative domain state from session/controller. */
  readonly domain?: AcidNeutralizationState | null
  /** Active attempt configuration parameters. */
  readonly activeSetup?: AcidSetupParams | null
  /** Flag indicating whether attempt has started. */
  readonly isPreStart?: boolean
  /** Optional container class name. */
  readonly className?: string
  /** Optional container ID. */
  readonly id?: string
}

/**
 * Pure state evaluator for instrument pH measurement status.
 *
 * Truth contract:
 * - If lastMeasuredPH exists and current composition matches last measured revision and reading is stable: 'stable'.
 * - If lastMeasuredPH exists but composition revision has changed or reading is unstable: 'pending'.
 * - If meter is not calibrated: 'uncalibrated'.
 * - If no measurement has been recorded: 'unmeasured'.
 * - NEVER treats simulated theoretical equilibrium pH as an electrode measurement.
 */
export function evaluateMeasurementState(domain?: AcidNeutralizationState | null): {
  status: TelemetryMeasurementStatus
  label: string
  isStale: boolean
  lastMeasuredPh: number | null
} {
  if (!domain) {
    return {
      status: 'unmeasured',
      label: 'Chưa có số đo',
      isStale: false,
      lastMeasuredPh: null,
    }
  }

  if (!domain.meterCalibrated) {
    return {
      status: 'uncalibrated',
      label: 'Chưa hiệu chuẩn',
      isStale: false,
      lastMeasuredPh: null,
    }
  }

  const lastRecord =
    domain.measurements.length > 0 ? domain.measurements[domain.measurements.length - 1] : null
  const priorPh = domain.lastMeasuredPH ?? lastRecord?.simulatedPH ?? null

  const isCurrent =
    domain.lastMeasuredPH !== null &&
    domain.lastMeasuredCompositionRevision === domain.compositionRevision
  const isStable = domain.readingStable

  if (domain.lastMeasuredPH !== null && isCurrent && isStable) {
    return {
      status: 'stable',
      label: 'Ổn định',
      isStale: false,
      lastMeasuredPh: domain.lastMeasuredPH,
    }
  }

  if (priorPh !== null) {
    return {
      status: 'pending',
      label: !isCurrent ? 'Chờ đo' : 'Chưa có số đo ổn định',
      isStale: true,
      lastMeasuredPh: priorPh,
    }
  }

  return {
    status: 'unmeasured',
    label: 'Chưa đo',
    isStale: false,
    lastMeasuredPh: null,
  }
}

/**
 * InstrumentTelemetryHud (WB-R5).
 *
 * Live digital telemetry HUD for the workbench apparatus displaying authoritative
 * electrode pH measurement, pending/stable status, added titrant, and total volume.
 *
 * ARCHITECTURAL CONTRACT:
 * 1. Authoritative truth: primary readout is strictly `lastMeasuredPH` (never theoretical equilibrium pH).
 * 2. Unmeasured/Pending semantics: when an aliquot is added, reading status visibly becomes pending.
 *    Stale prior reading is clearly marked as historical, not current.
 * 3. Tabular numerals: all quantitative values use tabular figures for clinical readability.
 * 4. Constant temperature: 25.0 °C read-only scientific condition.
 * 5. Restrained design: clean scientific instrument display; avoids dashboard-card spam.
 */
export function InstrumentTelemetryHud({
  domain,
  activeSetup = null,
  isPreStart = false,
  className = '',
  id,
}: InstrumentTelemetryHudProps) {
  const generatedId = useId()
  const hudId = id ?? `telemetry-hud-${generatedId.replace(/:/g, '')}`

  const { status, label: statusLabel, isStale, lastMeasuredPh } = evaluateMeasurementState(domain)

  // Cumulative added NaOH volume in mL (authoritative domain baseVolumeL only)
  const baseVolumeMl = (domain?.baseVolumeL ?? 0) * 1000

  // Total solution volume in mL
  const initialAcidVolumeL = activeSetup?.acidVolumeL ?? 0.025
  const totalVolumeMl = (domain?.totalVolumeL ?? initialAcidVolumeL) * 1000

  // Correction acid volume in mL (if any was added)
  const correctionAcidVolumeMl = (domain?.correctionAcidVolumeL ?? 0) * 1000

  // Mixing state
  const isMixed = domain?.mixedSinceLastAddition ?? false
  const isCalibrated = domain?.meterCalibrated ?? false

  return (
    <div
      id={hudId}
      className={`instrument-telemetry-hud ${className}`}
      data-testid="instrument-telemetry-hud"
      role="region"
      aria-label="Thông số đo lường thiết bị"
    >
      {/* Primary Electrode Measurement Readout */}
      <div className="telemetry-primary-card">
        <div className="telemetry-primary-header">
          <div className="telemetry-label-cluster">
            <span className="telemetry-device-name">pH Kỹ thuật số</span>
            <span className="telemetry-device-type">Điện cực thủy tinh</span>
          </div>

          <div
            className={`telemetry-status-pill status-${status}`}
            data-testid="telemetry-status-pill"
            aria-live="polite"
          >
            <span className="status-indicator-dot" aria-hidden="true" />
            <span className="status-text">{statusLabel}</span>
          </div>
        </div>

        <div className="telemetry-value-display">
          <div className="telemetry-ph-row">
            {status === 'uncalibrated' || status === 'unmeasured' ? (
              <span className="telemetry-ph-value value-placeholder" data-testid="telemetry-ph-value">
                —
              </span>
            ) : (
              <span
                className={`telemetry-ph-value ${isStale ? 'is-stale' : 'is-stable'}`}
                data-testid="telemetry-ph-value"
              >
                {formatPh(lastMeasuredPh)}
              </span>
            )}
            <span className="telemetry-ph-unit">pH</span>
          </div>

          {/* Stale/pending disclaimer note */}
          {isStale && lastMeasuredPh !== null && (
            <div className="telemetry-stale-notice" data-testid="telemetry-stale-notice">
              <span className="stale-icon" aria-hidden="true">
                ℹ
              </span>
              <span>Số đo trước đó (dung dịch đã thay đổi thể tích)</span>
            </div>
          )}
        </div>
      </div>

      {/* Secondary Instrument Telemetry Cluster */}
      <div className="telemetry-secondary-grid">
        {/* NaOH Added */}
        <div className="telemetry-cell" data-testid="telemetry-naoh-volume">
          <span className="telemetry-cell-label">NaOH đã thêm</span>
          <div className="telemetry-cell-value-row">
            <span className="telemetry-cell-number">{formatMl(baseVolumeMl)}</span>
          </div>
          {correctionAcidVolumeMl > 0 && (
            <span className="telemetry-cell-subtext">
              HCl bù: {formatMl(correctionAcidVolumeMl)}
            </span>
          )}
        </div>

        {/* Total Solution Volume */}
        <div className="telemetry-cell" data-testid="telemetry-total-volume">
          <span className="telemetry-cell-label">Tổng thể tích</span>
          <div className="telemetry-cell-value-row">
            <span className="telemetry-cell-number">{formatMl(totalVolumeMl)}</span>
          </div>
          <span className="telemetry-cell-subtext">
            {isPreStart ? 'Dung dịch ban đầu' : 'Thể tích cốc'}
          </span>
        </div>

        {/* Temperature (Fixed 25.0 °C) */}
        <div className="telemetry-cell" data-testid="telemetry-temperature">
          <span className="telemetry-cell-label">Nhiệt độ</span>
          <div className="telemetry-cell-value-row">
            <span className="telemetry-cell-number">25,0</span>
            <span className="telemetry-cell-unit">°C</span>
          </div>
          <span className="telemetry-cell-subtext">Được chuẩn hóa</span>
        </div>

        {/* Mixing & Sensor State */}
        <div className="telemetry-cell" data-testid="telemetry-state-cell">
          <span className="telemetry-cell-label">Trạng thái dung dịch</span>
          <div className="telemetry-cell-value-row">
            <span
              className={`telemetry-cell-state-badge ${isMixed ? 'is-mixed' : 'not-mixed'}`}
            >
              {isMixed ? 'Đã khuấy đều' : 'Chưa khuấy'}
            </span>
          </div>
          <span className="telemetry-cell-subtext">
            {isCalibrated ? 'Điện cực chuẩn' : 'Chưa hiệu chuẩn'}
          </span>
        </div>
      </div>
    </div>
  )
}
