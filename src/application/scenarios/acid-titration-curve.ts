import type { MeasurementRecordAcid } from '@/domain/experiments/acid-neutralization/state.js'

/**
 * Acid neutralization titration-curve projection (WB-R2).
 *
 * Pure, shared application-layer projection mapping authoritative domain
 * measurement records into scientific curve points for live workbench charting
 * and post-run reporting.
 *
 * ARCHITECTURAL CONTRACT:
 * 1. Scientific truth: pH is preserved verbatim from the domain measurement without
 *    recomputation or interpolation.
 * 2. Exact scaling: Volume in canonical litres is converted to millilitres (mL)
 *    by multiplying by 1000.
 * 3. Zero layout bias: Contains strictly physical/chemical values; no SVG coordinates,
 *    margins, pixel scales, or display formatting.
 * 4. Zero benchmark hardcoding: Functions uniformly across the entire authorized
 *    exploration envelope (any initial acid volume or concentration).
 * 5. Immutability: Pure functions; never mutates input records or arrays.
 */

/**
 * A single projected titration point for scientific charting and tabular inspection.
 */
export type TitrationCurvePoint = {
  readonly sequence: number
  readonly compositionRevision: number
  /** Cumulative base volume in millilitres (mL). */
  readonly baseVolumeMl: number
  /** Cumulative correction acid volume in millilitres (mL). */
  readonly correctionAcidVolumeMl: number
  /** Total titrant volume added (base + correction acid) in millilitres (mL). */
  readonly totalTitrantVolumeMl: number
  /** Authoritative measured pH value. */
  readonly ph: number
}

/**
 * Summary bounds and ordered points of a titration curve.
 */
export type TitrationCurveProjection = {
  readonly points: readonly TitrationCurvePoint[]
  readonly count: number
  readonly lastPoint: TitrationCurvePoint | null
  readonly minPh: number | null
  readonly maxPh: number | null
  readonly minBaseVolumeMl: number | null
  readonly maxBaseVolumeMl: number | null
}

const ML_PER_LITRE = 1000

/**
 * Project a single MeasurementRecordAcid into a TitrationCurvePoint.
 */
export function projectTitrationPoint(record: MeasurementRecordAcid): TitrationCurvePoint {
  const baseVolumeMl = record.baseVolumeL * ML_PER_LITRE
  const correctionAcidVolumeMl = record.correctionAcidVolumeL * ML_PER_LITRE

  return {
    sequence: record.sequence,
    compositionRevision: record.compositionRevision,
    baseVolumeMl,
    correctionAcidVolumeMl,
    totalTitrantVolumeMl: baseVolumeMl + correctionAcidVolumeMl,
    ph: record.simulatedPH,
  }
}

/**
 * Project a list of MeasurementRecordAcid records into an ordered list of TitrationCurvePoint.
 *
 * Preserves exact measurement ordering. Does not synthesize points or interpolate.
 * Does not mutate the input array or records.
 */
export function projectTitrationPoints(
  measurements: readonly MeasurementRecordAcid[],
): readonly TitrationCurvePoint[] {
  return measurements.map(projectTitrationPoint)
}

/**
 * Project a list of MeasurementRecordAcid records into a complete TitrationCurveProjection
 * with scientific bounds.
 *
 * Returns null bounds and an empty array when measurements is empty.
 * Zero benchmark-specific hardcoding: works uniformly for any sample volume configuration.
 */
export function projectTitrationCurve(
  measurements: readonly MeasurementRecordAcid[],
): TitrationCurveProjection {
  if (measurements.length === 0) {
    return {
      points: [],
      count: 0,
      lastPoint: null,
      minPh: null,
      maxPh: null,
      minBaseVolumeMl: null,
      maxBaseVolumeMl: null,
    }
  }

  const points = projectTitrationPoints(measurements)
  let minPh = points[0]!.ph
  let maxPh = points[0]!.ph
  let minBaseVolumeMl = points[0]!.baseVolumeMl
  let maxBaseVolumeMl = points[0]!.baseVolumeMl

  for (let i = 1; i < points.length; i++) {
    const pt = points[i]!
    if (pt.ph < minPh) minPh = pt.ph
    if (pt.ph > maxPh) maxPh = pt.ph
    if (pt.baseVolumeMl < minBaseVolumeMl) minBaseVolumeMl = pt.baseVolumeMl
    if (pt.baseVolumeMl > maxBaseVolumeMl) maxBaseVolumeMl = pt.baseVolumeMl
  }

  return {
    points,
    count: points.length,
    lastPoint: points[points.length - 1]!,
    minPh,
    maxPh,
    minBaseVolumeMl,
    maxBaseVolumeMl,
  }
}

