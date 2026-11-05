import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { PageHero } from '@/components/site/PageHero'
import { RichText } from '@/components/site/RichText'
import { PackageCard } from '@/components/ui/PackageCard'
import {
  getAllDestinations,
  getDestinationBySlug,
  getPackagesForDestination,
  toPackageCard,
} from '@/lib/cms'
import { MONTHS } from '@/lib/catalog'
import { formatINR } from '@/lib/format'
import { firstImage, pickImage } from '@/lib/site/media'

export const revalidate = 600

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const all = await getAllDestinations().catch(() => [])
  return all.filter((d) => d.hasPage && d.slug).map((d) => ({ slug: d.slug! }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const d = await getDestinationBySlug(slug)
  if (!d || !d.hasPage) return {}
  const og = pickImage(d.seo?.ogImage ?? d.heroImage, 'og')
  return {
    title: d.seo?.metaTitle || `${d.name} Tour Packages`,
    description:
      d.seo?.metaDescription ||
      d.intro ||
      `${d.name} tour packages from Go Travels, confirmed on WhatsApp.`,
    alternates: { canonical: `/destinations/${slug}` },
    openGraph: og
      ? { images: [{ url: og.src, width: og.width, height: og.height, alt: og.alt }] }
      : undefined,
  }
}

const SEASON_STYLE = {
  best: { bg: '#CFE8D9', label: 'Best' },
  good: { bg: '#F6E7C4', label: 'Good' },
  off: { bg: '#D9DEE1', label: 'Off' },
  none: { bg: '#F0ECE4', label: '' },
} as const

/** Destination page (design: "Desktop · Destination page"). */
export default async function DestinationPage({ params }: Props) {
  const { slug } = await params
  const d = await getDestinationBySlug(slug)
  if (!d || !d.hasPage) notFound()

  const packages = await getPackagesForDestination(d.id)
  const cards = packages.map((p) => {
    const img = firstImage(p.gallery, 'card')
    return toPackageCard(p, img && { src: img.src, alt: img.alt })
  })
  const from = cards.length ? Math.min(...cards.map((c) => c.price).filter((n) => n > 0)) : null
  const hero = pickImage(d.heroImage, 'hero')

  const facts = [
    { label: 'Best time', value: d.facts?.bestTime },
    { label: 'Ideal duration', value: d.facts?.idealDuration },
    { label: 'Nearest airports', value: d.facts?.nearestAirports },
    {
      label: 'Packages from',
      value: from && Number.isFinite(from) ? `${formatINR(from)} / person` : null,
    },
  ].filter((f) => f.value)

  const season = (m: string): keyof typeof SEASON_STYLE =>
    d.seasons?.bestMonths?.includes(m as never)
      ? 'best'
      : d.seasons?.goodMonths?.includes(m as never)
        ? 'good'
        : d.seasons?.offMonths?.includes(m as never)
          ? 'off'
          : 'none'
  const hasSeasons = Boolean(
    d.seasons?.bestMonths?.length || d.seasons?.goodMonths?.length || d.seasons?.offMonths?.length,
  )
  const places = (d.places ?? []).filter((p) => p.name)
  const listingHref = `/tours?destination=${slug}`

  return (
    <main>
      <PageHero
        crumbs={[
          { label: 'Home', href: '/' },
          d.isInternational
            ? { label: 'International Tours', href: '/tours/international' }
            : { label: 'Domestic Tours', href: '/tours/domestic' },
          { label: d.name },
        ]}
        title={`${d.name} Tour Packages`}
        intro={d.intro}
        image={hero && { src: hero.src, position: hero.position }}
      />

      {facts.length > 0 && (
        <div className="container-site relative -mt-6 md:-mt-8">
          <dl className="m-0 grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-line-200 shadow-card md:grid-cols-4">
            {facts.map((f) => (
              <div key={f.label} className="flex flex-col gap-1 bg-surface p-4 md:p-5">
                <dt className="eyebrow">{f.label}</dt>
                <dd className="m-0 font-semibold">{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <section className="container-site py-12" aria-labelledby="dest-packages">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <h2 id="dest-packages" className="heading-2">
            {d.name} packages
          </h2>
          {cards.length > 0 && (
            <Link href={listingHref} className="font-semibold">
              See all {d.name} packages →
            </Link>
          )}
        </div>
        {cards.length ? (
          <ul className="gt-card-grid m-0 list-none p-0">
            {cards.map((c) => (
              <li key={c.id} className="flex">
                <PackageCard
                  className="gt-card--row-mobile w-full"
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
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-lg bg-sand-100 p-6 text-ink-700">
            No ready-made {d.name} packages right now.{' '}
            <Link href="/plan-my-trip" className="font-semibold">
              Ask us for a custom plan →
            </Link>
          </p>
        )}
      </section>

      {places.length > 0 && (
        <section className="bg-sand-100 py-14" aria-labelledby="dest-places">
          <div className="container-site">
            <h2 id="dest-places" className="heading-2 mb-6">
              Top places to visit
            </h2>
            <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-5 p-0">
              {places.map((p) => {
                const img = pickImage(p.image, 'card')
                return (
                  <li key={p.id} className="flex flex-col gap-3">
                    <div
                      className="h-[140px] overflow-hidden rounded-[14px]"
                      style={{ background: `var(--color-dest-${d.tone ?? 'coast'})` }}
                    >
                      {img && (
                        // eslint-disable-next-line @next/next/no-img-element -- CMS image in a fixed tile
                        <img
                          src={img.src}
                          alt={img.alt}
                          loading="lazy"
                          className="h-full w-full object-cover"
                          style={{ objectPosition: img.position }}
                        />
                      )}
                    </div>
                    <h3 className="font-display text-h4">{p.name}</h3>
                    {p.text && <p className="m-0 text-body-sm text-ink-700">{p.text}</p>}
                  </li>
                )
              })}
            </ul>
          </div>
        </section>
      )}

      <div className="container-site grid gap-12 py-14 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex flex-col gap-12">
          {hasSeasons && (
            <section aria-labelledby="dest-when">
              <h2 id="dest-when" className="heading-3 mb-5">
                When to go
              </h2>
              <ol className="m-0 grid list-none grid-cols-6 gap-2 p-0 md:grid-cols-12">
                {MONTHS.map((m) => {
                  const s = SEASON_STYLE[season(m.value)]
                  return (
                    <li
                      key={m.value}
                      className="flex flex-col items-center gap-0.5 rounded-[10px] px-1 py-3 text-center"
                      style={{ background: s.bg }}
                    >
                      <b className="text-body-sm">{m.label}</b>
                      <span className="text-[11px] text-ink-700">{s.label || '—'}</span>
                    </li>
                  )
                })}
              </ol>
              <ul className="m-0 mt-4 flex list-none flex-wrap gap-x-6 gap-y-2 p-0 text-body-sm text-ink-700">
                {d.seasons?.bestMonths?.length ? (
                  <li>
                    <b>Best</b>
                    {d.seasons.bestNote && ` · ${d.seasons.bestNote}`}
                  </li>
                ) : null}
                {d.seasons?.goodMonths?.length ? (
                  <li>
                    <b>Good</b>
                    {d.seasons.goodNote && ` · ${d.seasons.goodNote}`}
                  </li>
                ) : null}
                {d.seasons?.offMonths?.length ? (
                  <li>
                    <b>Off</b>
                    {d.seasons.offNote && ` · ${d.seasons.offNote}`}
                  </li>
                ) : null}
              </ul>
            </section>
          )}

          {d.description && (
            <section aria-label={`About ${d.name}`}>
              <RichText data={d.description} />
            </section>
          )}

          {d.faqs && d.faqs.length > 0 && (
            <section aria-labelledby="dest-faqs">
              <h2 id="dest-faqs" className="heading-3 mb-4">
                {d.name} travel FAQs
              </h2>
              <div className="flex flex-col gap-2">
                {d.faqs.map((f) => (
                  <details key={f.id} className="gt-accordion">
                    <summary>{f.question}</summary>
                    <p>{f.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside
          className="self-start rounded-xl bg-ocean-700 p-7 text-surface lg:sticky lg:top-24"
          aria-labelledby="dest-cta"
        >
          <h2 id="dest-cta" className="font-display text-[22px] font-bold">
            Plan a custom {d.name} trip
          </h2>
          <p className="mt-2 mb-5 text-[#D8E6EC]">
            Tell us your dates — we&apos;ll send options on WhatsApp.
          </p>
          <Link
            href={`/plan-my-trip?destination=${encodeURIComponent(d.name)}`}
            className="gt-btn gt-btn--accent gt-btn--block"
          >
            Find Your Perfect Trip
          </Link>
        </aside>
      </div>
    </main>
  )
}
