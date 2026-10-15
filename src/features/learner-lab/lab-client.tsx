'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { APP_STRINGS } from '@/content/index.js'
import type { UUID } from '@/domain/process/contracts.js'
import { GuestAttemptRepository } from '@/application/attempts/guest-repository.js'
import type { JarState } from '@/domain/experiments/jar-test/model.js'
import { listJarLabRows, removeJarLabAttempt, type JarLabRow } from './jar-attempts.js'
import { EXPERIMENT_OVERVIEWS } from '@/features/experiment-catalog/overviews.js'
import { ArrowRightIcon, FlaskIcon, GuestIcon, ShieldCheckIcon, WarningIcon } from '@/features/landing/icons.js'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs.js'
import { formatRelativeDate } from '@/shared/ui/format.js'

type StorageMode = 'local' | 'cloud'
type LoadState =
  | { kind: 'loading' }
  | { kind: 'ready'; rows: readonly JarLabRow[] }
  | { kind: 'error' }
type AttemptFilter = 'all' | JarLabRow['status']

const COMPLETED_LIMIT = 5
const FILTERS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'in_progress', label: 'Đang thực hành' },
  { key: 'completed', label: 'Đã hoàn thành' },
  { key: 'stopped', label: 'Đã dừng' },
] as const

/** Matches the current Jar workbench: browser storage, independent of sign-in status. */
export function LabClient({ storageMode }: { storageMode: StorageMode }) {
  const repository = useMemo(() => new GuestAttemptRepository<JarState>(), [])
  const [state, setState] = useState<LoadState>({ kind: 'loading' })
  const [filter, setFilter] = useState<AttemptFilter>('all')
  const [deleting, setDeleting] = useState<UUID | null>(null)
  const [deleteError, setDeleteError] = useState(false)
  const title = storageMode === 'local' ? APP_STRINGS.nav.labGuest : APP_STRINGS.lab.title

  const readRows = useCallback(async (): Promise<LoadState> => {
    try {
      return { kind: 'ready', rows: await listJarLabRows(repository) }
    } catch {
      // A failed read is not an empty lab. Keep a recoverable error state.
      return { kind: 'error' }
    }
  }, [repository])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const next = await readRows()
      if (!cancelled) setState(next)
    })()
    const refreshOnReturn = () => {
      if (document.visibilityState !== 'visible') return
      void readRows().then(next => { if (!cancelled) setState(next) })
    }
    window.addEventListener('focus', refreshOnReturn)
    document.addEventListener('visibilitychange', refreshOnReturn)
    return () => { cancelled = true; window.removeEventListener('focus', refreshOnReturn); document.removeEventListener('visibilitychange', refreshOnReturn) }
  }, [readRows])

  const refresh = async () => {
    setState({ kind: 'loading' })
    setState(await readRows())
  }

  const remove = async (attemptId: UUID) => {
    if (deleting !== null || !globalThis.confirm(APP_STRINGS.lab.confirmDelete)) return
    setDeleting(attemptId)
    setDeleteError(false)
    try {
      await removeJarLabAttempt(repository, attemptId)
      setState(await readRows())
    } catch {
      setDeleteError(true)
    } finally {
      setDeleting(null)
    }
  }

  const rows = state.kind === 'ready' ? state.rows : []
  const groups = [
    { status: 'in_progress', title: 'Đang thực hành', description: 'Mở lại và tiếp tục từ dữ liệu đã lưu.' },
    { status: 'completed', title: filter === 'all' ? 'Hoàn thành gần đây' : 'Đã hoàn thành', description: 'Xem kết quả cuối cùng và báo cáo của từng lượt.' },
    { status: 'stopped', title: 'Đã dừng', description: 'Các lượt đã kết thúc trước khi hoàn thành.' },
  ] as const

  return (
    <div className="page learner-lab">
      <LabBackground />
      <Breadcrumbs items={[{ label: 'Trang chủ', href: '/' }, { label: title }]} />
      <header className="learner-lab-header">
        <div><h1>{title}</h1><p>{APP_STRINGS.lab.lede}</p></div>
        <div className="row"><Link className="btn" href="/compare">So sánh lượt đã nộp</Link><Link className="btn experiment-library-start" href="/experiments">Chọn thí nghiệm <ArrowRightIcon /></Link></div>
      </header>
      <LabStorageNotice storageMode={storageMode} />

      {deleteError && <p className="learner-lab-error" role="alert">Chưa xóa được lượt thực hành. Dữ liệu vẫn hiển thị bên dưới; bạn có thể thử lại.</p>}

      {state.kind === 'loading' ? <LabSkeleton /> : state.kind === 'error' ? (
        <section className="learner-lab-empty" role="alert"><WarningIcon /><h2>Chưa đọc được các lượt đã lưu</h2><p>Không thể truy cập dữ liệu trên trình duyệt này. Kiểm tra quyền lưu dữ liệu rồi thử lại.</p><button className="btn experiment-library-start" type="button" onClick={() => void refresh()}>Thử lại</button></section>
      ) : rows.length === 0 ? (
        <section className="learner-lab-empty"><FlaskIcon /><h2>Chưa có lượt Jar Test</h2><p>Bắt đầu một mẻ để chuẩn bị mẫu, so sánh các cốc và ghi kết quả. Tiến độ được lưu trên trình duyệt này.</p><Link className="btn experiment-library-start" href="/simulate/jar-test">Bắt đầu Jar Test <ArrowRightIcon /></Link></section>
      ) : (
        <>
          <div className="learner-lab-filters" role="group" aria-label="Lọc theo trạng thái thực hành">
            {FILTERS.map(item => <button type="button" key={item.key} aria-pressed={filter === item.key} onClick={() => setFilter(item.key)}>{item.label}<span>{item.key === 'all' ? rows.length : rows.filter(row => row.status === item.key).length}</span></button>)}
          </div>
          {groups.filter(group => filter === 'all' || filter === group.status).map(group => {
            const matching = rows.filter(row => row.status === group.status)
            if (matching.length === 0) return null
            const visible = filter === 'all' && group.status === 'completed' ? matching.slice(0, COMPLETED_LIMIT) : matching
            return <section className="learner-lab-group" key={group.status} aria-labelledby={`lab-group-${group.status}`}>
              <div className="learner-lab-group-heading"><div><h2 id={`lab-group-${group.status}`}>{group.title}<span>{matching.length}</span></h2><p>{group.description}</p></div>{visible.length < matching.length && <button type="button" onClick={() => setFilter('completed')}>Xem tất cả <ArrowRightIcon /></button>}</div>
              <div className="learner-lab-attempts">{visible.map(row => <LabAttemptCard key={row.attemptId} row={row} onRemove={remove} deleting={deleting} />)}</div>
            </section>
          })}
          {filter !== 'all' && !rows.some(row => row.status === filter) && <div className="learner-lab-filter-empty"><p>Chưa có lượt nào ở trạng thái này.</p><button type="button" onClick={() => setFilter('all')}>Xem tất cả lượt thực hành</button></div>}
        </>
      )}
    </div>
  )
}

