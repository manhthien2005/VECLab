import type { GoalStatus, ResourceLedger, UUID } from '@/domain/process/contracts.js'
import type { StoredAttemptEventRecord } from '@/application/attempts/repository.js'
import {
  JAR_PROFILE, JAR_CUP_IDS, latestValidFinalMeasurement, measuredJarRemoval,
  type JarCupId, type JarMeasurement, type JarState,
} from '@/domain/experiments/jar-test/model.js'
import { createJarModule } from '@/domain/experiments/jar-test/engine.js'

export const JAR_PROJECTION_VERSION = 1
export const JAR_REPORT_SCHEMA_VERSION = 1

/** Only measured values are learner-visible. No model prediction or scoring is projected. */
export type JarReadingView = {
  id: string
  sequence: number
  elapsedSeconds: number
  valueNtu: number | null
  valid: boolean
  invalidReason: JarMeasurement['invalidReason']
}

export type JarCupProjection = {
  id: JarCupId
  initialPh: number
  doseMgL: number
  measurements: JarReadingView[]
  submittedRemovalPercent: number | null
  measuredRemovalPercent: number | null
}

export type JarProjection = {
  scenarioKey: 'jar-test'
  scenarioReleaseId: string
  projectionVersion: number
  phase: JarState['phase']
  elapsedSeconds: number
  initialMeasurement: JarReadingView | null
  cups: JarCupProjection[]
  selectedCupId: JarCupId | null
}

function reading(measurement: JarMeasurement): JarReadingView {
  return {
    id: measurement.id,
    sequence: measurement.sequence,
    elapsedSeconds: measurement.elapsedSeconds,
    valueNtu: measurement.valid ? measurement.valueNtu : null,
    valid: measurement.valid,
    invalidReason: measurement.invalidReason,
  }
}

export function projectJar(state: JarState): JarProjection {
  return {
    scenarioKey: 'jar-test',
    scenarioReleaseId: JAR_PROFILE.releaseId,
    projectionVersion: JAR_PROJECTION_VERSION,
    phase: state.phase,
    elapsedSeconds: state.elapsedSeconds,
    initialMeasurement: state.initialMeasurement === null ? null : reading(state.initialMeasurement),
    cups: JAR_CUP_IDS.flatMap((id) => {
      const cup = state.cups[id]
      if (!cup) return []
      return [{
        id: cup.id,
        initialPh: cup.initialPh,
        doseMgL: cup.totalDoseMgL,
        measurements: cup.measurements.map(reading),
        submittedRemovalPercent: cup.submittedRemovalPercent,
        // The learner can see the measured NTU but not the model-derived
        // expected calculation before submission/completion, even after recording.
        measuredRemovalPercent: state.phase === 'completed'
          ? measuredJarRemoval(state, cup)
          : null,
      }]
    }),
    selectedCupId: state.submission.selectedCupId,
  }
}

export type JarReportMeasurement = JarReadingView & { actionId: UUID }
export type JarReportCup = JarCupProjection & {
  measurements: JarReportMeasurement[]
  measuredRemovalPercent: number | null
  meetsTarget: boolean | null
  arithmeticCorrect: boolean | null
}

export type JarDiagnostic = {
  code: 'NO_FINAL_READING' | 'INVALID_FINAL_READING' | 'BELOW_TARGET' |
    'MISSING_CALCULATION' | 'INCORRECT_CALCULATION' | 'NO_SELECTION'
  cupId: JarCupId | null
  measurementId: string | null
  /** Every entry names a persisted action, never a guessed or generated id. */
  actionIds: UUID[]
}

export type JarReportSnapshot = {
  schemaVersion: number
  scenarioKey: 'jar-test'
  releaseId: string
  generatedAt: Date
  versions: {
    profileId: string
    profileVersion: string
    modelSpecVersion: string
    scoringVersion: string
    stateSchemaVersion: string
    contentVersion: string
    evidenceRegisterVersion: string
    projectionVersion: number
  }
  reference: {
    sourceDoi: string
    initialNtu: number
    targetRemovalPercent: number
    answerTolerancePercentagePoints: number
    phases: typeof JAR_PROFILE.phases
  }
  projection: JarProjection
  initialMeasurement: (JarReadingView & { actionId: UUID }) | null
  cups: JarReportCup[]
  selectedCupId: JarCupId | null
  resources: {
    waterLiters: number
    operationCount: number
    reagents: ResourceLedger['reagents']
  }
  goalStatus: GoalStatus
  diagnostics: JarDiagnostic[]
}

/**
 * Report creation is completion-only. All diagnostic IDs are resolved against
 * actual stored event records; a measurement without event provenance fails closed.
 */
