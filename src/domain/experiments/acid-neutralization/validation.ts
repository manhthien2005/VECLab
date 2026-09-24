import type { DomainError } from '@/domain/process/contracts.js'
import { invalidInput, preconditionFailed, modelInvalid } from '@/shared/errors/domain-errors.js'
import {
  PERMITTED_ALIQUOTS_L,
  MAX_REAGENT_ADDITIONS,
  MAX_ACCEPTED_EVENTS,
  TARGET_TOLERANCE_PH,
  BENCHMARK_TARGET_PH,
} from './constants.js'
import type {
  AcidNeutralizationState,
  AcidRoute,
  PermittedAliquotL,
} from './state.js'

/**
 * Action validation for acid neutralization.
 *
 * Implements the precondition column of docs/experiments/acid-neutralization-spec.md
 * §5 and the error/recovery branch table of §12. Codes are stable identifiers
 * (§5.1 of the architecture doc); the content layer maps each to localized text.
 *
 * A rejected command produces no domain event and never mutates state
 * (spec §13.2), so every function here returns an error or null and nothing
 * else. Blocked commands are deliberately absent from scoring.
 */

/** Per-route maximum cumulative base volume in litres (spec §3.1, benchmark). */
export const MAX_BASE_VOLUME_L_BY_ROUTE: Record<AcidRoute, number> = {
  naoh: 0.03,
  'calcium-hydroxide': 0.03,
  'sodium-carbonate': 0.05,
}

/** Correction HCl cap: 0.25 × initial acid volume (spec §3.1). */
export function maxCorrectionAcidVolumeL(acidVolumeL: number): number {
  return 0.25 * acidVolumeL
}

/**
 * Whether an aliquot is one of the five permitted sizes (spec §3.2).
 * Arbitrary volumes are rejected outright in scenario 1.0.0 so runs stay
 * comparable and a form cannot invent meaningless precision.
 */
export function isPermittedAliquot(volumeL: number): volumeL is PermittedAliquotL {
  return (PERMITTED_ALIQUOTS_L as readonly number[]).includes(volumeL)
}

/**
 * `add_base` / `add_correction_acid` volume validation, independent of
 * lifecycle preconditions. Called before the precondition chain so a malformed
 * number is reported as invalid_input rather than precondition_failed.
 *
 * Both actions share one permitted aliquot set (spec §3.2), so this takes no
 * discriminator; the volume caps differ and are checked separately in
 * `validateVolumeCap`.
 */
export function validateAliquotVolume(volumeL: number): DomainError | null {
  if (!Number.isFinite(volumeL) || volumeL <= 0) {
    return invalidInput('ALIQUOT_NOT_POSITIVE', 'errors.ALIQUOT_NOT_PERMITTED', { volumeL })
  }

  if (!isPermittedAliquot(volumeL)) {
    return invalidInput('ALIQUOT_NOT_PERMITTED', 'errors.ALIQUOT_NOT_PERMITTED', { volumeL })
  }

  return null
}

/**
 * Cumulative-volume cap check (spec §3.1). Evaluated against the volume the
 * addition would produce, not the volume already recorded.
 */
export function validateVolumeCap(
  state: AcidNeutralizationState,
  route: AcidRoute,
  additionalVolumeL: number,
  kind: 'base' | 'correction-acid',
  acidVolumeL: number,
): DomainError | null {
  if (kind === 'correction-acid') {
    const nextCorrectionL = state.correctionAcidVolumeL + additionalVolumeL
    const capL = maxCorrectionAcidVolumeL(acidVolumeL)
    if (nextCorrectionL > capL + 1e-12) {
      return invalidInput('VOLUME_OUT_OF_RANGE', 'errors.VOLUME_OUT_OF_RANGE', {
        nextCorrectionVolumeL: nextCorrectionL,
        maxCorrectionVolumeL: capL,
      })
    }
    return null
  }

  const nextBaseL = state.baseVolumeL + additionalVolumeL
  const capL = MAX_BASE_VOLUME_L_BY_ROUTE[route]
  if (nextBaseL > capL + 1e-12) {
    return invalidInput('VOLUME_OUT_OF_RANGE', 'errors.VOLUME_OUT_OF_RANGE', {
      nextBaseVolumeL: nextBaseL,
      maxBaseVolumeL: capL,
      route,
    })
  }
  return null
}

/**
 * Event-count ceilings (spec §3.6). Reaching them ends the attempt.
 *
 * `addsReagent` says whether THIS action would append an aliquot, so the cap is
 * evaluated against the count the attempt will have once the action commits.
 *
 * Taking the count from the caller instead would make each of the nine call
 * sites do its own `+1` arithmetic, and that form was broken: it then compared
 * the already-incremented argument against the un-incremented history length,
 * which is false for every action, so every `add_base` came back as
 * EVENT_LIMIT_REACHED. Intent is a boolean; the count is derived here once.
 */
