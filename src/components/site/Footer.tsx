import Link from 'next/link'

import { Icon } from '@/components/ui/Icon'
import { LogoMark } from '@/components/ui/Logo'
import { isExternal } from '@/lib/site/links'
import type { SiteSetting } from '@/payload-types'

import type { ContactInfo, NavLink } from './nav-types'

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return isExternal(href) ? (
    <a href={href} className="text-[#D2DEE3] hover:text-surface" target="_blank" rel="noreferrer">
      {children}
    </a>
  ) : (
    <Link href={href} className="text-[#D2DEE3] hover:text-surface">
      {children}
    </Link>
  )
}

/** Site footer (design: Home footer) — links from the CMS menus, contact from Site Settings. */
export function Footer({
  quickLinks,
  tours,
  contact,
  settings,
}: {
  quickLinks: NavLink[]
  tours: NavLink[]
  contact: ContactInfo
  settings: SiteSetting | null
}) {
  const phones = settings?.phones?.map((p) => p.number).join(', ')
  const site = (process.env.NEXT_PUBLIC_SITE_URL || '')
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '')
  return (
    <footer className="bg-night-900 text-[#D2DEE3]">
      <div className="container-site grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-9 pt-16 pb-8 text-body-sm">
        <div className="flex flex-col gap-3.5">
          <span className="flex items-center gap-2.5 font-display text-[20px] font-bold text-surface">
            <LogoMark size={40} onDark />
            {settings?.siteName ?? 'Go Travels'}
          </span>
          <p className="m-0 leading-relaxed">
            Domestic, international, honeymoon, religious and MICE tours — planned personally,
            confirmed on WhatsApp.
          </p>
          <div className="flex gap-2.5">
            {contact.instagram && (
              <a
                href={contact.instagram}
                aria-label="Instagram"
                className="flex h-11 w-11 items-center justify-center rounded-pill border border-[#3C5966] text-surface hover:text-surface"
                target="_blank"
                rel="noreferrer"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
                </svg>
              </a>
            )}
            {contact.whatsappHref && (
              <a
                href={contact.whatsappHref}
                aria-label="WhatsApp"
                className="flex h-11 w-11 items-center justify-center rounded-pill border border-[#3C5966] text-surface hover:text-surface"
                target="_blank"
                rel="noreferrer"
              >
                <Icon name="whatsapp" size={18} />
              </a>
            )}
          </div>
        </div>

        {quickLinks.length > 0 && (
          <nav aria-label="Quick links" className="flex flex-col gap-3">
            <h2 className="mb-1 text-[16px] font-semibold text-surface">Quick Links</h2>
            {quickLinks.map((l) => (
              <FooterLink key={l.href + l.label} href={l.href}>
                {l.label}
              </FooterLink>
            ))}
          </nav>
        )}

        {tours.length > 0 && (
          <nav aria-label="Tours" className="flex flex-col gap-3">
            <h2 className="mb-1 text-[16px] font-semibold text-surface">Tours</h2>
            {tours.map((l) => (
              <FooterLink key={l.href + l.label} href={l.href}>
                {l.label}
              </FooterLink>
            ))}
          </nav>
        )}

        <div className="flex flex-col gap-3 leading-normal">
          <h2 className="mb-1 text-[16px] font-semibold text-surface">Reach Us Out</h2>
          {settings?.address && <span>Address: {settings.address}</span>}
          {phones && <span>Contact: {phones}</span>}
          {contact.email && (
            <span>
              Email:{' '}
              <a href={`mailto:${contact.email}`} className="text-[#D2DEE3] hover:text-surface">
                {contact.email}
              </a>
            </span>
          )}
          {site && !/^(localhost|127\.0\.0\.1)/.test(site) && <span>Website: {site}</span>}
          {contact.hours && <span>{contact.hours.replace(' · ', ': ')}</span>}
        </div>
      </div>
      <div className="border-t border-[#23414D]">
        <div className="container-site flex flex-wrap justify-between gap-3 py-4.5 text-[13px]">
          <span>
            © {new Date().getFullYear()} {settings?.siteName ?? 'Go Travels'}. All rights reserved.
          </span>
          <span>
            <FooterLink href="/privacy">Privacy Policy</FooterLink> |{' '}
            <FooterLink href="/terms">Terms &amp; Conditions</FooterLink> |{' '}
            <FooterLink href="/booking-policy">Booking &amp; Cancellation</FooterLink>
          </span>
        </div>
      </div>
    </footer>
  )
}
