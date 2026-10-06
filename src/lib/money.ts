const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

/** 12.5 → "$12.50" */
export function formatUSD(dollars: number): string {
  return usd.format(dollars)
}

/** Dollars → whole cents. Do order math in cents to avoid floating-point drift. */
export function toCents(dollars: number): number {
  return Math.round(dollars * 100)
}

export function fromCents(cents: number): number {
  return cents / 100
}
