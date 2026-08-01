import { useRef } from 'react'
import { gsap, ScrollTrigger, prefersReducedMotion, useIsoLayoutEffect } from '../lib/motion'
import { asset } from '../lib/format'
import { Dashboard } from './Dashboard'

/**
 * The second beat of the reference: a photographic panel and a floating
 * dashboard that overlap, arriving out of the same blur the hero left behind.
 */
export function Showcase() {
  const root = useRef<HTMLElement>(null)

  useIsoLayoutEffect(() => {
    const el = root.current
    if (!el) return

    const ctx = gsap.context(() => {
      if (prefersReducedMotion()) {
        gsap.set('[data-panel], [data-dashboard-wrap], [data-panel-copy] > *', {
          autoAlpha: 1,
          x: 0,
          y: 0,
          scale: 1,
          filter: 'none',
        })
        return
      }

      gsap
        .timeline({
          scrollTrigger: { trigger: el, start: 'top 72%', once: true },
          defaults: { ease: 'settle' },
        })
        .fromTo(
          '[data-panel]',
          { autoAlpha: 0, scale: 0.94, filter: 'blur(18px)' },
          { autoAlpha: 1, scale: 1, filter: 'blur(0px)', duration: 1.25 },
          0,
        )
        .fromTo(
          '[data-dashboard-wrap]',
          { autoAlpha: 0, x: 46, y: 22, filter: 'blur(16px)' },
          { autoAlpha: 1, x: 0, y: 0, filter: 'blur(0px)', duration: 1.25 },
          0.14,
        )
        .fromTo(
          '[data-panel-copy] > *',
          { autoAlpha: 0, y: 22, filter: 'blur(10px)' },
          { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.95, stagger: 0.1 },
          0.45,
        )

      // gentle counter-drift keeps the two planes reading as separate depths
      gsap.to('[data-panel]', {
        yPercent: -4,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 0.8 },
      })
      gsap.to('[data-dashboard-wrap]', {
        yPercent: 5,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 0.8 },
      })
    }, el)

    return () => {
      ctx.revert()
      ScrollTrigger.refresh()
    }
  }, [])

  return (
    <section
      ref={root}
      id="about"
      className="relative z-20 flex min-h-[100svh] items-center px-5 py-24"
    >
      {/* Proportions follow the reference frame: a 525×542 photo panel and a
          514×452 dashboard offset 96px down, overlapping by a hair. */}
      <div className="mx-auto w-full max-w-[1030px]">
        <div className="relative grid gap-4 lg:grid-cols-[minmax(0,525fr)_minmax(0,514fr)] lg:gap-0">
          {/* ------------------------------------------------- photo panel */}
          <figure
            data-panel
            className="relative isolate overflow-hidden rounded-[20px] lg:col-start-1 lg:row-start-1 lg:h-[542px]"
          >
            <img
              src={asset('assets/valley.webp')}
              alt="A hazy mountain valley at first light, seen from a high overlook"
              width={1440}
              height={1210}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 size-full object-cover object-[46%_62%]"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/76 via-black/26 to-black/5" />

            <figcaption
              data-panel-copy
              className="relative flex h-full min-h-[320px] flex-col justify-end p-6 md:p-7 lg:pr-16"
            >
              <h2 className="text-[clamp(1.25rem,1.9vw,1.5rem)] leading-[1.1] text-white">
                Your Digital Portfolio,
                <br />
                Smarter and Simpler
              </h2>
              <p className="mt-3 max-w-[24rem] text-[12.5px] leading-[1.6] text-white/78">
                Get real-time data, detailed analytics, and the insights you need to make informed
                decisions quickly and securely.
              </p>
            </figcaption>
          </figure>

          {/* --------------------------------------------------- dashboard */}
          <div
            data-dashboard-wrap
            className="lg:col-start-2 lg:row-start-1 lg:-ml-3 lg:h-[542px] lg:pt-[96px]"
          >
            <Dashboard />
          </div>
        </div>
      </div>
    </section>
  )
}
