/**
 * Acid neutralization state (docs/experiments/acid-neutralization-spec.md §4).
 *
 * State is plain data: it must serialize to JSON without losing meaningful
 * precision, hash to a canonical form, and replay deterministically from an
 * event chain (docs/data-and-state-model.md §11).
 */

export const ACID_ROUTES = ['naoh', 'calcium-hydroxide', 'sodium-carbonate'] as const

export type AcidRoute = (typeof ACID_ROUTES)[number]

/**
 * Whether an arbitrary string is one of this release's routes.
 *
 * A guard rather than a cast: the route arrives from an untrusted
 * SimulationAction payload, so it must be checked before it can be used to
 * index route-keyed tables. A cast would let an unknown route through and turn
 * it into a silent `undefined` lookup downstream.
 */
export function isAcidRoute(value: unknown): value is AcidRoute {
  return typeof value === 'string' && (ACID_ROUTES as readonly string[]).includes(value)
}

export const ACID_PHASES = ['setup', 'ready', 'mixed', 'stable', 'completed'] as const

export type AcidPhase = (typeof ACID_PHASES)[number]

/** Permitted aliquot volume in litres, matching PERMITTED_ALIQUOTS_L. */
export type PermittedAliquotL = 0.00005 | 0.0001 | 0.0005 | 0.001 | 0.005

/**
 * What an aliquot actually added. `route` names the chemical route in effect,
 * which is NOT what a correction addition delivers: correction adds HCl while
 * the route stays naoh/calcium-hydroxide/sodium-carbonate. Recording a
 * correction under the base route would mis-attribute reagent in the ledger,
 * the calculation trace and any replay, so the two are separate fields.
 *
 * Both kinds count toward the 120 reagent-addition cap (spec §3.6), which is
 * why corrections live in `aliquotHistory` at all.
 */
export const ALIQUOT_REAGENTS = ['base', 'correction-acid'] as const

export type AliquotReagent = (typeof ALIQUOT_REAGENTS)[number]

export type AliquotRecord = {
  sequence: number
  /** Chemical route in effect when the aliquot was added. */
  route: AcidRoute
  /** What was actually delivered: base or HCl correction. */
  reagent: AliquotReagent
  volumeL: PermittedAliquotL
  compositionRevision: number
}

export type MeasurementRecordAcid = {
  sequence: number
  compositionRevision: number
  simulatedPH: number
  baseVolumeL: number
  correctionAcidVolumeL: number
}

/** §4.3 */
export type CarbonFractions = {
  co2Star: number
  bicarbonate: number
  carbonate: number
}

export type AcidEquilibriumResult = {
  hydrogenMolL: number
  hydroxideMolL: number
  simulatedPH: number
  chargeBalanceResidualMolL: number
  calciumMolL?: number
  calciumHydroxideComplexMolL?: number
  totalInorganicCarbonMolL?: number
  carbonFractions?: CarbonFractions
}

/** §4.1 — locked for the release, never mutated by an action. */
export type AcidNeutralizationConstants = {
  temperatureC: 25.0
  pressureMPa: 0.1
  acidVolumeL: number
  acidConcentrationMolL: number
  baseEquivalentConcentrationEqL: number
  kw: number
  carbonateKa1: number
  carbonateKa2: number
  calciumHydrolysisK: number
  targetPH: number
  targetTolerancePH: 0.2
}

/** §4.2 — everything an action may change. */
export type AcidNeutralizationState = {
  route: AcidRoute | null
  phase: AcidPhase
  compositionRevision: number
  totalVolumeL: number
  chlorideMoles: number
  sodiumMoles: number
  calciumMoles: number
  totalInorganicCarbonMoles: number
  baseVolumeL: number
  correctionAcidVolumeL: number
  aliquotHistory: AliquotRecord[]
  directionChangeCount: number
  meterCalibrated: boolean
  mixedSinceLastAddition: boolean
  readingStable: boolean
  lastMeasuredPH: number | null
  lastMeasuredCompositionRevision: number | null
  measurements: MeasurementRecordAcid[]
  equilibrium: AcidEquilibriumResult | null
  modelValid: boolean
  invalidReasonCodes: string[]
}

/**
 * Frozen run configuration, carried alongside the attempt and immutable for
 * the release.
 *
 * Deliberately holds NO per-route `E*` table. `E*` is derived by inverting the
 * model from exactly these fields (spec §14.3, §3.5), so a benchmark run and an
 * exploration run are scored by the same code path and the resource-score
 * denominator cannot disagree with the solver that produced the pH*.
 */
export type AcidScenarioConfig = {
  /**
   * Locked constants, which already carry the sample volume/concentration,
   * base normality and target pH*. Repeating them here would give two sources
   * of truth for the same release data.
   */
  constants: AcidNeutralizationConstants
  /** Per-route maximum cumulative base volume, canonical litres (§3.1). */
  maxBaseVolumeLByRoute: Record<AcidRoute, number>
}
