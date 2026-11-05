import { describe, expect, it } from 'vitest'

import { parseBooking, quoteBooking, stepErrors, todayInIndia } from '@/lib/booking'
import { sendingAdapter, webhookAdapter } from '@/lib/whatsapp/adapters'
import {
  bookingVariables,
  orderedParams,
  renderBookingMessage,
  formatTripMonth,
} from '@/lib/whatsapp/messages'
import { acceptsUpdate, combineStatuses, MAX_ATTEMPTS, nextAttemptAt } from '@/lib/whatsapp/status'
import { webhookTokenMatches } from '@/lib/whatsapp/webhook'

const TODAY = '2026-11-05'
const valid = {
  packageSlug: 'goa-beach-escape',
  travelDate: '2026-12-18',
  departureCity: 'Ranchi',
  hotel: 'deluxe4',
  rooms: '1',
  adults: '2',
  children: '1',
  addOns: ['Water sports combo'],
  name: 'Ankit Kumar',
  whatsapp: '+91 98301 22457',
  email: '',
  consent: true,
}

describe('booking validation', () => {
  it('accepts a complete request and normalises it', () => {
    const r = parseBooking(valid, TODAY)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.data).toMatchObject({ rooms: 1, adults: 2, children: 1, whatsapp: '9830122457' })
      expect(r.data.email).toBeUndefined()
    }
  })

  it('rejects past dates, more than two years ahead, and bad counts', () => {
    const errs = (patch: object) => {
      const r = parseBooking({ ...valid, ...patch }, TODAY)
      return r.ok ? {} : r.errors
    }
    expect(errs({ travelDate: '2026-11-04' }).travelDate).toMatch(/today/)
    expect(errs({ travelDate: '2028-11-06' }).travelDate).toMatch(/two years/)
    expect(errs({ travelDate: '' }).travelDate).toBe('Please choose a travel date')
    expect(errs({ adults: '0' }).adults).toBeTruthy()
    expect(errs({ adults: '10' }).adults).toBeTruthy()
    expect(errs({ children: '7' }).children).toBeTruthy()
    expect(errs({ hotel: 'palace7' }).hotel).toBeTruthy()
    expect(errs({ rooms: '3', adults: '2' }).rooms).toBe('Each room needs at least one adult')
  })

  it('needs consent and a valid number', () => {
    const r = parseBooking({ ...valid, consent: false, whatsapp: '12345' }, TODAY)
    expect(!r.ok && Object.keys(r.errors).sort()).toEqual(['consent', 'whatsapp'])
  })

  it('checks one step at a time', () => {
    const blank = { packageSlug: 'x', hotel: 'deluxe4', rooms: 1, adults: 2, children: 0 }
    expect(Object.keys(stepErrors(blank, 1, TODAY))).toEqual(['travelDate'])
    expect(Object.keys(stepErrors({ ...blank, travelDate: '2026-12-01' }, 1, TODAY))).toEqual([])
    expect(Object.keys(stepErrors(blank, 2, TODAY)).sort()).toEqual(['consent', 'name', 'whatsapp'])
  })

  it('knows today in India', () => {
    // 20:00 UTC on 4 Nov is already 5 Nov in IST.
    expect(todayInIndia(new Date('2026-11-04T20:00:00Z'))).toBe('2026-11-05')
  })
})

describe('booking quote', () => {
  const pkg = {
    hotelOptions: [
      { category: 'standard3', price: 12499 },
      { category: 'deluxe4', price: 16999 },
    ],
    childPricePercent: 50,
    addOns: [
      { name: 'Water sports combo', price: 1800 },
      { name: 'Flight booking help', price: null },
    ],
  }

  it('prices travellers and add-ons from the package', () => {
    const q = quoteBooking(pkg, {
      hotel: 'deluxe4',
      adults: 2,
      children: 1,
      addOns: ['Water sports combo'],
    })
    expect(q).toEqual({
      adultPrice: 16999,
      addOns: [{ name: 'Water sports combo', price: 1800 }],
      total: 2 * 16999 + 8500 + 1800,
    })
  })

  it('drops unknown add-ons and refuses unknown hotels', () => {
    expect(
      quoteBooking(pkg, { hotel: 'deluxe4', adults: 1, children: 0, addOns: ['Free jet'] })?.addOns,
    ).toEqual([])
    expect(quoteBooking(pkg, { hotel: 'luxury5', adults: 1, children: 0, addOns: [] })).toBeNull()
  })
})

