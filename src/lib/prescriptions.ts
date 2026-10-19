/** Shared constants for prescription and refill requests (collection, forms, scheduled cleanup). */

/** Requests are deleted automatically this many days after they arrive (see src/lib/maintenance.ts). */
export const REQUEST_RETENTION_DAYS = 90

/** Request numbers start here so they don't look like a brand-new pharmacy's first request. */
export const FIRST_REQUEST_NUMBER = 1001

export const requestKinds = [
  { label: 'New prescription', value: 'new' },
  { label: 'Refill', value: 'refill' },
] as const
export type RequestKind = (typeof requestKinds)[number]['value']

export const requestStatuses = [
  { label: 'New', value: 'new' },
  { label: 'Reviewed', value: 'reviewed' },
  { label: 'Approved', value: 'approved' },
  { label: 'Declined', value: 'declined' },
] as const

export const requestFulfillment = [
  { label: 'Pick up at the pharmacy', value: 'pickup' },
  { label: 'Local delivery', value: 'delivery' },
] as const
export type RequestFulfillment = (typeof requestFulfillment)[number]['value']