export function validateEventLimits(
  state: AcidNeutralizationState,
  totalAcceptedEvents: number,
  addsReagent: boolean,
): DomainError | null {
  const additionsAfterCommit = state.aliquotHistory.length + (addsReagent ? 1 : 0)

  if (additionsAfterCommit > MAX_REAGENT_ADDITIONS) {
    return invalidInput('EVENT_LIMIT_REACHED', 'errors.EVENT_LIMIT_REACHED', {
      additionCount: additionsAfterCommit,
      maxReagentAdditions: MAX_REAGENT_ADDITIONS,
    })
  }
  // `totalAcceptedEvents` is the sequence this command would occupy, i.e. the
  // one-based count after commit, so it is compared directly.
  if (totalAcceptedEvents > MAX_ACCEPTED_EVENTS) {
    return invalidInput('EVENT_LIMIT_REACHED', 'errors.EVENT_LIMIT_REACHED', {
      totalAcceptedEvents,
      maxAcceptedEvents: MAX_ACCEPTED_EVENTS,
    })
  }
  return null
}

/**
 * Preconditions per action (spec §5) and the §12 recovery table.
 *
 * `temperatureC` and `routeSelection` come from the scenario configuration and
 * the incoming action rather than from mutable state, because the locked
 * constants are what make TEMPERATURE_OUT_OF_SCOPE and ROUTE_LOCKED detectable
 * at validation time instead of producing nonsense numbers downstream.
 */
export type AcidPreconditionContext = {
  acidVolumeL: number
  temperatureC: number
  routeSelection?: AcidRoute | null
  totalAcceptedEvents: number
}

export function validateSelectRoute(
  state: AcidNeutralizationState,
  context: AcidPreconditionContext,
): DomainError | null {
  const temperatureError = checkTemperatureInScope(context.temperatureC)
  if (temperatureError) return temperatureError

  // §12 ROUTE_LOCKED: changing route after any base was added is outside the
  // model, because the chemistry already committed cannot be un-reacted.
  if (state.baseVolumeL > 0) {
    return preconditionFailed('ROUTE_LOCKED', 'errors.ROUTE_LOCKED', {
      baseVolumeL: state.baseVolumeL,
    })
  }
  if (state.phase === 'completed') {
    return preconditionFailed('ATTEMPT_COMPLETED', 'errors.ROUTE_LOCKED', {
      phase: state.phase,
    })
  }
  return validateEventLimits(state, context.totalAcceptedEvents, false)
}

/**
 * Constants are locked at 25 °C (§6.1); any other temperature invalidates the
 * whole bundle, so this is a model error rather than a user error.
 *
 * Returns rather than throws: every action validator must be able to report a
 * rejection as a DomainError so the Process Core can surface it without
 * committing anything (spec §12).
 */
function checkTemperatureInScope(temperatureC: number): DomainError | null {
  if (temperatureC !== 25.0) {
    return modelInvalid('TEMPERATURE_OUT_OF_SCOPE', 'errors.TEMPERATURE_OUT_OF_SCOPE', {
      temperatureC,
    })
  }
  return null
}

export function validateCalibrateMeter(
  state: AcidNeutralizationState,
  context: AcidPreconditionContext,
): DomainError | null {
  const temperatureError = checkTemperatureInScope(context.temperatureC)
  if (temperatureError) return temperatureError

  if (state.phase === 'completed') {
    return preconditionFailed('ATTEMPT_COMPLETED', 'errors.ATTEMPT_COMPLETED', {
      phase: state.phase,
    })
  }
  return validateEventLimits(state, context.totalAcceptedEvents, false)
}

export function validateAddBase(
  state: AcidNeutralizationState,
  context: AcidPreconditionContext,
  volumeL: number,
): DomainError | null {
  const temperatureError = checkTemperatureInScope(context.temperatureC)
  if (temperatureError) return temperatureError

  if (state.phase === 'completed') {
    return preconditionFailed('ATTEMPT_COMPLETED', 'errors.ATTEMPT_COMPLETED', {
      phase: state.phase,
    })
  }
  if (state.route === null) {
    return preconditionFailed('ROUTE_NOT_SELECTED', 'errors.ROUTE_NOT_SELECTED', {})
  }

  const aliquotError = validateAliquotVolume(volumeL)
  if (aliquotError) return aliquotError

  const capError = validateVolumeCap(state, state.route, volumeL, 'base', context.acidVolumeL)
  if (capError) return capError

  // The addition about to be recorded is the one that may breach the cap, so
  // count it before validating.
  return validateEventLimits(state, context.totalAcceptedEvents, true)
}

