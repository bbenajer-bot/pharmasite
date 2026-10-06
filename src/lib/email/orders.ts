import type { Payload } from 'payload'

import { formatUSD } from '@/lib/money'
import { getSiteSettings } from '@/lib/settings'
import {
  fulfillmentOptions,
  labelOf,
  paymentMethods,
  PAYMENT_CANCEL_DAYS,
  type OrderStatus,
} from '@/lib/shop'
import type { Order } from '@/payload-types'
import { button, esc, layout, sendEmail, siteUrl, staffEmail } from './send'

const orderLink = (o: Order) => `${siteUrl()}/order/${o.accessToken}`
const adminLink = (o: Order) => `${siteUrl()}/admin/collections/orders/${o.id}`

function itemsTable(o: Order): string {
  const rows = o.items
    .map(
      (i) =>
        `<tr><td style="padding:6px 0">${esc(i.name)} × ${i.quantity}</td><td align="right" style="padding:6px 0">${formatUSD(i.lineTotal)}</td></tr>`,
    )
    .join('')
  const fee = o.fulfillmentFee ? formatUSD(o.fulfillmentFee) : 'Free'
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e3e9f2;border-bottom:1px solid #e3e9f2;margin:16px 0;font-size:14px">
${rows}
<tr><td style="padding:6px 0;border-top:1px solid #e3e9f2">Subtotal</td><td align="right" style="padding:6px 0;border-top:1px solid #e3e9f2">${formatUSD(o.subtotal)}</td></tr>
<tr><td style="padding:6px 0">${esc(labelOf(fulfillmentOptions, o.fulfillment))}</td><td align="right" style="padding:6px 0">${fee}</td></tr>
<tr><td style="padding:6px 0;font-weight:bold">Total</td><td align="right" style="padding:6px 0;font-weight:bold">${formatUSD(o.total)}</td></tr>
</table>`
}

function itemsText(o: Order): string {
  return [
    ...o.items.map((i) => `- ${i.name} x ${i.quantity}: ${formatUSD(i.lineTotal)}`),
    `Subtotal: ${formatUSD(o.subtotal)}`,
    `${labelOf(fulfillmentOptions, o.fulfillment)}: ${o.fulfillmentFee ? formatUSD(o.fulfillmentFee) : 'Free'}`,
    `Total: ${formatUSD(o.total)}`,
  ].join('\n')
}

function addressText(o: Order): string {
  if (o.fulfillment === 'pickup' || !o.address) return 'Pickup at the pharmacy'
  const a = o.address
  return [a.line1, a.line2, `${a.city}, ${a.state} ${a.zip}`].filter(Boolean).join(', ')
}

/** Fill {orderNumber}, {total}, {name} in the payment instructions from Shop Settings. */
export function fillInstructions(template: string, o: Order): string {
  return template
    .replace(/\{orderNumber\}/g, String(o.orderNumber))
    .replace(/\{total\}/g, formatUSD(o.total))
    .replace(/\{name\}/g, o.customerName)
}

/** Staff: "New order #1001". */
export async function sendNewOrderToStaff(payload: Payload, o: Order) {
  const site = await getSiteSettings()
  const to = await staffEmail(payload)
  const method = labelOf(paymentMethods, o.paymentMethod)
  const html = layout(
    site,
    `<h1 style="font-size:20px;margin:0 0 12px">New order #${o.orderNumber}</h1>
<p style="margin:0">${esc(o.customerName)} · ${esc(o.email)} · ${esc(o.phone)}<br>
Wants to pay by <strong>${esc(method)}</strong> · ${esc(addressText(o))}</p>
${itemsTable(o)}
${o.customerNote ? `<p style="margin:0"><strong>Customer note:</strong> ${esc(o.customerNote)}</p>` : ''}
${button(adminLink(o), 'Open order and send payment instructions')}`,
  )
  const text = `New order #${o.orderNumber}
${o.customerName} · ${o.email} · ${o.phone}
Payment: ${method}
${addressText(o)}

${itemsText(o)}
${o.customerNote ? `\nCustomer note: ${o.customerNote}\n` : ''}
Open the order: ${adminLink(o)}`
  return sendEmail(payload, { to, subject: `New order #${o.orderNumber} (${formatUSD(o.total)})`, html, text, replyTo: o.email })
}

/** Customer: "We received your order". */
export async function sendOrderReceived(payload: Payload, o: Order) {
  const site = await getSiteSettings()
  const method = labelOf(paymentMethods, o.paymentMethod)
  const html = layout(
    site,
    `<h1 style="font-size:20px;margin:0 0 12px">Thanks, we received your order #${o.orderNumber}</h1>
<p style="margin:0">Hi ${esc(o.customerName)}, your order is <strong>not paid yet</strong>. We’ll check it and email you instructions to pay by ${esc(method)}, usually within one business day.</p>
${itemsTable(o)}
<p style="margin:0">Any sales tax is added to your invoice. Unpaid orders are cancelled after ${PAYMENT_CANCEL_DAYS} days.</p>
${button(orderLink(o), 'View your order')}
<p style="margin:0;font-size:13px;color:#5b6b80">Questions? Reply to this email or call ${esc(site.phone)}.</p>`,
  )
  const text = `Thanks, we received your order #${o.orderNumber}.

Your order is not paid yet. We'll email you instructions to pay by ${method}, usually within one business day.

${itemsText(o)}

Any sales tax is added to your invoice. Unpaid orders are cancelled after ${PAYMENT_CANCEL_DAYS} days.
View your order: ${orderLink(o)}
Questions? Call ${site.phone}.`
  return sendEmail(payload, {
    to: o.email,
    subject: `We received your order #${o.orderNumber}`,
    html,
    text,
    replyTo: site.email,
  })
}

