import type {
  GoalStatus,
  ResourceLedger,
  UUID,
} from '@/domain/process/contracts.js'
import type { StoredAttemptEventRecord } from '@/application/attempts/repository.js'
import {
  PLASTIC_PROFILE,
  VIRGIN_POLYMERS,
  OUTCOMES,
  type PlasticSeparationState,
  type PolymerId,
  type ProcessStage,
  type SeparationBranch,
  type SeparationOutcome,
  type FractionCollection,
  createPlasticSeparationModule,
  isPolymerId,
} from '@/domain/experiments/virgin-plastic-separation/index.js'

export const PLASTIC_PROJECTION_VERSION = 1
export const PLASTIC_REPORT_SCHEMA_VERSION = 1

export type PolymerVisualLocation =
  | 'tray' // in preparation tray
  | 'tank_mixing' // in pilot tank, wetting & stirring
  | 'water_floating' // floating at top of pilot tank in water
  | 'water_sinking' // sunken to bottom of pilot tank in water
  | 'centrifuged' // dewatered in intermediate collection
  | 'separated_floating' // floating in branch medium
  | 'separated_sinking' // sunken in branch medium
  | 'collected' // recovered in clean storage container

export type PolymerVisualState = {
  id: PolymerId
  name: string
  densityGPerCm3: number
  nominalDensity: string
  colorHex: string
  strokeHex: string
  particleShape: 'pellet' | 'sphere' | 'rectangle' | 'cylinder'
  location: PolymerVisualLocation
  recovered: boolean
  recoveryPercent: number | null
}

export type WeighedFractionReadout = {
  massKg: number
  recoveryPercent: number
}

export type PlasticProjection = {
  scenarioKey: 'plastic-separation'
  scenarioReleaseId: string
  projectionVersion: number
  stage: ProcessStage
  revision: number
  samplesPrepared: boolean
  tankLoaded: boolean
  wetted: boolean
  waterSeparated: boolean
  centrifuged: boolean
  pendingCentrifugation: boolean
  activeBranch: SeparationBranch | null
  ethanolProgress: 0 | 1 | 2
  naclProgress: 0 | 1 | 2 | 3
  completedBranches: readonly SeparationBranch[]
  lastOutcome: SeparationOutcome | null
  outcomesHistory: readonly SeparationOutcome[]
  collectedFractions: readonly FractionCollection[]
  polymers: readonly PolymerVisualState[]
  weighedMassKg: number | null
  weighedRecoveryPercent: number | null
  weighedPolymerIds: readonly PolymerId[]
  weighedFractions: Partial<Record<PolymerId, WeighedFractionReadout>>
  weighedLabelVi: string | null
  activeStepIndex: number
  nextPromptVi: string
}

function deriveWeighingReadout(state: PlasticSeparationState) {
  if (!state.centrifuged || state.pendingCentrifugation || !state.lastOutcome) {
    return {
      massKg: null,
      recoveryPercent: null,
      polymerIds: [] as PolymerId[],
      fractions: {} as Partial<Record<PolymerId, WeighedFractionReadout>>,
      labelVi: null,
    }
  }

  const recoveries = state.lastOutcome.reportedRecoveries
  const groupRecovery = recoveries.PP_HDPE_GROUP
  if (typeof groupRecovery === 'number') {
    return {
      massKg: PLASTIC_PROFILE.sampleFeedMassKg * 2 * groupRecovery / 100,
      recoveryPercent: groupRecovery,
      polymerIds: ['PP', 'HDPE'] as PolymerId[],
      fractions: {},
      labelVi: `PP + HDPE · thu hồi ${groupRecovery.toLocaleString('vi-VN')}%`,
    }
  }

  const recovered = Object.entries(recoveries).filter(
    (entry): entry is [PolymerId, number] => isPolymerId(entry[0]) && typeof entry[1] === 'number',
  )
  if (recovered.length === 0) {
    return {
      massKg: null,
      recoveryPercent: null,
      polymerIds: [] as PolymerId[],
      fractions: {} as Partial<Record<PolymerId, WeighedFractionReadout>>,
      labelVi: null,
    }
  }

  const fractions = Object.fromEntries(
    recovered.map(([id, percent]) => [id, {
      massKg: PLASTIC_PROFILE.sampleFeedMassKg * percent / 100,
      recoveryPercent: percent,
    }]),
  ) as Partial<Record<PolymerId, WeighedFractionReadout>>

  return {
    massKg: Object.values(fractions).reduce((total, fraction) => total + (fraction?.massKg ?? 0), 0),
    recoveryPercent: recovered.length === 1 ? (recovered[0]?.[1] ?? null) : null,
    polymerIds: recovered.map(([id]) => id),
    fractions,
    labelVi: recovered
      .map(([id, percent]) => `${id} · ${percent.toLocaleString('vi-VN')}%`)
      .join(' / '),
  }
}

