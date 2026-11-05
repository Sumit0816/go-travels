import Link from 'next/link'

import { PackageCard } from '@/components/ui/PackageCard'
import {
  findListingPackages,
  getAllDestinations,
  getDestinationCounts,
  toPackageCard,
} from '@/lib/cms'
import { DURATION_BUCKETS, PACKAGE_THEMES } from '@/lib/catalog'
import { firstImage } from '@/lib/site/media'
import {
  activeFilterCount,
  BUDGET_MAX,
  BUDGET_MIN,
  buildPackageWhere,
  listingQuery,
  listingSummary,
  PAGE_SIZE,
  SORTS,
  sortFor,
  type ListingParams,
} from '@/lib/tours'
import type { Category } from '@/payload-types'

import { BudgetRange, FilterPanel, SortSelect } from './FilterPanel'

/**
 * Results area of a tour listing: filters, sort, active-filter chips, cards, pagination and
 * the "Didn't find your dream trip?" band (design: "Desktop · Tour listing", "Mobile · Tour listing").
 */
export async function ListingView({
  params,
  basePath,
  category,
}: {
  params: ListingParams
  basePath: string
  category: Category | null
}) {
  const [destinations, counts] = await Promise.all([
    getAllDestinations(),
    getDestinationCounts(category?.id),
  ])
  const bySlug = Object.fromEntries(destinations.map((d) => [d.slug!, d]))
  const names = Object.fromEntries(destinations.map((d) => [d.slug!, d.name]))
  const destinationIds = params.destinations
    .map((s) => bySlug[s]?.id)
    .filter((id): id is number => !!id)

  // An unknown destination slug matches nothing, rather than silently showing everything.
  const unknownDestination = params.destinations.length > 0 && destinationIds.length === 0
  const where = unknownDestination
    ? { id: { equals: -1 } }
    : buildPackageWhere(params, { categoryId: category?.id, destinationIds })
  const result = await findListingPackages(where, sortFor(params.sort), params.page, PAGE_SIZE)

  // Sidebar destinations: those with packages in this category, most packages first.
  const filterDestinations = destinations
    .filter((d) => counts[d.id] || params.destinations.includes(d.slug!))
    .sort((a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0))

  const href = (change: Partial<ListingParams>) => `${basePath}${listingQuery(params, change)}`
  const summary = listingSummary(params, names)
  const active = activeFilterCount(params)

  const chips = [
    ...params.destinations.map((s) => ({
      label: names[s] ?? s,
      href: href({ destinations: params.destinations.filter((x) => x !== s) }),
    })),
    ...(params.duration
      ? [{ label: `${params.duration.replace('-', '–')} N`, href: href({ duration: undefined }) }]
      : []),
    ...(params.budget
      ? [
          {
            label: `Up to ₹${params.budget.toLocaleString('en-IN')}`,
            href: href({ budget: undefined }),
          },
        ]
      : []),
    ...params.themes.map((t) => ({
      label: PACKAGE_THEMES.find((x) => x.value === t)?.label ?? t,
      href: href({ themes: params.themes.filter((x) => x !== t) }),
    })),
    ...(params.q ? [{ label: `“${params.q}”`, href: href({ q: undefined }) }] : []),
  ]

  const firstShown = (result.page! - 1) * PAGE_SIZE + 1
  const lastShown = firstShown + result.docs.length - 1

  return (
    <div className="container-site grid gap-8 py-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:py-12">
      <FilterPanel activeCount={active}>
        <form action={basePath} method="get" className="gt-filters" aria-label="Filter packages">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-[18px] font-bold max-lg:sr-only">Filters</h2>
            {active > 0 && (
              <Link href={basePath} className="text-body-sm font-semibold">
                Clear all
              </Link>
            )}
          </div>
          {params.q && <input type="hidden" name="q" value={params.q} />}
          {params.sort !== 'popular' && <input type="hidden" name="sort" value={params.sort} />}
          {params.month && <input type="hidden" name="month" value={params.month} />}

          {filterDestinations.length > 0 && (
            <fieldset className="gt-filters__group">
              <legend>Destination</legend>
              {filterDestinations.map((d) => (
                <label key={d.id} className="gt-filters__check">
                  <input
                    type="checkbox"
                    name="destination"
                    value={d.slug!}
                    defaultChecked={params.destinations.includes(d.slug!)}
                  />
                  <span className="flex-1">{d.name}</span>
                  <span className="text-caption text-ink-500">{counts[d.id] ?? 0}</span>
                </label>
              ))}
            </fieldset>
          )}

          <fieldset className="gt-filters__group">
            <legend>Duration</legend>
            <div className="flex flex-wrap gap-2">
              {DURATION_BUCKETS.map((b) => (
                <label key={b.value} className="gt-filters__pill">
                  <input
                    type="radio"
                    name="duration"
                    value={b.value}
                    defaultChecked={params.duration === b.value}
                  />
                  <span>{b.label}</span>
                </label>
              ))}
              <label className="gt-filters__pill">
                <input type="radio" name="duration" value="" defaultChecked={!params.duration} />
                <span>Any</span>
              </label>
            </div>
          </fieldset>

          <fieldset className="gt-filters__group">
            <legend>Budget per person</legend>
            <BudgetRange
              min={BUDGET_MIN}
              max={BUDGET_MAX}
              step={5000}
              defaultValue={params.budget}
            />
          </fieldset>

          <fieldset className="gt-filters__group">
            <legend>Theme</legend>
            <div className="flex flex-wrap gap-2">
              {PACKAGE_THEMES.filter((t) => t.value !== 'corporate').map((t) => (
                <label key={t.value} className="gt-filters__pill">
                  <input
                    type="checkbox"
                    name="theme"
                    value={t.value}
                    defaultChecked={params.themes.includes(t.value)}
                  />
                  <span>{t.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <button type="submit" className="gt-btn gt-btn--primary gt-btn--block">
            Apply filters
          </button>
        </form>
      </FilterPanel>

      <div className="flex min-w-0 flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="m-0 text-body-sm" aria-live="polite">
            <b>
              {result.totalDocs} package{result.totalDocs === 1 ? '' : 's'}
            </b>
            {summary && <span className="text-ink-500"> · {summary}</span>}
          </p>
          <form action={basePath} method="get">
            {params.q && <input type="hidden" name="q" value={params.q} />}
            {params.destinations.map((d) => (
              <input key={d} type="hidden" name="destination" value={d} />
            ))}
            {params.duration && <input type="hidden" name="duration" value={params.duration} />}
            {params.budget && <input type="hidden" name="budget" value={params.budget} />}
            {params.themes.map((t) => (
              <input key={t} type="hidden" name="theme" value={t} />
            ))}
            <SortSelect options={SORTS} value={params.sort} />
          </form>
        </div>

        {chips.length > 0 && (
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0" aria-label="Active filters">
            {chips.map((c) => (
              <li key={c.label}>
                <Link
                  href={c.href}
                  className="gt-filter-chip"
                  aria-label={`Remove filter ${c.label}`}
                >
                  {c.label} <span aria-hidden="true">×</span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {result.docs.length ? (
          <ul className="gt-card-grid gt-card-grid--listing m-0 list-none p-0">
            {result.docs.map((pkg) => {
              const img = firstImage(pkg.gallery, 'card')
              const card = toPackageCard(pkg, img && { src: img.src, alt: img.alt })
              return (
                <li key={pkg.id} className="flex">
                  <PackageCard
                    className="gt-card--row-mobile w-full"
                    href={card.href}
                    title={card.title}
                    place={card.place}
                    nights={card.nights}
                    days={card.days}
                    inclusions={pkg.cities ? `${pkg.cities}` : card.inclusions}
                    price={card.price}
                    tag={card.tag}
                    tone={card.tone}
                    imageUrl={card.image?.src}
                    imageAlt={card.image?.alt}
                    ctaLabel="View Details"
                  />
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="flex flex-col items-start gap-3 rounded-lg border border-line-200 p-8">
            <h2 className="heading-3">
              No packages match {summary ? `“${summary}”` : 'these filters'}
            </h2>
            <p className="m-0 text-ink-700">
              Try fewer filters — or let our experts build this trip for you.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href={basePath} className="gt-btn gt-btn--outline">
                Clear filters
              </Link>
              <Link href="/plan-my-trip" className="gt-btn gt-btn--accent">
                Request a custom trip
              </Link>
            </div>
          </div>
        )}

        {result.totalPages > 1 && (
          <nav aria-label="Pages" className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-body-sm text-ink-500">
              Showing {firstShown}–{lastShown} of {result.totalDocs}
            </span>
            <span className="flex gap-2">
              {result.hasPrevPage && (
                <Link
                  href={href({ page: params.page - 1 })}
                  className="gt-btn gt-btn--outline gt-btn--icon"
                  aria-label="Previous page"
                  rel="prev"
                >
                  ‹
                </Link>
              )}
              {Array.from({ length: result.totalPages }, (_, i) => i + 1).map((n) => (
                <Link
                  key={n}
                  href={href({ page: n })}
                  className={`gt-btn gt-btn--icon ${n === result.page ? 'gt-btn--primary' : 'gt-btn--outline'}`}
                  aria-current={n === result.page ? 'page' : undefined}
                  aria-label={`Page ${n}`}
                >
                  {n}
                </Link>
              ))}
              {result.hasNextPage && (
                <Link
                  href={href({ page: params.page + 1 })}
                  className="gt-btn gt-btn--outline gt-btn--icon"
                  aria-label="Next page"
                  rel="next"
                >
                  ›
                </Link>
              )}
            </span>
          </nav>
        )}

        <section
          className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-sand-100 p-6 md:p-8"
          aria-labelledby="custom-trip-title"
        >
          <div className="flex flex-col gap-1">
            <h2 id="custom-trip-title" className="font-display text-[20px] font-bold">
              Didn&apos;t find your dream trip?
            </h2>
            <p className="m-0 text-ink-700">
              We&apos;ll build a custom{' '}
              {category ? category.name.replace(/ Tours$/, '').toLowerCase() : ''} itinerary for you
              and send it on WhatsApp.
            </p>
          </div>
          <Link href="/plan-my-trip" className="gt-btn gt-btn--accent">
            Find Your Perfect Trip
          </Link>
        </section>
      </div>
    </div>
  )
}
