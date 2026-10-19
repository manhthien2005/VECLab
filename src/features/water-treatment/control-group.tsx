'use client'

import { useId, type ReactNode } from 'react'
import { CloseIcon, ControlIcon } from '@/features/workbench/icons.js'
import styles from './control-group.module.css'

/**
 * Bảng thao tác theo từng bước của quy trình xử lý nước. Cùng pattern với
 * Jar Test: `<details open>` để chuyển trạng thái mở/đóng từ parent qua
 * `open` + `onToggle`. Khi `open = true`, nội dung được render. Khi đóng,
 * nội dung bị bỏ qua — giảm DOM và dễ bảo trì.
 */
export function ControlGroup({
  id,
  title,
  summary,
  open,
  onToggle,
  disabled = false,
  children,
}: {
  id: string
  title: string
  summary: string
  open: boolean
  onToggle: () => void
  disabled?: boolean
  children: ReactNode
}) {
  const generated = useId()
  const reactId = id || generated
  return (
    <details
      className={styles.controlGroup}
      open={open}
      data-testid={'wt-control-' + reactId}
      data-disabled={disabled ? 'true' : 'false'}
    >
      <summary
        onClick={(event) => {
          if (disabled) {
            event.preventDefault()
            return
          }
          event.preventDefault()
          onToggle()
        }}
        aria-disabled={disabled}
      >
        <span className={styles.controlIcon}>
          <ControlIcon kind={reactId} />
        </span>
        <span className={styles.controlText}>
          <strong>{title}</strong>
          <small>{summary}</small>
        </span>
      </summary>
      <div className={styles.groupBody}>{children}</div>
    </details>
  )
}

/** Nút hành động theo style template (secondary + actionReason). */
export function ControlGroupNote({ children }: { children: ReactNode }) {
  return <p className={styles.groupNote}>{children}</p>
}

/** Nút "đóng" nhỏ cho panel popover (đặt ở góc phải header). */
export function PopoverClose({ onClose, label = 'Đóng' }: { onClose: () => void; label?: string }) {
  return (
    <button type="button" aria-label={label} onClick={onClose} className={styles.popoverClose}>
      <CloseIcon />
    </button>
  )
}
