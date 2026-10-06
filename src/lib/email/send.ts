import type { Payload } from 'payload'

import { getSiteSettings } from '@/lib/settings'
import type { SiteSettings } from '@/lib/site'

/** Absolute site URL for links in emails (no trailing slash). */
export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '')
}

export function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Simple, email-client-safe wrapper (inline styles, single column). `body` must already be escaped. */
export function layout(site: SiteSettings, body: string): string {
  return `<!doctype html>
<html><body style="margin:0;background:#f6f9fd;font-family:Arial,Helvetica,sans-serif;color:#0b1f3a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f9fd;padding:24px 12px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e3e9f2;border-radius:12px">
<tr><td style="padding:24px 28px;border-bottom:1px solid #e3e9f2;font-size:18px;font-weight:bold;color:#1f5fc4">${esc(site.name)}</td></tr>
<tr><td style="padding:24px 28px;font-size:15px;line-height:1.6">${body}</td></tr>
<tr><td style="padding:20px 28px;border-top:1px solid #e3e9f2;font-size:12px;line-height:1.5;color:#5b6b80">
${esc(site.name)} · ${esc(site.fullAddress)} · ${esc(site.phone)}<br>
Not for emergencies. In an emergency, call 911.
</td></tr>
</table>
</td></tr></table>
</body></html>`
}

export function button(href: string, label: string): string {
  return `<p style="margin:24px 0"><a href="${esc(href)}" style="display:inline-block;background:#1f5fc4;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:999px">${esc(label)}</a></p>`
}

type Message = { to: string; subject: string; html: string; text: string; replyTo?: string }

/**
 * Send one email. Never throws: a failed email must not fail the order or form that triggered it.
 * Without RESEND_API_KEY, Payload prints the email to the server console instead of sending it.
 */
export async function sendEmail(payload: Payload, message: Message): Promise<boolean> {
  try {
    await payload.sendEmail(message)
    return true
  } catch (err) {
    payload.logger.error({ err, subject: message.subject }, 'Email could not be sent')
    return false
  }
}

/** Where staff notifications go: Shop Settings → Notifications, else the pharmacy email. */
export async function staffEmail(payload: Payload): Promise<string> {
  const site = await getSiteSettings()
  try {
    const shop = await payload.findGlobal({ slug: 'shop-settings', depth: 0 })
    return shop.notifyEmail?.trim() || site.email
  } catch {
    return site.email
  }
}