/** Auth/storage context is always visible, including loading, empty and error states. */
export function LabStorageNotice({ storageMode }: { storageMode: StorageMode }) {
  const local = storageMode === 'local'
  const Icon = local ? GuestIcon : ShieldCheckIcon
  return (
    <section className={`learner-lab-storage ${local ? 'is-local' : 'is-cloud'}`} aria-label="Trạng thái tài khoản và lưu dữ liệu">
      <Icon />
      <div className="learner-lab-storage-copy">
        <div className="learner-lab-storage-title"><h2>Lưu trên trình duyệt này</h2><span>{local ? 'Chưa đăng nhập' : 'Đã đăng nhập'}</span></div>
        <p>Các lượt Jar Test bên dưới được lưu trên thiết bị này, kể cả khi đã đăng nhập. Dữ liệu không đồng bộ sang thiết bị khác và có thể mất khi xóa dữ liệu web hoặc đóng cửa sổ riêng tư.</p>
        <p className="learner-lab-storage-hint">Jar Test hiện chưa hỗ trợ lưu vào tài khoản. Dùng cùng trình duyệt để tiếp tục lượt.</p>
      </div>
      <Link href={local ? '/sign-in' : '/account'}>{local ? 'Đăng nhập' : 'Quản lý tài khoản'}<ArrowRightIcon /></Link>
    </section>
  )
}

