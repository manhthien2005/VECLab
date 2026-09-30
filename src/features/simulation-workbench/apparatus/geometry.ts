/**
 * Pure geometry mappings and visual constants for the VECLab Titration Apparatus.
 * (docs/web-application-scope.md §4.6, WB-R4).
 *
 * SVG ViewBox: 800 x 600.
 * Coordinates are pure numbers to enable deterministic unit testing without DOM dependencies.
 */

export const APPARATUS_CONSTANTS = {
  VIEWBOX: '0 0 800 600',
  VIEWBOX_DESKTOP: '0 0 800 600',
  VIEWBOX_MOBILE: '200 185 400 380',
  VIEWBOX_WIDTH: 800,
  VIEWBOX_HEIGHT: 600,

  // Burette Truth Contract: 100 mL visual capacity comfortably supports 0-60 mL delivered NaOH
  BURETTE_CAPACITY_ML: 100,
  BURETTE_CENTER_X: 375,
  BURETTE_TUBE_WIDTH: 28,
  BURETTE_TUBE_TOP_Y: 35,
  BURETTE_TUBE_BOTTOM_Y: 255,
  BURETTE_SCALE_TOP_Y: 55, // 0.0 mL graduation
  BURETTE_SCALE_BOTTOM_Y: 235, // 100.0 mL graduation (180px scale: 1.8px / mL)
  BURETTE_VALVE_Y: 275,
  BURETTE_TIP_Y: 310,

  // Beaker Truth Contract: 250 mL standard laboratory beaker
  BEAKER_CAPACITY_ML: 250,
  BEAKER_CENTER_X: 400,
  BEAKER_WIDTH: 196,
  BEAKER_TOP_Y: 330,
  BEAKER_BOTTOM_Y: 492,
  BEAKER_LIQUID_BASE_Y: 488,
  BEAKER_MAX_LIQUID_HEIGHT: 125, // 250 mL fill height (surface at 363, well below 330 rim)

  // pH Electrode Probe Geometry
  PROBE_MOUNT_X: 450,
  PROBE_TIP_Y: 482, // Fully submerged across 25-150 mL (25 mL surface is 475.5)

  // Laboratory Stand Geometry
  STAND_BASE_X: 160,
  STAND_BASE_Y: 536,
  STAND_BASE_WIDTH: 480,
  STAND_BASE_HEIGHT: 18,
  STAND_ROD_X: 235,
  STAND_ROD_TOP_Y: 22,
  STAND_ROD_BOTTOM_Y: 536,

  // Magnetic Stirrer Geometry
  STIRRER_PLATE_TOP_Y: 494,
  STIRRER_BODY_BOTTOM_Y: 546,
  STIRRER_WIDTH: 230,
  STIR_BAR_Y: 485,
} as const

export type BuretteGeometryResult = Readonly<{
  meniscusY: number
  remainingMl: number
  deliveredMl: number
  liquidHeight: number
  isExhausted: boolean
}>

export type BeakerGeometryResult = Readonly<{
  surfaceY: number
  liquidHeight: number
  fillRatio: number
  volumeMl: number
  isProbeSubmerged: boolean
}>

export type StirrerVisualParams = Readonly<{
  durationSeconds: number
  isStirring: boolean
  vortexIntensity: number
}>

/**
 * Pure calculation mapping delivered NaOH volume in mL to burette liquid and meniscus coordinates.
 * Liquid descends from BURETTE_SCALE_TOP_Y as delivered base increases.
 * Displays truthful remaining liquid that is clamped to never become negative.
 */
export function calculateBuretteLiquid(
  addedBaseVolumeMl: number,
  capacityMl: number = APPARATUS_CONSTANTS.BURETTE_CAPACITY_ML,
): BuretteGeometryResult {
  const safeCapacity = Math.max(1, capacityMl)
  const clampedDelivered = Math.max(0, Math.min(safeCapacity, addedBaseVolumeMl))
  const remainingMl = Math.max(0, safeCapacity - clampedDelivered)

  const scaleHeight =
    APPARATUS_CONSTANTS.BURETTE_SCALE_BOTTOM_Y - APPARATUS_CONSTANTS.BURETTE_SCALE_TOP_Y
  const fractionDelivered = clampedDelivered / safeCapacity
  const meniscusY = APPARATUS_CONSTANTS.BURETTE_SCALE_TOP_Y + fractionDelivered * scaleHeight

  // Liquid extends from meniscus down through the tube and stopcock into the tip
  const liquidHeight = Math.max(0, APPARATUS_CONSTANTS.BURETTE_TIP_Y - meniscusY)

  return {
    meniscusY: Math.round(meniscusY * 100) / 100,
    remainingMl: Math.round(remainingMl * 100) / 100,
    deliveredMl: Math.round(clampedDelivered * 100) / 100,
    liquidHeight: Math.round(liquidHeight * 100) / 100,
    isExhausted: remainingMl <= 0,
  }
}

/**
 * Pure calculation mapping total liquid volume in mL to reaction beaker fill level.
 * Surface ascends from BEAKER_LIQUID_BASE_Y as total volume increases.
 */
export function calculateBeakerLiquid(
  totalVolumeMl: number,
  capacityMl: number = APPARATUS_CONSTANTS.BEAKER_CAPACITY_ML,
): BeakerGeometryResult {
  const safeCapacity = Math.max(1, capacityMl)
  const clampedVolume = Math.max(0, Math.min(safeCapacity, totalVolumeMl))
  const fillRatio = clampedVolume / safeCapacity

  const liquidHeight = fillRatio * APPARATUS_CONSTANTS.BEAKER_MAX_LIQUID_HEIGHT
  const surfaceY = APPARATUS_CONSTANTS.BEAKER_LIQUID_BASE_Y - liquidHeight

  // Probe is submerged if surfaceY is at or above the probe sensing bulb
  const isProbeSubmerged = surfaceY <= APPARATUS_CONSTANTS.PROBE_TIP_Y

  return {
    surfaceY: Math.round(surfaceY * 100) / 100,
    liquidHeight: Math.round(liquidHeight * 100) / 100,
    fillRatio: Math.round(fillRatio * 1000) / 1000,
    volumeMl: Math.round(clampedVolume * 100) / 100,
    isProbeSubmerged,
  }
}

/**
 * Pure calculation deriving stir bar rotation duration and qualitative vortex depth from stirrer telemetry.
 * Does not alter chemistry calculations.
 */
export function calculateStirrerParams(
  stirrerRpm: number,
  active: boolean,
): StirrerVisualParams {
  if (!active || stirrerRpm <= 0) {
    return {
      durationSeconds: 0,
      isStirring: false,
      vortexIntensity: 0,
    }
  }

  // Bound visual RPM between 60 (1 turn/s) and 1200 (20 turns/s) for plausible CSS animation
  const boundedRpm = Math.max(60, Math.min(1200, stirrerRpm))
  const durationSeconds = Math.round((60 / boundedRpm) * 1000) / 1000
  const vortexIntensity = Math.min(1, Math.max(0.1, boundedRpm / 600))

  return {
    durationSeconds,
    isStirring: true,
    vortexIntensity: Math.round(vortexIntensity * 100) / 100,
  }
}
