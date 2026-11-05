import Link from 'next/link'

import { formatDuration, formatINR } from '@/lib/format'
import { cn } from '@/lib/cn'

import { StatusBadge } from './StatusBadge'

export type DestinationTone = 'coast' | 'desert' | 'forest' | 'romance' | 'pilgrim' | 'mountain'

export type PackageCardProps = {
  href: string
  title: string
  place: string
  nights: number
  days?: number
  /** Short inclusions line, e.g. `Hotel · Breakfast · Transfers`. */
  inclusions?: string
  /** Starting price per person in rupees. */
  price: number
  tag?: string
  imageUrl?: string
  imageAlt?: string
  /** Fallback tone when there is no photo. */
  tone?: DestinationTone
  ctaLabel?: 'Book Now' | 'View Details'
  className?: string
}

/**
 * Tour package card. The whole card is one link; the inner "button" is decorative
 * (a span styled as a button) so there is never a second link inside.
 */
export function PackageCard({
  href,
  title,
  place,
  nights,
  days,
  inclusions,
  price,
  tag,
  imageUrl,
  imageAlt = '',
  tone = 'coast',
  ctaLabel = 'Book Now',
  className,
}: PackageCardProps) {
  return (
    <Link href={href} className={cn('gt-card', className)}>
      <div className="gt-card__media" style={{ background: `var(--color-dest-${tone})` }}>
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- next/image wiring comes with CMS media in Phase 2
          <img src={imageUrl} alt={imageAlt} loading="lazy" />
        )}
        {tag && (
          <StatusBadge tone="tag" className="gt-card__tag">
            {tag}
          </StatusBadge>
        )}
        <span className="gt-card__place">{place}</span>
      </div>
      <div className="gt-card__body">
        <h3 className="gt-card__title">{title}</h3>
        <span className="gt-card__meta">
          <b>{formatDuration(nights, days)}</b>
          {inclusions && ` · ${inclusions}`}
        </span>
        <div className="gt-card__foot">
          <span className="gt-card__from">
            Starting from
            <span className="gt-card__price">{formatINR(price)}</span>
          </span>
          <span className="gt-btn gt-btn--primary gt-btn--sm" aria-hidden="true">
            {ctaLabel}
          </span>
        </div>
      </div>
    </Link>
  )
}
