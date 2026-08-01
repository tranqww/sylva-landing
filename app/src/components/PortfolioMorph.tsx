import { useCallback, useImperativeHandle, useRef, useState, type Ref } from 'react'
import { gsap, prefersReducedMotion } from '../lib/motion'
import { COINS } from '../data/site'
import { money, percent } from '../lib/format'
import { CoinIcon, Logo } from './icons'
import { Ring, SegmentRing, Sparkline } from './Charts'

const COLLAPSED_H = 52

export type PortfolioMorphHandle = { expand: () => void }

/**
 * The hero's centrepiece: a compact pill that unfolds into the live asset list.
 *
 * The two states are both mounted — the pill cross-fades out while the rows
 * stagger up through a blur — and the wrapper's height is animated between the
 * measured sizes so nothing below it jumps.
 */
export function PortfolioMorph({ ref }: { ref?: Ref<PortfolioMorphHandle> }) {
  const wrap = useRef<HTMLDivElement>(null)
  const pill = useRef<HTMLButtonElement>(null)
  const list = useRef<HTMLUListElement>(null)
  const [expanded, setExpanded] = useState(false)
  const busy = useRef(false)

  const expand = useCallback(() => {
    if (expanded || busy.current || !wrap.current || !list.current || !pill.current) return
    setExpanded(true)

    const rows = gsap.utils.toArray<HTMLElement>('[data-row]', list.current)
    const target = list.current.scrollHeight

    if (prefersReducedMotion()) {
      gsap.set(wrap.current, { height: 'auto' })
      gsap.set(pill.current, { autoAlpha: 0 })
      gsap.set(rows, { autoAlpha: 1, y: 0, scaleY: 1, filter: 'blur(0px)' })
      return
    }

    busy.current = true
    gsap
      .timeline({ onComplete: () => (busy.current = false) })
      .to(pill.current, { autoAlpha: 0, filter: 'blur(8px)', duration: 0.34, ease: 'power2.in' }, 0)
      .to(wrap.current, { height: target, duration: 0.86, ease: 'settle' }, 0.06)
      .to(
        rows,
        {
          autoAlpha: 1,
          y: 0,
          scaleY: 1,
          filter: 'blur(0px)',
          duration: 0.72,
          ease: 'settle',
          stagger: 0.075,
        },
        0.18,
      )
      .set(wrap.current, { height: 'auto' })
  }, [expanded])

  const collapse = useCallback(() => {
    if (!expanded || busy.current || !wrap.current || !list.current || !pill.current) return

    const rows = gsap.utils.toArray<HTMLElement>('[data-row]', list.current)
    busy.current = true

    gsap
      .timeline({
        onComplete: () => {
          busy.current = false
          setExpanded(false)
        },
      })
      .set(wrap.current, { height: list.current.scrollHeight })
      .to(rows, { autoAlpha: 0, y: 12, filter: 'blur(8px)', duration: 0.3, stagger: -0.04 }, 0)
      .to(wrap.current, { height: COLLAPSED_H, duration: 0.6, ease: 'settle' }, 0.1)
      .to(pill.current, { autoAlpha: 1, filter: 'blur(0px)', duration: 0.4 }, 0.28)
  }, [expanded])

  useImperativeHandle(ref, () => ({ expand }), [expand])

  return (
    <div
      ref={wrap}
      data-portfolio
      className="relative mx-auto w-[min(390px,100%)] overflow-hidden"
      style={{ height: COLLAPSED_H }}
    >
      <button
        ref={pill}
        type="button"
        onClick={expand}
        aria-expanded={expanded}
        className="panel-glass group absolute inset-x-0 top-0 flex h-13 w-full items-center gap-3 rounded-full py-3 pr-3 pl-3.5 text-left transition-[transform,box-shadow] duration-500 hover:-translate-y-px hover:shadow-[0_1px_1px_rgb(13_16_12/0.05),0_16px_36px_-18px_rgb(13_16_12/0.4)]"
      >
        <Logo className="size-5 shrink-0" />
        <span className="flex-1 text-[13px] font-medium tracking-[-0.01em] text-ink">
          Your All-In-One Crypto Portfolio
        </span>
        <span aria-hidden className="h-5 w-px bg-hairline" />
        <SegmentRing />
      </button>

      <ul ref={list} className="flex flex-col gap-1.5" aria-label="Portfolio holdings">
        {COINS.map((coin) => {
          const up = coin.change > 0
          return (
            <li
              key={coin.symbol}
              data-row
              className="anim-hidden panel-glass flex items-center gap-3 rounded-[16px] px-3 py-2.5 transition-colors duration-300 hover:bg-white/85"
              style={{ transform: 'translateY(18px) scaleY(0.92)', filter: 'blur(10px)' }}
            >
              <CoinIcon symbol={coin.symbol} className="size-[30px] shrink-0" />

              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] leading-tight font-semibold text-ink">{coin.symbol}</p>
                <p className="text-[11px] leading-tight text-ink-faint">{coin.name}</p>
              </div>

              <div className="tabular text-right">
                <p className="text-[12.5px] leading-tight font-medium text-ink">{money(coin.price)}</p>
                <p
                  className="text-[11px] leading-tight font-medium"
                  style={{ color: up ? 'var(--color-up)' : 'var(--color-down)' }}
                >
                  {percent(coin.change)}
                </p>
              </div>

              <div className="grid w-9 shrink-0 place-items-center">
                {coin.symbol === 'BTC' || coin.symbol === 'ETH' ? (
                  <Ring value={up ? 0.72 : 0.28} color={up ? 'var(--color-btc)' : 'var(--color-eth)'} />
                ) : (
                  <Sparkline
                    values={coin.spark}
                    color={up ? 'var(--color-up)' : 'var(--color-down)'}
                  />
                )}
              </div>
            </li>
          )
        })}
      </ul>

      {expanded && (
        <button
          type="button"
          onClick={collapse}
          className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:top-0 focus-visible:right-0 focus-visible:rounded-full focus-visible:bg-white focus-visible:px-3 focus-visible:py-1 focus-visible:text-xs"
        >
          Collapse portfolio
        </button>
      )}
    </div>
  )
}
