/**
 * Team alerts for bookings and enquiries, on every enabled channel: WhatsApp (Settings ›
 * WhatsApp Integration), Telegram and email (Settings › Team Alerts).
 *
 * Every message is a `messageLog` row: created "queued", sent straight away, and on a retryable
 * failure tried again by `processDueMessages` (cron on /api/whatsapp/process, plus after bookings,
 * enquiries and dashboard visits) after 1, 5 and 15 minutes. A booking's "Team alert" status is
 * the best result across all its channels; when every alert has failed, the fallback email goes
 * out once (unless email is already one of the channels).
 */
import type { Payload } from 'payload'

import { INCLUDE_SECRETS } from '@/fields/secret'

import { sendTelegramMessage } from '@/lib/alerts/telegram'
import { BUDGETS, TRAVELLER_GROUPS, TRIP_TYPES } from '@/lib/catalog'
import { decryptSecret } from '@/lib/crypto'
import { toWhatsAppNumber } from '@/lib/format'
import { reportError } from '@/lib/monitoring'
import { siteUrl } from '@/lib/site/links'
import type { Booking, Enquiry, MessageLog, TeamAlert, WhatsappSetting } from '@/payload-types'

import { SendError, sendingAdapter, type ProviderConfig, type WhatsAppAdapter } from './adapters'
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
export type Channel = MessageLog['channel']

const TEMPLATE_FOR: Record<Kind, keyof WhatsappSetting | null> = {
  booking: 'bookingTemplate',
  enquiry: 'enquiryTemplate',
  customerCopy: 'customerTemplate',
  reviewLink: 'reviewTemplate',
  test: 'bookingTemplate',
}

const decrypt = (payload: Payload, value: string | null | undefined, what: string) => {
  if (!value) return ''
  try {
    return decryptSecret(value)
  } catch (err) {
    payload.logger.error({ err }, `${what} could not be decrypted (check WHATSAPP_ENC_KEY)`)
    return ''
  }
}

export async function loadWhatsAppSettings(payload: Payload) {
  const settings = await payload.findGlobal({
    slug: 'whatsappSettings',
    overrideAccess: true,
    depth: 0,
    context: INCLUDE_SECRETS,
  })
  const apiKey = decrypt(payload, settings.apiKey, 'WhatsApp API key')
  const sender = (settings.senderNumber ?? '').replace(/\D/g, '')
  const cfg: ProviderConfig | null =
    apiKey && sender ? { apiKey, sender, appName: settings.appName } : null
  return { settings, adapter: sendingAdapter(settings.provider, cfg) }
}

type AlertContext = {
  wa: WhatsappSetting
  waAdapter: WhatsAppAdapter
  team: TeamAlert
  telegramToken: string
}

export async function loadAlertSettings(payload: Payload): Promise<AlertContext> {
  const [{ settings, adapter }, team] = await Promise.all([
    loadWhatsAppSettings(payload),
    payload.findGlobal({
      slug: 'teamAlerts',
      overrideAccess: true,
      depth: 0,
      context: INCLUDE_SECRETS,
    }),
  ])
  return {
    wa: settings,
    waAdapter: adapter,
    team,
    telegramToken: decrypt(payload, team.telegramBotToken, 'Telegram bot token'),
  }
}

type Destination = { channel: Channel; label: string; to: string }

function whatsappRecipients(wa: WhatsappSetting): Destination[] {
  const list = [...(wa.recipients ?? [])].sort(
    (a, b) => Number(Boolean(b.isPrimary)) - Number(Boolean(a.isPrimary)),
  )
  return list.map((r) => ({ channel: 'whatsapp', label: r.label, to: r.phone }))
}

const telegramChats = (team: TeamAlert): Destination[] =>
  (team.telegramChats ?? []).map((c) => ({ channel: 'telegram', label: c.label, to: c.chatId }))

const emailRecipients = (team: TeamAlert): Destination[] =>
  (team.emailRecipients ?? []).map((e) => ({
    channel: 'email',
    label: e.label || e.email,
    to: e.email,
  }))

