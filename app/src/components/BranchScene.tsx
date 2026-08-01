import { useRef } from 'react'
import { gsap, ScrollTrigger, prefersReducedMotion, useIsoLayoutEffect } from '../lib/motion'
import { asset } from '../lib/format'

type BranchProps = {
  index: 1 | 2
  /** Mirrored branches read as the opposite limb of the same tree. */
  mirrored?: boolean
  className?: string
}

function Branch({ index, mirrored = false, className = '' }: BranchProps) {
  return (
    <div data-branch className={`absolute ${className}`}>
      <div className="relative" style={{ transform: mirrored ? 'scaleX(-1)' : undefined }}>
        <img
          src={asset(`assets/branch-${index}.webp`)}
          alt=""
          width={1200}
          height={450}
          draggable={false}
          fetchPriority="high"
          className="w-full select-none"
        />
        <img
          data-moss
          src={asset(`assets/branch-${index}-moss.webp`)}
          alt=""
          width={1200}
          height={450}
          draggable={false}
          className="branch-moss absolute inset-0 w-full select-none"
        />
      </div>
    </div>
  )
}

/**
 * The two limbs that frame the hero, arranged into the notch the reference
 * opens on: a near limb sweeping up to the right edge and a far limb falling
 * away to the left, meeting just off the bottom of the frame.
 *
 * The layer is viewport-fixed and clipped to the rounded screen, so the
 * silhouette is cut by the frame radius and parallax never exposes an edge.
 * Its own timeline lives here rather than in `Hero` because a GSAP context
 * scopes selector lookups to its root element, and this subtree is a sibling.
 */
export function BranchScene() {
  const root = useRef<HTMLDivElement>(null)

  useIsoLayoutEffect(() => {
    const el = root.current
    if (!el) return

    // Resolved outside the context: a context scopes *all* selector text it
    // sees, including ScrollTrigger's `trigger`, and the hero is a sibling.
    const hero = document.querySelector('#top')

    const ctx = gsap.context(() => {
      if (prefersReducedMotion()) {
        // The limbs default to bare so the moss can grow; without a timeline
        // to run, the grown state has to be set directly.
        gsap.set('[data-moss]', { '--moss': 1, autoAlpha: 1 })
        return
      }

      // Timings and distances read off the reference frame by frame (branch
      // centroid and moss coverage tracked per frame, 30 fps):
      //
      //   0.10 → 0.40s  the limb sweeps up into frame from the lower left —
      //                 area 0.1% → 18.6%, leading edge 0.94 → 0.53 of the
      //                 card height. It arrives sharp and opaque; it does not
      //                 fade or blur in.
      //   0.60 → 1.35s  moss grows on the bare limb, 2% → 32% of its area,
      //                 steepest between 0.9s and 1.2s.
      //   1.3s onward   a slow continuous float: up until ~1.2s, back down and
      //                 left until ~2.6s, out again from ~3.4s.
      const tl = gsap.timeline()

      tl.fromTo(
        '[data-branch]',
        { yPercent: 58, xPercent: -8, scale: 1.12, autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.16, ease: 'none' },
        0,
      )
        .to(
          '[data-branch]',
          {
            yPercent: 0,
            xPercent: 0,
            scale: 1,
            duration: 1.9,
            ease: 'expo.out',
            stagger: 0.42,
          },
          0,
        )
        // moss creeps along each limb while it is still settling
        .fromTo(
          '[data-moss]',
          { '--moss': 0, autoAlpha: 0 },
          { '--moss': 1, autoAlpha: 1, duration: 0.9, ease: 'power2.inOut', stagger: 0.42 },
          0.55,
        )
        // and then it never fully stops — the reference limb keeps drifting
        // for the whole ten seconds, which is most of why it reads as filmed
        // rather than placed.
        .add(() => {
          gsap.to('[data-branch]', {
            yPercent: 2.1,
            xPercent: -1.3,
            duration: 3.4,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1,
            stagger: { each: 0.9, from: 'end' },
          })
        }, 1.5)

      // Hand-off to the second beat: the limbs push down and grow out of
      // focus while the hero copy dissolves upward.
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
    >
      <div data-branch-layer className="absolute inset-0">
        {/* near limb — thick end off the right edge, sweeping up out of the notch */}
        <Branch
          index={1}
          mirrored
          className="bottom-[-26%] left-[28%] w-[118%] origin-bottom-left rotate-[-21deg] sm:w-[104%] lg:left-[31%] lg:w-[92%]"
        />
        {/* far limb — thick end off the left edge, falling into the notch */}
        <Branch
          index={2}
          className="bottom-[-20%] right-[56%] w-[86%] origin-bottom-right rotate-[26deg] sm:w-[74%] lg:right-[58%] lg:w-[66%]"
        />
      </div>

      {/* Atmospheric veil. The limbs dissolve upward into the same haze the
          screen gradient ends on, which is what keeps the composite from
          reading as a photograph pasted onto a background. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg,#f4f7f6 0%,rgba(244,247,246,0.92) 22%,rgba(244,247,246,0.55) 44%,rgba(244,247,246,0.12) 66%,rgba(244,247,246,0) 80%)',
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-[30%]"
        style={{ background: 'linear-gradient(0deg,rgba(206,214,214,0.55) 0%,rgba(206,214,214,0) 100%)' }}
      />
    </div>
  )
}
