/**
 * Copy rules from the design system (README → Content fundamentals):
 * - Prices: `₹12,499` with Indian digit grouping (`₹1,32,497`), no decimals.
 * - Durations: nights first, `3N / 4D`.
 * - WhatsApp numbers: Indian 10-digit mobiles, shown as `+91 98301 22457`.
 */

const inrFormatter = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })

/** `33998` → `₹33,998`; `132497` → `₹1,32,497`. */
export function formatINR(amount: number): string {
  if (!Number.isFinite(amount)) return '₹—'
  const rounded = Math.round(amount)
  const sign = rounded < 0 ? '-' : ''
  return `${sign}₹${inrFormatter.format(Math.abs(rounded))}`
}

/** `(3, 4)` → `3N / 4D`. Days default to nights + 1. */
export function formatDuration(nights: number, days: number = nights + 1): string {
  return `${nights}N / ${days}D`
}

/** `(2, 1)` → `2 Adults, 1 Child`. */
export function formatTravellers(adults: number, children = 0): string {
  const a = `${adults} Adult${adults === 1 ? '' : 's'}`
  if (!children) return a
  return `${a}, ${children} Child${children === 1 ? '' : 'ren'}`
}

/**
 * Strips spaces, dashes, a leading +91 / 91 / 0 and returns the 10 digits,
 * or null when it isn't a valid Indian mobile (starts with 6–9).
 */
export function normalizeIndianMobile(input: string): string | null {
  let digits = input.replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2)
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1)
  return /^[6-9]\d{9}$/.test(digits) ? digits : null
}

export function isValidIndianMobile(input: string): boolean {
  return normalizeIndianMobile(input) !== null
}

/** `9830122457` → `+91 98301 22457`. Returns the input unchanged if invalid. */
export function formatIndianMobile(input: string): string {
  const d = normalizeIndianMobile(input)
  return d ? `+91 ${d.slice(0, 5)} ${d.slice(5)}` : input
}

/** E.164 for WhatsApp APIs: `9830122457` → `919830122457`. */
export function toWhatsAppNumber(input: string): string | null {
  const d = normalizeIndianMobile(input)
  return d ? `91${d}` : null
}
