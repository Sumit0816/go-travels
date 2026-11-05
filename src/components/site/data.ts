import { formatDuration, formatINR } from '@/lib/format'
import { firstImage } from '@/lib/site/media'
import { hrefFor, telHref, whatsappHref, type CmsLink } from '@/lib/site/links'
import type { Navigation, Package, SiteSetting } from '@/payload-types'

import type { ContactInfo, NavEntry, NavLink } from './nav-types'

const link = (item: CmsLink & { label: string }): NavLink | null => {
  const href = hrefFor(item)
  return href ? { label: item.label, href } : null
}

/** CMS "Menus" global → header entries (with mega menus). Items whose target is missing are dropped. */
export function buildHeaderNav(nav: Navigation | null | undefined): NavEntry[] {
  return (nav?.header ?? []).flatMap((item): NavEntry[] => {
    const base = link(item)
    if (!base) return []
    const columns = (item.megaMenu ?? [])
      .map((col) => ({
        heading: col.heading,
        links: (col.links ?? []).map(link).filter((l): l is NavLink => !!l),
      }))
      .filter((c) => c.links.length)
    if (!columns.length) return [base]

    const pkg =
      item.featuredPackage && typeof item.featuredPackage === 'object'
        ? (item.featuredPackage as Package)
        : null
    const dest = pkg && typeof pkg.destination === 'object' ? pkg.destination : null
    const img = pkg ? firstImage(pkg.gallery, 'card') : null
    return [
      {
        ...base,
        mega: {
          columns,
          featured: pkg
            ? {
                href: `/packages/${pkg.slug}`,
                title: pkg.title,
                meta: `${formatDuration(pkg.durationNights, pkg.durationDays ?? undefined)}${pkg.startingPrice ? ` · from ${formatINR(pkg.startingPrice)}` : ''}`,
                image: img ? { src: img.src, alt: img.alt } : null,
                tone: dest?.tone ?? 'coast',
              }
            : undefined,
          viewAll: { label: `View all ${base.label.toLowerCase()} →`, href: base.href },
        },
      },
    ]
  })
}

export function buildFooterLinks(items: Navigation['footerQuickLinks']): NavLink[] {
  return (items ?? []).map(link).filter((l): l is NavLink => !!l)
}

export function buildContact(s: SiteSetting | null | undefined): ContactInfo {
  const phone = s?.phones?.[0]?.number ?? null
  return {
    phone,
    phoneHref: telHref(phone),
    whatsappHref: whatsappHref(s?.whatsapp, 'Hi Go Travels, I would like to plan a trip.'),
    email: s?.email ?? null,
    hours: s?.workingHours ?? null,
    instagram: s?.instagram || null,
  }
}
