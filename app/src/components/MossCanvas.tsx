import { useRef } from 'react'
import { asset } from '../lib/format'
import { useIsoLayoutEffect } from '../lib/motion'
import { toLimbSpace, type Limb, type Vec } from '../lib/pointer'

const SRC_W = 1200
const SRC_H = 450

export type MossHandle = {
  /** Paint moss at a viewport point. */
  paint: (p: Vec) => void
  /** Reveal everything — reduced motion, or a device with no pointer. */
  fill: () => void
  /** Soft leading edge travelling along the limb, 0..1. Used for the intro. */
  sweep: (progress: number) => void
}

/**
 * The moss layer as an accumulating canvas rather than a masked <img>.
 *
 * In the reference the moss is painted by the pointer: the growth front tracks
 * the cursor back and forth across the limb rather than sweeping one way, and
 * moss that has appeared never disappears. That needs a persistent, additive
 * reveal buffer, which a CSS mask cannot express — so the moss bitmap is
 * composited against a reveal canvas with `destination-in`.
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

    const reveal = document.createElement('canvas')
    reveal.width = W
    reveal.height = H
    const rctx = reveal.getContext('2d')
    if (!rctx) return

    const img = new Image()
    img.decoding = 'async'
    img.src = asset(`assets/branch-${limb.index}-moss.webp`)

    let ready = false
    let dirty = false
    let raf = 0

    const compose = () => {
      raf = 0
      if (!ready || !dirty) return
      dirty = false
      ctx.clearRect(0, 0, W, H)
      ctx.globalCompositeOperation = 'source-over'
      ctx.drawImage(img, 0, 0, W, H)
      ctx.globalCompositeOperation = 'destination-in'
      ctx.drawImage(reveal, 0, 0)
      ctx.globalCompositeOperation = 'source-over'
    }

    const schedule = () => {
      dirty = true
      if (!raf) raf = requestAnimationFrame(compose)
    }

    const blob = (x: number, y: number, r: number, a: number) => {
      const g = rctx.createRadialGradient(x, y, 0, x, y, r)
      g.addColorStop(0, `rgba(255,255,255,${a})`)
      g.addColorStop(0.5, `rgba(255,255,255,${a * 0.6})`)
      g.addColorStop(1, 'rgba(255,255,255,0)')
      rctx.fillStyle = g
      rctx.beginPath()
      rctx.arc(x, y, r, 0, Math.PI * 2)
      rctx.fill()
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

        rctx.globalCompositeOperation = 'lighter'
        const r = W * 0.085

        // Interpolate along the path so a fast sweep paints a continuous
        // trail rather than a dotted one.
        if (last) {
          const steps = Math.min(24, Math.ceil(Math.hypot(x - last.x, y - last.y) / (r * 0.3)))
          for (let i = 1; i <= steps; i++) {
            const t = i / steps
            blob(last.x + (x - last.x) * t, last.y + (y - last.y) * t, r, 0.17)
          }
        } else {
          blob(x, y, r, 0.2)
        }

        last = { x, y }
        schedule()
      },

      fill() {
        rctx.globalCompositeOperation = 'source-over'
        rctx.fillStyle = '#fff'
        rctx.fillRect(0, 0, W, H)
        schedule()
      },

      sweep(progress) {
        rctx.globalCompositeOperation = 'lighter'
        const edge = progress * W * 1.15
        if (edge <= 0) return
        const g = rctx.createLinearGradient(Math.max(0, edge - W * 0.36), 0, edge, 0)
        g.addColorStop(0, 'rgba(255,255,255,0.24)')
        g.addColorStop(1, 'rgba(255,255,255,0)')
        rctx.fillStyle = g
        rctx.fillRect(0, 0, edge, H)
        schedule()
      },
    }

    register(handle)
    img.onload = () => {
      ready = true
      schedule()
    }

    return () => {
      if (raf) cancelAnimationFrame(raf)
      register(null)
    }
  }, [limb, register, getLimbEl])

  return (
    <canvas
      ref={view}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-auto w-full"
    />
  )
}
