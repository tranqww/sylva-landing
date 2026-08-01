import { smoothPath, toPoints } from '../lib/curve'

/** Single-arc progress ring, used as the per-asset glyph on the wide rows. */
export function Ring({
  value,
  color,
  size = 26,
  stroke = 3,
}: {
  value: number
  color: string
  size?: number
  stroke?: number
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r

  // Decorative on purpose. The arc is derived from the same change figure
  // printed next to it, so labelling it would make a screen reader announce
  // the number twice rather than tell anyone something new.
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        className="text-ink/8"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${c * value} ${c}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  )
}

/** The four-segment ring on the collapsed portfolio pill. */
export function SegmentRing({ size = 22, stroke = 3 }: { size?: number; stroke?: number }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const segments = [
    { color: 'var(--color-btc)', span: 0.34 },
    { color: 'var(--color-eth)', span: 0.24 },
    { color: 'var(--color-up)', span: 0.22 },
    { color: 'var(--color-down)', span: 0.12 },
  ]

  let offset = 0

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="animate-[spin_9s_linear_infinite]"
      aria-hidden
    >
      {segments.map((s) => {
        const dash = `${c * s.span - 2.2} ${c}`
        const el = (
          <circle
            key={s.color}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={dash}
            strokeDashoffset={-c * offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )
        offset += s.span
        return el
      })}
    </svg>
  )
}

/** Tiny trend line for the rows that show movement rather than allocation. */
export function Sparkline({
  values,
  color,
  width = 34,
  height = 16,
}: {
  values: number[]
  color: string
  width?: number
  height?: number
}) {
  const pts = toPoints(values, { width, height, padY: 2 }, [0, 1])

  // Decorative: the direction it shows is already stated by the signed
  // percentage beside it.
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" aria-hidden>
      <path
        d={smoothPath(pts, 0.45)}
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
