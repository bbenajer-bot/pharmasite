'use client'

import { useEffect, useState } from 'react'

import { getLiveProducts } from '@/app/(frontend)/cart/actions'
import { formatUSD, toCents } from '@/lib/money'
import { nameWithOption } from '@/lib/product-options'
import { cart, MAX_PER_LINE, type CartItem } from './cart-store'

/**
 * Once per page load, refresh the cart against the database: drop products that are gone or out of
 * stock, update names/prices, and cap quantities at current stock. Returns notices for the visitor.
 */
export function useCartSync() {
  const [state, setState] = useState({ checking: true, notices: [] as string[] })

  useEffect(() => {
    let cancelled = false
    const items = cart.snapshot()
    if (items.length === 0) {
      setState({ checking: false, notices: [] })
      return
    }
    getLiveProducts(items.map((i) => i.id))
      .then((live) => {
        if (cancelled) return
        const notices: string[] = []
        const next: CartItem[] = []
        for (const item of cart.snapshot()) {
          const p = live.find((l) => l.id === item.id)
          const itemName = nameWithOption(item.name, item.option)
          if (!p) {
            notices.push(`${itemName} is no longer available and was removed from your cart.`)
            continue
          }
          // A line's option must still exist; a product that now has options needs one chosen.
          const option = item.optionId ? p.options.find((o) => o.id === item.optionId) : null
          if (item.optionId ? !option : p.options.length > 0) {
            notices.push(
              item.optionId
                ? `${itemName} is no longer available and was removed from your cart. Please choose another option.`
                : `${p.name} now comes in several options and was removed from your cart. Please choose one on its page.`,
            )
            continue
          }
          const name = nameWithOption(p.name, option?.label)
          const price = option?.price ?? p.price
          const stock = option?.stock ?? p.stock
          if (stock <= 0) {
            notices.push(`${name} is out of stock and was removed from your cart.`)
            continue
          }
          const maxQty = Math.min(stock, MAX_PER_LINE)
          const qty = Math.min(item.qty, maxQty)
          if (qty < item.qty) notices.push(`Only ${maxQty} of ${name} available; quantity updated.`)
          if (toCents(price) !== toCents(item.price)) {
            notices.push(`The price of ${name} is now ${formatUSD(price)}.`)
          }
          next.push({
            ...item,
            slug: p.slug,
            name: p.name,
            option: option?.label ?? null,
            price,
            image: p.image,
            imageAlt: p.imageAlt,
            maxQty,
            qty,
          })
        }
        cart.replace(next)
        setState({ checking: false, notices })
      })
      .catch(() => {
        // Offline or server error: keep the cart as is; checkout re-validates on the server anyway.
        if (!cancelled) setState({ checking: false, notices: [] })
      })
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
