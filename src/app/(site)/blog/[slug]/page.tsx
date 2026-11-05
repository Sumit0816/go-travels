import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { CopyLink } from '@/components/site/blog/CopyLink'
import { PostCard, PostMeta } from '@/components/site/blog/PostCard'
import { Breadcrumbs } from '@/components/site/Breadcrumbs'
import { JsonLd } from '@/components/site/JsonLd'
import { RichText } from '@/components/site/RichText'
import { Icon } from '@/components/ui/Icon'
import { plainText, readMinutes, tableOfContents } from '@/lib/blog'
import { getPostBySlug, getPublishedPostSlugs, getRelatedPosts, getSiteSettings } from '@/lib/cms'
import { siteUrl } from '@/lib/site/links'
import { pickImage } from '@/lib/site/media'

export const revalidate = 600

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const posts = await getPublishedPostSlugs().catch(() => [])
  return posts.filter((p) => p.slug).map((p) => ({ slug: p.slug! }))
}

const description = (post: { excerpt?: string | null; content: unknown }) =>
  post.excerpt || plainText(post.content).slice(0, 160)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) return {}
  const og = pickImage(post.seo?.ogImage ?? post.cover, 'og')
  return {
    title: post.seo?.metaTitle || post.title,
    description: post.seo?.metaDescription || description(post),
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      type: 'article',
      publishedTime: post.publishedAt ?? undefined,
      modifiedTime: post.updatedAt,
      images: og ? [{ url: og.src, width: og.width, height: og.height, alt: og.alt }] : undefined,
    },
  }
}

/** Blog article (design: "Desktop · Blog post"). */
export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) notFound()

  const category = typeof post.category === 'object' ? post.category : null
  const [related, settings] = await Promise.all([
    getRelatedPosts(post.id, category?.id ?? null).catch(() => []),
    getSiteSettings().catch(() => null),
  ])
  const cover = pickImage(post.cover, 'hero')
  const toc = tableOfContents(post.content)
  const url = `${siteUrl()}/blog/${post.slug}`
  const siteName = settings?.siteName || 'Go Travels'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: description(post),
    image: cover ? [new URL(cover.src, siteUrl()).toString()] : undefined,
    datePublished: post.publishedAt ?? post.createdAt,
    dateModified: post.updatedAt,
    timeRequired: `PT${readMinutes(post.content)}M`,
    mainEntityOfPage: url,
    author: { '@type': 'Organization', name: siteName },
    publisher: { '@type': 'Organization', name: siteName },
  }

  return (
    <>
      <JsonLd data={jsonLd} />
      <article>
        <header className="container-site flex max-w-[900px] flex-col gap-3 pt-6 pb-6 md:pt-10">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Blog', href: '/blog' },
              ...(category
                ? [{ label: category.name, href: `/blog?category=${category.slug}` }]
                : []),
              { label: post.title },
            ]}
          />
          {category && <span className="eyebrow">{category.name}</span>}
          <h1 className="heading-1 m-0">{post.title}</h1>
          <p className="m-0 text-body-sm text-ink-500">
            By {siteName} team · <PostMeta post={post} />
          </p>
        </header>

        {cover && (
          <div className="container-site max-w-[1100px]">
            {/* eslint-disable-next-line @next/next/no-img-element -- CMS cover with focal point */}
            <img
              src={cover.src}
              alt={cover.alt}
              width={cover.width}
              height={cover.height}
              className="aspect-[21/9] w-full rounded-lg object-cover"
              style={{ objectPosition: cover.position }}
            />
          </div>
        )}

        <div className="container-site grid gap-10 py-8 md:py-12 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 max-w-[720px]">
            <RichText data={post.content} className="text-[16px]" />

            <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-line-200 pt-6">
              <span className="text-label">Share</span>
              <a
                className="gt-btn gt-btn--wa-outline gt-btn--sm"
                href={`https://wa.me/?text=${encodeURIComponent(`${post.title} ${url}`)}`}
                target="_blank"
                rel="noreferrer"
              >
                <Icon name="whatsapp" size={16} />
                WhatsApp
              </a>
              <a
                className="gt-btn gt-btn--outline gt-btn--sm"
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
                target="_blank"
                rel="noreferrer"
              >
                Facebook
              </a>
              <CopyLink url={url} />
            </div>
          </div>

          <aside className="flex flex-col gap-5 lg:sticky lg:top-24 lg:self-start">
            {toc.length > 1 && (
              <nav
                aria-labelledby="toc-title"
                className="rounded-lg border border-line-200 bg-surface p-5"
              >
                <h2 id="toc-title" className="text-label mt-0 mb-3 uppercase">
                  On this page
                </h2>
                <ol className="m-0 flex list-none flex-col gap-2 p-0">
                  {toc.map((h) => (
                    <li key={h.id}>
                      <a
                        href={`#${h.id}`}
                        className="text-body-sm text-ink-700 no-underline hover:text-ocean-700"
                      >
                        {h.text}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            )}
            <section
              aria-labelledby="plan-cta"
              className="flex flex-col gap-3 rounded-lg bg-ocean-700 p-5 text-surface"
            >
              <h2 id="plan-cta" className="heading-3 m-0">
                Want us to plan it?
              </h2>
              <p className="m-0 text-body-sm text-[#D8E6EC]">
                Tell us your dates and budget. A travel expert replies on WhatsApp.
              </p>
              <Link href="/plan-my-trip" className="gt-btn gt-btn--accent self-start">
                Plan My Trip
              </Link>
            </section>
          </aside>
        </div>
      </article>

      {related.length > 0 && (
        <section aria-labelledby="keep-reading" className="bg-sand-100 py-10 md:py-14">
          <div className="container-site">
            <h2 id="keep-reading" className="heading-2 mb-6">
              Keep reading
            </h2>
            <ul className="m-0 grid list-none gap-6 p-0 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <li key={p.id}>
                  <PostCard post={p} headingLevel="h3" />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  )
}
