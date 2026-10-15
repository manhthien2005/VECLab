'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { GuestAttemptRepository } from '@/application/attempts/guest-repository.js'
import { createJarSession } from '@/application/simulation/jar-session.js'
import type { JarReportSnapshot } from '@/application/scenarios/jar-projection.js'
import type { JarState } from '@/domain/experiments/jar-test/model.js'
import type { UUID } from '@/domain/process/contracts.js'
import { listJarLabRows, type JarLabRow } from '@/features/learner-lab/jar-attempts.js'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs.js'
import { ScienceBackdrop } from '@/shared/ui/science-backdrop.js'
import { formatRelativeDate } from '@/shared/ui/format.js'
import { jarComparisonProblem, selectedJarResult } from './jar-comparison.js'
import styles from '@/features/account/learner-pages.module.css'

type Side = 'a' | 'b'
type Loaded = { kind: 'idle' | 'loading' } | { kind: 'error'; message: string } | { kind: 'ready'; report: JarReportSnapshot }
const number = (value: number | null, unit = '') => value === null ? 'N/A' : `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 4 }).format(value)}${unit ? ' ' + unit : ''}`

export function CompareClient() {
  const repository = useMemo(() => new GuestAttemptRepository<JarState>(), [])
  const session = useMemo(() => createJarSession(repository), [repository])
  const [list, setList] = useState<JarLabRow[] | null>(null)
  const [listError, setListError] = useState(false)
  const [retry, setRetry] = useState(0)
  const [chosen, setChosen] = useState({ a: '', b: '' })
  const [sides, setSides] = useState<Record<Side, Loaded>>({ a: { kind: 'idle' }, b: { kind: 'idle' } })
  const requests = useRef({ a: 0, b: 0 })
  useEffect(() => {
    let cancelled = false
    void listJarLabRows(repository).then(rows => {
      if (!cancelled) { setList(rows.filter(row => row.status === 'completed')); setListError(false) }
    }).catch(() => { if (!cancelled) setListError(true) })
    return () => { cancelled = true }
  }, [repository, retry])

  async function choose(side: Side, id: string) {
    const request = ++requests.current[side]
    setChosen(current => ({ ...current, [side]: id }))
    setSides(current => ({ ...current, [side]: { kind: id ? 'loading' : 'idle' } }))
    if (!id) return
    let result: Loaded
    try {
      const loaded = await session.load(id as UUID)
      result = loaded?.ok && loaded.state.status === 'completed' && loaded.state.report
        ? { kind: 'ready', report: loaded.state.report }
        : { kind: 'error', message: 'Lượt này không còn khả dụng hoặc không có báo cáo hợp lệ. Hãy chọn lượt khác.' }
    } catch {
      result = { kind: 'error', message: 'Chưa đọc được báo cáo. Hãy chọn lại lượt thực hành.' }
    }
    if (requests.current[side] === request) setSides(current => ({ ...current, [side]: result }))
  }

  const a = sides.a.kind === 'ready' ? sides.a.report : null
  const b = sides.b.kind === 'ready' ? sides.b.report : null
  const problem = a && b ? jarComparisonProblem(chosen.a, a, chosen.b, b) : null
  return <div className={`page stack ${styles.page}`}>
    <ScienceBackdrop />
    <Breadcrumbs items={[{ label: 'Trang chủ', href: '/' }, { label: 'So sánh' }]} />
    <header className={styles.heading}><div><h1>So sánh lượt Jar Test</h1><p>Đối chiếu điều kiện đã chọn, số đo và kết quả của hai lượt đã nộp.</p></div><Link className="btn" href="/lab">Về phòng lab</Link></header>
    <p className={styles.notice}>Danh sách lấy từ trình duyệt này, kể cả khi bạn đã đăng nhập. Chỉ so sánh báo cáo cùng phiên bản mô phỏng.</p>
    {listError ? <div role="alert" className="alert alert-danger">Chưa đọc được các lượt đã lưu. <button className="btn btn-sm" onClick={() => setRetry(value => value + 1)}>Thử lại</button></div>
      : list === null ? <p role="status">Đang đọc các lượt đã lưu…</p>
      : list.length < 2 ? <section className={styles.panel}><h2>Cần hai lượt đã nộp để so sánh</h2><p>Hiện có {list.length} lượt Jar Test đã nộp trên trình duyệt này.</p><Link className="btn btn-primary" href="/simulate/jar-test">Thực hành Jar Test</Link></section>
      : <>
        <section className={styles.panel}><h2>Chọn lượt thực hành</h2><div className={styles.grid}>{(['a', 'b'] as const).map(side => <div className="field" key={side}><label htmlFor={`compare-${side}`}>Lượt {side.toUpperCase()}</label><select id={`compare-${side}`} value={chosen[side]} onChange={event => void choose(side, event.target.value)}><option value="">Chọn một lượt đã nộp</option>{list.map(row => <option value={row.attemptId} key={row.attemptId}>{formatRelativeDate(row.updatedAt)} · {row.attemptId.slice(0, 8)}</option>)}</select></div>)}</div></section>
        {(['a', 'b'] as const).map(side => sides[side].kind === 'error' ? <p key={side} role="alert" className="alert alert-danger">Lượt {side.toUpperCase()}: {(sides[side] as { message: string }).message}</p> : null)}
        {sides.a.kind === 'loading' || sides.b.kind === 'loading' ? <p role="status">Đang đọc báo cáo…</p> : null}
        {problem ? <p className="alert alert-warn" role="status">{problem}</p> : null}
        {a && b && <div className={styles.grid}>{([['a', a], ['b', b]] as const).map(([side, report]) => <article className={styles.result} key={side}><h3>Lượt {side.toUpperCase()} · {chosen[side].slice(0, 8)}</h3><dl><dt>Số cốc đã chuẩn bị</dt><dd>{report.cups.length}</dd><dt>Phương án đã chọn</dt><dd>{report.selectedCupId ? `Cốc ${report.selectedCupId}` : 'Chưa chọn'}</dd><dt>Mục tiêu bài học</dt><dd>{!report.goalStatus.evaluable ? 'Chưa đủ dữ liệu' : report.goalStatus.goalMet ? 'Đạt' : 'Chưa đạt'}</dd></dl><p><Link href={`/simulate/jar-test?attempt=${chosen[side]}&view=report`}>Xem báo cáo lượt {side.toUpperCase()}</Link></p></article>)}</div>}
        {a && b && !problem && <Comparison a={a} b={b} />}
      </>}
  </div>
}

