/**
 * Water Treatment Report snapshot types.
 * Generated when submitting an attempt.
 */

export type WaterTreatmentReportSnapshot = {
  // Meta
  readonly generatedAt: Date
  readonly attemptId: string
  readonly status: 'completed'
  readonly releaseId: string
  readonly versions: {
    profileId: string
    profileVersion: string
  }

  // Sample composition (Bàn 1)
  readonly sampleStatus: {
    feAddedMl: number
    znAddedMl: number
    pbAddedMl: number
    volumeMl: number
  }
  readonly sampleCalculation: {
    dissolvedMgL: {
      fe: number
      zn: number
      pb: number
    }
  } | null

  // Treatment (Bàn 2)
  readonly treatmentStatus: {
    pH: number
    volumeMl: number
    naohAddedMl: number
    hclAddedMl: number
    stirDurationSeconds: number
    settleDurationSeconds: number
    filterCount: number
  }
  readonly filterHistory: ReadonlyArray<{
    sequence: number
    phAfter: number
    elapsedSeconds: number
  }>
  readonly ban2LockedData: {
    finalPH: number
    feAfterMgL: number
    znAfterMgL: number
    pbAfterMgL: number
  } | null

  // Discharge (Bàn 3)
  readonly dischargePhase: 'idle' | 'discharging' | 'discharged'
  readonly dischargePH: number | null

  // Evaluation against QCVN 40:2025 Column A
  readonly goalStatus: {
    evaluable: boolean
    goalMet: boolean
    criteria: ReadonlyArray<{
      key: 'fe' | 'zn' | 'pb' | 'ph'
      label: string
      met: boolean
      value: number | null
      limit: { min?: number; max?: number; value?: number }
    }>
  }

  // Resources used
  readonly resources: {
    operationCount: number
    waterUsedMl: number
    reagents: {
      naoh: { amount: number; unit: string }
      hcl: { amount: number; unit: string }
    }
  }

  // Diagnostics and feedback
  readonly diagnostics: ReadonlyArray<{
    code: string
    message: string
    suggestion: string
    severity: 'error' | 'warning' | 'info'
  }>

  // Removal efficiency
  readonly removalEfficiency: {
    fe: number | null
    zn: number | null
    pb: number | null
  }
}

export type WaterTreatmentDiagnosticCode =
  | 'NO_INITIAL_SAMPLE'
  | 'NO_TREATMENT'
  | 'NO_BAN2_LOCKED'
  | 'NO_DISCHARGE'
  | 'FE_EXCEEDS_LIMIT'
  | 'ZN_EXCEEDS_LIMIT'
  | 'PB_EXCEEDS_LIMIT'
  | 'PH_OUT_OF_RANGE'
  | 'LOW_REMOVAL_FE'
  | 'LOW_REMOVAL_ZN'
  | 'LOW_REMOVAL_PB'
  | 'INCOMPLETE_TREATMENT'
  | 'MISSING_FILTRATION'
