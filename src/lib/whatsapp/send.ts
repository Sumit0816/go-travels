/**
 * Sends WhatsApp alerts and keeps the delivery log, booking and enquiry statuses in step.
 *
 * Every message is a `messageLog` row: created "queued", sent straight away, and on a retryable
 * failure tried again by `processDueMessages` (a cron hits /api/whatsapp/process each minute)
 * after 1, 5 and 15 minutes. When every team alert for a booking or enquiry has failed, the
 * fallback email goes out once.
 */
import type { Payload } from 'payload'

import { BUDGETS, TRAVELLER_GROUPS, TRIP_TYPES } from '@/lib/catalog'
import { decryptSecret } from '@/lib/crypto'
import { toWhatsAppNumber } from '@/lib/format'
import type { Booking, Enquiry, MessageLog, WhatsappSetting } from '@/payload-types'

import { SendError, sendingAdapter, type ProviderConfig } from './adapters'
import {
  bookingVariables,
  customerVariables,
  enquiryVariables,
  orderedParams,
  renderMessage,
  type BookingMessageInput,
  type TemplateKind,
  type Variables,
} from './messages'
import { combineStatuses, nextAttemptAt, type LogStatus, type ParentStatus } from './status'

type Kind = MessageLog['kind']

const TEMPLATE_FOR: Record<Kind, keyof WhatsappSetting | null> = {
  booking: 'bookingTemplate',
  enquiry: 'enquiryTemplate',
  customerCopy: 'customerTemplate',
  reviewLink: 'reviewTemplate',
  test: 'bookingTemplate',
}

export async function loadWhatsAppSettings(payload: Payload) {
  const settings = await payload.findGlobal({
    slug: 'whatsappSettings',
    overrideAccess: true,
    depth: 0,
  })
  let apiKey = ''
  if (settings.apiKey) {
    try {
      apiKey = decryptSecret(settings.apiKey)
    } catch (err) {
      payload.logger.error(
        { err },
        'WhatsApp API key could not be decrypted (check WHATSAPP_ENC_KEY)',
      )
    }
  }
  const sender = (settings.senderNumber ?? '').replace(/\D/g, '')
  const cfg: ProviderConfig | null =
    apiKey && sender ? { apiKey, sender, appName: settings.appName } : null
  return { settings, adapter: sendingAdapter(settings.provider, cfg) }
}

const templateOf = (settings: WhatsappSetting, kind: Kind) => {
  const key = TEMPLATE_FOR[kind]
  const t = key
    ? (settings[key] as { name?: string | null; language?: string | null } | undefined)
    : undefined
  return { name: t?.name ?? '', language: t?.language || 'en' }
}

type NewMessage = {
  kind: Kind
  reference: string
  recipientLabel: string
  phone: string
  variables: Variables
  booking?: number
  enquiry?: number
}

async function createMessage(payload: Payload, settings: WhatsappSetting, m: NewMessage) {
  const template = templateOf(settings, m.kind)
  const templateKind: TemplateKind = m.kind === 'test' ? 'booking' : (m.kind as TemplateKind)
  return payload.create({
    collection: 'messageLog',
    data: {
      reference: m.reference,
      kind: m.kind,
      booking: m.booking,
      enquiry: m.enquiry,
      recipientLabel: m.recipientLabel,
      phone: m.phone,
      provider: settings.provider,
      template: template.name || undefined,
      language: template.language,
      params: orderedParams(templateKind, m.variables),
      body: renderMessage(templateKind, m.variables),
      status: 'queued',
      attempts: 0,
      nextAttemptAt: new Date().toISOString(),
    },
    overrideAccess: true,
  })
}

/**
 * One attempt at sending a logged message. Returns the row's new status. `retries: false`
 * (test messages) gives up after the first failure.
 */
