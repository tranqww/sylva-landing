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
  // No `duration`: Lenis only honours one when an `easing` is supplied too,
  // and otherwise falls through to the lerp. Passing it documented an intent
  // the library never acted on.
  lenis.scrollTo(target, { offset: -8 })
}

/**
 * Drives Lenis from GSAP's ticker so smooth scrolling and every ScrollTrigger
 * share one clock — otherwise pinned/scrubbed animations visibly lag the page.
 */
export function useSmoothScroll() {
  useEffect(() => {
    if (prefersReducedMotion()) return

    // Lerp only. Lenis picks the duration/easing path exclusively when both
    // are given, so a `duration` alongside a `lerp` is dead configuration.
    const instance = new Lenis({
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
      // lagSmoothing is global state; leaving it off would strip lag
      // protection from every other animation on the page after unmount.
      gsap.ticker.lagSmoothing(500, 33)
    }
  }, [])
}
