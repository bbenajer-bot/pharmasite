import { useSyncExternalStore } from 'react'

import { toCents } from '@/lib/money'

/**
 * Shopping cart kept in the visitor's browser (localStorage), shared across tabs.
 * Prices here are for display only: checkout recalculates everything from the database.
 */
export type CartItem = {
  id: number
  slug: string
  name: string
  price: number
  image: string | null
  imageAlt: string
  qty: number
  /** Most the visitor may order: the lower of stock and MAX_PER_LINE. */
  maxQty: number
}

const KEY = 'pharmacy-cart-v1'
export const MAX_PER_LINE = 10

const EMPTY: CartItem[] = []
let cache: CartItem[] | null = null
const listeners = new Set<() => void>()

function isItem(v: unknown): v is CartItem {
  const i = v as CartItem
  return (
    !!i &&
    Number.isInteger(i.id) &&
    typeof i.slug === 'string' &&
    typeof i.name === 'string' &&
    typeof i.price === 'number' &&
    Number.isInteger(i.qty) &&
    i.qty > 0
  )
}

function read(): CartItem[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter(isItem) : EMPTY
  } catch {
    return EMPTY
  }
}

function write(items: CartItem[]) {
  cache = items
  try {
    localStorage.setItem(KEY, JSON.stringify(items))
  } catch {}
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = read()
      listener()
    }
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

const getSnapshot = () => (cache ??= read())
const getServerSnapshot = () => EMPTY

const clamp = (qty: number, max: number) => Math.max(1, Math.min(Math.floor(qty), max))

export const cart = {
  snapshot: getSnapshot,
  add(item: Omit<CartItem, 'qty'>, qty: number) {
    const items = getSnapshot()
    const existing = items.find((i) => i.id === item.id)
    write(
      existing
        ? items.map((i) =>
            i.id === item.id ? { ...i, ...item, qty: clamp(i.qty + qty, item.maxQty) } : i,
          )
        : [...items, { ...item, qty: clamp(qty, item.maxQty) }],
    )
  },
  setQty(id: number, qty: number) {
    write(getSnapshot().map((i) => (i.id === id ? { ...i, qty: clamp(qty, i.maxQty) } : i)))
  },
  remove(id: number) {
    write(getSnapshot().filter((i) => i.id !== id))
  },
  replace(items: CartItem[]) {
    write(items)
  },
  clear() {
    write([])
  },
}

export function useCart() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  return {
    items,
    count: items.reduce((n, i) => n + i.qty, 0),
    subtotalCents: items.reduce((sum, i) => sum + toCents(i.price) * i.qty, 0),
  }
}

/** False during server render and hydration, true afterwards. Avoids flashing an empty cart. */
export function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )
}
