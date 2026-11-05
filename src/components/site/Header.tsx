import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Logo } from '@/components/ui/Logo'

import { DesktopNav } from './DesktopNav'
import { MobileNav } from './MobileNav'
import type { ContactInfo, NavEntry } from './nav-types'

/** Utility bar + header with the CMS main menu (design: "Desktop · Home" header, "Mega menu"). */
export function Header({ nav, contact }: { nav: NavEntry[]; contact: ContactInfo }) {
  return (
    <>
      <div className="bg-ocean-800 text-[13px] text-surface">
        <div className="container-site flex flex-wrap items-center justify-between gap-3 py-2">
          <div className="flex flex-wrap items-center gap-5">
            {contact.phoneHref && (
              <a
                className="flex items-center gap-1.5 text-surface hover:text-surface"
                href={contact.phoneHref}
              >
                <Icon name="phone" size={15} />
                {contact.phone}
              </a>
            )}
            {contact.whatsappHref && (
              <a
                className="hidden items-center gap-1.5 text-surface hover:text-surface sm:flex"
                href={contact.whatsappHref}
                target="_blank"
                rel="noreferrer"
              >
                <Icon name="whatsapp" size={15} />
                WhatsApp
              </a>
            )}
            {contact.email && (
              <a
                className="hidden items-center gap-1.5 text-surface hover:text-surface md:flex"
                href={`mailto:${contact.email}`}
              >
                <Icon name="mail" size={15} />
                {contact.email}
              </a>
            )}
          </div>
          {contact.hours && <span className="opacity-85">{contact.hours}</span>}
        </div>
      </div>
      <header className="sticky top-0 z-40 border-b border-line-200 bg-surface">
        <div className="container-site relative flex items-center justify-between gap-4 py-3.5">
          {/* The tagline is dropped only where the full menu is tightest (1366–1535px). */}
          <Logo
            tagline="DISCOVER · DREAM · TRAVEL"
            taglineClassName="hidden sm:block nav:hidden 2xl:block"
          />
          <DesktopNav items={nav} />
          <div className="flex items-center gap-2">
            <Button
              href="/plan-my-trip"
              variant="accent"
              size="sm"
              className="hidden sm:inline-flex"
            >
              Plan My Trip
            </Button>
            <MobileNav items={nav} contact={contact} />
          </div>
        </div>
      </header>
    </>
  )
}
