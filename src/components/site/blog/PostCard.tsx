import Link from 'next/link'

import { readMinutes } from '@/lib/blog'
import { pickImage } from '@/lib/site/media'
import type { Post } from '@/payload-types'

export const postDate = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

export function PostMeta({ post }: { post: Post }) {
  const date = post.publishedAt ?? post.createdAt
  return (
    <span className="text-caption text-ink-500">
      <time dateTime={date}>{postDate.format(new Date(date))}</time> · {readMinutes(post.content)}{' '}
      min read
    </span>
  )
}

const categoryName = (post: Post) =>
  typeof post.category === 'object' ? post.category?.name : null

/** Blog card (design: "Desktop · Blog" grid). The whole card is one link. */
export function PostCard({
  post,
  headingLevel = 'h2',
}: {
  post: Post
  headingLevel?: 'h2' | 'h3'
}) {
  const img = pickImage(post.cover, 'card')
  const H = headingLevel
  const cat = categoryName(post)
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-lg border border-line-200 bg-surface">
      <div className="aspect-[16/10] bg-ocean-50">
        {img && (
          // eslint-disable-next-line @next/next/no-img-element -- CMS image with focal point
          <img
            src={img.src}
            alt=""
            width={img.width}
            height={img.height}
            loading="lazy"
            className="h-full w-full object-cover"
            style={{ objectPosition: img.position }}
          />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        {cat && <span className="eyebrow">{cat}</span>}
        <H className="m-0 font-display text-[18px] leading-snug font-semibold text-ink-900">
          <Link
            href={`/blog/${post.slug}`}
            className="text-inherit no-underline after:absolute after:inset-0 group-hover:text-ocean-700"
          >
            {post.title}
          </Link>
        </H>
        {post.excerpt && (
          <p className="m-0 line-clamp-2 text-body-sm text-ink-700">{post.excerpt}</p>
        )}
        <div className="mt-auto pt-1">
          <PostMeta post={post} />
        </div>
      </div>
    </article>
  )
}

/** Large featured card: image left, text right (design: "Desktop · Blog"). */
export function FeaturedPost({ post }: { post: Post }) {
  const img = pickImage(post.cover, 'hero')
  const cat = categoryName(post)
  return (
    <article className="group relative grid overflow-hidden rounded-lg border border-line-200 bg-surface md:grid-cols-[1.2fr_1fr]">
      <div className="aspect-[16/10] bg-ocean-50 md:aspect-auto md:min-h-[320px]">
        {img && (
          // eslint-disable-next-line @next/next/no-img-element -- CMS image with focal point
          <img
            src={img.src}
            alt=""
            width={img.width}
            height={img.height}
            className="h-full w-full object-cover"
            style={{ objectPosition: img.position }}
          />
        )}
      </div>
      <div className="flex flex-col justify-center gap-3 p-6 md:p-8">
        <span className="eyebrow">Featured{cat ? ` · ${cat}` : ''}</span>
        <h2 className="heading-2 m-0">
          <Link
            href={`/blog/${post.slug}`}
            className="text-inherit no-underline after:absolute after:inset-0 group-hover:text-ocean-700"
          >
            {post.title}
          </Link>
        </h2>
        {post.excerpt && <p className="m-0 text-body text-ink-700">{post.excerpt}</p>}
        <PostMeta post={post} />
      </div>
    </article>
  )
}
