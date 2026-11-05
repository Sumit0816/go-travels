import { describe, expect, it } from 'vitest'

import { buildContact, buildFooterLinks, buildHeaderNav } from '@/components/site/data'
import { initials, toPackageCard } from '@/lib/cms'
import { hrefFor, isActive, telHref, whatsappHref } from '@/lib/site/links'
import { firstImage, pickImage } from '@/lib/site/media'
import type { Navigation, Package, SiteSetting } from '@/payload-types'

describe('CMS links', () => {
  it('maps each link type to its site route', () => {
    expect(hrefFor({ linkType: 'category', category: { slug: 'domestic' } })).toBe(
      '/tours/domestic',
    )
    expect(hrefFor({ linkType: 'destination', destination: { slug: 'goa' } })).toBe(
      '/destinations/goa',
    )
    expect(hrefFor({ linkType: 'package', package: { slug: 'goa-beach-escape' } })).toBe(
      '/packages/goa-beach-escape',
    )
    expect(hrefFor({ linkType: 'page', page: { slug: 'about' } })).toBe('/about')
    expect(hrefFor({ linkType: 'custom', url: '/blog' })).toBe('/blog')
    expect(hrefFor({ linkType: 'custom', url: 'https://instagram.com/gotravels' })).toBe(
      'https://instagram.com/gotravels',
    )
  })

  it('drops missing targets and unsafe URLs', () => {
    expect(hrefFor({ linkType: 'category', category: 12 })).toBeNull() // not populated / unpublished
    expect(hrefFor({ linkType: 'custom', url: 'javascript:alert(1)' })).toBeNull()
    expect(hrefFor({ linkType: 'custom', url: '//evil.example' })).toBeNull()
    expect(hrefFor({ linkType: 'custom', url: '' })).toBeNull()
    expect(hrefFor(null)).toBeNull()
  })

  it('marks sections active', () => {
    expect(isActive('/', '/')).toBe(true)
    expect(isActive('/', '/tours')).toBe(false)
    expect(isActive('/tours/domestic', '/tours/domestic')).toBe(true)
    expect(isActive('/blog', '/blog/best-time-to-visit-goa')).toBe(true)
    expect(isActive('/tours', '/tours-x')).toBe(false)
  })

  it('builds WhatsApp and phone links', () => {
    expect(whatsappHref('+91 98765 43210', 'Hi')).toBe('https://wa.me/919876543210?text=Hi')
    expect(whatsappHref('98765 43210')).toBe('https://wa.me/919876543210')
    expect(whatsappHref('')).toBeNull()
    expect(telHref('+91 98765 43210')).toBe('tel:+919876543210')
    expect(telHref(null)).toBeNull()
  })
})

describe('media', () => {
  const media = {
    url: '/api/media/file/goa.webp',
    alt: 'Baga beach',
    width: 2400,
    height: 1600,
    focalX: 30,
    focalY: 70,
    sizes: { card: { url: '/api/media/file/goa-800x600.webp', width: 800, height: 600 } },
  }

  it('picks the requested size with the focal point', () => {
    expect(pickImage(media, 'card')).toEqual({
      src: '/api/media/file/goa-800x600.webp',
      alt: 'Baga beach',
      width: 800,
      height: 600,
      position: '30% 70%',
    })
  })

  it('falls back to the original and ignores unpopulated IDs', () => {
    expect(pickImage(media, 'hero')?.src).toBe('/api/media/file/goa.webp')
    expect(pickImage(5, 'card')).toBeNull()
    expect(firstImage([7, media], 'card')?.alt).toBe('Baga beach')
    expect(firstImage(undefined, 'card')).toBeNull()
  })
})

describe('navigation model', () => {
  const nav = {
    header: [
      { label: 'Home', linkType: 'custom', url: '/' },
      {
        label: 'Domestic Tours',
        linkType: 'category',
        category: { slug: 'domestic' },
        megaMenu: [
          {
            heading: 'Jharkhand',
            links: [
              { label: 'Deoghar', linkType: 'destination', destination: { slug: 'deoghar' } },
            ],
          },
          {
            heading: 'Empty',
            links: [{ label: 'Gone', linkType: 'destination', destination: 99 }],
          },
        ],
        featuredPackage: {
          slug: 'goa-beach-escape',
          title: 'Goa Beach Escape',
          durationNights: 3,
          durationDays: 4,
          startingPrice: 12499,
          destination: { tone: 'coast' },
          gallery: [],
        },
      },
      { label: 'Broken', linkType: 'category', category: 3 },
    ],
    footerQuickLinks: [{ label: 'Blog', linkType: 'custom', url: '/blog' }],
  } as unknown as Navigation

  it('builds header entries with mega menus and drops broken links', () => {
    const entries = buildHeaderNav(nav)
    expect(entries.map((e) => e.label)).toEqual(['Home', 'Domestic Tours'])
    const mega = entries[1].mega!
    expect(mega.columns).toEqual([
      { heading: 'Jharkhand', links: [{ label: 'Deoghar', href: '/destinations/deoghar' }] },
    ])
    expect(mega.featured).toMatchObject({
      href: '/packages/goa-beach-escape',
      meta: '3N / 4D · from ₹12,499',
    })
    expect(mega.viewAll).toEqual({ label: 'View all domestic tours →', href: '/tours/domestic' })
  })

  it('builds footer links and contact info', () => {
    expect(buildFooterLinks(nav.footerQuickLinks)).toEqual([{ label: 'Blog', href: '/blog' }])
    const contact = buildContact({
      phones: [{ number: '+91 98765 43210' }],
      whatsapp: '+91 98765 43210',
      email: 'hello@gotravels.in',
      workingHours: 'Mon – Sat',
    } as SiteSetting)
    expect(contact.phoneHref).toBe('tel:+919876543210')
    expect(contact.whatsappHref).toContain('https://wa.me/919876543210?text=')
    expect(buildContact(null).whatsappHref).toBeNull()
  })
})

describe('package card model', () => {
  it('uses the badge, else the first category, and the destination tone', () => {
    const pkg = {
      id: 1,
      slug: 'romantic-bali',
      title: 'Romantic Bali',
      durationNights: 5,
      durationDays: 6,
      startingPrice: 46499,
      badge: 'none',
      cardInclusions: 'Villa · Candlelight dinner',
      destination: { id: 9, name: 'Bali', tone: 'romance' },
      categories: [{ name: 'Honeymoon Tours' }],
    } as unknown as Package
    expect(toPackageCard(pkg, null)).toMatchObject({
      href: '/packages/romantic-bali',
      place: 'Bali',
      tag: 'Honeymoon',
      tone: 'romance',
      price: 46499,
      destinationId: 9,
    })
    expect(toPackageCard({ ...pkg, badge: 'bestseller' }, null).tag).toBe('Bestseller')
  })

  it('makes initials for review avatars', () => {
    expect(initials('Ritika Sharma')).toBe('RS')
    expect(initials('Aditi & Karan')).toBe('AK')
  })
})
