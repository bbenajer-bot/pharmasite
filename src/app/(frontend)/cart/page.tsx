import type { Metadata } from 'next'

import { CartView } from './CartView'

export const metadata: Metadata = {
  title: 'Your cart',
  description: 'Review the products in your cart before placing your order.',
  robots: { index: false },
}

export default function CartPage() {
  return (
    <div className="container-page py-12 md:py-16">
      <h1 className="text-3xl font-bold sm:text-4xl">Your cart</h1>
      <div className="mt-8">
        <CartView />
      </div>
    </div>
  )
}
