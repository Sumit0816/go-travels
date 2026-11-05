import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { cn } from '@/lib/cn'

type ChipProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-pressed'> & {
  pressed?: boolean
  /** Tinted selected state for filter values inside a panel. */
  soft?: boolean
  children: ReactNode
}

/** Pill toggle for destination tabs, filters and trip-type pickers. */
export function Chip({
  pressed = false,
  soft,
  className,
  children,
  type = 'button',
  ...rest
}: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={pressed}
      className={cn('gt-chip', soft && 'gt-chip--soft', className)}
      {...rest}
    >
      {children}
    </button>
  )
}
