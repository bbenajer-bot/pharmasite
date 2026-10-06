/** Shared shop vocabulary: payment methods, fulfillment options, order statuses. */

export const paymentMethods = [
  { value: 'paypal', label: 'PayPal', hint: 'Pay from your PayPal balance, bank or card.' },
  { value: 'venmo', label: 'Venmo', hint: 'Send payment from the Venmo app.' },
  { value: 'cashapp', label: 'Cash App', hint: 'Send payment from the Cash App.' },
  { value: 'zelle', label: 'Zelle', hint: 'Send payment from your bank’s app.' },
  { value: 'applepay', label: 'Apple Pay (Apple Cash)', hint: 'Send payment from Messages or Wallet on iPhone.' },
  {
    value: 'invoice',
    label: 'Credit or debit card',
    hint: 'We email you a secure invoice link to pay by card.',
  },
] as const

export type PaymentMethod = (typeof paymentMethods)[number]['value']

export const fulfillmentOptions = [
  { value: 'pickup', label: 'Pick up at the pharmacy' },
  { value: 'local-delivery', label: 'Local delivery' },
  { value: 'shipping', label: 'Ship by mail' },
] as const

export type Fulfillment = (typeof fulfillmentOptions)[number]['value']

export const orderStatuses = [
  { value: 'awaiting-payment', label: 'Awaiting payment' },
  { value: 'paid', label: 'Paid' },
  { value: 'shipped', label: 'Shipped / out for delivery / ready for pickup' },
  { value: 'delivered', label: 'Delivered / picked up' },
  { value: 'cancelled', label: 'Cancelled' },
] as const

export type OrderStatus = (typeof orderStatuses)[number]['value']

export const labelOf = <T extends { value: string; label: string }>(list: readonly T[], value: string) =>
  list.find((o) => o.value === value)?.label ?? value

/** Delivery options and fees, safe to pass to client components. */
export type FeeSettings = {
  fulfillment: { value: Fulfillment; feeCents: number }[]
  /** Shipping is free when the subtotal is at least this (null = never). */
  freeShippingOverCents: number | null
}

/** Fee for the chosen option (free shipping over the threshold). null if the option is off. */
export function fulfillmentFeeCents(
  settings: FeeSettings,
  choice: Fulfillment,
  subtotalCents: number,
): number | null {
  const option = settings.fulfillment.find((f) => f.value === choice)
  if (!option) return null
  if (
    choice === 'shipping' &&
    settings.freeShippingOverCents != null &&
    subtotalCents >= settings.freeShippingOverCents
  ) {
    return 0
  }
  return option.feeCents
}

/** Most of one product a customer can order online. */
export const MAX_PER_LINE = 10

/** Unpaid orders get a reminder after this many hours and are cancelled after this many days. */
export const PAYMENT_REMINDER_HOURS = 48
export const PAYMENT_CANCEL_DAYS = 7