export async function sendMessage(
  payload: Payload,
  log: MessageLog,
  opts: { retries?: boolean; now?: Date } = {},
): Promise<LogStatus> {
  const now = opts.now ?? new Date()
  const { settings, adapter } = await loadWhatsAppSettings(payload)
  const attempts = (log.attempts ?? 0) + 1
  // Indian mobiles in any format, or a full international number (11–15 digits).
  const digits = log.phone.replace(/\D/g, '')
  const to = toWhatsAppNumber(log.phone) ?? (/^\d{11,15}$/.test(digits) ? digits : null)

  let status: LogStatus
  let data: Partial<MessageLog>
  try {
    if (!to) throw new SendError(`"${log.phone}" is not a valid WhatsApp number`, false)
    const res = await adapter.send({
      to,
      template: { name: log.template ?? '', language: log.language || 'en' },
      params: Array.isArray(log.params) ? (log.params as string[]) : [],
      text: log.body ?? '',
    })
    status = 'sent'
    data = {
      status,
      attempts,
      providerMessageId: res.providerMessageId,
      error: null,
      nextAttemptAt: null,
    }
  } catch (err) {
    const retryable = err instanceof SendError ? err.retryable : true
    const next = opts.retries === false ? null : nextAttemptAt(attempts, retryable, now)
    status = next ? 'queued' : 'failed'
    data = {
      status,
      attempts,
      error: (err as Error).message.slice(0, 500),
      nextAttemptAt: next ? next.toISOString() : null,
    }
    payload.logger.warn(`WhatsApp ${log.reference} to ${log.recipientLabel}: ${data.error}`)
  }

  await payload.update({
    collection: 'messageLog',
    id: log.id,
    data,
    overrideAccess: true,
  })
  if (log.kind === 'booking' || log.kind === 'enquiry') {
    await refreshParent(payload, log, settings)
  }
  return status
}

const relId = (v: unknown) =>
  typeof v === 'object' && v ? (v as { id: number }).id : (v as number | null | undefined)

/** Recomputes the booking's / enquiry's WhatsApp status; sends the fallback email on first failure. */
export async function refreshParent(
  payload: Payload,
  log: Pick<MessageLog, 'kind' | 'booking' | 'enquiry' | 'reference'>,
  settings?: WhatsappSetting,
): Promise<ParentStatus | null> {
  const collection =
    log.kind === 'booking' ? 'bookings' : log.kind === 'enquiry' ? 'enquiries' : null
  const id = collection === 'bookings' ? relId(log.booking) : relId(log.enquiry)
  if (!collection || !id) return null

  const { docs } = await payload.find({
    collection: 'messageLog',
    where: {
      [collection === 'bookings' ? 'booking' : 'enquiry']: { equals: id },
      kind: { equals: log.kind },
    },
    sort: '-createdAt',
    limit: 50,
    depth: 0,
    overrideAccess: true,
  })
  // Only the latest round counts: a resend starts a new set of rows.
  const latestRound = docs.filter(
    (d) =>
      Math.abs(new Date(d.createdAt).getTime() - new Date(docs[0]!.createdAt).getTime()) < 60_000,
  )
  const status = combineStatuses(latestRound.map((d) => d.status))
  const parent = (await payload.findByID({ collection, id, depth: 0, overrideAccess: true })) as
    Booking | Enquiry
  if (parent.whatsappStatus === status) return status

  await payload.update({
    collection,
    id,
    data: { whatsappStatus: status },
    overrideAccess: true,
    context: { disableRevalidate: true },
  })
  if (status === 'failed') {
    await sendFallbackEmail(
      payload,
      settings ?? (await loadWhatsAppSettings(payload)).settings,
      log.reference,
      latestRound,
    )
  }
  return status
}

