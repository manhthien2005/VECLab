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
})
