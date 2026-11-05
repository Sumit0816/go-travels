import type { Payload } from 'payload'

/**
 * Queues WhatsApp alerts for a booking. Phase 5 adds the aggregator adapter and the job that
 * actually sends them; until then this marks the booking "Queued" and records the request in
 * the delivery log, so "Resend" from the dashboard is visible and nothing is silently dropped.
 */
export async function queueBookingAlert(
  payload: Payload,
  bookingId: number,
  requestedBy: string,
): Promise<void> {
  const booking = await payload.update({
    collection: 'bookings',
    id: bookingId,
    data: { whatsappStatus: 'queued' },
    overrideAccess: true,
    context: { disableRevalidate: true },
  })
  const settings = await payload.findGlobal({ slug: 'whatsappSettings', overrideAccess: true })
  const recipients = settings.recipients?.length
    ? settings.recipients
    : [{ label: 'Owner', phone: '—' }]
  for (const r of recipients) {
    await payload.create({
      collection: 'messageLog',
      data: {
        reference: booking.requestId ?? `booking-${bookingId}`,
        kind: 'booking',
        booking: bookingId,
        recipientLabel: r.label,
        phone: r.phone,
        provider: settings.provider,
        template: settings.bookingTemplate?.name ?? undefined,
        status: 'queued',
        attempts: 0,
        error: `Resend requested by ${requestedBy}.`,
      },
      overrideAccess: true,
    })
  }
}
