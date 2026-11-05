'use server'

import { headers } from 'next/headers'

import { payloadClient } from '@/lib/cms'
import { contactSubjectDetails, parseEnquiry, type FieldErrors } from '@/lib/enquiry'
import { createRateLimiter } from '@/lib/rate-limit'
import { queueEnquiryAlert } from '@/lib/whatsapp/queue'

export type EnquiryState =
  | { status: 'idle' }
  | { status: 'error'; message: string; errors?: FieldErrors; values?: Record<string, string> }
  | { status: 'success'; enquiryId: string; name: string }

// 5 enquiries per visitor per 10 minutes.
const limiter = createRateLimiter({ limit: 5, windowMs: 10 * 60 * 1000 })

/**
 * Public enquiry forms ("Find Your Perfect Trip", Contact Us). Saves the enquiry in the CMS
 * (it appears in Enquiries straight away) and queues the WhatsApp alert for the team.
 */
export async function submitEnquiry(
  _prev: EnquiryState,
  formData: FormData,
): Promise<EnquiryState> {
  const raw = Object.fromEntries(
    [...formData.entries()].map(([k, v]) => [k, typeof v === 'string' ? v : '']),
  ) as Record<string, string>

  // Spam trap: real visitors never see or fill this field. Pretend success, save nothing.
  if (raw.website) return { status: 'success', enquiryId: '', name: raw.name ?? '' }

  const parsed = parseEnquiry(raw)
  if (!parsed.ok) {
    return {
      status: 'error',
      message: 'Please check the highlighted fields.',
      errors: parsed.errors,
      values: raw,
    }
  }

  const h = await headers()
  const ip =
    (h.get('x-forwarded-for') ?? '').split(',')[0].trim() || h.get('x-real-ip') || 'unknown'
  if (!limiter.check(`enquiry:${ip}`)) {
    return {
      status: 'error',
      message:
        'You have sent several enquiries in a short time. Please wait a few minutes, or message us on WhatsApp.',
      values: raw,
    }
  }

  const d = parsed.data
  try {
    const payload = await payloadClient()
    const pkg = d.packageSlug
      ? (
          await payload.find({
            collection: 'packages',
            where: { slug: { equals: d.packageSlug } },
            limit: 1,
            depth: 0,
            overrideAccess: false,
          })
        ).docs[0]
      : undefined

    const contact = d.form === 'contactForm' ? contactSubjectDetails(d.subject) : null
    const enquiry = await payload.create({
      collection: 'enquiries',
      data: {
        name: d.name,
        whatsapp: d.whatsapp,
        email: d.email,
        tripType: contact?.tripType ?? d.tripType,
        destination: d.destination,
        travelMonth: d.travelMonth,
        travellers: d.travellers,
        budget: d.budget,
        message: contact ? `${contact.prefix}: ${d.message ?? ''}`.trim() : d.message,
        package: pkg?.id,
        source: d.form,
        status: 'new',
        whatsappStatus: 'notSent',
      },
      overrideAccess: true,
    })
    await queueEnquiryAlert(payload, enquiry.id)
    return { status: 'success', enquiryId: enquiry.enquiryId ?? '', name: d.name }
  } catch (err) {
    console.error('Enquiry could not be saved', err)
    return {
      status: 'error',
      message:
        "We couldn't send your enquiry just now. Please try again, or message us on WhatsApp.",
      values: raw,
    }
  }
}
