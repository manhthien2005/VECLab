'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

interface ShowcaseCarouselTrackProps {
  children: React.ReactNode
  totalSlides: number
  headingId?: string
}

/** Native scrolling and links work without JS; controls add centered selection. */
export function ShowcaseCarouselTrack({ children, totalSlides, headingId }: ShowcaseCarouselTrackProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)

  const scrollToIndex = useCallback((index: number, focus = false) => {
    const track = trackRef.current
    if (!track) return
    const slide = track.querySelectorAll<HTMLElement>('.showcase-card')[index]
    if (!slide) return
    track.scrollTo({
      left: slide.offsetLeft - track.offsetLeft - (track.clientWidth - slide.offsetWidth) / 2,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    })
    if (focus) slide.querySelector<HTMLElement>('a, summary')?.focus({ preventScroll: true })
  }, [])

  const handleScroll = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    const center = track.getBoundingClientRect().left + track.clientWidth / 2
    let closestIndex = 0
    let closestDistance = Infinity
    track.querySelectorAll<HTMLElement>('.showcase-card').forEach((slide, idx) => {
      const rect = slide.getBoundingClientRect()
      const distance = Math.abs(rect.left + rect.width / 2 - center)
      if (distance < closestDistance) { closestDistance = distance; closestIndex = idx }
    })
    setActiveIndex(closestIndex)
  }, [])

  useEffect(() => {
    trackRef.current?.querySelectorAll<HTMLElement>('.showcase-card').forEach((slide, idx) => {
      slide.dataset.active = String(idx === activeIndex)
    })
  }, [activeIndex])

  return (
    <section className="showcase-carousel-wrapper" role="region" aria-roledescription="carousel" aria-labelledby={headingId}>
      <div ref={trackRef} className="showcase-track" onScroll={handleScroll}
        onFocusCapture={(event) => {
          const card = (event.target as HTMLElement).closest('.showcase-card')
          const index = Array.from(trackRef.current?.children ?? []).indexOf(card as Element)
          if (index >= 0) scrollToIndex(index)
        }}
        onKeyDown={(event) => {
          if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
          if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
          event.preventDefault()
          scrollToIndex(Math.max(0, Math.min(totalSlides - 1, activeIndex + (event.key === 'ArrowLeft' ? -1 : 1))), true)
        }}>
        {children}
      </div>
      <div className="showcase-controls" aria-label="Điều khiển danh sách thí nghiệm">
        <button type="button" className="showcase-nav-btn" disabled={activeIndex === 0} onClick={() => scrollToIndex(activeIndex - 1)} aria-label="Thí nghiệm trước đó">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" /></svg>
        </button>
        <div className="showcase-dots" role="group" aria-label="Chọn thí nghiệm">
          {Array.from({ length: totalSlides }, (_, idx) => (
            <button key={idx} type="button" className={`showcase-dot ${idx === activeIndex ? 'is-active' : ''}`} onClick={() => scrollToIndex(idx)} aria-label={`Chuyển đến thí nghiệm ${idx + 1}`} aria-current={idx === activeIndex ? 'true' : undefined} />
          ))}
        </div>
        <button type="button" className="showcase-nav-btn" disabled={activeIndex === totalSlides - 1} onClick={() => scrollToIndex(activeIndex + 1)} aria-label="Thí nghiệm tiếp theo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="m9 6 6 6-6 6" /></svg>
        </button>
      </div>
      <span className="sr-only" aria-live="polite" aria-atomic="true">Thí nghiệm {activeIndex + 1} / {totalSlides}</span>
    </section>
  )
}
