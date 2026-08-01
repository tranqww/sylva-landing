export type Vec = { x: number; y: number }

/**
 * Geometry of one limb, in one place, because both CSS and the pointer maths
 * need to agree on it. The rotation is applied inline from here rather than
 * through a utility class so there is a single source of truth to invert.
 */
export type Limb = {
  index: 1 | 2
  mirrored: boolean
  rotate: number
  /** 0 = far background, 1 = closest to camera. Drives parallax amplitude. */
  depth: number
  style: React.CSSProperties
}

/**
 * Map a viewport point into a limb's own, unrotated coordinate space.
 *
 * `getBoundingClientRect` only yields the axis-aligned bounding box of a
 * rotated element, which is useless here — but every transform on the limb is
 * one we applied ourselves, so the inverse is closed-form: undo the translate
 * to the element centre, undo the rotation, undo the scale, then undo the
 * mirror.
 */
/**
 * One box measurement per limb per frame.
 *
 * Reading `getBoundingClientRect` forces a style recalculation whenever it
 * follows a transform write in the same frame, and the pointer handler used to
 * read it once per limb per event. Caching for the whole session is not an
 * option either — the parallax moves the limbs continuously, so a stale box
 * would drift the brush away from the cursor. Measuring once per frame, before
 * that frame's writes, is both accurate and free of the read-after-write.
 */
let generation = 0
const boxes = new WeakMap<HTMLElement, { gen: number; rect: DOMRect }>()

/** Call at the top of each frame, before any transform is written. */
export function newFrame() {
  generation++
}

function boxOf(el: HTMLElement): DOMRect {
  const hit = boxes.get(el)
  if (hit && hit.gen === generation) return hit.rect

  const rect = el.getBoundingClientRect()
  boxes.set(el, { gen: generation, rect })
  return rect
}

export function toLimbSpace(
  el: HTMLElement,
  limb: Limb,
  px: number,
  py: number,
  size: { w: number; h: number },
): Vec {
  const r = boxOf(el)
  const cx = r.left + r.width / 2
  const cy = r.top + r.height / 2

  const t = (-limb.rotate * Math.PI) / 180
  const dx = px - cx
  const dy = py - cy

  let lx = dx * Math.cos(t) - dy * Math.sin(t)
  let ly = dx * Math.sin(t) + dy * Math.cos(t)

  // The AABB of a rotated box is larger than the box, so recover the scale
  // from the unrotated size the element was laid out at.
  //
  // Solving the 2x2 system per-axis would divide by cos(2θ), which vanishes at
  // ±45° and is ill-conditioned anywhere near it. Summing the two rows instead
  // gives Wbb + Hbb = (w + h)(a + b), whose divisor is bounded below by
  // (size.w + size.h) at every angle.
  const rad = (limb.rotate * Math.PI) / 180
  const a = Math.abs(Math.cos(rad))
  const b = Math.abs(Math.sin(rad))
  const scale = (r.width + r.height) / ((a + b) * (size.w + size.h)) || 1

  lx /= scale
  ly /= scale

  if (limb.mirrored) lx = -lx

  return { x: lx + size.w / 2, y: ly + size.h / 2 }
}

/** Pointer position in viewport space, plus whether one has ever been seen. */
export function watchPointer(onMove: (p: Vec) => void): () => void {
  const handle = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return
    onMove({ x: e.clientX, y: e.clientY })
  }

  window.addEventListener('pointermove', handle, { passive: true })
  return () => window.removeEventListener('pointermove', handle)
}
