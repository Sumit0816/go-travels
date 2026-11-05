import { sql } from '@payloadcms/db-postgres'
import type { Payload } from 'payload'

/**
 * Human-friendly request IDs shown to customers and staff:
 *   bookings  → GT-24001, GT-24002 …
 *   enquiries → EQ-1001, EQ-1002 …
 * Each kind has a row in the `counters` table, incremented with a single atomic
 * INSERT … ON CONFLICT … RETURNING, so two requests arriving at once never share an ID.
 */
export const REQUEST_ID_COUNTERS = {
  booking: { prefix: 'GT', key: 'booking_request', start: 24001 },
  enquiry: { prefix: 'EQ', key: 'enquiry_request', start: 1001 },
} as const

export type RequestIdKind = keyof typeof REQUEST_ID_COUNTERS

export function formatRequestId(prefix: string, n: number): string {
  return `${prefix}-${n}`
}

export function isRequestId(kind: RequestIdKind, value: string): boolean {
  const { prefix } = REQUEST_ID_COUNTERS[kind]
  return new RegExp(`^${prefix}-\\d+$`).test(value)
}

type DrizzleLike = { execute: (query: unknown) => Promise<{ rows: Record<string, unknown>[] }> }

export async function nextRequestId(payload: Payload, kind: RequestIdKind): Promise<string> {
  const { prefix, key, start } = REQUEST_ID_COUNTERS[kind]
  const db = (payload.db as unknown as { drizzle: DrizzleLike }).drizzle
  const result = await db.execute(sql`
    INSERT INTO counters (key, value, updated_at, created_at)
    VALUES (${key}, ${start}, now(), now())
    ON CONFLICT (key) DO UPDATE SET value = counters.value + 1, updated_at = now()
    RETURNING value
  `)
  return formatRequestId(prefix, Number(result.rows[0].value))
}
