import type { DomainError } from '@/domain/process/contracts.js'
import { invalidInput } from '@/shared/errors/domain-errors.js'
import {
  BENCHMARK_SAMPLE,
  BENCHMARK_TARGET_PH,
  EXPLORATION_RANGES,
  KA1_CARBONIC,
  KA2_CARBONIC,
  KH_CALCIUM,
  KW,
  LOCKED_CONDITIONS,
  TARGET_TOLERANCE_PH,
} from './constants.js'
import type {
  AcidNeutralizationConstants,
  AcidNeutralizationState,
  AcidRoute,
  AcidScenarioConfig,
} from './state.js'
import { benchmarkScenarioConfig } from './engine.js'

/**
 * Setup parameters for an acid neutralization attempt (spec §3.5).
 *
 * In V1, the learner configures the HCl sample within the authorized exploration
 * ranges; base concentration is strictly derived from the scenario exploration rule
 * (normality equals HCl concentration), temperature is locked at 25.0 °C, and pressure
 * at 0.1 MPa.
 */
export type AcidSetupParams = Readonly<{
  /** Initial acid volume in canonical litres (0.025 to 0.050 L). */
  acidVolumeL: number
  /** Initial acid concentration in mol/L (0.005 to 0.020 mol/L). */
  acidConcentrationMolL: number
}>

/**
 * Canonical benchmark setup parameters (25.00 mL, 0.0100 mol/L).
 */
export function benchmarkSetupParams(): AcidSetupParams {
  return {
    acidVolumeL: BENCHMARK_SAMPLE.acidVolumeL,
    acidConcentrationMolL: BENCHMARK_SAMPLE.acidConcentrationMolL,
  }
}

/**
 * Type guard for complete, valid AcidSetupParams.
 */
export function isAcidSetupParams(value: unknown): value is AcidSetupParams {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>

  if (
    typeof candidate.acidVolumeL !== 'number' ||
    typeof candidate.acidConcentrationMolL !== 'number'
  ) {
    return false
  }

  if (
    !Number.isFinite(candidate.acidVolumeL) ||
    !Number.isFinite(candidate.acidConcentrationMolL)
  ) {
    return false
  }

  return (
    candidate.acidVolumeL >= EXPLORATION_RANGES.acidVolumeL.min &&
    candidate.acidVolumeL <= EXPLORATION_RANGES.acidVolumeL.max &&
    candidate.acidConcentrationMolL >= EXPLORATION_RANGES.acidConcentrationMolL.min &&
    candidate.acidConcentrationMolL <= EXPLORATION_RANGES.acidConcentrationMolL.max
  )
}

/**
 * Validate and normalize incoming setup parameters against the scientific exploration envelope.
 *
 * Both fields are required atomically if setup is specified; missing or out-of-range fields
 * are rejected rather than silently defaulted.
 */
export function validateSetupParams(
  value: unknown,
): { ok: true; params: AcidSetupParams } | { ok: false; error: DomainError } {
  if (typeof value !== 'object' || value === null) {
    return {
      ok: false,
      error: invalidInput('SETUP_REQUIRED', 'errors.VOLUME_OUT_OF_RANGE', {}),
    }
  }

  const candidate = value as Record<string, unknown>

  if (
    candidate.acidVolumeL === undefined ||
    candidate.acidConcentrationMolL === undefined
  ) {
    return {
      ok: false,
      error: invalidInput('SETUP_INCOMPLETE', 'errors.VOLUME_OUT_OF_RANGE', {
        hasAcidVolume: candidate.acidVolumeL !== undefined,
        hasAcidConcentration: candidate.acidConcentrationMolL !== undefined,
      }),
    }
  }

  const volume = candidate.acidVolumeL
  const concentration = candidate.acidConcentrationMolL

  if (typeof volume !== 'number' || !Number.isFinite(volume)) {
    return {
      ok: false,
      error: invalidInput('SETUP_VOLUME_INVALID', 'errors.VOLUME_OUT_OF_RANGE', {
        acidVolumeL: volume as number,
      }),
    }
  }

  if (typeof concentration !== 'number' || !Number.isFinite(concentration)) {
    return {
      ok: false,
      error: invalidInput('SETUP_CONCENTRATION_INVALID', 'errors.VOLUME_OUT_OF_RANGE', {
        acidConcentrationMolL: concentration as number,
      }),
    }
  }

  if (
    volume < EXPLORATION_RANGES.acidVolumeL.min ||
    volume > EXPLORATION_RANGES.acidVolumeL.max
  ) {
    return {
      ok: false,
      error: invalidInput('SETUP_VOLUME_OUT_OF_RANGE', 'errors.VOLUME_OUT_OF_RANGE', {
        acidVolumeL: volume,
        min: EXPLORATION_RANGES.acidVolumeL.min,
        max: EXPLORATION_RANGES.acidVolumeL.max,
      }),
    }
  }

  if (
    concentration < EXPLORATION_RANGES.acidConcentrationMolL.min ||
    concentration > EXPLORATION_RANGES.acidConcentrationMolL.max
  ) {
    return {
      ok: false,
      error: invalidInput('SETUP_CONCENTRATION_OUT_OF_RANGE', 'errors.VOLUME_OUT_OF_RANGE', {
        acidConcentrationMolL: concentration,
        min: EXPLORATION_RANGES.acidConcentrationMolL.min,
        max: EXPLORATION_RANGES.acidConcentrationMolL.max,
      }),
    }
  }

  // Normalize floating point representation to 9 decimals to eliminate IEEE 754 jitter.
  const normalizedParams: AcidSetupParams = {
    acidVolumeL: Math.round(volume * 1e9) / 1e9,
    acidConcentrationMolL: Math.round(concentration * 1e9) / 1e9,
  }

  return { ok: true, params: normalizedParams }
}

