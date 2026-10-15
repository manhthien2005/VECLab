import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it } from 'vitest'
import { createInitialExtractionState } from '@/domain/experiments/acid-base-extraction/model.js'
import { createInitialResourceLedger } from '@/domain/process/ledger.js'
import { buildExtractionReport, type ExtractionReportSnapshot } from '@/application/scenarios/extraction-projection.js'
import { ExtractionReport } from '@/features/extraction/report.js'

function snapshot() {
  return buildExtractionReport({ ...createInitialExtractionState(), phase: 'completed' }, createInitialResourceLedger(), [], new Date('2026-10-15T00:00:00Z'))
}
function render(report: ExtractionReportSnapshot) {
  return renderToStaticMarkup(createElement(ExtractionReport, { report }))
}

it('compares true recovery and purity to their targets, separately from the measured-mass calculation', () => {
  const report = snapshot()
  report.products[0] = { ...report.products[0]!, vesselId: 'R1', recovery: 75, purity: 85, measuredMassMg: 120, answer: 130, expectedAnswer: 120, answerError: 10, currentMeasurement: true, dry: false }
  const html = render(report)
  expect(html).toContain('Thu hồi A: 75 %; mục tiêu 80 %')
  expect(html).toContain('Độ tinh khiết A: 85 %; mục tiêu 90 %')
  expect(html).toContain('Thu hồi thấp hơn mục tiêu 5 điểm %; độ tinh khiết thấp hơn 5 điểm %.')
  expect(html).toContain('130 %')
  expect(html).toContain('120 %')
  expect(html).toContain('Lệch 10 điểm %')
  expect(html).toContain('Chưa làm khô')
  expect(html).not.toContain('do bạn')
})

it('distinguishes missing readings and stale readings from genuine zero results, and includes exact target values', () => {
  const report = snapshot()
  report.products[0] = { ...report.products[0]!, vesselId: 'R1', recovery: 0, purity: null, measuredMassMg: 0, answer: 0, expectedAnswer: 0, answerError: 0, currentMeasurement: true }
  report.products[1] = { ...report.products[1]!, vesselId: 'R2', recovery: 80, purity: 90, measuredMassMg: 80, answer: 80, expectedAnswer: 80, answerError: 0, currentMeasurement: false, dry: true }
  const html = render(report)
  expect(html).toContain('Thu hồi A: 0 %; mục tiêu 80 %')
  expect(html).toContain('Độ tinh khiết A: N/A; mục tiêu 90 %')
  expect(html).toContain('0 mg')
  expect(html).toContain('Số đo cũ')
  expect(html).toContain('Đạt cả hai chỉ tiêu của mẫu.')
  expect(html).toContain('Thu hồi N: N/A; mục tiêu 80 %')
  expect(html).toContain('Chưa khai báo bình sản phẩm.')
})

it('shows conserved compound distribution and quantifies material outside the declared product without claiming all of it is an error', () => {
  const report = snapshot()
  report.products[0] = { ...report.products[0]!, vesselId: 'R1', recovery: 80, purity: 100 }
  report.distribution.forEach(row => { row.amountsMg.A = row.vesselId === 'R1' ? 80 : row.vesselId === 'W' ? 15 : row.vesselId === 'S' ? 5 : 0 })
  const html = render(report)
  expect(html).toContain('Phân bố cấu tử A')
  expect(html).toContain('R1: 80 mg; W: 15 mg; S: 5 mg')
  expect(html).toContain('20 mg ngoài bình sản phẩm R1, trong đó 15 mg ở bình thải W.')
  expect(html).toContain('Chất còn trong dịch mẹ không tự chứng minh thao tác sai.')
})

it('reads legacy reports without adding a new protocol verdict or mutating the saved snapshot', () => {
  const report = snapshot()
  report.schemaVersion = 1
  delete report.actions
  delete report.protocol
  const original = structuredClone(report)
  expect(render(report)).toContain('Lượt phiên bản cũ: giữ quy tắc đánh giá lúc tạo lượt, chưa có tiêu chí thao tác trộn.')
  expect(report).toEqual(original)
})
