type IconProps = { className?: string }

/**
 * Sylva mark — a dark disc with a five-point seed shape cut out of it,
 * matching the small circular glyph the reference uses in the nav and on the
 * portfolio pill.
 */
export function Logo({ className = 'size-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} role="img" aria-label="Sylva">
      <circle cx="12" cy="12" r="12" fill="var(--color-ink)" />
      <path
        d="M12 4.4c.9 2.6 2.1 4.1 4.6 4.9-2.5.8-3.7 2.3-4.6 4.9-.9-2.6-2.1-4.1-4.6-4.9 2.5-.8 3.7-2.3 4.6-4.9Z"
        fill="#fff"
      />
      <path
        d="M12 12.9c.6 1.8 1.5 2.8 3.2 3.4-1.7.6-2.6 1.6-3.2 3.4-.6-1.8-1.5-2.8-3.2-3.4 1.7-.6 2.6-1.6 3.2-3.4Z"
        fill="#fff"
        opacity="0.72"
      />
    </svg>
  )
}

export function Wordmark({ className = '' }: IconProps) {
  return (
    <span className={`font-display text-[15px] font-semibold tracking-[-0.04em] ${className}`}>
      Sylva
    </span>
  )
}

export function CoinIcon({ symbol, className = 'size-7' }: IconProps & { symbol: string }) {
  const common = { viewBox: '0 0 32 32', className, 'aria-hidden': true } as const

  switch (symbol) {
    case 'BTC':
      return (
        <svg {...common}>
          <rect width="32" height="32" rx="10" fill="var(--color-btc)" />
          <path
            d="M13 8.6h2.1v2.1h1.3V8.6h2.1v2.2c2.2.2 3.6 1.2 3.6 3 0 1.2-.6 2-1.7 2.4 1.5.4 2.3 1.4 2.3 2.9 0 2.1-1.6 3.3-4.2 3.4v2.1h-2.1v-2.1h-1.3v2.1H13v-2.1H9.6v-2h1.2c.5 0 .7-.2.7-.7v-6.8c0-.5-.2-.7-.7-.7H9.6v-2H13V8.6Zm1.8 7.1h2.5c1.1 0 1.7-.5 1.7-1.4s-.6-1.4-1.7-1.4h-2.5v2.8Zm0 5h2.9c1.2 0 1.9-.5 1.9-1.5s-.7-1.5-1.9-1.5h-2.9v3Z"
            fill="#fff"
          />
        </svg>
      )
    case 'ETH':
      return (
        <svg {...common}>
          <rect width="32" height="32" rx="10" fill="var(--color-eth)" />
          <path d="M16 5.5 9.8 16 16 19.7 22.2 16 16 5.5Z" fill="#fff" fillOpacity="0.9" />
          <path d="M16 21.1 9.8 17.4 16 26.5l6.2-9.1-6.2 3.7Z" fill="#fff" fillOpacity="0.65" />
        </svg>
      )
    case 'LTC':
      return (
        <svg {...common}>
          <rect width="32" height="32" rx="10" fill="var(--color-ltc)" />
          <path
            d="M17.9 7.4h-4.2l-2 8.1-2.3.7-.5 2 2.3-.7-1.4 5.6h11l.7-2.8h-7.6l1-4 2.5-.8.5-2-2.5.8 1.9-6.9Z"
            fill="#fff"
          />
        </svg>
      )
    case 'XRP':
    default:
      return (
        <svg {...common}>
          <rect width="32" height="32" rx="10" fill="var(--color-xrp)" />
          <path
            d="M9.4 8.6h3.1l3.5 3.9 3.5-3.9h3.1l-5.1 5.7a2 2 0 0 1-3 0L9.4 8.6Zm0 14.8h3.1l3.5-3.9 3.5 3.9h3.1l-5.1-5.7a2 2 0 0 0-3 0l-5.1 5.7Z"
            fill="#fff"
          />
        </svg>
      )
  }
}

export function ArrowUpRight({ className = 'size-4' }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" aria-hidden>
      <path
        d="M5 11 11 5m0 0H6.2M11 5v4.8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Chevron({ className = 'size-3.5' }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" aria-hidden>
      <path
        d="m4.5 6.5 3.5 3.5 3.5-3.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function WalletIcon({ className = 'size-4' }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" aria-hidden>
      <path
        d="M3 6.5A2.5 2.5 0 0 1 5.5 4h9A2.5 2.5 0 0 1 17 6.5v7a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 3 13.5v-7Z"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path d="M13 10h1.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M3 8h14" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  )
}

export function Plus({ className = 'size-2.5' }: IconProps) {
  return (
    <svg viewBox="0 0 10 10" className={className} aria-hidden>
      <path d="M5 0v10M0 5h10" stroke="currentColor" strokeWidth="1" />
    </svg>
  )
}
