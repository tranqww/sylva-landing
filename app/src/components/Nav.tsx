import { useEffect, useRef, useState } from 'react'
import { NAV } from '../data/site'
import { Logo } from './icons'
import { scrollTo } from '../lib/useSmoothScroll'

export function Nav() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLElement>(null)

  const menu = useRef<HTMLUListElement>(null)
  const toggle = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return

    // Move focus into the panel that just appeared, and hand it back to the
    // control that opened it on close, so the menu is operable without a
    // pointer.
    menu.current?.querySelector<HTMLAnchorElement>('a')?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      toggle.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const go = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    setOpen(false)
    scrollTo(href)
  }

  return (
    <header
      ref={ref}
      data-nav
      className="fixed inset-x-0 top-6 z-40 flex justify-center px-5 md:top-8"
    >
      <nav
        aria-label="Primary"
        className="flex items-center gap-0.5 rounded-full border border-white/45 bg-white/35 p-[3px] pl-2 shadow-[0_1px_2px_rgb(13_16_12/0.03),0_10px_28px_-22px_rgb(13_16_12/0.3)] backdrop-blur-lg md:gap-1 md:pl-2.5"
      >
        <a
          href="#top"
          onClick={go('#top')}
          data-nav-item
          className="flex shrink-0 items-center pr-1 md:pr-1.5"
        >
          <Logo className="size-[17px]" />
          <span className="sr-only">Sylva — back to top</span>
        </a>

        <ul className="hidden items-center md:flex">
          {NAV.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                onClick={go(item.href)}
                data-nav-item
                className="block rounded-full px-2.5 py-1.5 text-[12.5px] font-medium text-ink-soft transition-colors duration-200 hover:bg-white/70 hover:text-ink"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        <button
          type="button"
          data-nav-item
          onClick={() => scrollTo('#pricing')}
          className="ml-1 rounded-full border border-hairline bg-white px-3.5 py-1.5 text-[12.5px] font-medium text-ink shadow-[0_1px_2px_rgb(13_16_12/0.06),inset_0_1px_0_#fff] transition-[transform,box-shadow] duration-300 hover:-translate-y-px hover:shadow-[0_6px_18px_-8px_rgb(13_16_12/0.4)] active:translate-y-0"
        >
          Get started
        </button>

        <button
          ref={toggle}
          type="button"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
          className="grid size-8 place-items-center rounded-full text-ink-soft transition-colors hover:bg-white/70 md:hidden"
        >
          <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
          <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
            {open ? (
              <path d="m4 4 8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            ) : (
              <path d="M2.5 5.5h11M2.5 10.5h11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </nav>

      {open && (
        <ul
          ref={menu}
          id="mobile-nav"
          className="panel-glass absolute top-16 left-1/2 w-[min(320px,calc(100vw-40px))] -translate-x-1/2 rounded-2xl p-2 md:hidden"
        >
          {NAV.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                onClick={go(item.href)}
                className="block rounded-xl px-3 py-2.5 text-sm font-medium text-ink-soft hover:bg-white/70 hover:text-ink"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </header>
  )
}
