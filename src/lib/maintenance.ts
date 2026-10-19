import type { Payload } from 'payload'

import { PAYMENT_CANCEL_DAYS, PAYMENT_REMINDER_HOURS } from '@/lib/shop'

const HOUR = 60 * 60 * 1000

export type MaintenanceResult = { remindersSent: number; ordersCancelled: number; failures: number }

/**
 * Housekeeping run by the Netlify scheduled function (see netlify/functions/maintenance.ts).
 * Safe to run any number of times: each order gets at most one reminder and one cancellation.
 *
 * Orders whose payment instructions were never sent are left alone: the customer couldn't pay yet,
 * so staff decide what to do with them.
 */
export async function runMaintenance(
  payload: Payload,
  now = new Date(),
): Promise<MaintenanceResult> {
  const result: MaintenanceResult = { remindersSent: 0, ordersCancelled: 0, failures: 0 }

  // 1. Cancel unpaid orders placed more than PAYMENT_CANCEL_DAYS ago (returns stock, emails the customer).
  const cancelBefore = new Date(now.getTime() - PAYMENT_CANCEL_DAYS * 24 * HOUR).toISOString()
  const stale = await payload.find({
    collection: 'orders',
    where: {
      status: { equals: 'awaiting-payment' },
      paymentInstructionsSentAt: { exists: true },
      createdAt: { less_than: cancelBefore },
    },
    depth: 0,
    pagination: false,
  })
  for (const order of stale.docs) {
    try {
      await payload.update({
        collection: 'orders',
        id: order.id,
        data: {
          status: 'cancelled',
          cancelReason: `Not paid within ${PAYMENT_CANCEL_DAYS} days.`,
        },
      })
      result.ordersCancelled++
    } catch (err) {
      result.failures++
      payload.logger.error({ err, orderId: order.id }, 'Maintenance: could not cancel unpaid order')
    }
  }

  // 2. Remind customers PAYMENT_REMINDER_HOURS after their payment instructions were sent.
  const remindBefore = new Date(now.getTime() - PAYMENT_REMINDER_HOURS * HOUR).toISOString()
  const due = await payload.find({
    collection: 'orders',
    where: {
      status: { equals: 'awaiting-payment' },
      reminderSentAt: { exists: false },
      paymentInstructionsSentAt: { less_than: remindBefore },
    },
    depth: 0,
    pagination: false,
  })
  if (due.docs.length) {
    const { sendPaymentReminder } = await import('@/lib/email/orders')
    for (const order of due.docs) {
      const sent = await sendPaymentReminder(payload, order)
      if (!sent) {
        result.failures++
        continue // try again on the next run
      }
      await payload.update({
        collection: 'orders',
        id: order.id,
        data: { reminderSentAt: now.toISOString() },
        context: { setEmailTimestamps: true },
      })
      result.remindersSent++
    }
  }

  return result
}
