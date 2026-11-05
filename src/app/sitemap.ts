import type { MetadataRoute } from 'next'

import { getSitemapEntries, getSiteSettings } from '@/lib/cms'
import { routes, siteUrl } from '@/lib/site/links'

export const revalidate = 3600

/** sitemap.xml from published CMS content. Turned off with Site Settings › SEO. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const settings = await getSiteSettings().catch(() => null)
  if (settings?.sitemapEnabled === false) return []
  const base = siteUrl()
  const e = await getSitemapEntries().catch(() => null)
  const at = (d?: string) => (d ? new Date(d) : undefined)
  const entries = (
    list: { slug?: string | null; updatedAt: string }[] | undefined,
    path: (slug: string) => string,
    priority: number,
  ): MetadataRoute.Sitemap =>
    (list ?? [])
      .filter((x) => x.slug)
      .map((x) => ({ url: `${base}${path(x.slug!)}`, lastModified: at(x.updatedAt), priority }))

  return [
    { url: `${base}/`, priority: 1 },
    { url: `${base}${routes.tours}`, priority: 0.9 },
    { url: `${base}${routes.blog}`, priority: 0.6 },
    { url: `${base}${routes.planMyTrip}`, priority: 0.6 },
    ...entries(e?.categories, routes.category, 0.8),
    ...entries(e?.destinations, routes.destination, 0.8),
    ...entries(e?.packages, routes.package, 0.9),
    ...entries(e?.posts, routes.post, 0.5),
    ...entries(e?.pages, routes.page, 0.4),
  ]
}
