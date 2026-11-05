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

// ---- Tour listings, destinations and packages (Phase 4b) ----

const TOUR_TAGS = [
  CACHE_TAGS.packages,
  CACHE_TAGS.destinations,
  CACHE_TAGS.categories,
  CACHE_TAGS.media,
]

export const getCategoryBySlug = cached(
  'category-by-slug',
  [CACHE_TAGS.categories, CACHE_TAGS.destinations, CACHE_TAGS.media],
  async (slug: string) => {
    const payload = await payloadClient()
    const { docs } = await payload.find({
      collection: 'categories',
      where: { slug: { equals: slug } },
      depth: 1,
      limit: 1,
      ...anon,
    })
    return docs[0] ?? null
  },
)

/** Every destination (name, slug, page flag) — for filters, names and static params. */
export const getAllDestinations = cached(
  'destinations-all',
  [CACHE_TAGS.destinations],
  async () => {
    const payload = await payloadClient()
    const { docs } = await payload.find({
      collection: 'destinations',
      sort: 'name',
      depth: 0,
      limit: 200,
      select: { name: true, slug: true, hasPage: true, isInternational: true, region: true },
      ...anon,
    })
    return docs
  },
)

export const getAllCategories = cached('categories-all', [CACHE_TAGS.categories], async () => {
  const payload = await payloadClient()
  const { docs } = await payload.find({
    collection: 'categories',
    sort: '_order',
    depth: 0,
    limit: 50,
    select: { name: true, slug: true },
    ...anon,
  })
  return docs
})

/** One page of listing results. Arguments form the cache key, so each filtered view is cached. */
export const findListingPackages = cached(
  'listing-packages',
  TOUR_TAGS,
  async (where: Where, sort: string | string[], page: number, limit: number) => {
    const payload = await payloadClient()
    return payload.find({ collection: 'packages', where, sort, page, limit, depth: 1, ...anon })
  },
)

/** Package counts per destination within the current category (sidebar "Dubai 14"). */
export const getDestinationCounts = cached(
  'destination-counts',
  TOUR_TAGS,
  async (categoryId?: number) => {
    const payload = await payloadClient()
    const where: Where = categoryId ? { categories: { contains: categoryId } } : {}
    const { docs } = await payload.find({
      collection: 'packages',
      where,
      depth: 0,
      limit: 1000,
      pagination: false,
      select: { destination: true },
      ...anon,
    })
    const counts: Record<number, number> = {}
    for (const d of docs) {
      const id = typeof d.destination === 'object' ? d.destination?.id : d.destination
      if (id) counts[id] = (counts[id] ?? 0) + 1
    }
    return counts
  },
)

export const getDestinationBySlug = cached(
  'destination-by-slug',
  TOUR_TAGS,
  async (slug: string) => {
    const payload = await payloadClient()
    const { docs } = await payload.find({
      collection: 'destinations',
      where: { slug: { equals: slug } },
      depth: 1,
      limit: 1,
      ...anon,
    })
    return docs[0] ?? null
  },
)

export const getPackagesForDestination = cached(
  'packages-for-destination',
  TOUR_TAGS,
  async (destinationId: number) => {
    const payload = await payloadClient()
    const { docs } = await payload.find({
      collection: 'packages',
      where: { destination: { equals: destinationId } },
      sort: ['-showInPopular', 'startingPrice'],
      depth: 1,
      limit: 24,
      ...anon,
    })
    return docs
  },
)

export const getPackageBySlug = cached('package-by-slug', TOUR_TAGS, async (slug: string) => {
  const payload = await payloadClient()
  const { docs } = await payload.find({
    collection: 'packages',
    where: { slug: { equals: slug } },
    depth: 2,
    limit: 1,
    ...anon,
  })
  return docs[0] ?? null
})

/** Other packages in the same destination, then the same first category. */
export const getRelatedPackages = cached(
  'related-packages',
  TOUR_TAGS,
  async (packageId: number, destinationId: number | null, categoryId: number | null) => {
    const payload = await payloadClient()
    const or: Where[] = []
    if (destinationId) or.push({ destination: { equals: destinationId } })
    if (categoryId) or.push({ categories: { contains: categoryId } })
    if (!or.length) return []
    const { docs } = await payload.find({
      collection: 'packages',
      where: { and: [{ id: { not_equals: packageId } }, { or }] },
      sort: ['-showInPopular', 'startingPrice'],
      depth: 1,
      limit: 3,
      ...anon,
    })
    return docs
  },
)

