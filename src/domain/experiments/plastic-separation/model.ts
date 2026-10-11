/**
 * Deterministic sink-float model for the virgin-polymer workflow.
 * The stage outcomes and recoveries are transcribed from the Results section
 * of Meneses Quelal et al. (2022), with the ethanol recovery labels following
 * the results text and Fig. 6 rather than the swapped labels in the conclusion.
 */

export const PLASTIC_TYPES = [
  { id: 'PP', name: 'Polypropylene', density: 0.91, color: '#facc15', stroke: '#a16207' },
  { id: 'HDPE', name: 'Polyethylene mật độ cao', density: 0.953, color: '#4ade80', stroke: '#15803d' },
  { id: 'PS', name: 'Polystyrene', density: 1.04, color: '#22d3ee', stroke: '#0e7490' },
  { id: 'ABS', name: 'Acrylonitrile butadiene styrene', density: 1.07, color: '#fb923c', stroke: '#c2410c' },
  { id: 'PA', name: 'Polyamide', density: 1.14, color: '#c084fc', stroke: '#7e22ce' },
  { id: 'PC', name: 'Polycarbonate', density: 1.2, color: '#60a5fa', stroke: '#1d4ed8' },
] as const

export type PolymerId = (typeof PLASTIC_TYPES)[number]['id']
export type SeparationBranch = 'polyolefins' | 'high-density'
export type SeparationKind = 'water' | 'ethanol-23' | 'ethanol-31' | 'nacl-11-12' | 'nacl-20' | 'nacl-40'

export type SeparationOutcome = {
  kind: SeparationKind
  title: string
  medium: string
  floating: readonly PolymerId[]
  sinking: readonly PolymerId[]
  recovery: readonly string[]
  note: string
}

export type PlasticSeparationState = {
  waterSeparated: boolean
  activeBranch: SeparationBranch | null
  ethanolProgress: 0 | 1 | 2
  saltProgress: 0 | 1 | 2 | 3
  lastOutcome: SeparationOutcome | null
  outcomes: readonly SeparationOutcome[]
}

export type PlasticSeparationAction =
  | { type: 'separate-water' }
  | { type: 'select-branch'; branch: SeparationBranch }
  | { type: 'separate-ethanol-23' }
  | { type: 'separate-ethanol-31' }
  | { type: 'separate-nacl-11-12' }
  | { type: 'separate-nacl-20' }
  | { type: 'separate-nacl-40' }
  | { type: 'reset' }

export const INITIAL_PLASTIC_STATE: PlasticSeparationState = {
  waterSeparated: false,
  activeBranch: null,
  ethanolProgress: 0,
  saltProgress: 0,
  lastOutcome: null,
  outcomes: [],
}

const OUTCOMES: Record<SeparationKind, SeparationOutcome> = {
  water: {
    kind: 'water',
    title: 'Tách sơ bộ bằng nước',
    medium: 'Nước máy',
    floating: ['PP', 'HDPE'],
    sinking: ['PS', 'ABS', 'PA', 'PC'],
    recovery: ['Thu hồi nhóm PP + HDPE: 97,5%'],
    note: 'Nhóm nhẹ nổi lên; nhóm có khối lượng riêng lớn hơn nước lắng xuống đáy.',
  },
  'ethanol-23': {
    kind: 'ethanol-23',
    title: 'Tách nhóm PP + HDPE',
    medium: 'Ethanol 23% v/v',
    floating: ['PP'],
    sinking: ['HDPE'],
    recovery: ['Thu hồi PP: 95,60%'],
    note: 'PP bắt đầu tách khỏi HDPE; các hạt PP nổi và HDPE chìm.',
  },
  'ethanol-31': {
    kind: 'ethanol-31',
    title: 'Tăng nồng độ ethanol',
    medium: 'Ethanol 31% v/v',
    floating: ['PP'],
    sinking: ['HDPE'],
    recovery: ['Tách PP và HDPE hoàn toàn', 'Thu hồi HDPE: 99,70%'],
    note: 'PP nổi hoàn toàn; HDPE chìm xuống dưới.',
  },
  'nacl-11-12': {
    kind: 'nacl-11-12',
    title: 'Tách nhóm PS + ABS + PA + PC',
    medium: 'NaCl 11–12% w/v',
    floating: ['PS'],
    sinking: ['ABS', 'PA', 'PC'],
    recovery: ['Thu hồi PS: 80,3%'],
    note: 'PS nổi; ABS, PA và PC tiếp tục chìm.',
  },
  'nacl-20': {
    kind: 'nacl-20',
    title: 'Tăng nồng độ NaCl',
    medium: 'NaCl 20% w/v',
    floating: ['ABS'],
    sinking: ['PA', 'PC'],
    recovery: ['Thu hồi ABS: 84,8%'],
    note: 'ABS nổi; PA và PC vẫn chìm.',
  },
  'nacl-40': {
    kind: 'nacl-40',
    title: 'Tăng nồng độ NaCl lần cuối',
    medium: 'NaCl 40% w/v',
    floating: ['PA'],
    sinking: ['PC'],
    recovery: ['Thu hồi PA: 70%', 'Thu hồi PC: 95,4%'],
    note: 'PA nổi; PC chìm xuống đáy.',
  },
}