describe('WhatsApp messages', () => {
  const vars = bookingVariables({
    requestId: 'GT-24871',
    packageTitle: 'Goa Beach Escape',
    duration: '3N/4D',
    travelDate: '2026-12-18T12:00:00.000Z',
    departureCity: 'Ranchi',
    adults: 2,
    children: 0,
    hotelCategory: 'deluxe4',
    rooms: 1,
    name: 'Ankit Kumar',
    whatsapp: '9830122457',
    estimatedTotal: 33998,
    addOns: ['Flight booking help'],
    specialRequests: 'Vegetarian meals\nsea-facing room',
  })

  it('renders the booking alert exactly as the design', () => {
    expect(renderBookingMessage(vars)).toBe(
      [
        '*New Booking Request* · GT-24871',
        'Package: Goa Beach Escape (3N/4D)',
        'Date: 18 Dec 2026 · From: Ranchi',
        'Travellers: 2 Adults',
        'Hotel: Deluxe 4★ · 1 room',
        'Name: Ankit Kumar',
        'WhatsApp: +91 98301 22457',
        'Est. total: ₹33,998',
        'Notes: Add-ons: Flight booking help. Vegetarian meals\nsea-facing room',
      ].join('\n'),
    )
  })

  it('orders template values and keeps each on one line', () => {
    const params = orderedParams('booking', vars)
    expect(params).toHaveLength(11)
    expect(params[0]).toBe('GT-24871')
    expect(params[10]).toBe('Add-ons: Flight booking help. Vegetarian meals sea-facing room')
    expect(orderedParams('booking', {}).every((p) => p === '—')).toBe(true)
  })

  it('formats months', () => {
    expect(formatTripMonth('2027-02')).toBe('February 2027')
    expect(formatTripMonth(null)).toBe('—')
  })
})

describe('delivery status rules', () => {
  it('combines team alerts: the best status wins, Failed only when all failed', () => {
    expect(combineStatuses([])).toBe('notSent')
    expect(combineStatuses(['failed', 'sent'])).toBe('sent')
    expect(combineStatuses(['queued', 'failed'])).toBe('queued')
    expect(combineStatuses(['delivered', 'read', 'failed'])).toBe('read')
    expect(combineStatuses(['failed', 'failed'])).toBe('failed')
  })

  it('only moves forward on receipts', () => {
    expect(acceptsUpdate('sent', 'delivered')).toBe(true)
    expect(acceptsUpdate('read', 'delivered')).toBe(false)
    expect(acceptsUpdate('sent', 'failed')).toBe(true)
    expect(acceptsUpdate('delivered', 'failed')).toBe(false)
    expect(acceptsUpdate('failed', 'read')).toBe(false)
  })

  it('backs off 1, 5, 15 minutes and stops after four tries', () => {
    const now = new Date('2026-11-05T10:00:00Z')
    const wait = (n: number) => (nextAttemptAt(n, true, now)!.getTime() - now.getTime()) / 60_000
    expect([wait(1), wait(2), wait(3)]).toEqual([1, 5, 15])
    expect(nextAttemptAt(MAX_ATTEMPTS, true, now)).toBeNull()
    expect(nextAttemptAt(1, false, now)).toBeNull()
  })
})

describe('WhatsApp adapters', () => {
  it('uses the console without a key outside production, and refuses in production', async () => {
    expect(sendingAdapter('gupshup', null, { NODE_ENV: 'development' }).id).toBe('console')
    const prod = sendingAdapter('gupshup', null, { NODE_ENV: 'production' })
    await expect(
      prod.send({ to: '91', template: { name: '', language: 'en' }, params: [], text: '' }),
    ).rejects.toThrow(/not connected/)
    const cfg = { apiKey: 'k', sender: '919876543210' }
    expect(sendingAdapter('gupshup', cfg, { NODE_ENV: 'production' }).id).toBe('gupshup')
    expect(sendingAdapter('interakt', cfg, { NODE_ENV: 'production' }).id).toBe('interakt')
    expect(sendingAdapter('wati', cfg, { NODE_ENV: 'production' }).id).toBe('unavailable')
    expect(sendingAdapter('gupshup', cfg, { WHATSAPP_ADAPTER: 'console' }).id).toBe('console')
  })

  it('reads Gupshup and Interakt receipts', () => {
    expect(
      webhookAdapter('gupshup')!.parseWebhook({
        type: 'message-event',
        payload: { id: 'g1', type: 'failed', payload: { reason: 'Number not on WhatsApp' } },
      }),
    ).toEqual([{ providerMessageId: 'g1', status: 'failed', error: 'Number not on WhatsApp' }])
    expect(
      webhookAdapter('gupshup')!.parseWebhook({
        type: 'message-event',
        payload: { id: 'g1', type: 'enqueued' },
      }),
    ).toEqual([])
    expect(
      webhookAdapter('interakt')!.parseWebhook({
        type: 'message_api_read',
        data: { message: { id: 'i1' } },
      }),
    ).toEqual([{ providerMessageId: 'i1', status: 'read' }])
    expect(webhookAdapter('interakt')!.parseWebhook({ type: 'something_else' })).toEqual([])
    expect(webhookAdapter('wati')).toBeNull()
  })

  it('checks the webhook token', () => {
    expect(webhookTokenMatches('abc', 'abc')).toBe(true)
    expect(webhookTokenMatches('abd', 'abc')).toBe(false)
    expect(webhookTokenMatches('abc', undefined)).toBe(false)
    expect(webhookTokenMatches(null, 'abc')).toBe(false)
  })
})
