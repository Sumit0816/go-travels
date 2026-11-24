/**
 * Server-side error reporting. Sends to Sentry when SENTRY_DSN is set; always logs. Only the
 * server reports (no browser SDK), which keeps the pages light.
 *
 * Customer phone numbers and emails are masked before anything leaves the server.
 */
import type { ErrorEvent } from '@sentry/nextjs'

const PHONE = /\+?\d[\d\s-]{8,}\d/g
const EMAIL = /[^\s@<>"']+@[^\s@<>"']+\.[a-z]{2,}/gi

export function scrub(text: string): string {
  return text.replace(EMAIL, '[email]').replace(PHONE, '[phone]')
}

/** Masks contact details in a Sentry event's messages. */
export function scrubEvent(event: ErrorEvent): ErrorEvent {
  if (event.message) event.message = scrub(event.message)
  for (const ex of event.exception?.values ?? []) {
    if (ex.value) ex.value = scrub(ex.value)
  }
  for (const b of event.breadcrumbs ?? []) {
    if (b.message) b.message = scrub(b.message)
  }
  // Request bodies and cookies are never needed to debug these errors.
  if (event.request) {
    delete event.request.data
    delete event.request.cookies
  }
  return event
}

export const monitoringEnabled = () => Boolean(process.env.SENTRY_DSN)

/** Logs an error and reports it to Sentry (when configured), with a short context label. */
export async function reportError(err: unknown, context: string, extra?: Record<string, unknown>) {
  console.error(`[${context}]`, err)
  if (!monitoringEnabled()) return
  try {
    const Sentry = await import('@sentry/nextjs')
    Sentry.captureException(err, { tags: { context }, extra })
  } catch {
    // Never let reporting break the request.
  }
}
