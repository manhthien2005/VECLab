'use client'

import Image from 'next/image'
import { useState } from 'react'
import { PlayIcon } from '@/features/landing/icons.js'
import styles from './lesson-videos.module.css'

export type LessonVideo = {
  id: 'lesson' | 'practice'
  title: string
  summary: string
  description: string
  playLabel: string
  playerLabel: string
  poster: string
  /** Omit or leave empty while the recording is not ready. */
  source?: string
  captions?: string
  /** When true, the slot is visible but cannot be played. */
  pending?: boolean
}

type Props = {
  id: string
  title: string
  videos: readonly [LessonVideo, ...LessonVideo[]]
}

function focusPlayer(element: HTMLVideoElement | null) {
  element?.focus()
}

export function LessonVideos({ id, title, videos }: Props) {
  const [selectedId, setSelectedId] = useState<'lesson' | 'practice'>('lesson')
  const [active, setActive] = useState(false)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const selected = videos.find(video => video.id === selectedId) ?? videos[0]
  const canPlay = !selected.pending && Boolean(selected.source)

  function selectVideo(id: 'lesson' | 'practice') {
    setSelectedId(id)
    setFailed(false)
    setActive(false)
  }

  return <section className={styles.section} id={id} aria-labelledby={`${id}-title`}>
    <header className={styles.heading}>
      <h2 id={`${id}-title`}>{title}</h2>
      <p>Nắm nguyên lý, theo dõi thao tác, rồi tự thực hành.</p>
    </header>
    <div className={styles.workspace}>
      <div className={styles.viewer}>
        <div className={styles.frame} id={`${id}-player`}>
          {active && canPlay ? <video
            key={`${selected.id}-${attempt}`}
            ref={focusPlayer}
            src={selected.source}
            poster={selected.poster}
            controls
            autoPlay
            playsInline
            preload="none"
            crossOrigin="anonymous"
            tabIndex={0}
            aria-label={selected.playerLabel}
            onError={() => setFailed(true)}
          >
            {selected.captions && <track kind="captions" src={selected.captions} srcLang="vi" label="Tiếng Việt (tự động)" />}
            Trình duyệt chưa hỗ trợ phát video. <a href={selected.source}>Mở video</a>.
          </video> : canPlay ? <button className={styles.poster} type="button" aria-label={selected.playLabel} onClick={() => setActive(true)}>
            <Image src={selected.poster} alt="" width={1280} height={720} sizes="(max-width: 850px) 92vw, 760px" />
            <span className={styles.play}><PlayIcon /><span>Phát video</span></span>
          </button> : <div className={`${styles.poster} ${styles.posterPending}`} role="img" aria-label={`${selected.playLabel}. Video sẽ được bổ sung.`}>
            <Image src={selected.poster} alt="" width={1280} height={720} sizes="(max-width: 850px) 92vw, 760px" />
            <span className={styles.play}><PlayIcon /><span>Sắp có</span></span>
          </div>}
        </div>
        <div className={styles.current} aria-live="polite" aria-atomic="true">
          <h3>{selected.title}</h3>
          <p>{selected.description}</p>
        </div>
        {failed && <div className={styles.error} role="alert">
          <p>Chưa tải được video. Kiểm tra kết nối rồi thử lại.</p>
          <button type="button" onClick={() => { setFailed(false); setAttempt(value => value + 1) }}>Thử lại</button>
          <a href={selected.source} target="_blank" rel="noopener noreferrer">Mở video ở tab mới</a>
        </div>}
      </div>
      <aside className={styles.playlist} aria-labelledby={`${id}-contents`}>
        <h3 id={`${id}-contents`}>Nội dung video</h3>
        <ul className={styles.list}>
          {videos.map(video => <li key={video.id}>
            <button
              className={styles.choice}
              type="button"
              aria-label={`Chọn video: ${video.title}`}
              aria-pressed={selected.id === video.id}
              aria-controls={`${id}-player`}
              onClick={() => selectVideo(video.id)}
            >
              <span className={styles.thumbnail}><Image src={video.poster} alt="" width={160} height={90} sizes="96px" /><PlayIcon /></span>
              <span className={styles.choiceText}>
                <strong>{video.title}</strong>
                <span>{video.summary}</span>
                {selected.id === video.id && <small aria-hidden="true">Đang chọn</small>}
              </span>
            </button>
          </li>)}
        </ul>
      </aside>
    </div>
  </section>
}
