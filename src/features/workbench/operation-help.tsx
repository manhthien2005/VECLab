'use client'

import { useId, useState } from 'react'
import type { OperationHelpTopic } from '@/content/operation-help.vi.js'
import { TheoryIcon } from './icons.js'
import styles from './operation-help.module.css'

export function OperationHelp({ topic, guideBaseHref, onTourTrigger }: {
  topic: OperationHelpTopic
  guideBaseHref: string
  onTourTrigger?: () => void
}) {
  const [open, setOpen] = useState(false)
  const id = useId()
  return <div className={styles.help}>
    <button type="button" id={id + '-trigger'} className={styles.trigger}
      aria-expanded={open} aria-controls={id + '-content'} onClick={() => setOpen(previous => !previous)}>
      <TheoryIcon />{topic.label}
    </button>
    <div id={id + '-content'} className={styles.content} hidden={!open} aria-labelledby={id + '-trigger'}>
      <ol>{topic.points.map(point => <li key={point}>{point}</li>)}</ol>
      <a className={styles.link} href={guideBaseHref + '#' + topic.guideAnchor} target="_blank" rel="noopener noreferrer">
        Đọc hướng dẫn đầy đủ — mở tab mới
      </a>
      {onTourTrigger && (
        <button type="button" className={styles.link} onClick={onTourTrigger} style={{ cursor: 'pointer', padding: '0.25rem 0', background: 'none', border: 'none', color: 'inherit', textDecoration: 'underline' }}>
          Xem video hướng dẫn — mở hướng dẫn tương tác
        </button>
      )}
    </div>
  </div>
}
