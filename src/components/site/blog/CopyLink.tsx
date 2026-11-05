'use client'

import { useState } from 'react'

import { Icon } from '@/components/ui/Icon'

/** "Copy link" share button; falls back to selecting nothing if the clipboard is blocked. */
export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      className="gt-btn gt-btn--outline gt-btn--sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url)
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        } catch {
          window.prompt('Copy this link', url)
        }
      }}
    >
      <Icon name={copied ? 'check' : 'share'} size={16} />
      <span aria-live="polite">{copied ? 'Copied' : 'Copy link'}</span>
    </button>
  )
}
