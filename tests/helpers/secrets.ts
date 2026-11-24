import type { Payload } from 'payload'

import { INCLUDE_SECRETS } from '@/fields/secret'

/**
 * Integration tests change the WhatsApp key and Telegram token. These snapshot the stored
 * (encrypted) values first and put them back exactly afterwards, so running the tests against
 * a developer's database never wipes their real credentials.
 */
export type SecretsSnapshot = {
  apiKey: string | null
  apiKeyHint: string | null
  telegramBotToken: string | null
  telegramTokenHint: string | null
}

export async function snapshotSecrets(payload: Payload): Promise<SecretsSnapshot> {
  const [wa, team] = await Promise.all([
    payload.findGlobal({
      slug: 'whatsappSettings',
      overrideAccess: true,
      context: INCLUDE_SECRETS,
    }),
    payload.findGlobal({ slug: 'teamAlerts', overrideAccess: true, context: INCLUDE_SECRETS }),
  ])
  return {
    apiKey: wa.apiKey ?? null,
    apiKeyHint: wa.apiKeyHint ?? null,
    telegramBotToken: team.telegramBotToken ?? null,
    telegramTokenHint: team.telegramTokenHint ?? null,
  }
}

export async function restoreSecrets(payload: Payload, s: SecretsSnapshot) {
  // An encrypted value is stored as-is; an empty original is cleared with the reset context.
  await payload.updateGlobal({
    slug: 'whatsappSettings',
    data: { apiKey: s.apiKey, apiKeyHint: s.apiKeyHint },
    overrideAccess: true,
    context: s.apiKey ? {} : { resetWhatsAppKey: true },
  })
  await payload.updateGlobal({
    slug: 'teamAlerts',
    data: { telegramBotToken: s.telegramBotToken, telegramTokenHint: s.telegramTokenHint },
    overrideAccess: true,
    context: s.telegramBotToken ? {} : { resetWhatsAppKey: true },
  })
}
