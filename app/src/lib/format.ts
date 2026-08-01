/** Resolve a `public/` file against the deploy base path. */
export function asset(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`
}

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function money(value: number): string {
  return usd.format(value)
}

/** `$498,098` + `.00` split so the cents can be set in a smaller size. */
export function moneyParts(value: number): [string, string] {
  const [whole, cents] = money(value).split('.')
  return [whole, cents ?? '00']
}

export function percent(value: number): string {
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`
}

export function signedMoney(value: number): string {
  return `${value > 0 ? '+' : '-'}$${Math.abs(value).toLocaleString('en-US')}`
}
