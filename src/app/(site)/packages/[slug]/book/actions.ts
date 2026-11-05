'use server'

import { headers } from 'next/headers'

import { parseBooking, quoteBooking, type BookingErrors } from '@/lib/booking'
import { clientIpFrom, formRateLimit } from '@/lib/client-ip'
import { payloadClient } from '@/lib/cms'
import { formatDuration, normalizeIndianMobile } from '@/lib/format'
import { createRateLimiter } from '@/lib/rate-limit'
import { bookingVariables, renderBookingMessage } from '@/lib/whatsapp/messages'
import { bookingMessageInput, dispatchBookingAlert } from '@/lib/whatsapp/send'

export type BookingResult =
  | { status: 'error'; message: string; errors?: BookingErrors }
  /** Saved and delivered to at least one team number. `message` is what the team received. */
  | { status: 'sent'; requestId: string; message: string }
  /** Saved, but WhatsApp failed for now (retries and the email fallback continue). */
  | { status: 'failed'; requestId: string }

// 5 booking requests (and 10 "Try again"s) per visitor per 10 minutes.
const submitLimiter = createRateLimiter({ limit: formRateLimit(5), windowMs: 10 * 60 * 1000 })
const retryLimiter = createRateLimiter({ limit: formRateLimit(10), windowMs: 10 * 60 * 1000 })

const clientIp = async () => clientIpFrom(await headers())

/**
 * The booking form's final step. Re-validates everything, prices it from the package (the
 * browser's estimate is ignored), saves the booking and sends the WhatsApp alert straight away.
 */
export async function submitBooking(raw: Record<string, unknown>): Promise<BookingResult> {
  // Spam trap: pretend success, save nothing.
  if (typeof raw.website === 'string' && raw.website) {
    return { status: 'sent', requestId: 'GT-00000', message: '' }
  }
  const parsed = parseBooking(raw)
  if (!parsed.ok) {
    return {
      status: 'error',
      message: 'Please check the highlighted fields.',
      errors: parsed.errors,
    }
  }
  if (!submitLimiter.check(`booking:${await clientIp()}`)) {
    return {
      status: 'error',
      message:
        'You have sent several requests in a short time. Please wait a few minutes, or message us on WhatsApp.',
    }
  }

  const d = parsed.data
  try {
    const payload = await payloadClient()
    const pkg = (
      await payload.find({
        collection: 'packages',
        where: { slug: { equals: d.packageSlug } },
        limit: 1,
        depth: 0,
        overrideAccess: false,
      })
    ).docs[0]
    if (!pkg) return { status: 'error', message: 'This package is no longer available.' }
    const quote = quoteBooking(pkg, d)
    if (!quote) {
      return {
        status: 'error',
        message: 'Please choose a hotel category.',
        errors: { hotel: 'This hotel category is not available for this package' },
      }
    }

    const booking = await payload.create({
      collection: 'bookings',
      data: {
        package: pkg.id,
        packageSnapshot: {
          title: pkg.title,
          duration: formatDuration(pkg.durationNights, pkg.durationDays ?? undefined).replace(
            / /g,
            '',
          ),
        },
        // Midday UTC keeps the calendar date the same in every time zone.
        travelDate: `${d.travelDate}T12:00:00.000Z`,
        departureCity: d.departureCity,
        hotelCategory: d.hotel as 'standard3' | 'deluxe4' | 'luxury5',
        rooms: d.rooms,
        adults: d.adults,
        children: d.children,
        addOns: quote.addOns.map((a) => a.name),
        estimatedTotal: quote.total,
        name: d.name,
        whatsapp: d.whatsapp,
        email: d.email,
        city: d.city,
        specialRequests: d.specialRequests,
        consent: true,
        status: 'new',
        whatsappStatus: 'notSent',
        source: 'website',
      },
      overrideAccess: true,
    })
    const requestId = booking.requestId ?? `booking-${booking.id}`
    try {
      const { sent, text } = await dispatchBookingAlert(payload, booking.id)
      return sent ? { status: 'sent', requestId, message: text } : { status: 'failed', requestId }
    } catch (err) {
      payload.logger.error({ err }, `WhatsApp alert for ${requestId} failed to start`)
      return { status: 'failed', requestId }
    }
  } catch (err) {
    console.error('Booking could not be saved', err)
    return {
      status: 'error',
      message:
        "We couldn't save your request just now. Please try again, or message us on WhatsApp.",
    }
  }
}

/**
 * "Try again" on the failure screen. The visitor proves it is their request with the WhatsApp
 * number they entered; only failed requests are re-sent.
 */
export async function retryBookingAlert(
  requestId: string,
  whatsapp: string,
): Promise<BookingResult> {
  if (!retryLimiter.check(`booking-retry:${await clientIp()}`)) {
    return { status: 'error', message: 'Please wait a few minutes before trying again.' }
  }
  const number = normalizeIndianMobile(whatsapp)
  if (!/^GT-\d{1,10}$/.test(requestId) || !number) {
    return { status: 'error', message: 'This request could not be found.' }
  }
  const payload = await payloadClient()
  const booking = (
    await payload.find({
      collection: 'bookings',
      where: { requestId: { equals: requestId }, whatsapp: { equals: number } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
  ).docs[0]
  if (!booking) return { status: 'error', message: 'This request could not be found.' }
  if (booking.whatsappStatus !== 'failed' && booking.whatsappStatus !== 'queued') {
    // Already went through (e.g. a background retry succeeded).
    const message = renderBookingMessage(bookingVariables(bookingMessageInput(booking)))
    return { status: 'sent', requestId, message }
  }
  const { sent, text } = await dispatchBookingAlert(payload, booking.id, { customerCopy: false })
  return sent ? { status: 'sent', requestId, message: text } : { status: 'failed', requestId }
}
