import { consoleAdapter } from './console'
import { gupshupAdapter } from './gupshup'
import { interaktAdapter } from './interakt'
import { SendError, type ProviderConfig, type WhatsAppAdapter } from './types'

export { SendError } from './types'
export type { DeliveryStatus, ProviderConfig, StatusUpdate, WhatsAppAdapter } from './types'

export const SUPPORTED_PROVIDERS = ['gupshup', 'interakt'] as const

/** Adapter for reading a provider's webhook (no credentials needed). */
export function webhookAdapter(provider: string): WhatsAppAdapter | null {
  const blank: ProviderConfig = { apiKey: '', sender: '' }
  if (provider === 'gupshup') return gupshupAdapter(blank)
  if (provider === 'interakt') return interaktAdapter(blank)
  return null
}

/**
 * The adapter to send with. Without a saved key, development and CI print messages to the
 * console; production fails, so the email fallback and the failure screen take over.
 */
export function sendingAdapter(
  provider: string,
  cfg: ProviderConfig | null,
  env: { NODE_ENV?: string; WHATSAPP_ADAPTER?: string } = process.env,
): WhatsAppAdapter {
  if (env.WHATSAPP_ADAPTER === 'console') return consoleAdapter()
  if (!cfg?.apiKey || !cfg.sender) {
    if (env.NODE_ENV !== 'production') return consoleAdapter()
    return unavailable(
      'WhatsApp is not connected: save the API key and sender number in WhatsApp Integration.',
    )
  }
  if (provider === 'gupshup') return gupshupAdapter(cfg)
  if (provider === 'interakt') return interaktAdapter(cfg)
  return unavailable(
    `Sending through "${provider}" is not supported yet. Choose Gupshup or Interakt.`,
  )
}

function unavailable(message: string): WhatsAppAdapter {
  return {
    id: 'unavailable',
    send: async () => {
      throw new SendError(message, false)
    },
    parseWebhook: () => [],
  }
}
