// @vitest-environment node
/**
 * WhatsApp delivery against a real database: sending, retries with backoff, the email
 * fallback, provider webhooks and the cron / webhook endpoint guards. The provider is never
 * called: without a key the console adapter is used, and HTTP is stubbed where a key is set.
 */
import { createLocalReq, getPayload, type Endpoint, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import config from '@/payload.config'
import { whatsappProcess, whatsappWebhook } from '@/endpoints/whatsapp'
import {
  dispatchBookingAlert,
  dispatchEnquiryAlert,
  processDueMessages,
  sendTestMessage,
} from '@/lib/whatsapp/send'
import { applyStatusUpdates } from '@/lib/whatsapp/webhook'
import type { WhatsappSetting } from '@/payload-types'

let payload: Payload
let original: WhatsappSetting
const created: { collection: 'bookings' | 'enquiries'; id: number }[] = []

const MIN = 60_000

async function setSettings(data: Partial<WhatsappSetting>, resetKey = false) {
  await payload.updateGlobal({
    slug: 'whatsappSettings',
    data,
    overrideAccess: true,
    context: resetKey ? { resetWhatsAppKey: true } : {},
  })
}

async function newBooking(name: string) {
  const b = await payload.create({
    collection: 'bookings',
    data: {
      name,
      whatsapp: '9830122457',
      travelDate: '2027-01-15T12:00:00.000Z',
      adults: 2,
      children: 1,
      rooms: 1,
      hotelCategory: 'deluxe4',
      packageSnapshot: { title: 'Goa Beach Escape', duration: '3N/4D' },
      estimatedTotal: 42498,
      status: 'new',
    },
    overrideAccess: true,
  })
  created.push({ collection: 'bookings', id: b.id })
  return b
}

const logsFor = async (bookingId: number) =>
  (
    await payload.find({
      collection: 'messageLog',
      where: { booking: { equals: bookingId } },
      sort: 'createdAt',
      overrideAccess: true,
    })
  ).docs

async function call(endpoint: Endpoint, url: string, init: { body?: unknown; auth?: string } = {}) {
  const req = await createLocalReq({}, payload)
  ;(req as { url?: string }).url = url
  req.routeParams = { provider: 'gupshup' }
  req.headers = new Headers(init.auth ? { authorization: init.auth } : {})
  req.json = async () => init.body
  return endpoint.handler(req)
}

beforeAll(async () => {
  payload = await getPayload({ config: await config })
  original = await payload.findGlobal({ slug: 'whatsappSettings', overrideAccess: true })
  await setSettings(
    {
      provider: 'gupshup',
      senderNumber: '',
      recipients: [
        { label: 'Owner', phone: '+91 98765 43210', isPrimary: true },
        { label: 'Sales', phone: '91234 56780', isPrimary: false },
      ],
      sendCustomerCopy: true,
      emailFallback: true,
      fallbackEmail: 'ops@example.test',
      bookingTemplate: { name: 'gt_booking_request', language: 'en' },
      customerTemplate: { name: 'gt_booking_copy', language: 'en' },
      enquiryTemplate: { name: 'gt_enquiry', language: 'en' },
    },
    true,
  )
})

afterAll(async () => {
  vi.unstubAllGlobals()
  for (const c of created) {
    await payload.delete({
      collection: 'messageLog',
      where: { [c.collection === 'bookings' ? 'booking' : 'enquiry']: { equals: c.id } },
      overrideAccess: true,
    })
    await payload.delete({ collection: c.collection, id: c.id, overrideAccess: true })
  }
  await payload.delete({
    collection: 'messageLog',
    where: { reference: { equals: 'TEST' } },
    overrideAccess: true,
  })
  await setSettings(
    {
      provider: original.provider,
      senderNumber: original.senderNumber,
      recipients: original.recipients,
      sendCustomerCopy: original.sendCustomerCopy,
      emailFallback: original.emailFallback,
      fallbackEmail: original.fallbackEmail,
      connectionStatus: original.connectionStatus,
    },
    true,
  )
})

describe('sending', () => {
  it('sends the team alert and the customer copy, and marks the booking Sent', async () => {
    const b = await newBooking('Send Ok')
    const result = await dispatchBookingAlert(payload, b.id)
    expect(result.sent).toBe(true)
    expect(result.text).toContain(`*New Booking Request* · ${b.requestId}`)
    expect(result.text).toContain('Travellers: 2 Adults, 1 Child')

    const logs = await logsFor(b.id)
    expect(logs.map((l) => [l.kind, l.recipientLabel, l.status])).toEqual([
      ['booking', 'Owner', 'sent'],
      ['booking', 'Sales', 'sent'],
      ['customerCopy', 'Customer', 'sent'],
    ])
    expect(logs[0]!.params).toHaveLength(11)
    expect(logs[0]!.providerMessageId).toMatch(/^console-/)
    const after = await payload.findByID({ collection: 'bookings', id: b.id })
    expect(after.whatsappStatus).toBe('sent')
  })

  it('sends enquiry alerts', async () => {
    const e = await payload.create({
      collection: 'enquiries',
      data: { name: 'Enquiry Ok', whatsapp: '9123456780', source: 'tripFinder', status: 'new' },
      overrideAccess: true,
    })
    created.push({ collection: 'enquiries', id: e.id })
    const result = await dispatchEnquiryAlert(payload, e.id)
    expect(result.sent).toBe(true)
    expect(result.text).toContain(`*New Enquiry* · ${e.enquiryId}`)
    const after = await payload.findByID({ collection: 'enquiries', id: e.id })
    expect(after.whatsappStatus).toBe('sent')
  })
})

describe('retries and fallback', () => {
  it('retries after 1, 5 and 15 minutes, then fails and emails the team once', async () => {
    await setSettings({
      apiKey: 'test-key-1234',
      senderNumber: '91 98765 43210',
      sendCustomerCopy: false,
    })
    const fetchMock = vi.fn(async () => new Response('{"message":"down"}', { status: 503 }))
    vi.stubGlobal('fetch', fetchMock)
    const email = vi.spyOn(payload, 'sendEmail').mockResolvedValue(undefined)
    try {
      const b = await newBooking('Retry')
      const start = Date.now()
      const result = await dispatchBookingAlert(payload, b.id)
      expect(result.sent).toBe(false)
      let logs = await logsFor(b.id)
      expect(logs.every((l) => l.status === 'queued' && l.attempts === 1)).toBe(true)
      const firstRetry = new Date(logs[0]!.nextAttemptAt!).getTime() - start
      expect(firstRetry).toBeGreaterThanOrEqual(MIN - 1000)
      expect(firstRetry).toBeLessThan(MIN + 30_000)
      expect((await payload.findByID({ collection: 'bookings', id: b.id })).whatsappStatus).toBe(
        'queued',
      )

      // Not due yet: nothing happens.
      await processDueMessages(payload, new Date(start + 30_000))
      expect((await logsFor(b.id))[0]!.attempts).toBe(1)

      await processDueMessages(payload, new Date(start + MIN + 5_000))
      await processDueMessages(payload, new Date(start + 7 * MIN))
      expect(email).not.toHaveBeenCalled()
      await processDueMessages(payload, new Date(start + 23 * MIN))

      logs = await logsFor(b.id)
      expect(logs.map((l) => [l.status, l.attempts])).toEqual([
        ['failed', 4],
        ['failed', 4],
      ])
      expect(logs[0]!.error).toContain('503')
      expect((await payload.findByID({ collection: 'bookings', id: b.id })).whatsappStatus).toBe(
        'failed',
      )
      expect(email).toHaveBeenCalledTimes(1)
      expect(email.mock.calls[0]![0]).toMatchObject({
        to: 'ops@example.test',
        subject: `WhatsApp alert failed: ${b.requestId}`,
      })
      expect(String((email.mock.calls[0]![0] as { text: string }).text)).toContain(
        `New Booking Request · ${b.requestId}`,
      )

      // A wrong key won't fix itself: no retries.
      fetchMock.mockImplementation(
        async () => new Response('{"message":"Authentication Failed"}', { status: 401 }),
      )
      const b2 = await newBooking('Bad key')
      await dispatchBookingAlert(payload, b2.id)
      expect((await logsFor(b2.id)).map((l) => [l.status, l.nextAttemptAt ?? null])).toEqual([
        ['failed', null],
        ['failed', null],
      ])

      // Gupshup accepting the message.
      fetchMock.mockImplementation(
        async () => new Response('{"status":"submitted","messageId":"gs-123"}', { status: 202 }),
      )
      const b3 = await newBooking('Gupshup ok')
      expect((await dispatchBookingAlert(payload, b3.id)).sent).toBe(true)
      const call = fetchMock.mock.calls.at(-1) as unknown as [string, RequestInit]
      expect(call[0]).toBe('https://api.gupshup.io/wa/api/v1/template/msg')
      const body = new URLSearchParams(String(call[1].body))
      expect(body.get('destination')).toMatch(/^91\d{10}$/)
      expect(JSON.parse(body.get('template')!)).toMatchObject({ id: 'gt_booking_request' })
      expect((call[1].headers as Record<string, string>).apikey).toBe('test-key-1234')
    } finally {
      vi.unstubAllGlobals()
      email.mockRestore()
      await setSettings({ senderNumber: '', sendCustomerCopy: true }, true)
    }
  })
})

describe('delivery receipts', () => {
  it('moves alerts forward to Delivered and Read, ignoring late receipts', async () => {
    const b = await newBooking('Receipts')
    await dispatchBookingAlert(payload, b.id, { customerCopy: false })
    const [owner] = await logsFor(b.id)
    const id = owner!.providerMessageId!

    await applyStatusUpdates(payload, [{ providerMessageId: id, status: 'delivered' }])
    expect((await payload.findByID({ collection: 'bookings', id: b.id })).whatsappStatus).toBe(
      'delivered',
    )
    await applyStatusUpdates(payload, [{ providerMessageId: id, status: 'read' }])
    // Out of order: a late "sent" receipt must not downgrade it.
    expect(await applyStatusUpdates(payload, [{ providerMessageId: id, status: 'sent' }])).toBe(0)
    const log = await payload.findByID({
      collection: 'messageLog',
      id: owner!.id,
      overrideAccess: true,
    })
    expect(log.status).toBe('read')
    expect(log.readAt).toBeTruthy()
    expect((await payload.findByID({ collection: 'bookings', id: b.id })).whatsappStatus).toBe(
      'read',
    )
  })
})

describe('endpoints', () => {
  it('webhook needs the secret token, then applies Gupshup receipts', async () => {
    const b = await newBooking('Webhook')
    await dispatchBookingAlert(payload, b.id, { customerCopy: false })
    const [owner] = await logsFor(b.id)
    const event = {
      type: 'message-event',
      payload: { id: owner!.providerMessageId, type: 'delivered' },
    }
    vi.stubEnv('WHATSAPP_WEBHOOK_SECRET', 'hook-secret')
    try {
      const url = 'http://localhost/api/webhooks/whatsapp/gupshup'
      expect((await call(whatsappWebhook, `${url}?token=wrong`, { body: event })).status).toBe(401)
      const ok = await call(whatsappWebhook, `${url}?token=hook-secret`, { body: event })
      expect(ok.status).toBe(200)
      expect(await ok.json()).toMatchObject({ applied: 1 })
    } finally {
      vi.unstubAllEnvs()
    }
  })

  it('the retry cron endpoint needs CRON_SECRET', async () => {
    vi.stubEnv('CRON_SECRET', 'cron-secret')
    try {
      const url = 'http://localhost/api/whatsapp/process'
      expect((await call(whatsappProcess, url)).status).toBe(401)
      expect((await call(whatsappProcess, url, { auth: 'Bearer nope' })).status).toBe(401)
      const ok = await call(whatsappProcess, url, { auth: 'Bearer cron-secret' })
      expect(ok.status).toBe(200)
    } finally {
      vi.unstubAllEnvs()
    }
  })

  it('"Send test message" sends to the primary recipient and marks the connection', async () => {
    const r = await sendTestMessage(payload)
    expect(r).toEqual({ ok: true, to: 'Owner' })
    const s = await payload.findGlobal({ slug: 'whatsappSettings', overrideAccess: true })
    expect(s.connectionStatus).toBe('connected')
  })
})
