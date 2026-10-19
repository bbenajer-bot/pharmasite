import { timingSafeEqual } from 'crypto'
import type { Endpoint } from 'payload'

function authorized(header: string | null): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret || !header) return false
  const expected = Buffer.from(`Bearer ${secret}`)
  const given = Buffer.from(header)
  return given.length === expected.length && timingSafeEqual(given, expected)
}

/** POST /api/cron/maintenance — called by the Netlify scheduled function with `Authorization: Bearer $CRON_SECRET`. */
export const cronMaintenance: Endpoint = {
  path: '/cron/maintenance',
  method: 'post',
  handler: async (req) => {
    if (!authorized(req.headers.get('authorization'))) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { runMaintenance } = await import('@/lib/maintenance')
    const result = await runMaintenance(req.payload)
    req.payload.logger.info(result, 'Maintenance run finished')
    return Response.json(result)
  },
}
