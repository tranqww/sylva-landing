import { FOOTER_LINKS, PRICING, SERVICES, STATS, STEPS } from '../data/site'
import { ArrowUpRight, Logo, Wordmark } from './icons'
import { Reveal } from './Reveal'
import { scrollTo } from '../lib/useSmoothScroll'

function SectionHead({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string
  title: React.ReactNode
  body?: string
}) {
  return (
    <Reveal className="max-w-[34rem]" stagger>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-4 text-[clamp(1.9rem,3.2vw,2.9rem)] leading-[1.02]">{title}</h2>
      {body && <p className="mt-4 max-w-[30rem] text-[14px] leading-[1.6] text-ink-muted">{body}</p>}
    </Reveal>
  )
}

/* -------------------------------------------------------------- services */

export function Services() {
  return (
    <section id="services" className="relative z-20 px-5 py-24 md:py-32">
      <div className="mx-auto w-full max-w-[1080px]">
        <SectionHead
          eyebrow="Services"
          title={
            <>
              Everything a position
              <br />
              needs, in one place
            </>
          }
          body="Sylva replaces the spreadsheet, the four exchange tabs and the tax export you dread — with one reconciled view of what you actually hold."
        />

        <Reveal className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" stagger>
          {SERVICES.map((s) => (
            <article
              key={s.title}
              className="panel-glass group flex flex-col rounded-[18px] p-5 transition-[transform,box-shadow] duration-500 hover:-translate-y-1 hover:shadow-[0_1px_1px_rgb(13_16_12/0.05),0_22px_44px_-24px_rgb(13_16_12/0.45)]"
            >
              <span className="eyebrow text-ink-faint">{s.metric}</span>
              <h3 className="mt-6 text-[17px] leading-[1.15] tracking-[-0.03em]">{s.title}</h3>
              <p className="mt-2.5 flex-1 text-[13px] leading-[1.6] text-ink-muted">{s.body}</p>
              <a
                href="#how-it-works"
                onClick={(e) => {
                  e.preventDefault()
                  scrollTo('#how-it-works')
                }}
                className="mt-6 flex items-center gap-1.5 self-start text-[12px] font-medium text-ink"
              >
                Learn more
                <ArrowUpRight className="size-3.5 transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                <span className="sr-only"> about {s.title}</span>
              </a>
            </article>
          ))}
        </Reveal>
      </div>
    </section>
  )
}

