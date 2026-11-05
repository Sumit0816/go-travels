/**
 * Delivery-status rules shared by sending, retries and webhooks. Pure, so they are unit-tested.
 */

export type LogStatus = 'queued' | 'sent' | 'delivered' | 'read' | 'failed'
export type ParentStatus = LogStatus | 'notSent'

const RANK: Record<LogStatus, number> = { failed: 1, queued: 2, sent: 3, delivered: 4, read: 5 }

/**
 * A booking's or enquiry's status from its team alerts: the best one wins, so it reads
 * "Delivered" as soon as any recipient has it, and "Failed" only when every alert failed.
 */
export function combineStatuses(statuses: LogStatus[]): ParentStatus {
  if (!statuses.length) return 'notSent'
  return statuses.reduce((best, s) => (RANK[s] > RANK[best] ? s : best))
}

/**
 * Whether a webhook receipt may replace the current status. Receipts arrive out of order, so
 * status only moves forward; "failed" is accepted until the message was delivered.
 */
export function acceptsUpdate(current: LogStatus, next: LogStatus): boolean {
  if (next === 'failed') return current === 'queued' || current === 'sent'
  if (current === 'failed') return false
  return RANK[next] > RANK[current]
}

/** Total tries per message: the first send plus three retries. */
export const MAX_ATTEMPTS = 4

/** Wait before retry n (after attempt n): 1 min, 5 min, 15 min. */
const BACKOFF_MS = [60_000, 5 * 60_000, 15 * 60_000]

/** When to try again after `attempts` tries, or null when it should give up. */
export function nextAttemptAt(attempts: number, retryable: boolean, now = new Date()): Date | null {
  if (!retryable || attempts >= MAX_ATTEMPTS) return null
  const wait = BACKOFF_MS[Math.min(attempts, BACKOFF_MS.length) - 1] ?? BACKOFF_MS[0]!
  return new Date(now.getTime() + wait)
}
