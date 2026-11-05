import Link from 'next/link'
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'

import { cn } from '@/lib/cn'

export type ButtonVariant = 'primary' | 'accent' | 'whatsapp' | 'outline' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

type CommonProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  block?: boolean
  className?: string
  children: ReactNode
}

type AsButton = CommonProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined }
type AsLink = CommonProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }

export type ButtonProps = AsButton | AsLink

export function buttonClasses({
  variant = 'primary',
  size = 'md',
  block,
  className,
}: Pick<CommonProps, 'variant' | 'size' | 'block' | 'className'>) {
  return cn(
    'gt-btn',
    `gt-btn--${variant}`,
    size !== 'md' && `gt-btn--${size}`,
    block && 'gt-btn--block',
    className,
  )
}

/**
 * Design-system Button. Renders an `<a>` (Next `Link` for internal paths) when `href`
 * is set, otherwise a `<button>`. Icon-only buttons (`size="icon"`) need `aria-label`.
 *
 * - primary: main action (Book Now, Continue, Search Tours)
 * - accent: at most one per view (Plan My Trip, Find Your Perfect Trip)
 * - whatsapp: only for actions that send to / open WhatsApp
 * - outline: secondary (Back, Call, Export CSV)
 */
export function Button(props: ButtonProps) {
  const { variant, size, block, className, children, ...rest } = props
  const classes = buttonClasses({ variant, size, block, className })

  if (typeof rest.href === 'string') {
    const { href, ...anchorProps } = rest as AsLink
    const external = /^(https?:|mailto:|tel:)/.test(href)
    if (external) {
      return (
        <a href={href} className={classes} {...anchorProps}>
          {children}
        </a>
      )
    }
    return (
      <Link href={href} className={classes} {...anchorProps}>
        {children}
      </Link>
    )
  }

  const { type = 'button', ...buttonProps } = rest as AsButton
  return (
    <button type={type} className={classes} {...buttonProps}>
      {children}
    </button>
  )
}
