import type { AcidRoute } from '@/domain/experiments/acid-neutralization/state.js'
import {
  PERMITTED_ALIQUOTS_L,
  EXPLORATION_RANGES,
  BENCHMARK_SAMPLE,
  BENCHMARK_TARGET_PH,
  TARGET_TOLERANCE_PH,
  MAX_REAGENT_ADDITIONS,
  MAX_ACCEPTED_EVENTS,
} from '@/domain/experiments/acid-neutralization/constants.js'

/**
 * Acid neutralization scenario definition for release 1.0.0.
 *
 * This is the content half of "scenario release structure được khóa"
 * (docs/system-architecture.md §2.4). It declares what the UI may offer, in
 * canonical units, so a form can never present an input the engine rejects.
 * The engine owns the authoritative `actionTypes` list; this file mirrors it
 * and tests/unit/scenario-definition.test.ts asserts the two agree.
 *
 * Action type strings come from docs/experiments/acid-neutralization-spec.md
 * §5 and are part of the release: renaming one is a new release, not a refactor.
 */

export const ACID_ACTION_TYPES = [
  'select_route',
  'calibrate_meter',
  'add_base',
  'mix',
  'wait_for_stable_reading',
  'measure_ph',
  'add_correction_acid',
  'complete',
] as const

export type AcidActionType = (typeof ACID_ACTION_TYPES)[number]

/** Canonical unit every numeric parameter is expressed in. */
export type CanonicalParamUnit = 'L' | 'mol/L' | 'C'

/**
 * Numeric parameter: a continuous range, or a discrete permitted set, in a
 * single canonical unit. `permittedValues` and `range` are mutually exclusive
 * and one must be present — a parameter with neither cannot be validated.
 */
export type NumericParameterSpec = {
  kind: 'numeric'
  name: string
  unit: CanonicalParamUnit
  permittedValues?: readonly number[]
  range?: { min: number; max: number; step?: number }
  required: boolean
}

/**
 * Choice parameter: a string selected from a closed set. It deliberately has
 * no `unit` field, because a route is not a quantity. Modelling it as numeric
 * would force a fabricated unit and let unit conversion run over a string.
 */
export type ChoiceParameterSpec<T extends string = string> = {
  kind: 'choice'
  name: string
  choices: readonly T[]
  required: boolean
}

export type AcidParameterSpec = NumericParameterSpec | ChoiceParameterSpec

export type AcidActionSpec = {
  actionType: AcidActionType
  labelKey: string
  /** Spec §5 "Điều kiện trước" — shown to the user as a disabled-state reason. */
  preconditionKey: string
  parameters: readonly AcidParameterSpec[]
  /** Spec §5 "Có event" — every listed action produces a persisted event. */
  emitsEvent: boolean
  /** Spec §5.1 — only select_route is undoable, and only as the last action. */
  undoable: boolean
}

/** Routes offered by `select_route`; declared before ACID_ACTIONS uses it. */
export const ACID_ROUTE_CHOICES: readonly AcidRoute[] = [
  'naoh',
  'calcium-hydroxide',
  'sodium-carbonate',
]

/**
 * Aliquot volumes are offered in mL because that is what a burette reads, but
 * the canonical unit entering the engine is L (spec §3.2).
 */
const ALIQUOT_PARAMETERS: readonly AcidParameterSpec[] = [
  {
    kind: 'numeric',
    name: 'volumeL',
    unit: 'L',
    permittedValues: PERMITTED_ALIQUOTS_L,
    required: true,
  },
]

