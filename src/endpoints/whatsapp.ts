import type { Endpoint } from 'payload'

import { canWrite } from '@/access'
import { webhookAdapter } from '@/lib/whatsapp/adapters'
import { findTelegramChats } from '@/lib/alerts/telegram'
import {
  loadAlertSettings,
  processDueMessages,
  sendTestAlert,
  sendTestMessage,
} from '@/lib/whatsapp/send'
import { applyStatusUpdates, webhookTokenMatches } from '@/lib/whatsapp/webhook'

const role = (u: unknown) => (u as { role?: unknown } | null)?.role

/**
 * POST /api/webhooks/whatsapp/:provider?token=… : delivery receipts from Gupshup / Interakt.
 * The token is WHATSAPP_WEBHOOK_SECRET; set the same URL in the provider's dashboard.
 */
export const whatsappWebhook: Endpoint = {
  path: '/webhooks/whatsapp/:provider',
  method: 'post',
  handler: async (req) => {
    const url = new URL(req.url ?? '', 'http://localhost')
    if (!webhookTokenMatches(url.searchParams.get('token'))) {
      return Response.json({ error: 'Unauthorised' }, { status: 401 })
    }
    const adapter = webhookAdapter(String(req.routeParams?.provider ?? ''))
    if (!adapter) return Response.json({ error: 'Unknown provider' }, { status: 404 })
    let body: unknown
    try {
      body = await req.json?.()
    } catch {
      return Response.json({ error: 'Invalid JSON' }, { status: 400 })
    }
    const applied = await applyStatusUpdates(req.payload, adapter.parseWebhook(body))
    // Providers retry on non-2xx, so unknown events are acknowledged too.
    return Response.json({ ok: true, applied })
  },
}

/**
 * GET|POST /api/whatsapp/process : sends retries that are due. Called every minute by a cron
 * (Vercel Cron sends `Authorization: Bearer $CRON_SECRET`; on a VPS use crontab + curl).
 */
const processHandler: Endpoint['handler'] = async (req) => {
  const secret = process.env.CRON_SECRET
  const auth = req.headers.get('authorization') ?? ''
  if (!secret || auth !== `Bearer ${secret}`) {
    return Response.json({ error: 'Unauthorised' }, { status: 401 })
  }
  const result = await processDueMessages(req.payload)
  return Response.json({ ok: true, ...result })
}

export const whatsappProcess: Endpoint = {
  path: '/whatsapp/process',
  method: 'get',
  handler: processHandler,
}
export const whatsappProcessPost: Endpoint = {
  path: '/whatsapp/process',
  method: 'post',
  handler: processHandler,
}

/** POST /api/whatsapp/test : "Send test message" in WhatsApp Integration. */
export const whatsappTest: Endpoint = {
  path: '/whatsapp/test',
  method: 'post',
  handler: async (req) => {
    if (!req.user || !canWrite('whatsapp', role(req.user))) {
      return Response.json({ error: 'Not allowed' }, { status: 403 })
    }
    const result = await sendTestMessage(req.payload)
    return Response.json(result, { status: result.ok ? 200 : 502 })
  },
}

const canManageAlerts = (user: unknown) => Boolean(user) && canWrite('whatsapp', role(user))

/** POST /api/alerts/test {channel: 'telegram' | 'email'} : the Team Alerts test buttons. */
export const alertTest: Endpoint = {
  path: '/alerts/test',
  method: 'post',
  handler: async (req) => {
    if (!canManageAlerts(req.user)) return Response.json({ error: 'Not allowed' }, { status: 403 })
    const body = ((await req.json?.().catch(() => null)) ?? {}) as { channel?: string }
    if (body.channel !== 'telegram' && body.channel !== 'email') {
      return Response.json({ error: 'Unknown channel' }, { status: 400 })
    }
    const result = await sendTestAlert(req.payload, body.channel)
    return Response.json(result, { status: result.ok ? 200 : 502 })
  },
}

/**
 * POST /api/alerts/telegram/chats : groups that recently added or messaged the bot, so staff
 * can copy the chat ID ("Find my group").
 */
export const telegramChats: Endpoint = {
  path: '/alerts/telegram/chats',
  method: 'post',
  handler: async (req) => {
    if (!canManageAlerts(req.user)) return Response.json({ error: 'Not allowed' }, { status: 403 })
    const { telegramToken } = await loadAlertSettings(req.payload)
    if (!telegramToken)
      return Response.json({ error: 'Save the bot token first.' }, { status: 400 })
    try {
      return Response.json({ chats: await findTelegramChats(telegramToken) })
    } catch (err) {
      return Response.json({ error: (err as Error).message }, { status: 502 })
    }
  },
}

export const WHATSAPP_ENDPOINTS = [
  whatsappWebhook,
  whatsappProcess,
  whatsappProcessPost,
  whatsappTest,
  alertTest,
  telegramChats,
]
