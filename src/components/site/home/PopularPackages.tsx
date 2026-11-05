'use client'

import Link from 'next/link'
import { useState } from 'react'

import { Chip } from '@/components/ui/Chip'
import { PackageCard } from '@/components/ui/PackageCard'
import type { PackageCardData } from '@/lib/cms'

import { ScrollRow } from '../ScrollRow'

type Tab = { id: number | 'popular'; name: string }

/** "Popular destinations" — destination tabs filter the package row (design: Home). */
export function PopularPackages({
  tabs,
  packages,
}: {
  tabs: Tab[]
  packages: (PackageCardData & { popular: boolean })[]
}) {
  const [active, setActive] = useState<Tab['id']>(tabs[0]?.id ?? 'popular')
  const shown = packages.filter((p) =>
    active === 'popular' ? p.popular : p.destinationId === active,
  )

  return (
    <section className="container-site pt-22 pb-10" aria-labelledby="popular-title">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="eyebrow">Popular destinations</span>
          <h2 id="popular-title" className="heading-2">
            Tour packages travellers love
          </h2>
        </div>
        <Link href="/tours" className="font-semibold">
          View all packages →
        </Link>
      </div>

      <div
        className="mb-7 flex gap-2.5 overflow-x-auto pb-1"
        role="group"
        aria-label="Filter by destination"
      >
        {tabs.map((t) => (
          <Chip key={t.id} pressed={active === t.id} onClick={() => setActive(t.id)}>
            {t.name}
          </Chip>
        ))}
      </div>

      {shown.length ? (
        <ScrollRow label="packages">
          {shown.map((p) => (
            <div key={p.id} className="gt-scroll-row__item">
              <PackageCard
                href={p.href}
                title={p.title}
                place={p.place}
                nights={p.nights}
                days={p.days}
                inclusions={p.inclusions}
                price={p.price}
                tag={p.tag}
                tone={p.tone}
                imageUrl={p.image?.src}
                imageAlt={p.image?.alt}
              />
            </div>
          ))}
        </ScrollRow>
      ) : (
        <p className="rounded-lg bg-sand-100 p-6 text-ink-700">
          No packages here yet.{' '}
          <Link href="/plan-my-trip" className="font-semibold">
            Ask us to plan this trip for you →
          </Link>
        </p>
      )}
    </section>
  )
}