export function derivePolymerLocation(
  polymerId: PolymerId,
  state: PlasticSeparationState,
): { location: PolymerVisualLocation; recovered: boolean; recoveryPercent: number | null } {
  // Check if polymer is already collected in final fraction
  const fraction = state.collectedFractions.find((f) => f.polymerId === polymerId)
  if (fraction) {
    if (
      state.pendingCentrifugation &&
      state.stage === 'centrifugation' &&
      fraction.stageKind === state.lastOutcome?.kind
    ) {
      return {
        location: fraction.behavior === 'floating' ? 'separated_floating' : 'separated_sinking',
        recovered: false,
        recoveryPercent: fraction.reportedRecoveryPercent,
      }
    }
    return {
      location: 'collected',
      recovered: true,
      recoveryPercent: fraction.reportedRecoveryPercent,
    }
  }

  if (state.stage === 'preparation') {
    return { location: 'tray', recovered: false, recoveryPercent: null }
  }

  if (state.stage === 'wetting') {
    return { location: 'tank_mixing', recovered: false, recoveryPercent: null }
  }

  if (state.stage === 'water_separation') {
    const isLight = polymerId === 'PP' || polymerId === 'HDPE'
    return {
      location: isLight ? 'water_floating' : 'water_sinking',
      recovered: false,
      recoveryPercent: isLight ? 97.5 : null,
    }
  }

  if ((state.stage === 'centrifugation' && !state.pendingCentrifugation) || state.stage === 'branch_selection') {
    return { location: 'centrifuged', recovered: false, recoveryPercent: null }
  }

  // Branch stages:
  if (state.stage === 'ethanol_branch') {
    const isPolyolefin = polymerId === 'PP' || polymerId === 'HDPE'
    if (!isPolyolefin) {
      return { location: 'centrifuged', recovered: false, recoveryPercent: null }
    }
    if (state.ethanolProgress === 1) {
      return {
        location: polymerId === 'PP' ? 'separated_floating' : 'separated_sinking',
        recovered: polymerId === 'PP',
        recoveryPercent: polymerId === 'PP' ? 95.6 : null,
      }
    }
    if (state.ethanolProgress === 2) {
      return {
        location: polymerId === 'PP' ? 'collected' : 'separated_sinking',
        recovered: true,
        recoveryPercent: polymerId === 'PP' ? 95.6 : 99.7,
      }
    }
    return { location: 'centrifuged', recovered: false, recoveryPercent: null }
  }

  if (state.stage === 'nacl_branch') {
    const isHeavy = polymerId === 'PS' || polymerId === 'ABS' || polymerId === 'PA' || polymerId === 'PC'
    if (!isHeavy) {
      return { location: 'centrifuged', recovered: false, recoveryPercent: null }
    }
    if (state.naclProgress === 1) {
      return {
        location: polymerId === 'PS' ? 'separated_floating' : 'separated_sinking',
        recovered: polymerId === 'PS',
        recoveryPercent: polymerId === 'PS' ? 80.3 : null,
      }
    }
    if (state.naclProgress === 2) {
      if (polymerId === 'PS') return { location: 'collected', recovered: true, recoveryPercent: 80.3 }
      return {
        location: polymerId === 'ABS' ? 'separated_floating' : 'separated_sinking',
        recovered: polymerId === 'ABS',
        recoveryPercent: polymerId === 'ABS' ? 84.8 : null,
      }
    }
    if (state.naclProgress === 3) {
      if (polymerId === 'PS') return { location: 'collected', recovered: true, recoveryPercent: 80.3 }
      if (polymerId === 'ABS') return { location: 'collected', recovered: true, recoveryPercent: 84.8 }
      return {
        location: polymerId === 'PA' ? 'separated_floating' : 'separated_sinking',
        recovered: true,
        recoveryPercent: polymerId === 'PA' ? 70.0 : 95.4,
      }
    }
    return { location: 'centrifuged', recovered: false, recoveryPercent: null }
  }

  // Summary / completed
  return { location: 'centrifuged', recovered: false, recoveryPercent: null }
}

