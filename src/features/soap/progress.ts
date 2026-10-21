import { SOAP_PROFILE, type SoapVesselId } from '@/domain/experiments/soap/model.js'
import type { SoapProjection, SoapVesselView } from '@/application/scenarios/soap-projection.js'

export type SoapStepId = 'lye' | 'oil' | 'mix' | 'mold' | 'finish'
export type SoapTask = { label: string; hint: string; done: boolean }
export type SoapStep = {
  id: SoapStepId
  title: string
  summary: string
  cup: SoapVesselId | null
  tasks: SoapTask[]
  done: boolean
}
export type SoapProgress = { now: string; next: string; detail: string; stepIndex: number }

export const FAILURE_REASON = 'Thất bại do đổ nước vào kiềm gây vỡ cốc.'

const MOLD_STAGES = { empty: 0, poured: 1, gelled: 2, unmolded: 3, cured: 4 } as const

function cup(p: SoapProjection, id: SoapVesselId): SoapVesselView {
  return p.vessels.find((item) => item.id === id)!
}

/** True once the mixing cup is idle and at least one sample is recorded. */
function idleAfterSample(p: SoapProjection): boolean {
  const mixing = cup(p, 'M')
  return p.samples.length > 0 && p.moldStage === 'empty' && !mixing.hasLye && !mixing.hasOil
}

function task(label: string, hint: string, done: boolean): SoapTask {
  return { label, hint, done }
}

/** Steps from committed cups only, so emptying a source cup never rewinds progress. */
export function soapSteps(p: SoapProjection, completed = false): SoapStep[] {
  const water = cup(p, 'W')
  const oil = cup(p, 'O')
  const mixing = cup(p, 'M')
  const stage = MOLD_STAGES[p.moldStage]
  const lyeInMix = mixing.hasLye || stage > 0
  const oilInMix = mixing.hasOil || stage > 0
  const cooled = (water.hasLye && !p.lyeHot) || lyeInMix
  const lye = [
    task('Rót nước vào cốc kiềm', 'Chọn cốc kiềm, nhập thể tích nước (mL) rồi bấm Rót nước.', water.hasWater || lyeInMix),
    task('Rót NaOH vào nước', 'Luôn cho NaOH vào nước, không làm ngược lại. Nhập khối lượng NaOH (g).', water.hasLye || lyeInMix),
    task('Chờ kiềm nguội', 'Dung dịch kiềm cần ≤ ' + SOAP_PROFILE.lyePourWarnC + ' °C trước khi trộn với dầu.', cooled),
  ]
  const oils = [
    task('Rót dầu vào cốc dầu', 'Chọn loại dầu (ô liu / dừa / cọ), nhập thể tích (mL). Ô quy đổi cho biết khối lượng (g).', oil.hasOil || oilInMix),
  ]
  const mix = [
    task('Rót kiềm vào cốc trộn', 'Chọn cốc trộn, nhập thể tích kiềm (mL) rồi bấm Rót kiềm.', lyeInMix),
    task('Rót dầu vào cốc trộn', 'Nhập thể tích dầu (mL) rồi bấm Rót dầu.', oilInMix),
    task('Khuấy hỗn hợp', 'Cần có đủ kiềm và dầu trong cốc trộn mới khuấy được.', p.mix.stirred || stage > 0),
    task('Chờ dung dịch đặc lại', 'Đổ khuôn trước khi dung dịch đặc lại sẽ không đạt tiêu chí mẫu.', p.mix.traced || stage > 0),
  ]
  const mold = [
    task('Đổ khuôn', 'Đổ toàn bộ hỗn hợp từ cốc trộn vào khuôn.', stage >= 1),
    task('Chờ 24 giờ', 'Hỗn hợp đông lại trong khuôn.', stage >= 2),
    task('Tháo khuôn', 'Lấy bánh xà phòng ra khỏi khuôn.', stage >= 3),
    task('Đợi 4 tuần', 'Bánh khô và giảm nước.', stage >= 4),
    task('Đo pH và cân bánh', 'Phép đo lưu thành mẫu thử.', false),
  ]
  const finish = [task('Hoàn thành thí nghiệm', 'Cần ít nhất 1 mẫu. Tối đa ' + SOAP_PROFILE.maxSamples + ' mẫu.', completed)]
  const all = (tasks: SoapTask[]) => tasks.every((item) => item.done)
  return [
    { id: 'lye', title: 'Pha dung dịch kiềm', summary: 'NaOH vào nước, rồi chờ nguội.', cup: 'W', tasks: lye, done: all(lye) },
    { id: 'oil', title: 'Chuẩn bị dầu', summary: 'Chọn loại dầu rồi rót vào cốc dầu.', cup: 'O', tasks: oils, done: all(oils) },
    { id: 'mix', title: 'Trộn kiềm với dầu', summary: 'Rót hai dung dịch vào cốc trộn, khuấy và chờ đặc lại.', cup: 'M', tasks: mix, done: all(mix) },
    { id: 'mold', title: 'Khuôn, ủ và đo', summary: 'Đổ khuôn, chờ, tháo khuôn, ủ rồi đo.', cup: 'D', tasks: mold, done: p.samples.length > 0 && stage === 0 },
    { id: 'finish', title: 'Hoàn thành và chấm điểm', summary: 'Mẫu nào đạt mọi yêu cầu thì thí nghiệm đạt.', cup: null, tasks: finish, done: completed },
  ]
}

export function currentStepIndex(p: SoapProjection, steps: SoapStep[]): number {
  if (idleAfterSample(p)) return 4
  const index = steps.slice(0, 4).findIndex((step) => !step.done)
  return index === -1 ? 3 : index
}

export function soapProgress(p: SoapProjection): SoapProgress {
  if (p.failure) {
    return { now: 'Thí nghiệm thất bại', next: 'Hoàn thành để xem chấm điểm', detail: FAILURE_REASON, stepIndex: 0 }
  }
  const steps = soapSteps(p)
  const stepIndex = currentStepIndex(p, steps)
  if (stepIndex === 4) {
    const left = SOAP_PROFILE.maxSamples - p.samples.length
    return {
      now: 'Hoàn thành hoặc làm thêm mẫu', next: 'Chấm điểm',
      detail: left > 0 ? 'Còn ' + left + ' mẫu có thể làm. Có thể hoàn thành bất cứ lúc nào.' : 'Đã đủ ' + SOAP_PROFILE.maxSamples + ' mẫu. Hoàn thành để chấm điểm.',
      stepIndex,
    }
  }
  const pending = steps.slice(stepIndex).flatMap((step) => step.tasks.filter((item) => !item.done))
  const first = pending[0]
  return {
    now: first?.label ?? steps[stepIndex]!.title,
    next: pending[1]?.label ?? 'Hoàn thành thí nghiệm',
    detail: first?.hint ?? steps[stepIndex]!.summary,
    stepIndex,
  }
}
