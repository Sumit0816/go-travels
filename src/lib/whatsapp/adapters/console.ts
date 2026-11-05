import type { WhatsAppAdapter } from './types'

/**
 * Development / CI adapter: prints the message instead of sending it and reports it as sent.
 * Used when no provider key is saved (outside production) or when WHATSAPP_ADAPTER=console.
 */
export function consoleAdapter(): WhatsAppAdapter {
  return {
    id: 'console',
    async send({ to, template, text }) {
      const id = `console-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
      console.info(`[whatsapp:console] to +${to} (${template.name || 'no template'})\n${text}`)
      return { providerMessageId: id }
    },
    parseWebhook: () => [],
  }
}
