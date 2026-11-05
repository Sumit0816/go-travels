import Link from 'next/link'

import { Icon } from '@/components/ui/Icon'

import type { ContactInfo } from './nav-types'

/**
 * Always-available actions from the design:
 * - desktop: the vertical "Find Your Perfect Trip" tab and the floating WhatsApp button
 * - mobile: a sticky bottom bar with Call / WhatsApp / Enquire
 */
export function FloatingActions({ contact }: { contact: ContactInfo }) {
  return (
    <>
      <Link href="/plan-my-trip" className="gt-side-tab hidden md:block">
        Find Your Perfect Trip
      </Link>
      {contact.whatsappHref && (
        <a
          href={contact.whatsappHref}
          className="gt-fab hidden md:flex"
          aria-label="Chat on WhatsApp"
          target="_blank"
          rel="noreferrer"
        >
          <Icon name="whatsapp" size={28} />
        </a>
      )}
      <nav aria-label="Quick actions" className="gt-action-bar md:hidden">
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
        <Link href="/plan-my-trip" className="gt-btn gt-btn--accent">
          Enquire
        </Link>
      </nav>
    </>
  )
}