/**
 * Calculate the stoichiometric equivalence volume in millilitres (mL) for NaOH titrating HCl (WB-R5).
 *
 * In the neutralization reaction:
 *   HCl + NaOH -> NaCl + H2O
 * Stoichiometric equivalence occurs when moles of NaOH added equals initial moles of HCl:
 *   n_HCl = acidVolumeL * acidConcentrationMolL
 *   V_eq_L = n_HCl / baseEquivalentConcentrationEqL
 *   V_eq_mL = V_eq_L * 1000
 *
 * Derived strictly from configuration/setup parameters without hardcoding 25.00 mL.
 */
export function calculateNaohEquivalenceVolumeMl(
  params:
    | {
        readonly acidVolumeL: number
        readonly acidConcentrationMolL?: number
        readonly baseEquivalentConcentrationEqL?: number
      }
    | {
        readonly constants: {
          readonly acidVolumeL: number
          readonly acidConcentrationMolL: number
          readonly baseEquivalentConcentrationEqL: number
        }
      },
): number {
  const acidVolumeL = 'constants' in params ? params.constants.acidVolumeL : params.acidVolumeL
  const acidConc =
    'constants' in params
      ? params.constants.acidConcentrationMolL
      : params.acidConcentrationMolL ?? 0.01
  const baseConc =
    'constants' in params
      ? params.constants.baseEquivalentConcentrationEqL
      : params.baseEquivalentConcentrationEqL ?? acidConc

  if (!Number.isFinite(acidVolumeL) || acidVolumeL <= 0) {
    throw new RangeError(`Invalid acid volume for equivalence calculation: ${acidVolumeL}`)
  }
  if (!Number.isFinite(baseConc) || baseConc <= 0) {
    throw new RangeError(`Invalid base concentration for equivalence calculation: ${baseConc}`)
  }
  if (!Number.isFinite(acidConc) || acidConc <= 0) {
    throw new RangeError(`Invalid acid concentration for equivalence calculation: ${acidConc}`)
  }

  const vEqL = (acidVolumeL * acidConc) / baseConc
  return Math.round(vEqL * ML_PER_LITRE * 1e6) / 1e6
}

/**
 * Resolve the maximum cumulative NaOH base volume in millilitres (mL)
 * for the titration curve x-axis from the active attempt configuration or setup parameters (WB-R5).
 *
 * For NaOH, max permitted volume is 1.20x the initial sample volume (spec §3.1).
 *   Benchmark (25.0 mL sample): 30.00 mL
 *   50.0 mL sample: 60.00 mL
 */
export function resolveMaxBaseVolumeMl(
  configOrParams?:
    | {
        readonly maxBaseVolumeLByRoute?: Readonly<Record<string, number>>
        readonly acidVolumeL?: number
        readonly constants?: { readonly acidVolumeL: number }
      }
    | null
    | undefined,
): number {
  if (!configOrParams) {
    return 30.0
  }
  if (configOrParams.maxBaseVolumeLByRoute?.naoh !== undefined) {
    return configOrParams.maxBaseVolumeLByRoute.naoh * ML_PER_LITRE
  }
  const acidVolumeL = configOrParams.constants?.acidVolumeL ?? configOrParams.acidVolumeL
  if (acidVolumeL !== undefined && Number.isFinite(acidVolumeL) && acidVolumeL > 0) {
    return 1.2 * acidVolumeL * ML_PER_LITRE
  }
  return 30.0
}