/* ---------------------------------------------------------- how it works */

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative z-20 px-5 py-24 md:py-32">
      <div className="mx-auto w-full max-w-[1080px]">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:gap-16">
          <SectionHead
            eyebrow="How it works"
            title={
              <>
                Three steps from
                <br />
                scattered to settled
              </>
            }
            body="No custody transfer, no seed phrases, no migration weekend. Read-only access is enough for Sylva to rebuild the whole picture."
          />

          <Reveal className="flex flex-col" stagger>
            {STEPS.map((step) => (
              <div
                key={step.n}
                className="grid grid-cols-[auto_1fr] gap-5 border-t border-hairline py-7 first:border-t-0 first:pt-0"
              >
                <span className="tabular font-display text-[13px] font-medium text-ink-faint">
                  {step.n}
                </span>
                <div>
                  <h3 className="text-[19px] tracking-[-0.03em]">{step.title}</h3>
                  <p className="mt-2 text-[13.5px] leading-[1.6] text-ink-muted">{step.body}</p>
                </div>
              </div>
            ))}
          </Reveal>
        </div>

        <Reveal
          className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-[18px] bg-hairline lg:grid-cols-4"
          stagger
        >
          {STATS.map((s) => (
            <div key={s.label} className="bg-white/62 px-5 py-7 backdrop-blur-sm">
              <p className="tabular font-display text-[clamp(1.5rem,2.4vw,2rem)] leading-none font-semibold tracking-[-0.04em]">
                {s.value}
              </p>
              <p className="mt-2 text-[12px] text-ink-muted">{s.label}</p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  )
}

/* --------------------------------------------------------------- pricing */

export function Pricing() {
  return (
    <section id="pricing" className="relative z-20 px-5 py-24 md:py-32">
      <div className="mx-auto w-full max-w-[1080px]">
        <SectionHead
          eyebrow="Pricing"
          title={
            <>
              Priced for the size
              <br />
              of the position
            </>
          }
          body="Start on the free tier and stay there as long as it works. Every plan includes read-only key scoping and full data export."
        />

        <Reveal className="mt-12 grid gap-3 lg:grid-cols-3" stagger>
          {PRICING.map((tier) => (
            <article
              key={tier.name}
              className={[
                'flex flex-col rounded-[20px] p-6 transition-[transform,box-shadow] duration-500 hover:-translate-y-1',
                tier.featured
                  ? 'bg-ink text-white shadow-[0_24px_50px_-26px_rgb(13_16_12/0.7)]'
                  : 'panel-glass hover:shadow-[0_1px_1px_rgb(13_16_12/0.05),0_22px_44px_-24px_rgb(13_16_12/0.45)]',
              ].join(' ')}
            >
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-[17px] tracking-[-0.03em]">{tier.name}</h3>
                {tier.featured && (
                  <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-medium tracking-[0.08em] uppercase">
                    Popular
                  </span>
                )}
              </div>

              <p
                className={`mt-1.5 text-[12.5px] leading-[1.55] ${tier.featured ? 'text-white/62' : 'text-ink-muted'}`}
              >
                {tier.blurb}
              </p>

              <p className="mt-7 flex items-baseline gap-1.5">
                <span className="tabular font-display text-[34px] leading-none font-semibold tracking-[-0.045em]">
                  {tier.price}
                </span>
                <span className={`text-[12px] ${tier.featured ? 'text-white/55' : 'text-ink-faint'}`}>
                  {tier.cadence}
                </span>
              </p>

              <ul className="mt-7 flex-1 space-y-2.5">
                {tier.features.map((f) => (
                  <li key={f} className="flex gap-2.5 text-[12.5px] leading-[1.5]">
                    <svg viewBox="0 0 16 16" className="mt-[3px] size-3.5 shrink-0" fill="none" aria-hidden>
                      <path
                        d="m3.5 8.4 3 3 6-6.8"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity={tier.featured ? 0.8 : 0.45}
                      />
                    </svg>
                    <span className={tier.featured ? 'text-white/85' : 'text-ink-soft'}>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                className={[
                  'mt-8 rounded-full px-5 py-3 text-[13px] font-medium transition-colors duration-300',
                  tier.featured
                    ? 'bg-white text-ink hover:bg-white/90'
                    : 'border border-hairline bg-white text-ink hover:bg-surface',
                ].join(' ')}
              >
                {tier.cta}
              </button>
            </article>
          ))}
        </Reveal>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------- cta */

export function Cta() {
  return (
    <section className="relative z-20 px-5 pt-8 pb-24 md:pb-32">
      <Reveal className="mx-auto w-full max-w-[1080px]">
        <div className="panel-glass grain relative overflow-hidden rounded-[26px] px-6 py-16 text-center md:px-14 md:py-24">
          <h2 className="mx-auto max-w-[18ch] text-[clamp(2rem,4vw,3.3rem)] leading-[0.98]">
            Start seeing what you actually hold
          </h2>
          <p className="mx-auto mt-5 max-w-[34ch] text-[14px] leading-[1.6] text-ink-muted">
            Connect your first venue in under two minutes. No card, no custody transfer, no lock-in.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              className="rounded-full bg-ink px-6 py-3.5 text-[13.5px] font-medium text-white transition-transform duration-300 hover:-translate-y-px"
            >
              Get started free
            </button>
            <button
              type="button"
              onClick={() => scrollTo('#how-it-works')}
              className="rounded-full border border-hairline bg-white px-6 py-3.5 text-[13.5px] font-medium text-ink transition-colors duration-300 hover:bg-surface"
            >
              See how it works
            </button>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

/* ---------------------------------------------------------------- footer */

export function Footer() {
  return (
    <footer className="relative z-20 px-5 pb-10">
      <Reveal className="mx-auto w-full max-w-[1080px]">
        <div className="grid gap-10 border-t border-hairline pt-10 md:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
          <div>
            <span className="flex items-center gap-2">
              <Logo className="size-5" />
              <Wordmark />
            </span>
            <p className="mt-4 max-w-[24rem] text-[12.5px] leading-[1.6] text-ink-muted">
              An all-in-one crypto portfolio platform. Read-only by design, reconciled continuously,
              exportable at any time.
            </p>
          </div>

          {FOOTER_LINKS.map((group) => (
            <nav key={group.heading} aria-label={group.heading}>
              <p className="eyebrow">{group.heading}</p>
              <ul className="mt-4 space-y-2.5">
                {group.links.map((l) => (
                  <li key={l}>
                    <a
                      href="#top"
                      onClick={(e) => {
                        e.preventDefault()
                        scrollTo('#top')
                      }}
                      className="text-[12.5px] text-ink-soft transition-colors hover:text-ink"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-hairline pt-6 text-[11.5px] text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Sylva. A design study, not a financial product.</p>
          <p>Market figures shown are illustrative.</p>
        </div>
      </Reveal>
    </footer>
  )
}
