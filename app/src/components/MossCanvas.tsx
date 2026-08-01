import { useRef } from 'react'
import { asset } from '../lib/format'
import { useIsoLayoutEffect } from '../lib/motion'
import { toLimbSpace, type Limb, type Vec } from '../lib/pointer'

const SRC_W = 1200
const SRC_H = 450

/**
 * The load-in pass. It has to land near the reference's coverage — the moss
 * reads as roughly 28% of the limb by 1.5s — while leaving the rest of the
 * limb for the pointer to paint, so it goes fully opaque over a little over
 * half the length rather than faintly over all of it. A half-transparent mask
 * just makes washed-out moss; it does not read as less of it.
 */
const BASE_PEAK = 1
const BASE_REACH = 0.7

export type MossHandle = {
  /** Paint moss at a viewport point. */
  paint: (p: Vec) => void
  /** Reveal everything — reduced motion, or a device with no pointer. */
  fill: () => void
  /** Load-in pass: a soft edge travelling along the limb, 0..1. Idempotent. */
  sweep: (progress: number) => void
}

/**
 * The moss layer as an accumulating canvas rather than a masked <img>.
 *
 * In the reference the moss is painted by the pointer: the growth front tracks
 * the cursor back and forth across the limb rather than sweeping one way, and
 * moss that has appeared never disappears. That needs a persistent, additive
 * reveal buffer, which a CSS mask cannot express — so the moss bitmap is
 * composited against a reveal buffer with `destination-in`.
 *
 * The buffer is two layers, because the two sources behave differently:
 *
 *   base   the load-in pass. Redrawn from scratch on every call, so calling it
 *          once per frame for three seconds lands the same result as calling
 *          it once. It is *not* additive — accumulating a 0.24 alpha gradient
 *          sixty times a second saturates the mask to solid in a few frames.
 *   trail  the pointer. Additive, never cleared, so moss builds where the
 *          cursor lingers and stays where it has been.
 */
