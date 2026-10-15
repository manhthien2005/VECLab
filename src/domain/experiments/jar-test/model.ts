/**
 * Jar Test teaching profile: a fixed 125-NTU kaolin/alum sample, two paddles.
 * Alateef et al. (2024), Equation 3 (printed coefficients), DOI
 * 10.6703/IJASE.202403_21(1).010. This is an in-domain response surface,
 * NOT empirical validation or a time-dependent/floc-size model.
 */
export const JAR_PROFILE = {
  id: 'kaolin-alum-two-paddle-125ntu',
  version: '0.1.0',
  releaseId: 'jar-test@0.1.0',
  modelSpecVersion: 'alateef-2024-equation-3-printed',
  sourceDoi: '10.6703/IJASE.202403_21(1).010',
  initialNtu: 125,
  availableInitialPh: [5, 7, 9],
  doseStepMgL: 50,
  minDoseMgL: 50,
  maxDoseMgL: 250,
  aliquotVolumeL: 0.5,
  beakerCapacityL: 1,
  goalRemovalPercent: 80,
  answerTolerancePercentagePoints: 0.5,
  phases: {
    rapid: { rpm: 100, durationSeconds: 60 },
    slow: { rpm: 40, durationSeconds: 1200 },
    settling: { rpm: 0, durationSeconds: 1800 },
  },
} as const

export type JarProfile = typeof JAR_PROFILE
export const JAR_CUP_IDS = ['A', 'B', 'C', 'D', 'E', 'F'] as const
export type JarCupId = (typeof JAR_CUP_IDS)[number]
export type JarPhase = 'setup' | 'rapid' | 'slow' | 'settling' | 'completed'

export type JarMeasurement = {
  id: string
  cupId: JarCupId | null
  kind: 'initial' | 'final'
  sequence: number
  elapsedSeconds: number
  compositionRevision: number
  valueNtu: number | null
  valid: boolean
  invalidReason: 'PROTOCOL_INCOMPLETE' | null
}

export type JarCup = {
  id: JarCupId
  initialPh: number
  totalDoseMgL: number
  compositionRevision: number
  measurements: JarMeasurement[]
  submittedRemovalPercent: number | null
}

export type JarState = {
  profileId: string
  profileVersion: string
  revision: number
  phase: JarPhase
  elapsedSeconds: number
  initialMeasurement: JarMeasurement | null
  cups: Partial<Record<JarCupId, JarCup>>
  submission: { selectedCupId: JarCupId | null }
}

export function isJarCupId(value: unknown): value is JarCupId {
  return typeof value === 'string' && (JAR_CUP_IDS as readonly string[]).includes(value)
}

export function createInitialJarState(): JarState {
  return {
    profileId: JAR_PROFILE.id,
    profileVersion: JAR_PROFILE.version,
    revision: 0,
    phase: 'setup',
    elapsedSeconds: 0,
    initialMeasurement: null,
    cups: {},
    submission: { selectedCupId: null },
  }
}

/**
 * Equation 3 using A = 0 (initial NTU = 125), B = (pH - 7)/2,
 * C = (alum dose mg/L - 150)/100. No clamp or extrapolation.
 * The printed coefficients are rounded; agreement with these coefficients
 * is arithmetic reproduction, not out-of-sample or laboratory validation.
 */
export function predictJarRemoval(initialPh: number, doseMgL: number): number {
  if (
    !Number.isFinite(initialPh) || !Number.isFinite(doseMgL) ||
    initialPh < 5 || initialPh > 9 ||
    doseMgL < JAR_PROFILE.minDoseMgL || doseMgL > JAR_PROFILE.maxDoseMgL
  ) {
    throw new RangeError('Outside published Jar response-surface domain')
  }
  const b = (initialPh - 7) / 2
  const c = (doseMgL - 150) / 100
  const predicted = 60.63 + 21.15 * b + 0.10 * c +
    0.41 * b * c + 5.01 * b * b - 9.24 * c * c
  if (!Number.isFinite(predicted) || predicted < 0 || predicted > 100) {
    throw new RangeError('Jar response-surface result outside physical percentage range')
  }
  return predicted
}

export function latestValidFinalMeasurement(cup: JarCup): JarMeasurement | null {
  for (let i = cup.measurements.length - 1; i >= 0; i -= 1) {
    const reading = cup.measurements[i]
    if (reading?.kind === 'final' && reading.valid && reading.valueNtu !== null) {
      return reading
    }
  }
  return null
}

export function measuredJarRemoval(state: JarState, cup: JarCup): number | null {
  const initial = state.initialMeasurement
  const final = latestValidFinalMeasurement(cup)
  if (!initial?.valid || initial.valueNtu === null || initial.valueNtu <= 0 ||
      final?.valueNtu === undefined || final.valueNtu === null) return null
  return ((initial.valueNtu - final.valueNtu) / initial.valueNtu) * 100
}
