import { after } from 'next/server'
import type { Payload } from 'payload'

import { reportError } from '@/lib/monitoring'

import { processDueMessages } from './send'

let lastRun = 0

/**
 * Sends retries that are due, after the current response has gone out. Called on bookings,
 * enquiries and admin dashboard visits so retries keep moving even between scheduled runs
 * (the free Vercel plan only allows a daily cron). At most once a minute per server.
 */
export function kickDueRetries(payload: Payload) {
  const now = Date.now()
  if (now - lastRun < 60_000) return
  lastRun = now
  after(async () => {
    try {
      await processDueMessages(payload)
    } catch (err) {
      await reportError(err, 'whatsapp-retry')
    }
  })
}