export function buildJarReport(
  state: JarState,
  ledger: ResourceLedger,
  events: readonly StoredAttemptEventRecord<JarState>[],
  generatedAt: Date,
): JarReportSnapshot {
  if (state.phase !== 'completed') {
    throw new Error('Jar report requires a completed state')
  }
  const bySequence = new Map(events.map((event) => [event.sequence, event]))
  function actionIdFor(sequence: number, actionType: string): UUID {
    const event = bySequence.get(sequence)
    if (!event || event.actionType !== actionType) {
      throw new Error('Missing stored Jar event evidence for sequence ' + sequence)
    }
    return event.actionId
  }
  function supportingIds(cupId: JarCupId): UUID[] {
    return events.filter((event) => {
      if (event.actionType !== 'prepare_cup' && event.actionType !== 'add_coagulant') return false
      const payload = event.inputPayload as { parameters?: { cupId?: unknown } } | null
      return payload?.parameters?.cupId === cupId
    }).map((event) => event.actionId)
  }

  const projection = projectJar(state)
  const diagnostics: JarDiagnostic[] = []
  const cups: JarReportCup[] = projection.cups.map((view) => {
    const cup = state.cups[view.id]!
    const valid = latestValidFinalMeasurement(cup)
    const finalMeasurementId = valid?.id ?? null
    const measurements = cup.measurements.map((m) => ({
      ...reading(m), actionId: actionIdFor(m.sequence, 'measure_final'),
    }))
    const removal = measuredJarRemoval(state, cup)
    const arithmeticCorrect = removal === null || cup.submittedRemovalPercent === null
      ? null
      : Math.abs(cup.submittedRemovalPercent - removal) <=
        JAR_PROFILE.answerTolerancePercentagePoints
    const evidence = valid
      ? [actionIdFor(valid.sequence, 'measure_final')]
      : measurements.length > 0
        ? measurements.map((m) => m.actionId)
        : supportingIds(view.id)
    function diagnose(code: JarDiagnostic['code']): void {
      diagnostics.push({ code, cupId: view.id, measurementId: finalMeasurementId, actionIds: evidence })
    }
    if (removal === null) diagnose(measurements.length > 0 ? 'INVALID_FINAL_READING' : 'NO_FINAL_READING')
    else {
      if (removal < JAR_PROFILE.goalRemovalPercent) diagnose('BELOW_TARGET')
      if (cup.submittedRemovalPercent === null) diagnose('MISSING_CALCULATION')
      else if (!arithmeticCorrect) {
        const answers = events.filter((e) => {
          if (e.actionType !== 'record_result') return false
          const payload = e.inputPayload as { parameters?: { cupId?: unknown } } | null
          return payload?.parameters?.cupId === view.id
        })
        const answer = answers[answers.length - 1]
        diagnostics.push({
          code: 'INCORRECT_CALCULATION', cupId: view.id,
          measurementId: finalMeasurementId,
          actionIds: [...evidence, ...(answer ? [answer.actionId] : [])],
        })
      }
    }
    return {
      ...view,
      measurements,
      measuredRemovalPercent: removal,
      meetsTarget: removal === null ? null : removal >= JAR_PROFILE.goalRemovalPercent,
      arithmeticCorrect,
    }
  })
  // Absence of a selection has no causal action ID to cite. The goal-status
  // already records it as non-evaluable, so do not fabricate diagnostic evidence.
  const initial = state.initialMeasurement
  return {
    schemaVersion: JAR_REPORT_SCHEMA_VERSION,
    scenarioKey: 'jar-test',
    releaseId: JAR_PROFILE.releaseId,
    generatedAt,
    versions: {
      profileId: JAR_PROFILE.id,
      profileVersion: JAR_PROFILE.version,
      modelSpecVersion: JAR_PROFILE.modelSpecVersion,
      scoringVersion: JAR_PROFILE.version,
      stateSchemaVersion: JAR_PROFILE.version,
      contentVersion: JAR_PROFILE.version,
      evidenceRegisterVersion: JAR_PROFILE.version,
      projectionVersion: JAR_PROJECTION_VERSION,
    },
    reference: {
      sourceDoi: JAR_PROFILE.sourceDoi,
      initialNtu: JAR_PROFILE.initialNtu,
      targetRemovalPercent: JAR_PROFILE.goalRemovalPercent,
      answerTolerancePercentagePoints: JAR_PROFILE.answerTolerancePercentagePoints,
      phases: JAR_PROFILE.phases,
    },
    projection,
    initialMeasurement: initial === null ? null : {
      ...reading(initial), actionId: actionIdFor(initial.sequence, 'measure_initial'),
    },
    cups,
    selectedCupId: state.submission.selectedCupId,
    resources: {
      waterLiters: ledger.waterLiters,
      operationCount: ledger.operationCount,
      reagents: Object.fromEntries(Object.entries(ledger.reagents).map(([key, value]) =>
        [key, { ...value }])),
    },
    goalStatus: createJarModule().evaluateGoalStatus(state, ledger),
    diagnostics,
  }
}
