import type { ReactNode } from 'react'

/** Server-safe building blocks for the custom CMS screens. */

const TONE: Record<string, string> = {
  delivered: 'success',
  read: 'info',
  sent: 'info',
  queued: 'warning',
  notSent: 'neutral',
  failed: 'danger',
  approved: 'success',
  pending: 'warning',
  hidden: 'neutral',
  new: 'accent',
  contacted: 'info',
  quoteSent: 'info',
  confirmed: 'success',
  converted: 'success',
  cancelled: 'neutral',
  closed: 'neutral',
  live: 'success',
  scheduled: 'info',
  ended: 'neutral',
}

export function Badge({ status, children }: { status: string; children?: ReactNode }) {
  return (
    <span className={`gta-badge gta-badge--${TONE[status] ?? 'neutral'}`}>
      {children ?? status}
    </span>
  )
}

export function Kpi({ label, value, note }: { label: string; value: ReactNode; note: string }) {
  return (
    <div className="gta-kpi">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  )
}

/** Status colours from the dashboard design (left edge of the inline status select). */
export const BOOKING_STATUS_COLOURS: Record<string, string> = {
  new: '#F2A541',
  contacted: '#5B8DB8',
  confirmed: '#2F8A5B',
  cancelled: '#A9B4BA',
}

export const WHATSAPP_LABELS: Record<string, string> = {
  notSent: 'Not sent',
  queued: 'Queued',
  sent: 'Sent',
  delivered: 'Delivered',
  read: 'Read',
  failed: 'Failed',
}

const dateFmt = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'Asia/Kolkata',
})
const timeFmt = new Intl.DateTimeFormat('en-IN', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Asia/Kolkata',
})

export const formatDate = (iso?: string | null) => (iso ? dateFmt.format(new Date(iso)) : '—')

/** "Today 12:41", "Yesterday 09:22" or "28 Oct" (India time). */
export function formatWhen(iso: string, now = new Date()): string {
  const d = new Date(iso)
  const day = (x: Date) => x.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  if (day(d) === day(now)) return `Today ${timeFmt.format(d)}`
  if (day(d) === day(yesterday)) return `Yesterday ${timeFmt.format(d)}`
  return dateFmt.format(d).replace(/ \d{4}$/, '')
}

export const ADMIN = '/admin'
export const docUrl = (collection: string, id: number | string) =>
  `${ADMIN}/collections/${collection}/${id}`
export const listUrl = (collection: string) => `${ADMIN}/collections/${collection}`

/** Builds a query string from defined values only. */
export function qs(params: Record<string, string | number | null | undefined>): string {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params))
    if (v !== undefined && v !== null && v !== '') sp.set(k, String(v))
  const s = sp.toString()
  return s ? `?${s}` : ''
}

export const param = (v: string | string[] | undefined): string | undefined =>
  Array.isArray(v) ? v[0] : v
