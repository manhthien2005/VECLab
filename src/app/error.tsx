'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { APP_STRINGS } from '@/content/index.js'

/**
 * Route-level error boundary (web scope §11.2).
 *
 * §11.2 is specific about what an unrecoverable model or render failure must do: do NOT
 * show fabricated numbers, do NOT keep stale ones on screen without warning, and DO say
 * what went wrong. This boundary replaces the failed subtree entirely, so no half-rendered
 * panel with a previous action's values can survive a throw.
 *
 * WHY `reset` IS OFFERED. Many failures here are transient — a store read that timed out,
 * a chunk that failed to load. `reset()` re-renders the segment without a full page load,
 * which for the workbench means the attempt is re-opened from storage rather than a new
 * one being created. A plain reload would also work but is slower and loses the URL's
 * `?attempt=` only if the learner edits it.
 *
 * The digest is shown deliberately. In production React strips the message from the
 * client, so the digest is the only handle a learner can quote when reporting a problem;
 * without it "Đã xảy ra lỗi" is unactionable for whoever has to look at the logs.
 */

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // The server log has the stack for a server component throw, but a client-side throw
    // reaches nothing unless it is logged here.
    console.error('[veclab] route error', error)
  }, [error])

  return (
    <div className="page page-narrow stack-loose rise">
      <header className="stack">
        <p className="eyebrow">Lỗi ứng dụng</p>
        <h1>{APP_STRINGS.errors.genericTitle}</h1>
        <p className="lede">
          Màn hình này không hiển thị được. Không có số liệu nào được tạo ra từ lần chạy
          hỏng, và thao tác chưa lưu thì chưa được ghi — dữ liệu đã lưu trước đó vẫn
          nguyên vẹn.
        </p>
      </header>

      <div className="row">
        <button className="btn btn-primary" type="button" onClick={reset}>
          Thử hiển thị lại
        </button>
        <Link className="btn" href="/lab">
          {APP_STRINGS.nav.lab}
        </Link>
        <Link className="btn btn-ghost" href="/">
          {APP_STRINGS.errors.backHome}
        </Link>
      </div>

      {error.digest !== undefined && (
        <p className="alert alert-info small">
          Mã sự cố: <code>{error.digest}</code> — kèm mã này khi báo lỗi để đối chiếu
          được với nhật ký máy chủ.
        </p>
      )}
    </div>
  )
}