function Comparison({ a, b }: { a: JarReportSnapshot; b: JarReportSnapshot }) {
  const x = selectedJarResult(a), y = selectedJarResult(b)
  const rows: [string, number | null, number | null, string][] = [
    ['pH ban đầu', x.ph, y.ph, ''], ['Tổng liều phèn', x.dose, y.dose, 'mg/L'],
    ['Độ đục mẫu đầu đã đo', a.initialMeasurement?.valid ? a.initialMeasurement.valueNtu : null, b.initialMeasurement?.valid ? b.initialMeasurement.valueNtu : null, 'NTU'],
    ['Độ đục cuối', x.finalNtu, y.finalNtu, 'NTU'], ['Hiệu suất từ số đo', x.removal, y.removal, '%'],
    ['Đáp số tự tính', x.answer, y.answer, '%'], ['Sai lệch đáp số', x.error, y.error, 'điểm %'],
    ['Tổng lượng phèn cả mẻ', a.resources.reagents.alum?.amount ?? null, b.resources.reagents.alum?.amount ?? null, 'g'],
    ['Nước mẫu cả mẻ', a.resources.waterLiters, b.resources.waterLiters, 'L'],
    ['Số thao tác cả mẻ', a.resources.operationCount, b.resources.operationCount, ''],
  ]
  return <section className={styles.panel}><p className="hint">Các thông số cốc lấy theo phương án đã chọn của từng lượt. N/A nghĩa là chưa chọn cốc hoặc chưa có dữ liệu hợp lệ. Lượng phèn và nước là tổng cả mẻ; cần xét số cốc khi đối chiếu.</p><div className={styles.tableWrap}><table className={styles.table}><caption>Kết quả và điều kiện thực hành</caption><thead><tr><th scope="col">Thông số</th><th scope="col">Lượt A</th><th scope="col">Lượt B</th></tr></thead><tbody>{rows.map(([label, av, bv, unit]) => <tr key={label}><th scope="row">{label}</th><td>{number(av, unit)}</td><td>{number(bv, unit)}</td></tr>)}</tbody></table></div></section>
}
