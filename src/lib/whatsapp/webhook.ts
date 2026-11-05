/** Applies provider delivery receipts (sent / delivered / read / failed) to the delivery log. */
import { timingSafeEqual } from 'node:crypto'

import type { Payload } from 'payload'

import type { StatusUpdate } from './adapters'
import { refreshParent } from './send'
import { acceptsUpdate } from './status'

/** Constant-time check of the `?token=` the provider calls back with. */
export function webhookTokenMatches(
  given: string | null,
  expected = process.env.WHATSAPP_WEBHOOK_SECRET,
): boolean {
  if (!expected || !given) return false
  const a = Buffer.from(given)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function applyStatusUpdates(
  payload: Payload,
  updates: StatusUpdate[],
): Promise<number> {
  let applied = 0
  for (const u of updates) {
    const { docs } = await payload.find({
      collection: 'messageLog',
      where: { providerMessageId: { equals: u.providerMessageId } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const log = docs[0]
    if (!log || !acceptsUpdate(log.status, u.status)) continue
    const at = (u.at ?? new Date()).toISOString()
    await payload.update({
      collection: 'messageLog',
      id: log.id,
      data: {
        status: u.status,
        ...(u.status === 'delivered' ? { deliveredAt: at } : {}),
        ...(u.status === 'read' ? { readAt: at, deliveredAt: log.deliveredAt ?? at } : {}),
        ...(u.status === 'failed' ? { error: u.error ?? 'Failed at provider' } : {}),
      },
      overrideAccess: true,
    })
    if (log.kind === 'booking' || log.kind === 'enquiry') await refreshParent(payload, log)
    applied++
  }
  return applied
}
