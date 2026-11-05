import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

export type BadgeTone = 'success' | 'info' | 'warning' | 'danger' | 'neutral' | 'accent' | 'tag'

/** Status label → tone, from the design system's StatusBadge table. */
const TONE_BY_STATUS: Record<string, BadgeTone> = {
  delivered: 'success',
  published: 'success',
  approved: 'success',
  active: 'success',
  confirmed: 'success',
  live: 'success',
  connected: 'success',
  read: 'info',
  scheduled: 'info',
  contacted: 'info',
  'quote sent': 'info',
  queued: 'warning',
  draft: 'warning',
  pending: 'warning',
  invited: 'warning',
  failed: 'danger',
  archived: 'neutral',
  hidden: 'neutral',
  cancelled: 'neutral',
  closed: 'neutral',
  new: 'accent',
  featured: 'accent',
  converted: 'success',
}

export function toneForStatus(status: string): BadgeTone {
  return TONE_BY_STATUS[status.trim().toLowerCase()] ?? 'neutral'
}

type StatusBadgeProps = {
  /** Visible label — it carries the meaning, so keep it to one or two words. */
  children: ReactNode
  /** Explicit tone; otherwise derived from the label text. */
  tone?: BadgeTone
  className?: string
}

export function StatusBadge({ children, tone, className }: StatusBadgeProps) {
  const resolved = tone ?? (typeof children === 'string' ? toneForStatus(children) : 'neutral')
  return <span className={cn('gt-badge', `gt-badge--${resolved}`, className)}>{children}</span>
}