/** Everyone who should hear about a new booking or enquiry, on the channels switched on. */
function teamDestinations(ctx: AlertContext): Destination[] {
  const out: Destination[] = []
  if (ctx.wa.enabled) {
    const wa = whatsappRecipients(ctx.wa)
    // WhatsApp on but no recipients: a row that fails, so the mistake shows in the log.
    out.push(...(wa.length ? wa : [{ channel: 'whatsapp' as const, label: 'Team', to: '—' }]))
  }
  if (ctx.team.telegramEnabled) out.push(...telegramChats(ctx.team))
  if (ctx.team.emailEnabled) out.push(...emailRecipients(ctx.team))
  return out
}

const templateOf = (settings: WhatsappSetting, kind: Kind) => {
  const key = TEMPLATE_FOR[kind]
  const t = key
    ? (settings[key] as { name?: string | null; language?: string | null } | undefined)
    : undefined
  return { name: t?.name ?? '', language: t?.language || 'en' }
}

type NewMessage = Destination & {
  kind: Kind
  reference: string
  variables: Variables
  booking?: number
  enquiry?: number
  /** "Open in CMS" link, added to Telegram and email alerts. */
  link?: string
}

async function createMessage(payload: Payload, ctx: AlertContext, m: NewMessage) {
  const templateKind: TemplateKind = m.kind === 'test' ? 'booking' : (m.kind as TemplateKind)
  const text = renderMessage(templateKind, m.variables)
  const whatsapp = m.channel === 'whatsapp'
  const template = whatsapp ? templateOf(ctx.wa, m.kind) : null
  return payload.create({
    collection: 'messageLog',
    data: {
      reference: m.reference,
      kind: m.kind,
      channel: m.channel,
      booking: m.booking,
      enquiry: m.enquiry,
      recipientLabel: m.label,
      phone: m.to,
      provider: whatsapp ? ctx.wa.provider : undefined,
      template: template?.name || undefined,
      language: template?.language,
      params: whatsapp ? orderedParams(templateKind, m.variables) : undefined,
      body: !whatsapp && m.link ? `${text}\n\nOpen in CMS: ${m.link}` : text,
      status: 'queued',
      attempts: 0,
      nextAttemptAt: new Date().toISOString(),
    },
    overrideAccess: true,
  })
}

function emailSubject(log: Pick<MessageLog, 'kind' | 'reference'>) {
  if (log.kind === 'booking') return `New booking request ${log.reference}`
  if (log.kind === 'enquiry') return `New enquiry ${log.reference}`
  return 'Go Travels test alert'
}

/** Sends one logged message on its channel. Throws SendError on failure. */
async function deliver(payload: Payload, ctx: AlertContext, log: MessageLog) {
  const channel = log.channel ?? 'whatsapp'
  if (channel === 'telegram') {
    return sendTelegramMessage(ctx.telegramToken, log.phone, log.body ?? '')
  }
  if (channel === 'email') {
    try {
      await payload.sendEmail({
        to: log.phone,
        subject: emailSubject(log),
        text: (log.body ?? '').replace(/\*/g, ''),
      })
    } catch (err) {
      throw new SendError(`Email could not be sent: ${(err as Error).message}`)
    }
    return { providerMessageId: undefined }
  }
  // WhatsApp: Indian mobiles in any format, or a full international number (11–15 digits).
  const digits = log.phone.replace(/\D/g, '')
  const to = toWhatsAppNumber(log.phone) ?? (/^\d{11,15}$/.test(digits) ? digits : null)
  if (!to) throw new SendError(`"${log.phone}" is not a valid WhatsApp number`, false)
  return ctx.waAdapter.send({
    to,
    template: { name: log.template ?? '', language: log.language || 'en' },
    params: Array.isArray(log.params) ? (log.params as string[]) : [],
    text: log.body ?? '',
  })
}

/**
 * One attempt at sending a logged message. Returns the row's new status. `retries: false`
 * (test messages) gives up after the first failure.
 */
