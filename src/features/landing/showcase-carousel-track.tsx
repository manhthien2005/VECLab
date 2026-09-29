'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

interface ShowcaseCarouselTrackProps {
  children: React.ReactNode
  totalSlides: number
  headingId?: string
}

/**
 * Client leaf carousel shell for the experiment showcase.
 *
 * Implements W3C WAI-ARIA Carousel pattern with hardware-accelerated CSS scroll-snap
 * on mobile/tablet and preserves the 3-card grid on desktop.
 *
 * Server Component children composition ensures that canonical experiment metadata
 * and scientific visual stages remain 100% on the server.
 */
export function ShowcaseCarouselTrack({
  children,
  totalSlides,
  headingId,
}: ShowcaseCarouselTrackProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const trackRef = useRef<HTMLDivElement | null>(null)
  const isScrollingRef = useRef(false)

  // Scroll smoothly to a target slide index
  const scrollToIndex = useCallback((index: number) => {
    const track = trackRef.current
    if (!track) return

    const clampedIndex = Math.max(0, Math.min(index, totalSlides - 1))
    const slides = track.querySelectorAll<HTMLElement>('.showcase-card')
    const targetSlide = slides[clampedIndex]

    if (targetSlide) {
      isScrollingRef.current = true
      targetSlide.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      })
      setActiveIndex(clampedIndex)

      window.setTimeout(() => {
        isScrollingRef.current = false
      }, 400)
    }
  }, [totalSlides])

  const handlePrev = useCallback(() => {
    scrollToIndex(activeIndex - 1)
  }, [activeIndex, scrollToIndex])

  const handleNext = useCallback(() => {
    scrollToIndex(activeIndex + 1)
  }, [activeIndex, scrollToIndex])

  // Synchronize activeIndex on manual touch / trackpad scroll without per-frame state churn
  const handleScroll = useCallback(() => {
    if (isScrollingRef.current) return

    const track = trackRef.current
    if (!track) return

    const slides = track.querySelectorAll<HTMLElement>('.showcase-card')
    if (slides.length === 0) return

    const trackRect = track.getBoundingClientRect()
    const trackCenter = trackRect.left + trackRect.width / 2

    let closestIndex = 0
    let minDistance = Infinity

    slides.forEach((slide, idx) => {
      const slideRect = slide.getBoundingClientRect()
      const slideCenter = slideRect.left + slideRect.width / 2
      const distance = Math.abs(slideCenter - trackCenter)
      if (distance < minDistance) {
        minDistance = distance
        closestIndex = idx
      }
    })

    setActiveIndex((prev) => (prev !== closestIndex ? closestIndex : prev))
  }, [])

  // Progressive pointer enhancement: clicking an inactive card's surface transfers active focus
  // Native interactive elements (links, buttons) are excluded to ensure 1-click CTA navigation
  const handleTrackClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement | null
    if (!target) return

    // Never intercept native interactive controls - single-click navigation must be preserved
    if (target.closest('a, button, input, select, textarea, [role="button"]')) {
      return
    }

    const card = target.closest<HTMLElement>('.showcase-card')
    if (!card) return

    const track = trackRef.current
    if (!track) return

    const slides = Array.from(track.querySelectorAll<HTMLElement>('.showcase-card'))
    const cardIndex = slides.indexOf(card)
    if (cardIndex !== -1 && cardIndex !== activeIndex) {
      // If mobile/tablet scrollable carousel, smooth-scroll to it; otherwise update active state directly
      const isScrollable = track.scrollWidth > track.clientWidth + 4
      if (isScrollable) {
        scrollToIndex(cardIndex)
      } else {
        setActiveIndex(cardIndex)
      }
    }
  }, [activeIndex, scrollToIndex])

  // Mark data-active attribute on slide DOM elements for styling
  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    const slides = track.querySelectorAll<HTMLElement>('.showcase-card')
    slides.forEach((slide, idx) => {
      if (idx === activeIndex) {
        slide.setAttribute('data-active', 'true')
      } else {
        slide.removeAttribute('data-active')
      }
    })
  }, [activeIndex])

  return (
    <section
      className="showcase-carousel-wrapper"
      role="region"
      aria-roledescription="carousel"
      aria-label="3 thí nghiệm mô phỏng"
      aria-labelledby={headingId}
    >
      <div
        ref={trackRef}
        className="showcase-track"
        onScroll={handleScroll}
        onClick={handleTrackClick}
        tabIndex={-1}
      >
        {children}
      </div>

      {/* Carousel Navigation Controls (Visible on mobile/tablet, hidden on desktop when all cards visible) */}
      <div className="showcase-controls" aria-label="Điều khiển danh sách thí nghiệm">
        <div className="showcase-nav-group">
          <button
            type="button"
            className="showcase-nav-btn"
            onClick={handlePrev}
            disabled={activeIndex === 0}
            aria-label="Thí nghiệm trước đó"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            className="showcase-nav-btn"
            onClick={handleNext}
            disabled={activeIndex === totalSlides - 1}
            aria-label="Thí nghiệm tiếp theo"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Slide Indicator Dots */}
        <div className="showcase-dots" role="group" aria-label="Chọn thí nghiệm">
          {Array.from({ length: totalSlides }).map((_, idx) => (
            <button
              key={idx}
              type="button"
              className={`showcase-dot ${idx === activeIndex ? 'is-active' : ''}`}
              onClick={() => scrollToIndex(idx)}
              aria-label={`Chuyển đến thí nghiệm ${idx + 1}`}
              aria-current={idx === activeIndex ? 'true' : undefined}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
