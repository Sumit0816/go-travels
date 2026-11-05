/**
 * WhatsApp message content. Each template has an ordered variable list (the order the approved
 * Meta template uses for {{1}}, {{2}} …) and a text renderer that produces exactly what the
 * recipient sees, used for the success-screen preview, the console adapter and email fallback.
 */
import { hotelCategoryLabel } from '@/lib/catalog'
import { formatINR, formatIndianMobile, formatTravellers } from '@/lib/format'

export const BOOKING_TEMPLATE_VARIABLES = [
  'request_id',
  'package_name',
  'duration',
  'travel_date',
  'departure_city',
  'travellers',
  'hotel_category',
  'customer_name',
  'customer_phone',
  'estimated_total',
  'special_requests',
] as const

export const ENQUIRY_TEMPLATE_VARIABLES = [
  'enquiry_id',
  'customer_name',
  'customer_phone',
  'trip_type',
  'destination',
  'travel_month',
  'travellers',
  'budget',
  'message',
] as const

export const CUSTOMER_TEMPLATE_VARIABLES = [
  'customer_name',
  'request_id',
  'package_name',
  'travel_date',
] as const

export type TemplateKind = 'booking' | 'enquiry' | 'customerCopy' | 'test'
export type Variables = Record<string, string>

const dateFmt = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})
const monthFmt = new Intl.DateTimeFormat('en-IN', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

/** `2026-12-18` (or an ISO timestamp) → `18 Dec 2026`. */
export function formatTripDate(value: string | null | undefined): string {
  if (!value) return '—'
  const d = new Date(value.length === 10 ? `${value}T00:00:00Z` : value)
  return Number.isNaN(d.getTime()) ? value : dateFmt.format(d)
}

/** `2027-02` → `February 2027`. */
export function formatTripMonth(value: string | null | undefined): string {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return value || '—'
  return monthFmt.format(new Date(`${value}-01T00:00:00Z`))
}

export type BookingMessageInput = {
  requestId: string
  packageTitle: string
  duration: string
  travelDate: string
  departureCity?: string | null
  adults: number
  children?: number | null
  hotelCategory: string
  rooms?: number | null
  name: string
  whatsapp: string
  estimatedTotal?: number | null
  addOns?: string[] | null
  specialRequests?: string | null
}

/** Template values for a booking alert. Add-ons travel inside special_requests. */
export function bookingVariables(b: BookingMessageInput): Variables {
  const rooms = b.rooms ?? 1
  const notes = [b.addOns?.length ? `Add-ons: ${b.addOns.join(', ')}` : '', b.specialRequests ?? '']
    .map((s) => s.trim())
    .filter(Boolean)
    .join('. ')
  return {
    request_id: b.requestId,
    package_name: b.packageTitle,
    duration: b.duration,
    travel_date: formatTripDate(b.travelDate),
    departure_city: b.departureCity || '—',
    travellers: formatTravellers(b.adults, b.children ?? 0),
    hotel_category: `${hotelCategoryLabel(b.hotelCategory)} · ${rooms} room${rooms === 1 ? '' : 's'}`,
    customer_name: b.name,
    customer_phone: formatIndianMobile(b.whatsapp),
    estimated_total: b.estimatedTotal ? formatINR(b.estimatedTotal) : '—',
    special_requests: notes || '—',
  }
}

export function renderBookingMessage(v: Variables): string {
  return [
    `*New Booking Request* · ${v.request_id}`,
    `Package: ${v.package_name} (${v.duration})`,
    `Date: ${v.travel_date} · From: ${v.departure_city}`,
    `Travellers: ${v.travellers}`,
    `Hotel: ${v.hotel_category}`,
    `Name: ${v.customer_name}`,
    `WhatsApp: ${v.customer_phone}`,
    `Est. total: ${v.estimated_total}`,
    `Notes: ${v.special_requests}`,
  ].join('\n')
}

export type EnquiryMessageInput = {
  enquiryId: string
  name: string
  whatsapp: string
  tripType?: string | null
  destination?: string | null
  travelMonth?: string | null
  travellers?: string | null
  budget?: string | null
  message?: string | null
  packageTitle?: string | null
}

const labelFrom = (list: readonly { label: string; value: string }[], v?: string | null) =>
  (v && list.find((o) => o.value === v)?.label) || v || '—'

export function enquiryVariables(
  e: EnquiryMessageInput,
  lists: {
    tripTypes: readonly { label: string; value: string }[]
    travellers: readonly { label: string; value: string }[]
    budgets: readonly { label: string; value: string }[]
  },
): Variables {
  const destination = [e.destination, e.packageTitle && `(${e.packageTitle})`]
    .filter(Boolean)
    .join(' ')
  return {
    enquiry_id: e.enquiryId,
    customer_name: e.name,
    customer_phone: formatIndianMobile(e.whatsapp),
    trip_type: labelFrom(lists.tripTypes, e.tripType),
    destination: destination || '—',
    travel_month: formatTripMonth(e.travelMonth),
    travellers: labelFrom(lists.travellers, e.travellers),
    budget: labelFrom(lists.budgets, e.budget),
    message: e.message?.trim() || '—',
  }
}

export function renderEnquiryMessage(v: Variables): string {
  return [
    `*New Enquiry* · ${v.enquiry_id}`,
    `Name: ${v.customer_name}`,
    `WhatsApp: ${v.customer_phone}`,
    `Trip: ${v.trip_type} · ${v.destination}`,
    `When: ${v.travel_month} · Travellers: ${v.travellers}`,
    `Budget: ${v.budget}`,
    `Message: ${v.message}`,
  ].join('\n')
}

export function customerVariables(b: BookingMessageInput): Variables {
  return {
    customer_name: b.name,
    request_id: b.requestId,
    package_name: b.packageTitle,
    travel_date: formatTripDate(b.travelDate),
  }
}

export function renderCustomerMessage(v: Variables): string {
  return [
    `Hi ${v.customer_name}, thank you for choosing Go Travels!`,
    `We've received your booking request *${v.request_id}* for ${v.package_name} on ${v.travel_date}.`,
    'Our travel expert will reply here shortly to confirm availability and the final price.',
  ].join('\n')
}

export function renderTestMessage(v: Variables): string {
  return `*Go Travels test message* · ${v.sent_at}\nYour WhatsApp alerts are connected.`
}

const ORDER: Record<TemplateKind, readonly string[]> = {
  booking: BOOKING_TEMPLATE_VARIABLES,
  enquiry: ENQUIRY_TEMPLATE_VARIABLES,
  customerCopy: CUSTOMER_TEMPLATE_VARIABLES,
  test: ['sent_at'],
}

/** Values in template order ({{1}}, {{2}} …). WhatsApp rejects empty or multi-line params. */
export function orderedParams(kind: TemplateKind, v: Variables): string[] {
  return ORDER[kind].map((k) => (v[k] ?? '—').replace(/\s*\n+\s*/g, ' ').trim() || '—')
}

export function renderMessage(kind: TemplateKind, v: Variables): string {
  switch (kind) {
    case 'booking':
      return renderBookingMessage(v)
    case 'enquiry':
      return renderEnquiryMessage(v)
    case 'customerCopy':
      return renderCustomerMessage(v)
    default:
      return renderTestMessage(v)
  }
}
