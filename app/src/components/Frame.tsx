import type { ReactNode } from 'react'

/**
 * The page lives inside a rounded "screen" floating on a sage field, exactly
 * as in the reference. The screen is fixed to the viewport rather than being a
 * wrapper around the content: that keeps the corner radius and the bottom
 * falloff of the gradient anchored while the content scrolls past it.
 */
export function Frame({ children }: { children: ReactNode }) {
  return (
    <>
      <div
        aria-hidden
        className="surface-screen grain pointer-events-none fixed inset-2 z-0 rounded-[22px] md:inset-3.5 md:rounded-[var(--radius-frame)]"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-2 z-30 rounded-[22px] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.55)] md:inset-3.5 md:rounded-[var(--radius-frame)]"
      />
      {children}
    </>
  )
}
