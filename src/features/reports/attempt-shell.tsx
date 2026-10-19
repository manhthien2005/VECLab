'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { GuestAttemptRepository } from '@/application/attempts/guest-repository.js'
import { parseUUID } from '@/shared/ids.js'
import { savedAttemptHref } from './saved-attempt-route.js'

type State = 'loading' | 'missing' | 'retired' | 'error'

/** Compatibility entry for saved links; the lesson owns replay and its report. */
export function AttemptShell({ attemptId, view }: { attemptId: string; view: 'attempt' | 'report' }) {
  const router = useRouter()
  const [state, setState] = useState<State>('loading')
  const id = parseUUID(attemptId)
  useEffect(() => {
    if (id === null) return
    let cancelled = false
    void new GuestAttemptRepository<unknown>().getAttempt(id).then(attempt => {
      if (cancelled) return
      if (attempt === null) { setState('missing'); return }
      const href = savedAttemptHref(attempt.scenarioKey, id, view, attempt.scenarioReleaseId)
      if (href === null) { setState('retired'); return }
      router.replace(href)
    }).catch(() => { if (!cancelled) setState('error') })
    return () => { cancelled = true }
  }, [id, router, view])

  const status = id === null ? 'missing' : state
  if (status === 'loading') return <div className="page stack"><p role="status">Đang mở lượt thực hành…</p></div>
  const message = status === 'retired'
    ? 'Bài thí nghiệm hoặc phiên bản của lượt này chưa được hỗ trợ. Dữ liệu đã lưu vẫn được giữ trên trình duyệt này. Về Lab để mở các lượt thuộc bài đang phục vụ.'
    : status === 'error'
      ? 'Chưa đọc được dữ liệu trên trình duyệt này. Hãy tải lại trang để thử lại.'
      : 'Không tìm thấy lượt thực hành trên trình duyệt này. Hãy mở bằng trình duyệt đã lưu lượt hoặc chọn bài để bắt đầu.'
  return <section className="page-narrow stack">
    <h1>{status === 'retired' ? 'Bài thí nghiệm đã ngừng phục vụ' : 'Chưa mở được lượt thực hành'}</h1>
    <p role="status">{message}</p>
    {status === 'error' && <button type="button" className="btn" onClick={() => window.location.reload()}>Tải lại trang</button>}
    <p className="row"><Link className="btn btn-primary" href="/lab">Về lab</Link><Link className="btn btn-ghost" href="/experiments">Chọn thí nghiệm</Link></p>
  </section>
}
