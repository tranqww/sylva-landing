import { useEffect } from 'react'
import Lenis from 'lenis'
import { gsap, ScrollTrigger, prefersReducedMotion } from './motion'

let lenis: Lenis | null = null

/** Scroll to an element (or the top) through Lenis so the easing matches. */
export function scrollTo(target: string | number) {
  if (!lenis) {
    const el = typeof target === 'string' ? document.querySelector(target) : null
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    else window.scrollTo({ top: typeof target === 'number' ? target : 0, behavior: 'smooth' })
    return
  }
  lenis.scrollTo(target, { offset: -8, duration: 1.4 })
}

/**
 * Drives Lenis from GSAP's ticker so smooth scrolling and every ScrollTrigger
 * share one clock — otherwise pinned/scrubbed animations visibly lag the page.
 */
export function useSmoothScroll() {
  useEffect(() => {
    if (prefersReducedMotion()) return

    const instance = new Lenis({
      duration: 1.1,
      lerp: 0.09,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.6,
      smoothWheel: true,
    })
    lenis = instance

    instance.on('scroll', ScrollTrigger.update)

    const tick = (time: number) => instance.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(tick)
      instance.destroy()
      lenis = null
    }
  }, [])
}
