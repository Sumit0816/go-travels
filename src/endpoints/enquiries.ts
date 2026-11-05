import type { Endpoint } from 'payload'

import { canUpdateSome } from '@/access'
import { enquiryToBookingData } from '@/lib/admin-helpers'

/**
 * POST /api/enquiries/:id/convert → creates a booking from the enquiry, marks the enquiry
 * Converted and links the two. Allowed for anyone who may update that enquiry (Sales on their
 * assigned enquiries included), even though Sales can't create bookings by hand.
 */
export const convertEnquiry: Endpoint = {
  path: '/:id/convert',
  method: 'post',
  handler: async (req) => {
    const role = (req.user as { role?: unknown } | null)?.role
    if (!req.user || !canUpdateSome('enquiries', role)) {
      return Response.json({ error: 'Not allowed' }, { status: 403 })
    }
    const id = Number(req.routeParams?.id)
    // Access-checked read: Sales get a 404 for enquiries not assigned to them.
    const enquiry = await req.payload.findByID({
      collection: 'enquiries',
      id,
      depth: 1,
      user: req.user,
      overrideAccess: false,
      req,
    })
    if (enquiry.convertedBooking) {
      const existing =
        typeof enquiry.convertedBooking === 'object'
          ? enquiry.convertedBooking.id
          : enquiry.convertedBooking
      return Response.json({ ok: true, bookingId: existing, alreadyConverted: true })
    }

    const booking = await req.payload.create({
      collection: 'bookings',
      data: enquiryToBookingData(enquiry as Parameters<typeof enquiryToBookingData>[0]),
      overrideAccess: true,
      req,
    })
    await req.payload.update({
      collection: 'enquiries',
      id,
      data: {
        status: 'converted',
        convertedBooking: booking.id,
        internalNotes: [
          ...(enquiry.internalNotes ?? []).map((n) => ({
            ...n,
            author: typeof n.author === 'object' ? n.author?.id : n.author,
          })),
          {
            text: `Converted to booking ${booking.requestId}.`,
            author: req.user.id,
            at: new Date().toISOString(),
          },
        ],
      },
      overrideAccess: true,
      req,
    })
    return Response.json({ ok: true, bookingId: booking.id, requestId: booking.requestId })
  },
}
