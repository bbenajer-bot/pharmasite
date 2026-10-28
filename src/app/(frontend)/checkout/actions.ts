'use server'

import config from '@payload-config'
import { getPayload } from 'payload'

import { publicProductsWhere } from '@/collections/Products'
import { fromCents, toCents } from '@/lib/money'
import { getSiteSettings } from '@/lib/settings'
import { lineKey, nameWithOption } from '@/lib/product-options'
import { getShopSettings } from '@/lib/shop-settings'
import { fulfillmentFeeCents, MAX_PER_LINE, type Fulfillment, type PaymentMethod } from '@/lib/shop'

export type CheckoutFields = {
  name: string
  email: string
  phone: string
  fulfillment: string
  line1: string
  line2: string
  city: string
  state: string
  zip: string
  paymentMethod: string
  note: string
}

export type CheckoutState = {
  status: 'idle' | 'success' | 'error'
  message?: string
  errors?: Partial<Record<keyof CheckoutFields | 'ack' | 'cart', string>>
  values?: CheckoutFields
  /** On success: secret for the "view your order" page. */
  token?: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ZIP_RE = /^\d{5}(-\d{4})?$/
const STATE_RE = /^[A-Za-z]{2}$/

type CartLine = { id: number; optionId: string | null; qty: number }

function parseCart(raw: unknown): CartLine[] | null {
  try {
    const parsed: unknown = JSON.parse(String(raw ?? ''))
    if (!Array.isArray(parsed) || parsed.length === 0 || parsed.length > 50) return null
    const lines = parsed.map((l) => ({
      id: Number(l?.id),
      optionId: typeof l?.optionId === 'string' && l.optionId ? l.optionId.slice(0, 64) : null,
      qty: Number(l?.qty),
    }))
    if (lines.some((l) => !Number.isInteger(l.id) || !Number.isInteger(l.qty) || l.qty < 1))
      return null
    // The same product + option twice (two tabs): one line with the combined quantity.
    const merged = new Map<string, CartLine>()
    for (const l of lines) {
      const key = lineKey(l)
      const prev = merged.get(key)
      merged.set(key, prev ? { ...prev, qty: prev.qty + l.qty } : l)
    }
    return [...merged.values()]
  } catch {
    return null
  }
}

export async function placeOrder(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const get = (k: string) => String(formData.get(k) ?? '').trim()
  const values: CheckoutFields = {
    name: get('name'),
    email: get('email'),
    phone: get('phone'),
    fulfillment: get('fulfillment'),
    line1: get('line1'),
    line2: get('line2'),
    city: get('city'),
    state: get('state').toUpperCase(),
    zip: get('zip'),
    paymentMethod: get('paymentMethod'),
    note: get('note'),
  }

  // Honeypot (see contact form). Pretend success without creating anything.
  if (get('website') !== '') return { status: 'success' }

  const [settings, site] = await Promise.all([getShopSettings(), getSiteSettings()])
  const errors: NonNullable<CheckoutState['errors']> = {}

  if (!values.name) errors.name = 'Please enter your name.'
  else if (values.name.length > 100) errors.name = 'Please use 100 characters or fewer.'
  if (!EMAIL_RE.test(values.email) || values.email.length > 200)
    errors.email = 'Please enter a valid email address.'
  const digits = values.phone.replace(/\D/g, '')
  if (digits.length < 10 || values.phone.length > 30)
    errors.phone = 'Please enter a phone number with area code.'

  const fulfillment = settings.fulfillment.find((f) => f.value === values.fulfillment)?.value
  if (!fulfillment) errors.fulfillment = 'Please choose how you’d like to get your order.'
  if (fulfillment === 'local-delivery' || fulfillment === 'shipping') {
    if (!values.line1 || values.line1.length > 120)
      errors.line1 = 'Please enter your street address.'
    if (values.line2.length > 120) errors.line2 = 'Please use 120 characters or fewer.'
    if (!values.city || values.city.length > 60) errors.city = 'Please enter your city.'
    if (!STATE_RE.test(values.state)) errors.state = 'Use the 2-letter state code, e.g. IL.'
    if (!ZIP_RE.test(values.zip)) errors.zip = 'Please enter a 5-digit ZIP code.'
  }

  const paymentMethod = settings.payment.find((p) => p.value === values.paymentMethod)?.value
  if (!paymentMethod) errors.paymentMethod = 'Please choose how you’d like to pay.'
  if (values.note.length > 500) errors.note = 'Please keep your note under 500 characters.'
  if (formData.get('ack') !== 'yes') errors.ack = 'Please confirm you understand how payment works.'

  const lines = parseCart(formData.get('cart'))
  if (!lines) errors.cart = 'Your cart is empty.'

  if (Object.keys(errors).length > 0) {
    return { status: 'error', message: 'Please fix the highlighted fields.', errors, values }
  }

  const payload = await getPayload({ config })
  try {
    // Re-read every product: price, stock and OTC status come from the database, not the browser.
    const ids = [...new Set(lines!.map((l) => l.id))]
    const found = await payload.find({
      collection: 'products',
      where: { and: [publicProductsWhere, { id: { in: ids } }] },
      limit: ids.length,
      depth: 0,
      overrideAccess: false,
    })
    const problems: string[] = []
    const items = lines!.map((line) => {
      const p = found.docs.find((d) => d.id === line.id)
      if (!p) {
        problems.push('An item in your cart is no longer available.')
        return null
      }
      // Products with options are sold by option only; price and stock come from that option.
      const options = p.options ?? []
      const option = line.optionId ? options.find((o) => o.id === line.optionId) : null
      if (line.optionId ? !option : options.length > 0) {
        problems.push(`${p.name} is no longer available in the option you chose.`)
        return null
      }
      const name = nameWithOption(p.name, option?.label)
      const stock = option?.stock ?? p.stock
      if (line.qty > MAX_PER_LINE)
        problems.push(`You can order up to ${MAX_PER_LINE} of ${name} online.`)
      else if (line.qty > stock) {
        problems.push(
          stock > 0 ? `Only ${stock} of ${name} left in stock.` : `${name} is out of stock.`,
        )
      }
      const unitCents = toCents(option?.price ?? p.price)
      return { product: p, option, name, qty: line.qty, unitCents, lineCents: unitCents * line.qty }
    })
    if (problems.length > 0) {
      return {
        status: 'error',
        message: `${problems.join(' ')} Please review your cart.`,
        errors: { cart: 'review' },
        values,
      }
    }

    const ok = items.filter((i) => i !== null)
    const subtotalCents = ok.reduce((s, i) => s + i.lineCents, 0)
    const feeCents = fulfillmentFeeCents(settings, fulfillment as Fulfillment, subtotalCents) ?? 0
    const hasAddress = fulfillment !== 'pickup'

    const order = await payload.create({
      collection: 'orders',
      data: {
        items: ok.map((i) => ({
          product: i.product.id,
          name: i.name,
          option: i.option?.label,
          optionId: i.option?.id ?? undefined,
          sku: i.option?.sku ?? i.product.sku ?? undefined,
          unitPrice: fromCents(i.unitCents),
          quantity: i.qty,
          lineTotal: fromCents(i.lineCents),
        })),
        subtotal: fromCents(subtotalCents),
        fulfillmentFee: fromCents(feeCents),
        total: fromCents(subtotalCents + feeCents),
        customerNote: values.note || undefined,
        customerName: values.name,
        email: values.email,
        phone: values.phone,
        fulfillment: fulfillment as Fulfillment,
        address: hasAddress
          ? {
              line1: values.line1,
              line2: values.line2 || undefined,
              city: values.city,
              state: values.state,
              zip: values.zip,
            }
          : undefined,
        paymentMethod: paymentMethod as PaymentMethod,
        // Set by the collection hook; required by the generated type.
        status: 'awaiting-payment',
      },
    })

    // Reserve stock (returned automatically if the order is cancelled). One update per product: the
    // same product can be in the cart in two options. Option stock changes recalculate the total.
    for (const product of new Map(ok.map((i) => [i.product.id, i.product])).values()) {
      const lines = ok.filter((i) => i.product.id === product.id)
      const data = product.options?.length
        ? {
            options: product.options.map((o) => {
              const ordered = lines
                .filter((i) => i.option?.id === o.id)
                .reduce((n, i) => n + i.qty, 0)
              return { ...o, stock: Math.max(0, o.stock - ordered) }
            }),
          }
        : { stock: Math.max(0, product.stock - lines.reduce((n, i) => n + i.qty, 0)) }
      await payload.update({ collection: 'products', id: product.id, data })
    }

    return { status: 'success', token: order.accessToken ?? undefined }
  } catch (err) {
    console.error('Checkout: could not place order', err)
    return {
      status: 'error',
      message: `Sorry, we couldn't place your order right now. Please try again or call us at ${site.phone}.`,
      values,
    }
  }
}
