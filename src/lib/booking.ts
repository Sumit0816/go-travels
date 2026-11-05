/**
 * Booking request validation and pricing, shared by the booking form (per-step checks) and the
 * server action (full check). The server always re-prices from the package; the browser's
 * estimate is only for display.
 */
import { z } from 'zod'

import { HOTEL_CATEGORIES } from '@/lib/catalog'
import { normalizeIndianMobile } from '@/lib/format'
import { estimateTotal } from '@/lib/pricing'

export const MAX_ADULTS = 9
export const MAX_CHILDREN = 6
export const MAX_ROOMS = 5

const hotelValues = HOTEL_CATEGORIES.map((h) => h.value) as [string, ...string[]]

/** Today's date in India as `YYYY-MM-DD` (the site's customers and staff are in IST). */
export function todayInIndia(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(now)
}

function addYears(isoDate: string, years: number): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  return `${y! + years}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

const trimmed = (max: number, message = `Please keep this under ${max} characters`) =>
  z
    .string()
    .trim()
    .max(max, message)
    .optional()
    .transform((v) => (v ? v : undefined))

const count = (min: number, max: number, label: string) =>
  z.coerce.number().int().min(min, `${label}: at least ${min}`).max(max, `${label}: at most ${max}`)

export function bookingSchema(today = todayInIndia()) {
  return z.object({
    packageSlug: z.string().regex(/^[a-z0-9-]{1,80}$/, 'Unknown package'),
    travelDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Please choose a travel date')
      .refine((v) => v >= today, 'Please choose a date from today onwards')
      .refine((v) => v <= addYears(today, 2), 'Please choose a date within the next two years'),
    departureCity: trimmed(60),
    hotel: z.enum(hotelValues, { message: 'Please choose a hotel category' }),
    rooms: count(1, MAX_ROOMS, 'Rooms'),
    adults: count(1, MAX_ADULTS, 'Adults'),
    children: count(0, MAX_CHILDREN, 'Children'),
    addOns: z.array(z.string().trim().max(80)).max(10).default([]),
    name: z
      .string()
      .trim()
      .min(2, 'Please enter your full name')
      .max(80, 'Please keep your name under 80 characters'),
    whatsapp: z
      .string()
      .trim()
      .refine((v) => normalizeIndianMobile(v) !== null, 'Enter a valid 10-digit mobile number')
      .transform((v) => normalizeIndianMobile(v)!),
    email: z
      .string()
      .trim()
      .optional()
      .transform((v) => (v ? v : undefined))
      .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Enter a valid email address'),
    city: trimmed(60),
    specialRequests: trimmed(500),
    consent: z.literal(true, { message: 'Please accept to continue' }),
  })
}

export type BookingInput = z.infer<ReturnType<typeof bookingSchema>>
export type BookingField = keyof BookingInput
export type BookingErrors = Partial<Record<BookingField, string>>

/** Which fields each form step owns, so a step can be checked before moving on. */
export const STEP_FIELDS: Record<1 | 2, BookingField[]> = {
  1: ['travelDate', 'departureCity', 'hotel', 'rooms', 'adults', 'children', 'addOns'],
  2: ['name', 'whatsapp', 'email', 'city', 'specialRequests', 'consent'],
}

export function parseBooking(
  raw: unknown,
  today?: string,
): { ok: true; data: BookingInput } | { ok: false; errors: BookingErrors } {
  const result = bookingSchema(today).safeParse(raw)
  if (result.success) {
    if (result.data.rooms > result.data.adults) {
      return { ok: false, errors: { rooms: 'Each room needs at least one adult' } }
    }
    return { ok: true, data: result.data }
  }
  const errors: BookingErrors = {}
  for (const issue of result.error.issues) {
    const key = issue.path[0] as BookingField
    if (key && !errors[key]) errors[key] = issue.message
  }
  return { ok: false, errors }
}

/** Errors for one step only (used by "Continue"). */
export function stepErrors(raw: unknown, step: 1 | 2, today?: string): BookingErrors {
  const r = parseBooking(raw, today)
  if (r.ok) return {}
  const own = STEP_FIELDS[step]
  return Object.fromEntries(
    Object.entries(r.errors).filter(([k]) => own.includes(k as BookingField)),
  ) as BookingErrors
}

type PricedPackage = {
  hotelOptions: { category: string; price: number }[]
  childPricePercent?: number | null
  addOns?: { name: string; price?: number | null }[] | null
}

export type BookingQuote = {
  adultPrice: number
  addOns: { name: string; price: number }[]
  total: number
}

/**
 * Prices a request against the package. Unknown hotels are an error; unknown add-ons are
 * dropped. Add-on prices are per booking.
 */
export function quoteBooking(
  pkg: PricedPackage,
  b: Pick<BookingInput, 'hotel' | 'adults' | 'children' | 'addOns'>,
): BookingQuote | null {
  const hotel = pkg.hotelOptions.find((h) => h.category === b.hotel)
  if (!hotel) return null
  const addOns = (pkg.addOns ?? [])
    .filter((a) => b.addOns.includes(a.name))
    .map((a) => ({ name: a.name, price: Math.max(0, a.price ?? 0) }))
  const travellers = estimateTotal({
    adultPrice: hotel.price,
    adults: b.adults,
    children: b.children,
    childPercent: pkg.childPricePercent,
  })
  return {
    adultPrice: hotel.price,
    addOns,
    total: travellers + addOns.reduce((sum, a) => sum + a.price, 0),
  }
}