export async function sendMessage(
  payload: Payload,
  log: MessageLog,
  opts: { retries?: boolean; now?: Date; ctx?: AlertContext } = {},
): Promise<LogStatus> {
  const now = opts.now ?? new Date()
  const ctx = opts.ctx ?? (await loadAlertSettings(payload))
  const attempts = (log.attempts ?? 0) + 1

  let status: LogStatus
  let data: Partial<MessageLog>
  try {
    const res = await deliver(payload, ctx, log)
    status = 'sent'
    data = {
      status,
      attempts,
      providerMessageId: res.providerMessageId ?? null,
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
    payload.logger.warn(
      `${log.channel ?? 'whatsapp'} alert ${log.reference} to ${log.recipientLabel}: ${data.error}`,
    )
  }

  await payload.update({ collection: 'messageLog', id: log.id, data, overrideAccess: true })
  if (log.kind === 'booking' || log.kind === 'enquiry') await refreshParent(payload, log, ctx)
  return status
}

const relId = (v: unknown) =>
  typeof v === 'object' && v ? (v as { id: number }).id : (v as number | null | undefined)

/**
 * Recomputes the booking's / enquiry's "Team alert" status from its latest round of alerts on
 * all channels; sends the fallback email the first time they have all failed.
 */
export async function refreshParent(
  payload: Payload,
  log: Pick<MessageLog, 'kind' | 'booking' | 'enquiry' | 'reference'>,
  ctx?: AlertContext,
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
    await reportError(new Error(`Every team alert for ${log.reference} failed`), 'alerts', {
      errors: latestRound.map((l) => `${l.channel}: ${l.error}`),
    })
    const settings = ctx ?? (await loadAlertSettings(payload))
    // When email is one of the channels, it has already been tried.
    if (!settings.team.emailEnabled) {
      await sendFallbackEmail(payload, settings.wa, log.reference, latestRound)
    }
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
      subject: `Team alert failed: ${reference}`,
      text: [
        `The team alert for ${reference} could not be delivered, so here it is by email.`,
        '',
        (first?.body ?? '').replace(/\*/g, ''),
        '',
        'Delivery errors:',
        ...errors,
        '',
        'Open the CMS to follow up and use "Resend" once alerts are working.',
      ].join('\n'),
    })
  } catch (err) {
    await reportError(err, 'fallback-email', { reference })
  }
}

/** Sends a batch; returns the channels on which at least one team alert went out. */
async function sendAll(payload: Payload, ctx: AlertContext, logs: MessageLog[]) {
  const results = await Promise.all(logs.map((l) => sendMessage(payload, l, { ctx })))
  const channels = new Set<Channel>()
  logs.forEach((l, i) => {
    if (l.kind !== 'customerCopy' && results[i] === 'sent') channels.add(l.channel)
  })
  return [...channels]
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

export type DispatchResult = {
  /** At least one team alert went out, or no channel is switched on (nothing to fail). */
  sent: boolean
  text: string
  /** Channels that delivered a team alert. */
  channels: Channel[]
}

const cmsLink = (collection: string, id: number) =>
  `${siteUrl()}/admin/collections/${collection}/${id}`

async function dispatch(
  payload: Payload,
  ctx: AlertContext,
  parent: { collection: 'bookings' | 'enquiries'; id: number },
  messages: NewMessage[],
  text: string,
): Promise<DispatchResult> {
  if (!messages.some((m) => m.kind !== 'customerCopy')) {
    payload.logger.warn(
      `No team alert channel is switched on (${messages[0]?.reference ?? parent.id}): turn one on in Settings › Team Alerts or WhatsApp Integration.`,
    )
    return { sent: true, text, channels: [] }
  }
  const logs: MessageLog[] = []
  for (const m of messages) logs.push(await createMessage(payload, ctx, m))
  await payload.update({
    collection: parent.collection,
    id: parent.id,
    data: { whatsappStatus: 'queued' },
    overrideAccess: true,
    context: { disableRevalidate: true },
  })
  const channels = await sendAll(payload, ctx, logs)
  return { sent: channels.length > 0, text, channels }
}

/**
 * Announces a booking on every enabled channel (plus the customer's WhatsApp copy when that is
 * switched on). Used for new bookings and "Resend".
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
  const ctx = await loadAlertSettings(payload)
  const input = bookingMessageInput(booking)
  const vars = bookingVariables(input)
  const base = {
    reference: input.requestId,
    booking: booking.id,
    link: cmsLink('bookings', booking.id),
  }
  const messages: NewMessage[] = teamDestinations(ctx).map((d) => ({
    ...d,
    ...base,
    kind: 'booking',
    variables: vars,
  }))
  if (ctx.wa.enabled && ctx.wa.sendCustomerCopy && (opts.customerCopy ?? true)) {
    messages.push({
      ...base,
      channel: 'whatsapp',
      label: 'Customer',
      to: booking.whatsapp,
      kind: 'customerCopy',
      variables: customerVariables(input),
    })
  }
  return dispatch(
    payload,
    ctx,
    { collection: 'bookings', id: booking.id },
    messages,
    renderMessage('booking', vars),
  )
}

/** Announces an enquiry on every enabled channel. */
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
  const ctx = await loadAlertSettings(payload)
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
  const messages: NewMessage[] = teamDestinations(ctx).map((d) => ({
    ...d,
    kind: 'enquiry',
    reference: vars.enquiry_id!,
    enquiry: enquiry.id,
    link: cmsLink('enquiries', enquiry.id),
    variables: vars,
  }))
  return dispatch(
    payload,
    ctx,
    { collection: 'enquiries', id: enquiry.id },
    messages,
    renderMessage('enquiry', vars),
  )
}