export function projectPlastic(state: PlasticSeparationState): PlasticProjection {
  const weighing = deriveWeighingReadout(state)
  const polymers: PolymerVisualState[] = VIRGIN_POLYMERS.map((p) => {
    const derived = derivePolymerLocation(p.id, state)
    const isReaddedPpForEthanol31 =
      p.id === 'PP' &&
      state.activeBranch === 'light' &&
      state.ethanolProgress === 2 &&
      (state.stage === 'ethanol_branch' || state.stage === 'centrifugation')
    const { location, recovered, recoveryPercent } = isReaddedPpForEthanol31
      ? { location: 'separated_floating' as const, recovered: false, recoveryPercent: null }
      : derived
    return {
      id: p.id,
      name: p.name,
      densityGPerCm3: p.densityGPerCm3,
      nominalDensity: p.nominalDensity,
      colorHex: p.colorHex,
      strokeHex: p.strokeHex,
      particleShape: p.particleShape,
      location,
      recovered,
      recoveryPercent,
    }
  })

  let activeStepIndex = 0
  let nextPromptVi = 'Chuẩn bị sáu loại polymer nguyên sinh và nạp vào bể pilot.'

  if (state.stage === 'preparation') {
    activeStepIndex = 0
    nextPromptVi = state.samplesPrepared
      ? 'Nạp sáu mẫu polymer nguyên sinh vào bể pilot theo khối lượng cấp liệu trong nghiên cứu.'
      : 'Chuẩn bị sáu mẫu polymer nguyên sinh theo đặc điểm và khối lượng được báo cáo trong nghiên cứu.'
  } else if (state.stage === 'wetting') {
    activeStepIndex = 1
    nextPromptVi = 'Mẫu đang được khuấy 160 rpm trong nước máy. Thực hiện tách sơ bộ bằng nước.'
  } else if (state.stage === 'water_separation') {
    activeStepIndex = 2
    nextPromptVi = 'Nhóm PP+HDPE đã nổi lên (97,5% thu hồi). Tiến hành ly tâm và cân mẫu.'
  } else if (state.stage === 'centrifugation' && state.pendingCentrifugation) {
    activeStepIndex = 3
    nextPromptVi = 'Ghi nhận ly tâm phân đoạn ở 2.950 rpm như điều kiện được mô tả trong bài báo.'
  } else if (state.stage === 'centrifugation' || state.stage === 'branch_selection') {
    activeStepIndex = 3
    nextPromptVi = 'Chọn phân đoạn để xử lý tiếp: Nhánh nhẹ (Ethanol) hoặc Nhánh nặng (NaCl).'
  } else if (state.stage === 'ethanol_branch') {
    activeStepIndex = 4
    if (state.ethanolProgress === 0) {
      nextPromptVi = 'Chạy preset Ethanol 23% v/v để tách PP nổi khỏi HDPE.'
    } else if (state.ethanolProgress === 1) {
      nextPromptVi = 'Chạy preset Ethanol 31% v/v để phân tách hoàn toàn và thu hồi HDPE.'
    } else {
      nextPromptVi = 'Nhánh Ethanol hoàn thành. Bạn có thể sang Nhánh NaCl hoặc xem Tổng kết.'
    }
  } else if (state.stage === 'nacl_branch') {
    activeStepIndex = 4
    if (state.naclProgress === 0) {
      nextPromptVi = 'Chạy preset NaCl 11–12% w/v để tách PS nổi (80,3% thu hồi).'
    } else if (state.naclProgress === 1) {
      nextPromptVi = 'Chạy preset NaCl 20% w/v để tách ABS nổi (84,8% thu hồi).'
    } else if (state.naclProgress === 2) {
      nextPromptVi = 'Chạy preset NaCl 40% w/v để tách PA nổi (70%) và PC chìm (95,4%).'
    } else {
      nextPromptVi = 'Nhánh NaCl hoàn thành. Bạn có thể sang Nhánh Ethanol hoặc xem Tổng kết.'
    }
  } else if (state.stage === 'summary') {
    activeStepIndex = 5
    nextPromptVi = 'Kiểm tra cây phân loại và đối chiếu thu hồi. Nhấn "Hoàn thành" để lưu báo cáo.'
  } else if (state.stage === 'completed') {
    activeStepIndex = 6
    nextPromptVi = 'Đã hoàn tất bài thực hành. Báo cáo khoa học đã được lưu an toàn.'
  }

  return {
    scenarioKey: 'plastic-separation',
    scenarioReleaseId: PLASTIC_PROFILE.releaseId,
    projectionVersion: PLASTIC_PROJECTION_VERSION,
    stage: state.stage,
    revision: state.revision,
    samplesPrepared: state.samplesPrepared,
    tankLoaded: state.tankLoaded,
    wetted: state.wetted,
    waterSeparated: state.waterSeparated,
    centrifuged: state.centrifuged,
    pendingCentrifugation: state.pendingCentrifugation,
    activeBranch: state.activeBranch,
    ethanolProgress: state.ethanolProgress,
    naclProgress: state.naclProgress,
    completedBranches: state.completedBranches,
    lastOutcome: state.lastOutcome,
    outcomesHistory: state.outcomesHistory,
    collectedFractions: state.collectedFractions,
    polymers,
    weighedMassKg: weighing.massKg,
    weighedRecoveryPercent: weighing.recoveryPercent,
    weighedPolymerIds: weighing.polymerIds,
    weighedFractions: weighing.fractions,
    weighedLabelVi: weighing.labelVi,
    activeStepIndex,
    nextPromptVi,
  }
}

