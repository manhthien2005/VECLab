import { describe, expect, it } from 'vitest'
import { projectSoap } from '@/application/scenarios/soap-projection.js'
import { soapProgress } from '@/features/soap/progress.js'
import {
  accepted, pourBoth, prepareLye, prepareOil, runSample, soapHarness,
} from '../fixtures/soap-harness.js'

const progress = (h: ReturnType<typeof soapHarness>) => soapProgress(projectSoap(h.state))

describe('soap progress', () => {
  it('starts at the lye cup and waits for the lye to cool', () => {
    const h = soapHarness()
    expect(progress(h)).toMatchObject({ now: 'Rót nước vào cốc kiềm', stepIndex: 0 })
    accepted(h.step('pour_water', { waterVolumeL: 175 }, { waterVolumeL: 'mL' }))
    accepted(h.step('pour_naoh', { naohMassG: 64.6 }, { naohMassG: 'g' }))
    expect(progress(h).now).toBe('Chờ kiềm nguội')
    accepted(h.step('cool_lye'))
    expect(progress(h)).toMatchObject({ now: 'Rót dầu vào cốc dầu', stepIndex: 1 })
  })

  it('moves on to the mixing cup and keeps progress after the source cups are emptied', () => {
    const h = soapHarness()
    prepareLye(h)
    prepareOil(h)
    expect(progress(h)).toMatchObject({ now: 'Rót kiềm vào cốc trộn', stepIndex: 2 })
    pourBoth(h)
    expect(progress(h).now).toBe('Khuấy hỗn hợp')
    accepted(h.step('stir', { mode: 'hand' }))
    expect(progress(h)).toMatchObject({ now: 'Chờ dung dịch đặc lại', next: 'Đổ khuôn' })
  })

  it('offers to finish once a sample is recorded', () => {
    const h = soapHarness()
    runSample(h)
    expect(progress(h)).toMatchObject({ now: 'Hoàn thành hoặc làm thêm mẫu', stepIndex: 4 })
  })

  it('reports the broken cup after water hits solid NaOH', () => {
    const h = soapHarness()
    accepted(h.step('pour_naoh', { naohMassG: 20 }, { naohMassG: 'g' }))
    accepted(h.step('pour_water', { waterVolumeL: 100 }, { waterVolumeL: 'mL' }))
    expect(progress(h).now).toBe('Thí nghiệm thất bại')
  })
})
