import { describe, expect, it } from 'vitest'
import {
  APPARATUS_CONSTANTS,
  calculateBeakerLiquid,
  calculateBuretteLiquid,
  calculateStirrerParams,
} from '@/features/simulation-workbench/apparatus/geometry.js'

describe('Apparatus Geometry Contract (WB-R4)', () => {
  describe('Burette Liquid and Meniscus Geometry', () => {
    it('0 mL delivered maps to scale top with full 100 mL remaining', () => {
      const g = calculateBuretteLiquid(0)
      expect(g.deliveredMl).toBe(0)
      expect(g.remainingMl).toBe(100)
      expect(g.meniscusY).toBe(APPARATUS_CONSTANTS.BURETTE_SCALE_TOP_Y)
      expect(g.liquidHeight).toBe(
        APPARATUS_CONSTANTS.BURETTE_TIP_Y - APPARATUS_CONSTANTS.BURETTE_SCALE_TOP_Y,
      )
      expect(g.isExhausted).toBe(false)
    })

    it('30 mL delivered maps to exact intermediate meniscus height', () => {
      const g = calculateBuretteLiquid(30)
      expect(g.deliveredMl).toBe(30)
      expect(g.remainingMl).toBe(70)

      const scaleHeight =
        APPARATUS_CONSTANTS.BURETTE_SCALE_BOTTOM_Y - APPARATUS_CONSTANTS.BURETTE_SCALE_TOP_Y
      const expectedY = APPARATUS_CONSTANTS.BURETTE_SCALE_TOP_Y + 0.3 * scaleHeight
      expect(g.meniscusY).toBeCloseTo(expectedY, 2)
      expect(g.isExhausted).toBe(false)
    })

    it('60 mL delivered maps correctly within the 100 mL capacity and never produces negative volume', () => {
      const g = calculateBuretteLiquid(60)
      expect(g.deliveredMl).toBe(60)
      expect(g.remainingMl).toBe(40)
      expect(g.remainingMl).toBeGreaterThan(0)
      expect(g.meniscusY).toBeLessThan(APPARATUS_CONSTANTS.BURETTE_SCALE_BOTTOM_Y)
      expect(g.isExhausted).toBe(false)
    })

    it('100 mL delivered reaches scale bottom with 0 mL remaining', () => {
      const g = calculateBuretteLiquid(100)
      expect(g.deliveredMl).toBe(100)
      expect(g.remainingMl).toBe(0)
      expect(g.meniscusY).toBe(APPARATUS_CONSTANTS.BURETTE_SCALE_BOTTOM_Y)
      expect(g.isExhausted).toBe(true)
    })

    it('delivered volume exceeding 100 mL is clamped and never produces negative remaining visual volume', () => {
      const g = calculateBuretteLiquid(120)
      expect(g.deliveredMl).toBe(100)
      expect(g.remainingMl).toBe(0)
      expect(g.isExhausted).toBe(true)
    })

    it('meniscusY descends monotonically as delivered volume increases', () => {
      let previousY = -Infinity
      for (let vol = 0; vol <= 100; vol += 5) {
        const g = calculateBuretteLiquid(vol)
        expect(g.meniscusY).toBeGreaterThanOrEqual(previousY)
        previousY = g.meniscusY
      }
    })
  })

  describe('Beaker Fill Geometry and Probe Submergence', () => {
    it('25 mL minimum authorized sample maps to a positive liquid height and submerges the probe', () => {
      const g = calculateBeakerLiquid(25)
      expect(g.volumeMl).toBe(25)
      expect(g.fillRatio).toBe(0.1) // 25 / 250
      expect(g.liquidHeight).toBeCloseTo(0.1 * APPARATUS_CONSTANTS.BEAKER_MAX_LIQUID_HEIGHT, 1)
      expect(g.surfaceY).toBeLessThan(APPARATUS_CONSTANTS.BEAKER_LIQUID_BASE_Y)
      expect(g.isProbeSubmerged).toBe(true)
    })

    it('50 mL maximum initial sample maps correctly and submerges probe deeper', () => {
      const g25 = calculateBeakerLiquid(25)
      const g50 = calculateBeakerLiquid(50)

      expect(g50.volumeMl).toBe(50)
      expect(g50.fillRatio).toBe(0.2) // 50 / 250
      expect(g50.surfaceY).toBeLessThan(g25.surfaceY) // Surface ascends (lower Y)
      expect(g50.isProbeSubmerged).toBe(true)
    })

    it('high authorized total volume (110 mL: 50 mL acid + 60 mL base) remains comfortably inside 250 mL beaker', () => {
      const g110 = calculateBeakerLiquid(110)
      expect(g110.volumeMl).toBe(110)
      expect(g110.fillRatio).toBeCloseTo(110 / 250, 3)
      expect(g110.surfaceY).toBeGreaterThan(APPARATUS_CONSTANTS.BEAKER_TOP_Y) // Below rim
      expect(g110.isProbeSubmerged).toBe(true)
    })

    it('beaker surface ascends monotonically as total volume increases', () => {
      let previousSurfaceY = Infinity
      for (let vol = 0; vol <= 250; vol += 10) {
        const g = calculateBeakerLiquid(vol)
        expect(g.surfaceY).toBeLessThanOrEqual(previousSurfaceY)
        previousSurfaceY = g.surfaceY
      }
    })
  })

  describe('Stirrer Telemetry Animation Parameters', () => {
    it('returns durationSeconds 0 and inactive flag when stirrer is not active', () => {
      const p = calculateStirrerParams(300, false)
      expect(p.isStirring).toBe(false)
      expect(p.durationSeconds).toBe(0)
      expect(p.vortexIntensity).toBe(0)
    })

    it('derives bounded rotation duration from RPM when active', () => {
      const p300 = calculateStirrerParams(300, true)
      expect(p300.isStirring).toBe(true)
      expect(p300.durationSeconds).toBe(0.2) // 60 / 300 = 0.2s per turn
      expect(p300.vortexIntensity).toBeGreaterThan(0)

      const p600 = calculateStirrerParams(600, true)
      expect(p600.durationSeconds).toBe(0.1) // 60 / 600 = 0.1s per turn
      expect(p600.vortexIntensity).toBe(1)
    })
  })

  describe('WB-R4.1 Apparatus Spatial Alignment & Responsive Framing', () => {
    it('verifies burette tip remains vertically aligned directly over beaker opening', () => {
      const beakerLeft =
        APPARATUS_CONSTANTS.BEAKER_CENTER_X - APPARATUS_CONSTANTS.BEAKER_WIDTH / 2
      const beakerRight =
        APPARATUS_CONSTANTS.BEAKER_CENTER_X + APPARATUS_CONSTANTS.BEAKER_WIDTH / 2

      // Tip X is strictly inside the beaker rim opening
      expect(APPARATUS_CONSTANTS.BURETTE_CENTER_X).toBeGreaterThan(beakerLeft)
      expect(APPARATUS_CONSTANTS.BURETTE_CENTER_X).toBeLessThan(beakerRight)

      // Tip Y is above beaker top or rim opening with clearance for droplets
      expect(APPARATUS_CONSTANTS.BURETTE_TIP_Y).toBeLessThan(
        APPARATUS_CONSTANTS.BEAKER_TOP_Y,
      )
    })

    it('verifies probe remains submerged across all supported volume states (25 to 150 mL)', () => {
      const volumeStates = [25, 35, 50, 65, 80, 100, 110, 150]
      for (const vol of volumeStates) {
        const { isProbeSubmerged, surfaceY } = calculateBeakerLiquid(vol)
        expect(isProbeSubmerged).toBe(true)
        expect(surfaceY).toBeLessThanOrEqual(APPARATUS_CONSTANTS.PROBE_TIP_Y)
      }
    })

    it('verifies mobile focused framing contains beaker, probe, and burette tip without clipping', () => {
      const parts = APPARATUS_CONSTANTS.VIEWBOX_MOBILE.split(' ').map(Number)
      const vx = parts[0] ?? 0
      const vy = parts[1] ?? 0
      const vw = parts[2] ?? 0
      const vh = parts[3] ?? 0
      const minX = vx
      const maxX = vx + vw
      const minY = vy
      const maxY = vy + vh

      // Burette tip is within mobile view
      expect(APPARATUS_CONSTANTS.BURETTE_CENTER_X).toBeGreaterThanOrEqual(minX)
      expect(APPARATUS_CONSTANTS.BURETTE_CENTER_X).toBeLessThanOrEqual(maxX)
      expect(APPARATUS_CONSTANTS.BURETTE_TIP_Y).toBeGreaterThanOrEqual(minY)
      expect(APPARATUS_CONSTANTS.BURETTE_TIP_Y).toBeLessThanOrEqual(maxY)

      // Beaker boundaries are within mobile view
      const beakerLeft =
        APPARATUS_CONSTANTS.BEAKER_CENTER_X - APPARATUS_CONSTANTS.BEAKER_WIDTH / 2
      const beakerRight =
        APPARATUS_CONSTANTS.BEAKER_CENTER_X + APPARATUS_CONSTANTS.BEAKER_WIDTH / 2
      expect(beakerLeft).toBeGreaterThanOrEqual(minX)
      expect(beakerRight).toBeLessThanOrEqual(maxX)
      expect(APPARATUS_CONSTANTS.BEAKER_TOP_Y).toBeGreaterThanOrEqual(minY)
      expect(APPARATUS_CONSTANTS.BEAKER_BOTTOM_Y).toBeLessThanOrEqual(maxY)

      // Probe bulb is within mobile view
      expect(APPARATUS_CONSTANTS.PROBE_MOUNT_X).toBeGreaterThanOrEqual(minX)
      expect(APPARATUS_CONSTANTS.PROBE_MOUNT_X).toBeLessThanOrEqual(maxX)
      expect(APPARATUS_CONSTANTS.PROBE_TIP_Y).toBeGreaterThanOrEqual(minY)
      expect(APPARATUS_CONSTANTS.PROBE_TIP_Y).toBeLessThanOrEqual(maxY)
    })
  })
})
