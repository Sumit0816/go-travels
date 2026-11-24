'use client'

import { useEffect } from 'react'

import { track } from '@/lib/analytics'

/** Sends `whatsapp_click` for every link to WhatsApp (header, floating button, package pages …). */
export function AnalyticsEvents() {
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!a || !/^https:\/\/(wa\.me|api\.whatsapp\.com)\//.test(a.href)) return
      track('whatsapp_click', { page: window.location.pathname })
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [])
  return null
}