/** Sample booking used by the test buttons, so the real message layout is tested. */
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

export type TestResult = { ok: boolean; to?: string; error?: string }

/** Sends the sample booking to the given destinations, once each (no retries). */
async function sendTest(
  payload: Payload,
  ctx: AlertContext,
  destinations: Destination[],
): Promise<TestResult> {
  if (!destinations.length) return { ok: false, error: 'Add at least one recipient first.' }
  const results: { label: string; ok: boolean; error?: string | null }[] = []
  for (const d of destinations) {
    const log = await createMessage(payload, ctx, {
      ...d,
      kind: 'test',
      reference: 'TEST',
      variables: bookingVariables(SAMPLE_BOOKING),
    })
    const status = await sendMessage(payload, log, { retries: false, ctx })
    const after =
      status === 'sent'
        ? null
        : await payload.findByID({
            collection: 'messageLog',
            id: log.id,
            depth: 0,
            overrideAccess: true,
          })
    results.push({ label: d.label, ok: status === 'sent', error: after?.error })
  }
  const failed = results.find((r) => !r.ok)
  const to = results.map((r) => r.label).join(', ')
  return failed
    ? { ok: false, to, error: `${failed.label}: ${failed.error ?? 'Sending failed'}` }
    : { ok: true, to }
}

/** "Send test message" (WhatsApp): the booking template with sample values, to the primary recipient. */
export async function sendTestMessage(payload: Payload): Promise<TestResult> {
  const ctx = await loadAlertSettings(payload)
  const primary = whatsappRecipients(ctx.wa)[0]
  const result = await sendTest(payload, ctx, primary ? [primary] : [])
  if (primary) {
    await payload.updateGlobal({
      slug: 'whatsappSettings',
      data: { connectionStatus: result.ok ? 'connected' : 'error' },
      overrideAccess: true,
    })
  }
  return result
}

/** "Send test to Telegram" / "Send test email": to every chat / recipient of that channel. */
export async function sendTestAlert(
  payload: Payload,
  channel: 'telegram' | 'email',
): Promise<TestResult> {
  const ctx = await loadAlertSettings(payload)
  if (channel === 'telegram' && !ctx.telegramToken) {
    return { ok: false, error: 'Save the bot token first.' }
  }
  const result = await sendTest(
    payload,
    ctx,
    channel === 'telegram' ? telegramChats(ctx.team) : emailRecipients(ctx.team),
  )
  if (channel === 'telegram') {
    await payload.updateGlobal({
      slug: 'teamAlerts',
      data: { telegramStatus: result.ok ? 'connected' : 'error' },
      overrideAccess: true,
    })
  }
  return result
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
  if (!docs.length) return { processed: 0 }
  const ctx = await loadAlertSettings(payload)
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
    await sendMessage(payload, { ...log, nextAttemptAt: lease }, { now, ctx })
    processed++
  }
  return { processed }
}
