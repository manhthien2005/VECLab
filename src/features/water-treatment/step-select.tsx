'use client'

import { useEffect, useId, useRef, useState } from 'react'

import styles from './step-select.module.css'

type StepSelectProps = {
  value: number
  options: readonly number[]
  onChange: (next: number) => void
  disabled?: boolean
  ariaLabel: string
}

function formatStep(n: number): string {
  return n.toString().replace('.', ',')
}

/**
 * Custom dropdown cho bước nhảy (mg/L) — thay native <select> để:
 * - Style popup panel (bo góc, shadow, nền surface) cho đồng bộ với field input.
 * - Right-align option text khớp với vị trí hiển thị value ở button phía trên.
 * - Click outside / Escape để đóng; giữ đúng ARIA combobox role.
 */
export function StepSelect({ value, options, onChange, disabled, ariaLabel }: StepSelectProps) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const listId = useId()

  // Click outside / Escape → đóng
  useEffect(() => {
    if (!open) return
    function onDocMouseDown(e: MouseEvent) {
      if (!wrapRef.current) return
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    function onDocKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    document.addEventListener('keydown', onDocKey)
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown)
      document.removeEventListener('keydown', onDocKey)
    }
  }, [open])

  function pick(next: number) {
    onChange(next)
    setOpen(false)
  }

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
      >
        <span className={styles.value}>{formatStep(value)}</span>
        <span className={styles.caret} aria-hidden="true" />
      </button>
      {open && !disabled ? (
        <ul id={listId} role="listbox" className={styles.menu} aria-label={ariaLabel}>
          {options.map((s) => {
            const selected = s === value
            return (
              <li
                key={s}
                role="option"
                aria-selected={selected}
                className={selected ? `${styles.option} ${styles.optionSelected}` : styles.option}
                onClick={() => pick(s)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    pick(s)
                  }
                }}
                tabIndex={0}
              >
                {formatStep(s)}
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
