import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Breadcrumbs } from '@/components/site/Breadcrumbs'
import { JsonLd } from '@/components/site/JsonLd'
import {
  BookingCard,
  BookingProvider,
  HotelPicker,
  MobileBookingBar,
  type HotelChoice,
} from '@/components/site/package/Booking'
import { Gallery, ShareActions, type GalleryImage } from '@/components/site/package/Gallery'
import { RichText } from '@/components/site/RichText'
import { buildContact } from '@/components/site/data'
import { PackageCard } from '@/components/ui/PackageCard'
import {
  getPackageBySlug,
  getPublishedPackageSlugs,
  getRelatedPackages,
  getSiteSettings,
  toPackageCard,
} from '@/lib/cms'
import { hotelCategoryLabel, PACKAGE_BADGES, PACKAGE_THEMES } from '@/lib/catalog'
import { plainText } from '@/lib/blog'
import { siteUrl, whatsappHref } from '@/lib/site/links'
import { firstImage, pickImage } from '@/lib/site/media'
import type { Category, Destination } from '@/payload-types'

export const revalidate = 600

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const slugs = await getPublishedPackageSlugs().catch(() => [])
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const pkg = await getPackageBySlug(slug)
  if (!pkg) return {}
  const og = pickImage(pkg.seo?.ogImage, 'og') ?? firstImage(pkg.gallery, 'og')
  return {
    title: pkg.seo?.metaTitle || pkg.title,
    description: pkg.seo?.metaDescription || undefined,
    alternates: { canonical: `/packages/${slug}` },
    openGraph: og
      ? { images: [{ url: og.src, width: og.width, height: og.height, alt: og.alt }] }
      : undefined,
  }
}

const nightsDays = (n: number, d: number) =>
  `${n} Night${n === 1 ? '' : 's'} / ${d} Day${d === 1 ? '' : 's'}`

