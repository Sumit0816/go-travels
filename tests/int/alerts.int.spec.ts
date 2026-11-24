// @vitest-environment node
/**
 * Team alerts on Telegram and email, against a real database. Telegram's API is stubbed and
 * emails are captured, so nothing leaves the machine.
 */
import { createLocalReq, getPayload, type Payload } from 'payload'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import config from '@/payload.config'
import { alertTest, telegramChats } from '@/endpoints/whatsapp'
import { toTelegramHtml } from '@/lib/alerts/telegram'
import {
  dispatchBookingAlert,
  loadAlertSettings,
  processDueMessages,
  sendTestAlert,
} from '@/lib/whatsapp/send'
import type { TeamAlert, WhatsappSetting } from '@/payload-types'

let payload: Payload
let originalWa: WhatsappSetting
let originalTeam: TeamAlert
const bookings: number[] = []
const TOKEN = '123456789:AAFakeTokenForTests_abcdefgh'

type Call = { url: string; body: Record<string, unknown> }
const tgCalls: Call[] = []

/** Telegram API stub: `reply` decides each response. */
function stubTelegram(reply: (call: Call) => { status: number; json: unknown }) {
  tgCalls.length = 0
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      const call = { url: String(url), body: JSON.parse(String(init?.body ?? '{}')) }
      tgCalls.push(call)
      const r = reply(call)
      return new Response(JSON.stringify(r.json), { status: r.status })
    }),
  )
}
const tgOk = () => ({ status: 200, json: { ok: true, result: { message_id: 42 } } })

async function setTeam(data: Partial<TeamAlert>, resetToken = false) {
  await payload.updateGlobal({
    slug: 'teamAlerts',
    data,
    overrideAccess: true,
    context: resetToken ? { resetWhatsAppKey: true } : {},
  })
}

async function newBooking(name: string) {
  const b = await payload.create({
    collection: 'bookings',
    data: {
      name,
      whatsapp: '9830122457',
      travelDate: '2027-01-15T12:00:00.000Z',
      adults: 2,
      hotelCategory: 'deluxe4',
      packageSnapshot: { title: 'Goa Beach Escape', duration: '3N/4D' },
      estimatedTotal: 33998,
      status: 'new',
    },
    overrideAccess: true,
  })
  bookings.push(b.id)
  return b
}

const logsFor = async (id: number) =>
  (
    await payload.find({
      collection: 'messageLog',
      where: { booking: { equals: id } },
      sort: 'createdAt',
      overrideAccess: true,
    })
  ).docs
const statusOf = async (id: number) =>
  (await payload.findByID({ collection: 'bookings', id, overrideAccess: true })).whatsappStatus

