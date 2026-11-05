import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { BookingFlow, type BookingPackage } from '@/components/site/booking/BookingFlow'
import { buildContact } from '@/components/site/data'
import { MAX_ADULTS, MAX_CHILDREN } from '@/lib/booking'
import { getPackageBySlug, getSiteSettings } from '@/lib/cms'
import { formatDuration } from '@/lib/format'
import { firstImage } from '@/lib/site/media'
import type { Destination } from '@/payload-types'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const pkg = await getPackageBySlug(slug)
  return {
    title: pkg ? `Book ${pkg.title}` : 'Booking request',
    robots: { index: false, follow: false },
  }
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)
const int = (v: string | undefined, min: number, max: number) => {
  const n = Number.parseInt(v ?? '', 10)
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : undefined
}

/** Booking request (design: "Desktop · Booking"). Choices from the package page arrive in the URL. */
export default async function BookPage({ params, searchParams }: Props) {
  const { slug } = await params
  const sp = await searchParams
  const [pkg, settings] = await Promise.all([
    getPackageBySlug(slug),
    getSiteSettings().catch(() => null),
  ])
  if (!pkg || !pkg.hotelOptions?.length) notFound()

  const dest = typeof pkg.destination === 'object' ? (pkg.destination as Destination) : null
  const img = firstImage(pkg.gallery, 'card')
  const contact = buildContact(settings)
  const data: BookingPackage = {
    slug,
    title: pkg.title,
    place: dest?.name ?? '',
    duration: formatDuration(pkg.durationNights, pkg.durationDays ?? undefined),
    image: img && { src: img.src, alt: img.alt, position: img.position },
    hotels: [...pkg.hotelOptions]
      .sort((a, b) => a.price - b.price)
      .map((h) => ({ category: h.category, price: h.price, hotelName: h.hotelName })),
    addOns: (pkg.addOns ?? []).map((a) => ({ name: a.name, price: a.price ?? 0 })),
    childPricePercent: pkg.childPricePercent ?? null,
    pickup: null,
  }

  const hotel = one(sp.hotel)
  const date = one(sp.date)
  const initial = {
    ...(hotel && data.hotels.some((h) => h.category === hotel) ? { hotel } : {}),
    ...(date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? { travelDate: date } : {}),
    ...(int(one(sp.adults), 1, MAX_ADULTS) ? { adults: int(one(sp.adults), 1, MAX_ADULTS)! } : {}),
    ...(int(one(sp.children), 0, MAX_CHILDREN) !== undefined
      ? { children: int(one(sp.children), 0, MAX_CHILDREN)! }
      : {}),
  }

  return (
    <div className="bg-sand-100">
      <Suspense>
        <BookingFlow
          pkg={data}
          initial={initial}
          contact={{
            whatsappHref: contact.whatsappHref,
            phone: contact.phone,
            phoneHref: contact.phoneHref,
          }}
        />
      </Suspense>
    </div>
  )
}
