'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { GuestAttemptRepository } from '@/application/attempts/guest-repository.js'
import type { PlasticSeparationState } from '@/domain/experiments/virgin-plastic-separation/model.js'
import { formatRelativeDate } from '@/shared/ui/format.js'
import { ArrowRightIcon } from '@/features/landing/icons.js'
import { plasticStageLabel } from '@/features/plastic-separation/readouts.js'
import { listPlasticLabRows, type PlasticLabRow } from './plastic-attempts.js'
import styles from './extraction-section.module.css'

export function PlasticLabSection() {
  const repository = useMemo(() => new GuestAttemptRepository<PlasticSeparationState>(), [])
  const [rows, setRows] = useState<PlasticLabRow[] | null>(null)
  const [error, setError] = useState(false)
  useEffect(() => {
    let active = true
    const read = () => void listPlasticLabRows(repository).then(value => { if (active) { setRows(value); setError(false) } }).catch(() => { if (active) setError(true) })
    read()
    const onReturn = () => { if (document.visibilityState === 'visible') read() }
    window.addEventListener('focus', onReturn)
    document.addEventListener('visibilitychange', onReturn)
    return () => { active = false; window.removeEventListener('focus', onReturn); document.removeEventListener('visibilitychange', onReturn) }
  }, [repository])
  return <section className="learner-lab-group" aria-label="Phân loại nhựa nguyên sinh">
    <div className="learner-lab-group-heading"><div><h2>Phân loại nhựa nguyên sinh</h2><p>Sáu mẫu · Hai nhánh dung dịch · Lưu trên trình duyệt này.</p></div><Link className={styles.start} href="/simulate/plastic-density-separation">Bắt đầu lượt mới <ArrowRightIcon /></Link></div>
    {error ? <p role="alert">Chưa đọc được các lượt đã lưu. <button type="button" onClick={() => location.reload()}>Tải lại</button></p> : rows === null ? <p role="status">Đang đọc các lượt phân loại nhựa…</p> : !rows.length ? <p>Chưa có lượt phân loại nhựa. Chọn “Bắt đầu lượt mới” để thực hành.</p> : <div className="learner-lab-attempts">{rows.map(row => {
      const href = '/simulate/plastic-density-separation?attempt=' + encodeURIComponent(row.attemptId)
      const completed = row.status === 'completed', p = row.projection
      return <article className="learner-lab-attempt" key={row.attemptId} aria-label={'Lượt phân loại nhựa ' + row.attemptId}>
        <div className="learner-lab-attempt-top"><div className="learner-lab-attempt-image"><Image src="/assets/experiments/plastic-density-separation.webp" alt="" fill sizes="96px" /></div><div className="learner-lab-attempt-title"><span className={'learner-lab-status is-' + row.status}>{completed ? 'Đã nộp' : row.status === 'stopped' ? 'Đã dừng' : 'Đang thực hành'}</span><h3>{p ? <Link href={href}>Phân loại nhựa nguyên sinh</Link> : 'Phân loại nhựa nguyên sinh'}</h3><p>Cập nhật {formatRelativeDate(row.updatedAt)}</p></div></div>
        <dl className="learner-lab-attempt-facts"><div><dt>Giai đoạn</dt><dd>{p ? plasticStageLabel(p.stage) : 'Chưa hỗ trợ'}</dd></div><div><dt>Bước tách đã ghi nhận</dt><dd>{p?.outcomesHistory.length ?? '—'}</dd></div><div><dt>Nhánh hoàn tất</dt><dd>{p ? p.completedBranches.length + ' / 2' : '—'}</dd></div><div><dt>Phạm vi</dt><dd>Sáu nhựa nguyên sinh</dd></div></dl>
        <div className="learner-lab-attempt-version">Lưu trên trình duyệt · <span>{row.scenarioReleaseId}</span></div>
        {!p && <p role="alert">Phiên bản hoặc dữ liệu chưa được hỗ trợ. Lượt đã lưu được giữ nguyên.</p>}
        {p && <div className="learner-lab-attempt-actions"><Link className="btn experiment-library-start" href={href + (completed ? '&view=report' : '')}>{completed ? 'Xem báo cáo' : row.status === 'stopped' ? 'Xem lượt đã dừng' : 'Tiếp tục thực hành'}<ArrowRightIcon /></Link><Link className="learner-lab-view" href={href + '&view=notebook'}>Xem sổ thực hành</Link></div>}
      </article>
    })}</div>}
  </section>
}
