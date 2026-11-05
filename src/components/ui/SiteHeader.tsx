import Link from 'next/link'

import { Button } from './Button'
import { Icon } from './Icon'
import { Logo } from './Logo'

export type NavItem = { label: string; href: string; hasMenu?: boolean }

/** Default header order from the design system. Phase 4 replaces this with the CMS Main menu. */
export const DEFAULT_NAV: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Domestic Tours', href: '/tours/domestic', hasMenu: true },
  { label: 'International Tours', href: '/tours/international', hasMenu: true },
  { label: 'Honeymoon', href: '/tours/honeymoon' },
  { label: 'Jharkhand Tours', href: '/tours/jharkhand' },
  { label: 'Religious Tours', href: '/tours/religious' },
  { label: 'MICE', href: '/tours/mice' },
  { label: 'About Us', href: '/about' },
  { label: 'Contact Us', href: '/contact' },
]

type SiteHeaderProps = {
  nav?: NavItem[]
  currentPath?: string
  phone?: string
  email?: string
  hours?: string
}

/**
 * Utility bar (ocean-800) + header: logo, main menu, accent "Plan My Trip".
 * Below 1366px the menu collapses behind a 44px menu button (drawer arrives in Phase 4).
 */
export function SiteHeader({
  nav = DEFAULT_NAV,
  currentPath = '/',
  phone = '+91 98765 43210',
  email = 'hello@gotravels.in',
  hours = 'Mon – Sat · 10:00 AM – 07:00 PM',
}: SiteHeaderProps) {
  return (
    <div>
      <div className="hidden bg-ocean-800 text-[13px] text-surface md:block">
        <div className="container-site flex justify-between gap-4 py-2.5">
          <span className="flex flex-wrap gap-4">
            <a className="text-surface hover:text-surface" href={`tel:${phone.replace(/\s/g, '')}`}>
              {phone}
            </a>
            <span>WhatsApp</span>
            <a className="text-surface hover:text-surface" href={`mailto:${email}`}>
              {email}
            </a>
          </span>
          <span>{hours}</span>
        </div>
      </div>
      <header className="gt-header">
        <Logo tagline="DISCOVER · DREAM · TRAVEL" taglineClassName="hidden sm:block" />
        <nav className="gt-nav hidden min-[1366px]:flex" aria-label="Main">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={item.href === currentPath ? 'page' : undefined}
            >
              {item.label}
              {item.hasMenu && ' ▾'}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button href="/plan-my-trip" variant="accent" size="sm" className="hidden sm:inline-flex">
            Plan My Trip
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Open menu"
            className="min-[1366px]:hidden"
          >
            <Icon name="menu" />
          </Button>
        </div>
      </header>
    </div>
  )
}
