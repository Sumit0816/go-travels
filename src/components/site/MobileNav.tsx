'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { Icon } from '@/components/ui/Icon'
import { LogoMark } from '@/components/ui/Logo'

import type { ContactInfo, NavEntry } from './nav-types'

/**
 * Menu button + right-side drawer for screens below 1366px (design: "Mobile · Menu drawer").
 * Uses a native <dialog>, which traps focus, closes on Escape and restores focus on close.
 */
export function MobileNav({ items, contact }: { items: NavEntry[]; contact: ContactInfo }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const pathname = usePathname()
  const [openGroup, setOpenGroup] = useState<string | null>(null)

  const close = () => dialog.current?.close()
  useEffect(() => close(), [pathname])

  return (
    <>
      <button
        type="button"
        className="gt-btn gt-btn--outline gt-btn--icon nav:hidden"
        aria-label="Open menu"
        aria-haspopup="dialog"
        onClick={() => dialog.current?.showModal()}
      >
        <Icon name="menu" />
      </button>

      <dialog
        ref={dialog}
        className="gt-drawer"
        aria-label="Menu"
        onClick={(e) => {
          // A click on the backdrop (the dialog element itself) closes it.
          if (e.target === dialog.current) close()
        }}
      >
        <div className="gt-drawer__panel">
          <div className="gt-drawer__head">
            <span className="flex items-center gap-2 font-display text-[17px] font-bold">
              <LogoMark size={34} /> Go Travels
            </span>
            <button
              type="button"
              className="gt-btn gt-btn--ghost gt-btn--icon"
              aria-label="Close menu"
              onClick={close}
            >
              <Icon name="close" size={22} />
            </button>
          </div>

          <nav className="gt-drawer__body" aria-label="Mobile">
            {items.map((item) =>
              item.mega ? (
                <div key={item.href} className="gt-drawer__group">
                  <button
                    type="button"
                    aria-expanded={openGroup === item.href}
                    onClick={() => setOpenGroup(openGroup === item.href ? null : item.href)}
                  >
                    <span>{item.label}</span>
                    <span aria-hidden="true">{openGroup === item.href ? '▴' : '▾'}</span>
                  </button>
                  {openGroup === item.href && (
                    <div className="gt-drawer__sub">
                      {item.mega.columns
                        .flatMap((c) => c.links)
                        .map((l) => (
                          <Link key={l.href + l.label} href={l.href}>
                            {l.label}
                          </Link>
                        ))}
                      <Link href={item.href}>{item.mega.viewAll.label.replace(' →', '')}</Link>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={pathname === item.href ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              ),
            )}
          </nav>

          <div className="gt-drawer__foot">
            <Link href="/plan-my-trip" className="gt-btn gt-btn--accent gt-btn--block">
              Find Your Perfect Trip
            </Link>
            <div className="grid grid-cols-2 gap-2.5">
              {contact.phoneHref && (
                <a href={contact.phoneHref} className="gt-btn gt-btn--outline">
                  Call
                </a>
              )}
              {contact.whatsappHref && (
                <a
                  href={contact.whatsappHref}
                  className="gt-btn gt-btn--whatsapp"
                  target="_blank"
                  rel="noreferrer"
                >
                  WhatsApp
                </a>
              )}
            </div>
            {contact.hours && (
              <span className="text-center text-caption text-ink-500">{contact.hours}</span>
            )}
          </div>
        </div>
      </dialog>
    </>
  )
}
