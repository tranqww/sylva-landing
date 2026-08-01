import { useRef } from 'react'
import { gsap, ScrollTrigger, prefersReducedMotion, useIsoLayoutEffect } from '../lib/motion'
import { smoothPath, toPoints } from '../lib/curve'
import { CHART } from '../data/site'
import { signedMoney } from '../lib/format'

const W = 480
const H = 186
const PAD_Y = 10

export function SavingsChart() {
  const root = useRef<HTMLDivElement>(null)

  const income = toPoints(CHART.income, { width: W, height: H, padY: PAD_Y }, CHART.domain)
  const expenses = toPoints(CHART.expenses, { width: W, height: H, padY: PAD_Y }, CHART.domain)

  // The marker sits on the active weekday; with 15 samples across 7 days that
  // lands exactly on a data point, so no interpolation is needed.
  const markerIndex = Math.round(((CHART.activeDay + 0.5) / CHART.days.length) * (CHART.income.length - 1))
  const marker = income[markerIndex]

  const tickY = (v: number) => {
    const [min, max] = CHART.domain
    return PAD_Y + (H - PAD_Y * 2) - ((v - min) / (max - min)) * (H - PAD_Y * 2)
  }

  useIsoLayoutEffect(() => {
    const el = root.current
    if (!el) return

    const ctx = gsap.context(() => {
      if (prefersReducedMotion()) return

      const tl = gsap.timeline({
        scrollTrigger: { trigger: el, start: 'top 78%', once: true },
        defaults: { ease: 'settle' },
      })

      // Both series are revealed with a sweeping clip rather than DrawSVG:
      // DrawSVG owns stroke-dasharray, which would flatten the dashed
      // expenses line into a solid one.
      tl.fromTo('[data-grid]', { opacity: 0, scaleX: 0.9 }, { opacity: 1, scaleX: 1, transformOrigin: 'left center', duration: 0.7, stagger: 0.05 }, 0)
        .fromTo('[data-wipe="expenses"]', { attr: { width: 0 } }, { attr: { width: W }, duration: 1.5 }, 0.15)
        .fromTo('[data-wipe="income"]', { attr: { width: 0 } }, { attr: { width: W }, duration: 1.7 }, 0.3)
        .fromTo('[data-marker-line]', { scaleY: 0 }, { scaleY: 1, duration: 0.7, transformOrigin: 'top center' }, 1.25)
        .fromTo('[data-marker-dot]', { scale: 0, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.5, ease: 'back.out(2.2)' }, 1.45)
        .fromTo(
          '[data-tooltip]',
          { autoAlpha: 0, y: 8, scale: 0.92 },
          { autoAlpha: 1, y: 0, scale: 1, duration: 0.55, ease: 'back.out(1.8)' },
          1.5,
        )
        .fromTo('[data-day]', { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.04 }, 0.9)

      return () => ScrollTrigger.getAll().forEach((t) => t.trigger === el && t.kill())
    }, el)

    return () => ctx.revert()
  }, [])

  return (
    <div ref={root} className="relative">
      <div className="flex gap-2">
        {/* y axis */}
        <ul className="tabular flex shrink-0 flex-col justify-between py-[10px] text-[9px] text-ink-faint" style={{ height: H }}>
          {[...CHART.ticks].reverse().map((t) => (
            <li key={t}>{t / 1000}k</li>
          ))}
        </ul>

        <div className="relative min-w-0 flex-1">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full overflow-visible"
            style={{ height: H }}
            preserveAspectRatio="none"
            role="img"
            aria-label="Weekly income against expenses"
          >
            {CHART.ticks.map((t) => (
              <line
                key={t}
                data-grid
                x1="0"
                x2={W}
                y1={tickY(t)}
                y2={tickY(t)}
                stroke="currentColor"
                strokeWidth="1"
                strokeDasharray="1 6"
                strokeLinecap="round"
                className="text-ink/20"
                vectorEffect="non-scaling-stroke"
              />
            ))}

            <defs>
              <clipPath id="wipe-expenses" clipPathUnits="userSpaceOnUse">
                <rect data-wipe="expenses" x="0" y={-20} width={W} height={H + 40} />
              </clipPath>
              <clipPath id="wipe-income" clipPathUnits="userSpaceOnUse">
                <rect data-wipe="income" x="0" y={-20} width={W} height={H + 40} />
              </clipPath>
            </defs>

            <g clipPath="url(#wipe-expenses)">
              <path
                d={smoothPath(expenses, 0.5)}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeDasharray="5 5"
                strokeLinecap="round"
                className="text-ink/30"
                vectorEffect="non-scaling-stroke"
              />
            </g>
            <g clipPath="url(#wipe-income)">
              <path
                d={smoothPath(income, 0.5)}
                fill="none"
                stroke="var(--color-ink)"
                strokeWidth="2.1"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </g>
          </svg>

          {/* marker + tooltip live in HTML so the type stays crisp */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{ ['--mx' as string]: `${(marker.x / W) * 100}%`, ['--my' as string]: `${marker.y}px` }}
          >
            <span
              data-marker-line
              className="absolute top-[38px] w-px bg-linear-to-b from-ink/55 to-ink/12"
              style={{ left: 'var(--mx)', height: tickY(CHART.domain[0]) - 38 }}
            />
            <span
              data-marker-dot
              className="absolute size-[9px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[2px] border-ink bg-white"
              style={{ left: 'var(--mx)', top: 'var(--my)' }}
            />
            <span
              data-tooltip
              className="tabular absolute top-[10px] flex -translate-x-1/2 items-center gap-2 rounded-[7px] bg-ink px-2.5 py-1.5 text-[10.5px] font-medium whitespace-nowrap text-white shadow-[0_8px_20px_-10px_rgb(13_16_12/0.6)]"
              style={{ left: 'var(--mx)' }}
            >
              <span className="text-white/70">{signedMoney(CHART.tooltip.down)}</span>
              <span>{signedMoney(CHART.tooltip.up)}</span>
            </span>
          </div>
        </div>
      </div>

      {/* x axis */}
      <ul className="mt-3 ml-7 grid grid-cols-7 text-center text-[10px]">
        {CHART.days.map((d, i) => (
          <li
            key={d}
            data-day
            className={
              i === CHART.activeDay ? 'font-semibold text-ink' : 'font-medium text-ink-faint'
            }
          >
            {d}
          </li>
        ))}
      </ul>
    </div>
  )
}