export function validateMix(
  state: AcidNeutralizationState,
  context: AcidPreconditionContext,
): DomainError | null {
  const temperatureError = checkTemperatureInScope(context.temperatureC)
  if (temperatureError) return temperatureError

  if (state.phase === 'completed') {
    return preconditionFailed('ATTEMPT_COMPLETED', 'errors.ATTEMPT_COMPLETED', {
      phase: state.phase,
    })
  }
  /*
    §5: `mix` requires an un-mixed addition. Mixing before anything was added has no
    chemical meaning and would mask a missing addition in the timeline.

    THE CODES STAY; THE MESSAGE KEYS DO NOT. Both branches used to resolve to
    `errors.SAMPLE_NOT_MIXED`, whose text is "Mẫu chưa được khuấy sau lần thêm gần
    nhất" — which states the exact opposite of the first condition. On a fresh attempt
    `mixedSinceLastAddition` is already true, so the workbench greyed out "Khuấy trộn
    mẫu" and explained it with "the sample has not been stirred yet", telling a learner
    to do the very thing the control had just refused.

    The stable error CODES are untouched, because spec §12 names them and the content
    gate checks them. Only which sentence each one resolves to changes, and a refusal
    message never enters a stored event or a hash — a failed action is not persisted —
    so this is wording, not a release-affecting change.
  */
  if (state.mixedSinceLastAddition) {
    return preconditionFailed('SAMPLE_NOT_MIXED', 'errors.ALREADY_MIXED', {
      compositionRevision: state.compositionRevision,
    })
  }
  if (state.baseVolumeL === 0 && state.correctionAcidVolumeL === 0) {
    return preconditionFailed('NOTHING_TO_MIX', 'errors.NOTHING_TO_MIX', {
      compositionRevision: state.compositionRevision,
    })
  }
  return validateEventLimits(state, context.totalAcceptedEvents, false)
}

export function validateWaitForStableReading(
  state: AcidNeutralizationState,
  context: AcidPreconditionContext,
): DomainError | null {
  const temperatureError = checkTemperatureInScope(context.temperatureC)
  if (temperatureError) return temperatureError

  if (state.phase === 'completed') {
    return preconditionFailed('ATTEMPT_COMPLETED', 'errors.ATTEMPT_COMPLETED', {
      phase: state.phase,
    })
  }
  if (!state.mixedSinceLastAddition) {
    return preconditionFailed('SAMPLE_NOT_MIXED', 'errors.SAMPLE_NOT_MIXED', {
      compositionRevision: state.compositionRevision,
    })
  }
  return validateEventLimits(state, context.totalAcceptedEvents, false)
}

export function validateMeasurePh(
  state: AcidNeutralizationState,
  context: AcidPreconditionContext,
): DomainError | null {
  const temperatureError = checkTemperatureInScope(context.temperatureC)
  if (temperatureError) return temperatureError

  if (state.phase === 'completed') {
    return preconditionFailed('ATTEMPT_COMPLETED', 'errors.ATTEMPT_COMPLETED', {
      phase: state.phase,
    })
  }
  // §5: measurement needs a calibrated meter, a mixed sample and a stable
  // reading, in that dependency order.
  if (!state.meterCalibrated) {
    return preconditionFailed('METER_NOT_CALIBRATED', 'errors.METER_NOT_CALIBRATED', {})
  }
  if (!state.mixedSinceLastAddition) {
    return preconditionFailed('SAMPLE_NOT_MIXED', 'errors.SAMPLE_NOT_MIXED', {
      compositionRevision: state.compositionRevision,
    })
  }
  if (!state.readingStable) {
    return preconditionFailed('READING_NOT_STABLE', 'errors.READING_NOT_STABLE', {
      compositionRevision: state.compositionRevision,
    })
  }
  return validateEventLimits(state, context.totalAcceptedEvents, false)
}

/**
 * §12: correction is the recovery branch for TARGET_HIGH, so it is only valid
 * once a stable measurement has actually shown pH* above the target band.
 * Without that gate a learner could pour correction acid into an under-dosed
 * sample and still be scored as if they had overshot.
 */
