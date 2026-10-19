'use client'

import { useId, useLayoutEffect, useRef, type ReactNode } from 'react'
import { CloseIcon } from '@/features/workbench/icons.js'
import ui from './workbench-ui.module.css'

export function PlasticDialog({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const id = useId()
  useLayoutEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const element = ref.current
    element?.showModal()
    return () => { element?.close(); if (previous?.isConnected) previous.focus({ preventScroll: true }) }
  }, [])
  return <dialog ref={ref} className={ui.dialog} aria-labelledby={id} onCancel={event => { event.preventDefault(); onClose() }}>
    <header className={ui.dialogHeader}><h2 id={id}>{title}</h2><button className={ui.iconButton} type="button" onClick={onClose} aria-label="Đóng"><CloseIcon /></button></header>
    <div className={ui.dialogBody}>{children}</div>
  </dialog>
}
