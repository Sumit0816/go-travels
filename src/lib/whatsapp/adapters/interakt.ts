import {
  postJson,
  SendError,
  type DeliveryStatus,
  type ProviderConfig,
  type StatusUpdate,
  type WhatsAppAdapter,
} from './types'

const SEND_URL = 'https://api.interakt.ai/v1/public/message/'

const STATUS: Record<string, DeliveryStatus> = {
  message_api_sent: 'sent',
  message_api_delivered: 'delivered',
  message_api_read: 'read',
  message_api_failed: 'failed',
}

/** Interakt template messages. Docs: https://www.interakt.shop/resource-center/ */
export function interaktAdapter(cfg: ProviderConfig): WhatsAppAdapter {
  return {
    id: 'interakt',
    async send({ to, template, params }) {
      if (!template.name) throw new SendError('No template name saved for this message', false)
      const json = (await postJson(SEND_URL, {
        headers: { Authorization: `Basic ${cfg.apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          countryCode: `+${to.slice(0, -10)}`,
          phoneNumber: to.slice(-10),
          type: 'Template',
          template: {
            name: template.name,
            languageCode: template.language || 'en',
            bodyValues: params,
          },
        }),
      })) as { result?: boolean; id?: string; message?: string } | null
      if (!json?.result || !json.id) {
        throw new SendError(`Interakt did not accept the message: ${json?.message ?? 'no ID'}`)
      }
      return { providerMessageId: json.id }
    },
    parseWebhook(body) {
      const b = body as {
        type?: string
        data?: { message?: { id?: string; channel_failure_reason?: string } }
      } | null
      const status = b?.type ? STATUS[b.type] : undefined
      const id = b?.data?.message?.id
      if (!status || !id) return []
      const update: StatusUpdate = { providerMessageId: id, status }
      if (status === 'failed') {
        update.error = b?.data?.message?.channel_failure_reason ?? 'Failed at Interakt'
      }
      return [update]
    },
  }
}
