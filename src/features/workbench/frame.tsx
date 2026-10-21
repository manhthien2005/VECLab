'use client'

import { useId, useRef, useState, type ReactNode, type RefObject } from 'react'
import { WorkbenchTour, WORKBENCH_TOUR, type WorkbenchTourStep } from './tour.js'
import { ToolsIcon } from './icons.js'
import styles from './frame.module.css'

export type WorkbenchPane = 'simulation' | 'controls' | 'notebook'

/** Presentation slots only. Each experiment owns its apparatus, actions and data. */
export function WorkbenchFrame({ label, header, notices, shelf, simulation, controls, notebook,
  pane, onPaneChange, notebookRef, tourOpen = false, onTourClose, onShelfInfo, tourSteps, contentSized = false }: {
  label: string
  header: ReactNode
  notices?: ReactNode
  shelf: ReactNode
  simulation: ReactNode
  controls: ReactNode
  notebook: ReactNode
  pane: WorkbenchPane
  onPaneChange: (pane: WorkbenchPane) => void
  notebookRef?: RefObject<HTMLDivElement | null>
  tourSteps?: readonly WorkbenchTourStep[]
  contentSized?: boolean
  tourOpen?: boolean
  onTourClose?: () => void
  onShelfInfo?: () => void
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileShelf, setMobileShelf] = useState(false)
  const [tourStep, setTourStep] = useState(0)
  const root = useRef<HTMLElement>(null)
  const tourArea = tourOpen ? (tourSteps ?? WORKBENCH_TOUR)[tourStep]!.area : null
  const displayedPane = tourArea === 'controls' || tourArea === 'notebook' ? tourArea : tourOpen ? 'simulation' : pane
  const displayedShelf = tourOpen ? tourArea === 'shelf' : mobileShelf
  const displayedCollapsed = tourOpen ? false : collapsed
  const shelfId = useId()
  const simulationArea = <div className={styles.simulation} data-workbench-area="simulation">{simulation}</div>
  const notebookArea = <div ref={notebookRef} tabIndex={-1} className={styles.notebook} data-workbench-area="notebook">{notebook}</div>
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
      <div className={styles.body} data-collapsed={displayedCollapsed} data-pane={displayedPane} data-content-sized={contentSized}>
        <aside className={styles.shelf} data-mobile-open={displayedShelf} data-workbench-area="shelf">
          <div className={styles.shelfHeading}>
          {onShelfInfo ? <button type="button" className={styles.shelfTitle} onClick={onShelfInfo} aria-haspopup="dialog" aria-label="Tìm hiểu mẫu & dụng cụ"><ToolsIcon /><span>Mẫu & dụng cụ</span></button> : <span className={styles.shelfTitle}><ToolsIcon /><span>Mẫu & dụng cụ</span></span>}
          <button className={styles.shelfToggle} type="button" aria-controls={shelfId}
            aria-expanded={displayedShelf || !displayedCollapsed} onClick={() => { if (mobileShelf) setMobileShelf(false); else setCollapsed(!collapsed) }}
            aria-label={collapsed && !mobileShelf ? 'Mở kệ mẫu và dụng cụ' : 'Thu gọn kệ mẫu và dụng cụ'}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d={collapsed ? 'm6 3 5 5-5 5' : 'm10 3-5 5 5 5'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          </div>
          <div className={styles.shelfBody} id={shelfId} hidden={displayedCollapsed && !displayedShelf}>{shelf}</div>
        </aside>
        {contentSized ? <div className={styles.mainColumn}>{simulationArea}{notebookArea}</div> : simulationArea}
        <aside className={styles.controls} aria-label="Thao tác thí nghiệm" data-workbench-area="controls">{controls}</aside>
        {!contentSized && notebookArea}
      </div>
      {tourOpen && <WorkbenchTour steps={tourSteps ?? WORKBENCH_TOUR} root={root} step={tourStep} onStepChange={setTourStep}
        onClose={() => { setTourStep(0); onTourClose?.() }} />}
    </section>
  )
}
