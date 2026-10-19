import type { Payload } from 'payload'

import { getSiteSettings } from '@/lib/settings'
import { button, layout, sendEmail, siteUrl, staffEmail } from './send'

/** Shop Settings → Notifications → prescription email, else the usual staff address. */
async function doctorEmail(payload: Payload): Promise<string> {
  try {
    const shop = await payload.findGlobal({ slug: 'shop-settings', depth: 0 })
    if (shop.prescriptionNotifyEmail?.trim()) return shop.prescriptionNotifyEmail.trim()
  } catch {}
  return staffEmail(payload)
}

/**
 * Doctor: "New prescription request #N". Deliberately contains NO health details and no patient
 * name: email isn't a safe place for them. Everything else stays in the admin dashboard.
 */
export async function sendNewRequestToDoctor(
  payload: Payload,
  req: { id: number | string; requestNumber?: number | null; kind: 'new' | 'refill' },
) {
  const site = await getSiteSettings()
  const to = await doctorEmail(payload)
  const what = req.kind === 'refill' ? 'refill request' : 'prescription request'
  const subject = `New ${what} #${req.requestNumber}`
  const link = `${siteUrl()}/admin/collections/prescription-requests/${req.id}`
  const html = layout(
    site,
    `<h1 style="font-size:20px;margin:0 0 12px">${subject}</h1>
<p style="margin:0">A new ${what} arrived through the website. Sign in to the admin dashboard to view it.</p>
${button(link, 'View the request')}`,
  )
  const text = `${subject}\nView it in the admin dashboard: ${link}`
  return sendEmail(payload, { to, subject, html, text })
}
