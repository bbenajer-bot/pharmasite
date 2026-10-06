import type { Payload } from 'payload'

import { getSiteSettings } from '@/lib/settings'
import { button, esc, layout, sendEmail, siteUrl, staffEmail } from './send'

/**
 * Staff: "New contact message from …". The message itself is not included: visitors sometimes
 * write health details despite the warning, so it stays in the admin dashboard only.
 */
export async function sendNewContactToStaff(payload: Payload, msg: { id: number | string; name: string }) {
  const site = await getSiteSettings()
  const to = await staffEmail(payload)
  const link = `${siteUrl()}/admin/collections/contact-messages/${msg.id}`
  const html = layout(
    site,
    `<h1 style="font-size:20px;margin:0 0 12px">New contact message</h1>
<p style="margin:0">${esc(msg.name)} sent a message through the website. Read and reply from the admin dashboard.</p>
${button(link, 'Read the message')}`,
  )
  const text = `New contact message from ${msg.name}.\nRead it in the admin dashboard: ${link}`
  return sendEmail(payload, { to, subject: `New contact message from ${msg.name}`, html, text })
}
