/**
 * Tour listing filters (design: "Desktop · Tour listing"). The filter state lives entirely in
 * the URL (?destination=goa&duration=4-6&budget=50000&theme=family&sort=price-asc&page=2), so
 * every filtered view is shareable, bookmarkable and works without JavaScript.
 */
import type { Where } from 'payload'

import { DURATION_BUCKETS, PACKAGE_THEMES } from '@/lib/catalog'

export const SORTS = [
  { label: 'Popularity', value: 'popular' },
  { label: 'Price: low to high', value: 'price-asc' },
  { label: 'Price: high to low', value: 'price-desc' },
  { label: 'Duration', value: 'duration' },
] as const
export type SortValue = (typeof SORTS)[number]['value']

export const BUDGET_MIN = 5000
export const BUDGET_MAX = 150000
export const PAGE_SIZE = 12

export type ListingParams = {
  q?: string
  category?: string
  destinations: string[]
  duration?: (typeof DURATION_BUCKETS)[number]['value']
  budget?: number
  themes: string[]
  month?: string
  sort: SortValue
  page: number
}

type RawParams = Record<string, string | string[] | undefined>

const all = (v: string | string[] | undefined): string[] =>
  (Array.isArray(v) ? v : v ? [v] : [])
    .flatMap((x) => x.split(','))
    .map((x) => x.trim())
    .filter(Boolean)
const one = (v: string | string[] | undefined) => all(v)[0]
const SLUG = /^[a-z0-9-]{1,80}$/

/** Reads and validates the URL; anything unexpected is dropped rather than trusted. */
export function parseListingParams(raw: RawParams, category?: string): ListingParams {
  const q = one(raw.q)?.slice(0, 80)
  const duration = DURATION_BUCKETS.find((d) => d.value === one(raw.duration))?.value
  const budgetNum = Number(one(raw.budget))
  const themeValues = PACKAGE_THEMES.map((t) => t.value as string)
  const sort = (SORTS.find((s) => s.value === one(raw.sort))?.value ?? 'popular') as SortValue
  const page = Math.min(Math.max(1, Math.floor(Number(one(raw.page)) || 1)), 500)
  const month = one(raw.month)
  const cat = category ?? one(raw.category)
  return {
    q: q || undefined,
    category: cat && SLUG.test(cat) ? cat : undefined,
    destinations: [...new Set(all(raw.destination).filter((s) => SLUG.test(s)))].slice(0, 20),
    duration,
    budget:
      Number.isFinite(budgetNum) && budgetNum >= BUDGET_MIN && budgetNum < BUDGET_MAX
        ? Math.round(budgetNum)
        : undefined,
    themes: [...new Set(all(raw.theme).filter((t) => themeValues.includes(t)))],
    month: month && /^\d{4}-\d{2}$/.test(month) ? month : undefined,
    sort,
    page,
  }
}

/** Database filter for the listing. IDs are resolved from slugs by the caller. */
export function buildPackageWhere(
  p: ListingParams,
  ids: { categoryId?: number; destinationIds?: number[] } = {},
): Where {
  const and: Where[] = [{ status: { equals: 'published' } }]
  if (ids.categoryId) and.push({ categories: { contains: ids.categoryId } })
  if (ids.destinationIds?.length) and.push({ destination: { in: ids.destinationIds } })
  if (p.duration) {
    const b = DURATION_BUCKETS.find((d) => d.value === p.duration)!
    and.push(
      { durationNights: { greater_than_equal: b.min } },
      { durationNights: { less_than_equal: b.max } },
    )
  }
  if (p.budget) and.push({ startingPrice: { less_than_equal: p.budget } })
  if (p.themes.length) and.push({ themes: { in: p.themes } })
  if (p.q) {
    and.push({
      or: [
        { title: { like: p.q } },
        { cities: { like: p.q } },
        { 'destination.name': { like: p.q } },
        { tourCode: { like: p.q } },
      ],
    })
  }
  return { and }
}

export function sortFor(sort: SortValue): string | string[] {
  switch (sort) {
    case 'price-asc':
      return ['startingPrice', 'durationNights']
    case 'price-desc':
      return ['-startingPrice', 'durationNights']
    case 'duration':
      return ['durationNights', 'startingPrice']
    default:
      return ['-showInPopular', 'startingPrice']
  }
}

/** "Dubai, Thailand · 4–6 nights · Family" — what the visitor has filtered by. */
export function listingSummary(p: ListingParams, destinationNames: Record<string, string>): string {
  const parts: string[] = []
  const dests = p.destinations.map((s) => destinationNames[s]).filter(Boolean)
  if (dests.length) parts.push(dests.join(', '))
  if (p.duration) parts.push(`${p.duration.replace('-', '–')} nights`)
  if (p.budget) parts.push(`up to ₹${new Intl.NumberFormat('en-IN').format(p.budget)}`)
  if (p.themes.length) {
    parts.push(
      p.themes.map((t) => PACKAGE_THEMES.find((x) => x.value === t)?.label ?? t).join(', '),
    )
  }
  if (p.q) parts.push(`“${p.q}”`)
  return parts.join(' · ')
}

export function activeFilterCount(p: ListingParams): number {
  return (
    p.destinations.length +
    (p.duration ? 1 : 0) +
    (p.budget ? 1 : 0) +
    p.themes.length +
    (p.q ? 1 : 0)
  )
}

/** Query string for the listing with some values changed (page resets unless given). */
export function listingQuery(p: ListingParams, change: Partial<ListingParams> = {}): string {
  const next = { ...p, page: 1, ...change }
  const sp = new URLSearchParams()
  if (next.q) sp.set('q', next.q)
  for (const d of next.destinations) sp.append('destination', d)
  if (next.duration) sp.set('duration', next.duration)
  if (next.budget) sp.set('budget', String(next.budget))
  for (const t of next.themes) sp.append('theme', t)
  if (next.month) sp.set('month', next.month)
  if (next.sort !== 'popular') sp.set('sort', next.sort)
  if (next.page > 1) sp.set('page', String(next.page))
  const s = sp.toString()
  return s ? `?${s}` : ''
}