/** Customer: payment instructions for the chosen method (admin button). */
export async function sendPaymentInstructions(payload: Payload, o: Order, instructions: string) {
  const site = await getSiteSettings()
  const filled = fillInstructions(instructions, o)
  const html = layout(
    site,
    `<h1 style="font-size:20px;margin:0 0 12px">How to pay for order #${o.orderNumber}</h1>
<p style="margin:0">Hi ${esc(o.customerName)},</p>
<p style="margin:16px 0;padding:16px;background:#eef5ff;border-radius:8px">${esc(filled).replace(/\n/g, '<br>')}</p>
${itemsTable(o)}
<p style="margin:0">We’ll prepare your order as soon as your payment arrives. Unpaid orders are cancelled after ${PAYMENT_CANCEL_DAYS} days.</p>
${button(orderLink(o), 'View your order')}
<p style="margin:0;font-size:13px;color:#5b6b80">Questions? Reply to this email or call ${esc(site.phone)}.</p>`,
  )
  const text = `How to pay for order #${o.orderNumber}

${filled}

${itemsText(o)}

We'll prepare your order as soon as your payment arrives.
View your order: ${orderLink(o)}`
  return sendEmail(payload, {
    to: o.email,
    subject: `How to pay for order #${o.orderNumber}`,
    html,
    text,
    replyTo: site.email,
  })
}

const statusCopy: Partial<Record<OrderStatus, (o: Order) => { subject: string; message: string }>> = {
  paid: (o) => ({
    subject: `Payment received for order #${o.orderNumber}`,
    message: 'Thank you, we received your payment. We’re preparing your order now.',
  }),
  shipped: (o) => ({
    subject:
      o.fulfillment === 'pickup'
        ? `Order #${o.orderNumber} is ready for pickup`
        : `Order #${o.orderNumber} is on its way`,
    message:
      o.fulfillment === 'pickup'
        ? 'Your order is ready. Pick it up at the pharmacy during opening hours.'
        : o.fulfillment === 'local-delivery'
          ? 'Your order is out for delivery.'
          : 'Your order has shipped.',
  }),
  cancelled: (o) => ({
    subject: `Order #${o.orderNumber} was cancelled`,
    message: o.cancelReason
      ? `Your order was cancelled: ${o.cancelReason}`
      : 'Your order was cancelled. If you think this is a mistake, please contact us.',
  }),
}

/** Customer: status changed to paid / shipped / cancelled. Other statuses send nothing. */
export async function sendStatusUpdate(payload: Payload, o: Order) {
  const copy = statusCopy[o.status]?.(o)
  if (!copy) return false
  const site = await getSiteSettings()
  const tracking = o.trackingInfo ? `<p style="margin:16px 0 0">Tracking / delivery note: ${esc(o.trackingInfo)}</p>` : ''
  const html = layout(
    site,
    `<h1 style="font-size:20px;margin:0 0 12px">${esc(copy.subject)}</h1>
<p style="margin:0">Hi ${esc(o.customerName)}, ${esc(copy.message)}</p>
${tracking}
${o.status === 'shipped' && o.fulfillment === 'pickup' ? `<p style="margin:16px 0 0">${esc(site.name)}, ${esc(site.fullAddress)}</p>` : ''}
${button(orderLink(o), 'View your order')}
<p style="margin:0;font-size:13px;color:#5b6b80">Questions? Reply to this email or call ${esc(site.phone)}.</p>`,
  )
  const text = `${copy.subject}

${copy.message}
${o.trackingInfo ? `Tracking / delivery note: ${o.trackingInfo}\n` : ''}
View your order: ${orderLink(o)}`
  return sendEmail(payload, { to: o.email, subject: copy.subject, html, text, replyTo: site.email })
}

/** Customer: unpaid after 48 hours. */
export async function sendPaymentReminder(payload: Payload, o: Order) {
  const site = await getSiteSettings()
  const subject = `Reminder: order #${o.orderNumber} is waiting for payment`
  const html = layout(
    site,
    `<h1 style="font-size:20px;margin:0 0 12px">${esc(subject)}</h1>
<p style="margin:0">Hi ${esc(o.customerName)}, we haven’t received payment for your order yet. Please follow the payment instructions we emailed you. Unpaid orders are cancelled ${PAYMENT_CANCEL_DAYS} days after they are placed.</p>
${itemsTable(o)}
${button(orderLink(o), 'View your order')}
<p style="margin:0;font-size:13px;color:#5b6b80">Already paid, or need the instructions again? Reply to this email or call ${esc(site.phone)}.</p>`,
  )
  const text = `${subject}

We haven't received payment for your order yet. Please follow the payment instructions we emailed you.
Unpaid orders are cancelled ${PAYMENT_CANCEL_DAYS} days after they are placed.

${itemsText(o)}

View your order: ${orderLink(o)}
Already paid? Call ${site.phone}.`
  return sendEmail(payload, { to: o.email, subject, html, text, replyTo: site.email })
}
