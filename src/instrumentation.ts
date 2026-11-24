import type { Instrumentation } from 'next'

/** Starts Sentry on the server when SENTRY_DSN is set (Next.js calls this once per server). */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs' || !process.env.SENTRY_DSN) return
  const Sentry = await import('@sentry/nextjs')
  const { scrubEvent } = await import('./lib/monitoring')
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    // Errors only, no performance tracing. Contact details are masked in beforeSend.
    tracesSampleRate: 0,
    beforeSend: (event) => scrubEvent(event),
  })
}

/** Unhandled errors in pages, server actions and API routes. */
export const onRequestError: Instrumentation.onRequestError = async (...args) => {
  if (!process.env.SENTRY_DSN) return
  const Sentry = await import('@sentry/nextjs')
  Sentry.captureRequestError(...args)
}
