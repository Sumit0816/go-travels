/**
 * Public-site data access. Every query runs as an anonymous visitor (overrideAccess: false,
 * no user), so the CMS read rules decide what is public — drafts, hidden slides and pending
 * reviews never leak. Results are cached under the tags the CMS hooks invalidate on publish.
 */
import { unstable_cache } from 'next/cache'
import { getPayload, type Where } from 'payload'

import config from '@payload-config'
import { CACHE_TAGS } from '@/lib/revalidate'
import type { Category, Destination, Package, Testimonial } from '@/payload-types'

import { liveSlidesWhere } from '@/collections/Slides'

/** Fallback refresh for anything time-based (slide schedules) even without a publish. */
const REVALIDATE_SECONDS = 600

export const payloadClient = () => getPayload({ config })

const cached = <A extends unknown[], R>(
  key: string,
  tags: string[],
  fn: (...args: A) => Promise<R>,
) => unstable_cache(fn, [key], { tags, revalidate: REVALIDATE_SECONDS })

const anon = { overrideAccess: false } as const

export const getSiteSettings = cached(
  'site-settings',
  [CACHE_TAGS.global('siteSettings')],
  async () => {
    const payload = await payloadClient()
    return payload.findGlobal({ slug: 'siteSettings', depth: 1, ...anon })
  },
)

export const getNavigation = cached(
  'navigation',
  [
    CACHE_TAGS.global('navigation'),
    CACHE_TAGS.categories,
    CACHE_TAGS.destinations,
    CACHE_TAGS.packages,
  ],
  async () => {
    const payload = await payloadClient()
    return payload.findGlobal({ slug: 'navigation', depth: 2, ...anon })
  },
)

export const getHomepage = cached(
  'homepage',
  [CACHE_TAGS.global('homepage'), CACHE_TAGS.destinations],
  async () => {
    const payload = await payloadClient()
    return payload.findGlobal({ slug: 'homepage', depth: 1, ...anon })
  },
)

export const getLiveSlides = cached(
  'slides-live',
  [CACHE_TAGS.slides, CACHE_TAGS.media],
  async () => {
    const payload = await payloadClient()
    const { docs } = await payload.find({
      collection: 'slides',
      where: liveSlidesWhere(),
      sort: '_order',
      depth: 1,
      limit: 8,
      ...anon,
    })
    return docs
  },
)

export const getHomeCategories = cached('home-categories', [CACHE_TAGS.categories], async () => {
  const payload = await payloadClient()
  const { docs } = await payload.find({
    collection: 'categories',
    where: { showOnHome: { equals: true } },
    sort: '_order',
    depth: 0,
    limit: 12,
    ...anon,
  })
  return docs
})

/** Published packages for the homepage tabs: popular ones plus those in the tab destinations. */
export const getHomePackages = cached(
  'home-packages',
  [CACHE_TAGS.packages, CACHE_TAGS.destinations, CACHE_TAGS.media],
  async (destinationIds: number[]) => {
    const payload = await payloadClient()
    const or: Where[] = [{ showInPopular: { equals: true } }]
    if (destinationIds.length) or.push({ destination: { in: destinationIds } })
    const { docs } = await payload.find({
      collection: 'packages',
      where: { or },
      sort: 'startingPrice',
      depth: 1,
      limit: 60,
      ...anon,
    })
    return docs
  },
)

export const getApprovedTestimonials = cached(
  'testimonials-approved',
  [CACHE_TAGS.testimonials],
  async () => {
    const payload = await payloadClient()
    const { docs } = await payload.find({
      collection: 'testimonials',
      sort: '-createdAt',
      depth: 0,
      limit: 9,
      ...anon,
    })
    return docs
  },
)

// ---- View models ----

const BADGE_LABELS: Record<string, string> = {
  bestseller: 'Bestseller',
  new: 'New',
  limitedOffer: 'Limited offer',
}

export type PackageCardData = {
  id: number
  href: string
  title: string
  place: string
  nights: number
  days: number
  inclusions?: string
  price: number
  tag?: string
  tone: NonNullable<Destination['tone']>
  destinationId: number | null
  image: { src: string; alt: string } | null
}

/** Everything a PackageCard needs, from a package fetched with depth ≥ 1. */
export function toPackageCard(pkg: Package, image: PackageCardData['image']): PackageCardData {
  const dest = typeof pkg.destination === 'object' ? pkg.destination : null
  const firstCategory = pkg.categories?.find((c): c is Category => typeof c === 'object')
  return {
    id: pkg.id,
    href: `/packages/${pkg.slug}`,
    title: pkg.title,
    place: dest?.name ?? '',
    nights: pkg.durationNights,
    days: pkg.durationDays ?? pkg.durationNights + 1,
    inclusions: pkg.cardInclusions ?? undefined,
    price: pkg.startingPrice ?? 0,
    tag: (pkg.badge && BADGE_LABELS[pkg.badge]) || firstCategory?.name.replace(/ Tours$/, ''),
    tone: dest?.tone ?? 'coast',
    destinationId: dest?.id ?? (typeof pkg.destination === 'number' ? pkg.destination : null),
    image,
  }
}

export const initials = (name: string) =>
  name
    .split(/[\s&]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('')

export type { Testimonial }
