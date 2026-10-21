/**
 * Domain model and contracts for Virgin Plastic Density Separation.
 *
 * Source: Meneses Quelal, Velázquez-Martí & Ferrer Gisbert (2022),
 * "Separation of virgin and post-consumer plastics by density methods",
 * Environmental Science and Pollution Research, DOI 10.1007/s11356-021-15611-w.
 *
 * All polymer densities, pilot conditions (800 L, 160 rpm, 2.950 rpm, 2.0 kg/sample)
 * and recovery percentages are transcribed directly from the paper.
 * Ethanol recovery labels follow Results text and Figure 6.
 */

export const PLASTIC_PROFILE = {
  id: 'meneses-quelal-2022-virgin-separation',
  version: '0.2.0',
  releaseId: 'plastic-separation@0.2.0',
  modelSpecVersion: 'meneses-quelal-2022-virgin-separation',
  scoringVersion: '0.2.0',
  sourceDoi: '10.1007/s11356-021-15611-w',
  pilotTankVolumeLiters: 800,
  wettingStirringRpm: 160,
  wettingDurationHours: 1,
  centrifugeRpm: 2950,
  sampleFeedMassKg: 2.0,
  totalPolymerTypes: 6,
} as const

export type PlasticProfile = typeof PLASTIC_PROFILE

export const VIRGIN_POLYMERS = [
  {
    id: 'PP',
    name: 'Polypropylene',
    densityGPerCm3: 0.91,
    nominalDensity: '0,910 g/cm³',
    formVi: 'Dạng hạt (pellets)',
    sizeRangeMm: '2,0 – 3,36 mm',
    colorHex: '#eab308', // Amber/Yellow
    strokeHex: '#a16207',
    particleShape: 'pellet',
  },
  {
    id: 'HDPE',
    name: 'Polyethylene mật độ cao (High-Density Polyethylene)',
    densityGPerCm3: 0.953,
    nominalDensity: '0,953 g/cm³',
    formVi: 'Dạng hạt (pellets)',
    sizeRangeMm: '2,0 – 3,36 mm',
    colorHex: '#22c55e', // Green
    strokeHex: '#15803d',
    particleShape: 'pellet',
  },
  {
    id: 'PS',
    name: 'Polystyrene',
    densityGPerCm3: 1.04,
    nominalDensity: '1,040 g/cm³',
    formVi: 'Hình cầu trắng trong (spheres)',
    sizeRangeMm: '2,0 – 3,0 mm',
    colorHex: '#06b6d4', // Cyan
    strokeHex: '#0e7490',
    particleShape: 'sphere',
  },
  {
    id: 'ABS',
    name: 'Acrylonitrile Butadiene Styrene',
    densityGPerCm3: 1.07,
    nominalDensity: '1,070 g/cm³',
    formVi: 'Hình cầu vàng nhạt (spheres)',
    sizeRangeMm: '2,0 – 3,0 mm',
    colorHex: '#f97316', // Orange
    strokeHex: '#c2410c',
    particleShape: 'sphere',
  },
  {
    id: 'PA',
    name: 'Polyamide',
    densityGPerCm3: 1.14,
    nominalDensity: '1,140 g/cm³',
    formVi: 'Hạt chữ nhật trắng (rectangular granules)',
    sizeRangeMm: '2,0 – 3,5 mm',
    colorHex: '#a855f7', // Purple
    strokeHex: '#7e22ce',
    particleShape: 'rectangle',
  },
  {
    id: 'PC',
    name: 'Polycarbonate',
    densityGPerCm3: 1.2,
    nominalDensity: '1,200 g/cm³',
    formVi: 'Hình trụ trắng trong (cylinders)',
    sizeRangeMm: '2,0 – 3,5 mm',
    colorHex: '#3b82f6', // Blue
    strokeHex: '#1d4ed8',
    particleShape: 'cylinder',
  },
] as const

export type PolymerId = (typeof VIRGIN_POLYMERS)[number]['id']

