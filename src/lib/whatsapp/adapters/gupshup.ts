import {
  postJson,
  SendError,
  type DeliveryStatus,
  type ProviderConfig,
  type StatusUpdate,
  type WhatsAppAdapter,
} from './types'

const SEND_URL = 'https://api.gupshup.io/wa/api/v1/template/msg'

const STATUS: Record<string, DeliveryStatus> = {
  sent: 'sent',
  delivered: 'delivered',
  read: 'read',
  failed: 'failed',
}

/**
 * Gupshup WhatsApp template messages. The template "name" saved in the CMS is the Gupshup
 * template ID. Docs: https://docs.gupshup.io/reference/msg
 */
export function gupshupAdapter(cfg: ProviderConfig): WhatsAppAdapter {
  return {
    id: 'gupshup',
    async send({ to, template, params }) {
      if (!template.name) throw new SendError('No template ID saved for this message', false)
      const body = new URLSearchParams({
        channel: 'whatsapp',
        source: cfg.sender,
        destination: to,
        'src.name': cfg.appName ?? '',
        template: JSON.stringify({ id: template.name, params }),
      })
      const json = (await postJson(SEND_URL, {
        headers: { apikey: cfg.apiKey, 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      })) as { status?: string; messageId?: string; message?: string } | null
      if (!json?.messageId) {
        throw new SendError(
          `Gupshup did not accept the message: ${json?.message ?? json?.status ?? 'no message ID'}`,
        )
      }
      return { providerMessageId: json.messageId }
    },
    /** Gupshup "message-event" callbacks. */
    parseWebhook(body) {
      const b = body as {
        type?: string
        timestamp?: number
        payload?: { id?: string; type?: string; payload?: { reason?: string } }
      } | null
      if (b?.type !== 'message-event' || !b.payload?.id || !b.payload.type) return []
      const status = STATUS[b.payload.type]
      if (!status) return []
      const update: StatusUpdate = { providerMessageId: b.payload.id, status }
      if (status === 'failed') update.error = b.payload.payload?.reason ?? 'Failed at Gupshup'
      if (b.timestamp) update.at = new Date(b.timestamp)
      return [update]
    },
  }
}
