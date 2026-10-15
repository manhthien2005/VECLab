'use client'

import { useEffect, useState } from 'react'
import { GuestAttemptRepository } from '@/application/attempts/guest-repository.js'
import type { UUID } from '@/domain/process/contracts.js'
import type { JarState } from '@/domain/experiments/jar-test/model.js'
import styles from './workbench.module.css'

const labels: Record<string, string> = {
  prepare_cup: 'Chuẩn bị cốc', measure_initial: 'Đo mẫu ban đầu',
  add_coagulant: 'Cấp phèn', run_phase: 'Chạy chương trình',
  measure_final: 'Đo độ đục cuối', record_result: 'Ghi đáp số',
  select_result: 'Chọn phương án', complete: 'Nộp bài', completed: 'Nộp bài',
}
type Entry = { sequence: number; label: string; detail: string; time: string }

/** Read the saved log, never fabricate history from transient UI notifications. */
export function JarHistory({ attemptId, revision }: { attemptId: UUID; revision: number }) {
  const [entries, setEntries] = useState<Entry[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [page, setPage] = useState(0)
  useEffect(() => {
    let cancelled = false
    void new GuestAttemptRepository<JarState>().getAttemptEventRecords(attemptId).then((events) => {
      if (cancelled) return
      setEntries(events.map((event) => {
        // Only learner inputs are rendered, not stateAfter or calculation traces.
        const input = event.normalizedInput
        const detail = [
          typeof input.cupId === 'string' ? 'Cốc ' + input.cupId : '',
          typeof input.initialPh === 'number' ? 'pH đầu ' + input.initialPh : '',
          typeof input.incrementMgL === 'number' ? '+' + input.incrementMgL + ' mg/L' : '',
          typeof input.removalPercent === 'number' ? input.removalPercent + ' %' : '',
          input.phase === 'rapid' ? 'Khuấy nhanh' : input.phase === 'slow' ? 'Khuấy chậm' : input.phase === 'settling' ? 'Lắng' : '',
        ].filter(Boolean).join(' · ')
        return { sequence: event.sequence, label: labels[event.actionType] ?? 'Thao tác đã lưu',
          detail, time: event.occurredAt.toLocaleTimeString('vi-VN') }
      }).reverse())
      setFailed(false)
    }).catch(() => { if (!cancelled) setFailed(true) })
    return () => { cancelled = true }
  }, [attemptId, revision])
  if (failed) return <p role="alert">Chưa tải được lịch sử. Mở lại mục này để thử lại.</p>
  if (!entries) return <p role="status">Đang tải thao tác đã lưu…</p>
  if (!entries.length) return <p className={styles.muted}>Chưa có thao tác. Lịch sử sẽ xuất hiện sau khi bạn chuẩn bị mẫu.</p>
  const current = Math.min(page, Math.ceil(entries.length / 6) - 1)
  return <div><ol className={styles.historyList}>{entries.slice(current * 6, current * 6 + 6).map((entry) => <li key={entry.sequence}>
    <span className={styles.historyIndex}>{entry.sequence}</span>
    <div><strong>{entry.label}</strong>{entry.detail && <p>{entry.detail}</p>}</div>
    <time>{entry.time}</time>
  </li>)}</ol><div className={styles.historyPagination}><button type="button" className={styles.button} disabled={current === 0} onClick={() => setPage(current - 1)}>Mới hơn</button><span>{current * 6 + 1}–{Math.min(entries.length, current * 6 + 6)} / {entries.length} thao tác</span><button type="button" className={styles.button} disabled={(current + 1) * 6 >= entries.length} onClick={() => setPage(current + 1)}>Cũ hơn</button></div></div>
}
