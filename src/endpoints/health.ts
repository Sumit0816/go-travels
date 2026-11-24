import type { Endpoint } from 'payload'

/**
 * GET /api/health : for uptime monitors. Checks the database with a cheap count and reports
 * nothing else (no versions or settings).
 */
export const health: Endpoint = {
  path: '/health',
  method: 'get',
  handler: async (req) => {
    try {
      await req.payload.count({ collection: 'packages', overrideAccess: true })
      return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
    } catch {
      return Response.json({ ok: false }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
    }
  },
}
