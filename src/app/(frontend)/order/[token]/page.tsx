import config from '@payload-config'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import { CheckCircle2, Mail } from 'lucide-react'

import { formatUSD } from '@/lib/money'
import { getSiteSettings } from '@/lib/settings'
import {
  fulfillmentOptions,
  labelOf,
  orderStatuses,
  paymentMethods,
  PAYMENT_CANCEL_DAYS,
} from '@/lib/shop'

export const metadata: Metadata = {
  title: 'Your order',
  description: 'Order status and details.',
  robots: { index: false, follow: false },
}

// Always show the current status.
export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ token: string }> }

/** Customer's order page. The URL contains a long random token, so only people with the link can see it. */
export default async function OrderPage({ params }: Props) {
  const { token } = await params
  if (!/^[A-Za-z0-9_-]{32}$/.test(token)) notFound()

  const payload = await getPayload({ config })
  const [res, site] = await Promise.all([
    payload.find({
      collection: 'orders',
      where: { accessToken: { equals: token } },
      limit: 1,
      depth: 0,
    }),
    getSiteSettings(),
  ])
  const order = res.docs[0]
  if (!order) notFound()

  const awaiting = order.status === 'awaiting-payment'

  return (
    <div className="container-page max-w-3xl py-12 md:py-16">
      {awaiting && <CheckCircle2 className="size-10 text-mint-700" aria-hidden />}
      <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
        {awaiting ? 'Thank you, your order is placed' : `Order #${order.orderNumber}`}
      </h1>
      <p className="mt-3 text-lg text-ink-soft">
        Order <strong className="text-ink">#{order.orderNumber}</strong> · Status:{' '}
        <strong className="text-ink">{labelOf(orderStatuses, order.status)}</strong>
      </p>

      {awaiting && (
        <section aria-labelledby="next-heading" className="mt-8 rounded-2xl border border-brand-100 bg-brand-50 p-6">
          <h2 id="next-heading" className="flex items-center gap-2 text-xl font-bold">
            <Mail className="size-5 text-brand-600" aria-hidden /> What happens next
          </h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-ink-soft">
            <li>
              We’ve emailed a confirmation to <strong className="text-ink">{order.email}</strong>.
            </li>
            <li>
              We’ll check your order and email you instructions to pay by{' '}
              {labelOf(paymentMethods, order.paymentMethod)}, usually within one business day.
            </li>
            <li>Once your payment arrives, we prepare your order and let you know.</li>
          </ol>
          <p className="mt-4 text-sm text-ink-soft">
            Unpaid orders are cancelled after {PAYMENT_CANCEL_DAYS} days. Questions? Call{' '}
            <a href={site.phoneHref} className="font-semibold text-brand-600">
              {site.phone}
            </a>
            . Bookmark this page to check your order status.
          </p>
        </section>
      )}

      <section aria-labelledby="items-heading" className="mt-10">
        <h2 id="items-heading" className="text-xl font-bold">
          Items
        </h2>
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {order.items.map((i) => (
            <li key={i.id} className="flex justify-between gap-4 py-3">
              <span>
                {i.name} <span className="text-muted">× {i.quantity}</span>
              </span>
              <span className="font-medium">{formatUSD(i.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 ml-auto max-w-xs space-y-2 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{formatUSD(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>{labelOf(fulfillmentOptions, order.fulfillment)}</dt>
            <dd>{order.fulfillmentFee ? formatUSD(order.fulfillmentFee) : 'Free'}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-2 text-lg font-bold">
            <dt>Total</dt>
            <dd>{formatUSD(order.total)}</dd>
          </div>
        </dl>
        <p className="mt-2 text-right text-xs text-muted">Any sales tax is added to your invoice.</p>
      </section>

      <section aria-labelledby="delivery-heading" className="mt-10 grid gap-6 sm:grid-cols-2">
        <div>
          <h2 id="delivery-heading" className="text-lg font-bold">
            {labelOf(fulfillmentOptions, order.fulfillment)}
          </h2>
          {order.fulfillment === 'pickup' ? (
            <p className="mt-2 text-ink-soft">
              {site.name}
              <br />
              {site.fullAddress}
            </p>
          ) : (
            order.address && (
              <p className="mt-2 text-ink-soft">
                {order.address.line1}
                {order.address.line2 && (
                  <>
                    <br />
                    {order.address.line2}
                  </>
                )}
                <br />
                {order.address.city}, {order.address.state} {order.address.zip}
              </p>
            )
          )}
          {order.trackingInfo && <p className="mt-2 text-sm text-ink-soft">Tracking: {order.trackingInfo}</p>}
        </div>
        <div>
          <h2 className="text-lg font-bold">Payment</h2>
          <p className="mt-2 text-ink-soft">{labelOf(paymentMethods, order.paymentMethod)}</p>
        </div>
      </section>

      <Link href="/shop" className="btn btn-secondary mt-12">
        Continue shopping
      </Link>
    </div>
  )
}
