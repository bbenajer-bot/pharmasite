import type { Metadata } from 'next'

import { getSiteSettings } from '@/lib/settings'
import { getShopSettings } from '@/lib/shop-settings'
import { CheckoutForm } from './CheckoutForm'

export const metadata: Metadata = {
  title: 'Checkout',
  description: 'Place your order. Pay by PayPal, Venmo, Cash App, Zelle, Apple Cash or card invoice.',
  robots: { index: false },
}

export default async function CheckoutPage() {
  const site = await getSiteSettings()
  const shop = await getShopSettings().catch((err) => {
    console.error('Checkout: could not load shop settings', err)
    return null
  })

  return (
    <div className="container-page py-12 md:py-16">
      <h1 className="text-3xl font-bold sm:text-4xl">Checkout</h1>
      <div className="mt-8">
        {shop && shop.fulfillment.length > 0 && shop.payment.length > 0 ? (
          <CheckoutForm
            fees={{ fulfillment: shop.fulfillment, freeShippingOverCents: shop.freeShippingOverCents }}
            payment={shop.payment.map((p) => p.value)}
            deliveryArea={site.deliveryArea}
            phone={site.phone}
            phoneHref={site.phoneHref}
          />
        ) : (
          <p className="rounded-2xl border border-line p-8 text-ink-soft">
            Online ordering is unavailable right now. Please call us at{' '}
            <a href={site.phoneHref} className="font-semibold text-brand-600">
              {site.phone}
            </a>{' '}
            to place your order.
          </p>
        )}
      </div>
    </div>
  )
}
