'use client'

import { useId, useState, type ReactNode } from 'react'
import styles from './frame.module.css'

export type WorkbenchPane = 'simulation' | 'controls' | 'notebook'

/** Presentation slots only. Each experiment owns its apparatus, actions and data. */
export function WorkbenchFrame({ label, header, notices, shelf, simulation, controls, notebook,
  pane, onPaneChange }: {
  label: string
  header: ReactNode
  notices?: ReactNode
  shelf: ReactNode
  simulation: ReactNode
  controls: ReactNode
  notebook: ReactNode
  pane: WorkbenchPane
  onPaneChange: (pane: WorkbenchPane) => void
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileShelf, setMobileShelf] = useState(false)
  const shelfId = useId()
  return (
    <section className={styles.frame} aria-label={label}>
      <header className={styles.header}>{header}</header>
      {notices && <div className={styles.notices}>{notices}</div>}
      <nav className={styles.mobileNav} aria-label="Khu vực workbench">
        {([['simulation', 'Mô phỏng'], ['controls', 'Thao tác'], ['notebook', 'Sổ đo']] as const)
          .map(([value, label]) => <button key={value} type="button" aria-pressed={pane === value}
            onClick={() => onPaneChange(value)}>{label}</button>)}
        <button type="button" aria-expanded={mobileShelf} aria-controls={shelfId}
          onClick={() => setMobileShelf(!mobileShelf)}>Dụng cụ</button>
      </nav>
      <div className={styles.body} data-collapsed={collapsed} data-pane={pane}>
        <aside className={styles.shelf} data-mobile-open={mobileShelf}>
          <button className={styles.shelfToggle} type="button" aria-controls={shelfId}
            aria-expanded={mobileShelf || !collapsed} onClick={() => { if (mobileShelf) setMobileShelf(false); else setCollapsed(!collapsed) }}
            aria-label={collapsed && !mobileShelf ? 'Mở kệ mẫu và dụng cụ' : 'Thu gọn kệ mẫu và dụng cụ'}>
            <span>Mẫu & dụng cụ</span><svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d={collapsed ? 'm6 3 5 5-5 5' : 'm10 3-5 5 5 5'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <div id={shelfId} hidden={collapsed && !mobileShelf}>{shelf}</div>
        </aside>
        <div className={styles.simulation}>{simulation}</div>
        <aside className={styles.controls} aria-label="Thao tác thí nghiệm">{controls}</aside>
        <div className={styles.notebook}>{notebook}</div>
      </div>
    </section>
  )
}
