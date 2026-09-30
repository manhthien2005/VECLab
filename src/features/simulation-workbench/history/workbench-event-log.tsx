'use client'

import { useMemo } from 'react'
import type { StoredAttemptEventRecord } from '@/application/attempts/repository.js'
import type { AcidNeutralizationState } from '@/domain/experiments/acid-neutralization/state.js'
import { formatLitresAsMl, formatPh } from '@/shared/ui/format.js'
import { actionLabel } from '../copy.js'

export type WorkbenchEventLogProps = {
  readonly events: readonly StoredAttemptEventRecord<AcidNeutralizationState>[]
  readonly className?: string
}

export type FormattedEventItem = {
  sequence: number
  title: string
  detail: string | null
  timeStr: string | null
  isReverted: boolean
  isUndo: boolean
}

export function formatEventRecord(
  record: StoredAttemptEventRecord<AcidNeutralizationState>,
  revertedSequences: Set<number>,
): FormattedEventItem {
  const isReverted = revertedSequences.has(record.sequence)
  const isUndo = record.undoOfSequence !== null

  let detail: string | null = null
  const state = record.stateAfter

  if (record.actionType === 'add_base') {
    detail = `Tổng thể tích NaOH: ${formatLitresAsMl(state.baseVolumeL)}`
  } else if (record.actionType === 'add_correction_acid') {
    detail = `Tổng thể tích HCl hiệu chỉnh: ${formatLitresAsMl(state.correctionAcidVolumeL)}`
  } else if (record.actionType === 'measure_ph') {
    detail = state.lastMeasuredPH !== null ? `pH đo được: ${formatPh(state.lastMeasuredPH)}` : 'Chưa có số đọc'
  } else if (record.actionType === 'select_route') {
    detail = state.route === 'naoh' ? 'Natri hiđroxit (NaOH 0,01 M)' : state.route ?? ''
  } else if (isUndo) {
    detail = `Đã hoàn tác sự kiện #${record.undoOfSequence}`
  }

  // Authoritative timestamp formatting if valid Date exists
  let timeStr: string | null = null
  if (record.occurredAt instanceof Date && !isNaN(record.occurredAt.getTime())) {
    timeStr = record.occurredAt.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return {
    sequence: record.sequence,
    title: actionLabel(record.actionType),
    detail,
    timeStr,
    isReverted,
    isUndo,
  }
}

export function WorkbenchEventLog({ events, className = '' }: WorkbenchEventLogProps) {
  // Reverted events mapped
  const items = useMemo(() => {
    const reverted = new Set<number>()
    for (const ev of events) {
      if (ev.undoOfSequence !== null) {
        reverted.add(ev.undoOfSequence)
      }
    }

    return events.map((ev) => formatEventRecord(ev, reverted))
  }, [events])

  return (
    <section className={`wb-event-log card stack-tight ${className}`} aria-labelledby="wb-log-title">
      <div className="wb-log-header">
        <h3 id="wb-log-title" className="wb-section-heading">
          Nhật ký thao tác thực nghiệm
        </h3>
        <span className="badge badge-sm">{events.length} sự kiện</span>
      </div>

      {items.length === 0 ? (
        <div className="wb-log-empty">
          <p className="hint">
            Các thao tác thí nghiệm sẽ xuất hiện ở đây sau khi bắt đầu lượt thử.
          </p>
        </div>
      ) : (
        <div className="wb-log-scroll-area">
          <ol className="wb-log-list">
            {/* Show newest events first or clear sequence list */}
            {[...items].reverse().map((item) => (
              <li
                key={item.sequence}
                className={`wb-log-item ${item.isReverted ? 'is-reverted' : ''} ${item.isUndo ? 'is-undo' : ''}`}
              >
                <div className="wb-log-meta">
                  <span className="wb-log-seq mono">#{item.sequence}</span>
                  {item.timeStr && <span className="wb-log-time">{item.timeStr}</span>}
                </div>
                <div className="wb-log-body">
                  <div className="wb-log-title-row">
                    <span className="wb-log-title">{item.title}</span>
                    {item.isReverted && (
                      <span className="badge badge-warn badge-xs">Đã hoàn tác</span>
                    )}
                  </div>
                  {item.detail && <p className="wb-log-detail tiny">{item.detail}</p>}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  )
}