const POLYMER_IDS: readonly PolymerId[] = VIRGIN_POLYMERS.map((p) => p.id)

export function isPolymerId(value: unknown): value is PolymerId {
  return typeof value === 'string' && (POLYMER_IDS as readonly string[]).includes(value)
}

export type ProcessStage =
  | 'preparation' // Stage 0: 6 virgin polymers displayed with specifications
  | 'wetting' // Stage 1: Loaded into 800L pilot tank with tap water, stirring at 160 rpm
  | 'water_separation' // Stage 2: Separation in water (PP+HDPE float, PS+ABS+PA+PC sink)
  | 'centrifugation' // Stage 3: Centrifuged at 2,950 rpm and weighed
  | 'branch_selection' // Stage 4: Ready to choose branch (Light vs Heavy)
  | 'ethanol_branch' // Stage 5A: Ethanol separation presets (23% and 31% v/v)
  | 'nacl_branch' // Stage 5B: NaCl separation presets (11-12%, 20%, 40% w/v)
  | 'summary' // Stage 6: Summary of all separated fractions
  | 'completed' // Complete attempt

export type SeparationBranch = 'light' | 'heavy'

export type SeparationKind =
  | 'water'
  | 'ethanol_23'
  | 'ethanol_31'
  | 'nacl_11_12'
  | 'nacl_20'
  | 'nacl_40'

export type SeparationOutcome = {
  kind: SeparationKind
  titleVi: string
  mediumVi: string
  floating: readonly PolymerId[]
  sinking: readonly PolymerId[]
  recoveryTextVi: readonly string[]
  reportedRecoveries: Readonly<Partial<Record<PolymerId | 'PP_HDPE_GROUP', number>>>
  scientificNoteVi: string
}

export const OUTCOMES: Record<SeparationKind, SeparationOutcome> = {
  water: {
    kind: 'water',
    titleVi: 'Tách sơ bộ bằng nước máy',
    mediumVi: 'Nước máy',
    floating: ['PP', 'HDPE'],
    sinking: ['PS', 'ABS', 'PA', 'PC'],
    recoveryTextVi: ['Thu hồi nhóm nhẹ PP + HDPE: 97,5%'],
    reportedRecoveries: { PP_HDPE_GROUP: 97.5 },
    scientificNoteVi:
      'Bài báo ghi nhận PP và HDPE ở phân đoạn nổi; PS, ABS, PA và PC ở phân đoạn chìm. Thu hồi nhóm PP + HDPE được báo cáo là 97,5%.',
  },
  ethanol_23: {
    kind: 'ethanol_23',
    titleVi: 'Phân loại nhóm nhẹ bằng Ethanol 23% v/v',
    mediumVi: 'Ethanol 23% v/v',
    floating: ['PP'],
    sinking: ['HDPE'],
    recoveryTextVi: ['Thu hồi PP: 95,60%'],
    reportedRecoveries: { PP: 95.6 },
    scientificNoteVi:
      'Tại nồng độ 23% v/v, PP bắt đầu tách khỏi HDPE; PP nổi lên bề mặt trong khi HDPE chìm (theo phần Results và Hình 6).',
  },
  ethanol_31: {
    kind: 'ethanol_31',
    titleVi: 'Phân loại hoàn toàn bằng Ethanol 31% v/v',
    mediumVi: 'Ethanol 31% v/v',
    floating: ['PP'],
    sinking: ['HDPE'],
    recoveryTextVi: ['Tách hoàn toàn PP và HDPE', 'Thu hồi HDPE: 99,70%'],
    reportedRecoveries: { HDPE: 99.7 },
    scientificNoteVi:
      'Tại 31% v/v, dung dịch đạt sự phân tách hoàn toàn giữa hai polyolefin; HDPE đạt độ thu hồi 99,70% (theo phần Results và Hình 6).',
  },
  nacl_11_12: {
    kind: 'nacl_11_12',
    titleVi: 'Tách Polystyrene (PS) bằng NaCl 11–12% w/v',
    mediumVi: 'NaCl 11–12% w/v',
    floating: ['PS'],
    sinking: ['ABS', 'PA', 'PC'],
    recoveryTextVi: ['Thu hồi PS: 80,3%'],
    reportedRecoveries: { PS: 80.3 },
    scientificNoteVi:
      'Ở preset NaCl 11–12% w/v, bài báo ghi nhận PS ở phân đoạn nổi; ABS, PA và PC ở phân đoạn chìm.',
  },
  nacl_20: {
    kind: 'nacl_20',
    titleVi: 'Tách ABS bằng NaCl 20% w/v',
    mediumVi: 'NaCl 20% w/v',
    floating: ['ABS'],
    sinking: ['PA', 'PC'],
    recoveryTextVi: ['Thu hồi ABS: 84,8%'],
    reportedRecoveries: { ABS: 84.8 },
    scientificNoteVi:
      'Ở preset NaCl 20% w/v, bài báo ghi nhận ABS ở phân đoạn nổi; PA và PC ở phân đoạn chìm.',
  },
  nacl_40: {
    kind: 'nacl_40',
    titleVi: 'Tách Polyamide và Polycarbonate bằng NaCl 40% w/v',
    mediumVi: 'NaCl 40% w/v',
    floating: ['PA'],
    sinking: ['PC'],
    recoveryTextVi: ['Thu hồi PA: 70,0%', 'Thu hồi PC: 95,4%'],
    reportedRecoveries: { PA: 70.0, PC: 95.4 },
    scientificNoteVi:
      'Ở preset NaCl 40% w/v, bài báo ghi nhận PA ở phân đoạn nổi (thu hồi 70,0%) và PC ở phân đoạn chìm (thu hồi 95,4%).',
  },
}