async function sendFallbackEmail(
  payload: Payload,
  settings: WhatsappSetting,
  reference: string,
  logs: MessageLog[],
) {
  if (!settings.emailFallback || !settings.fallbackEmail) return
  const first = logs.find((l) => l.body) ?? logs[0]
  const errors = [
    ...new Set(logs.map((l) => `${l.recipientLabel ?? l.phone}: ${l.error ?? 'failed'}`)),
  ]
  try {
    await payload.sendEmail({
      to: settings.fallbackEmail,
      subject: `WhatsApp alert failed: ${reference}`,
      text: [
        `The WhatsApp alert for ${reference} could not be delivered, so here it is by email.`,
        '',
        (first?.body ?? '').replace(/\*/g, ''),
        '',
        'Delivery errors:',
        ...errors,
        '',
        'Open the CMS to follow up and use "Resend" once WhatsApp is working.',
      ].join('\n'),
    })
  } catch (err) {
    payload.logger.error({ err }, `Fallback email for ${reference} could not be sent`)
  }
}

function recipientsOf(settings: WhatsappSetting) {
  const list = settings.recipients ?? []
  return [...list].sort((a, b) => Number(Boolean(b.isPrimary)) - Number(Boolean(a.isPrimary)))
}

/** Sends a batch, then reports whether at least one team alert went out. */
async function sendAll(payload: Payload, logs: MessageLog[]) {
  const results = await Promise.all(logs.map((l) => sendMessage(payload, l)))
  return logs.some((l, i) => l.kind !== 'customerCopy' && results[i] === 'sent')
}

export function bookingMessageInput(b: Booking): BookingMessageInput {
  return {
    requestId: b.requestId ?? `booking-${b.id}`,
    packageTitle: b.packageSnapshot?.title ?? 'Tour package',
    duration: b.packageSnapshot?.duration ?? '',
    travelDate: b.travelDate,
    departureCity: b.departureCity,
    adults: b.adults,
    children: b.children,
    hotelCategory: b.hotelCategory ?? '',
    rooms: b.rooms,
    name: b.name,
    whatsapp: b.whatsapp,
    estimatedTotal: b.estimatedTotal,
    addOns: b.addOns,
    specialRequests: b.specialRequests,
  }
}

export type DispatchResult = { sent: boolean; text: string }

/**
 * Sends the team alert for a booking to every recipient (plus the customer copy when switched
 * on). Used for new bookings and "Resend".
 */
export async function dispatchBookingAlert(
  payload: Payload,
  bookingId: number,
  opts: { customerCopy?: boolean } = {},
): Promise<DispatchResult> {
  const booking = await payload.findByID({
    collection: 'bookings',
    id: bookingId,
    depth: 0,
    overrideAccess: true,
  })
  const { settings } = await loadWhatsAppSettings(payload)
  const input = bookingMessageInput(booking)
  const vars = bookingVariables(input)
  const reference = input.requestId
  const recipients = recipientsOf(settings)

  const logs: MessageLog[] = []
  for (const r of recipients.length ? recipients : [{ label: 'Team', phone: '—' }]) {
    logs.push(
      await createMessage(payload, settings, {
        kind: 'booking',
        reference,
        recipientLabel: r.label,
        phone: r.phone,
        variables: vars,
        booking: booking.id,
      }),
    )
  }
  if ((opts.customerCopy ?? true) && settings.sendCustomerCopy) {
    logs.push(
      await createMessage(payload, settings, {
        kind: 'customerCopy',
        reference,
        recipientLabel: 'Customer',
        phone: booking.whatsapp,
        variables: customerVariables(input),
        booking: booking.id,
      }),
    )
  }
  await payload.update({
    collection: 'bookings',
    id: booking.id,
    data: { whatsappStatus: 'queued' },
    overrideAccess: true,
    context: { disableRevalidate: true },
  })
  return { sent: await sendAll(payload, logs), text: renderMessage('booking', vars) }
}

