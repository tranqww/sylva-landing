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
      if (prefersReducedMotion()) return

      gsap
        .timeline({ defaults: { ease: 'settle' } })
        .fromTo(
          '[data-branch]',
          { yPercent: 22, scale: 1.12, autoAlpha: 0, filter: 'blur(20px)' },
          {
            yPercent: 0,
            scale: 1,
            autoAlpha: 1,
            filter: 'blur(0px)',
            duration: 2,
            stagger: 0.14,
          },
          0,
        )
        // moss creeps along each limb once it has settled into place
        .fromTo(
          '[data-moss]',
          { '--moss': 0.08 },
          { '--moss': 1, duration: 2.2, ease: 'swift', stagger: 0.18 },
          0.4,
        )

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
