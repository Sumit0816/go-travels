/** Picks the right image size from a CMS media document (populated upload field). */

export type MediaSize = 'thumbnail' | 'card' | 'hero' | 'heroMobile' | 'og'

type SizeInfo = { url?: string | null; width?: number | null; height?: number | null }

export type MediaLike = {
  url?: string | null
  alt?: string | null
  width?: number | null
  height?: number | null
  focalX?: number | null
  focalY?: number | null
  sizes?: Partial<Record<MediaSize, SizeInfo>> | null
}

export type Img = { src: string; alt: string; width: number; height: number; position: string }

const isMedia = (m: unknown): m is MediaLike => !!m && typeof m === 'object' && 'url' in m

/**
 * The requested size, falling back to the original. Returns null for unpopulated IDs.
 * `position` is a CSS object-position from the focal point set in the CMS.
 */
export function pickImage(media: unknown, size: MediaSize): Img | null {
  if (!isMedia(media)) return null
  const s = media.sizes?.[size]
  const src = s?.url || media.url
  if (!src) return null
  return {
    src,
    alt: media.alt ?? '',
    width: s?.width || media.width || 1200,
    height: s?.height || media.height || 800,
    position: `${media.focalX ?? 50}% ${media.focalY ?? 50}%`,
  }
}

/** First populated image in a gallery. */
export function firstImage(gallery: unknown, size: MediaSize): Img | null {
  if (!Array.isArray(gallery)) return null
  for (const g of gallery) {
    const img = pickImage(g, size)
    if (img) return img
  }
  return null
}
