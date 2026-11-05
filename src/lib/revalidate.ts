import { revalidateTag } from 'next/cache'

/**
 * Cache tags used by the public site. Pages fetch with these tags (Phase 4) and CMS hooks
 * invalidate them on publish, so edits appear within seconds.
 */
export const CACHE_TAGS = {
  packages: 'packages',
  package: (slug: string) => `package:${slug}`,
  destinations: 'destinations',
  categories: 'categories',
  posts: 'posts',
  post: (slug: string) => `post:${slug}`,
  pages: 'pages',
  page: (slug: string) => `page:${slug}`,
  testimonials: 'testimonials',
  slides: 'slides',
  media: 'media',
  global: (slug: string) => `global:${slug}`,
} as const

/**
 * Invalidates cache tags. Does nothing when called outside a Next.js request (seed script,
 * tests) or when the operation passes `context.disableRevalidate`.
 */
export function safeRevalidate(tags: string[], context?: Record<string, unknown>): void {
  if (context?.disableRevalidate) return
  for (const tag of tags) {
    try {
      revalidateTag(tag, 'max')
    } catch {
      // Not inside a Next.js request scope — nothing is cached here to invalidate.
    }
  }
}
