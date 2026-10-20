import type { PlasticProjection } from '@/application/scenarios/plastic-projection.js'
import { VIRGIN_POLYMERS, type PolymerId } from '@/domain/experiments/virgin-plastic-separation/model.js'

export type PlasticScene = 'samples' | 'tank' | 'weigh' | 'fractions'
export type PlasticMotion = { key: string; actionType: string; previous: PlasticProjection; playing: boolean }

/** Explanatory scene time, never simulated process time or a control lock. */
export const PLASTIC_MOTION_MS: Record<string, number> = {
  prepare_samples: 900, load_and_wet: 3000, separate_water: 2800,
  select_branch: 700, run_ethanol_preset: 2800, run_nacl_preset: 2800,
  centrifuge_and_weigh: 3200, summarize_fractions: 900,
}

export function plasticSceneFor(p: PlasticProjection, actionType?: string): PlasticScene {
  if (p.stage === 'summary' || p.stage === 'completed' || actionType === 'summarize_fractions') return 'fractions'
  if (actionType === 'prepare_samples' || !p.wetted) return 'samples'
  if (actionType === 'centrifuge_and_weigh' || !actionType && p.stage === 'branch_selection') return 'weigh'
  return 'tank'
}

export type PlasticParticlePoint = { id: PolymerId; index: number; x: number; y: number; location: string }

/** Fixed illustrative positions from the public outcome; no particle physics or randomness. */
export function plasticTankParticles(p: PlasticProjection): PlasticParticlePoint[] {
  if (!p.wetted) return []
  const branchPrefix = p.activeBranch === 'light' ? 'ethanol' : p.activeBranch === 'heavy' ? 'nacl' : null
  if (branchPrefix && !p.lastOutcome?.kind.startsWith(branchPrefix)) return []
  const outcome = p.lastOutcome
  const ids = outcome ? VIRGIN_POLYMERS.filter(polymer => outcome.floating.includes(polymer.id) || outcome.sinking.includes(polymer.id)).map(polymer => polymer.id) : VIRGIN_POLYMERS.map(polymer => polymer.id)
  return ids.flatMap((id, groupIndex) => Array.from({ length: 8 }, (_, index) => {
    const mixedSlot = index * ids.length + groupIndex
    if (!outcome) return { id, index, x: 182 + (mixedSlot % 8) * 32 + ((groupIndex * 3 + index * 7) % 9) - 4, y: 174 + Math.floor(mixedSlot / 8) * 21 + ((groupIndex * 5 + index * 3) % 7) - 3, location: 'mixing' }
    const floats = outcome.floating.includes(id)
    const band = floats ? outcome.floating : outcome.sinking
    const slot = band.indexOf(id) * 8 + index
    return { id, index, x: 179 + (slot % 12) * 21, y: (floats ? 149 : 280) + Math.floor(slot / 12) * 11, location: floats ? 'floating' : 'sinking' }
  }))
}

export const PLASTIC_SCENE_EXPLANATIONS: Record<string, string> = {
  prepare_samples: 'Sáu mẫu được chuẩn bị riêng trước khi nạp vào bể.',
  load_and_wet: 'Nạp mẫu vào môi trường nước và minh họa làm ướt bằng khuấy. Một giờ là điều kiện của hồ sơ, không phải thời gian chờ trên màn hình.',
  separate_water: 'PP và HDPE ở phân đoạn nổi; PS, ABS, PA và PC ở phân đoạn chìm.',
  select_branch: 'Đã chọn nhánh dung dịch. Chạy từng mức nồng độ trong bảng Thao tác.',
  run_ethanol_preset: 'Quan sát PP nổi và HDPE chìm. Hai mức ethanol ghi nhận thu hồi của hai mẫu khác nhau.',
  run_nacl_preset: 'Quan sát phân đoạn nổi và chìm ở mức NaCl vừa chạy; thu hồi các mẫu theo từng bước của hồ sơ.',
  centrifuge_and_weigh: 'Minh họa chuyển phân đoạn vào ly tâm, tách ẩm rồi đưa sang cân. Số liệu là khối lượng quy đổi đã ghi nhận.',
  summarize_fractions: 'Đối chiếu sáu phân đoạn đã thu và số liệu quy đổi trong sổ thực hành.',
}
