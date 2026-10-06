'use client'

import { useEffect, useState } from 'react'

import { getLiveProducts } from '@/app/(frontend)/cart/actions'
import { formatUSD, toCents } from '@/lib/money'
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
          if (!p) {
            notices.push(`${item.name} is no longer available and was removed from your cart.`)
            continue
          }
          if (p.stock <= 0) {
            notices.push(`${p.name} is out of stock and was removed from your cart.`)
            continue
          }
          const maxQty = Math.min(p.stock, MAX_PER_LINE)
          const qty = Math.min(item.qty, maxQty)
          if (qty < item.qty) notices.push(`Only ${maxQty} of ${p.name} available; quantity updated.`)
          if (toCents(p.price) !== toCents(item.price)) {
            notices.push(`The price of ${p.name} is now ${formatUSD(p.price)}.`)
          }
          next.push({ ...item, slug: p.slug, name: p.name, price: p.price, image: p.image, imageAlt: p.imageAlt, maxQty, qty })
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
