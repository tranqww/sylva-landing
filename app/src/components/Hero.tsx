import { useRef } from 'react'
import { gsap, ScrollTrigger, prefersReducedMotion, useIsoLayoutEffect } from '../lib/motion'
import { PortfolioMorph, type PortfolioMorphHandle } from './PortfolioMorph'
import { Plus } from './icons'

export function Hero() {
  const root = useRef<HTMLElement>(null)
  const portfolio = useRef<PortfolioMorphHandle>(null)

  useIsoLayoutEffect(() => {
    const el = root.current
    if (!el) return

    const ctx = gsap.context(() => {
      if (prefersReducedMotion()) {
        gsap.set(
          gsap.utils.toArray<HTMLElement>('[data-line], [data-sub], [data-portfolio], [data-cue], [data-nav-item]', document),
          { autoAlpha: 1, y: 0, filter: 'none' },
        )
        portfolio.current?.expand()
        return
      }

      // ---------------------------------------------------------- intro
      // The nav lives outside this context's root, so it is looked up
      // explicitly rather than through a scoped selector string.
      const navItems = gsap.utils.toArray<HTMLElement>('[data-nav-item]', document)
      const tl = gsap.timeline({ defaults: { ease: 'settle' } })

      tl.fromTo(
        navItems,
        { autoAlpha: 0, y: -10, filter: 'blur(8px)' },
        { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.9, stagger: 0.05 },
        0.15,
      )
        .fromTo(
          '[data-line]',
          { autoAlpha: 0, y: 30, filter: 'blur(16px)' },
          { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 1.15, stagger: 0.13 },
          0.25,
        )
        .fromTo(
          '[data-sub]',
          { autoAlpha: 0, y: 16, filter: 'blur(10px)' },
          { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 1 },
          0.72,
        )
        // `clearProps: 'filter'` matters here, not just tidiness: a settled
        // `filter: blur(0px)` still counts as a filter, which makes the
        // element a Backdrop Root — and every `panel-glass` inside the
        // portfolio would then sample its own subtree instead of the branch
        // art behind it, silently flattening the glass.
        .fromTo(
          '[data-portfolio]',
          { autoAlpha: 0, y: 20, filter: 'blur(12px)' },
          { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 1, clearProps: 'filter' },
          0.9,
        )
        .fromTo('[data-cue]', { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.8 }, 1.15)
        .call(() => portfolio.current?.expand(), undefined, 1.85)

      // ------------------------------------------------- scroll handoff
      // The hero dissolves rather than scrolls away: the copy blurs out and
      // drifts up, which is what sells the depth-of-field change in the
      // reference. The limbs are handled by BranchScene against the same
      // trigger so the two halves stay in step.
      //
      // The blur is applied to the text only. Putting it on the whole copy
      // block would make that block a Backdrop Root from progress 0 onward —
      // ScrollTrigger writes `blur(0px)` as soon as it renders — and the glass
      // panels nested inside it would stop sampling the page behind them.
      ScrollTrigger.create({
        trigger: el,
        start: 'top top',
        end: 'bottom top',
        scrub: 0.6,
        invalidateOnRefresh: true,
        animation: gsap
          .timeline()
          .to('[data-hero-text]', { autoAlpha: 0, filter: 'blur(16px)', ease: 'none' }, 0)
          .to('[data-hero-copy]', { y: -70, autoAlpha: 0, scale: 0.97, ease: 'none' }, 0)
          .to('[data-cue]', { autoAlpha: 0, duration: 0.2, ease: 'none' }, 0),
      })
    }, el)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={root}
      id="top"
      className="relative z-20 flex min-h-[100svh] flex-col items-center justify-center px-5 pt-28 pb-24"
    >
      <div data-hero-copy className="flex w-full flex-col items-center">
        {/* Wrapper exists so the scroll blur can target the text alone —
            see the ScrollTrigger note above. */}
        <div data-hero-text className="flex w-full flex-col items-center">
          <h1 className="text-center text-[clamp(2.35rem,4.15vw,3.7rem)] leading-[0.92]">
            <span data-line className="anim-hidden block text-ink-ghost">
              A New Way
            </span>
            <span data-line className="anim-hidden block text-ink">
              to Manage Your
            </span>
            <span data-line className="anim-hidden block text-ink">
              Digital Wealth
            </span>
          </h1>

          <p
            data-sub
            className="anim-hidden mt-6 max-w-[21.5rem] text-center text-[13.5px] leading-[1.55] text-ink-muted"
          >
            Take full control of your crypto assets with our comprehensive portfolio management
            platform.
          </p>
        </div>

        <div className="mt-11 w-full max-w-[390px] md:mt-14">
          <PortfolioMorph ref={portfolio} />
        </div>
      </div>

      {/* Centred with flow rather than a translate: the reduced-motion
          fallback must not have to preserve a positioning transform. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-9 flex justify-center">
        <div
          data-cue
          className="anim-hidden eyebrow flex items-center gap-3 rounded-full bg-white/45 px-3.5 py-1.5 text-ink-soft backdrop-blur-md"
        >
          <Plus className="size-2 opacity-50" />
          <span className="whitespace-nowrap">Scroll to explore</span>
          <Plus className="size-2 opacity-50" />
        </div>
      </div>
    </section>
  )
}
