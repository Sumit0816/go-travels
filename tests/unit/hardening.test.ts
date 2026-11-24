import { describe, expect, it } from 'vitest'

import { relativeMediaUrl, withRelativeMediaUrls } from '@/lib/media-url'
import { scrub, scrubEvent } from '@/lib/monitoring'
import { contentSecurityPolicy, securityHeaders } from '@/lib/security-headers'

describe('security headers', () => {
  it('locks down framing, plugins and form targets', () => {
    const csp = contentSecurityPolicy({ https: true })
    expect(csp).toContain("frame-ancestors 'none'")
    expect(csp).toContain("object-src 'none'")
    expect(csp).toContain("form-action 'self'")
    expect(csp).toContain("base-uri 'self'")
    expect(csp).toContain('upgrade-insecure-requests')
    expect(csp).not.toContain('unsafe-eval')
  })

  it('allows only Google Analytics as an outside script and the map as a frame', () => {
    const csp = contentSecurityPolicy()
    const scripts = csp.split('; ').find((d) => d.startsWith('script-src'))!
    expect(scripts.split(' ').filter((s) => s.startsWith('https:'))).toEqual([
      'https://www.googletagmanager.com',
    ])
    expect(csp).toContain('frame-src https://www.google.com https://maps.google.com')
  })

  it('adds HSTS and upgrades only on HTTPS, and eval only in development', () => {
    const keys = (h: { key: string }[]) => h.map((x) => x.key)
    expect(keys(securityHeaders({ https: true }))).toContain('Strict-Transport-Security')
    expect(keys(securityHeaders({ https: false }))).not.toContain('Strict-Transport-Security')
    expect(contentSecurityPolicy()).not.toContain('upgrade-insecure-requests')
    expect(contentSecurityPolicy({ dev: true })).toContain("'unsafe-eval'")
    expect(keys(securityHeaders())).toEqual(
      expect.arrayContaining(['X-Content-Type-Options', 'X-Frame-Options', 'Referrer-Policy']),
    )
  })
})

describe('media URLs', () => {
  it('serves uploads as paths whatever domain they were uploaded on', () => {
    expect(relativeMediaUrl('http://localhost:3000/api/media/file/a-800x600.webp')).toBe(
      '/api/media/file/a-800x600.webp',
    )
    expect(relativeMediaUrl('https://gotravels.in/api/media/file/a.webp')).toBe(
      '/api/media/file/a.webp',
    )
    expect(relativeMediaUrl('https://cdn.example.com/a.webp')).toBe(
      'https://cdn.example.com/a.webp',
    )
    expect(relativeMediaUrl(null)).toBeNull()
  })

  it('rewrites the original and every size', () => {
    const doc = withRelativeMediaUrls({
      url: 'http://x/api/media/file/a.webp',
      thumbnailURL: 'http://x/api/media/file/a-400x300.webp',
      sizes: { card: { url: 'http://x/api/media/file/a-800x600.webp' }, hero: { url: null } },
    })
    expect(doc).toEqual({
      url: '/api/media/file/a.webp',
      thumbnailURL: '/api/media/file/a-400x300.webp',
      sizes: { card: { url: '/api/media/file/a-800x600.webp' }, hero: { url: null } },
    })
  })
})

describe('error report scrubbing', () => {
  it('masks phone numbers and emails', () => {
    expect(scrub('"+91 98301 22457" is not a valid WhatsApp number')).toBe(
      '"[phone]" is not a valid WhatsApp number',
    )
    expect(scrub('mail ankit.k@example.com failed')).toBe('mail [email] failed')
    expect(scrub('GT-24871 failed after 4 attempts')).toBe('GT-24871 failed after 4 attempts')
  })

  it('strips request bodies and cookies from Sentry events', () => {
    const e = scrubEvent({
      type: undefined,
      message: 'call 9830122457',
      exception: { values: [{ value: 'to 919830122457' }] },
      request: { data: { name: 'A' }, cookies: { a: 'b' }, url: '/x' },
    })
    expect(e.message).toBe('call [phone]')
    expect(e.exception!.values![0]!.value).toBe('to [phone]')
    expect(e.request).toEqual({ url: '/x' })
  })
})

describe('spam trap', () => {
  it('only counts a non-empty trap field', async () => {
    const { SPAM_TRAP_FIELD, isSpamTrapFilled } = await import('@/lib/spam-trap')
    expect(isSpamTrapFilled({ [SPAM_TRAP_FIELD]: 'http://spam.example' })).toBe(true)
    expect(isSpamTrapFilled({ [SPAM_TRAP_FIELD]: '  ' })).toBe(false)
    // The old autofillable name is ignored.
    expect(isSpamTrapFilled({ website: 'https://gotravels.in' })).toBe(false)
    expect(SPAM_TRAP_FIELD).not.toMatch(/web|url|site|email|phone|name/i)
  })
})
