/**
 * Netlify scheduled function (free plan): every 6 hours, ask the site to run its housekeeping
 * (payment reminders, cancelling unpaid orders). The work itself lives in src/lib/maintenance.ts;
 * this only calls the protected endpoint. Scheduled functions run on published deploys only.
 *
 * Needs the Netlify env var CRON_SECRET (same value the site uses). URL is set by Netlify.
 */
export default async function maintenance(): Promise<Response> {
  const base = process.env.URL
  const secret = process.env.CRON_SECRET
  if (!base || !secret) {
    console.error('maintenance: URL or CRON_SECRET is not set')
    return new Response('Not configured', { status: 500 })
  }

  const res = await fetch(`${base}/api/cron/maintenance`, {
    method: 'POST',
    headers: { authorization: `Bearer ${secret}` },
  })
  const body = await res.text()
  if (!res.ok) console.error(`maintenance: ${res.status} ${body}`)
  else console.log(`maintenance: ${body}`)
  return new Response(body, { status: res.status })
}

export const config = { schedule: '0 */6 * * *' }
