/** Pure helpers behind the custom CMS screens (kept free of Payload/React so they're unit-tested). */

/** Escapes one CSV cell, and neutralises spreadsheet formulas (=, +, -, @) to prevent CSV injection. */
export function csvCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  let s = String(value)
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function toCsv(header: string[], rows: unknown[][]): string {
  return [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n'
}

/** Travellers group on an enquiry → adults/children on the booking it converts into. */
export function travellersToPax(group: string | null | undefined): {
  adults: number
  children: number
} {
  switch (group) {
    case 'solo':
      return { adults: 1, children: 0 }
    case 'family-2-2':
      return { adults: 2, children: 2 }
    case 'group-6':
      return { adults: 6, children: 0 }
    default:
      return { adults: 2, children: 0 }
  }
}

/** `2027-02` → first of that month (ISO); otherwise 30 days from `now`. */
export function travelDateFromMonth(month: string | null | undefined, now = new Date()): string {
  const m = month?.match(/^(\d{4})-(\d{2})$/)
  if (m) {
    const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, 1))
    if (!Number.isNaN(d.getTime())) return d.toISOString()
  }
  return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
}

type EnquiryLike = {
  id: number
  name: string
  whatsapp: string
  email?: string | null
  travelMonth?: string | null
  travellers?: string | null
  destination?: string | null
  message?: string | null
  package?:
    | number
    | {
        id: number
        title?: string | null
        durationNights?: number | null
        durationDays?: number | null
      }
    | null
  assignedTo?: number | { id: number } | null
}

/** Booking data created by "Convert to booking" on an enquiry. */
export function enquiryToBookingData(e: EnquiryLike, now = new Date()) {
  const pkg = e.package && typeof e.package === 'object' ? e.package : null
  const pkgId = typeof e.package === 'number' ? e.package : pkg?.id
  const assigned = typeof e.assignedTo === 'object' ? e.assignedTo?.id : e.assignedTo
  const notes = [e.destination && `Destination: ${e.destination}`, e.message]
    .filter(Boolean)
    .join('\n')
  return {
    ...travellersToPax(e.travellers),
    name: e.name,
    whatsapp: e.whatsapp,
    email: e.email ?? undefined,
    travelDate: travelDateFromMonth(e.travelMonth, now),
    package: pkgId ?? undefined,
    packageSnapshot: pkg?.title
      ? {
          title: pkg.title,
          duration:
            pkg.durationNights != null
              ? `${pkg.durationNights}N / ${pkg.durationDays ?? pkg.durationNights + 1}D`
              : undefined,
        }
      : undefined,
    specialRequests: notes || undefined,
    status: 'new' as const,
    source: 'enquiry' as const,
    fromEnquiry: e.id,
    assignedTo: assigned ?? undefined,
  }
}

export type SlideState = 'live' | 'scheduled' | 'ended' | 'hidden'

/** Homepage slide state shown in the CMS list (design: Live / Scheduled / Hidden). */
export function slideState(
  s: { active?: boolean | null; showFrom?: string | null; showUntil?: string | null },
  now = new Date(),
): SlideState {
  if (!s.active) return 'hidden'
  if (s.showFrom && new Date(s.showFrom) > now) return 'scheduled'
  if (s.showUntil && new Date(s.showUntil) < now) return 'ended'
  return 'live'
}

/** Share of alerts delivered or read, as a whole percentage (null when nothing was sent). */
export function deliveryRate(counts: {
  delivered: number
  read: number
  total: number
}): number | null {
  if (!counts.total) return null
  return Math.round(((counts.delivered + counts.read) / counts.total) * 1000) / 10
}

/** `https://wa.me/919830122457?text=…` for "Reply on WhatsApp". */
export function waMeLink(phone10: string, text?: string): string {
  const digits = phone10.replace(/\D/g, '')
  const full = digits.length === 10 ? `91${digits}` : digits
  return `https://wa.me/${full}${text ? `?text=${encodeURIComponent(text)}` : ''}`
}
