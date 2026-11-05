import type { ReactNode } from 'react'

import { buildContact } from '@/components/site/data'
import { HeroSlider, type HeroSlide } from '@/components/site/home/HeroSlider'
import { PopularPackages } from '@/components/site/home/PopularPackages'
import {
  CategoryTiles,
  CtaBand,
  SearchWidget,
  Testimonials,
  WhyUs,
} from '@/components/site/home/Sections'
import {
  getApprovedTestimonials,
  getHomeCategories,
  getHomePackages,
  getHomepage,
  getLiveSlides,
  getSiteSettings,
  toPackageCard,
} from '@/lib/cms'
import { hrefFor } from '@/lib/site/links'
import { firstImage, pickImage } from '@/lib/site/media'
import type { Destination } from '@/payload-types'

// Rebuilt at most every 10 minutes, and immediately when the CMS publishes a change.
export const revalidate = 600

const HERO_INTRO =
  'Handpicked domestic, international and pilgrimage tours — planned by real people, confirmed on WhatsApp.'

const FALLBACK_SLIDE: HeroSlide = {
  id: 'brand',
  eyebrow: 'A new world awaits',
  heading: 'Discover. Dream. Travel.',
  buttonLabel: 'Explore Packages',
  href: '/tours',
  desktop: null,
  mobile: null,
}

const DEFAULT_ORDER = [
  'slider',
  'search',
  'popular',
  'categories',
  'whyUs',
  'ctaBand',
  'testimonials',
]

export default async function HomePage() {
  const [homepage, slides, categories, reviews, settings] = await Promise.all([
    getHomepage(),
    getLiveSlides(),
    getHomeCategories(),
    getApprovedTestimonials(),
    getSiteSettings(),
  ])

  const tabDestinations = (homepage.popularTabs ?? []).filter(
    (d): d is Destination => typeof d === 'object',
  )
  const packages = await getHomePackages(tabDestinations.map((d) => d.id))
  const cards = packages.map((p) => {
    const img = firstImage(p.gallery, 'card')
    return {
      ...toPackageCard(p, img && { src: img.src, alt: img.alt }),
      popular: Boolean(p.showInPopular),
    }
  })
  const tabs = [
    ...(cards.some((c) => c.popular) ? [{ id: 'popular' as const, name: 'Popular' }] : []),
    ...tabDestinations
      .filter((d) => cards.some((c) => c.destinationId === d.id))
      .map((d) => ({ id: d.id, name: d.name })),
  ]

  const heroSlides: HeroSlide[] = slides.length
    ? slides.map((s) => {
        const desktop = pickImage(s.imageDesktop, 'hero')
        const mobile =
          pickImage(s.imageMobile, 'heroMobile') ?? pickImage(s.imageDesktop, 'heroMobile')
        return {
          id: String(s.id),
          eyebrow: s.eyebrow,
          heading: s.heading,
          buttonLabel: s.buttonLabel,
          href: hrefFor(s) ?? '/tours',
          desktop: desktop && { src: desktop.src, alt: desktop.alt, position: desktop.position },
          mobile: mobile && { src: mobile.src, position: mobile.position },
        }
      })
    : [FALLBACK_SLIDE]

  const whatsappHref = buildContact(settings).whatsappHref

  const sections: Record<string, ReactNode> = {
    slider: <HeroSlider key="slider" slides={heroSlides} intro={HERO_INTRO} />,
    search: (
      <SearchWidget
        key="search"
        categories={categories.map((c) => ({ name: c.name, slug: c.slug }))}
      />
    ),
    popular: cards.length ? <PopularPackages key="popular" tabs={tabs} packages={cards} /> : null,
    categories: <CategoryTiles key="categories" categories={categories} />,
    whyUs: <WhyUs key="whyUs" whyUs={homepage.whyUs} />,
    ctaBand: <CtaBand key="ctaBand" cta={homepage.ctaBand} whatsappHref={whatsappHref} />,
    testimonials: <Testimonials key="testimonials" reviews={reviews} />,
  }

  const order = homepage.sections?.length
    ? homepage.sections.filter((s) => s.visible !== false).map((s) => s.section)
    : DEFAULT_ORDER

  // The hero carries the page's <h1>; if it's hidden, keep one for screen readers and SEO.
  const hasHero = order.includes('slider')

  return (
    <main>
      {!hasHero && (
        <h1 className="sr-only">
          {settings.siteName} — {settings.tagline}
        </h1>
      )}
      {order.map((key) => sections[key] ?? null)}
    </main>
  )
}
