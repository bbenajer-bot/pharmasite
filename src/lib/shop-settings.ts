import config from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

import { SHOP_SETTINGS_TAG } from '@/globals/ShopSettings'
import { toCents } from './money'
import { paymentMethods, type FeeSettings, type PaymentMethod } from './shop'

export type ShopSettings = FeeSettings & {
  payment: { value: PaymentMethod; instructions: string }[]
  notifyEmail: string | null
}

/** Server only: includes payment instructions. Pass only what a page needs to client components. */
export const getShopSettings = unstable_cache(
  async (): Promise<ShopSettings> => {
    const payload = await getPayload({ config })
    const g = await payload.findGlobal({ slug: 'shop-settings', depth: 0 })

    const fulfillment: ShopSettings['fulfillment'] = []
    if (g.pickup?.enabled !== false) fulfillment.push({ value: 'pickup', feeCents: 0 })
    if (g.localDelivery?.enabled !== false) {
      fulfillment.push({ value: 'local-delivery', feeCents: toCents(g.localDelivery?.fee ?? 0) })
    }
    if (g.shipping?.enabled !== false) {
      fulfillment.push({ value: 'shipping', feeCents: toCents(g.shipping?.fee ?? 0) })
    }

    const payment = paymentMethods
      .map((m) => ({ value: m.value, setting: g.payment?.[m.value] }))
      .filter((m) => m.setting?.enabled !== false && m.setting?.instructions?.trim())
      .map((m) => ({ value: m.value, instructions: m.setting!.instructions }))

    return {
      fulfillment,
      freeShippingOverCents: g.shipping?.freeOver != null ? toCents(g.shipping.freeOver) : null,
      payment,
      notifyEmail: g.notifyEmail?.trim() || null,
    }
  },
  [SHOP_SETTINGS_TAG],
  { tags: [SHOP_SETTINGS_TAG] },
)
