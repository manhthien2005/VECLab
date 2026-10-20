'use client'

import { useEffect, type RefObject } from 'react'
import { PLASTIC_MOTION_MS, type PlasticMotion, type PlasticScene } from './motion.js'

/** Only owns inner transient transforms. The SVG's outer placement always renders the saved state. */
export function usePlasticSceneMotion(root: RefObject<HTMLElement | null>, motion: PlasticMotion | null, scene: PlasticScene, onEnd: (key: string) => void) {
  useEffect(() => {
    const element = root.current
    if (!element || !motion?.playing) return
    let disposed = false
    let settled = false
    const animations: Animation[] = []
    const preference = matchMedia('(prefers-reduced-motion: reduce)')
    const settle = () => {
      if (disposed || settled) return
      settled = true
      animations.forEach(animation => animation.cancel())
      onEnd(motion.key)
    }
    const onPreference = () => { if (preference.matches) settle() }
    const onVisibility = () => { if (document.visibilityState === 'hidden') settle() }
    preference.addEventListener('change', onPreference)
    document.addEventListener('visibilitychange', onVisibility)
    const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(([entry]) => { if (!entry?.isIntersecting) settle() })
    observer?.observe(element)
    const rect = element.getBoundingClientRect()
    const duration = PLASTIC_MOTION_MS[motion.actionType] ?? 700
    const easing = getComputedStyle(element).getPropertyValue('--ease-out').trim() || 'ease-out'
    const animate = (target: Element, frames: Keyframe[], timing: KeyframeAnimationOptions) => {
      animations.push(target.animate(frames, { fill: 'both', ...timing }))
    }
    if (preference.matches || document.visibilityState === 'hidden' || !element.animate || !rect.width || !rect.height || rect.bottom <= 0 || rect.top >= innerHeight) settle()
    else {
      element.querySelectorAll<SVGElement>('[data-motion-particle]').forEach((target, index) => {
        const dx = Number(target.dataset.fromX ?? 0), dy = Number(target.dataset.fromY ?? 0)
        const start = `translate(${dx}px, ${dy}px)`
        const via = `translate(${Number(target.dataset.viaX ?? dx)}px, ${Number(target.dataset.viaY ?? dy)}px)`
        const frames = scene === 'weigh' ? [
          { transform: start, offset: 0, easing }, { transform: via, offset: .2, easing: 'linear' },
          { transform: via, offset: .66, easing },
          { transform: 'translate(0px, 0px)', offset: .94 }, { transform: 'translate(0px, 0px)', offset: 1 },
        ] : [
          { transform: start, offset: 0 },
          { transform: `translate(${dx + 10}px, ${dy - 7}px)`, offset: .22 },
          { transform: 'translate(0px, 0px)', offset: 1 },
        ]
        animate(target, frames, { duration: duration - 140, delay: (index % 8) * 18, easing: scene === 'weigh' ? 'linear' : easing })
      })
      element.querySelectorAll('[data-liquid-fill]').forEach(target => {
        if (motion.actionType === 'load_and_wet') animate(target, [{ transform: 'scaleY(.04)', opacity: .3 }, { transform: 'scaleY(1)', opacity: 1 }], { duration: 850, easing })
      })
      element.querySelectorAll('[data-stirrer]').forEach(target => {
        if (['load_and_wet', 'run_ethanol_preset', 'run_nacl_preset'].includes(motion.actionType)) animate(target, [{ transform: 'scaleX(1)' }, { transform: 'scaleX(-1)' }, { transform: 'scaleX(1)' }], { duration: 380, iterations: 5, easing: 'linear' })
      })
      element.querySelectorAll('[data-rotor]').forEach(target => {
        if (motion.actionType === 'centrifuge_and_weigh') animate(target, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(1080deg)' }], { duration: 1400, delay: 600, easing: 'linear' })
      })
      element.querySelectorAll('[data-scene-reveal]').forEach((target, index) => animate(target, [{ transform: 'translateY(8px)', opacity: .45 }, { transform: 'translateY(0px)', opacity: 1 }], { duration: scene === 'samples' || scene === 'fractions' ? duration - 200 : 240, delay: index * 35, easing }))
      if (!animations.length) settle()
      else void Promise.all(animations.map(animation => animation.finished)).then(settle).catch(() => { if (!disposed) settle() })
    }
    return () => {
      disposed = true
      animations.forEach(animation => animation.cancel())
      observer?.disconnect()
      preference.removeEventListener('change', onPreference)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [root, motion, scene, onEnd])
}