/** Sends the team alert for an enquiry to every recipient. */
export async function dispatchEnquiryAlert(
  payload: Payload,
  enquiryId: number,
): Promise<DispatchResult> {
  const enquiry = await payload.findByID({
    collection: 'enquiries',
    id: enquiryId,
    depth: 1,
    overrideAccess: true,
  })
  const { settings } = await loadWhatsAppSettings(payload)
  const pkg = typeof enquiry.package === 'object' ? enquiry.package : null
  const vars = enquiryVariables(
    {
      enquiryId: enquiry.enquiryId ?? `enquiry-${enquiry.id}`,
      name: enquiry.name,
      whatsapp: enquiry.whatsapp,
      tripType: enquiry.tripType,
      destination: enquiry.destination,
      travelMonth: enquiry.travelMonth,
      travellers: enquiry.travellers,
      budget: enquiry.budget,
      message: enquiry.message,
      packageTitle: pkg?.title,
    },
    { tripTypes: TRIP_TYPES, travellers: TRAVELLER_GROUPS, budgets: BUDGETS },
  )
  const recipients = recipientsOf(settings)
  const logs: MessageLog[] = []
  for (const r of recipients.length ? recipients : [{ label: 'Team', phone: '—' }]) {
    logs.push(
      await createMessage(payload, settings, {
        kind: 'enquiry',
        reference: vars.enquiry_id!,
        recipientLabel: r.label,
        phone: r.phone,
        variables: vars,
        enquiry: enquiry.id,
      }),
    )
  }
  await payload.update({
    collection: 'enquiries',
    id: enquiry.id,
    data: { whatsappStatus: 'queued' },
    overrideAccess: true,
    context: { disableRevalidate: true },
  })
  return { sent: await sendAll(payload, logs), text: renderMessage('enquiry', vars) }
}

/** Sample booking used by "Send test message", so the template itself is tested. */
export const SAMPLE_BOOKING: BookingMessageInput = {
  requestId: 'TEST',
  packageTitle: 'Goa Beach Escape',
  duration: '3N/4D',
  travelDate: '2026-12-18',
  departureCity: 'Ranchi',
  adults: 2,
  children: 0,
  hotelCategory: 'deluxe4',
  rooms: 1,
  name: 'Test customer',
  whatsapp: '9830122457',
  estimatedTotal: 33998,
  specialRequests: 'This is a test message from the CMS',
}

/** "Send test message": the booking template with sample values, to the primary recipient. */
export async function sendTestMessage(
  payload: Payload,
): Promise<{ ok: boolean; error?: string; to?: string }> {
  const { settings } = await loadWhatsAppSettings(payload)
  const primary = recipientsOf(settings)[0]
  if (!primary) return { ok: false, error: 'Add at least one recipient first.' }
  const log = await createMessage(payload, settings, {
    kind: 'test',
    reference: 'TEST',
    recipientLabel: primary.label,
    phone: primary.phone,
    variables: bookingVariables(SAMPLE_BOOKING),
  })
  const status = await sendMessage(payload, log, { retries: false })
  const ok = status === 'sent'
  const after = await payload.findByID({
    collection: 'messageLog',
    id: log.id,
    depth: 0,
    overrideAccess: true,
  })
  await payload.updateGlobal({
    slug: 'whatsappSettings',
    data: { connectionStatus: ok ? 'connected' : 'error' },
    overrideAccess: true,
  })
  return ok
    ? { ok, to: primary.label }
    : { ok, error: after.error ?? 'Sending failed', to: primary.label }
}

/** Retries that are due. Called by the cron endpoint; safe to call often. */
export async function processDueMessages(
  payload: Payload,
  now = new Date(),
): Promise<{ processed: number }> {
  const { docs } = await payload.find({
    collection: 'messageLog',
    where: {
      status: { equals: 'queued' },
      nextAttemptAt: { less_than_equal: now.toISOString() },
    },
    sort: 'nextAttemptAt',
    limit: 25,
    depth: 0,
    overrideAccess: true,
  })
  let processed = 0
  for (const log of docs) {
    // Claim the row so an overlapping run skips it.
    const lease = new Date(now.getTime() + 2 * 60_000).toISOString()
    const claimed = await payload.update({
      collection: 'messageLog',
      where: { id: { equals: log.id }, nextAttemptAt: { equals: log.nextAttemptAt } },
      data: { nextAttemptAt: lease },
      overrideAccess: true,
    })
    if (!claimed.docs.length) continue
    await sendMessage(payload, { ...log, nextAttemptAt: lease }, { now })
    processed++
  }
  return { processed }
}
