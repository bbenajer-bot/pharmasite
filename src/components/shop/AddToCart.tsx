'use client'

import Link from 'next/link'
import { useId, useState } from 'react'
import { CheckCircle2, ShoppingBag } from 'lucide-react'

import { formatUSD } from '@/lib/money'
import type { ProductOption } from '@/lib/product-options'
import { cart, lineKey, MAX_PER_LINE, useCart, useHydrated, type CartItem } from './cart-store'

type Props = {
  product: Omit<CartItem, 'qty' | 'maxQty' | 'optionId' | 'option'>
  stock: number
  /** Empty for a product with one price; otherwise the customer must pick one. */
  options: ProductOption[]
  optionName: string | null
}

export function AddToCart({ product, stock, options, optionName }: Props) {
  const id = useId()
  const hydrated = useHydrated()
  const { items } = useCart()
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  // Start on the first option that's in stock.
  const [optionId, setOptionId] = useState(() => options.find((o) => o.stock > 0)?.id ?? null)

  const option = options.find((o) => o.id === optionId) ?? null
  const price = option?.price ?? product.price
  const available = options.length > 0 ? (option?.stock ?? 0) : stock
  const maxQty = Math.min(available, MAX_PER_LINE)
  const inCart = items.find((i) => lineKey(i) === lineKey({ id: product.id, optionId }))?.qty ?? 0
  const canAdd = Math.max(0, maxQty - inCart)

  // Out of stock (every option, for products with options): the page says so; nothing to add.
  if (options.length > 0 ? !options.some((o) => o.stock > 0) : stock <= 0) return null

  return (
    <div className="mt-8">
      {options.length > 0 && (
        <fieldset>
          <legend className="text-sm font-medium text-ink">{optionName ?? 'Option'}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {options.map((o) => {
              const soldOut = o.stock <= 0
              return (
                <label
                  key={o.id}
                  className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-4 py-2 text-sm has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-600 has-[:focus-visible]:ring-offset-2 ${
                    soldOut
                      ? 'cursor-not-allowed border-line text-muted line-through'
                      : 'border-line'
                  }`}
                >
                  <input
                    type="radio"
                    name={`${id}-option`}
                    value={o.id}
                    checked={optionId === o.id}
                    disabled={soldOut}
                    onChange={() => {
                      setOptionId(o.id)
                      setQty(1)
                      setAdded(false)
                    }}
                    className="sr-only"
                  />
                  <span className="font-semibold">{o.label}</span>
                  <span className="text-ink-soft">{formatUSD(o.price)}</span>
                  {soldOut && <span className="sr-only">(out of stock)</span>}
                </label>
              )
            })}
          </div>
        </fieldset>
      )}

      {option && (
        <p className="mt-4 text-sm text-ink-soft">
          <span className="text-2xl font-bold text-ink">{formatUSD(price)}</span>
          <span className="ml-3 font-semibold text-mint-700">In stock</span>
          {option.sku && <span className="ml-3 text-xs text-muted">SKU: {option.sku}</span>}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-end gap-3">
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
            cart.add(
              {
                ...product,
                price,
                optionId: option?.id ?? null,
                option: option?.label ?? null,
                maxQty,
              },
              Math.min(qty, canAdd),
            )
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
            <Link
              href="/cart"
              className="font-semibold text-brand-600 underline hover:text-brand-700"
            >
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