beforeAll(async () => {
  payload = await getPayload({ config: await config })
  originalWa = await payload.findGlobal({ slug: 'whatsappSettings', overrideAccess: true })
  originalTeam = await payload.findGlobal({ slug: 'teamAlerts', overrideAccess: true })
  await payload.updateGlobal({
    slug: 'whatsappSettings',
    data: {
      enabled: false,
      sendCustomerCopy: true,
      emailFallback: true,
      fallbackEmail: 'ops@example.test',
    },
    overrideAccess: true,
  })
  await setTeam({
    telegramEnabled: true,
    telegramBotToken: TOKEN,
    telegramChats: [{ label: 'Bookings group', chatId: '-1001234567890' }],
    emailEnabled: true,
    emailRecipients: [{ label: 'Desk', email: 'desk@example.test' }],
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

afterAll(async () => {
  for (const id of bookings) {
    await payload.delete({
      collection: 'messageLog',
      where: { booking: { equals: id } },
      overrideAccess: true,
    })
    await payload.delete({ collection: 'bookings', id, overrideAccess: true })
  }
  await payload.delete({
    collection: 'messageLog',
    where: { reference: { equals: 'TEST' } },
    overrideAccess: true,
  })
  await payload.updateGlobal({
    slug: 'whatsappSettings',
    data: {
      enabled: originalWa.enabled,
      sendCustomerCopy: originalWa.sendCustomerCopy,
      emailFallback: originalWa.emailFallback,
      fallbackEmail: originalWa.fallbackEmail,
    },
    overrideAccess: true,
  })
  await setTeam(
    {
      telegramEnabled: originalTeam.telegramEnabled,
      telegramChats: originalTeam.telegramChats,
      telegramStatus: originalTeam.telegramStatus,
      emailEnabled: originalTeam.emailEnabled,
      emailRecipients: originalTeam.emailRecipients,
    },
    true,
  )
})

describe('Telegram and email alerts', () => {
  it('announces a booking on Telegram and by email, with a CMS link, and no WhatsApp', async () => {
    stubTelegram(tgOk)
    const email = vi.spyOn(payload, 'sendEmail').mockResolvedValue(undefined)
    const b = await newBooking('Alerts Ok')
    const r = await dispatchBookingAlert(payload, b.id)

    expect(r.sent).toBe(true)
    expect(r.channels.sort()).toEqual(['email', 'telegram'])
    const logs = await logsFor(b.id)
    // WhatsApp is off, so no team row and no customer copy either.
    expect(logs.map((l) => [l.channel, l.kind, l.status])).toEqual([
      ['telegram', 'booking', 'sent'],
      ['email', 'booking', 'sent'],
    ])
    expect(await statusOf(b.id)).toBe('sent')

    expect(tgCalls[0]!.url).toBe(`https://api.telegram.org/bot${TOKEN}/sendMessage`)
    expect(tgCalls[0]!.body).toMatchObject({ chat_id: '-1001234567890', parse_mode: 'HTML' })
    expect(String(tgCalls[0]!.body.text)).toContain(`<b>New Booking Request</b> · ${b.requestId}`)
    expect(String(tgCalls[0]!.body.text)).toMatch(
      /Open in CMS: http.+\/admin\/collections\/bookings\/\d+/,
    )

    expect(email).toHaveBeenCalledTimes(1)
    const mail = email.mock.calls[0]![0] as { to: string; subject: string; text: string }
    expect(mail.to).toBe('desk@example.test')
    expect(mail.subject).toBe(`New booking request ${b.requestId}`)
    expect(mail.text).toContain(`New Booking Request · ${b.requestId}`)
    expect(mail.text).not.toContain('*')
  })

  it('one channel delivering is enough; a rate-limited Telegram is retried later', async () => {
    stubTelegram(() => ({
      status: 429,
      json: {
        ok: false,
        error_code: 429,
        description: 'Too Many Requests',
        parameters: { retry_after: 5 },
      },
    }))
    vi.spyOn(payload, 'sendEmail').mockResolvedValue(undefined)
    const b = await newBooking('Telegram busy')
    const start = Date.now()
    const r = await dispatchBookingAlert(payload, b.id)
    expect(r.channels).toEqual(['email'])
    expect(await statusOf(b.id)).toBe('sent')
    const tg = (await logsFor(b.id)).find((l) => l.channel === 'telegram')!
    expect(tg.status).toBe('queued')
    expect(tg.error).toContain('429')

    stubTelegram(tgOk)
    await processDueMessages(payload, new Date(start + 2 * 60_000))
    const after = (await logsFor(b.id)).find((l) => l.channel === 'telegram')!
    expect(after.status).toBe('sent')
  })

  it('when every channel fails, the fallback email goes to the WhatsApp fallback address', async () => {
    await setTeam({ emailEnabled: false })
    try {
      stubTelegram(() => ({
        status: 403,
        json: {
          ok: false,
          error_code: 403,
          description: 'Forbidden: bot was kicked from the group chat',
        },
      }))
      const email = vi.spyOn(payload, 'sendEmail').mockResolvedValue(undefined)
      const b = await newBooking('All failed')
      const r = await dispatchBookingAlert(payload, b.id)
      expect(r.sent).toBe(false)
      expect(await statusOf(b.id)).toBe('failed')
      // A removed bot won't fix itself: no retry.
      expect((await logsFor(b.id))[0]!.nextAttemptAt ?? null).toBeNull()
      expect(email).toHaveBeenCalledTimes(1)
      expect(email.mock.calls[0]![0]).toMatchObject({
        to: 'ops@example.test',
        subject: `Team alert failed: ${b.requestId}`,
      })
    } finally {
      await setTeam({ emailEnabled: true })
    }
  })

  it('with no channel switched on, the booking is saved and nothing is sent', async () => {
    await setTeam({ telegramEnabled: false, emailEnabled: false })
    try {
      const b = await newBooking('No channels')
      const r = await dispatchBookingAlert(payload, b.id)
      expect(r).toMatchObject({ sent: true, channels: [] })
      expect(await logsFor(b.id)).toEqual([])
      expect(await statusOf(b.id)).toBe('notSent')
    } finally {
      await setTeam({ telegramEnabled: true, emailEnabled: true })
    }
  })
})

describe('secret fields', () => {
  it('never returns the token or API key on a normal read, and keeps them on save', async () => {
    const owner = (
      await payload.find({
        collection: 'users',
        where: { role: { equals: 'owner' } },
        limit: 1,
        overrideAccess: true,
      })
    ).docs[0]!
    const user = { ...owner, collection: 'users' as const }
    // What the admin screen and the REST API see.
    const team = await payload.findGlobal({ slug: 'teamAlerts', user, overrideAccess: false })
    expect(team.telegramBotToken).toBeUndefined()
    expect(team.telegramTokenHint).toMatch(/^•••• /)
    const wa = await payload.findGlobal({ slug: 'whatsappSettings', user, overrideAccess: false })
    expect(wa.apiKey).toBeUndefined()

    // Saving other fields with the box empty (as the form does) keeps the stored token.
    await payload.updateGlobal({
      slug: 'teamAlerts',
      data: { telegramEnabled: true, telegramBotToken: '' },
      user,
      overrideAccess: false,
    })
    const { telegramToken } = await loadAlertSettings(payload)
    expect(telegramToken).toBe(TOKEN)
  })
})

describe('test buttons and group finder', () => {
  it('"Send test to Telegram" reaches every chat and marks the connection', async () => {
    stubTelegram(tgOk)
    expect(await sendTestAlert(payload, 'telegram')).toEqual({ ok: true, to: 'Bookings group' })
    const s = await payload.findGlobal({ slug: 'teamAlerts', overrideAccess: true })
    expect(s.telegramStatus).toBe('connected')
    expect(String(tgCalls[0]!.body.text)).toContain('<b>New Booking Request</b> · TEST')
  })

  it('"Find my group" lists chats from recent updates; endpoints need a signed-in manager', async () => {
    stubTelegram(() => ({
      status: 200,
      json: {
        ok: true,
        result: [
          {
            my_chat_member: {
              chat: { id: -1001234567890, title: 'Go Travels Bookings', type: 'supergroup' },
            },
          },
          {
            message: {
              chat: { id: -1001234567890, title: 'Go Travels Bookings', type: 'supergroup' },
            },
          },
        ],
      },
    }))
    const owner = (
      await payload.find({
        collection: 'users',
        where: { role: { equals: 'owner' } },
        limit: 1,
        overrideAccess: true,
      })
    ).docs[0]
    const anon = await createLocalReq({}, payload)
    expect((await telegramChats.handler(anon)).status).toBe(403)
    expect((await alertTest.handler(anon)).status).toBe(403)
    if (owner) {
      const req = await createLocalReq({ user: { ...owner, collection: 'users' } }, payload)
      const res = await telegramChats.handler(req)
      expect(await res.json()).toEqual({
        chats: [{ id: '-1001234567890', title: 'Go Travels Bookings', type: 'supergroup' }],
      })
    }
  })

  it('escapes HTML in Telegram messages and keeps bold', () => {
    expect(toTelegramHtml('*Hi* <b>A & B</b>')).toBe('<b>Hi</b> &lt;b&gt;A &amp; B&lt;/b&gt;')
  })
})
