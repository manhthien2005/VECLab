'use client'

import { useCallback, useEffect, useRef, type ReactNode } from 'react'

export interface HeroPointerStageProps {
  children: ReactNode
}

/**
 * Lightweight client leaf controller for Hero preview pointer depth.
 *
 * Responsibilities:
 * - Scoped pointer event handling (only on preview stage, never window/document)
 * - Capability detection (hover: hover, pointer: fine, prefers-reduced-motion: reduce)
 * - requestAnimationFrame coalescing for 60fps compositor updates
 * - Direct CSS custom property writes (--hero-pointer-x, --hero-pointer-y)
 * - Zero React state updates per pointer frame
 * - Smooth neutral return on pointer leave
 * - Proper cleanup on unmount
 *
 * Does not import or contain any scientific domain constants or data.
 */
export function HeroPointerStage({ children }: HeroPointerStageProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rafId = useRef<number | null>(null)
  const isFinePointer = useRef(false)
  const isReducedMotion = useRef(false)
  const latestCoords = useRef<{ x: number; y: number } | null>(null)

  const resetToNeutral = useCallback(() => {
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current)
      rafId.current = null
    }
    const el = containerRef.current
    if (el) {
      el.style.setProperty('--hero-pointer-x', '0')
      el.style.setProperty('--hero-pointer-y', '0')
      el.dataset.pointerActive = 'false'
    }
  }, [])

  useEffect(() => {
    // Detect fine pointer capability and reduced motion preferences
    const finePointerMql = window.matchMedia('(hover: hover) and (pointer: fine)')
    const reducedMotionMql = window.matchMedia('(prefers-reduced-motion: reduce)')

    isFinePointer.current = finePointerMql.matches
    isReducedMotion.current = reducedMotionMql.matches

    const onFinePointerChange = (e: MediaQueryListEvent) => {
      isFinePointer.current = e.matches
      if (!e.matches) {
        resetToNeutral()
      }
    }

    const onReducedMotionChange = (e: MediaQueryListEvent) => {
      isReducedMotion.current = e.matches
      if (e.matches) {
        resetToNeutral()
      }
    }

    finePointerMql.addEventListener?.('change', onFinePointerChange)
    reducedMotionMql.addEventListener?.('change', onReducedMotionChange)

    return () => {
      finePointerMql.removeEventListener?.('change', onFinePointerChange)
      reducedMotionMql.removeEventListener?.('change', onReducedMotionChange)
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current)
        rafId.current = null
      }
    }
  }, [resetToNeutral])

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    // Suppress runtime work if device lacks fine pointer or user requested reduced motion
    if (!isFinePointer.current || isReducedMotion.current) return

    const el = containerRef.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return

    // Normalized from -1 (left/top) to +1 (right/bottom)
    const rawX = ((e.clientX - rect.left) / rect.width) * 2 - 1
    const rawY = ((e.clientY - rect.top) / rect.height) * 2 - 1
    const clampedX = Math.max(-1, Math.min(1, rawX))
    const clampedY = Math.max(-1, Math.min(1, rawY))

    latestCoords.current = { x: clampedX, y: clampedY }

    if (rafId.current === null) {
      rafId.current = requestAnimationFrame(() => {
        rafId.current = null
        if (!containerRef.current || !latestCoords.current) return
        containerRef.current.style.setProperty('--hero-pointer-x', latestCoords.current.x.toFixed(4))
        containerRef.current.style.setProperty('--hero-pointer-y', latestCoords.current.y.toFixed(4))
        containerRef.current.dataset.pointerActive = 'true'
      })
    }
  }

  const handlePointerLeave = () => {
    resetToNeutral()
  }

  return (
    <div
      ref={containerRef}
      className="hero-pointer-stage"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {children}
    </div>
  )
}
