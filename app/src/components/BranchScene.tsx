import { useRef } from 'react'
import { gsap, ScrollTrigger, prefersReducedMotion, useIsoLayoutEffect } from '../lib/motion'
import { asset } from '../lib/format'
import { watchPointer, type Limb, type Vec } from '../lib/pointer'
import { MossCanvas, type MossHandle } from './MossCanvas'

/**
 * Limb geometry. The base rotation is applied inline rather than through a
 * utility class because `toLimbSpace` has to invert exactly this transform to
 * turn a viewport pointer position into a paint coordinate.
 */
const LIMBS: Limb[] = [
  {
    index: 1,
    mirrored: true,
    rotate: -21,
    depth: 1,
    style: { left: '28%', bottom: '-26%', width: '112%', transformOrigin: '0% 100%' },
  },
  {
    index: 2,
    mirrored: false,
    rotate: 26,
    depth: 0.55,
    style: { right: '56%', bottom: '-20%', width: '80%', transformOrigin: '100% 100%' },
  },
]

export function BranchScene() {
  const root = useRef<HTMLDivElement>(null)
  const limbs = useRef<(HTMLDivElement | null)[]>([])
  const moss = useRef<(MossHandle | null)[]>([null, null])

  // Built once and reused: a fresh closure per render would change MossCanvas's
  // effect deps every time and wipe the accumulated moss.
  const registerMoss = useRef(
    LIMBS.map((_, i) => (h: MossHandle | null) => {
      moss.current[i] = h
    }),
  ).current
  const getLimbEl = useRef(LIMBS.map((_, i) => () => limbs.current[i])).current

  useIsoLayoutEffect(() => {
    const el = root.current
    if (!el) return

    const hero = document.querySelector('#top')
    const coarse = window.matchMedia('(pointer: coarse)').matches

    const ctx = gsap.context(() => {
      if (prefersReducedMotion()) {
        moss.current.forEach((m) => m?.fill())
        return
      }

      // ------------------------------------------------------------ intro
      // Measured off the reference at 30fps: the limb sweeps up into frame
      // between 0.10s and 0.40s, sharp and opaque — it does not fade in.
      const tl = gsap.timeline()

      tl.fromTo(
        '[data-branch]',
        { yPercent: 58, xPercent: -8, scale: 1.12, autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.16, ease: 'none' },
        0,
      ).to(
        '[data-branch]',
        { yPercent: 0, xPercent: 0, scale: 1, duration: 1.9, ease: 'expo.out', stagger: 0.42 },
        0,
      )

      // A base growth pass, so the limbs are never bare before the visitor has
      // moved anything and so touch devices — which never send a pointermove —
      // still get moss.
      // Reference coverage: 4% of the limb at 0.5s, 10% at 1.0s, ~29% by 1.5s,
      // then held. This pass tracks that curve.
      const base = { v: 0 }
      tl.to(
        base,
        {
          v: 1,
          duration: 1.25,
          ease: 'power2.inOut',
          onUpdate: () => moss.current.forEach((m) => m?.sweep(base.v)),
        },
        0.35,
      )
      if (coarse) tl.call(() => moss.current.forEach((m) => m?.fill()), undefined, 2.2)

      // ---------------------------------------------------------- pointer
      // The limbs lean toward the pointer and the moss is painted wherever it
      // travels. Both are lerped on the GSAP ticker rather than driven straight
      // off the event, which keeps the reference's heavy, damped feel and caps
      // the paint rate at one pass per frame.
      const target: Vec = { x: 0, y: 0 }
      const eased: Vec = { x: 0, y: 0 }
      let pending: Vec | null = null

      const stopPointer = watchPointer((p) => {
        pending = p
        target.x = (p.x / window.innerWidth - 0.5) * 2
        target.y = (p.y / window.innerHeight - 0.5) * 2
      })

      const tilt = el.querySelector('[data-branch-tilt]')

      const tick = () => {
        eased.x += (target.x - eased.x) * 0.055
        eased.y += (target.y - eased.y) * 0.055

        limbs.current.forEach((node, i) => {
          if (!node) return
          const d = LIMBS[i].depth
          gsap.set(node, { x: eased.x * 30 * d, y: eased.y * 22 * d })
        })

        if (tilt) {
          gsap.set(tilt, { rotationY: eased.x * 2.6, rotationX: -eased.y * 1.8 })
        }

        if (pending) {
          const p = pending
          pending = null
          moss.current.forEach((m) => m?.paint(p))
        }
      }

      gsap.ticker.add(tick)

      // ------------------------------------------------------ scroll exit
      if (hero) {
        gsap.to('[data-branch-layer]', {
          yPercent: 20,
          scale: 1.16,
          autoAlpha: 0,
          filter: 'blur(14px)',
          ease: 'none',
          scrollTrigger: {
            trigger: hero,
            start: 'top top',
            end: 'bottom top',
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
        })
      }

      return () => {
        gsap.ticker.remove(tick)
        stopPointer()
      }
    }, el)

    return () => {
      ctx.revert()
      ScrollTrigger.refresh()
    }
  }, [])

  return (
    <div
      ref={root}
      aria-hidden
      className="pointer-events-none fixed inset-2 z-10 overflow-hidden rounded-[22px] md:inset-3.5 md:rounded-[var(--radius-frame)]"
      style={{ perspective: '1600px' }}
    >
      <div data-branch-layer className="absolute inset-0">
        {/* Tilt lives on its own wrapper so the scroll exit and the pointer
            parallax never write the same element's transform. */}
        <div data-branch-tilt className="absolute inset-0">
          {LIMBS.map((limb, i) => (
            <div
              key={limb.index}
              data-branch
              ref={(n) => {
                limbs.current[i] = n
              }}
              className="absolute"
              style={{ ...limb.style, rotate: `${limb.rotate}deg` }}
            >
              <div
                className="relative"
                style={{ transform: limb.mirrored ? 'scaleX(-1)' : undefined }}
              >
                <img
                  src={asset(`assets/branch-${limb.index}.webp`)}
                  alt=""
                  width={1200}
                  height={450}
                  draggable={false}
                  fetchPriority="high"
                  className="w-full select-none"
                />
                <MossCanvas limb={limb} register={registerMoss[i]} getLimbEl={getLimbEl[i]} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Atmospheric veil: the limbs dissolve upward into the same haze the
          screen gradient ends on. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg,#f4f7f6 0%,rgba(244,247,246,0.92) 22%,rgba(244,247,246,0.55) 44%,rgba(244,247,246,0.12) 66%,rgba(244,247,246,0) 80%)',
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-[30%]"
        style={{
          background: 'linear-gradient(0deg,rgba(206,214,214,0.55) 0%,rgba(206,214,214,0) 100%)',
        }}
      />
    </div>
  )
}
