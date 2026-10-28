import { randomBytes } from 'crypto'
import { APIError, type CollectionConfig } from 'payload'

import { fulfillmentOptions, orderStatuses, paymentMethods } from '@/lib/shop'

const isAdmin = ({ req }: { req: { user?: unknown } }) => Boolean(req.user)

const FIRST_ORDER_NUMBER = 1001

/**
 * Online orders (pay-by-email). Created only by the checkout server action, never the public API.
 * Items and totals are a snapshot taken at checkout, so later product edits don't change orders.
 * Stock is reserved when the order is placed and returned if the order is cancelled.
 */
export const Orders: CollectionConfig = {
  slug: 'orders',
  labels: { singular: 'Order', plural: 'Orders' },
  admin: {
    group: 'Shop',
    useAsTitle: 'orderNumber',
    defaultColumns: [
      'orderNumber',
      'customerName',
      'total',
      'paymentMethod',
      'status',
      'createdAt',
    ],
    listSearchableFields: ['orderNumber', 'customerName', 'email'],
    description:
      'Customers pay outside the site. Send payment instructions, then mark the order Paid, then Shipped. The customer is emailed at each step.',
  },
  defaultSort: '-createdAt',
  access: {
    create: isAdmin,
    read: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  hooks: {
    beforeChange: [
      async ({ data, operation, originalDoc, req }) => {
        if (operation === 'create') {
          const last = await req.payload.find({
            collection: 'orders',
            sort: '-orderNumber',
            limit: 1,
            depth: 0,
            select: { orderNumber: true },
            req,
          })
          data.orderNumber = Math.max(FIRST_ORDER_NUMBER, (last.docs[0]?.orderNumber ?? 0) + 1)
          data.accessToken = randomBytes(24).toString('base64url')
          data.status = 'awaiting-payment'
          return data
        }

        // Email timestamps are set only by the server (button endpoint, scheduled job). An admin form
        // opened before the email went out still holds the old value, so ignore what it submits.
        if (!req.context?.setEmailTimestamps) {
          data.paymentInstructionsSentAt = originalDoc?.paymentInstructionsSentAt ?? null
          data.reminderSentAt = originalDoc?.reminderSentAt ?? null
        }

        const from = originalDoc?.status
        const to = data.status
        if (from === 'cancelled' && to && to !== 'cancelled') {
          throw new APIError(
            'A cancelled order can’t be reopened (its stock was already returned). Ask the customer to order again.',
            400,
            undefined,
            true,
          )
        }
        if (to && to !== from) {
          const now = new Date().toISOString()
          if (to === 'paid' && !originalDoc?.paidAt) data.paidAt = now
          if (to === 'shipped' && !originalDoc?.shippedAt) data.shippedAt = now
          if (to === 'cancelled') data.cancelledAt = now
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, operation, req }) => {
        if (operation !== 'create') return doc
        // Lazy import: the email module reads site settings, which import the Payload config.
        const { sendNewOrderToStaff, sendOrderReceived } = await import('@/lib/email/orders')
        await Promise.all([
          sendNewOrderToStaff(req.payload, doc),
          sendOrderReceived(req.payload, doc),
        ])
        return doc
      },
      async ({ doc, previousDoc, operation, req }) => {
        // Return reserved stock when an order is cancelled.
        if (
          operation !== 'update' ||
          doc.status !== 'cancelled' ||
          previousDoc?.status === 'cancelled'
        ) {
          return doc
        }
        for (const item of doc.items ?? []) {
          const productId = typeof item.product === 'object' ? item.product?.id : item.product
          if (!productId) continue
          const product = await req.payload
            .findByID({ collection: 'products', id: productId, depth: 0, req })
            .catch(() => null)
          if (!product) continue
          if (item.optionId) {
            // Back to the option that was ordered; the product total is recalculated by its hook.
            // If that option was deleted since, there's nowhere to return the stock to.
            const options = product.options ?? []
            if (!options.some((o) => o.id === item.optionId)) continue
            await req.payload.update({
              collection: 'products',
              id: productId,
              data: {
                options: options.map((o) =>
                  o.id === item.optionId ? { ...o, stock: o.stock + item.quantity } : o,
                ),
              },
              req,
            })
            continue
          }
          await req.payload.update({
            collection: 'products',
            id: productId,
            data: { stock: product.stock + item.quantity },
            req,
          })
        }
        return doc
      },
      async ({ doc, previousDoc, operation, req }) => {
        // Tell the customer when the order is paid, shipped / ready, or cancelled.
        if (operation !== 'update' || doc.status === previousDoc?.status) return doc
        const { sendStatusUpdate } = await import('@/lib/email/orders')
        await sendStatusUpdate(req.payload, doc)
        return doc
      },
    ],
  },
  endpoints: [
    {
      // Used by the "Send payment instructions" button in the order sidebar.
      path: '/:id/send-payment-instructions',
      method: 'post',
      handler: async (req) => {
        if (!req.user) return Response.json({ error: 'Please log in.' }, { status: 401 })
        const id = Number(req.routeParams?.id)
        const order = await req.payload
          .findByID({ collection: 'orders', id, depth: 0, req, overrideAccess: false })
          .catch(() => null)
        if (!order) return Response.json({ error: 'Order not found.' }, { status: 404 })
        if (order.status !== 'awaiting-payment') {
          return Response.json({ error: 'This order is not awaiting payment.' }, { status: 400 })
        }
        const shop = await req.payload.findGlobal({ slug: 'shop-settings', depth: 0, req })
        const instructions = shop.payment?.[order.paymentMethod]?.instructions?.trim()
        if (!instructions) {
          return Response.json(
            {
              error:
                'No instructions saved for this payment method. Add them in Settings → Shop Settings.',
            },
            { status: 400 },
          )
        }
        const { sendPaymentInstructions } = await import('@/lib/email/orders')
        const ok = await sendPaymentInstructions(req.payload, order, instructions)
        if (!ok)
          return Response.json(
            { error: 'The email could not be sent. Try again later.' },
            { status: 502 },
          )
        const sentAt = new Date().toISOString()
        await req.payload.update({
          collection: 'orders',
          id,
          data: { paymentInstructionsSentAt: sentAt },
          req,
          overrideAccess: false,
          context: { setEmailTimestamps: true },
        })
        return Response.json({ sentAt })
      },
    },
  ],
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Order',
          fields: [
            {
              name: 'items',
              type: 'array',
              required: true,
              minRows: 1,
              admin: { readOnly: true, initCollapsed: false },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'name', type: 'text', required: true, admin: { width: '40%' } },
                    { name: 'unitPrice', label: 'Unit price', type: 'number', required: true },
                    { name: 'quantity', type: 'number', required: true, min: 1 },
                    { name: 'lineTotal', label: 'Line total', type: 'number', required: true },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    { name: 'product', type: 'relationship', relationTo: 'products' },
                    { name: 'option', type: 'text' },
                    { name: 'sku', label: 'SKU', type: 'text' },
                    // Which product option was ordered, so cancelling returns stock to it.
                    { name: 'optionId', type: 'text', admin: { hidden: true } },
                  ],
                },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'subtotal', type: 'number', required: true, admin: { readOnly: true } },
                {
                  name: 'fulfillmentFee',
                  label: 'Delivery / shipping fee',
                  type: 'number',
                  required: true,
                  defaultValue: 0,
                  admin: { readOnly: true },
                },
                {
                  name: 'total',
                  type: 'number',
                  required: true,
                  admin: {
                    readOnly: true,
                    description: 'Before any sales tax added on the invoice.',
                  },
                },
              ],
            },
            {
              name: 'customerNote',
              label: 'Note from customer',
              type: 'textarea',
              admin: { readOnly: true },
            },
          ],
        },
        {
          label: 'Customer & delivery',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'customerName', label: 'Name', type: 'text', required: true },
                { name: 'email', type: 'email', required: true },
                { name: 'phone', type: 'text', required: true },
              ],
            },
            {
              name: 'fulfillment',
              type: 'select',
              required: true,
              options: fulfillmentOptions.map((o) => ({ ...o })),
            },
            {
              name: 'address',
              type: 'group',
              admin: {
                condition: (data) =>
                  data?.fulfillment === 'local-delivery' || data?.fulfillment === 'shipping',
              },
              fields: [
                { name: 'line1', label: 'Street address', type: 'text' },
                { name: 'line2', label: 'Apt, suite, etc.', type: 'text' },
                {
                  type: 'row',
                  fields: [
                    { name: 'city', type: 'text' },
                    { name: 'state', type: 'text' },
                    { name: 'zip', label: 'ZIP', type: 'text' },
                  ],
                },
              ],
            },
            { name: 'trackingInfo', label: 'Tracking number / delivery note', type: 'text' },
          ],
        },
        {
          label: 'History',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'paymentInstructionsSentAt',
                  label: 'Payment instructions sent',
                  type: 'date',
                  admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } },
                },
                {
                  name: 'reminderSentAt',
                  label: 'Payment reminder sent',
                  type: 'date',
                  admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'paidAt',
                  label: 'Paid',
                  type: 'date',
                  admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } },
                },
                {
                  name: 'shippedAt',
                  label: 'Shipped / ready',
                  type: 'date',
                  admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } },
                },
                {
                  name: 'cancelledAt',
                  label: 'Cancelled',
                  type: 'date',
                  admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } },
                },
              ],
            },
            { name: 'cancelReason', label: 'Cancellation reason', type: 'text' },
          ],
        },
      ],
    },
    // Sidebar
    {
      name: 'sendPaymentInstructions',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: { Field: '/components/admin/SendPaymentInstructions#SendPaymentInstructions' },
      },
    },
    {
      name: 'orderNumber',
      label: 'Order #',
      type: 'number',
      unique: true,
      index: true,
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'awaiting-payment',
      index: true,
      options: orderStatuses.map((o) => ({ ...o })),
      admin: { position: 'sidebar' },
    },
    {
      name: 'paymentMethod',
      label: 'Preferred payment method',
      type: 'select',
      required: true,
      options: paymentMethods.map(({ value, label }) => ({ value, label })),
      admin: { position: 'sidebar' },
    },
    {
      name: 'adminNotes',
      label: 'Internal notes',
      type: 'textarea',
      admin: { position: 'sidebar', description: 'Only visible to staff.' },
    },
    {
      // Secret for the customer's "view your order" link. Never shown in the admin.
      name: 'accessToken',
      type: 'text',
      index: true,
      admin: { hidden: true },
    },
  ],
}
