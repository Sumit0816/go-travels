import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import type { ReactNode } from 'react'

// Self-hosted variable fonts (no request to Google at runtime). Family names are mapped to
// --font-sora / --font-inter in globals.css.
import '@fontsource-variable/sora'
import '@fontsource-variable/inter'
import '@/styles/globals.css'

import { FloatingActions } from '@/components/site/FloatingActions'
import { Footer } from '@/components/site/Footer'
import { Header } from '@/components/site/Header'
import { JsonLd } from '@/components/site/JsonLd'
import { buildContact, buildFooterLinks, buildHeaderNav } from '@/components/site/data'
import { getNavigation, getSiteSettings } from '@/lib/cms'
import { siteUrl } from '@/lib/site/links'
import { pickImage } from '@/lib/site/media'
import type { SiteSetting } from '@/payload-types'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings().catch(() => null)
  const og = pickImage(settings?.defaultOgImage, 'og')
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
    openGraph: {
      type: 'website',
      locale: 'en_IN',
      siteName: settings?.siteName || 'Go Travels',
      images: og ? [{ url: og.src, width: og.width, height: og.height, alt: og.alt }] : undefined,
    },
  }
}

export const viewport: Viewport = {
  themeColor: '#0B4F6C',
}

/** Business details for search engines (schema.org TravelAgency). */
function organisationLd(s: SiteSetting | null) {
  const site = siteUrl()
  const sameAs = [s?.instagram, s?.facebook, s?.youtube].filter((u): u is string => !!u)
  return {
    '@context': 'https://schema.org',
    '@type': 'TravelAgency',
    name: s?.siteName || 'Go Travels',
    url: site,
    logo: `${site}/brand/go-travels-mark.svg`,
    telephone: s?.phones?.[0]?.number || undefined,
    email: s?.email || undefined,
    address: s?.address || undefined,
    openingHours: s?.workingHours || undefined,
    sameAs: sameAs.length ? sameAs : undefined,
  }
}

/** Only real GA4 measurement IDs reach the script URL. */
const gaIdOf = (s: SiteSetting | null) =>
  s?.gaId && /^G-[A-Z0-9]{4,20}$/.test(s.gaId) ? s.gaId : null

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const [settings, navigation] = await Promise.all([
    getSiteSettings().catch(() => null),
    getNavigation().catch(() => null),
  ])
  const contact = buildContact(settings)
  const gaId = gaIdOf(settings)

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
        <JsonLd data={organisationLd(settings)} />
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${gaId}');`}
            </Script>
          </>
        )}
      </body>
    </html>
  )
}
