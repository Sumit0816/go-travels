'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useId, useRef, useState } from 'react'

import { isActive } from '@/lib/site/links'

import type { NavEntry } from './nav-types'

/**
 * Desktop main menu. Items with mega-menu columns open a panel (disclosure pattern):
 * click or keyboard to toggle, Escape or a click outside closes it.
 */
export function DesktopNav({ items }: { items: NavEntry[] }) {
  const pathname = usePathname() ?? '/'
  // The open menu is remembered with the page it was opened on, so navigating closes it.
  const [state, setState] = useState<{ href: string; path: string } | null>(null)
  const open = state?.path === pathname ? state.href : null
  const setOpen = (href: string | null) => setState(href ? { href, path: pathname } : null)
  const root = useRef<HTMLElement>(null)
  const baseId = useId()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setState(null)
    const onClick = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setState(null)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [open])

  return (
    <nav ref={root} className="gt-nav hidden nav:flex" aria-label="Main">
      {items.map((item) => {
        const current = isActive(item.href, pathname) ? 'page' : undefined
        if (!item.mega) {
          return (
            <Link key={item.href} href={item.href} aria-current={current}>
              {item.label}
            </Link>
          )
        }
        const panelId = `${baseId}-${item.href}`
        const expanded = open === item.href
        return (
          <div key={item.href} className="gt-mega">
            <button
              type="button"
              className="gt-mega__trigger"
              aria-expanded={expanded}
              aria-controls={panelId}
              aria-current={current}
              onClick={() => setOpen(expanded ? null : item.href)}
            >
              {item.label}
              <span aria-hidden="true">{expanded ? ' ▴' : ' ▾'}</span>
            </button>
            <div id={panelId} className="gt-mega__panel" hidden={!expanded}>
              <div className="gt-mega__columns">
                {item.mega.columns.map((col) => (
                  <div key={col.heading} className="gt-mega__col">
                    <b>{col.heading}</b>
                    {col.links.map((l) => (
                      <Link key={l.href + l.label} href={l.href}>
                        {l.label}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
              <div className="gt-mega__side">
                {item.mega.featured && (
                  <Link href={item.mega.featured.href} className="gt-mega__featured">
                    <span
                      className="gt-mega__featured-img"
                      style={{ background: `var(--color-dest-${item.mega.featured.tone})` }}
                    >
                      {item.mega.featured.image && (
                        // eslint-disable-next-line @next/next/no-img-element -- small CMS thumbnail inside a menu
                        <img src={item.mega.featured.image.src} alt="" loading="lazy" />
                      )}
                      <span className="gt-badge gt-badge--accent">FEATURED</span>
                    </span>
                    <span className="gt-mega__featured-body">
                      <b>{item.mega.featured.title}</b>
                      <span>{item.mega.featured.meta}</span>
                    </span>
                  </Link>
                )}
                <Link
                  href={item.mega.viewAll.href}
                  className="gt-btn gt-btn--primary gt-btn--block"
                >
                  {item.mega.viewAll.label}
                </Link>
              </div>
            </div>
          </div>
        )
      })}
    </nav>
  )
}
