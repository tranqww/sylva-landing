import { useLayoutEffect, useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CustomEase } from 'gsap/CustomEase'

gsap.registerPlugin(ScrollTrigger, CustomEase)

/**
 * The reference motion is unusually "settled": everything decelerates hard and
 * then stops dead rather than easing out over a long tail. These two curves
 * carry almost every transition on the page.
 */
CustomEase.create('settle', '0.16, 1, 0.28, 1')
CustomEase.create('swift', '0.33, 1, 0.5, 1')

gsap.defaults({ ease: 'settle', duration: 0.9 })

export const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/** Blur-in reveal shared by the headline, the panels and the section copy. */
export const revealFrom = {
  opacity: 0,
  y: 26,
  filter: 'blur(14px)',
} as const

export const revealTo = {
  opacity: 1,
  y: 0,
  filter: 'blur(0px)',
} as const

export { gsap, ScrollTrigger }
