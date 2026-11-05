import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { PageHero } from '@/components/site/PageHero'
import { ListingView } from '@/components/site/tours/ListingView'
import { getAllCategories } from '@/lib/cms'
import { listingQuery, parseListingParams } from '@/lib/tours'

export const metadata: Metadata = {
  title: 'All Tour Packages',
  description:
    'Domestic, international, honeymoon, Jharkhand and religious tour packages — booking confirmed on WhatsApp, no online payment.',
  alternates: { canonical: '/tours' },
}

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

/** All tours, and the target of the homepage search widget. */
export default async function ToursPage({ searchParams }: Props) {
  const raw = await searchParams
  const params = parseListingParams(raw)

  // "Tour type" from the homepage search → that category's listing, keeping the other filters.
  if (params.category) {
    const categories = await getAllCategories()
    if (categories.some((c) => c.slug === params.category)) {
      redirect(`/tours/${params.category}${listingQuery({ ...params, category: undefined })}`)
    }
  }

  return (
    <main>
      <PageHero
        crumbs={[{ label: 'Home', href: '/' }, { label: 'All tours' }]}
        title={params.q ? `Tours matching “${params.q}”` : 'All Tour Packages'}
        intro="Handpicked domestic, international and pilgrimage tours. Every package can be customised — we confirm on WhatsApp."
      />
      <ListingView params={params} basePath="/tours" category={null} />
    </main>
  )
}
