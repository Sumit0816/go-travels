import Link from 'next/link'

import { cn } from '@/lib/cn'

type LogoMarkProps = { size?: number; onDark?: boolean; className?: string }

/**
 * The "G" journey loop opening toward a marigold sun. Inline SVG (exact copy of the
 * design-system logo files) so it needs no extra request.
 * Light grounds: ocean tile, white loop, marigold sun. Dark grounds: marigold tile, night loop, ocean sun.
 */
export function LogoMark({ size = 44, onDark = false, className }: LogoMarkProps) {
  const tile = onDark ? 'var(--color-marigold-500)' : 'var(--color-ocean-700)'
  const loop = onDark ? 'var(--color-night-900)' : 'var(--color-surface)'
  const sun = onDark ? 'var(--color-ocean-700)' : 'var(--color-marigold-500)'
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={cn('block shrink-0', className)}
    >
      <rect width="64" height="64" rx="16" fill={tile} />
      <path
        d="M42.7 23 A14 14 0 1 0 46 32 H34"
        fill="none"
        stroke={loop}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="48" cy="16.5" r="5" fill={sun} />
    </svg>
  )
}

type LogoProps = LogoMarkProps & { href?: string; tagline?: string; taglineClassName?: string }

/** Mark + "Go Travels" wordmark (Sora 700, "Go" in ocean-700 or marigold-500 on dark). */
export function Logo({
  size = 44,
  onDark = false,
  href = '/',
  tagline,
  taglineClassName,
  className,
}: LogoProps) {
  return (
    <Link
      href={href}
      className={cn('gt-brand', onDark && 'gt-brand--on-dark', className)}
      aria-label="Go Travels home"
    >
      <LogoMark size={size} onDark={onDark} />
      <span className="flex flex-col leading-tight">
        <span>
          <b>Go</b> Travels
        </span>
        {tagline && (
          <span
            className={cn(
              'text-[10px] font-semibold tracking-[0.14em] text-ink-500',
              taglineClassName,
            )}
          >
            {tagline}
          </span>
        )}
      </span>
    </Link>
  )
}