function LabAttemptCard({ row, onRemove, deleting }: { row: JarLabRow; onRemove: (id: UUID) => Promise<void>; deleting: UUID | null }) {
  const experiment = EXPERIMENT_OVERVIEWS.find(item => item.scenarioKey === 'jar-test')!
  const title = experiment.title
  const completed = row.status === 'completed'
  const active = row.status === 'in_progress'
  const statusLabel = active ? 'Đang thực hành' : completed ? 'Đã hoàn thành' : 'Đã dừng'
  const projection = row.projection
  const chosen = projection?.cups.find(cup => cup.id === projection.selectedCupId)
  const final = chosen?.measurements.filter(reading => reading.valid && reading.valueNtu !== null).at(-1)
  const href = '/simulate/jar-test?attempt=' + encodeURIComponent(row.attemptId)
  const phase = projection ? ({ setup: 'Chuẩn bị mẫu', rapid: 'Đã khuấy nhanh', slow: 'Đã khuấy chậm', settling: 'Đã lắng', completed: 'Đã nộp bài' } as const)[projection.phase] : 'Không đọc được dữ liệu'
  const percent = (value: number | null | undefined) => value == null ? 'N/A' : value.toLocaleString('vi-VN', { maximumFractionDigits: 4 }) + '%'

  return (
    <article className="learner-lab-attempt" aria-label={'Lượt Jar Test ' + row.attemptId}>
      <div className="learner-lab-attempt-top">
        <div className="learner-lab-attempt-image">{experiment ? <Image src={experiment.image} alt="" fill sizes="96px" /> : <FlaskIcon />}</div>
        <div className="learner-lab-attempt-title"><span className={`learner-lab-status is-${row.status}`}>{statusLabel}</span><h3>{projection ? <Link href={href}>{title}</Link> : title}</h3><p>Cập nhật <time dateTime={Number.isNaN(row.updatedAt.getTime()) ? undefined : row.updatedAt.toISOString()}>{formatRelativeDate(row.updatedAt)}</time></p></div>
      </div>
      <dl className="learner-lab-attempt-facts">
        <div><dt>Số cốc đã chuẩn bị</dt><dd>{projection ? projection.cups.length + ' / 6 cốc' : 'N/A'}</dd></div>
        <div><dt>Quy trình</dt><dd>{phase}</dd></div>
        <div><dt>Phương án nộp</dt><dd>{chosen ? 'Cốc ' + chosen.id + ' · pH ' + chosen.initialPh + ' · ' + chosen.doseMgL + ' mg/L' : 'Chưa chọn'}</dd></div>
        <div><dt>{completed ? 'NTU cuối phương án' : 'Thời gian mô phỏng'}</dt><dd>{completed ? final?.valueNtu == null ? 'N/A' : final.valueNtu.toLocaleString('vi-VN', { maximumFractionDigits: 4 }) + ' NTU' : projection ? projection.elapsedSeconds.toLocaleString('vi-VN') + ' giây' : 'N/A'}</dd></div>
        {completed && <><div><dt>Hiệu suất từ số đo</dt><dd>{percent(chosen?.measuredRemovalPercent)}</dd></div><div><dt>Đáp số đã ghi</dt><dd>{percent(chosen?.submittedRemovalPercent)}</dd></div></>}
      </dl>
      <div className="learner-lab-attempt-version">Lưu trên trình duyệt · <span>{row.scenarioReleaseId}</span></div>
      {!projection && <p role="alert">Phiên bản hoặc dữ liệu lượt này chưa được hỗ trợ. Dữ liệu đã lưu được giữ nguyên.</p>}
      <div className="learner-lab-attempt-actions">
        {projection && <Link className="btn experiment-library-start" href={href + (completed ? '&view=report' : '')}>{active ? 'Tiếp tục thực hành' : completed ? 'Xem báo cáo' : 'Xem lượt thực hành'}<ArrowRightIcon /></Link>}
        {completed && projection && <Link className="learner-lab-view" href={href + '&view=notebook'}>Xem sổ đo</Link>}
        <button className="learner-lab-delete" type="button" disabled={deleting !== null} onClick={() => void onRemove(row.attemptId)} aria-label={`Xóa lượt ${title}, cập nhật ${formatRelativeDate(row.updatedAt)}`}>{deleting === row.attemptId ? 'Đang xóa…' : 'Xóa'}</button>
      </div>
    </article>
  )
}

function LabSkeleton() {
  return <div className="learner-lab-loading" role="status" aria-label="Đang tải lượt thực hành"><span className="visually-hidden">Đang tải lượt thực hành…</span><div className="learner-lab-attempts" aria-hidden="true">{[0, 1].map(index => <div className="learner-lab-attempt" key={index}><div className="skeleton skeleton-line" style={{ width: '65%', height: '1.5rem' }} /><div className="skeleton skeleton-block" style={{ height: '5rem', marginTop: '1.5rem' }} /><div className="skeleton skeleton-line" style={{ width: '45%', marginTop: '1.5rem' }} /></div>)}</div></div>
}

function LabBackground() {
  return <svg className="learner-lab-background" aria-hidden="true" focusable="false" width="1400" height="1000" viewBox="0 0 1400 1000" preserveAspectRatio="xMidYMin slice" fill="none"><g stroke="currentColor" opacity="0.15"><path d="m1160 30 32-18 32 18v36l-32 18-32-18Zm64 0 32-18 32 18v36l-32 18-32-18Zm-32 54 32-18 32 18v36l-32 18-32-18ZM1285 160v90l-38 38h-96M75 430v100l32 32v80" /><circle cx="1151" cy="288" r="4" /><circle cx="107" cy="642" r="4" /></g></svg>
}