export type FractionCollection = {
  fractionId: string
  polymerId: PolymerId
  mediumUsed: string
  stageKind: SeparationKind
  behavior: 'floating' | 'sinking'
  reportedRecoveryPercent: number | null
}

export type PlasticSeparationState = {
  profileId: string
  profileVersion: string
  revision: number
  stage: ProcessStage
  samplesPrepared: boolean
  tankLoaded: boolean
  wetted: boolean
  waterSeparated: boolean
  centrifuged: boolean
  pendingCentrifugation: boolean
  centrifugationReturnStage: 'branch_selection' | 'ethanol_branch' | 'nacl_branch' | null
  activeBranch: SeparationBranch | null
  ethanolProgress: 0 | 1 | 2 // 0: none, 1: 23%, 2: 31%
  naclProgress: 0 | 1 | 2 | 3 // 0: none, 1: 11-12%, 2: 20%, 3: 40%
  completedBranches: readonly SeparationBranch[]
  lastOutcome: SeparationOutcome | null
  outcomesHistory: readonly SeparationOutcome[]
  collectedFractions: readonly FractionCollection[]
}

export function createInitialPlasticState(): PlasticSeparationState {
  return {
    profileId: PLASTIC_PROFILE.id,
    profileVersion: PLASTIC_PROFILE.version,
    revision: 0,
    stage: 'preparation',
    samplesPrepared: false,
    tankLoaded: false,
    wetted: false,
    waterSeparated: false,
    centrifuged: false,
    pendingCentrifugation: false,
    centrifugationReturnStage: null,
    activeBranch: null,
    ethanolProgress: 0,
    naclProgress: 0,
    completedBranches: [],
    lastOutcome: null,
    outcomesHistory: [],
    collectedFractions: [],
  }
}

export const PLASTIC_ACTION_TYPES = [
  'prepare_samples',
  'load_and_wet',
  'separate_water',
  'centrifuge_and_weigh',
  'select_branch',
  'run_ethanol_preset',
  'run_nacl_preset',
  'summarize_fractions',
  'complete',
] as const

export type PlasticActionType = (typeof PLASTIC_ACTION_TYPES)[number]

