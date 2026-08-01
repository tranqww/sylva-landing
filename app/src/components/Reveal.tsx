import { useRef, type ElementType, type ReactNode } from 'react'
import { gsap, prefersReducedMotion, useIsoLayoutEffect } from '../lib/motion'

type RevealProps = {
  children: ReactNode
  as?: ElementType
  className?: string
  /** Stagger direct children instead of animating the container as one block. */
  stagger?: boolean
  delay?: number
  start?: string
}

/**
 * Shared scroll reveal. Everything on the page arrives the same way the hero
 * does — up, out of a blur — so the motion language stays consistent past the
 * two beats the reference actually shows.
 */
export function Reveal({
  children,
  as: Tag = 'div',
  className = '',
  stagger = false,
  delay = 0,
  start = 'top 82%',
}: RevealProps) {
  const ref = useRef<HTMLElement>(null)

  useIsoLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const targets = stagger ? Array.from(el.children) : [el]

    if (prefersReducedMotion()) return
    // Hidden here rather than in CSS so `stagger` can hide the children while
    // the container itself stays laid out and measurable.
    gsap.set(targets, { autoAlpha: 0 })

    const ctx = gsap.context(() => {
      gsap.fromTo(
        targets,
        { autoAlpha: 0, y: 26, filter: 'blur(12px)' },
        {
          autoAlpha: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 1,
          delay,
          ease: 'settle',
          stagger: stagger ? 0.09 : 0,
          scrollTrigger: { trigger: el, start, once: true },
        },
      )
    }, el)

    return () => ctx.revert()
  }, [delay, stagger, start])

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  )
}
