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
export function toLimbSpace(
  el: HTMLElement,
  limb: Limb,
  px: number,
  py: number,
  size: { w: number; h: number },
): Vec {
  const r = el.getBoundingClientRect()
  const cx = r.left + r.width / 2
  const cy = r.top + r.height / 2

  const t = (-limb.rotate * Math.PI) / 180
  const dx = px - cx
  const dy = py - cy

  let lx = dx * Math.cos(t) - dy * Math.sin(t)
  let ly = dx * Math.sin(t) + dy * Math.cos(t)

  // The AABB of a rotated box is larger than the box, so recover the scale
  // from the unrotated width the element was laid out at.
  const a = Math.abs(Math.cos((limb.rotate * Math.PI) / 180))
  const b = Math.abs(Math.sin((limb.rotate * Math.PI) / 180))
  const det = a * a - b * b
  const w = det !== 0 ? (a * r.width - b * r.height) / det : r.width
  const scale = w / size.w || 1

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
