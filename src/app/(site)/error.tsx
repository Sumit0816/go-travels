'use client'

import Link from 'next/link'
import { useEffect } from 'react'

import { StateScreen } from '@/components/site/StateScreen'

/** Unexpected error inside the site (the header and footer stay). */
export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])
  return (
    <StateScreen
      eyebrow="Something went wrong"
      title="We hit a bump in the road"
      actions={
        <>
          <button type="button" className="gt-btn gt-btn--primary gt-btn--lg" onClick={reset}>
            Try again
          </button>
          <Link href="/" className="gt-btn gt-btn--outline gt-btn--lg">
            Go to Home
          </Link>
        </>
      }
    >
      <p className="m-0">
        This page couldn&apos;t load just now. Please try again in a moment.
        {error.digest && (
          <>
            {' '}
            <span className="text-body-sm text-ink-500">(Reference {error.digest})</span>
          </>
        )}
      </p>
    </StateScreen>
  )
}
