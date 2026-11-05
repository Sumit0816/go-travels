import type { Endpoint, Where } from 'payload'

import { canRead, canUpdateSome } from '@/access'
import { toCsv } from '@/lib/admin-helpers'
import { BOOKING_STATUSES, hotelCategoryLabel } from '@/lib/catalog'
import { dispatchBookingAlert } from '@/lib/whatsapp/send'

const role = (u: unknown) => (u as { role?: unknown } | null)?.role

/** Same filter the dashboard table uses: ?status=new&q=ankit */
export function bookingsWhere(status?: string | null, q?: string | null): Where {
  const and: Where[] = []
  if (status && BOOKING_STATUSES.some((s) => s.value === status))
    and.push({ status: { equals: status } })
  const term = q?.trim()
  if (term) {
    and.push({
      or: [
        { requestId: { like: term } },
        { name: { like: term } },
        { whatsapp: { like: term.replace(/\D/g, '') || term } },
        { 'packageSnapshot.title': { like: term } },
      ],
    })
  }
  return and.length ? { and } : {}
}

/** GET /api/bookings/export?status=&q= → CSV of the matching bookings. */
export const exportBookingsCsv: Endpoint = {
  path: '/export',
  method: 'get',
  handler: async (req) => {
    if (!req.user || !canRead('bookings', role(req.user))) {
      return Response.json({ error: 'Not allowed' }, { status: 403 })
    }
    const url = new URL(req.url ?? 'http://x')
    const { docs } = await req.payload.find({
      collection: 'bookings',
      where: bookingsWhere(url.searchParams.get('status'), url.searchParams.get('q')),
      sort: '-createdAt',
      limit: 5000,
      depth: 0,
      user: req.user,
      overrideAccess: false,
      req,
    })
    const csv = toCsv(
      [
        'Request ID',
        'Created',
        'Name',
        'WhatsApp',
        'Email',
        'Package',
        'Duration',
        'Travel date',
        'From',
        'Hotel',
        'Adults',
        'Children',
        'Est. total (INR)',
        'WhatsApp status',
        'Status',
      ],
      docs.map((b) => [
        b.requestId,
        b.createdAt.slice(0, 10),
        b.name,
        b.whatsapp,
        b.email,
        b.packageSnapshot?.title,
        b.packageSnapshot?.duration,
        b.travelDate?.slice(0, 10),
        b.departureCity,
        b.hotelCategory ? hotelCategoryLabel(b.hotelCategory) : '',
        b.adults,
        b.children,
        b.estimatedTotal,
        b.whatsappStatus,
        b.status,
      ]),
    )
    const date = new Date().toISOString().slice(0, 10)
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="go-travels-bookings-${date}.csv"`,
        'Cache-Control': 'no-store',
      },
    })
  },
}

/** POST /api/bookings/:id/resend → sends the team WhatsApp alert again (not the customer copy). */
export const resendBookingAlert: Endpoint = {
  path: '/:id/resend',
  method: 'post',
  handler: async (req) => {
    if (!req.user || !canUpdateSome('bookings', role(req.user))) {
      return Response.json({ error: 'Not allowed' }, { status: 403 })
    }
    const id = Number(req.routeParams?.id)
    // Confirms the user may see this booking before acting on it.
    await req.payload.findByID({
      collection: 'bookings',
      id,
      user: req.user,
      overrideAccess: false,
      req,
    })
    await dispatchBookingAlert(req.payload, id, { customerCopy: false })
    const after = await req.payload.findByID({
      collection: 'bookings',
      id,
      depth: 0,
      overrideAccess: true,
    })
    return Response.json({ ok: true, whatsappStatus: after.whatsappStatus })
  },
}
