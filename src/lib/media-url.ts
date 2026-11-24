/**
 * Payload stores upload URLs with the server origin at upload time
 * (`http://localhost:3000/api/media/file/x.webp`). Served as paths instead, images keep working
 * when the domain changes (preview deployments, moving to the real domain) and stay same-origin
 * for the Content-Security-Policy. External URLs (e.g. a CDN) are left alone.
 */
export function relativeMediaUrl<T extends string | null | undefined>(url: T): T {
  if (typeof url !== 'string') return url
  const m = /^https?:\/\/[^/]+(\/api\/media\/file\/.+)$/i.exec(url)
  return (m ? m[1] : url) as T
}

type UploadDoc = {
  url?: string | null
  thumbnailURL?: string | null
  sizes?: Record<string, { url?: string | null } | null | undefined> | null
}

/** Rewrites the original and every size of a media document. */
export function withRelativeMediaUrls<T extends UploadDoc>(doc: T): T {
  if (!doc || typeof doc !== 'object') return doc
  const sizes = doc.sizes
    ? Object.fromEntries(
        Object.entries(doc.sizes).map(([k, v]) => [
          k,
          v ? { ...v, url: relativeMediaUrl(v.url) } : v,
        ]),
      )
    : doc.sizes
  return {
    ...doc,
    url: relativeMediaUrl(doc.url),
    thumbnailURL: relativeMediaUrl(doc.thumbnailURL),
    sizes,
  }
}
