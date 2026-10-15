'use client'

import { useState } from 'react'
import type { ExtractionProjection } from '@/application/scenarios/extraction-projection.js'
import bench from './bench.module.css'
import styles from './workbench.module.css'

const PAGE_SIZE = 6
const ACTION_NAMES: Record<string, string> = {
  add_reagent: 'Cấp dung dịch', mix: 'Trộn mẫu', vent: 'Xả áp',
  settle: 'Để phân lớp', transfer: 'Chuyển mẫu', filter: 'Lọc thu rắn',
  evaporate: 'Cô dung môi', dry: 'Làm khô',
}

export function ExtractionHistory({ history }: { history: ExtractionProjection['history'] }) {
  const [page, setPage] = useState(0)
  const pages = Math.max(1, Math.ceil(history.length / PAGE_SIZE))
  const currentPage = Math.min(page, pages - 1)
  const end = history.length - currentPage * PAGE_SIZE
  const entries = history.slice(Math.max(0, end - PAGE_SIZE), end).reverse()

  return <details className={styles.history} onToggle={event => {
    if (!event.currentTarget.open) setPage(0)
  }}>
    <summary>Lịch sử thao tác ({history.length})</summary>
    {entries.length ? <ol className={styles.historyList} aria-label="Các thao tác đã lưu">
      {entries.map(entry => <li key={entry.sequence}>
        <span className={styles.historySequence}>#{entry.sequence}</span>
        <strong>{ACTION_NAMES[entry.actionType] ?? entry.actionType}</strong>
        <span>{entry.from}{entry.from !== entry.to ? ' → ' + entry.to : ''}</span>
      </li>)}
    </ol> : <p className={styles.historyEmpty}>Chưa có thao tác.</p>}
    {pages > 1 && <nav className={styles.historyPagination} aria-label="Trang lịch sử thao tác">
      <button type="button" className={bench.button} disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Mới hơn</button>
      <span aria-live="polite">{currentPage * PAGE_SIZE + 1}–{Math.min(history.length, (currentPage + 1) * PAGE_SIZE)} / {history.length}</span>
      <button type="button" className={bench.button} disabled={currentPage === pages - 1} onClick={() => setPage(currentPage + 1)}>Cũ hơn</button>
    </nav>}
  </details>
}
