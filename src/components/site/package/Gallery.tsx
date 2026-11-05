'use client'

import { useRef, useState } from 'react'

import { Icon } from '@/components/ui/Icon'

export type GalleryImage = { src: string; full: string; alt: string; position: string }

/**
 * Package gallery: one large and four small photos, "+N photos" opens a full-screen viewer
 * (native <dialog>; arrow keys move, Escape closes).
 */
export function Gallery({
  images,
  tone,
  title,
}: {
  images: GalleryImage[]
  tone: string
  title: string
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [index, setIndex] = useState(0)
  const count = images.length

  if (!count) {
    return (
      <div
        className="gt-gallery gt-gallery--empty"
        style={{ background: `var(--color-dest-${tone})` }}
        aria-hidden="true"
      />
    )
  }

  const open = (i: number) => {
    setIndex(i)
    dialog.current?.showModal()
  }
  const go = (d: number) => setIndex((i) => (i + d + count) % count)
  const shown = images.slice(0, 5)

  return (
    <>
      <div className={`gt-gallery gt-gallery--${Math.min(count, 5)}`}>
        {shown.map((img, i) => (
          <button
            key={img.src}
            type="button"
            className="gt-gallery__item"
            onClick={() => open(i)}
            aria-label={`View photo ${i + 1} of ${count}${img.alt ? `: ${img.alt}` : ''}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- CMS image sized by the grid */}
            <img
              src={img.src}
              alt=""
              loading={i === 0 ? 'eager' : 'lazy'}
              fetchPriority={i === 0 ? 'high' : 'auto'}
              style={{ objectPosition: img.position }}
            />
            {img.alt && i > 0 && <span className="gt-gallery__caption">{img.alt}</span>}
            {i === shown.length - 1 && count > shown.length && (
              <span className="gt-gallery__more">+ {count - shown.length} photos</span>
            )}
          </button>
        ))}
        <span className="gt-gallery__count md:hidden" aria-hidden="true">
          1 / {count}
        </span>
      </div>

      <dialog
        ref={dialog}
        className="gt-lightbox"
        aria-label={`${title} photos`}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') go(1)
          if (e.key === 'ArrowLeft') go(-1)
        }}
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current?.close()
        }}
      >
        <figure className="m-0 flex h-full flex-col items-center justify-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- full-size CMS image */}
          <img
            src={images[index].full}
            alt={images[index].alt}
            className="max-h-[80dvh] max-w-full rounded-md object-contain"
          />
          <figcaption className="text-body-sm text-surface">
            {index + 1} / {count}
            {images[index].alt && ` · ${images[index].alt}`}
          </figcaption>
        </figure>
        <button
          type="button"
          className="gt-lightbox__btn gt-lightbox__close"
          aria-label="Close photos"
          onClick={() => dialog.current?.close()}
        >
          <Icon name="close" />
        </button>
        {count > 1 && (
          <>
            <button
              type="button"
              className="gt-lightbox__btn gt-lightbox__prev"
              aria-label="Previous photo"
              onClick={() => go(-1)}
            >
              <Icon name="chevronLeft" />
            </button>
            <button
              type="button"
              className="gt-lightbox__btn gt-lightbox__next"
              aria-label="Next photo"
              onClick={() => go(1)}
            >
              <Icon name="chevronRight" />
            </button>
          </>
        )}
      </dialog>
    </>
  )
}

/** Share (native share sheet, or copy link) and "Download PDF" (print to PDF). */
export function ShareActions({ title }: { title: string }) {
  const [copied, setCopied] = useState(false)
  const share = async () => {
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({ title, url }).catch(() => {})
    } else {
      await navigator.clipboard?.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2500)
    }
  }
  return (
    <div className="flex gap-2 print:hidden">
      <button type="button" className="gt-btn gt-btn--outline gt-btn--sm" onClick={share}>
        <Icon name="share" size={16} />
        {copied ? 'Link copied' : 'Share'}
      </button>
      <button
        type="button"
        className="gt-btn gt-btn--outline gt-btn--sm"
        onClick={() => window.print()}
      >
        Download PDF
      </button>
    </div>
  )
}
