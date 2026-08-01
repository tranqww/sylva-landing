export type Coin = {
  symbol: string
  name: string
  price: number
  change: number
  color: string
  /** Normalised sparkline, 0 = low, 1 = high. */
  spark: number[]
}

export const NAV = [
  { label: 'Services', href: '#services' },
  { label: 'How it Works', href: '#how-it-works' },
  { label: 'About Us', href: '#about' },
  { label: 'Pricing', href: '#pricing' },
] as const

export const COINS: Coin[] = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    price: 4235.17,
    change: 1.0,
    color: 'var(--color-btc)',
    spark: [0.3, 0.42, 0.36, 0.55, 0.48, 0.72, 0.66, 0.9],
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    price: 1250.08,
    change: -0.18,
    color: 'var(--color-eth)',
    spark: [0.72, 0.6, 0.66, 0.44, 0.52, 0.34, 0.4, 0.26],
  },
  {
    symbol: 'LTC',
    name: 'Litecoin',
    price: 1235.0,
    change: 5.23,
    color: 'var(--color-ltc)',
    spark: [0.2, 0.3, 0.26, 0.45, 0.58, 0.5, 0.74, 0.94],
  },
  {
    symbol: 'XRP',
    name: 'Ripple',
    price: 960.0,
    change: -1.0,
    color: 'var(--color-xrp)',
    spark: [0.8, 0.72, 0.78, 0.6, 0.55, 0.62, 0.42, 0.3],
  },
]

export const TOTAL_SAVING = 498098

/** Weekly income / expense series behind the dashboard chart, in dollars. */
export const CHART = {
  days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  activeDay: 3,
  domain: [0, 42000] as [number, number],
  ticks: [0, 10000, 20000, 30000, 40000],
  income: [
    16800, 18200, 20100, 21600, 21100, 20400, 20800, 22200, 23900, 24400,
    23100, 21200, 20600, 21800, 22600,
  ],
  expenses: [
    19400, 20800, 22100, 21200, 19600, 19100, 20200, 21400, 20100, 18700,
    18200, 19400, 20600, 21100, 20400,
  ],
  tooltip: { down: -1209, up: 9488 },
}

export const SERVICES = [
  {
    title: 'Unified portfolio',
    body: 'Every wallet, exchange and cold-storage device reconciled into one live balance you can actually trust.',
    metric: '38 venues',
  },
  {
    title: 'Execution desk',
    body: 'Route orders across venues with smart splitting, limit ladders and slippage caps applied before you sign.',
    metric: '11 ms median',
  },
  {
    title: 'Risk & exposure',
    body: 'Concentration, drawdown and correlation modelled continuously, with alerts before a position becomes a problem.',
    metric: 'Real time',
  },
  {
    title: 'Tax & reporting',
    body: 'Cost basis tracked per lot across chains, exported to the formats your accountant already uses.',
    metric: '27 regions',
  },
] as const

export const STEPS = [
  {
    n: '01',
    title: 'Connect',
    body: 'Link exchanges by read-only API key and wallets by public address. Keys are scoped, encrypted and never grant withdrawal.',
  },
  {
    n: '02',
    title: 'Reconcile',
    body: 'Sylva rebuilds your full transaction history, matches transfers between your own accounts and resolves cost basis per lot.',
  },
  {
    n: '03',
    title: 'Operate',
    body: 'Trade, rebalance and report from a single surface, with every action checked against the limits you set.',
  },
] as const

export const STATS = [
  { value: '$4.2B', label: 'Assets tracked' },
  { value: '38', label: 'Venues connected' },
  { value: '99.98%', label: 'Uptime, trailing year' },
  { value: '2016', label: 'Operating since' },
] as const

export const PRICING = [
  {
    name: 'Starter',
    price: '$0',
    cadence: 'forever',
    blurb: 'For a first portfolio you want to see clearly.',
    features: ['3 connected venues', 'Daily reconciliation', 'Portfolio & allocation views', 'CSV export'],
    cta: 'Start free',
    featured: false,
  },
  {
    name: 'Investor',
    price: '$24',
    cadence: 'per month',
    blurb: 'For active positions across several venues.',
    features: [
      'Unlimited venues & wallets',
      'Live reconciliation',
      'Execution desk & limit ladders',
      'Risk alerts and exposure modelling',
      'Tax lots and regional reports',
    ],
    cta: 'Get started',
    featured: true,
  },
  {
    name: 'Desk',
    price: 'Custom',
    cadence: 'annual',
    blurb: 'For teams operating a mandate.',
    features: [
      'Everything in Investor',
      'Multi-seat with role permissions',
      'Approval workflows and audit log',
      'Dedicated infrastructure',
      'Onboarding and named support',
    ],
    cta: 'Talk to us',
    featured: false,
  },
] as const

export const FOOTER_LINKS = [
  {
    heading: 'Product',
    links: ['Portfolio', 'Execution', 'Risk', 'Reporting', 'Changelog'],
  },
  {
    heading: 'Company',
    links: ['About', 'Careers', 'Press', 'Contact'],
  },
  {
    heading: 'Resources',
    links: ['Documentation', 'API reference', 'Status', 'Security'],
  },
] as const
