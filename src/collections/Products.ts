import type { CollectionConfig, Where } from 'payload'

import { slugField } from '@/fields/slug'
import { refreshCache } from '@/lib/revalidate'

export const PRODUCTS_TAG = 'products'

/** What visitors may see: active, over-the-counter products only. */
export const publicProductsWhere: Where = {
  and: [{ status: { equals: 'active' } }, { isOTC: { equals: true } }],
}

/**
 * Over-the-counter products sold through the cart. Prescription medicines are never sold here;
 * they go through the prescription request form. The `isOTC` checkbox must be ticked to save.
 */
export const Products: CollectionConfig = {
  slug: 'products',
  labels: { singular: 'Product', plural: 'Products' },
  admin: {
    group: 'Shop',
    useAsTitle: 'name',
    defaultColumns: ['name', 'category', 'price', 'stock', 'status', 'featured'],
    description:
      'Over-the-counter products only. Prescription medicines must never be listed here.',
  },
  defaultSort: 'name',
  access: {
    // Admins see everything; visitors only see active OTC products.
    read: ({ req }) => (req.user ? true : publicProductsWhere),
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  hooks: {
    afterChange: [
      ({ doc }) => {
        refreshCache([PRODUCTS_TAG], ['/', '/shop', `/shop/${doc.slug}`])
        return doc
      },
    ],
    afterDelete: [({ doc }) => refreshCache([PRODUCTS_TAG], ['/', '/shop', `/shop/${doc.slug}`])],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Details',
          fields: [
            { name: 'name', type: 'text', required: true, maxLength: 120 },
            {
              name: 'brand',
              type: 'text',
              maxLength: 60,
              admin: { description: 'Optional, e.g. Tylenol, Nature Made.' },
            },
            {
              name: 'summary',
              type: 'textarea',
              required: true,
              maxLength: 200,
              admin: { description: 'One or two sentences shown on product cards.' },
            },
            {
              name: 'description',
              type: 'richText',
              admin: {
                description:
                  'Full description, directions and warnings as printed on the label. No medical claims beyond the label.',
              },
            },
            {
              name: 'images',
              type: 'upload',
              relationTo: 'media',
              hasMany: true,
              maxRows: 6,
              admin: { description: 'The first image is used on product cards.' },
            },
          ],
        },
        {
          label: 'Price & stock',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'price',
                  label: 'Price (USD)',
                  type: 'number',
                  required: true,
                  min: 0,
                  admin: { step: 0.01 },
                },
                {
                  name: 'stock',
                  label: 'In stock',
                  type: 'number',
                  required: true,
                  min: 0,
                  defaultValue: 0,
                  admin: { step: 1, description: '0 shows "Out of stock".' },
                  validate: (value: number | null | undefined) =>
                    value == null || Number.isInteger(value) || 'Use a whole number.',
                },
                {
                  name: 'sku',
                  label: 'SKU / UPC',
                  type: 'text',
                  maxLength: 40,
                },
              ],
            },
          ],
        },
      ],
    },
    // Sidebar
    slugField('name'),
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: [
        { label: 'Active (shown in shop)', value: 'active' },
        { label: 'Hidden', value: 'hidden' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'isOTC',
      label: 'This is an over-the-counter product (no prescription needed)',
      type: 'checkbox',
      required: true,
      defaultValue: false,
      admin: { position: 'sidebar' },
      validate: (value: boolean | null | undefined) =>
        value === true ||
        'Only over-the-counter products can be sold online. Prescription medicines go through the prescription request form.',
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      admin: { position: 'sidebar' },
    },
    {
      name: 'featured',
      label: 'Feature on the home page',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
  ],
}
