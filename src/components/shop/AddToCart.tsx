'use client'

import Link from 'next/link'
import { useId, useState } from 'react'
import { CheckCircle2, ShoppingBag } from 'lucide-react'

import { cart, MAX_PER_LINE, useCart, useHydrated, type CartItem } from './cart-store'

type Props = { product: Omit<CartItem, 'qty' | 'maxQty'>; stock: number }

export function AddToCart({ product, stock }: Props) {
  const id = useId()
  const hydrated = useHydrated()
  const { items } = useCart()
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  const maxQty = Math.min(stock, MAX_PER_LINE)
  const inCart = items.find((i) => i.id === product.id)?.qty ?? 0
  const canAdd = Math.max(0, maxQty - inCart)

  if (stock <= 0) return null

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor={`${id}-qty`} className="block text-sm font-medium text-ink">
            Quantity
          </label>
          <select
            id={`${id}-qty`}
            value={Math.min(qty, Math.max(canAdd, 1))}
            onChange={(e) => {
              setQty(Number(e.target.value))
              setAdded(false)
            }}
            disabled={!hydrated || canAdd === 0}
            className="input mt-2 w-24 py-2.5"
          >
            {Array.from({ length: Math.max(canAdd, 1) }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className="btn btn-primary text-base disabled:opacity-60"
          disabled={!hydrated || canAdd === 0}
          onClick={() => {
            cart.add({ ...product, maxQty }, Math.min(qty, canAdd))
            setQty(1)
            setAdded(true)
          }}
        >
          <ShoppingBag className="size-4" aria-hidden /> Add to cart
        </button>
      </div>

      <div role="status" className="mt-3 min-h-6 text-sm">
        {added ? (
          <p className="flex items-center gap-2 font-medium text-mint-700">
            <CheckCircle2 className="size-4" aria-hidden /> Added to your cart.{' '}
            <Link href="/cart" className="font-semibold text-brand-600 underline hover:text-brand-700">
              View cart
            </Link>
          </p>
        ) : (
          hydrated &&
          canAdd === 0 && (
            <p className="text-muted">
              You have the most we can sell online ({maxQty}) in your cart. Call us for larger
              quantities.
            </p>
          )
        )}
      </div>
    </div>
  )
}
