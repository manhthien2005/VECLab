import type {
  DomainError,
  DomainModule,
  GoalStatus,
  ResourceDelta,
  ResourceLedger,
  SimulationAction,
  SimulationContext,
  SimulationResult,
} from '@/domain/process/contracts.js'
import {
  PLASTIC_PROFILE,
  PLASTIC_ACTION_TYPES,
  OUTCOMES,
  type PlasticSeparationState,
  type SeparationBranch,
  type SeparationKind,
  type FractionCollection,
  createInitialPlasticState,
} from './model.js'

const EMPTY_DELTA: ResourceDelta = {
  reagents: {},
  waterLiters: 0,
  operationCount: 1,
  relativeCostIndexDelta: null,
  safetyPenalties: [],
  secondaryWaste: {},
}

function badInput(code: string, messageKey?: string): DomainError {
  return {
    category: 'invalid_input',
    code,
    messageKey: messageKey ?? `errors.plastic.${code}`,
    data: {},
  }
}

function preconditionFailed(code: string, messageKey?: string): DomainError {
  return {
    category: 'precondition_failed',
    code,
    messageKey: messageKey ?? `errors.plastic.${code}`,
    data: {},
  }
}

function validatePlasticAction(
  state: PlasticSeparationState,
  action: SimulationAction,
): DomainError | null {
  if (!PLASTIC_ACTION_TYPES.includes(action.actionType as (typeof PLASTIC_ACTION_TYPES)[number])) {
    return badInput('UNKNOWN_ACTION_TYPE')
  }

  const p = action.parameters

  switch (action.actionType) {
    case 'prepare_samples': {
      if (state.stage !== 'preparation' || state.samplesPrepared) {
        return preconditionFailed('ALREADY_PREPARED')
      }
      return null
    }

    case 'load_and_wet': {
      if (!state.samplesPrepared) {
        return preconditionFailed('SAMPLES_NOT_PREPARED')
      }
      if (state.stage !== 'preparation') {
        return preconditionFailed('INVALID_STAGE_FOR_WETTING')
      }
      return null
    }

    case 'separate_water': {
      if (!state.wetted || !state.tankLoaded) {
        return preconditionFailed('SAMPLES_NOT_WETTED')
      }
      if (state.stage !== 'wetting') {
        return preconditionFailed('INVALID_STAGE_FOR_WATER_SEPARATION')
      }
      return null
    }

    case 'centrifuge_and_weigh': {
      if (!state.waterSeparated) {
        return preconditionFailed('WATER_SEPARATION_NOT_DONE')
      }
      const afterWater = state.stage === 'water_separation' && !state.centrifuged
      const afterBranch = state.stage === 'centrifugation' && state.pendingCentrifugation
      if (!afterWater && !afterBranch) {
        return preconditionFailed('INVALID_STAGE_FOR_CENTRIFUGATION')
      }
      return null
    }

    case 'select_branch': {
      if (!state.centrifuged) {
        return preconditionFailed('CENTRIFUGATION_NOT_DONE')
      }
      if (!['branch_selection', 'ethanol_branch', 'nacl_branch'].includes(state.stage)) {
        return preconditionFailed('INVALID_STAGE_FOR_BRANCH_SELECTION')
      }
      const branch = p.branch
      if (branch !== 'light' && branch !== 'heavy') {
        return badInput('INVALID_BRANCH_CHOICE')
      }
      return null
    }

    case 'run_ethanol_preset': {
      if (state.stage !== 'ethanol_branch') {
        return preconditionFailed('NOT_IN_ETHANOL_BRANCH')
      }
      const concentration = Number(p.concentration)
      if (concentration !== 23 && concentration !== 31) {
        return badInput('INVALID_ETHANOL_PRESET')
      }
      if (concentration === 23 && state.ethanolProgress !== 0) {
        return preconditionFailed('ETHANOL_23_ALREADY_RUN')
      }
      if (concentration === 31 && state.ethanolProgress !== 1) {
        return preconditionFailed('MUST_RUN_ETHANOL_23_FIRST')
      }
      return null
    }

    case 'run_nacl_preset': {
      if (state.stage !== 'nacl_branch') {
        return preconditionFailed('NOT_IN_NACL_BRANCH')
      }
      const concRaw = p.concentration
      const concNum = typeof concRaw === 'string' ? parseFloat(concRaw.replace(',', '.')) : Number(concRaw)
      // Accepted discrete presets for NaCl: 11.5 (for 11-12%), 20, 40
      const is11_12 = concRaw === '11-12' || concNum === 11.5 || concNum === 11 || concNum === 12
      const is20 = concNum === 20
      const is40 = concNum === 40

      if (!is11_12 && !is20 && !is40) {
        return badInput('INVALID_NACL_PRESET')
      }
      if (is11_12 && state.naclProgress !== 0) {
        return preconditionFailed('NACL_11_12_ALREADY_RUN')
      }
      if (is20 && state.naclProgress !== 1) {
        return preconditionFailed('MUST_RUN_NACL_11_12_FIRST')
      }
      if (is40 && state.naclProgress !== 2) {
        return preconditionFailed('MUST_RUN_NACL_20_FIRST')
      }
      return null
    }

    case 'summarize_fractions': {
      if (state.pendingCentrifugation || !state.completedBranches.includes('light') || !state.completedBranches.includes('heavy')) {
        return preconditionFailed('BOTH_BRANCHES_MUST_BE_COMPLETE')
      }
      return null
    }

    case 'complete': {
      if (state.stage !== 'summary') {
        return preconditionFailed('CANNOT_COMPLETE_BEFORE_SUMMARY')
      }
      return null
    }

    default:
      return badInput('UNKNOWN_ACTION')
  }
}

