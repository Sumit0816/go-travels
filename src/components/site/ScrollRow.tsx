'use client'

import { useRef, type ReactNode } from 'react'

import { Icon } from '@/components/ui/Icon'

/**
 * Horizontal scroll-snap row with previous/next buttons (design: package and review carousels).
 * Swipe works natively on touch; the buttons scroll by one viewport of the row.
 */
export function ScrollRow({
  label,
  children,
  controlsClassName,
}: {
  label: string
  children: ReactNode
  controlsClassName?: string
}) {
  const row = useRef<HTMLDivElement>(null)
  const scroll = (dir: 1 | -1) => {
    const el = row.current
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: reduce ? 'auto' : 'smooth' })
  }
  return (
    <div className="flex flex-col gap-4">
      <div className={controlsClassName ?? 'flex justify-end gap-2.5'}>
        <button
          type="button"
          className="gt-btn gt-btn--outline gt-btn--icon"
          aria-label={`Previous ${label}`}
          onClick={() => scroll(-1)}
        >
          <Icon name="chevronLeft" />
        </button>
        <button
          type="button"
          className="gt-btn gt-btn--primary gt-btn--icon"
          aria-label={`Next ${label}`}
          onClick={() => scroll(1)}
        >
          <Icon name="chevronRight" />
        </button>
      </div>
      <div ref={row} className="gt-scroll-row" role="region" aria-label={label} tabIndex={0}>
        {children}
      </div>
    </div>
  )
}