export function validateAddCorrectionAcid(
  state: AcidNeutralizationState,
  context: AcidPreconditionContext,
  volumeL: number,
  targetPH: number = BENCHMARK_TARGET_PH,
): DomainError | null {
  const temperatureError = checkTemperatureInScope(context.temperatureC)
  if (temperatureError) return temperatureError

  if (state.phase === 'completed') {
    return preconditionFailed('ATTEMPT_COMPLETED', 'errors.ATTEMPT_COMPLETED', {
      phase: state.phase,
    })
  }
  if (state.route === null) {
    return preconditionFailed('ROUTE_NOT_SELECTED', 'errors.ROUTE_NOT_SELECTED', {})
  }
  if (state.lastMeasuredPH === null) {
    return preconditionFailed('READING_NOT_STABLE', 'errors.READING_NOT_STABLE', {})
  }
  if (
    state.lastMeasuredCompositionRevision === null ||
    state.lastMeasuredCompositionRevision !== state.compositionRevision
  ) {
    return preconditionFailed('STALE_MEASUREMENT', 'errors.STALE_MEASUREMENT', {
      measuredRevision: state.lastMeasuredCompositionRevision ?? -1,
      currentRevision: state.compositionRevision,
    })
  }
  if (state.lastMeasuredPH <= targetPH + TARGET_TOLERANCE_PH) {
    return preconditionFailed('TARGET_NOT_HIGH', 'errors.TARGET_NOT_HIGH', {
      lastMeasuredPH: state.lastMeasuredPH,
      targetPH,
      targetTolerancePH: TARGET_TOLERANCE_PH,
    })
  }

  const aliquotError = validateAliquotVolume(volumeL)
  if (aliquotError) return aliquotError

  const capError = validateVolumeCap(
    state,
    state.route,
    volumeL,
    'correction-acid',
    context.acidVolumeL,
  )
  if (capError) return capError

  return validateEventLimits(state, context.totalAcceptedEvents, true)
}

/**
 * §5: `complete` needs a stable, model-valid measurement whose composition
 * revision still matches current state. Being outside the target band is NOT a
 * completion blocker — it produces success=false and a lower score instead,
 * which is the whole point of exposing the rubric (§14.6).
 */
export function validateComplete(
  state: AcidNeutralizationState,
  context: AcidPreconditionContext,
): DomainError | null {
  const temperatureError = checkTemperatureInScope(context.temperatureC)
  if (temperatureError) return temperatureError

  if (state.phase === 'completed') {
    return preconditionFailed('ATTEMPT_COMPLETED', 'errors.ATTEMPT_COMPLETED', {
      phase: state.phase,
    })
  }
  if (!state.meterCalibrated) {
    return preconditionFailed('METER_NOT_CALIBRATED', 'errors.METER_NOT_CALIBRATED', {})
  }
  if (!state.readingStable) {
    return preconditionFailed('READING_NOT_STABLE', 'errors.READING_NOT_STABLE', {})
  }
  if (state.lastMeasuredPH === null) {
    return preconditionFailed('READING_NOT_STABLE', 'errors.READING_NOT_STABLE', {})
  }
  if (
    state.lastMeasuredCompositionRevision === null ||
    state.lastMeasuredCompositionRevision !== state.compositionRevision
  ) {
    return preconditionFailed('STALE_MEASUREMENT', 'errors.STALE_MEASUREMENT', {
      measuredRevision: state.lastMeasuredCompositionRevision ?? -1,
      currentRevision: state.compositionRevision,
    })
  }
  if (!state.modelValid) {
    return modelInvalid('MODEL_INVALID', 'errors.EQUILIBRIUM_NO_CONVERGENCE', {
      invalidReasonCodes: state.invalidReasonCodes.join(','),
    })
  }
  return validateEventLimits(state, context.totalAcceptedEvents, false)
}

/**
 * Whether the measured pH* sits above the target band — the condition that
 * makes correction acid the recommended recovery (spec §12 TARGET_HIGH).
 */
export function isMeasuredPhAboveTarget(
  state: AcidNeutralizationState,
  targetPH: number = BENCHMARK_TARGET_PH,
): boolean {
  return state.lastMeasuredPH !== null && state.lastMeasuredPH > targetPH + TARGET_TOLERANCE_PH
}

/** The §12 TARGET_LOW / TARGET_HIGH diagnostic for the current measurement. */
export function targetDeviationCode(
  state: AcidNeutralizationState,
  targetPH: number = BENCHMARK_TARGET_PH,
): 'TARGET_LOW' | 'TARGET_HIGH' | null {
  const measuredPH = state.lastMeasuredPH
  if (measuredPH === null) return null
  if (measuredPH < targetPH - TARGET_TOLERANCE_PH) return 'TARGET_LOW'
  if (measuredPH > targetPH + TARGET_TOLERANCE_PH) return 'TARGET_HIGH'
  return null
}
