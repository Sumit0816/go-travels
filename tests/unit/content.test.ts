import { describe, expect, it } from 'vitest'

import { headingId, plainText, readMinutes, tableOfContents, uniqueId } from '@/lib/blog'
import { contactSubjectDetails, parseEnquiry } from '@/lib/enquiry'
import { h2, h3, richText } from '@/lib/lexical'
import { createRateLimiter } from '@/lib/rate-limit'

describe('enquiry form validation', () => {
  const base = { form: 'tripFinder', name: 'Asha Kumari', whatsapp: '+91 98765 43210' }

  it('accepts a minimal trip-finder enquiry and normalises the number', () => {
    const r = parseEnquiry(base)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.data.whatsapp).toBe('9876543210')
  })

  it('keeps known options and drops unknown ones', () => {
    const r = parseEnquiry({
      ...base,
      tripType: 'honeymoon',
      budget: 'a-lot',
      travellers: '2-adults',
      travelMonth: 'next march',
      packageSlug: 'goa-beach',
    })
    expect(r.ok && r.data).toMatchObject({
      tripType: 'honeymoon',
      budget: undefined,
      travellers: '2-adults',
      travelMonth: undefined,
      packageSlug: 'goa-beach',
    })
  })

  it('treats empty optional fields as missing', () => {
    const r = parseEnquiry({ ...base, email: '', destination: '  ', message: '' })
    expect(r.ok && [r.data.email, r.data.destination, r.data.message]).toEqual([
      undefined,
      undefined,
      undefined,
    ])
  })

  it('reports field errors', () => {
    const r = parseEnquiry({ form: 'tripFinder', name: 'A', whatsapp: '12345', email: 'nope' })
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(Object.keys(r.errors).sort()).toEqual(['email', 'name', 'whatsapp'])
      expect(r.errors.whatsapp).toMatch(/10-digit/)
    }
  })

  it('rejects an unknown form and over-long text', () => {
    expect(parseEnquiry({ ...base, form: 'admin' }).ok).toBe(false)
    const r = parseEnquiry({ ...base, message: 'x'.repeat(2001) })
    expect(!r.ok && r.errors.message).toMatch(/2000/)
  })

  it('requires a message on the contact form', () => {
    const r = parseEnquiry({ ...base, form: 'contactForm', subject: 'tour' })
    expect(!r.ok && r.errors.message).toBeTruthy()
    expect(parseEnquiry({ ...base, form: 'contactForm', message: 'Hello' }).ok).toBe(true)
    const both = parseEnquiry({ ...base, form: 'contactForm', whatsapp: '123' })
    expect(!both.ok && Object.keys(both.errors).sort()).toEqual(['message', 'whatsapp'])
  })

  it('maps contact subjects to a trip type and prefix', () => {
    expect(contactSubjectDetails('mice')).toEqual({ tripType: 'mice', prefix: 'MICE / corporate' })
    expect(contactSubjectDetails(undefined).prefix).toBe('Tour enquiry')
  })
})

describe('rate limiter', () => {
  it('allows up to the limit inside the window, then blocks', () => {
    const rl = createRateLimiter({ limit: 2, windowMs: 1000 })
    expect(rl.check('a', 0)).toBe(true)
    expect(rl.check('a', 10)).toBe(true)
    expect(rl.check('a', 20)).toBe(false)
    expect(rl.check('b', 20)).toBe(true)
  })

  it('allows again once old hits leave the window', () => {
    const rl = createRateLimiter({ limit: 1, windowMs: 1000 })
    expect(rl.check('a', 0)).toBe(true)
    expect(rl.check('a', 999)).toBe(false)
    expect(rl.check('a', 1000)).toBe(true)
  })
})

describe('blog helpers', () => {
  const doc = richText(
    'Intro paragraph with five words.',
    h2('Day 1 · Hundru & Jonha'),
    'Body.',
    h3('Not in the list'),
    h2('Day 1 · Hundru & Jonha'),
    h2('Café stops'),
  )

  it('builds heading ids', () => {
    expect(headingId('Day 1 · Hundru & Jonha')).toBe('day-1-hundru-jonha')
    expect(headingId('Café stops')).toBe('cafe-stops')
    expect(headingId('★★★')).toBe('section')
  })

  it('lists h2 headings with unique ids', () => {
    expect(tableOfContents(doc)).toEqual([
      { id: 'day-1-hundru-jonha', text: 'Day 1 · Hundru & Jonha' },
      { id: 'day-1-hundru-jonha-2', text: 'Day 1 · Hundru & Jonha' },
      { id: 'cafe-stops', text: 'Café stops' },
    ])
    expect(tableOfContents(null)).toEqual([])
  })

  it('numbers repeated ids', () => {
    const seen = new Map<string, number>()
    expect([uniqueId('a', seen), uniqueId('a', seen), uniqueId('b', seen)]).toEqual([
      'a',
      'a-2',
      'b',
    ])
  })

  it('extracts text and estimates reading time', () => {
    expect(plainText(doc).split('\n')[0]).toBe('Intro paragraph with five words.')
    expect(readMinutes(doc)).toBe(1)
    expect(readMinutes(richText('word '.repeat(1000)))).toBe(5)
  })
})

describe('client IP for rate limiting', () => {
  const h = (init: Record<string, string>) => new Headers(init)
  it('prefers the proxy-set x-real-ip, then the last forwarded entry', async () => {
    const { clientIpFrom } = await import('@/lib/client-ip')
    expect(clientIpFrom(h({ 'x-real-ip': '1.1.1.1', 'x-forwarded-for': '6.6.6.6, 1.1.1.1' }))).toBe(
      '1.1.1.1',
    )
    // A visitor-supplied first entry is ignored.
    expect(clientIpFrom(h({ 'x-forwarded-for': '6.6.6.6, 2.2.2.2' }))).toBe('2.2.2.2')
    expect(clientIpFrom(h({}))).toBe('unknown')
  })
})
