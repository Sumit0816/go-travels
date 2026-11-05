import type { Metadata } from 'next'
import Link from 'next/link'

import { StateScreen } from '@/components/site/StateScreen'

export const metadata: Metadata = { title: 'Page not found', robots: { index: false } }

/** 404 (design: States · "Looks like this road leads nowhere"). */
export default function NotFound() {
  return (
    <StateScreen
      eyebrow="Error 404"
      title="Looks like this road leads nowhere"
      actions={
        <>
          <Link href="/" className="gt-btn gt-btn--primary gt-btn--lg">
            Go to Home
          </Link>
          <Link href="/tours" className="gt-btn gt-btn--outline gt-btn--lg">
            Browse tours
          </Link>
        </>
      }
    >
      <p className="m-0">
        The page you were looking for has moved or no longer exists. Try our tours, or{' '}
        <Link href="/plan-my-trip" className="text-ocean-700 underline">
          tell us where you want to go
        </Link>
        .
      </p>
    </StateScreen>
  )
}
