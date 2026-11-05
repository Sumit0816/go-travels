/** What every WhatsApp aggregator adapter implements (one file per provider). */

export type ProviderConfig = {
  apiKey: string
  /** Business sender number, digits only with country code (e.g. 919876543210). */
  sender: string
  /** Gupshup app name (`src.name`). */
  appName?: string | null
}

export type SendArgs = {
  /** Recipient, digits with country code, no `+` (e.g. 919830122457). */
  to: string
  template: { name: string; language: string }
  /** Template values in order ({{1}}, {{2}} …). */
  params: string[]
  /** The rendered message, for adapters that log or preview it. */
  text: string
}

export type DeliveryStatus = 'sent' | 'delivered' | 'read' | 'failed'

export type StatusUpdate = {
  providerMessageId: string
  status: DeliveryStatus
  error?: string
  at?: Date
}

export interface WhatsAppAdapter {
  readonly id: string
  send(args: SendArgs): Promise<{ providerMessageId: string }>
  /** Delivery receipts from the provider's webhook. Unknown events are ignored. */
  parseWebhook(body: unknown): StatusUpdate[]
}

/** A send that failed. `retryable: false` stops further attempts (bad number, key, template). */
export class SendError extends Error {
  constructor(
    message: string,
    readonly retryable = true,
  ) {
    super(message)
    this.name = 'SendError'
  }
}

/** POST with a timeout; non-2xx responses become a SendError with the provider's message. */
export async function postJson(
  url: string,
  init: { headers: Record<string, string>; body: string | URLSearchParams },
  timeoutMs = 10_000,
): Promise<unknown> {
  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: init.headers,
      body: init.body,
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch (err) {
    throw new SendError(`Could not reach the provider: ${(err as Error).message}`)
  }
  const text = await res.text()
  let json: unknown = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = { raw: text.slice(0, 300) }
  }
  if (!res.ok) {
    const j = json as { message?: string; raw?: string } | null
    const msg = j?.message ?? j?.raw ?? res.statusText
    // 4xx (except timeouts and rate limits) won't succeed on retry: wrong key, template or number.
    const retryable = res.status >= 500 || res.status === 429 || res.status === 408
    throw new SendError(`Provider error ${res.status}: ${msg}`, retryable)
  }
  return json
}