export type PlasticDiagnostic = {
  code:
    | 'LIGHT_BRANCH_INCOMPLETE'
    | 'HEAVY_BRANCH_INCOMPLETE'
    | 'PREMATURE_COMPLETION'
    | 'ALL_BRANCHES_COMPLETED'
  messageVi: string
  actionIds: UUID[]
}

export type PlasticReportSnapshot = {
  schemaVersion: number
  scenarioKey: 'plastic-separation'
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
    pilotTankVolumeLiters: number
    wettingStirringRpm: number
    centrifugeRpm: number
    sampleFeedMassKg: number
    polymers: typeof VIRGIN_POLYMERS
    outcomes: typeof OUTCOMES
  }
  projection: PlasticProjection
  resources: {
    waterLiters: number
    operationCount: number
    reagents: ResourceLedger['reagents']
  }
  goalStatus: GoalStatus
  diagnostics: PlasticDiagnostic[]
}

export function buildPlasticReport(
  state: PlasticSeparationState,
  ledger: ResourceLedger,
  events: readonly StoredAttemptEventRecord<PlasticSeparationState>[],
  generatedAt: Date,
): PlasticReportSnapshot {
  if (state.stage !== 'completed') {
    throw new Error('Plastic report requires a completed state')
  }

  const projection = projectPlastic(state)
  const plasticModule = createPlasticSeparationModule()
  const goalStatus = plasticModule.evaluateGoalStatus(state, ledger)

  const diagnostics: PlasticDiagnostic[] = []
  const allActionIds = events.map((e) => e.actionId)

  if (!state.completedBranches.includes('light')) {
    diagnostics.push({
      code: 'LIGHT_BRANCH_INCOMPLETE',
      messageVi: 'Chưa thực hiện phân loại nhóm nhẹ (PP + HDPE) trong môi trường Ethanol.',
      actionIds: allActionIds,
    })
  }

  if (!state.completedBranches.includes('heavy')) {
    diagnostics.push({
      code: 'HEAVY_BRANCH_INCOMPLETE',
      messageVi: 'Chưa thực hiện phân loại nhóm nặng (PS + ABS + PA + PC) trong dung dịch NaCl.',
      actionIds: allActionIds,
    })
  }

  if (state.completedBranches.length === 2) {
    diagnostics.push({
      code: 'ALL_BRANCHES_COMPLETED',
      messageVi: 'Đã hoàn thành toàn bộ hai nhánh phân loại, thu hồi cả 6 polymer theo đúng bài báo.',
      actionIds: allActionIds,
    })
  }

  return {
    schemaVersion: PLASTIC_REPORT_SCHEMA_VERSION,
    scenarioKey: 'plastic-separation',
    releaseId: PLASTIC_PROFILE.releaseId,
    generatedAt,
    versions: {
      profileId: PLASTIC_PROFILE.id,
      profileVersion: PLASTIC_PROFILE.version,
      modelSpecVersion: PLASTIC_PROFILE.modelSpecVersion,
      scoringVersion: PLASTIC_PROFILE.scoringVersion,
      stateSchemaVersion: PLASTIC_PROFILE.version,
      contentVersion: PLASTIC_PROFILE.version,
      evidenceRegisterVersion: PLASTIC_PROFILE.version,
      projectionVersion: PLASTIC_PROJECTION_VERSION,
    },
    reference: {
      sourceDoi: PLASTIC_PROFILE.sourceDoi,
      pilotTankVolumeLiters: PLASTIC_PROFILE.pilotTankVolumeLiters,
      wettingStirringRpm: PLASTIC_PROFILE.wettingStirringRpm,
      centrifugeRpm: PLASTIC_PROFILE.centrifugeRpm,
      sampleFeedMassKg: PLASTIC_PROFILE.sampleFeedMassKg,
      polymers: VIRGIN_POLYMERS,
      outcomes: OUTCOMES,
    },
    projection,
    resources: {
      waterLiters: ledger.waterLiters,
      operationCount: ledger.operationCount,
      reagents: Object.fromEntries(
        Object.entries(ledger.reagents).map(([k, v]) => [k, { ...v }]),
      ),
    },
    goalStatus,
    diagnostics,
  }
}
