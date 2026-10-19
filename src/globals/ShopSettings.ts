import type { Field, GlobalConfig } from 'payload'

import { refreshCache } from '@/lib/revalidate'
import { paymentMethods } from '@/lib/shop'

export const SHOP_SETTINGS_TAG = 'shop-settings'

/** Placeholder instructions; the client replaces the TODO handles before launch. */
const defaultInstructions: Record<string, string> = {
  paypal:
    'Please send {total} with PayPal to TODO@example.com and put "Order #{orderNumber}" in the note.',
  venmo:
    'Please send {total} on Venmo to @TODO-pharmacy and put "Order #{orderNumber}" in the note.',
  cashapp:
    'Please send {total} on Cash App to $TODOpharmacy and put "Order #{orderNumber}" in the note.',
  zelle:
    'Please send {total} with Zelle to TODO@example.com (Meridian Pharmacy) and put "Order #{orderNumber}" in the memo.',
  applepay:
    'Please send {total} with Apple Cash to (312) 555-0142 and put "Order #{orderNumber}" in the message.',
  invoice:
    'We will send you a secure invoice for {total} by email shortly. Pay it by credit or debit card using the link in that email.',
}

const methodFields: Field[] = paymentMethods.map((m) => ({
  name: m.value,
  label: m.label,
  type: 'group',
  fields: [
    { name: 'enabled', label: 'Offer at checkout', type: 'checkbox', defaultValue: true },
    {
      name: 'instructions',
      type: 'textarea',
      required: true,
      defaultValue: defaultInstructions[m.value],
      admin: { rows: 3 },
    },
  ],
}))

/**
 * Checkout options the client edits: delivery methods and fees, payment methods and the
 * payment instructions emailed to customers, and where new-order notifications go.
 * Read on the server only (instructions are not public). See getShopSettings().
 */
export const ShopSettings: GlobalConfig = {
  slug: 'shop-settings',
  label: 'Shop Settings',
  admin: {
    group: 'Settings',
    description:
      'Delivery options, fees and payment instructions for online orders, and where notification emails go.',
  },
  access: {
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
  },
  hooks: {
    afterChange: [
      ({ doc }) => {
        refreshCache([SHOP_SETTINGS_TAG], ['/checkout'])
        return doc
      },
    ],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Delivery & fees',
          description:
            'Prices in US dollars. Sales tax is not added on the site; add it to the invoice.',
          fields: [
            {
              name: 'pickup',
              type: 'group',
              label: 'Pick up at the pharmacy',
              fields: [
                {
                  name: 'enabled',
                  label: 'Offer pickup (free)',
                  type: 'checkbox',
                  defaultValue: true,
                },
              ],
            },
            {
              name: 'localDelivery',
              type: 'group',
              label: 'Local delivery',
              admin: { description: 'The delivery area is set in Site Settings.' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'enabled',
                      label: 'Offer local delivery',
                      type: 'checkbox',
                      defaultValue: true,
                    },
                    {
                      name: 'fee',
                      label: 'Fee',
                      type: 'number',
                      min: 0,
                      required: true,
                      defaultValue: 5,
                      admin: { step: 0.01 },
                    },
                  ],
                },
              ],
            },
            {
              name: 'shipping',
              type: 'group',
              label: 'Ship by mail',
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'enabled',
                      label: 'Offer shipping',
                      type: 'checkbox',
                      defaultValue: true,
                    },
                    {
                      name: 'fee',
                      label: 'Fee',
                      type: 'number',
                      min: 0,
                      required: true,
                      defaultValue: 8.95,
                      admin: { step: 0.01 },
                    },
                    {
                      name: 'freeOver',
                      label: 'Free shipping on orders over',
                      type: 'number',
                      min: 0,
                      defaultValue: 50,
                      admin: { step: 0.01, description: 'Leave empty for no free shipping.' },
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Payment methods',
          description:
            'Instructions are emailed when you click "Send payment instructions" on an order. Use {orderNumber}, {total} and {name} as placeholders.',
          fields: [{ name: 'payment', type: 'group', label: false, fields: methodFields }],
        },
        {
          label: 'Notifications',
          fields: [
            {
              name: 'notifyEmail',
              label: 'Send new-order emails to',
              type: 'email',
              admin: { description: 'Leave empty to use the pharmacy email from Site Settings.' },
            },
            {
              name: 'prescriptionNotifyEmail',
              label: 'Send prescription and refill request emails to',
              type: 'email',
              admin: {
                description:
                  'Usually the doctor. The email only says a request arrived, with a link to it; no health details. Leave empty to use the address above.',
              },
            },
          ],
        },
      ],
    },
  ],
}
