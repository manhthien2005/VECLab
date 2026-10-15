'use client'

import { useId, useRef, useState, type ReactNode } from 'react'
import { WorkbenchTour, WORKBENCH_TOUR } from './tour.js'
import styles from './frame.module.css'

export type WorkbenchPane = 'simulation' | 'controls' | 'notebook'

/** Presentation slots only. Each experiment owns its apparatus, actions and data. */
export function WorkbenchFrame({ label, header, notices, shelf, simulation, controls, notebook,
  pane, onPaneChange, tourOpen = false, onTourClose }: {
  label: string
  header: ReactNode
  notices?: ReactNode
  shelf: ReactNode
  simulation: ReactNode
  controls: ReactNode
  notebook: ReactNode
  pane: WorkbenchPane
  onPaneChange: (pane: WorkbenchPane) => void
  tourOpen?: boolean
  onTourClose?: () => void
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileShelf, setMobileShelf] = useState(false)
  const [tourStep, setTourStep] = useState(0)
  const root = useRef<HTMLElement>(null)
  const tourArea = tourOpen ? WORKBENCH_TOUR[tourStep]!.area : null
  const displayedPane = tourArea === 'controls' || tourArea === 'notebook' ? tourArea : tourOpen ? 'simulation' : pane
  const displayedShelf = tourOpen ? tourArea === 'shelf' : mobileShelf
  const displayedCollapsed = tourOpen ? false : collapsed
  const shelfId = useId()
  return (
    <section ref={root} className={styles.frame} aria-label={label}>
      <header className={styles.header} data-workbench-area="header">{header}</header>
      {notices && <div className={styles.notices}>{notices}</div>}
      <nav className={styles.mobileNav} aria-label="Khu vực workbench">
        {([['simulation', 'Mô phỏng'], ['controls', 'Thao tác'], ['notebook', 'Sổ đo']] as const)
          .map(([value, label]) => <button key={value} type="button" aria-pressed={displayedPane === value}
            onClick={() => onPaneChange(value)}>{label}</button>)}
        <button type="button" aria-expanded={displayedShelf} aria-controls={shelfId}
          onClick={() => setMobileShelf(!mobileShelf)}>Dụng cụ</button>
      </nav>
      <div className={styles.body} data-collapsed={displayedCollapsed} data-pane={displayedPane}>
        <aside className={styles.shelf} data-mobile-open={displayedShelf} data-workbench-area="shelf">
          <button className={styles.shelfToggle} type="button" aria-controls={shelfId}
            aria-expanded={displayedShelf || !displayedCollapsed} onClick={() => { if (mobileShelf) setMobileShelf(false); else setCollapsed(!collapsed) }}
            aria-label={collapsed && !mobileShelf ? 'Mở kệ mẫu và dụng cụ' : 'Thu gọn kệ mẫu và dụng cụ'}>
            <span>Mẫu & dụng cụ</span><svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d={collapsed ? 'm6 3 5 5-5 5' : 'm10 3-5 5 5 5'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <div id={shelfId} hidden={displayedCollapsed && !displayedShelf}>{shelf}</div>
        </aside>
        <div className={styles.simulation} data-workbench-area="simulation">{simulation}</div>
        <aside className={styles.controls} aria-label="Thao tác thí nghiệm" data-workbench-area="controls">{controls}</aside>
        <div className={styles.notebook} data-workbench-area="notebook">{notebook}</div>
      </div>
      {tourOpen && <WorkbenchTour root={root} step={tourStep} onStepChange={setTourStep}
        onClose={() => { setTourStep(0); onTourClose?.() }} />}
    </section>
  )
}
