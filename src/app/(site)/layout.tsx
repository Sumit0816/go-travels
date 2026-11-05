import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'

// Self-hosted variable fonts (no request to Google at runtime). Family names are mapped to
// --font-sora / --font-inter in globals.css.
import '@fontsource-variable/sora'
import '@fontsource-variable/inter'
import '@/styles/globals.css'

import { FloatingActions } from '@/components/site/FloatingActions'
import { Footer } from '@/components/site/Footer'
import { Header } from '@/components/site/Header'
import { buildContact, buildFooterLinks, buildHeaderNav } from '@/components/site/data'
import { getNavigation, getSiteSettings } from '@/lib/cms'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings().catch(() => null)
  const title =
    settings?.defaultMetaTitle || 'Go Travels — Domestic, International & Religious Tours'
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
    title: { default: title, template: `%s · ${settings?.siteName || 'Go Travels'}` },
    description:
      settings?.defaultMetaDescription ||
      'Handpicked tour packages with booking confirmed on WhatsApp.',
    icons: { icon: '/brand/go-travels-favicon.svg' },
    verification: settings?.searchConsoleCode ? { google: settings.searchConsoleCode } : undefined,
  }
}

export const viewport: Viewport = {
  themeColor: '#0B4F6C',
}

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const [settings, navigation] = await Promise.all([
    getSiteSettings().catch(() => null),
    getNavigation().catch(() => null),
  ])
  const contact = buildContact(settings)

  return (
    <html lang="en-IN">
      {/* Bottom padding on phones keeps content clear of the sticky Call / WhatsApp / Enquire bar. */}
      <body className="pb-[76px] md:pb-0">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-surface focus:p-3"
        >
          Skip to content
        </a>
        <Header nav={buildHeaderNav(navigation)} contact={contact} />
        <div id="main">{children}</div>
        <Footer
          quickLinks={buildFooterLinks(navigation?.footerQuickLinks)}
          tours={buildFooterLinks(navigation?.footerTours)}
          contact={contact}
          settings={settings}
        />
        <FloatingActions contact={contact} />
      </body>
    </html>
  )
}
