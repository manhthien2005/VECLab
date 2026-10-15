import { useState } from 'react'
import type { JarSessionView } from '@/application/simulation/jar-session.js'
import type { JarCupId } from '@/domain/experiments/jar-test/model.js'
import { JAR_CUP_IDS, JAR_PROFILE } from '@/domain/experiments/jar-test/model.js'
import { GuideIcon, ReportIcon } from '@/features/workbench/icons.js'
import { JarHistory } from './history.js'
import styles from './notebook.module.css'

const number = (value: number) => value.toLocaleString('vi-VN', { maximumFractionDigits: 4 })
export function JarNotebook({ view, selected, drafts, busy, onSelect, onBaseline, onReport }: {
  view: JarSessionView; selected: JarCupId; drafts: Partial<Record<JarCupId, string>>
  busy: boolean
  onSelect: (id: JarCupId) => void; onBaseline: () => void; onReport: () => void
}) {
  const [historyOpen, setHistoryOpen] = useState(false)
  const p = view.projection, initial = p.initialMeasurement, done = view.status === 'completed'
  const measured = p.cups.filter(c => c.measurements.some(m => m.valid && m.valueNtu !== null)).length
  const recorded = p.cups.filter(c => c.submittedRemovalPercent !== null).length
  return <>
    <header className={styles.heading}><h2>Sổ thực hành</h2><span data-testid="jar-revision">Bản lưu {view.revision}</span></header>
    <div className={styles.overview}>
      <section className={styles.baseline} aria-label="Số đo mẫu ban đầu">
        <h3><GuideIcon />Mẫu ban đầu · Dùng chung cho cả mẻ</h3>
        <strong className={styles.initialValue} data-testid="jar-initial-ntu">{initial?.valid && initial.valueNtu !== null ? number(initial.valueNtu) + ' NTU' : initial ? 'N/A' : 'Chưa đo'}</strong>
        <p>{initial ? `Đã lưu ở thao tác #${initial.sequence}. Dùng số đo này để tính hiệu suất từng cốc.` : 'Đo độ đục mẫu chưa xử lý ở bước đầu tiên trong bảng Thao tác.'}</p>
        {!initial && !done && <button type="button" onClick={onBaseline}>Đến bước đo mẫu đầu</button>}
      </section>
      <section className={styles.progress} aria-label="Dữ liệu đã ghi"><h3><ReportIcon />Dữ liệu của mẻ</h3>
        <dl><div><dt>Cốc đã chuẩn bị</dt><dd>{p.cups.length}</dd></div><div><dt>Đã đo cuối hợp lệ</dt><dd>{measured}/{p.cups.length}</dd></div><div><dt>Đã ghi đáp số</dt><dd>{recorded}/{p.cups.length}</dd></div></dl>
        <p>Phương án nộp: <strong>{p.selectedCupId ? 'Cốc ' + p.selectedCupId : 'Chưa chọn'}</strong></p>
      </section>
    </div>
    <section className={styles.cups} aria-label="Thiết kế và số đo từng cốc"><h3>Thiết kế & số đo từng cốc</h3>
      <div className={styles.tableScroll} tabIndex={0} role="region" aria-label="Bảng số liệu sáu cốc"><table>
        <caption>Chỉ có phép đo đã thực hiện. Chưa đo và N/A đều không phải 0.</caption>
        <thead><tr><th>Cốc</th><th>pH đầu</th><th>Tổng liều (mg/L)</th><th>Độ đục cuối</th><th>Đáp số đã ghi (%)</th><th>Cần thực hiện</th></tr></thead>
        <tbody>{JAR_CUP_IDS.map(id => {
          const cup = p.cups.find(c => c.id === id), last = cup?.measurements.at(-1)
          const draft = drafts[id], unsaved = draft !== undefined && (draft.trim() === '' ? cup?.submittedRemovalPercent != null : Number(draft) !== cup?.submittedRemovalPercent)
          const needed = !cup ? 'Chưa chuẩn bị' : p.phase === 'setup' ? cup.doseMgL < JAR_PROFILE.minDoseMgL ? 'Cấp phèn trước khi chạy mẻ' : 'Sẵn sàng chạy mẻ' : !last ? 'Đo độ đục cuối' : !last.valid ? 'Đo lại sau khi lắng' : cup.submittedRemovalPercent === null ? 'Tính và ghi đáp số' : 'Đủ số liệu'
          return <tr key={id} data-selected={selected === id}><th scope="row"><button type="button" disabled={busy} onClick={() => onSelect(id)} aria-label={'Cốc ' + id + ' — chọn từ sổ đo'}>Cốc {id}</button>{p.selectedCupId === id && <small>Phương án nộp</small>}</th>
            <td>{cup?.initialPh ?? '—'}</td><td>{cup?.doseMgL ?? '—'}</td>
            <td>{!cup ? '—' : !last ? 'Chưa đo' : last.valid && last.valueNtu !== null ? number(last.valueNtu) + ' NTU' : 'N/A'}{last && <small>#{last.sequence}{!last.valid && ' · Chưa đủ quy trình'}</small>}</td>
            <td>{cup?.submittedRemovalPercent == null ? 'Chưa ghi' : number(cup.submittedRemovalPercent)}{unsaved && <small className={styles.draft}>Có bản nháp chưa ghi</small>}</td><td>{needed}</td>
          </tr>
        })}</tbody>
      </table></div>
      <p className={styles.note}>{done ? 'Số liệu đã nộp · Lượt chỉ đọc.' : 'Bạn tự tính đáp số. Phần đối chiếu chỉ xuất hiện sau khi nộp.'}</p>
    </section>
    <details className={styles.history} onToggle={e => setHistoryOpen(e.currentTarget.open)}><summary>Lịch sử thao tác</summary>
      {historyOpen && (view.storageMode === 'local' ? <JarHistory attemptId={view.attemptId} revision={view.revision} /> : <p>Lịch sử tài khoản chưa được hỗ trợ trên màn này.</p>)}
    </details>
    {done && <section className={styles.completed} aria-label="Kết quả lưu sau khi hoàn thành"><h2>Đã hoàn thành và lưu lượt</h2><p>Đã lưu {p.cups.length} cốc cùng số đo và đáp số đã ghi.</p><button type="button" onClick={onReport}>Xem báo cáo & đối chiếu đáp số</button></section>}
  </>
}
