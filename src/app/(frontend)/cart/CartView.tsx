'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRef, useState } from 'react'
import { ArrowRight, Info, Minus, Package, Plus, ShoppingBag, Trash2 } from 'lucide-react'

import { cart, lineKey, useCart, useHydrated } from '@/components/shop/cart-store'
import { useCartSync } from '@/components/shop/useCartSync'
import { formatUSD, fromCents, toCents } from '@/lib/money'
import { nameWithOption } from '@/lib/product-options'

export function CartView() {
  const hydrated = useHydrated()
  const { items, count, subtotalCents } = useCart()
  const { checking, notices } = useCartSync()
  const [removed, setRemoved] = useState('')
  const cartRegion = useRef<HTMLDivElement>(null)

  if (!hydrated) {
    // Same height as the empty-cart box, so the footer doesn't jump once the cart loads.
    return (
      <p className="flex min-h-60 items-center justify-center text-ink-soft">Loading your cart…</p>
    )
  }

  return (
    <div ref={cartRegion} tabIndex={-1} className="focus:outline-none">
      <div role="status" aria-live="polite">
        {removed && <p className="sr-only">{removed}</p>}
        {notices.length > 0 && (
          <ul className="mb-8 space-y-1 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            {notices.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        )}
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-line p-10 text-center">
          <ShoppingBag className="mx-auto size-10 text-brand-600" aria-hidden />
          <p className="mt-4 text-lg font-semibold">Your cart is empty.</p>
          <Link href="/shop" className="btn btn-primary mt-6">
            Browse the shop <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      ) : (
        <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
          <ul className="divide-y divide-line border-y border-line" aria-label="Items in your cart">
            {items.map((item) => {
              const key = lineKey(item)
              const label = nameWithOption(item.name, item.option)
              return (
                <li key={key} className="flex gap-4 py-6">
                  <div className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-brand-50 to-surface sm:size-24">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.imageAlt}
                        fill
                        sizes="96px"
                        className="object-contain p-2"
                      />
                    ) : (
                      <Package className="size-8 text-ink/20" aria-hidden />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:justify-between">
                    <div className="min-w-0">
                      <Link
                        href={`/shop/${item.slug}`}
                        className="font-semibold hover:text-brand-600"
                      >
                        {item.name}
                      </Link>
                      {item.option && <p className="mt-1 text-sm text-ink-soft">{item.option}</p>}
                      <p className="mt-1 text-sm text-ink-soft">{formatUSD(item.price)} each</p>
                    </div>
                    <div className="flex items-center gap-4 sm:flex-col sm:items-end">
                      <div
                        className="flex items-center rounded-full border border-line"
                        role="group"
                        aria-label={`Quantity of ${label}`}
                      >
                        {/* aria-disabled, not disabled: a disabled button would drop keyboard focus.
                          setQty clamps, so clicking at the limit does nothing. */}
                        <button
                          type="button"
                          className="rounded-full p-2 text-ink-soft hover:bg-brand-50 aria-disabled:opacity-40"
                          onClick={() => cart.setQty(key, item.qty - 1)}
                          aria-disabled={item.qty <= 1}
                          aria-label={`Decrease quantity of ${label}`}
                        >
                          <Minus className="size-4" aria-hidden />
                        </button>
                        <span className="w-8 text-center font-semibold" aria-live="polite">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          className="rounded-full p-2 text-ink-soft hover:bg-brand-50 aria-disabled:opacity-40"
                          onClick={() => cart.setQty(key, item.qty + 1)}
                          aria-disabled={item.qty >= item.maxQty}
                          aria-label={`Increase quantity of ${label}`}
                        >
                          <Plus className="size-4" aria-hidden />
                        </button>
                      </div>
                      <p className="font-semibold">
                        {formatUSD(fromCents(toCents(item.price) * item.qty))}
                      </p>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-red-700"
                        onClick={() => {
                          cart.remove(key)
                          // The button disappears; tell screen readers and keep focus in the cart.
                          setRemoved(`Removed ${label} from your cart.`)
                          cartRegion.current?.focus()
                        }}
                      >
                        <Trash2 className="size-4" aria-hidden /> Remove
                        <span className="sr-only"> {label}</span>
                      </button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>

          <aside
            aria-labelledby="summary-heading"
            className="h-fit rounded-2xl border border-line bg-surface p-6"
          >
            <h2 id="summary-heading" className="text-xl font-bold">
              Order summary
            </h2>
            <dl className="mt-4 flex justify-between text-lg">
              <dt>
                Subtotal ({count} {count === 1 ? 'item' : 'items'})
              </dt>
              <dd className="font-bold">{formatUSD(fromCents(subtotalCents))}</dd>
            </dl>
            <p className="mt-4 flex gap-2 text-sm text-ink-soft">
              <Info className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden />
              Choose pickup, local delivery or shipping at checkout. Any sales tax is added to your
              invoice. Nothing is charged on this site.
            </p>
            <Link
              href="/checkout"
              aria-disabled={checking}
              className={`btn btn-primary mt-6 w-full text-base ${checking ? 'pointer-events-none opacity-60' : ''}`}
            >
              Continue to checkout <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              href="/shop"
              className="mt-4 block text-center text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              Keep shopping
            </Link>
          </aside>
        </div>
      )}
    </div>
  )
}
