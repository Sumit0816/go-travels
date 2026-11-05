import type { Endpoint } from 'payload'

import { canWrite } from '@/access'
import { webhookAdapter } from '@/lib/whatsapp/adapters'
import { processDueMessages, sendTestMessage } from '@/lib/whatsapp/send'
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

export const WHATSAPP_ENDPOINTS = [
  whatsappWebhook,
  whatsappProcess,
  whatsappProcessPost,
  whatsappTest,
]
