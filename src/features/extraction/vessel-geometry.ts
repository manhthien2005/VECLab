import { EXTRACTION_PROFILE, type VesselId } from '@/domain/experiments/acid-base-extraction/model.js'

// Approximate inner radii of the SVG body, bottom to highest graduation.
// Frustum volumes share one scale for liquid and ticks. Drawing only, not
// calibrated laboratory glassware or a source of scientific results.
const BODIES = {
  S: [[221, 52], [54, 52]],
  F: [[200, 7], [176, 7], [152, 21], [126, 39], [100, 49], [75, 49], [54, 44]],
  R1: [[221, 42], [200, 54], [77, 16], [54, 16]],
  R2: [[221, 42], [200, 54], [77, 16], [54, 16]],
  R3: [[221, 42], [200, 54], [77, 16], [54, 16]],
  W: [[221, 34], [85, 34], [61, 19], [54, 19]],
} as const satisfies Record<VesselId, readonly (readonly [number, number])[]>

function sliceVolume(height: number, r0: number, r1: number, fraction = 1) {
  const slope = r1 - r0
  return height * (r0 * r0 * fraction + r0 * slope * fraction ** 2 + slope * slope * fraction ** 3 / 3)
}
const SCALES = Object.fromEntries(Object.entries(BODIES).map(([id, points]) => {
  const slices = points.slice(1).map(([y, radius], index) => {
    const [bottom, r0] = points[index]!
    return { bottom, height: bottom - y, r0, radius, volume: sliceVolume(bottom - y, r0, radius) }
  })
  return [id, { bottom: points[0]![0], slices, volume: slices.reduce((sum, slice) => sum + slice.volume, 0) }]
})) as Record<VesselId, { bottom: number; volume: number; slices: { bottom: number; height: number; r0: number; radius: number; volume: number }[] }>

export function volumeY(id: VesselId, volumeMl: number) {
  const scale = SCALES[id]
  let remaining = Math.max(0, Math.min(EXTRACTION_PROFILE.capacityMl, volumeMl)) / EXTRACTION_PROFILE.capacityMl * scale.volume
  for (const slice of scale.slices) {
    if (remaining > slice.volume) { remaining -= slice.volume; continue }
    let low = 0, high = 1
    for (let i = 0; i < 28; i++) {
      const middle = (low + high) / 2
      if (sliceVolume(slice.height, slice.r0, slice.radius, middle) < remaining) low = middle
      else high = middle
    }
    return slice.bottom - slice.height * (low + high) / 2
  }
  return 54
}

export function radiusAtY(id: VesselId, y: number) {
  const scale = SCALES[id]
  const slice = scale.slices.find(part => y >= part.bottom - part.height) ?? scale.slices.at(-1)!
  return slice.r0 + (slice.radius - slice.r0) * Math.max(0, Math.min(1, (slice.bottom - y) / slice.height))
}

export function liquidLayout(vessel: { id: VesselId; waterMl: number; organicMl: number }) {
  const total = vessel.waterMl + vessel.organicMl, bottom = SCALES[vessel.id].bottom
  const top = total > 0 ? volumeY(vessel.id, total) : bottom
  const boundary = vessel.waterMl > 0 ? volumeY(vessel.id, vessel.waterMl) : bottom
  return { bottom, height: bottom - top, water: bottom - boundary, organic: boundary - top }
}