function transition(
  state: PlasticSeparationState,
  action: SimulationAction,
  sequence: number,
): SimulationResult<PlasticSeparationState> {
  const p = action.parameters
  let next: PlasticSeparationState = state
  const resourceDelta: ResourceDelta = { ...EMPTY_DELTA, reagents: {} }
  let calculationTrace: SimulationResult<PlasticSeparationState>['calculationTrace'] = []

  switch (action.actionType) {
    case 'prepare_samples': {
      next = {
        ...state,
        stage: 'preparation',
        samplesPrepared: true,
      }
      break
    }

    case 'load_and_wet': {
      next = {
        ...state,
        stage: 'wetting',
        tankLoaded: true,
        wetted: true,
      }
      // 800 L is the tank's useful volume in the study, not a reported water
      // consumption measurement. Keep resource accounting at zero rather than
      // presenting tank capacity as an amount consumed by this attempt.
      calculationTrace = [
        {
          equationKey: 'plastic.pilot_tank.wetting',
          inputs: {
            volumeLiters: PLASTIC_PROFILE.pilotTankVolumeLiters,
            stirringRpm: PLASTIC_PROFILE.wettingStirringRpm,
            durationHours: PLASTIC_PROFILE.wettingDurationHours,
          },
          outputs: { wettedStatus: 1 },
          sourceKeys: [PLASTIC_PROFILE.sourceDoi],
        },
      ]
      break
    }

    case 'separate_water': {
      const outcome = OUTCOMES.water
      next = {
        ...state,
        stage: 'water_separation',
        waterSeparated: true,
        lastOutcome: outcome,
        outcomesHistory: [...state.outcomesHistory, outcome],
      }
      calculationTrace = [
        {
          equationKey: 'plastic.density.water_separation',
          inputs: {
            floatingPolymers: 'PP,HDPE',
            sinkingPolymers: 'PS,ABS,PA,PC',
          },
          outputs: { lightGroupRecoveryPercent: 97.5 },
          sourceKeys: [PLASTIC_PROFILE.sourceDoi],
        },
      ]
      break
    }

    case 'centrifuge_and_weigh': {
      const nextStage = state.stage === 'water_separation'
        ? 'branch_selection'
        : state.centrifugationReturnStage ?? (state.activeBranch === 'light' ? 'ethanol_branch' : 'nacl_branch')
      next = {
        ...state,
        stage: nextStage,
        centrifuged: true,
        pendingCentrifugation: false,
        centrifugationReturnStage: null,
      }
      calculationTrace = [
        {
          equationKey: 'plastic.centrifugation.dewatering',
          inputs: {
            centrifugeRpm: PLASTIC_PROFILE.centrifugeRpm,
          },
          outputs: { dewatered: 1 },
          sourceKeys: [PLASTIC_PROFILE.sourceDoi],
        },
      ]
      break
    }

    case 'select_branch': {
      const branch = p.branch as SeparationBranch
      next = {
        ...state,
        activeBranch: branch,
        stage: branch === 'light' ? 'ethanol_branch' : 'nacl_branch',
      }
      break
    }

    case 'run_ethanol_preset': {
      const conc = Number(p.concentration)
      const kind: SeparationKind = conc === 23 ? 'ethanol_23' : 'ethanol_31'
      const outcome = OUTCOMES[kind]
      const newProgress = conc === 23 ? (1 as const) : (2 as const)
      const completedBranches = conc === 31
        ? state.completedBranches.includes('light')
          ? state.completedBranches
          : [...state.completedBranches, 'light' as const]
        : state.completedBranches

      const newFractions: FractionCollection[] = [...state.collectedFractions]
      if (conc === 23) {
        newFractions.push({
          fractionId: `frac-pp-${sequence}`,
          polymerId: 'PP',
          mediumUsed: 'Ethanol 23% v/v',
          stageKind: 'ethanol_23',
          behavior: 'floating',
          reportedRecoveryPercent: 95.6,
        })
      } else {
        newFractions.push({
          fractionId: `frac-hdpe-${sequence}`,
          polymerId: 'HDPE',
          mediumUsed: 'Ethanol 31% v/v',
          stageKind: 'ethanol_31',
          behavior: 'sinking',
          reportedRecoveryPercent: 99.7,
        })
      }

      next = {
        ...state,
        stage: 'centrifugation',
        pendingCentrifugation: true,
        centrifugationReturnStage: 'ethanol_branch',
        ethanolProgress: newProgress,
        completedBranches,
        lastOutcome: outcome,
        outcomesHistory: [...state.outcomesHistory, outcome],
        collectedFractions: newFractions,
      }

      calculationTrace = [
        {
          equationKey: `plastic.ethanol.${conc}pct`,
          inputs: { concentrationPercentVv: conc },
          outputs: conc === 23 ? { ppRecovery: 95.6 } : { hdpeRecovery: 99.7 },
          sourceKeys: [PLASTIC_PROFILE.sourceDoi],
        },
      ]
      break
    }

    case 'run_nacl_preset': {
      const concRaw = p.concentration
      const concNum = typeof concRaw === 'string' ? parseFloat(concRaw.replace(',', '.')) : Number(concRaw)
      const is11_12 = concRaw === '11-12' || concNum === 11.5 || concNum === 11 || concNum === 12
      const is20 = concNum === 20
      const is40 = concNum === 40

      let kind: SeparationKind = 'nacl_11_12'
      let newProgress: 1 | 2 | 3 = 1
      const newFractions: FractionCollection[] = [...state.collectedFractions]

      if (is11_12) {
        kind = 'nacl_11_12'
        newProgress = 1
        newFractions.push({
          fractionId: `frac-ps-${sequence}`,
          polymerId: 'PS',
          mediumUsed: 'NaCl 11–12% w/v',
          stageKind: 'nacl_11_12',
          behavior: 'floating',
          reportedRecoveryPercent: 80.3,
        })
      } else if (is20) {
        kind = 'nacl_20'
        newProgress = 2
        newFractions.push({
          fractionId: `frac-abs-${sequence}`,
          polymerId: 'ABS',
          mediumUsed: 'NaCl 20% w/v',
          stageKind: 'nacl_20',
          behavior: 'floating',
          reportedRecoveryPercent: 84.8,
        })
      } else if (is40) {
        kind = 'nacl_40'
        newProgress = 3
        newFractions.push(
          {
            fractionId: `frac-pa-${sequence}`,
            polymerId: 'PA',
            mediumUsed: 'NaCl 40% w/v',
            stageKind: 'nacl_40',
            behavior: 'floating',
            reportedRecoveryPercent: 70.0,
          },
          {
            fractionId: `frac-pc-${sequence}`,
            polymerId: 'PC',
            mediumUsed: 'NaCl 40% w/v',
            stageKind: 'nacl_40',
            behavior: 'sinking',
            reportedRecoveryPercent: 95.4,
          },
        )
      }

      const outcome = OUTCOMES[kind]
      const completedBranches = newProgress === 3
        ? state.completedBranches.includes('heavy')
          ? state.completedBranches
          : [...state.completedBranches, 'heavy' as const]
        : state.completedBranches

      next = {
        ...state,
        stage: 'centrifugation',
        pendingCentrifugation: true,
        centrifugationReturnStage: 'nacl_branch',
        naclProgress: newProgress,
        completedBranches,
        lastOutcome: outcome,
        outcomesHistory: [...state.outcomesHistory, outcome],
        collectedFractions: newFractions,
      }

      calculationTrace = [
        {
          equationKey: `plastic.nacl.${kind}`,
          inputs: { preset: kind },
          outputs: outcome.reportedRecoveries,
          sourceKeys: [PLASTIC_PROFILE.sourceDoi],
        },
      ]
      break
    }

    case 'summarize_fractions': {
      next = {
        ...state,
        stage: 'summary',
      }
      break
    }

    case 'complete': {
      next = {
        ...state,
        stage: 'completed',
      }
      break
    }
  }

  return {
    nextState: { ...next, revision: state.revision + 1 },
    observations: [],
    calculationTrace,
    warnings: [],
    resourceDelta,
  }
}

