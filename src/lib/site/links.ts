/**
 * Turns CMS link fields (category / destination / package / page / custom URL) into site paths.
 * Pure functions, unit-tested; relationship values may be populated docs or bare IDs.
 */

type Rel = { slug?: string | null } | number | string | null | undefined

export type CmsLink = {
  linkType?: string | null
  category?: Rel
  destination?: Rel
  package?: Rel
  page?: Rel
  url?: string | null
}

const slugOf = (rel: Rel): string | null =>
  rel && typeof rel === 'object' && rel.slug ? rel.slug : null

/** Site routes. Content pages live at the root (/about, /contact, /privacy, /terms). */
export const routes = {
  home: '/',
  tours: '/tours',
  category: (slug: string) => `/tours/${slug}`,
  destination: (slug: string) => `/destinations/${slug}`,
  package: (slug: string) => `/packages/${slug}`,
  book: (slug: string) => `/packages/${slug}/book`,
  page: (slug: string) => `/${slug}`,
  blog: '/blog',
  post: (slug: string) => `/blog/${slug}`,
  planMyTrip: '/plan-my-trip',
  contact: '/contact',
  privacy: '/privacy',
  terms: '/terms',
} as const

/** The href for a CMS link, or null when its target is missing or unpublished. */
export function hrefFor(link: CmsLink | null | undefined): string | null {
  if (!link) return null
  switch (link.linkType) {
    case 'category': {
      const s = slugOf(link.category)
      return s ? routes.category(s) : null
    }
    case 'destination': {
      const s = slugOf(link.destination)
      return s ? routes.destination(s) : null
    }
    case 'package': {
      const s = slugOf(link.package)
      return s ? routes.package(s) : null
    }
    case 'page': {
      const s = slugOf(link.page)
      return s ? routes.page(s) : null
    }
    default: {
      const url = link.url?.trim()
      if (!url) return null
      // Only site paths and http(s) links; never javascript: or other schemes.
      if (url.startsWith('/') && !url.startsWith('//')) return url
      if (/^https?:\/\//i.test(url)) return url
      return null
    }
  }
}

export const isExternal = (href: string) => /^https?:\/\//i.test(href)

/** True when `href` is the current page or a parent section of it. */
export function isActive(href: string, pathname: string): boolean {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

/** WhatsApp chat link for the public number, with an optional prefilled message. */
export function whatsappHref(number: string | null | undefined, text?: string): string | null {
  const digits = (number ?? '').replace(/\D/g, '')
  if (digits.length < 10) return null
  const full = digits.length === 10 ? `91${digits}` : digits
  return `https://wa.me/${full}${text ? `?text=${encodeURIComponent(text)}` : ''}`
}

/** tel: link with spaces removed. */
export function telHref(number: string | null | undefined): string | null {
  const cleaned = (number ?? '').replace(/[^\d+]/g, '')
  return cleaned.length >= 10 ? `tel:${cleaned}` : null
}
