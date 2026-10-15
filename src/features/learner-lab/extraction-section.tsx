'use client'
import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { GuestAttemptRepository } from '@/application/attempts/guest-repository.js'
import type { ExtractionState } from '@/domain/experiments/acid-base-extraction/model.js'
import type { UUID } from '@/domain/process/contracts.js'
import { formatRelativeDate } from '@/shared/ui/format.js'
import { ArrowRightIcon } from '@/features/landing/icons.js'
import styles from './extraction-section.module.css'
import { listExtractionLabRows, removeExtractionLabAttempt, type ExtractionLabRow } from './extraction-attempts.js'

type LoadState = { kind:'loading' } | { kind:'error' } | { kind:'ready'; rows:ExtractionLabRow[] }
export function ExtractionLabSection() {
  const repository = useMemo(() => new GuestAttemptRepository<ExtractionState>(), [])
  const [state, setState] = useState<LoadState>({kind:'loading'})
  const [deleting, setDeleting] = useState<UUID|null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    const read = () => void listExtractionLabRows(repository).then(rows => {if(active)setState({kind:'ready', rows})}).catch(() => {if(active)setState({kind:'error'})})
    read()
    const onReturn = () => {if(document.visibilityState === 'visible')read()}
    window.addEventListener('focus', onReturn)
    document.addEventListener('visibilitychange', onReturn)
    return () => {active=false; window.removeEventListener('focus',onReturn); document.removeEventListener('visibilitychange',onReturn)}
  }, [repository])
  async function remove(id:UUID) {
    if(deleting || !confirm('Xóa lượt chiết tách này? Thao tác không thể hoàn tác.'))return
    setDeleting(id); setError('')
    try {await removeExtractionLabAttempt(repository,id);setState({kind:'ready',rows:await listExtractionLabRows(repository)})}
    catch {setError('Chưa xóa được lượt. Dữ liệu vẫn được giữ; hãy thử lại.')}
    finally {setDeleting(null)}
  }
  return <section className="learner-lab-group" aria-labelledby="extraction-lab-heading">
    <div className="learner-lab-group-heading"><div><h2 id="extraction-lab-heading">Chiết tách axit–bazơ{state.kind==='ready'&&<span>{state.rows.length}</span>}</h2><p>Mẫu chuẩn A/B/N · Lượt thực hành trên trình duyệt này.</p></div><Link className={styles.start} href="/simulate/acid-base-extraction">Bắt đầu lượt mới <ArrowRightIcon/></Link></div>
    {error&&<p role="alert">{error}</p>}
    {state.kind==='loading'?<p role="status">Đang đọc các lượt chiết tách…</p>:state.kind==='error'?<p role="alert">Chưa đọc được lượt chiết tách. <button type="button" onClick={()=>location.reload()}>Tải lại</button></p>:!state.rows.length?<p>Chưa có lượt chiết tách. Chọn “Bắt đầu lượt mới” để thực hành.</p>:<div className="learner-lab-attempts">{state.rows.map(row=>{
      const href='/simulate/acid-base-extraction?attempt='+encodeURIComponent(row.attemptId), completed=row.status==='completed', projection=row.projection
      return <article className="learner-lab-attempt" key={row.attemptId} aria-label={'Lượt chiết tách '+row.attemptId}>
        <div className="learner-lab-attempt-top"><div className="learner-lab-attempt-image"><Image src="/assets/experiments/extraction.svg" alt="" fill sizes="96px"/></div><div className="learner-lab-attempt-title"><span className={'learner-lab-status is-'+row.status}>{completed?'Đã hoàn thành':row.status==='stopped'?'Đã dừng':'Đang thực hành'}</span><h3>{projection?<Link href={href}>Chiết tách axit–bazơ</Link>:'Chiết tách axit–bazơ'}</h3><p>Cập nhật {formatRelativeDate(row.updatedAt)}</p></div></div>
        <dl className="learner-lab-attempt-facts"><div><dt>Thao tác đã lưu</dt><dd>{projection?.history.length??'N/A'}</dd></div><div><dt>Phép đo</dt><dd>{projection?.readings.length??'N/A'}</dd></div><div><dt>Sản phẩm khai báo</dt><dd>{projection?Object.keys(projection.submissions).length+' / 3':'N/A'}</dd></div><div><dt>Phạm vi</dt><dd>Mẫu chuẩn A/B/N</dd></div></dl>
        <div className="learner-lab-attempt-version">Lưu trên trình duyệt · <span>{row.scenarioReleaseId}</span></div>
        {!projection&&<p role="alert">Phiên bản hoặc dữ liệu chưa được hỗ trợ. Lượt đã lưu được giữ nguyên.</p>}
        <div className="learner-lab-attempt-actions">{projection&&<><Link className="btn experiment-library-start" href={href+(completed?'&view=report':'')}>{completed?'Xem báo cáo':'Tiếp tục thực hành'}<ArrowRightIcon/></Link><Link className="learner-lab-view" href={href+'&view=notebook'}>Xem sổ đo</Link></>}<button className="learner-lab-delete" type="button" disabled={deleting!==null} onClick={()=>void remove(row.attemptId)} aria-label={'Xóa lượt chiết tách '+row.attemptId}>{deleting===row.attemptId?'Đang xóa…':'Xóa'}</button></div>
      </article>
    })}</div>}
  </section>
}