/**
 * Maximum cumulative base volume by route for a given sample volume (spec §3.1).
 *
 *   maxNaOHVolumeL = 1.20 * initialAcidEquivalents / baseEquivalentConcentration = 1.20 * acidVolumeL
 *   maxCaOH2SolutionVolumeL = 1.20 * acidVolumeL
 *   maxNa2CO3SolutionVolumeL = 2.00 * acidVolumeL
 */
export function maxBaseVolumeLForRoute(route: AcidRoute, acidVolumeL: number): number {
  switch (route) {
    case 'naoh':
    case 'calcium-hydroxide':
      return 1.2 * acidVolumeL
    case 'sodium-carbonate':
      return 2.0 * acidVolumeL
  }
}

/**
 * Build constants for an authorized parameterized run (spec §3.5).
 */
export function buildParameterizedConstants(
  params: AcidSetupParams,
): AcidNeutralizationConstants {
  return {
    temperatureC: LOCKED_CONDITIONS.temperatureC,
    pressureMPa: LOCKED_CONDITIONS.pressureMPa,
    acidVolumeL: params.acidVolumeL,
    acidConcentrationMolL: params.acidConcentrationMolL,
    // Spec §3.5: Stock equivalent concentration always equals HCl concentration.
    baseEquivalentConcentrationEqL: params.acidConcentrationMolL,
    kw: KW,
    carbonateKa1: KA1_CARBONIC,
    carbonateKa2: KA2_CARBONIC,
    calciumHydrolysisK: KH_CALCIUM,
    targetPH: BENCHMARK_TARGET_PH,
    targetTolerancePH: TARGET_TOLERANCE_PH,
  }
}

/**
 * Pure builder creating an AcidScenarioConfig consistent with acid-neutralization@1.0.0.
 *
 * When params is omitted, returns the canonical benchmark configuration.
 */
export function createAcidScenarioConfig(
  params?: AcidSetupParams,
): AcidScenarioConfig {
  if (params === undefined) {
    return benchmarkScenarioConfig()
  }

  const validation = validateSetupParams(params)
  if (!validation.ok) {
    throw new RangeError(`Invalid setup parameters: ${JSON.stringify(params)}`)
  }

  const normalized = validation.params
  const constants = buildParameterizedConstants(normalized)

  return {
    constants,
    maxBaseVolumeLByRoute: {
      naoh: maxBaseVolumeLForRoute('naoh', normalized.acidVolumeL),
      'calcium-hydroxide': maxBaseVolumeLForRoute('calcium-hydroxide', normalized.acidVolumeL),
      'sodium-carbonate': maxBaseVolumeLForRoute('sodium-carbonate', normalized.acidVolumeL),
    },
  }
}

/**
 * Reconstruct AcidSetupParams from an immutable initial domain state.
 *
 * Guaranteed to recover exact benchmark numbers for historical attempts,
 * and configured values for parameterized attempts.
 */
export function reconstructSetupParams(
  initialState: AcidNeutralizationState,
): AcidSetupParams {
  const volume = initialState.totalVolumeL
  if (!Number.isFinite(volume) || volume <= 0) {
    throw new RangeError(`Invalid initial totalVolumeL: ${volume}`)
  }

  const rawConcentration = initialState.chlorideMoles / volume
  if (!Number.isFinite(rawConcentration) || rawConcentration <= 0) {
    throw new RangeError(
      `Invalid initial chlorideMoles: ${initialState.chlorideMoles} for volume ${volume}`,
    )
  }

  return {
    acidVolumeL: Math.round(volume * 1e9) / 1e9,
    acidConcentrationMolL: Math.round(rawConcentration * 1e9) / 1e9,
  }
}

/**
 * Resolve the authoritative scenario configuration corresponding to an attempt's immutable initial state.
 */
export function resolveScenarioConfigForAttempt(
  initialState: AcidNeutralizationState,
): AcidScenarioConfig {
  const params = reconstructSetupParams(initialState)

  if (
    params.acidVolumeL === BENCHMARK_SAMPLE.acidVolumeL &&
    params.acidConcentrationMolL === BENCHMARK_SAMPLE.acidConcentrationMolL
  ) {
    return benchmarkScenarioConfig()
  }

  return createAcidScenarioConfig(params)
}
