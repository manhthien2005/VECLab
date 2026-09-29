import { describe, expect, it } from 'vitest'
import type { MeasurementRecordAcid } from '@/domain/experiments/acid-neutralization/state.js'
import {
  projectTitrationPoint,
  projectTitrationPoints,
  projectTitrationCurve,
  type TitrationCurvePoint,
} from '@/application/scenarios/acid-titration-curve.js'

describe('acid titration curve projection (WB-R2)', () => {
  it('returns empty projection with null bounds when measurement list is empty', () => {
    const projection = projectTitrationCurve([])

    expect(projection.points).toEqual([])
    expect(projection.count).toBe(0)
    expect(projection.lastPoint).toBeNull()
    expect(projection.minPh).toBeNull()
    expect(projection.maxPh).toBeNull()
    expect(projection.minBaseVolumeMl).toBeNull()
    expect(projection.maxBaseVolumeMl).toBeNull()
  })

  it('maps single measurement accurately without synthetic points', () => {
    const single: MeasurementRecordAcid = {
      sequence: 1,
      compositionRevision: 1,
      simulatedPH: 2.0,
      baseVolumeL: 0,
      correctionAcidVolumeL: 0,
    }

    const projection = projectTitrationCurve([single])

    expect(projection.count).toBe(1)
    expect(projection.points).toHaveLength(1)
    expect(projection.lastPoint).toEqual(projection.points[0])

    const point = projection.points[0]!
    expect(point.sequence).toBe(1)
    expect(point.compositionRevision).toBe(1)
    expect(point.baseVolumeMl).toBe(0)
    expect(point.correctionAcidVolumeMl).toBe(0)
    expect(point.totalTitrantVolumeMl).toBe(0)
    expect(point.ph).toBe(2.0)

    expect(projection.minPh).toBe(2.0)
    expect(projection.maxPh).toBe(2.0)
    expect(projection.minBaseVolumeMl).toBe(0)
    expect(projection.maxBaseVolumeMl).toBe(0)
  })

  it('preserves exact authoritative measurement ordering across multiple additions', () => {
    const records: MeasurementRecordAcid[] = [
      { sequence: 1, compositionRevision: 1, simulatedPH: 2.0, baseVolumeL: 0, correctionAcidVolumeL: 0 },
      { sequence: 5, compositionRevision: 2, simulatedPH: 2.5, baseVolumeL: 0.01, correctionAcidVolumeL: 0 },
      { sequence: 9, compositionRevision: 3, simulatedPH: 3.27875, baseVolumeL: 0.0225, correctionAcidVolumeL: 0 },
      { sequence: 13, compositionRevision: 4, simulatedPH: 6.995, baseVolumeL: 0.025, correctionAcidVolumeL: 0 },
      { sequence: 17, compositionRevision: 5, simulatedPH: 10.64984, baseVolumeL: 0.0275, correctionAcidVolumeL: 0 },
    ]

    const projection = projectTitrationCurve(records)
    const pointsList: readonly TitrationCurvePoint[] = projectTitrationPoints(records)

    expect(pointsList).toHaveLength(5)
    expect(pointsList[2]!.ph).toBe(3.27875)
    expect(projection.count).toBe(5)
    expect(projection.points).toEqual(pointsList)
    expect(projection.points.map((p) => p.sequence)).toEqual([1, 5, 9, 13, 17])
    expect(projection.points.map((p) => p.baseVolumeMl)).toEqual([0, 10, 22.5, 25, 27.5])
    expect(projection.points[3]!.ph).toBe(6.995)
    expect(projection.lastPoint?.ph).toBe(10.64984)

    expect(projection.minPh).toBe(2.0)
    expect(projection.maxPh).toBe(10.64984)
    expect(projection.minBaseVolumeMl).toBe(0)
    expect(projection.maxBaseVolumeMl).toBe(27.5)
  })

  it('performs exact litres-to-millilitres conversion without precision drift', () => {
    const record: MeasurementRecordAcid = {
      sequence: 4,
      compositionRevision: 2,
      simulatedPH: 4.821,
      baseVolumeL: 0.02495, // 24.95 mL
      correctionAcidVolumeL: 0.0005, // 0.50 mL
    }

    const point = projectTitrationPoint(record)

    expect(point.baseVolumeMl).toBeCloseTo(24.95, 6)
    expect(point.correctionAcidVolumeMl).toBeCloseTo(0.5, 6)
    expect(point.totalTitrantVolumeMl).toBeCloseTo(25.45, 6)
  })

  it('copies pH directly from authoritative measurement without recomputation or rounding', () => {
    const unroundedPh = 6.995000000012345
    const record: MeasurementRecordAcid = {
      sequence: 12,
      compositionRevision: 3,
      simulatedPH: unroundedPh,
      baseVolumeL: 0.025,
      correctionAcidVolumeL: 0,
    }

    const point = projectTitrationPoint(record)

    expect(point.ph).toBe(unroundedPh)
  })

  it('does not mutate input array or input records', () => {
    const record1: MeasurementRecordAcid = {
      sequence: 1,
      compositionRevision: 1,
      simulatedPH: 2.0,
      baseVolumeL: 0,
      correctionAcidVolumeL: 0,
    }
    const record2: MeasurementRecordAcid = {
      sequence: 2,
      compositionRevision: 2,
      simulatedPH: 7.0,
      baseVolumeL: 0.025,
      correctionAcidVolumeL: 0,
    }

    const inputList = Object.freeze([Object.freeze({ ...record1 }), Object.freeze({ ...record2 })])

    expect(() => projectTitrationCurve(inputList)).not.toThrow()
    expect(inputList).toHaveLength(2)
    expect(inputList[0]!.baseVolumeL).toBe(0)
    expect(inputList[1]!.baseVolumeL).toBe(0.025)
  })

  it('does not contain hardcoded 25.00 mL benchmark logic and supports arbitrary valid volumes', () => {
    // 50.00 mL exploration sample where equivalence occurs around 50.00 mL
    const nonDefaultRecords: MeasurementRecordAcid[] = [
      { sequence: 1, compositionRevision: 1, simulatedPH: 2.3, baseVolumeL: 0, correctionAcidVolumeL: 0 },
      { sequence: 4, compositionRevision: 2, simulatedPH: 3.5, baseVolumeL: 0.04, correctionAcidVolumeL: 0 },
      { sequence: 8, compositionRevision: 3, simulatedPH: 6.995, baseVolumeL: 0.05, correctionAcidVolumeL: 0 },
      { sequence: 12, compositionRevision: 4, simulatedPH: 11.2, baseVolumeL: 0.058, correctionAcidVolumeL: 0 },
    ]

    const projection = projectTitrationCurve(nonDefaultRecords)

    expect(projection.count).toBe(4)
    expect(projection.points[2]!.baseVolumeMl).toBe(50.0)
    expect(projection.points[3]!.baseVolumeMl).toBe(58.0)
    expect(projection.maxBaseVolumeMl).toBe(58.0)
  })

  it('contains zero SVG coordinates, pixel widths, heights, or display styles', () => {
    const record: MeasurementRecordAcid = {
      sequence: 1,
      compositionRevision: 1,
      simulatedPH: 2.0,
      baseVolumeL: 0.01,
      correctionAcidVolumeL: 0,
    }

    const point = projectTitrationPoint(record)
    const keys = Object.keys(point)

    expect(keys).not.toContain('x')
    expect(keys).not.toContain('y')
    expect(keys).not.toContain('cx')
    expect(keys).not.toContain('cy')
    expect(keys).not.toContain('width')
    expect(keys).not.toContain('height')
    expect(keys).not.toContain('svg')
    expect(keys).not.toContain('color')
  })
})
