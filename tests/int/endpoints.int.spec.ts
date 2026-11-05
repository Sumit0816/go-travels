// @vitest-environment node
/**
 * Custom CMS endpoints against a real database: Convert to booking, CSV export, Resend.
 * Handlers are called with a request built for a specific user, exactly as Payload would.
 */
import { randomUUID } from 'node:crypto'

import { createLocalReq, getPayload, type Endpoint, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'
import { exportBookingsCsv, resendBookingAlert } from '@/endpoints/bookings'
import { convertEnquiry } from '@/endpoints/enquiries'
import type { User } from '@/payload-types'

let payload: Payload
const tag = randomUUID().slice(0, 8)
const users: Record<string, User> = {}
const cleanup: { collection: 'bookings' | 'enquiries' | 'users' | 'messageLog'; id: number }[] = []

async function call(
  endpoint: Endpoint,
  role: string,
  params: Record<string, string> = {},
  url = 'http://localhost/api/x',
) {
  const req = await createLocalReq({ user: users[role] }, payload)
  req.routeParams = params
  ;(req as { url?: string }).url = url
  return endpoint.handler(req)
}

beforeAll(async () => {
  payload = await getPayload({ config: await config })
  for (const role of ['owner', 'sales', 'contentEditor'] as const) {
    const u = await payload.create({
      collection: 'users',
      data: {
        name: `Endpoint ${role}`,
        email: `ep-${role}-${tag}@example.test`,
        password: `pw-${randomUUID()}`,
        role,
        whatsappAlerts: 'no',
        status: 'active',
      },
    })
    users[role] = { ...u, collection: 'users' }
    cleanup.push({ collection: 'users', id: u.id })
  }
})

afterAll(async () => {
  const logs = await payload.find({
    collection: 'messageLog',
    where: { error: { like: tag } },
    limit: 100,
  })
  for (const l of logs.docs) cleanup.push({ collection: 'messageLog', id: l.id })
  for (const { collection, id } of cleanup.reverse()) {
    await payload.delete({ collection, id, overrideAccess: true }).catch(() => {})
  }
})

describe('Convert to booking', () => {
  it('creates a linked booking and marks the enquiry converted (Sales, assigned)', async () => {
    const enquiry = await payload.create({
      collection: 'enquiries',
      data: {
        name: 'Convert Me',
        whatsapp: '9835144120',
        source: 'tripFinder',
        status: 'contacted',
        travellers: 'family-2-2',
        travelMonth: '2027-02',
        destination: 'Bali',
        assignedTo: users.sales.id,
      },
    })
    cleanup.push({ collection: 'enquiries', id: enquiry.id })

    const res = await call(convertEnquiry, 'sales', { id: String(enquiry.id) })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { bookingId: number; requestId: string }
    cleanup.push({ collection: 'bookings', id: body.bookingId })
    expect(body.requestId).toMatch(/^GT-\d+$/)

    const booking = await payload.findByID({ collection: 'bookings', id: body.bookingId, depth: 0 })
    expect(booking).toMatchObject({
      name: 'Convert Me',
      adults: 2,
      children: 2,
      source: 'enquiry',
      fromEnquiry: enquiry.id,
    })
    expect(booking.travelDate.slice(0, 10)).toBe('2027-02-01')

    const after = await payload.findByID({ collection: 'enquiries', id: enquiry.id, depth: 0 })
    expect(after.status).toBe('converted')
    expect(after.convertedBooking).toBe(body.bookingId)
    expect(after.internalNotes?.at(-1)?.text).toContain(body.requestId)

    // Converting twice returns the same booking instead of creating another.
    const again = (await (
      await call(convertEnquiry, 'sales', { id: String(enquiry.id) })
    ).json()) as { bookingId: number }
    expect(again.bookingId).toBe(body.bookingId)
  })

  it("refuses Sales on enquiries that aren't assigned to them, and Content Editors entirely", async () => {
    const enquiry = await payload.create({
      collection: 'enquiries',
      data: { name: 'Not yours', whatsapp: '9835144121', source: 'tripFinder', status: 'new' },
    })
    cleanup.push({ collection: 'enquiries', id: enquiry.id })
    await expect(call(convertEnquiry, 'sales', { id: String(enquiry.id) })).rejects.toThrow()
    const res = await call(convertEnquiry, 'contentEditor', { id: String(enquiry.id) })
    expect(res.status).toBe(403)
  })
})

describe('bookings export and resend', () => {
  it('exports matching bookings as CSV for staff, never for Content Editors', async () => {
    const b = await payload.create({
      collection: 'bookings',
      data: {
        name: `=CSV ${tag}`,
        whatsapp: '9830122457',
        travelDate: new Date().toISOString(),
        adults: 2,
        status: 'new',
      },
    })
    cleanup.push({ collection: 'bookings', id: b.id })

    const res = await call(
      exportBookingsCsv,
      'owner',
      {},
      `http://localhost/api/bookings/export?q=${tag}`,
    )
    expect(res.headers.get('Content-Type')).toContain('text/csv')
    const csv = await res.text()
    expect(csv.split('\r\n')[0]).toContain('Request ID')
    expect(csv).toContain(b.requestId!)
    expect(csv).toContain(`'=CSV ${tag}`) // formula neutralised

    expect((await call(exportBookingsCsv, 'contentEditor')).status).toBe(403)
  })

  it('re-sends a failed WhatsApp alert and logs it', async () => {
    const b = await payload.create({
      collection: 'bookings',
      data: {
        name: 'Resend',
        whatsapp: '9830122457',
        travelDate: new Date().toISOString(),
        adults: 2,
        status: 'new',
        whatsappStatus: 'failed',
      },
    })
    cleanup.push({ collection: 'bookings', id: b.id })
    users.sales.name = `Sales ${tag}`

    const res = await call(resendBookingAlert, 'sales', { id: String(b.id) })
    expect(res.status).toBe(200)
    const after = await payload.findByID({ collection: 'bookings', id: b.id })
    // Sent straight away; the outcome depends on this database's WhatsApp settings.
    expect(['sent', 'queued', 'failed']).toContain(after.whatsappStatus)
    expect((await res.json()).whatsappStatus).toBe(after.whatsappStatus)
    const logs = await payload.find({
      collection: 'messageLog',
      where: { booking: { equals: b.id } },
    })
    expect(logs.docs.length).toBeGreaterThan(0)
    expect(logs.docs.every((l) => l.kind === 'booking')).toBe(true)
    expect(logs.docs[0].attempts).toBe(1)
  })

  it('stamps confirmedAt when a booking becomes Confirmed', async () => {
    const b = await payload.create({
      collection: 'bookings',
      data: {
        name: 'Confirm',
        whatsapp: '9830122457',
        travelDate: new Date().toISOString(),
        adults: 1,
        status: 'new',
      },
    })
    cleanup.push({ collection: 'bookings', id: b.id })
    expect(b.confirmedAt).toBeFalsy()
    const confirmed = await payload.update({
      collection: 'bookings',
      id: b.id,
      data: { status: 'confirmed' },
    })
    expect(confirmed.confirmedAt).toBeTruthy()
  })
})