/** Slugs for build-time pages. */
export const getPublishedPackageSlugs = cached('package-slugs', [CACHE_TAGS.packages], async () => {
  const payload = await payloadClient()
  const { docs } = await payload.find({
    collection: 'packages',
    depth: 0,
    limit: 1000,
    pagination: false,
    select: { slug: true },
    ...anon,
  })
  return docs.map((d) => d.slug).filter((s): s is string => !!s)
})

// ---- Content pages and blog (Phase 4c) ----

export const getPageBySlug = cached(
  'page-by-slug',
  [CACHE_TAGS.pages, CACHE_TAGS.media],
  async (slug: string) => {
    const payload = await payloadClient()
    const { docs } = await payload.find({
      collection: 'pages',
      where: { slug: { equals: slug } },
      depth: 2,
      limit: 1,
      ...anon,
    })
    return docs[0] ?? null
  },
)

export const getPublishedPageSlugs = cached('page-slugs', [CACHE_TAGS.pages], async () => {
  const payload = await payloadClient()
  const { docs } = await payload.find({
    collection: 'pages',
    depth: 0,
    limit: 200,
    pagination: false,
    select: { slug: true, title: true, updatedAt: true },
    ...anon,
  })
  return docs
})

export const getPostCategories = cached('post-categories', [CACHE_TAGS.posts], async () => {
  const payload = await payloadClient()
  const { docs } = await payload.find({
    collection: 'postCategories',
    sort: 'name',
    depth: 0,
    limit: 50,
    ...anon,
  })
  return docs
})

export const findPosts = cached(
  'posts-list',
  [CACHE_TAGS.posts, CACHE_TAGS.media],
  async (where: Where, page: number, limit: number) => {
    const payload = await payloadClient()
    return payload.find({
      collection: 'posts',
      where,
      sort: '-publishedAt',
      page,
      limit,
      depth: 1,
      ...anon,
    })
  },
)

export const getPostBySlug = cached(
  'post-by-slug',
  [CACHE_TAGS.posts, CACHE_TAGS.packages, CACHE_TAGS.media],
  async (slug: string) => {
    const payload = await payloadClient()
    const { docs } = await payload.find({
      collection: 'posts',
      where: { slug: { equals: slug } },
      depth: 3,
      limit: 1,
      ...anon,
    })
    return docs[0] ?? null
  },
)

export const getRelatedPosts = cached(
  'related-posts',
  [CACHE_TAGS.posts, CACHE_TAGS.media],
  async (postId: number, categoryId: number | null) => {
    const payload = await payloadClient()
    const base: Where = { id: { not_equals: postId } }
    const pick = async (where: Where, limit: number) =>
      (
        await payload.find({
          collection: 'posts',
          where,
          sort: '-publishedAt',
          depth: 1,
          limit,
          ...anon,
        })
      ).docs
    const same = categoryId
      ? await pick({ and: [base, { category: { equals: categoryId } }] }, 3)
      : []
    if (same.length >= 3) return same
    const more = await pick(
      { and: [base, { id: { not_in: same.map((p) => p.id) } }] },
      3 - same.length,
    )
    return [...same, ...more]
  },
)

export const getPublishedPostSlugs = cached('post-slugs', [CACHE_TAGS.posts], async () => {
  const payload = await payloadClient()
  const { docs } = await payload.find({
    collection: 'posts',
    depth: 0,
    limit: 1000,
    pagination: false,
    select: { slug: true, updatedAt: true },
    ...anon,
  })
  return docs
})

/** Everything the sitemap lists (published, public pages only). */
export const getSitemapEntries = cached(
  'sitemap',
  [...TOUR_TAGS, CACHE_TAGS.posts, CACHE_TAGS.pages],
  async () => {
    const payload = await payloadClient()
    const list = async (
      collection: 'packages' | 'destinations' | 'categories' | 'posts' | 'pages',
      extra: Where = {},
    ) =>
      (
        await payload.find({
          collection,
          where: extra,
          depth: 0,
          limit: 2000,
          pagination: false,
          select: { slug: true, updatedAt: true },
          ...anon,
        })
      ).docs as { slug?: string | null; updatedAt: string }[]
    const [packages, destinations, categories, posts, pages] = await Promise.all([
      list('packages'),
      list('destinations', { hasPage: { equals: true } }),
      list('categories'),
      list('posts'),
      list('pages'),
    ])
    return { packages, destinations, categories, posts, pages }
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
