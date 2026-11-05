import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { PageHero } from '@/components/site/PageHero'
import { ListingView } from '@/components/site/tours/ListingView'
import { getCategoryBySlug } from '@/lib/cms'
import { pickImage } from '@/lib/site/media'
import { listingQuery, parseListingParams } from '@/lib/tours'
import type { Destination } from '@/payload-types'

type Props = {
  params: Promise<{ category: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const title = (name: string) =>
  /tours$/i.test(name) ? name.replace(/tours$/i, 'Tour Packages') : `${name} Tour Packages`

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: slug } = await params
  const category = await getCategoryBySlug(slug)
  if (!category) return {}
  return {
    title: category.seo?.metaTitle || title(category.name),
    description:
      category.seo?.metaDescription ||
      category.intro ||
      `${title(category.name)} from Go Travels — handpicked hotels and tours, booking confirmed on WhatsApp.`,
    alternates: { canonical: `/tours/${slug}` },
  }
}

/** Category listing (design: "Desktop · Tour listing (category)"). */
export default async function CategoryPage({ params, searchParams }: Props) {
  const { category: slug } = await params
  const category = await getCategoryBySlug(slug)
  if (!category) notFound()

  const listing = parseListingParams(await searchParams, slug)
  const chips = (category.subDestinations ?? []).filter(
    (d): d is Destination => typeof d === 'object',
  )
  const hero = pickImage(category.heroImage, 'hero')

  return (
    <main>
      <PageHero
        crumbs={[{ label: 'Home', href: '/' }, { label: category.name }]}
        title={title(category.name)}
        intro={category.intro || category.subtitle}
        image={hero && { src: hero.src, position: hero.position }}
      >
        {chips.length > 0 && (
          <ul
            className="m-0 mt-2 flex list-none gap-2 overflow-x-auto p-0 pb-1 [scrollbar-width:none]"
            aria-label="Destinations"
          >
            {chips.map((d) => {
              const on = listing.destinations.includes(d.slug!)
              const next = on
                ? listing.destinations.filter((s) => s !== d.slug)
                : [...listing.destinations, d.slug!]
              return (
                <li key={d.id} className="shrink-0">
                  <Link
                    href={`/tours/${slug}${listingQuery(listing, { destinations: next })}`}
                    className="gt-hero-chip"
                    aria-current={on ? 'true' : undefined}
                  >
                    {d.name}
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </PageHero>
      <ListingView params={listing} basePath={`/tours/${slug}`} category={category} />
    </main>
  )
}
