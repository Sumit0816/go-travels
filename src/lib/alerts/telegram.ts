/**
 * Telegram Bot API (official and free): team alerts to a group, and finding the group's chat ID.
 * Docs: https://core.telegram.org/bots/api
 */
import { SendError } from '@/lib/whatsapp/adapters'

const API = 'https://api.telegram.org'

type TgResponse<T> = {
  ok: boolean
  result?: T
  error_code?: number
  description?: string
  parameters?: { retry_after?: number }
}

/** WhatsApp-style `*bold*` text → Telegram HTML (everything else escaped). */
export function toTelegramHtml(text: string): string {
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return escaped.replace(/\*([^*\n]+)\*/g, '<b>$1</b>')
}

async function call<T>(token: string, method: string, body?: object): Promise<T> {
  if (!/^\d+:[\w-]{20,}$/.test(token)) {
    throw new SendError('The Telegram bot token is missing or malformed', false)
  }
  let res: Response
  try {
    res = await fetch(`${API}/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body ?? {}),
      signal: AbortSignal.timeout(10_000),
    })
  } catch (err) {
    throw new SendError(`Could not reach Telegram: ${(err as Error).message}`)
  }
  const json = (await res.json().catch(() => null)) as TgResponse<T> | null
  if (!json?.ok) {
    const code = json?.error_code ?? res.status
    // Rate limits and Telegram outages fix themselves; a wrong token or chat doesn't.
    const retryable = code === 429 || code >= 500
    throw new SendError(`Telegram error ${code}: ${json?.description ?? res.statusText}`, retryable)
  }
  return json.result as T
}

export async function sendTelegramMessage(
  token: string,
  chatId: string,
  text: string,
): Promise<{ providerMessageId: string }> {
  const msg = await call<{ message_id: number }>(token, 'sendMessage', {
    chat_id: chatId.trim(),
    text: toTelegramHtml(text).slice(0, 4096),
    parse_mode: 'HTML',
    link_preview_options: { is_disabled: true },
  })
  return { providerMessageId: `tg-${chatId}-${msg.message_id}` }
}

export type TelegramChat = { id: string; title: string; type: string }

type Update = {
  message?: { chat: { id: number; title?: string; first_name?: string; type: string } }
  channel_post?: { chat: { id: number; title?: string; type: string } }
  my_chat_member?: { chat: { id: number; title?: string; first_name?: string; type: string } }
}

/** Groups and chats that recently messaged the bot or added it ("Find my group"). */
export async function findTelegramChats(token: string): Promise<TelegramChat[]> {
  const updates = await call<Update[]>(token, 'getUpdates', { limit: 100, timeout: 0 })
  const chats = new Map<string, TelegramChat>()
  for (const u of updates) {
    const chat = u.message?.chat ?? u.channel_post?.chat ?? u.my_chat_member?.chat
    if (!chat) continue
    const c = chat as { id: number; title?: string; first_name?: string; type: string }
    chats.set(String(c.id), {
      id: String(c.id),
      title: c.title ?? c.first_name ?? 'Private chat',
      type: c.type,
    })
  }
  return [...chats.values()]
}
