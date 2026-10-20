'use client'
import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { GuestAttemptRepository } from '@/application/attempts/guest-repository.js'
import type { SoapState } from '@/domain/experiments/soap/model.js'
import type { UUID } from '@/domain/process/contracts.js'
import { formatRelativeDate } from '@/shared/ui/format.js'
import { ArrowRightIcon } from '@/features/landing/icons.js'
import styles from './extraction-section.module.css'
import { listSoapLabRows, removeSoapLabAttempt, type SoapLabRow } from './soap-attempts.js'

type LoadState = { kind: 'loading' } | { kind: 'error' } | { kind: 'ready'; rows: SoapLabRow[] }

export function SoapLabSection() {
  const repository = useMemo(() => new GuestAttemptRepository<SoapState>(), [])
  const [state, setState] = useState<LoadState>({ kind: 'loading' })
  const [deleting, setDeleting] = useState<UUID | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    const read = () => void listSoapLabRows(repository).then((rows) => { if (active) setState({ kind: 'ready', rows }) }).catch(() => { if (active) setState({ kind: 'error' }) })
    read()
    const onReturn = () => { if (document.visibilityState === 'visible') read() }
    window.addEventListener('focus', onReturn)
    document.addEventListener('visibilitychange', onReturn)
    return () => { active = false; window.removeEventListener('focus', onReturn); document.removeEventListener('visibilitychange', onReturn) }
  }, [repository])
  async function remove(id: UUID) {
    if (deleting || !confirm('Xóa lượt xà phòng này?')) return
    setDeleting(id); setError('')
    try {
      await removeSoapLabAttempt(repository, id)
      setState({ kind: 'ready', rows: await listSoapLabRows(repository) })
    } catch { setError('Chưa xóa được lượt.') }
    finally { setDeleting(null) }
  }
  return <section className="learner-lab-group" aria-labelledby="soap-lab-heading">
    <div className="learner-lab-group-heading"><div><h2 id="soap-lab-heading">Xà phòng hóa{state.kind === 'ready' && <span>{state.rows.length}</span>}</h2><p>Cold process · Lượt trên trình duyệt này.</p></div>
      <Link className={styles.start} href="/simulate/cold-process-soap">Bắt đầu lượt mới <ArrowRightIcon /></Link></div>
    {error && <p role="alert">{error}</p>}
    {state.kind === 'loading' ? <p role="status">Đang đọc các lượt xà phòng…</p>
      : state.kind === 'error' ? <p role="alert">Chưa đọc được lượt xà phòng.</p>
        : !state.rows.length ? <p>Chưa có lượt. Chọn “Bắt đầu lượt mới”.</p>
          : <div className="learner-lab-attempts">{state.rows.map((row) => {
            const href = '/simulate/cold-process-soap?attempt=' + encodeURIComponent(row.attemptId)
            const completed = row.status === 'completed'
            return <article className="learner-lab-attempt" key={row.attemptId}>
              <div className="learner-lab-attempt-top">
                <div className="learner-lab-attempt-image"><Image src="/assets/experiments/soap.jpg" alt="" fill sizes="96px" /></div>
                <div className="learner-lab-attempt-title">
                  <span className={'learner-lab-status is-' + row.status}>{completed ? 'Đã hoàn thành' : row.status === 'stopped' ? 'Đã dừng' : 'Đang thực hành'}</span>
                  <h3>{row.projection ? <Link href={href}>Xà phòng hóa</Link> : 'Xà phòng hóa'}</h3>
                  <p>Cập nhật {formatRelativeDate(row.updatedAt)}</p>
                </div>
              </div>
              <dl className="learner-lab-attempt-facts">
                <div><dt>Pha</dt><dd>{row.projection?.phase ?? 'N/A'}</dd></div>
                <div><dt>Mẫu thử</dt><dd>{row.projection?.samples.length ?? 'N/A'}</dd></div>
                <div><dt>Kết quả</dt><dd>{row.projection?.grade ?? 'N/A'}</dd></div>
              </dl>
              <div className="learner-lab-attempt-actions">
                {row.projection && <Link className="btn experiment-library-start" href={href + (completed ? '&view=report' : '')}>{completed ? 'Xem báo cáo' : 'Tiếp tục'}<ArrowRightIcon /></Link>}
                <button className="learner-lab-delete" type="button" disabled={deleting !== null} onClick={() => void remove(row.attemptId)}>{deleting === row.attemptId ? 'Đang xóa…' : 'Xóa'}</button>
              </div>
            </article>
          })}</div>}
  </section>
}
