'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { Icon } from '@/components/ui/Icon'

import { TripFinderForm } from './EnquiryForms'

type Defaults = { destination?: string; tripType?: string; packageSlug?: string; month?: string }

/**
 * "Find Your Perfect Trip" pop-up (design: EnquiryModal; a full-screen sheet on phones).
 * Any plain click on a /plan-my-trip link opens it instead of navigating; the link still works
 * as a page without JavaScript, in a new tab, and on the Plan My Trip page itself.
 */
export function EnquiryDialog({ whatsappHref }: { whatsappHref: string | null }) {
  const ref = useRef<HTMLDialogElement>(null)
  const pathname = usePathname()
  const [open, setOpen] = useState<{ key: number; defaults: Defaults } | null>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!a || a.target === '_blank' || a.dataset.noModal !== undefined) return
      const url = new URL(a.href, window.location.href)
      if (url.origin !== window.location.origin || url.pathname !== '/plan-my-trip') return
      if (window.location.pathname === '/plan-my-trip') return
      e.preventDefault()
      const p = url.searchParams
      setOpen({
        key: Date.now(),
        defaults: {
          destination: p.get('destination') ?? undefined,
          tripType: p.get('type') ?? undefined,
          packageSlug: p.get('package') ?? undefined,
          month: p.get('month') ?? undefined,
        },
      })
    }
    // Capture phase: runs before Next's <Link>, which then skips its own navigation.
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [])

  useEffect(() => {
    const d = ref.current
    if (open && d && !d.open) d.showModal()
  }, [open])

  // Close on navigation (e.g. a link inside the form).
  useEffect(() => {
    ref.current?.close()
  }, [pathname])

  return (
    <dialog
      ref={ref}
      className="gt-enquiry"
      aria-labelledby="enquiry-title"
      onClose={() => setOpen(null)}
      onClick={(e) => {
        // Backdrop click closes (the click lands on the <dialog> itself, outside the panel).
        if (e.target === e.currentTarget) e.currentTarget.close()
      }}
    >
      {open && (
        <div className="gt-enquiry__panel">
          <div className="gt-enquiry__head">
            <div>
              <h2 id="enquiry-title" className="m-0 font-display text-[22px] font-semibold">
                Find Your Perfect Trip
              </h2>
              <p className="mt-1 mb-0 text-body-sm text-ink-500">
                Tell us a little — we&apos;ll reply on WhatsApp with options and a quote.
              </p>
            </div>
            <button
              type="button"
              className="gt-btn gt-btn--ghost gt-btn--icon"
              aria-label="Close"
              onClick={() => ref.current?.close()}
            >
              <Icon name="close" size={22} />
            </button>
          </div>
          <TripFinderForm key={open.key} whatsappHref={whatsappHref} defaults={open.defaults} />
        </div>
      )}
    </dialog>
  )
}
