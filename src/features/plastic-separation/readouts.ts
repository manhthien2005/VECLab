import type { PlasticProjection } from '@/application/scenarios/plastic-projection.js'
import type { PolymerId } from '@/domain/experiments/virgin-plastic-separation/model.js'

/** Only completed weighing steps may expose derived mass, including after resume. */
export function plasticFractionReadout(projection: PlasticProjection, id: PolymerId, feedMassKg: number) {
  const fraction = projection.collectedFractions.find(value => value.polymerId === id)
  if (!fraction || (projection.pendingCentrifugation && fraction.stageKind === projection.lastOutcome?.kind)) return null
  const recovery = fraction.reportedRecoveryPercent
  return { fraction, recovery, massKg: recovery === null ? null : feedMassKg * recovery / 100 }
}

export function plasticSubmissionChecks(projection: PlasticProjection) {
  return [
    { label: 'Chuẩn bị và làm ướt sáu mẫu', done: projection.samplesPrepared && projection.wetted },
    { label: 'Tách sơ bộ trong nước và ghi nhận ly tâm', done: projection.waterSeparated && projection.centrifuged },
    { label: 'Hoàn thành nhánh ethanol · 23 và 31% v/v', done: projection.completedBranches.includes('light') },
    { label: 'Hoàn thành nhánh NaCl · 11–12, 20 và 40% w/v', done: projection.completedBranches.includes('heavy') },
    { label: 'Ghi nhận các phân đoạn và xem tổng kết', done: !projection.pendingCentrifugation && projection.stage === 'summary' },
  ]
}

export function plasticStageLabel(stage: PlasticProjection['stage']): string {
  return ({ preparation: 'Chuẩn bị mẫu', wetting: 'Làm ướt mẫu', water_separation: 'Tách sơ bộ trong nước', centrifugation: 'Ly tâm và cân', branch_selection: 'Chọn nhánh dung dịch', ethanol_branch: 'Nhánh ethanol', nacl_branch: 'Nhánh NaCl', summary: 'Tổng kết', completed: 'Đã nộp bài' })[stage]
}

export const PLASTIC_WORKBENCH_STEPS = [
  { id: 'prepare', label: 'Chuẩn bị mẫu', icon: 'prepare' },
  { id: 'water', label: 'Tách trong nước', icon: 'program' },
  { id: 'weigh', label: 'Ly tâm & cân', icon: 'results' },
  { id: 'separate', label: 'Tách theo dung dịch', icon: 'dose' },
  { id: 'summary', label: 'Tổng kết', icon: 'results' },
] as const

export type PlasticControlGroup = typeof PLASTIC_WORKBENCH_STEPS[number]['id']
/** One presentation of the saved state for both the scene and its controls. */
export function plasticWorkbenchContext(p: PlasticProjection) {
  let group: PlasticControlGroup
  let next: string
  if (p.stage === 'completed') { group = 'summary'; next = 'Xem sổ thực hành hoặc báo cáo đã lưu.' }
  else if (p.stage === 'summary') { group = 'summary'; next = 'Đối chiếu sổ thực hành, rồi kiểm tra và nộp bài.' }
  else if (!p.wetted) { group = 'prepare'; next = p.samplesPrepared ? 'Nạp mẫu và ghi nhận bước làm ướt.' : 'Chuẩn bị sáu mẫu nhựa, mỗi loại 2,0 kg.' }
  else if (!p.waterSeparated) { group = 'water'; next = 'Ghi nhận bước tách sơ bộ trong nước.' }
  else if (!p.centrifuged || p.pendingCentrifugation) {
    group = 'weigh'
    next = 'Ghi nhận ly tâm và cân phân đoạn vừa tách.'
  }
  else if (p.completedBranches.length === 2) { group = 'summary'; next = 'Xem tổng kết các phân đoạn đã ghi nhận.' }
  else {
    group = 'separate'
    next = p.activeBranch && !p.completedBranches.includes(p.activeBranch)
      ? `Tiếp tục nhánh ${p.activeBranch === 'light' ? 'ethanol' : 'NaCl'}; ly tâm và cân sau mỗi mức nồng độ.`
      : p.completedBranches.length ? 'Chọn nhánh còn lại để tiếp tục.' : 'Chọn một nhánh dung dịch để bắt đầu. Cần hoàn thành cả hai nhánh.'
  }
  const activeMedium = p.activeBranch === 'light' ? 'ethanol' : p.activeBranch === 'heavy' ? 'nacl' : null
  const outcomeMatchesBranch = activeMedium && p.lastOutcome?.kind.startsWith(activeMedium)
  const medium = activeMedium
    ? outcomeMatchesBranch ? p.lastOutcome!.mediumVi : `${p.activeBranch === 'light' ? 'Ethanol' : 'NaCl'} · chưa chạy mức nồng độ`
    : p.lastOutcome?.mediumVi ?? (p.wetted ? 'Nước máy' : 'Chưa nạp môi trường')

  return { group, next, medium, label: PLASTIC_WORKBENCH_STEPS.find(step => step.id === group)!.label }
}

export function plasticWeighingLabel(p: PlasticProjection): string {
  if (p.pendingCentrifugation || p.weighedMassKg === null) return 'Chưa ghi nhận'
  const format = (mass: number) => '≈ ' + mass.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 3 }) + ' kg'
  const fractions = Object.entries(p.weighedFractions)
  if (fractions.length > 1) return fractions.map(([id, value]) => id + ' ' + format(value!.massKg)).join(' · ')
  return format(p.weighedMassKg)
}
