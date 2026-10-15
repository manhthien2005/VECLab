'use client'

import { useState } from 'react'
import type { ExtractionActionSummary } from '@/application/scenarios/extraction-projection.js'
import { extractionActionLabel } from './action-label.js'
import bench from './bench.module.css'
import styles from './workbench.module.css'

const PAGE_SIZE = 6
export function ExtractionHistory({ history }: { history: readonly ExtractionActionSummary[] }) {
  const [page, setPage] = useState(0)
  const pages = Math.max(1, Math.ceil(history.length / PAGE_SIZE))
  const currentPage = Math.min(page, pages - 1)
  const end = history.length - currentPage * PAGE_SIZE
  const entries = history.slice(Math.max(0, end - PAGE_SIZE), end).reverse()
  const latest=history.at(-1)

  return <div><details className={styles.history} onToggle={event => {
    if (!event.currentTarget.open) setPage(0)
  }}>
    <summary>Lịch sử thao tác ({history.length})</summary>
    {entries.length ? <ol className={styles.historyList} aria-label="Các thao tác đã lưu">
      {entries.map(entry => <li key={entry.sequence}>
        <span className={styles.historySequence}>#{entry.sequence}</span>
        <strong>{extractionActionLabel(entry)}</strong>
      </li>)}
    </ol> : <p className={styles.historyEmpty}>Chưa có thao tác.</p>}
    {pages > 1 && <nav className={styles.historyPagination} aria-label="Trang lịch sử thao tác">
      <button type="button" className={bench.button} disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Mới hơn</button>
      <span aria-live="polite">{currentPage * PAGE_SIZE + 1}–{Math.min(history.length, (currentPage + 1) * PAGE_SIZE)} / {history.length}</span>
      <button type="button" className={bench.button} disabled={currentPage === pages - 1} onClick={() => setPage(currentPage + 1)}>Cũ hơn</button>
    </nav>}
  </details><p className={styles.historyPreview}>{latest?`Gần nhất: #${latest.sequence} · ${extractionActionLabel(latest)}`:'Chưa có thao tác.'}</p></div>
}
