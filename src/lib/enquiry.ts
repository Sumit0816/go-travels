/**
 * Validation for the public enquiry forms ("Find Your Perfect Trip" and Contact Us).
 * Pure so it is unit-tested; the server action in src/app/(site)/actions.ts uses it.
 */
import { z } from 'zod'

import { BUDGETS, TRAVELLER_GROUPS, TRIP_TYPES } from '@/lib/catalog'
import { normalizeIndianMobile } from '@/lib/format'

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Please keep this under ${max} characters`)
    .optional()
    .transform((v) => (v ? v : undefined))

const optionalEnum = <T extends readonly { value: string }[]>(list: T) =>
  z
    .string()
    .optional()
    .transform((v) =>
      v && list.some((o) => o.value === v) ? (v as T[number]['value']) : undefined,
    )

export const CONTACT_SUBJECTS = [
  { label: 'Tour enquiry', value: 'tour' },
  { label: 'MICE / corporate', value: 'mice' },
  { label: 'Existing booking', value: 'booking' },
  { label: 'Other', value: 'other' },
] as const

export const enquirySchema = z.object({
  form: z.enum(['tripFinder', 'contactForm']),
  name: z
    .string()
    .trim()
    .min(2, 'Please enter your name')
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
  tripType: optionalEnum(TRIP_TYPES),
  destination: optionalText(120),
  travelMonth: z
    .string()
    .optional()
    .transform((v) => (v && /^\d{4}-\d{2}$/.test(v) ? v : undefined)),
  travellers: optionalEnum(TRAVELLER_GROUPS),
  budget: optionalEnum(BUDGETS),
  subject: optionalEnum(CONTACT_SUBJECTS),
  message: optionalText(2000),
  packageSlug: z
    .string()
    .optional()
    .transform((v) => (v && /^[a-z0-9-]{1,80}$/.test(v) ? v : undefined)),
})

export type EnquiryInput = z.infer<typeof enquirySchema>

export type FieldErrors = Partial<Record<keyof EnquiryInput, string>>

export function parseEnquiry(
  raw: Record<string, unknown>,
): { ok: true; data: EnquiryInput } | { ok: false; errors: FieldErrors } {
  const result = enquirySchema.safeParse(raw)
  const errors: FieldErrors = {}
  for (const issue of result.success ? [] : result.error.issues) {
    const key = issue.path[0] as keyof EnquiryInput
    if (key && !errors[key]) errors[key] = issue.message
  }
  // The contact form needs a message; reported together with any other errors.
  const message = typeof raw.message === 'string' ? raw.message.trim() : ''
  if (raw.form === 'contactForm' && !message && !errors.message) {
    errors.message = 'Please tell us how we can help'
  }
  if (result.success && !Object.keys(errors).length) return { ok: true, data: result.data }
  return { ok: false, errors }
}

/** Contact-form subject → the enquiry's trip type and a message prefix for the team. */
export function contactSubjectDetails(subject: EnquiryInput['subject']) {
  switch (subject) {
    case 'mice':
      return { tripType: 'mice' as const, prefix: 'MICE / corporate' }
    case 'booking':
      return { tripType: undefined, prefix: 'About an existing booking' }
    case 'other':
      return { tripType: undefined, prefix: 'Other' }
    default:
      return { tripType: undefined, prefix: 'Tour enquiry' }
  }
}
