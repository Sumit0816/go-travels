import type { Metadata } from 'next'
import Link from 'next/link'
import type { Where } from 'payload'

import { FeaturedPost, PostCard } from '@/components/site/blog/PostCard'
import { Breadcrumbs } from '@/components/site/Breadcrumbs'
import { Icon } from '@/components/ui/Icon'
import { findPosts, getPostCategories } from '@/lib/cms'

export const revalidate = 600

const PAGE_SIZE = 9

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

function parse(sp: Record<string, string | string[] | undefined>) {
  const q = (one(sp.q) ?? '').trim().slice(0, 80)
  const category = (one(sp.category) ?? '').trim()
  const page = Math.max(1, Math.min(100, Number.parseInt(one(sp.page) ?? '1', 10) || 1))
  return { q, category: /^[a-z0-9-]{1,80}$/.test(category) ? category : '', page }
}

function blogHref(p: { q?: string; category?: string; page?: number }) {
  const sp = new URLSearchParams()
  if (p.category) sp.set('category', p.category)
  if (p.q) sp.set('q', p.q)
  if (p.page && p.page > 1) sp.set('page', String(p.page))
  const s = sp.toString()
  return s ? `/blog?${s}` : '/blog'
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q, category, page } = parse(await searchParams)
  return {
    title: 'Travel Blog',
    description: 'Guides, tips and travel stories from the Go Travels team.',
    alternates: { canonical: blogHref({ category, page }) },
    // Search results are not worth indexing.
    robots: q ? { index: false, follow: true } : undefined,
  }
}

/** Blog listing (design: "Desktop · Blog"). */
export default async function BlogPage({ searchParams }: Props) {
  const { q, category, page } = parse(await searchParams)
  const categories = await getPostCategories().catch(() => [])
  const active = categories.find((c) => c.slug === category) ?? null

  const and: Where[] = []
  if (active) and.push({ category: { equals: active.id } })
  if (q) and.push({ or: [{ title: { like: q } }, { excerpt: { like: q } }] })
  const where: Where = and.length ? { and } : {}

  const plain = !q && !active && page === 1
  const result = await findPosts(where, page, PAGE_SIZE).catch(() => null)
  const posts = result?.docs ?? []
  const featured = plain ? (posts.find((p) => p.featured) ?? null) : null
  const grid = featured ? posts.filter((p) => p.id !== featured.id) : posts

  return (
    <>
      <section className="bg-sand-100">
        <div className="container-site flex flex-col gap-3 py-8 md:py-12">
          <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Blog' }]} />
          <span className="eyebrow">Travel blog</span>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <h1 className="heading-1 m-0">Guides, tips &amp; travel stories</h1>
            <form
              action="/blog"
              method="get"
              role="search"
              className="flex w-full max-w-[380px] gap-2"
            >
              {active && <input type="hidden" name="category" value={active.slug} />}
              <label className="sr-only" htmlFor="blog-q">
                Search the blog
              </label>
              <input
                id="blog-q"
                className="gt-input flex-1"
                type="search"
                name="q"
                defaultValue={q}
                placeholder="Search articles"
              />
              <button
                type="submit"
                className="gt-btn gt-btn--primary gt-btn--icon"
                aria-label="Search"
              >
                <Icon name="search" size={18} />
              </button>
            </form>
          </div>
        </div>
      </section>

      <div className="container-site flex flex-col gap-8 py-8 md:py-12">
        {categories.length > 0 && (
          <nav aria-label="Blog categories" className="gt-tabs">
            <Link href={blogHref({ q })} aria-current={!active ? 'page' : undefined}>
              All
            </Link>
            {categories.map((c) => (
              <Link
                key={c.id}
                href={blogHref({ q, category: c.slug })}
                aria-current={active?.id === c.id ? 'page' : undefined}
              >
                {c.name}
              </Link>
            ))}
          </nav>
        )}

        {q && (
          <p className="m-0 text-body text-ink-700" role="status">
            {result?.totalDocs ?? 0} {result?.totalDocs === 1 ? 'article' : 'articles'} for “{q}”.{' '}
            <Link href={blogHref({ category })} className="text-ocean-700 underline">
              Clear search
            </Link>
          </p>
        )}

        {featured && <FeaturedPost post={featured} />}

        {grid.length > 0 ? (
          <ul className="m-0 grid list-none gap-6 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {grid.map((p) => (
              <li key={p.id}>
                <PostCard post={p} headingLevel={featured ? 'h3' : 'h2'} />
              </li>
            ))}
          </ul>
        ) : (
          !featured && (
            <div className="flex flex-col items-start gap-3 rounded-lg border border-line-200 bg-surface p-8">
              <h2 className="heading-3 m-0">No articles found</h2>
              <p className="m-0 text-ink-700">Try another search or category.</p>
              <Link href="/blog" className="gt-btn gt-btn--outline">
                See all articles
              </Link>
            </div>
          )
        )}

        {result && result.totalPages > 1 && (
          <nav aria-label="Pagination" className="flex items-center justify-center gap-3">
            {result.hasPrevPage && (
              <Link
                href={blogHref({ q, category, page: page - 1 })}
                className="gt-btn gt-btn--outline"
                rel="prev"
              >
                <Icon name="chevronLeft" size={18} />
                Newer
              </Link>
            )}
            <span className="text-body-sm text-ink-500">
              Page {result.page} of {result.totalPages}
            </span>
            {result.hasNextPage && (
              <Link
                href={blogHref({ q, category, page: page + 1 })}
                className="gt-btn gt-btn--outline"
                rel="next"
              >
                Older
                <Icon name="chevronRight" size={18} />
              </Link>
            )}
          </nav>
        )}
      </div>
    </>
  )
}