export function MossCanvas({
  limb,
  register,
  getLimbEl,
}: {
  limb: Limb
  register: (h: MossHandle | null) => void
  getLimbEl: () => HTMLElement | null
}) {
  const view = useRef<HTMLCanvasElement>(null)

  useIsoLayoutEffect(() => {
    const canvas = view.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const W = Math.round(SRC_W * 0.55 * dpr)
    const H = Math.round(SRC_H * 0.55 * dpr)
    canvas.width = W
    canvas.height = H

    const make = () => {
      const c = document.createElement('canvas')
      c.width = W
      c.height = H
      return [c, c.getContext('2d')] as const
    }

    const [base, bctx] = make()
    const [trail, tctx] = make()
    const [reveal, vctx] = make()
    if (!bctx || !tctx || !vctx) return

    const img = new Image()
    img.decoding = 'async'
    img.src = asset(`assets/branch-${limb.index}-moss.webp`)

    let ready = false
    let dirty = false
    let raf = 0
    // StrictMode runs this effect twice against the *same* canvas node, so the
    // two passes share one 2d context. Without this flag the first pass's
    // `img.onload` would fire after the second pass is live and composite
    // `destination-in` against its own empty reveal buffer, erasing whatever
    // the live instance had painted.
    let killed = false
    let failed = false

    const compose = () => {
      raf = 0
      if (killed || !ready || !dirty) return
      dirty = false

      // A broken HTMLImageElement throws InvalidStateError from drawImage, so
      // a failed asset has to short-circuit before the composite, not just
      // produce an empty mask.
      if (failed) {
        ctx.clearRect(0, 0, W, H)
        return
      }

      // reveal = base ∪ trail
      vctx.globalCompositeOperation = 'source-over'
      vctx.clearRect(0, 0, W, H)
      vctx.drawImage(base, 0, 0)
      vctx.globalCompositeOperation = 'lighter'
      vctx.drawImage(trail, 0, 0)
      vctx.globalCompositeOperation = 'source-over'

      ctx.globalCompositeOperation = 'source-over'
      ctx.clearRect(0, 0, W, H)
      ctx.drawImage(img, 0, 0, W, H)
      ctx.globalCompositeOperation = 'destination-in'
      ctx.drawImage(reveal, 0, 0)
      ctx.globalCompositeOperation = 'source-over'
    }

    const schedule = () => {
      if (killed) return
      dirty = true
      if (!raf) raf = requestAnimationFrame(compose)
    }

    const blob = (x: number, y: number, r: number, a: number) => {
      const g = tctx.createRadialGradient(x, y, 0, x, y, r)
      g.addColorStop(0, `rgba(255,255,255,${a})`)
      g.addColorStop(0.5, `rgba(255,255,255,${a * 0.6})`)
      g.addColorStop(1, 'rgba(255,255,255,0)')
      tctx.fillStyle = g
      tctx.beginPath()
      tctx.arc(x, y, r, 0, Math.PI * 2)
      tctx.fill()
    }

    let last: Vec | null = null

    const handle: MossHandle = {
      paint(p) {
        const el = getLimbEl()
        if (!el) return

        const local = toLimbSpace(el, limb, p.x, p.y, { w: SRC_W, h: SRC_H })
        const x = (local.x / SRC_W) * W
        const y = (local.y / SRC_H) * H

        if (x < -W * 0.25 || x > W * 1.25 || y < -H * 0.6 || y > H * 1.6) {
          last = null
          return
        }

        const r = W * 0.085
        tctx.globalCompositeOperation = 'lighter'

        if (!last) {
          blob(x, y, r, 0.2)
          last = { x, y }
          schedule()
          return
        }

        // A stationary cursor must not keep repainting the same spot every
        // frame — that saturates a hover into a solid blot in a few frames.
        const dist = Math.hypot(x - last.x, y - last.y)
        if (dist < r * 0.12) return

        const steps = Math.min(24, Math.max(1, Math.ceil(dist / (r * 0.3))))
        for (let i = 1; i <= steps; i++) {
          const t = i / steps
          blob(last.x + (x - last.x) * t, last.y + (y - last.y) * t, r, 0.16)
        }

        last = { x, y }
        schedule()
      },

      fill() {
        bctx.globalCompositeOperation = 'source-over'
        bctx.fillStyle = '#fff'
        bctx.fillRect(0, 0, W, H)
        schedule()
      },

      sweep(progress) {
        // Redrawn from scratch, so repeated calls are idempotent.
        const edge = Math.max(0, progress) * W * BASE_REACH
        bctx.globalCompositeOperation = 'source-over'
        bctx.clearRect(0, 0, W, H)

        if (edge > 0) {
          const feather = W * 0.3
          const g = bctx.createLinearGradient(Math.max(0, edge - feather), 0, edge, 0)
          g.addColorStop(0, `rgba(255,255,255,${BASE_PEAK})`)
          g.addColorStop(1, 'rgba(255,255,255,0)')
          bctx.fillStyle = g
          bctx.fillRect(0, 0, edge, H)
        }

        // Unconditional: the clear above is itself a change to show, so
        // sweep(0) has to repaint rather than leave the last mask on screen.
        schedule()
      },
    }

    register(handle)

    img.onload = () => {
      ready = true
      schedule()
    }
    img.onerror = () => {
      // The page degrades to bare bark rather than hanging on a mask that
      // will never arrive — and says so, since an empty <canvas> looks like
      // nothing at all rather than a broken image.
      console.warn(`[MossCanvas] moss layer for limb ${limb.index} failed to load`)
      failed = true
      ready = true
      schedule()
    }

    return () => {
      killed = true
      if (raf) cancelAnimationFrame(raf)
      img.onload = null
      img.onerror = null
      img.src = ''
      // Release the three backing stores rather than waiting for GC; each is
      // roughly 2.6 MB at dpr 2.
      for (const c of [base, trail, reveal]) {
        c.width = 0
        c.height = 0
      }
      register(null)
    }
  }, [limb, register, getLimbEl])

  return (
    <canvas ref={view} aria-hidden className="pointer-events-none absolute inset-0 h-auto w-full" />
  )
}