function evaluatePlasticGoal(
  state: PlasticSeparationState,
  _resources: ResourceLedger,
): GoalStatus {
  if (state.stage !== 'completed') {
    return {
      evaluable: false,
      goalMet: false,
      primaryCriteria: [],
      efficiencyCriteria: [],
      achievementPercent: 0,
    }
  }

  const lightCompleted = state.completedBranches.includes('light')
  const heavyCompleted = state.completedBranches.includes('heavy')
  const allBranchesCompleted = lightCompleted && heavyCompleted

  const primaryCriteria = [
    {
      key: 'plastic.light_fraction.completed',
      evaluable: true,
      met: lightCompleted,
      actual: lightCompleted ? 1 : 0,
      target: 1,
      unit: 'branch',
    },
    {
      key: 'plastic.heavy_fraction.completed',
      evaluable: true,
      met: heavyCompleted,
      actual: heavyCompleted ? 1 : 0,
      target: 1,
      unit: 'branch',
    },
  ]

  const efficiencyCriteria = [
    {
      key: 'plastic.all_fractions_recovered',
      evaluable: true,
      met: allBranchesCompleted,
      actual: allBranchesCompleted ? 6 : lightCompleted ? 2 : heavyCompleted ? 4 : 0,
      target: 6,
      unit: 'polymers',
    },
  ]

  const achievementPercent = allBranchesCompleted ? 100 : lightCompleted || heavyCompleted ? 50 : 0

  return {
    evaluable: true,
    goalMet: allBranchesCompleted,
    primaryCriteria,
    efficiencyCriteria,
    achievementPercent,
  }
}

export function createPlasticSeparationModule(): DomainModule<PlasticSeparationState> {
  return {
    manifest: {
      scenarioKey: 'plastic-separation',
      releaseId: PLASTIC_PROFILE.releaseId,
      modelSpecVersion: PLASTIC_PROFILE.modelSpecVersion,
      scoringVersion: PLASTIC_PROFILE.scoringVersion,
      stateSchemaVersion: PLASTIC_PROFILE.version,
      contentVersion: PLASTIC_PROFILE.version,
      evidenceRegisterVersion: PLASTIC_PROFILE.version,
      projectionVersion: 1,
    },
    createInitialState: createInitialPlasticState,
    actionTypes: PLASTIC_ACTION_TYPES,
    parameterQuantities: {
      concentration: 'concentration',
    },
    validateAction(context: SimulationContext<PlasticSeparationState>, action: SimulationAction) {
      return validatePlasticAction(context.state, action)
    },
    run(context: SimulationContext<PlasticSeparationState>, action: SimulationAction) {
      const error = validatePlasticAction(context.state, action)
      if (error !== null) return error
      return transition(context.state, action, context.sequence)
    },
    evaluateGoalStatus: evaluatePlasticGoal,
  }
}
