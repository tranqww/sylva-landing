export type Point = { x: number; y: number }

/**
 * Catmull-Rom through the given points, emitted as cubic beziers.
 *
 * The reference chart is a soft, continuously curving line rather than a
 * polyline, and Catmull-Rom is the cheapest way to get a curve that actually
 * passes through every data point (a plain quadratic smoothing does not).
 */
export function smoothPath(points: Point[], tension = 0.5): string {
  if (points.length < 2) return ''

  const d: string[] = [`M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`]

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? p2

    const c1x = p1.x + ((p2.x - p0.x) / 6) * tension * 2
    const c1y = p1.y + ((p2.y - p0.y) / 6) * tension * 2
    const c2x = p2.x - ((p3.x - p1.x) / 6) * tension * 2
    const c2y = p2.y - ((p3.y - p1.y) / 6) * tension * 2

    d.push(
      `C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ` +
        `${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`,
    )
  }

  return d.join(' ')
}

/** Map a series of values onto an SVG box. */
export function toPoints(
  values: number[],
  box: { width: number; height: number; padY?: number },
  domain: [number, number],
): Point[] {
  const padY = box.padY ?? 0
  const [min, max] = domain
  const span = max - min || 1
  const usable = box.height - padY * 2

  return values.map((v, i) => ({
    x: (i / (values.length - 1)) * box.width,
    y: padY + usable - ((v - min) / span) * usable,
  }))
}