/** Package detail (design: "Desktop · Package detail", "Mobile · Package detail"). */
export default async function PackagePage({ params }: Props) {
  const { slug } = await params
  const [pkg, settings] = await Promise.all([getPackageBySlug(slug), getSiteSettings()])
  if (!pkg) notFound()

  const dest = typeof pkg.destination === 'object' ? (pkg.destination as Destination) : null
  const categories = (pkg.categories ?? []).filter((c): c is Category => typeof c === 'object')
  const category = categories[0]
  const days = pkg.durationDays ?? pkg.durationNights + 1

  const hotels: HotelChoice[] = (pkg.hotelOptions ?? [])
    .filter((h) => h.price > 0)
    .map((h) => ({
      category: h.category,
      label: hotelCategoryLabel(h.category),
      price: h.price,
      strikePrice: h.strikePrice,
      hotelName: h.hotelName,
      isPopular: h.isPopular,
    }))
  const cheapest = [...hotels].sort((a, b) => a.price - b.price)[0]

  const images: GalleryImage[] = (pkg.gallery ?? []).flatMap((g) => {
    const card = pickImage(g, 'card')
    const full = pickImage(g, 'hero') ?? card
    return card && full
      ? [{ src: card.src, full: full.src, alt: card.alt, position: card.position }]
      : []
  })
  // The first photo is shown large, so use the bigger rendition for it.
  const hero = pickImage(pkg.gallery?.[0], 'hero')
  if (images[0] && hero) images[0] = { ...images[0], src: hero.src }

  const badge =
    pkg.badge && pkg.badge !== 'none'
      ? PACKAGE_BADGES.find((b) => b.value === pkg.badge)?.label
      : null
  const themes = (pkg.themes ?? []).map(
    (t) => PACKAGE_THEMES.find((x) => x.value === t)?.label ?? t,
  )
  const contact = buildContact(settings)
  const askHref = whatsappHref(
    settings.whatsapp,
    `Hi Go Travels, I'm interested in "${pkg.title}" (${pkg.tourCode}). Please share availability.`,
  )

  const glance = [
    { label: 'Duration', value: `${pkg.durationNights}N / ${days}D` },
    { label: 'Stay', value: pkg.highlights?.stay },
    { label: 'Meals', value: pkg.highlights?.meals },
    { label: 'Transport', value: pkg.highlights?.transport },
  ].filter((g) => g.value)

  const sections = [
    { id: 'overview', label: 'Overview', show: Boolean(pkg.overview) },
    { id: 'itinerary', label: 'Itinerary', show: Boolean(pkg.itinerary?.length) },
    {
      id: 'inclusions',
      label: 'Inclusions',
      show: Boolean(pkg.inclusions?.length || pkg.exclusions?.length),
    },
    { id: 'hotels', label: 'Hotels', show: hotels.length > 0 },
    { id: 'policies', label: 'Policies', show: Boolean(pkg.policies) },
    { id: 'faqs', label: 'FAQs', show: Boolean(pkg.faqs?.length) },
  ].filter((s) => s.show)

  const related = await getRelatedPackages(pkg.id, dest?.id ?? null, category?.id ?? null)

  const ogImage = firstImage(pkg.gallery, 'og')
  const tripLd = {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name: pkg.title,
    description: pkg.seo?.metaDescription || plainText(pkg.overview).slice(0, 300) || undefined,
    url: `${siteUrl()}/packages/${slug}`,
    image: ogImage ? new URL(ogImage.src, siteUrl()).toString() : undefined,
    touristType: categories.map((c) => c.name),
    itinerary: pkg.itinerary?.length
      ? {
          '@type': 'ItemList',
          itemListElement: pkg.itinerary.map((d, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: d.title,
          })),
        }
      : undefined,
    offers: pkg.startingPrice
      ? {
          '@type': 'Offer',
          price: pkg.startingPrice,
          priceCurrency: 'INR',
          description: 'Starting price per person, twin sharing',
          availability: 'https://schema.org/InStock',
        }
      : undefined,
    provider: { '@type': 'TravelAgency', name: settings?.siteName || 'Go Travels', url: siteUrl() },
  }

  return (
    <BookingProvider
      slug={slug}
      hotels={hotels}
      childPercent={pkg.childPricePercent}
      whatsappHref={askHref ?? contact.whatsappHref}
    >
      <JsonLd data={tripLd} />
      <main className="gt-package">
        <div className="container-site flex flex-col gap-4 pt-6">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              ...(category ? [{ label: category.name, href: `/tours/${category.slug}` }] : []),
              ...(dest
                ? [
                    {
                      label: dest.name,
                      href: dest.hasPage ? `/destinations/${dest.slug}` : undefined,
                    },
                  ]
                : []),
              { label: pkg.title },
            ]}
          />
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex max-w-[820px] flex-col gap-2.5">
              <div className="flex flex-wrap gap-1.5">
                {badge && <span className="gt-badge gt-badge--accent">{badge}</span>}
                {themes.length > 0 && (
                  <span className="gt-badge gt-badge--info">{themes.slice(0, 3).join(' · ')}</span>
                )}
              </div>
              <h1 className="heading-1">{pkg.title}</h1>
              <p className="m-0 flex flex-wrap gap-x-4 gap-y-1 text-body-sm text-ink-500">
                <span className="font-semibold text-ink-900">
                  {nightsDays(pkg.durationNights, days)}
                </span>
                {pkg.pickup && <span>Pickup: {pkg.pickup}</span>}
                <span>Tour code: {pkg.tourCode}</span>
              </p>
            </div>
            <ShareActions title={pkg.title} />
          </div>
        </div>

        <div className="container-site mt-5">
          <Gallery images={images} tone={dest?.tone ?? 'coast'} title={pkg.title} />
        </div>

        {sections.length > 1 && (
          <nav aria-label="On this page" className="gt-section-tabs">
            <div className="container-site flex gap-1 overflow-x-auto">
              {sections.map((s) => (
                <a key={s.id} href={`#${s.id}`}>
                  {s.label}
                </a>
              ))}
            </div>
          </nav>
        )}

        <div className="container-site grid gap-10 py-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="flex min-w-0 flex-col gap-12">
            {glance.length > 0 && (
              <dl className="m-0 grid grid-cols-2 gap-3 md:grid-cols-4">
                {glance.map((g) => (
                  <div key={g.label} className="rounded-md bg-sand-100 p-4">
                    <dt className="text-caption text-ink-500">{g.label}</dt>
                    <dd className="m-0 font-semibold">{g.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            {pkg.overview && (
              <section id="overview" aria-labelledby="h-overview" className="gt-anchor">
                <h2 id="h-overview" className="heading-3 mb-3">
                  Overview
                </h2>
                <RichText data={pkg.overview} />
              </section>
            )}

            {pkg.itinerary && pkg.itinerary.length > 0 && (
              <section id="itinerary" aria-labelledby="h-itinerary" className="gt-anchor">
                <h2 id="h-itinerary" className="heading-3 mb-4">
                  Day-wise itinerary
                </h2>
                <ol className="gt-itinerary">
                  {pkg.itinerary.map((day, i) => (
                    <li key={day.id ?? i}>
                      <details open={i === 0} className="gt-accordion">
                        <summary>
                          <span className="gt-itinerary__day">DAY {i + 1}</span>
                          <span>{day.title}</span>
                        </summary>
                        {day.description && <p>{day.description}</p>}
                      </details>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {Boolean(pkg.inclusions?.length || pkg.exclusions?.length) && (
              <section
                id="inclusions"
                aria-label="Inclusions and exclusions"
                className="gt-anchor grid gap-4 md:grid-cols-2"
              >
                {pkg.inclusions && pkg.inclusions.length > 0 && (
                  <div className="gt-incl gt-incl--yes">
                    <h2 className="font-display text-[18px] font-bold">Inclusions</h2>
                    <ul>
                      {pkg.inclusions.map((x) => (
                        <li key={x.id}>{x.item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {pkg.exclusions && pkg.exclusions.length > 0 && (
                  <div className="gt-incl gt-incl--no">
                    <h2 className="font-display text-[18px] font-bold">Exclusions</h2>
                    <ul>
                      {pkg.exclusions.map((x) => (
                        <li key={x.id}>{x.item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            )}

            {hotels.length > 0 && (
              <section id="hotels" aria-labelledby="h-hotels" className="gt-anchor">
                <h2 id="h-hotels" className="heading-3 mb-1">
                  Choose your hotel category
                </h2>
                <p className="mt-0 mb-4 text-body-sm text-ink-500">
                  Prices per person on twin sharing. Hotels named or similar.
                </p>
                <HotelPicker />
              </section>
            )}

            {pkg.policies && (
              <section id="policies" aria-labelledby="h-policies" className="gt-anchor">
                <h2 id="h-policies" className="heading-3 mb-3">
                  Booking &amp; cancellation policy
                </h2>
                <RichText data={pkg.policies} />
              </section>
            )}

            {pkg.faqs && pkg.faqs.length > 0 && (
              <section id="faqs" aria-labelledby="h-faqs" className="gt-anchor">
                <h2 id="h-faqs" className="heading-3 mb-4">
                  FAQs
                </h2>
                <div className="flex flex-col gap-2">
                  {pkg.faqs.map((f) => (
                    <details key={f.id} className="gt-accordion">
                      <summary>{f.question}</summary>
                      <p>{f.answer}</p>
                    </details>
                  ))}
                </div>
              </section>
            )}
          </div>

          {cheapest && (
            <aside
              className="hidden self-start md:block lg:sticky lg:top-24"
              aria-label="Book this tour"
            >
              <BookingCard fromPrice={cheapest.price} strikePrice={cheapest.strikePrice} />
            </aside>
          )}
        </div>

        {related.length > 0 && (
          <section className="container-site pb-16" aria-labelledby="h-related">
            <h2 id="h-related" className="heading-2 mb-6">
              You may also like
            </h2>
            <ul className="gt-card-grid m-0 list-none p-0">
              {related.map((r) => {
                const img = firstImage(r.gallery, 'card')
                const c = toPackageCard(r, img && { src: img.src, alt: img.alt })
                return (
                  <li key={r.id} className="flex">
                    <PackageCard
                      className="w-full"
                      href={c.href}
                      title={c.title}
                      place={c.place}
                      nights={c.nights}
                      days={c.days}
                      inclusions={c.inclusions}
                      price={c.price}
                      tag={c.tag}
                      tone={c.tone}
                      imageUrl={c.image?.src}
                      imageAlt={c.image?.alt}
                      ctaLabel="View Details"
                    />
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        {cheapest && (
          <div className="container-site pb-10 md:hidden">
            <BookingCard fromPrice={cheapest.price} strikePrice={cheapest.strikePrice} />
          </div>
        )}
        <p className="container-site pb-10 text-body-sm text-ink-500 print:hidden">
          Not quite right?{' '}
          <Link
            href={`/plan-my-trip?destination=${encodeURIComponent(dest?.name ?? pkg.title)}`}
            className="font-semibold"
          >
            Ask us to customise this trip →
          </Link>
        </p>
      </main>
      {cheapest && <MobileBookingBar />}
    </BookingProvider>
  )
}
