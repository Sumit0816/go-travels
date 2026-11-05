import Link from 'next/link'

import { Icon, type IconName } from '@/components/ui/Icon'
import { initials, type Testimonial } from '@/lib/cms'
import type { Category, Homepage } from '@/payload-types'

import { ScrollRow } from '../ScrollRow'

/** Category tile colours (design: "Our Categories"). Mountain is darkened to keep text at 4.5:1. */
const TILE: Record<string, { bg: string; fg: string }> = {
  ocean: { bg: '#0B4F6C', fg: '#FFFFFF' },
  ink: { bg: '#13222B', fg: '#FFFFFF' },
  pilgrim: { bg: '#8A4B12', fg: '#FFFFFF' },
  plum: { bg: '#6B3A5C', fg: '#FFFFFF' },
  forest: { bg: '#2F6E4E', fg: '#FFFFFF' },
  marigold: { bg: '#F2A541', fg: '#13222B' },
  mountain: { bg: '#46677A', fg: '#FFFFFF' },
}

function SectionHeading({
  eyebrow,
  title,
  id,
  center,
}: {
  eyebrow: string
  title: string
  id: string
  center?: boolean
}) {
  return (
    <div className={`mb-9 flex flex-col gap-2 ${center ? 'items-center text-center' : ''}`}>
      <span className="eyebrow">{eyebrow}</span>
      <h2 id={id} className="heading-2">
        {title}
      </h2>
    </div>
  )
}

/** Search widget overlapping the hero; submits to the tour listing (Phase 4b). */
export function SearchWidget({ categories }: { categories: Pick<Category, 'name' | 'slug'>[] }) {
  return (
    <div className="container-site relative -mt-16 md:-mt-18">
      <form
        action="/tours"
        method="get"
        role="search"
        aria-label="Search tours"
        className="gt-search"
      >
        <label className="gt-search__field">
          Where to?
          <input className="gt-input" type="text" name="q" placeholder="Goa, Dubai, Deoghar…" />
        </label>
        <label className="gt-search__field">
          Tour type
          <select className="gt-input" name="category" defaultValue="">
            <option value="">All tours</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug!}>
                {c.name.replace(/ Tours$/, '')}
              </option>
            ))}
          </select>
        </label>
        <label className="gt-search__field">
          Travel month
          <input className="gt-input" type="month" name="month" />
        </label>
        <label className="gt-search__field">
          Duration
          <select className="gt-input" name="duration" defaultValue="">
            <option value="">Any</option>
            <option value="1-3">1–3 nights</option>
            <option value="4-6">4–6 nights</option>
            <option value="7+">7+ nights</option>
          </select>
        </label>
        <button type="submit" className="gt-btn gt-btn--primary self-end">
          <Icon name="search" size={18} />
          Search Tours
        </button>
      </form>
    </div>
  )
}

export function CategoryTiles({ categories }: { categories: Category[] }) {
  if (!categories.length) return null
  return (
    <section className="bg-sand-100 py-18" aria-labelledby="categories-title">
      <div className="container-site">
        <SectionHeading
          eyebrow="Our categories"
          title="Pick the trip that fits you"
          id="categories-title"
          center
        />
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4.5">
          {categories.map((c) => {
            const tile = TILE[c.colour ?? 'ocean'] ?? TILE.ocean
            return (
              <Link
                key={c.id}
                href={`/tours/${c.slug}`}
                className="flex min-h-[200px] flex-col gap-2 rounded-lg p-5.5 no-underline transition-transform hover:-translate-y-0.5"
                style={{ background: tile.bg, color: tile.fg }}
              >
                {c.eyebrow && (
                  <span className="text-[12px] font-semibold tracking-[0.1em] opacity-90">
                    {c.eyebrow}
                  </span>
                )}
                <span className="font-display text-[22px] leading-tight font-bold">{c.name}</span>
                {c.subtitle && <span className="text-body-sm opacity-95">{c.subtitle}</span>}
                <span className="mt-auto text-body-sm font-semibold">Explore →</span>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export function WhyUs({ whyUs }: { whyUs: Homepage['whyUs'] }) {
  const items = whyUs?.items ?? []
  if (!items.length) return null
  return (
    <section className="container-site py-20" aria-labelledby="why-title">
      <SectionHeading
        eyebrow={whyUs?.eyebrow || 'Why choose Go Travels?'}
        title={whyUs?.heading || 'Travel planned with care, end to end'}
        id="why-title"
        center
      />
      <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4.5 p-0">
        {items.map((w) => (
          <li key={w.id} className="flex flex-col gap-3 rounded-lg border border-line-200 p-6">
            <span className="flex h-13 w-13 items-center justify-center rounded-[14px] bg-ocean-50 text-ocean-700">
              <Icon name={(w.icon as IconName) || 'check'} size={24} />
            </span>
            <h3 className="font-display text-h4">{w.title}</h3>
            {w.text && <p className="m-0 text-body-sm text-ink-500">{w.text}</p>}
          </li>
        ))}
      </ul>
    </section>
  )
}

export function CtaBand({
  cta,
  whatsappHref,
}: {
  cta: Homepage['ctaBand']
  whatsappHref: string | null
}) {
  return (
    <section className="container-site" aria-labelledby="cta-title">
      <div className="flex flex-wrap items-center justify-between gap-6 rounded-xl bg-ocean-700 px-6 py-10 text-surface md:px-11">
        <div className="flex max-w-[620px] flex-col gap-2">
          <h2 id="cta-title" className="font-display text-[26px] font-bold md:text-[30px]">
            {cta?.heading || "Can't find the perfect package?"}
          </h2>
          {cta?.text && (
            <p className="m-0 text-[16px] leading-relaxed text-[#D8E6EC]">{cta.text}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/plan-my-trip" className="gt-btn gt-btn--accent gt-btn--lg">
            Customise My Trip
          </Link>
          {whatsappHref && (
            <a
              href={whatsappHref}
              className="gt-btn gt-btn--whatsapp gt-btn--lg"
              target="_blank"
              rel="noreferrer"
            >
              <Icon name="whatsapp" size={18} />
              Chat on WhatsApp
            </a>
          )}
        </div>
      </div>
    </section>
  )
}

export function Testimonials({ reviews }: { reviews: Testimonial[] }) {
  if (!reviews.length) return null
  return (
    <section className="container-site py-20" aria-labelledby="reviews-title">
      <SectionHeading
        eyebrow="What our clients say"
        title="Testimonials & feedback"
        id="reviews-title"
      />
      <ScrollRow label="reviews">
        {reviews.map((r) => (
          <figure
            key={r.id}
            className="gt-scroll-row__item gt-scroll-row__item--wide m-0 flex flex-col gap-4 rounded-lg bg-sand-100 p-6.5"
          >
            <span
              className="tracking-[2px] text-marigold-700"
              role="img"
              aria-label={`${r.rating} out of 5 stars`}
            >
              {'★'.repeat(r.rating)}
              <span className="opacity-30">{'★'.repeat(5 - r.rating)}</span>
            </span>
            <blockquote className="m-0 text-[15px] leading-relaxed text-[#2A3A43]">
              {r.text}
            </blockquote>
            <figcaption className="mt-auto flex items-center gap-3">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill bg-[#D5E4EA] font-semibold text-ocean-700"
                aria-hidden="true"
              >
                {initials(r.name)}
              </span>
              <span className="flex flex-col">
                <b className="text-body-sm">{r.name}</b>
                {r.tripLabel && <span className="text-[13px] text-ink-500">{r.tripLabel}</span>}
              </span>
            </figcaption>
          </figure>
        ))}
      </ScrollRow>
    </section>
  )
}
