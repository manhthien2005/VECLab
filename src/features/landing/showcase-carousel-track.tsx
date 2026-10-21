'use client'

import { Children, cloneElement, isValidElement, useState, useRef } from 'react'

interface ShowcaseCarouselTrackProps {
  children: React.ReactNode
  totalSlides: number
  headingId?: string
  slideLabels: readonly string[]
}

/** The selected card and its neighbours form the visible arc of the ring. */
export function ShowcaseCarouselTrack({ children, totalSlides, headingId, slideLabels }: ShowcaseCarouselTrackProps) {
  const [activeStep, setActiveStep] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)
  const gesture = useRef<{ x: number; y: number } | null>(null)
  const suppressClick = useRef(false)
  const wrap = (index: number) => ((index % totalSlides) + totalSlides) % totalSlides
  const activeIndex = wrap(activeStep)
  // Ring step is shared by every slot so any slide count rotates without
  // overlapping neighbours (e.g. 4 slides → 90° spacing, 3 slides → 120°).
  const slotAngle = 360 / totalSlides
  const select = (index: number, focus = false) => {
    const next = wrap(index)
    setActiveStep((step) => {
      const distance = wrap(next - wrap(step))
      return step + (distance > totalSlides / 2 ? distance - totalSlides : distance)
    })
    if (focus) trackRef.current?.children[next]?.querySelector<HTMLElement>('a, summary')?.focus({ preventScroll: true })
  }

  return (
    <section className="showcase-carousel-wrapper" role="region" aria-roledescription="carousel" aria-labelledby={headingId}>
      <div ref={trackRef} className="showcase-track"
        onPointerDown={(event) => {
          if (!event.isPrimary || event.button !== 0) return
          gesture.current = { x: event.clientX, y: event.clientY }
          suppressClick.current = false
        }}
        onPointerUp={(event) => {
          const start = gesture.current
          gesture.current = null
          if (!start) return
          const dx = event.clientX - start.x
          if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(event.clientY - start.y)) {
            suppressClick.current = true
            select(activeIndex + (dx < 0 ? 1 : -1))
          }
        }}
        onPointerCancel={() => { gesture.current = null }}
        onDragStart={(event) => event.preventDefault()}
        onClickCapture={(event) => {
          const card = (event.target as HTMLElement).closest('.showcase-card')
          const index = Array.from(trackRef.current?.children ?? []).indexOf(card as Element)
          if (suppressClick.current || (index >= 0 && index !== activeIndex)) {
            event.preventDefault()
            event.stopPropagation()
            if (!suppressClick.current) select(index)
            suppressClick.current = false
          }
        }}
        onFocusCapture={(event) => {
          if (!(event.target as HTMLElement).matches(':focus-visible')) return
          const card = (event.target as HTMLElement).closest('.showcase-card')
          const index = Array.from(trackRef.current?.children ?? []).indexOf(card as Element)
          if (index >= 0) select(index)
        }}
        onKeyDown={(event) => {
          if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
          if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
          event.preventDefault()
          select(activeIndex + (event.key === 'ArrowLeft' ? -1 : 1), true)
        }}>
        {Children.map(children, (child, idx) => {
          if (!isValidElement<Record<string, unknown>>(child)) return child
          const offset = wrap(idx - activeIndex)
          const rear = offset > 1 && offset < totalSlides - 1
          return cloneElement(child, {
            'data-active': String(idx === activeIndex),
            'aria-hidden': rear ? true : undefined,
            inert: rear,
            style: { ...child.props.style as React.CSSProperties, '--ring-angle': `${(idx - activeStep) * slotAngle}deg` } as React.CSSProperties,
            'data-position': offset === 0 ? 'center' : offset === 1 ? 'right' : offset === totalSlides - 1 ? 'left' : 'rear',
          })
        })}
      </div>
      <p className="showcase-current" aria-hidden="true"><span>{String(activeIndex + 1).padStart(2, '0')} / {String(totalSlides).padStart(2, '0')}</span>{slideLabels[activeIndex]}</p>
      <div className="showcase-controls" aria-label="Điều khiển danh sách thí nghiệm">
        <button type="button" className="showcase-nav-btn" onClick={() => select(activeIndex - 1)} aria-label="Thí nghiệm trước đó">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" /></svg>
        </button>
        <div className="showcase-dots" role="group" aria-label="Chọn thí nghiệm">
          {Array.from({ length: totalSlides }, (_, idx) => (
            <button key={idx} type="button" className={`showcase-dot ${idx === activeIndex ? 'is-active' : ''}`} onClick={() => select(idx)} aria-label={`Chuyển đến thí nghiệm ${idx + 1}`} title={slideLabels[idx]} aria-current={idx === activeIndex ? 'true' : undefined}><span className="showcase-dot-label">{slideLabels[idx]}</span></button>
          ))}
        </div>
        <button type="button" className="showcase-nav-btn" onClick={() => select(activeIndex + 1)} aria-label="Thí nghiệm tiếp theo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="m9 6 6 6-6 6" /></svg>
        </button>
      </div>
      <span className="sr-only" aria-live="polite" aria-atomic="true">Thí nghiệm {activeIndex + 1} / {totalSlides}</span>
    </section>
  )
}