const DENSE_POLYMERS: readonly PolymerId[] = ['PS', 'ABS', 'PA', 'PC']

export function applyPlasticAction(
  state: PlasticSeparationState,
  action: PlasticSeparationAction,
): PlasticSeparationState {
  if (action.type === 'reset') return INITIAL_PLASTIC_STATE

  if (action.type === 'separate-water') {
    if (state.waterSeparated) return state
    return {
      ...state,
      waterSeparated: true,
      lastOutcome: OUTCOMES.water,
      outcomes: [...state.outcomes, OUTCOMES.water],
    }
  }

  if (!state.waterSeparated) return state

  if (action.type === 'select-branch') {
    return { ...state, activeBranch: action.branch, lastOutcome: null }
  }

  if (action.type === 'separate-ethanol-23') {
    if (state.activeBranch !== 'polyolefins' || state.ethanolProgress !== 0) return state
    return {
      ...state,
      ethanolProgress: 1,
      lastOutcome: OUTCOMES['ethanol-23'],
      outcomes: [...state.outcomes, OUTCOMES['ethanol-23']],
    }
  }

  if (action.type === 'separate-ethanol-31') {
    if (state.activeBranch !== 'polyolefins' || state.ethanolProgress !== 1) return state
    return {
      ...state,
      ethanolProgress: 2,
      lastOutcome: OUTCOMES['ethanol-31'],
      outcomes: [...state.outcomes, OUTCOMES['ethanol-31']],
    }
  }

  if (action.type === 'separate-nacl-11-12') {
    if (state.activeBranch !== 'high-density' || state.saltProgress !== 0) return state
    return {
      ...state,
      saltProgress: 1,
      lastOutcome: OUTCOMES['nacl-11-12'],
      outcomes: [...state.outcomes, OUTCOMES['nacl-11-12']],
    }
  }

  if (action.type === 'separate-nacl-20') {
    if (state.activeBranch !== 'high-density' || state.saltProgress !== 1) return state
    return {
      ...state,
      saltProgress: 2,
      lastOutcome: OUTCOMES['nacl-20'],
      outcomes: [...state.outcomes, OUTCOMES['nacl-20']],
    }
  }

  if (action.type === 'separate-nacl-40') {
    if (state.activeBranch !== 'high-density' || state.saltProgress !== 2) return state
    return {
      ...state,
      saltProgress: 3,
      lastOutcome: OUTCOMES['nacl-40'],
      outcomes: [...state.outcomes, OUTCOMES['nacl-40']],
    }
  }

  return state
}

export function positionForPolymer(
  id: PolymerId,
  state: PlasticSeparationState,
): number {
  const index = PLASTIC_TYPES.findIndex((polymer) => polymer.id === id)
  if (!state.waterSeparated) return 88 + index * 29

  if (state.lastOutcome === null) {
    if (state.activeBranch === 'polyolefins') {
      if (id === 'PP') return 110
      if (id === 'HDPE') return 146
      return 300
    }
    if (state.activeBranch === 'high-density') {
      const denseIndex = DENSE_POLYMERS.indexOf(id)
      return denseIndex < 0 ? 300 : 90 + denseIndex * 34
    }
    if (id === 'PP') return 48
    if (id === 'HDPE') return 61
    return 135 + DENSE_POLYMERS.indexOf(id) * 28
  }

  const { floating, sinking } = state.lastOutcome
  if (state.activeBranch !== null) {
    const branchTypes: readonly PolymerId[] = state.activeBranch === 'polyolefins'
      ? ['PP', 'HDPE']
      : DENSE_POLYMERS
    if (!branchTypes.includes(id)) return 300
  }
  if (floating.includes(id)) return 48 + floating.indexOf(id) * 18
  if (sinking.includes(id)) return 136 + sinking.indexOf(id) * 26
  return 300
}

export function selectedBranchLabel(branch: SeparationBranch | null): string {
  return branch === 'polyolefins' ? 'PP + HDPE' : branch === 'high-density' ? 'PS + ABS + PA + PC' : 'Toàn bộ mẫu'
}

export function nextActionLabel(state: PlasticSeparationState): string | null {
  if (!state.waterSeparated) return 'Tách bằng nước'
  if (state.activeBranch === 'polyolefins') {
    if (state.ethanolProgress === 0) return 'Thêm ethanol 23% v/v'
    if (state.ethanolProgress === 1) return 'Nâng ethanol lên 31% v/v'
    return null
  }
  if (state.activeBranch === 'high-density') {
    if (state.saltProgress === 0) return 'Thêm NaCl 11–12% w/v'
    if (state.saltProgress === 1) return 'Nâng NaCl lên 20% w/v'
    if (state.saltProgress === 2) return 'Nâng NaCl lên 40% w/v'
  }
  return null
}
