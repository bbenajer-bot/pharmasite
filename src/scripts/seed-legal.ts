/**
 * Starter DRAFTS of the Privacy Policy, Terms of Use, and Accessibility statement. The client's
 * attorney reviews and edits them in /admin → Settings → Legal Pages. The Notice of Privacy Practices
 * is not drafted here: the client supplies it.
 *
 *   pnpm seed:legal                            # local database
 *   DATABASE_URL=<neon url> pnpm seed:legal    # live preview database
 *
 * Safe to run twice: a page that already has text is left alone.
 *
 * The drafts describe how this website actually works (pay-by-email orders, OTC-only shop,
 * prescription requests deleted after 90 days, no analytics or tracking cookies). If any of that
 * changes, update the text here and in the admin.
 */
import config from '@payload-config'
import { convertMarkdownToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import { getPayload } from 'payload'

import type { LegalPage } from '@/payload-types'
import { PAYMENT_CANCEL_DAYS } from '@/lib/shop'
import { REQUEST_RETENTION_DAYS } from '@/lib/prescriptions'

const privacy = `
This policy explains what information {name} ("we", "us") collects through this website, how we use it, and the choices you have. It covers this website only. How we handle your health information as a patient of our pharmacy is described in our [Notice of Privacy Practices](/hipaa-notice).

## Information you give us

We only collect information you choose to send us through the website's forms:

- **Contact form:** your name, email address, phone number (optional), and your message.
- **Online orders:** your name, email address, phone number, delivery or shipping address, the products you order, any note you add, and the payment method you prefer.
- **Prescription and refill requests:** your name, date of birth, phone number, email address (optional), the medication you're asking about, the reason or symptoms you describe, your current medications, allergies, prescription number (for refills), and whether you'd like pickup or delivery, with your address for delivery.

## Payments

We don't take card or bank details on this website. After you place an order, we email you instructions to pay through the service you chose (such as PayPal, Venmo, Cash App, Zelle, Apple Cash, or a card invoice). That service handles your payment under its own privacy policy.

## How we use your information

- To answer your messages and questions.
- To process, deliver, and support your orders, including emails about payment, shipping, and pickup.
- To review prescription and refill requests and contact you about them.
- To keep the website secure and working properly.

We don't sell your personal information, and we don't use it for advertising. We don't send marketing emails.

## Prescription requests

Prescription and refill requests are seen only by our pharmacy and medical staff, after they log in to the website's secure admin area. The email that tells our staff about a new request contains only a request number and a link, never your name or health details. Requests are automatically deleted from the website ${REQUEST_RETENTION_DAYS} days after they're sent. Information that becomes part of your pharmacy or medical record is kept as the law requires.

Submitting a request doesn't guarantee a prescription. The prescriber decides whether a prescription is appropriate, which may require a visit or consultation.

## Cookies and similar technologies

This website doesn't use advertising or analytics cookies, and it doesn't track you across other websites.

- Your shopping cart is saved in your own browser (local storage) so it's still there when you come back. You can clear it at any time by emptying the cart or clearing your browser's site data.
- Staff who log in to the admin area receive a login cookie. Visitors never do.

## Who we share information with

We share information only as needed to run the website and serve you:

- **Service providers** that host the website and its database, send its emails, and store its images. They process information on our behalf and may not use it for their own purposes.
- **Delivery carriers**, when you choose shipping or delivery, receive your name and address.
- **When the law requires it**, for example to respond to a valid legal request, or to protect someone's health or safety.

## How long we keep information

- Prescription and refill requests: deleted from the website after ${REQUEST_RETENTION_DAYS} days.
- Orders: kept for our business and tax records. Orders not paid within ${PAYMENT_CANCEL_DAYS} days are cancelled.
- Contact messages: kept as long as needed to answer you, then deleted.

## Security

Information sent through this website is encrypted in transit (HTTPS), and only authorized staff can see what you send. No website or email system is completely secure, so please don't send more health information than the form asks for. If a security breach affects your personal information, we will notify you as the law requires.

## Your choices

You can ask us to see, correct, or delete the information you've sent through this website. Contact us using the details below. We may need to keep some information when the law requires it (for example, pharmacy records).

## Children

This website is not intended for children under 13, and we don't knowingly collect their information. A parent or guardian may send a request on behalf of a child.

## Changes to this policy

We may update this policy from time to time. The date at the top of this page shows when it last changed.

## Contact us

- {name}, {address}
- Phone: {phone}
- Email: {email}
`

const terms = `
These terms apply when you use the {name} website, place an order in our online shop, or send us a request. By using the website, you agree to them. If you don't agree, please don't use the website.

## Not medical advice

Articles and other information on this website are for general information only. They are not medical advice and don't replace a conversation with your doctor or pharmacist. Using this website doesn't create a doctor–patient or pharmacist–patient relationship.

**This website is not for emergencies. If you think you're having a medical emergency, call 911 right away.**

## Prescription and refill requests

A prescription request is a request, not an order. Our prescriber decides whether a prescription is appropriate and may need to speak with you, see you, or ask for more information first. We can't guarantee that a request will be approved or filled by a particular time. Please give accurate and complete information, and call us if your need is urgent.

Prescription medicines are never sold through the online shop.

## Online orders

- The online shop sells over-the-counter products only. You must be at least 18 years old to place an order.
- Placing an order sends us a request to buy. We then email you payment instructions for the method you chose. Your order is confirmed once we receive your payment.
- Orders not paid within ${PAYMENT_CANCEL_DAYS} days are cancelled automatically.
- Prices are in US dollars and may change without notice. If a price or product description on the website is wrong, we'll contact you before taking payment, and you can cancel.
- We may limit quantities or decline an order, for example when a product is out of stock or limited by law.
- Delivery and shipping times are estimates. Local delivery is available only within our delivery area.

## Returns

For your safety, we can't accept returns of medicines or health products once they've left the pharmacy. If an item arrives damaged, or isn't what you ordered, contact us within 7 days of receiving it and we'll replace it or refund you.

## Using the website

Please don't misuse the website: don't try to break into it or its admin area, interfere with how it works, send false requests, or use it for anything unlawful.

## Content and links

The text, images, and design of this website belong to {name} or are used with permission. Product names and images belong to their manufacturers. Links to other websites are provided for convenience; we're not responsible for their content.

## Disclaimer and limitation of liability

We work hard to keep the website accurate and available, but it is provided "as is", without warranties of any kind, to the extent the law allows. To the extent the law allows, {name} is not liable for indirect or consequential losses arising from your use of the website. Nothing in these terms limits rights you have under the law that can't be waived.

## Governing law

These terms are governed by the laws of the State of Illinois.

## Changes

We may update these terms from time to time. The date at the top of this page shows when they last changed. Using the website after a change means you accept the updated terms.

## Contact us

- {name}, {address}
- Phone: {phone}
- Email: {email}
`

const accessibility = `
{name} wants everyone to be able to use this website, including people with disabilities.

## Our goal

We aim for this website to meet the Web Content Accessibility Guidelines (WCAG) 2.2, Level AA. These guidelines explain how to make websites easier to use for people who are blind or have low vision, are deaf or hard of hearing, or have limited movement, speech, or learning and cognitive disabilities.

## What we've done

- Pages use headings, landmarks, and labels so they work with screen readers.
- Every part of the website can be used with a keyboard, and the focus is always visible.
- Text and buttons have strong color contrast, and text can be enlarged without breaking the layout.
- Images that carry information have text descriptions.
- Forms explain what each field needs and describe any errors in words, not color alone.
- The website works on phones, tablets, and computers.

## Known limitations

Some content comes from other sources, such as product images and descriptions from manufacturers, and may not be fully accessible. We review the website regularly and fix problems as we find them.

## Other ways to reach us

If any part of the website is hard for you to use, we're happy to help another way. You can place an order, request a refill, or ask a question by phone at {phone}, or in person at {address}.

## Feedback

Please tell us about any accessibility problem you find, including the page and what happened. We'll do our best to reply within 2 business days.

- Phone: {phone}
- Email: {email}
`

const drafts: { key: 'privacy' | 'terms' | 'accessibility'; markdown: string }[] = [
  { key: 'privacy', markdown: privacy },
  { key: 'terms', markdown: terms },
  { key: 'accessibility', markdown: accessibility },
]

const hasText = (content: unknown) => JSON.stringify(content ?? {}).includes('"text":"')

const payload = await getPayload({ config })
const editorConfig = await editorConfigFactory.default({ config: payload.config })
const current = await payload.findGlobal({ slug: 'legal-pages', depth: 0 })
const today = new Date().toISOString()

const data: Partial<LegalPage> = {}
for (const { key, markdown } of drafts) {
  if (hasText(current[key]?.content)) {
    payload.logger.info(`Legal pages: "${key}" already has text, left alone`)
    continue
  }
  data[key] = {
    lastUpdated: today,
    content: convertMarkdownToLexical({ editorConfig, markdown: markdown.trim() }) as never,
  }
  payload.logger.info(`Legal pages: "${key}" draft added`)
}

if (Object.keys(data).length) {
  await payload.updateGlobal({ slug: 'legal-pages', data: { ...current, ...data } })
}
process.exit(0)
