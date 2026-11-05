import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'

// Self-hosted variable fonts (no request to Google at runtime). Family names are mapped to
// --font-sora / --font-inter in globals.css.
import '@fontsource-variable/sora'
import '@fontsource-variable/inter'
import '@/styles/globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: 'Go Travels — Domestic, International & Religious Tours',
    template: '%s · Go Travels',
  },
  description: 'Handpicked tour packages with booking confirmed on WhatsApp.',
  icons: { icon: '/brand/go-travels-favicon.svg' },
}

export const viewport: Viewport = {
  themeColor: '#0B4F6C',
}

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-IN">
      <body>{children}</body>
    </html>
  )
}
