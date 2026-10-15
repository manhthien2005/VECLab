import { useId, useLayoutEffect, useRef, type ReactNode } from 'react'
import type { JarProjection, JarReportSnapshot, JarReadingView } from '@/application/scenarios/jar-projection.js'
import type { JarCupId } from '@/domain/experiments/jar-test/model.js'
import { CloseIcon, ReportIcon, SubmitIcon, InfoIcon } from '@/features/workbench/icons.js'
import { CheckCircleIcon } from '@/features/landing/icons.js'
import styles from './completion.module.css'
import { JarReportCharts } from './report-charts.js'
import { jarReportSummary } from './report-insights.js'

export function JarProgramDialog({ projection, onClose, onConfirm }: { projection: JarProjection; onClose: () => void; onConfirm: () => void }) {
  return <CompletionDialog title="Chạy chương trình chung" icon={<InfoIcon />} onClose={onClose}
    footer={<><button type="button" className={styles.secondary} onClick={onClose} autoFocus>Tiếp tục chỉnh các cốc</button><button type="button" className={styles.primary} onClick={onConfirm}>Bắt đầu khuấy cả mẻ</button></>}>
    <p>Chương trình áp dụng cho tất cả {projection.cups.length} cốc dưới đây. Sau khi bắt đầu, pH và liều của cả mẻ sẽ khóa; bạn vẫn đo và ghi kết quả riêng cho từng cốc.</p>
    <div className={styles.tableScroll}><table aria-label="Các cốc trước khi chạy mẻ"><thead><tr><th>Cốc</th><th>pH ban đầu</th><th>Tổng liều phèn (mg/L)</th></tr></thead><tbody>{projection.cups.map(cup => <tr key={cup.id}><th scope="row">Cốc {cup.id}</th><td>{cup.initialPh}</td><td>{cup.doseMgL}</td></tr>)}</tbody></table></div>
    <p className={styles.note}>Chưa đúng thiết kế so sánh? Quay lại chỉnh các cốc trước khi chạy.</p>
  </CompletionDialog>
}

function number(value: number): string {
  return value.toLocaleString('vi-VN', { maximumFractionDigits: 4 })
}
function ntu(reading: JarReadingView | null | undefined): string {
  return reading?.valid && reading.valueNtu !== null ? number(reading.valueNtu) : 'N/A'
}
function percent(value: number | null): string {
  return value === null ? 'N/A' : number(value) + '%'
}

