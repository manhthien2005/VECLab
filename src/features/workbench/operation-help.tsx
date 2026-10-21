'use client'

import { useId, useState } from 'react'
import type { OperationHelpTopic } from '@/content/operation-help.vi.js'
import { TheoryIcon } from './icons.js'
import styles from './operation-help.module.css'

export function OperationHelp({ topic, guideBaseHref }: {
  topic: OperationHelpTopic
  guideBaseHref: string
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
    </div>
  </div>
}
