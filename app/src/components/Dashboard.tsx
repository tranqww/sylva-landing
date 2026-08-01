import { useRef } from 'react'
import { gsap, prefersReducedMotion, useIsoLayoutEffect } from '../lib/motion'
import { COINS, TOTAL_SAVING } from '../data/site'
import { money, moneyParts, percent } from '../lib/format'
import { CoinIcon, Chevron, WalletIcon } from './icons'
import { Ring, Sparkline } from './Charts'
import { SavingsChart } from './SavingsChart'

function Legend() {
  return (
    <div className="flex items-center gap-3 text-[10.5px] text-ink-muted">
      <span className="flex items-center gap-1.5">
        <span className="size-[5px] rounded-full bg-ink" />
        Income
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-[5px] rounded-full border border-ink/45" />
        Expenses
      </span>
    </div>
  )
}

export function Dashboard() {
  const total = useRef<HTMLSpanElement>(null)

  useIsoLayoutEffect(() => {
    const el = total.current
    if (!el || prefersReducedMotion()) return

    const counter = { v: 0 }
    const [whole] = moneyParts(TOTAL_SAVING)
    el.textContent = whole

    const tween = gsap.to(counter, {
      v: TOTAL_SAVING,
      duration: 1.9,
      ease: 'settle',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      onUpdate: () => {
        el.textContent = money(counter.v).split('.')[0]
      },
    })

    return () => {
      tween.scrollTrigger?.kill()
      tween.kill()
    }
  }, [])

  const [, cents] = moneyParts(TOTAL_SAVING)

  return (
    <div
      data-dashboard
      className="panel-glass flex h-full flex-col overflow-hidden rounded-[20px] bg-white/88 p-4 md:p-5 lg:h-[446px]"
    >
      {/* ------------------------------------------------------------ head */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-ink/5 text-ink-soft">
            <WalletIcon className="size-[18px]" />
          </span>
          <span>
            <span className="block text-[10.5px] leading-none text-ink-muted">Total Saving</span>
            <span className="tabular mt-1.5 block font-display text-[22px] leading-none font-semibold tracking-[-0.03em] text-ink">
              <span ref={total}>$0</span>
              <span className="text-[13px] text-ink-faint">.{cents}</span>
            </span>
          </span>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-3">
          <Legend />
          <button
            type="button"
            className="flex items-center gap-1 rounded-lg border border-hairline bg-white px-2.5 py-1.5 text-[11px] font-medium text-ink shadow-[0_1px_2px_rgb(13_16_12/0.05)] transition-colors hover:bg-surface"
          >
            Monthly
            <Chevron className="size-3 text-ink-faint" />
          </button>
        </div>
      </div>

      {/* ----------------------------------------------------------- chart */}
      <div className="mt-5">
        <SavingsChart />
      </div>

      {/* ------------------------------------------------------- portfolio */}
      <div className="mt-5 min-h-0 flex-1">
        <p className="text-[10.5px] text-ink-muted">Your Portfolio</p>

        <ul className="mt-2 -space-y-px">
          {COINS.map((coin) => {
            const up = coin.change > 0
            return (
              <li
                key={coin.symbol}
                className="flex items-center gap-2.5 border-t border-hairline-soft py-2.5 first:border-t-0"
              >
                <CoinIcon symbol={coin.symbol} className="size-7 shrink-0" />
                <p className="min-w-0 flex-1 truncate text-[11.5px] font-semibold text-ink">
                  {coin.symbol} <span className="font-normal text-ink-faint">{coin.name}</span>
                </p>
                <p className="tabular text-[11.5px] font-medium text-ink">{money(coin.price)}</p>
                <p
                  className="tabular w-12 text-right text-[11px] font-medium"
                  style={{ color: up ? 'var(--color-up)' : 'var(--color-down)' }}
                >
                  {percent(coin.change)}
                </p>
                <span className="grid w-9 shrink-0 place-items-center">
                  {coin.symbol === 'BTC' || coin.symbol === 'ETH' ? (
                    <Ring
                      value={up ? 0.72 : 0.28}
                      color={up ? 'var(--color-btc)' : 'var(--color-eth)'}
                      size={22}
                    />
                  ) : (
                    <Sparkline values={coin.spark} color={up ? 'var(--color-up)' : 'var(--color-down)'} />
                  )}
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