function CompletionDialog({ title, icon, onClose, busy = false, children, footer }: {
  title: string; icon: ReactNode; onClose: () => void; busy?: boolean; children: ReactNode; footer: ReactNode
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const outside = useRef(false)
  const titleId = useId()
  useLayoutEffect(() => {
    const element = dialog.current
    element?.showModal()
    return () => element?.close()
  }, [])
  return <dialog ref={dialog} className={styles.dialog} aria-labelledby={titleId} aria-busy={busy}
    onCancel={event => { event.preventDefault(); if (!busy) onClose() }}
    onPointerDown={event => {
      const box = event.currentTarget.getBoundingClientRect()
      outside.current = event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom
    }}
    onClick={event => {
      const box = event.currentTarget.getBoundingClientRect()
      if (!busy && outside.current && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) onClose()
      outside.current = false
    }}>
    <div className={styles.layout}>
      <header className={styles.header}><h2 id={titleId}>{icon}{title}</h2><button type="button" className={styles.close} disabled={busy} onClick={onClose} aria-label={'Đóng ' + title}><CloseIcon /></button></header>
      <div className={styles.body}>{children}</div>
      <footer className={styles.footer}>{footer}</footer>
    </div>
  </dialog>
}

export function JarSubmitDialog({ projection, drafts, busy, onClose, onConfirm }: {
  projection: JarProjection
  drafts: Partial<Record<JarCupId, string>>
  busy: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  // Readiness only: no efficiency, answer key or score before completion.
  const missing: string[] = []
  if (!projection.initialMeasurement?.valid) missing.push('Chưa có phép đo mẫu ban đầu hợp lệ')
  if (projection.phase !== 'settling') missing.push('Chưa chạy đủ khuấy nhanh, khuấy chậm và lắng')
  if (!projection.cups.length) missing.push('Chưa chuẩn bị cốc nào')
  if (!projection.selectedCupId) missing.push('Chưa chọn cốc làm phương án nộp')
  for (const cup of projection.cups) {
    if (!cup.measurements.some(reading => reading.valid)) missing.push('Cốc ' + cup.id + ': chưa có số đo cuối hợp lệ')
    if (cup.submittedRemovalPercent === null) missing.push('Cốc ' + cup.id + ': chưa ghi đáp số tự tính')
    const draft = drafts[cup.id]
    if (draft !== undefined && (draft.trim() === '' ? cup.submittedRemovalPercent !== null : cup.submittedRemovalPercent === null || Number(draft) !== cup.submittedRemovalPercent)) missing.push('Cốc ' + cup.id + ': có đáp số chưa ghi')
  }
  return <CompletionDialog title="Nộp bài Jar Test" icon={<SubmitIcon />} busy={busy} onClose={onClose}
    footer={<><button type="button" className={styles.secondary} disabled={busy} onClick={onClose} autoFocus>Tiếp tục làm bài</button><button type="button" className={styles.primary} disabled={busy} onClick={onConfirm}>{busy ? 'Đang lưu bài…' : 'Xác nhận nộp bài'}</button></>}>
    <p className={styles.intro}>Kiểm tra bài trước khi nộp. Sau khi xác nhận, lượt này sẽ chỉ có thể xem lại.</p>
    <dl className={styles.summary}><div><dt>Cốc đã chuẩn bị</dt><dd>{projection.cups.length} cốc</dd></div><div><dt>Mẫu ban đầu</dt><dd>{ntu(projection.initialMeasurement)} NTU</dd></div><div><dt>Phương án nộp</dt><dd>{projection.selectedCupId ? 'Cốc ' + projection.selectedCupId : 'Chưa chọn'}</dd></div></dl>
    {!!projection.cups.length && <div className={styles.tableScroll} tabIndex={0} aria-label="Thông tin bài trước khi nộp"><table><thead><tr><th>Cốc</th><th>pH đầu</th><th>Liều (mg/L)</th><th>NTU cuối</th><th>Đáp số đã ghi</th></tr></thead><tbody>{projection.cups.map(cup => <tr key={cup.id}><th scope="row">Cốc {cup.id}{cup.id === projection.selectedCupId && <small>Phương án nộp</small>}</th><td>{cup.initialPh}</td><td>{cup.doseMgL}</td><td>{ntu(cup.measurements.at(-1))}</td><td>{cup.submittedRemovalPercent === null ? 'Chưa ghi' : percent(cup.submittedRemovalPercent)}</td></tr>)}</tbody></table></div>}
    {!!missing.length && <section className={styles.warning} aria-label="Thông tin còn thiếu"><h3>Cần kiểm tra trước khi nộp</h3><ul>{missing.map(message => <li key={message}>{message}</li>)}</ul><p>Bạn vẫn có thể nộp. Báo cáo chỉ đánh giá phần có đủ dữ liệu; đáp số chưa ghi sẽ không được nộp cùng bài.</p></section>}
    <p className={styles.note}>Chỉ dữ liệu đã lưu trong lượt được đưa vào báo cáo.</p>
  </CompletionDialog>
}

const DIAGNOSTICS = {
  NO_FINAL_READING: ['Chưa đo độ đục cuối', 'Thực hiện phép đo sau khi hoàn tất khuấy nhanh, khuấy chậm và lắng.'],
  INVALID_FINAL_READING: ['Đo cuối trước khi hoàn tất quy trình', 'Phép đo sớm là N/A. Ở lượt sau, chạy đủ ba pha rồi đo lại.'],
  BELOW_TARGET: ['Hiệu suất chưa đạt mục tiêu', 'Điều kiện pH và tổng liều đã chọn chưa đạt mức giảm đục yêu cầu trong mô hình. So sánh với các cốc khác hoặc thử điều kiện khác ở lượt mới.'],
  MISSING_CALCULATION: ['Chưa ghi đáp số tự tính', 'Dùng NTU đầu và cuối hợp lệ để tính phần trăm giảm đục, rồi ghi đáp số trước khi nộp.'],
  INCORRECT_CALCULATION: ['Đáp số tự tính chưa khớp số đo', 'Kiểm tra lại công thức (NTU đầu − NTU cuối) / NTU đầu × 100 và số liệu đã dùng.'],
  NO_SELECTION: ['Chưa chọn phương án nộp', 'Chọn một cốc làm phương án nộp sau khi so sánh kết quả.'],
} as const

export function JarReportDialog({ report, onClose, onNotebook }: {
  report: JarReportSnapshot; onClose: () => void; onNotebook: () => void
}) {
  const chosen = report.cups.find(cup => cup.id === report.selectedCupId)
  const summary = jarReportSummary(report)
  const status = !report.goalStatus.evaluable ? 'Chưa đủ dữ liệu đánh giá' : report.goalStatus.goalMet ? 'Đạt mục tiêu bài thực hành' : 'Chưa đạt mục tiêu bài thực hành'
  return <CompletionDialog title="Báo cáo Jar Test" icon={<ReportIcon />} onClose={onClose}
    footer={<><button type="button" className={styles.secondary} onClick={onNotebook}>Xem sổ đo</button><button type="button" className={styles.primary} onClick={onClose}>Về bàn thí nghiệm</button></>}>
    <section className={styles.outcome} data-met={report.goalStatus.goalMet} aria-label="Kết quả đánh giá">{report.goalStatus.goalMet ? <CheckCircleIcon /> : <InfoIcon />}<div><h3>{status}</h3><p>{chosen ? 'Phương án đã nộp: Cốc ' + chosen.id + ' · pH ' + chosen.initialPh + ' · ' + chosen.doseMgL + ' mg/L.' : 'Bạn chưa chọn cốc làm phương án nộp.'}</p><p>Mục tiêu: giảm độ đục ít nhất {report.reference.targetRemovalPercent}% và tính đúng hiệu suất của cốc đã chọn.</p></div></section>
    <dl className={styles.summary}><div><dt>Mẫu ban đầu</dt><dd>{ntu(report.initialMeasurement)} NTU</dd></div><div><dt>Hiệu suất cốc đã chọn</dt><dd>{chosen ? percent(chosen.measuredRemovalPercent) : 'N/A'}</dd></div><div><dt>Đáp số đã nộp</dt><dd>{chosen?.submittedRemovalPercent == null ? 'Chưa ghi' : percent(chosen.submittedRemovalPercent)}</dd></div></dl>
    {summary.missing.length > 0 && <section className={styles.warning} aria-label="Thông tin còn thiếu trong báo cáo"><h3>Thông tin còn thiếu</h3><ul>{summary.missing.map(message => <li key={message}>{message}</li>)}</ul><p>Đây là dữ liệu còn thiếu để đối chiếu cả mẻ. Kết quả đạt của phương án đã chọn được đánh giá riêng; lượt đã nộp không thể bổ sung số liệu.</p></section>}
    <JarReportCharts report={report} />
    <section><h3>Quy trình đã thực hiện</h3><ol className={styles.phases}>{(['rapid', 'slow', 'settling'] as const).map((phase, index, phases) => {
      const program = report.reference.phases[phase]
      const done = report.projection.elapsedSeconds >= phases.slice(0, index + 1).reduce((sum, key) => sum + report.reference.phases[key].durationSeconds, 0)
      return <li key={phase} data-done={done}><strong>{phase === 'rapid' ? 'Khuấy nhanh' : phase === 'slow' ? 'Khuấy chậm' : 'Lắng'}</strong><span>{program.rpm} rpm · {number(program.durationSeconds)} giây</span><small>{done ? 'Đã chạy' : 'Chưa chạy'}</small></li>
    })}</ol></section>
    <section><h3>Kết quả từng cốc</h3><p className={styles.note}>Hiệu suất đối chiếu được tính từ số đo hợp lệ. Sai lệch đáp số tính bằng điểm phần trăm.</p>
      <div className={styles.tableScroll} tabIndex={0} aria-label="Bảng đối chiếu kết quả"><table aria-label="Kết quả từng cốc"><thead><tr><th>Cốc</th><th>pH đầu</th><th>Liều (mg/L)</th><th>NTU cuối</th><th>Hiệu suất</th><th>Tự tính</th><th>Sai lệch</th><th>Đánh giá</th></tr></thead><tbody>{report.cups.map(cup => {
        const valid = cup.measurements.filter(reading => reading.valid).at(-1)
        const delta = cup.measuredRemovalPercent === null || cup.submittedRemovalPercent === null ? null : Math.abs(cup.measuredRemovalPercent - cup.submittedRemovalPercent)
        return <tr key={cup.id} data-chosen={cup.id === report.selectedCupId}><th scope="row">Cốc {cup.id}{cup.id === report.selectedCupId && <small>Đã chọn</small>}</th><td>{cup.initialPh}</td><td>{cup.doseMgL}</td><td>{ntu(valid)}</td><td>{percent(cup.measuredRemovalPercent)}</td><td>{cup.submittedRemovalPercent === null ? 'Chưa ghi' : percent(cup.submittedRemovalPercent)}</td><td>{delta === null ? 'N/A' : number(delta) + ' điểm %'}</td><td>{cup.meetsTarget === null ? 'Thiếu số đo' : cup.meetsTarget ? 'Đạt mức giảm đục' : 'Dưới mục tiêu'}<small>{cup.arithmeticCorrect === null ? 'Chưa đánh giá đáp số' : cup.arithmeticCorrect ? 'Tính đúng' : 'Cần tính lại'}</small></td></tr>
      })}</tbody></table></div>
      {!report.cups.length && <p>Bài được nộp khi chưa chuẩn bị cốc nào.</p>}
    </section>
    <section className={styles.feedback}><h3>Những điểm cần xem lại</h3>
      {!report.selectedCupId && <p className={styles.warning}>Chưa chọn cốc làm phương án nộp. Không thể đánh giá kết quả chung của bài.</p>}
      {!report.initialMeasurement?.valid && <p className={styles.warning}>Thiếu số đo mẫu ban đầu hợp lệ. Không có cơ sở tính hiệu suất từ số đo.</p>}
      {!report.diagnostics.length && report.goalStatus.goalMet && <p>Phương án đã chọn đạt mục tiêu và đáp số nằm trong sai số cho phép.</p>}
      {report.cups.map(cup => {
        const diagnostics = report.diagnostics.filter(item => item.cupId === cup.id)
        const early = cup.measurements.filter(m => !m.valid)
        const valid = cup.measurements.filter(m => m.valid && m.valueNtu !== null).at(-1)
        if (!diagnostics.length && !(early.length && valid)) return null
        return <article key={cup.id}><h4>Cốc {cup.id}</h4>{early.length > 0 && valid && <p>Đã đo lại hợp lệ ở thao tác #{valid.sequence}. Lần đo sớm {early.map(m => '#' + m.sequence).join(', ')} chưa đủ quy trình; báo cáo dùng số đo hợp lệ sau đó.</p>}<ul>{diagnostics.map(item => <li key={item.code}><strong>{DIAGNOSTICS[item.code][0]}</strong><p>{DIAGNOSTICS[item.code][1]}</p>
          {item.code === 'INVALID_FINAL_READING' && <p>Ở bước 5 · Đo cuối: {cup.measurements.filter(m => !m.valid).map(m => 'thao tác #' + m.sequence).join(', ')} được thực hiện khi chưa đủ quy trình.</p>}
          {item.code === 'NO_FINAL_READING' && <p>Bước 5 · Đo cuối: chưa có số đo để đối chiếu.</p>}
          {item.code === 'MISSING_CALCULATION' && <p>Bước 6 · Tính và ghi: chưa lưu đáp số của cốc này.</p>}
          {item.code === 'INCORRECT_CALCULATION' && cup.measuredRemovalPercent !== null && cup.submittedRemovalPercent !== null && <p>Bước 6 · Tính và ghi: bạn nộp {percent(cup.submittedRemovalPercent)}, đối chiếu từ số đo là {percent(cup.measuredRemovalPercent)}; lệch {number(Math.abs(cup.submittedRemovalPercent - cup.measuredRemovalPercent))} điểm %.</p>}
          {item.code === 'BELOW_TARGET' && <p>Bước 2–3 · Chọn pH và liều: đây là kết quả của điều kiện đã thử, chưa đủ để khẳng định riêng liều phèn quá thấp hoặc quá cao.</p>}
        </li>)}</ul></article>
      })}
      <p className={styles.note}>Sai số đáp số cho phép: ±{number(report.reference.answerTolerancePercentagePoints)} điểm %. Báo cáo không quy nguyên nhân cho một thao tác cụ thể khi dữ liệu chưa đủ để kết luận.</p>
    </section>
    <details className={styles.details}><summary>Phép đo & thông tin lượt đã lưu</summary>
      <p>Đã lưu báo cáo lúc {report.generatedAt.toLocaleString('vi-VN')}. Lượt chỉ đọc.</p>
      <dl className={styles.summary}><div><dt>Mẫu đã sử dụng</dt><dd>{number(report.resources.waterLiters)} L</dd></div><div><dt>Thao tác đã lưu</dt><dd>{report.resources.operationCount}</dd></div><div><dt>Phèn nhôm</dt><dd>{report.resources.reagents.alum ? number(report.resources.reagents.alum.amount) + ' ' + report.resources.reagents.alum.unit : '0 g'}</dd></div></dl>
      <p>Mẫu ban đầu: {ntu(report.initialMeasurement)} NTU{report.initialMeasurement ? ' · Thao tác #' + report.initialMeasurement.sequence : ' · Chưa đo'}.</p>
      {report.cups.map(cup => <div key={cup.id}><h4>Cốc {cup.id} · Các phép đo cuối</h4>{cup.measurements.length ? <ul>{cup.measurements.map(reading => <li key={reading.id}>Thao tác #{reading.sequence} · {number(reading.elapsedSeconds)} giây mô phỏng · {ntu(reading)} NTU · {reading.valid ? 'Hợp lệ' : 'Không hợp lệ: chưa đủ quy trình'}</li>)}</ul> : <p>Chưa thực hiện phép đo.</p>}</div>)}
      <p className={styles.note}>Hồ sơ mô hình: {report.versions.profileId} · {report.versions.profileVersion}. Mô phỏng học tập với mẫu kaolin và phèn nhôm; kết quả không chứng nhận nước an toàn để uống hay xả thải.</p>
    </details>
  </CompletionDialog>
}