export const ACID_ACTIONS: Record<AcidActionType, AcidActionSpec> = {
  select_route: {
    actionType: 'select_route',
    labelKey: 'actions.select_route',
    preconditionKey: 'preconditions.select_route',
    parameters: [
      {
        kind: 'choice',
        name: 'route',
        choices: ACID_ROUTE_CHOICES,
        required: true,
      },
    ],
    emitsEvent: true,
    undoable: true,
  },
  calibrate_meter: {
    actionType: 'calibrate_meter',
    labelKey: 'actions.calibrate_meter',
    preconditionKey: 'preconditions.calibrate_meter',
    parameters: [],
    emitsEvent: true,
    undoable: false,
  },
  add_base: {
    actionType: 'add_base',
    labelKey: 'actions.add_base',
    preconditionKey: 'preconditions.add_base',
    parameters: ALIQUOT_PARAMETERS,
    emitsEvent: true,
    undoable: false,
  },
  mix: {
    actionType: 'mix',
    labelKey: 'actions.mix',
    preconditionKey: 'preconditions.mix',
    parameters: [],
    emitsEvent: true,
    undoable: false,
  },
  wait_for_stable_reading: {
    actionType: 'wait_for_stable_reading',
    labelKey: 'actions.wait_for_stable_reading',
    preconditionKey: 'preconditions.wait_for_stable_reading',
    parameters: [],
    emitsEvent: true,
    undoable: false,
  },
  measure_ph: {
    actionType: 'measure_ph',
    labelKey: 'actions.measure_ph',
    preconditionKey: 'preconditions.measure_ph',
    parameters: [],
    emitsEvent: true,
    undoable: false,
  },
  add_correction_acid: {
    actionType: 'add_correction_acid',
    labelKey: 'actions.add_correction_acid',
    preconditionKey: 'preconditions.add_correction_acid',
    parameters: ALIQUOT_PARAMETERS,
    emitsEvent: true,
    undoable: false,
  },
  complete: {
    actionType: 'complete',
    labelKey: 'actions.complete',
    preconditionKey: 'preconditions.complete',
    parameters: [],
    emitsEvent: true,
    undoable: false,
  },
}

/** Input domain the UI may offer (spec §3). All volumes in canonical L. */
export const ACID_INPUT_DOMAIN = {
  benchmark: {
    acidVolumeL: BENCHMARK_SAMPLE.acidVolumeL,
    acidConcentrationMolL: BENCHMARK_SAMPLE.acidConcentrationMolL,
    targetPH: BENCHMARK_TARGET_PH,
    targetTolerancePH: TARGET_TOLERANCE_PH,
  },
  exploration: {
    acidVolumeL: EXPLORATION_RANGES.acidVolumeL,
    acidConcentrationMolL: EXPLORATION_RANGES.acidConcentrationMolL,
    targetPh: EXPLORATION_RANGES.targetPh,
  },
  /**
   * Per-route caps in canonical L. Benchmark values; exploration scales per
   * spec §3.1 (1.20x sample volume for NaOH/Ca(OH)2, 2.00x for Na2CO3,
   * correction HCl capped at 0.25x initial acid volume).
   */
  maxVolumeLByRoute: {
    naoh: 0.03,
    'calcium-hydroxide': 0.03,
    'sodium-carbonate': 0.05,
  } as Record<AcidRoute, number>,
  maxCorrectionAcidVolumeL: 0.25 * BENCHMARK_SAMPLE.acidVolumeL,
  permittedAliquotsL: PERMITTED_ALIQUOTS_L,
  limits: {
    maxReagentAdditions: MAX_REAGENT_ADDITIONS,
    maxAcceptedEvents: MAX_ACCEPTED_EVENTS,
  },
} as const

/**
 * Display rounding (spec §13.6). Presentation-only: the engine never rounds
 * internal state, and these values must not be used to truncate stored data.
 */
export const ACID_DISPLAY_FORMAT = {
  phSummaryDecimals: 2,
  phTechnicalDecimals: 5,
  volumeMlDecimals: 2,
  mmolSignificantFigures: 4,
} as const

/**
 * Unit selectors the UI exposes. Values are sent to the engine only after
 * conversion to canonical units; `unitSelections` records what the user picked
 * so the request fingerprint stays stable across a retry.
 */
export const ACID_UNIT_SELECTIONS = {
  volume: ['mL', 'L'] as const,
  concentration: ['mol/L', 'mmol/L'] as const,
  amount: ['mmol', 'mol'] as const,
} as const

export const ACID_VOLUME_DISPLAY_UNIT = 'mL' as const
