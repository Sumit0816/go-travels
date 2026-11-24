/**
 * Google Analytics 4 events from the launch checklist. A no-op when GA isn't configured
 * (Site Settings › SEO › GA ID) or blocked by the visitor.
 */
export type AnalyticsEvent = 'booking_request' | 'enquiry_submit' | 'whatsapp_click'

type Gtag = (command: 'event', name: string, params?: Record<string, unknown>) => void

export function track(name: AnalyticsEvent, params?: Record<string, string | number>) {
  if (typeof window === 'undefined') return
  const gtag = (window as unknown as { gtag?: Gtag }).gtag
  try {
    gtag?.('event', name, params)
  } catch {
    // Analytics must never break the page.
  }
}
