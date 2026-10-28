/**
 * Product options (sizes, counts, flavors). A product either has one price and stock, or a list of
 * options, each with its own price, stock and SKU; the customer must pick one. Shared by the server
 * and the browser, so no database or React imports here.
 */

export type ProductOption = {
  /** Payload array-row id: stable while the option exists, used to match cart lines and orders. */
  id: string
  label: string
  price: number
  stock: number
  sku: string | null
}

/** Most options one product can have. */
export const MAX_OPTIONS = 30

/** For products with options: the lowest option price and the total stock, shown on cards and in lists. */
export function optionTotals(options: { price: number; stock: number }[]): {
  price: number
  stock: number
} {
  return {
    price: Math.min(...options.map((o) => o.price)),
    stock: options.reduce((sum, o) => sum + Math.max(0, o.stock), 0),
  }
}

/** "Vitamin D3" + "60 capsules" → "Vitamin D3 – 60 capsules" (cart lines, orders, emails). */
export function nameWithOption(name: string, option: string | null | undefined): string {
  return option ? `${name} – ${option}` : name
}

/** Identifies one cart line: the same product in two sizes is two lines. */
export function lineKey(line: { id: number; optionId?: string | null }): string {
  return `${line.id}:${line.optionId ?? ''}`
}
