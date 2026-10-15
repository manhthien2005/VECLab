'use client'

import type { WorkbenchMode, SaveStatus } from './controller/types.js'
import type { AttemptStatus } from '@/domain/process/contracts.js'
import { APP_STRINGS } from '@/content/index.js'
import { workbenchModeLabel } from './guidance/protocol.js'

export type WorkbenchContextBarProps = {
  readonly mode: WorkbenchMode
  readonly status: AttemptStatus | null
  readonly saveStatus: SaveStatus
  readonly storageMode: 'local' | 'cloud'
  readonly isPreStart: boolean
  readonly className?: string
}

export function WorkbenchContextBar({
  mode,
  status,
  saveStatus,
  storageMode,
  isPreStart,
  className = '',
}: WorkbenchContextBarProps) {
  const saveLabel = () => {
    switch (saveStatus) {
      case 'saving':
        return APP_STRINGS.storage.saving
      case 'saved':
        return storageMode === 'local'
          ? `${APP_STRINGS.storage.saved} · Cục bộ`
          : APP_STRINGS.storage.saved
      case 'error':
        return APP_STRINGS.storage.error
      case 'idle':
      default:
        return storageMode === 'local' ? 'Lưu cục bộ' : 'Đồng bộ đám mây'
    }
  }

  return (
    <header className={`wb-context-bar ${className}`} role="region" aria-label="Thông tin phiên thí nghiệm">
      <div className="wb-context-left">
        <div className="wb-title-group">
          <span className="wb-reaction-badge">HCl + NaOH</span>
          <h2 className="wb-context-title">Chuẩn độ Axit - Bazơ</h2>
        </div>
      </div>

      <div className="wb-context-right">
        <div className="wb-context-mode">
          {!isPreStart && (
            <span className="badge badge-accent">{workbenchModeLabel(mode)}</span>
          )}
        </div>

        {status && (
          <span
            className={`badge ${status === 'completed' ? 'badge-ok' : status === 'in_progress' ? 'badge-info' : 'badge-warn'}`}
          >
            {status === 'completed'
              ? 'Đã hoàn thành'
              : status === 'in_progress'
                ? 'Đang thực hiện'
                : 'Đã dừng'}
          </span>
        )}

        <span className="wb-save-indicator" role="status" aria-live="polite">
          <span className="wb-save-dot" data-state={saveStatus} />
          <span className="wb-save-text">{saveLabel()}</span>
        </span>
      </div>
    </header>
  )
}
