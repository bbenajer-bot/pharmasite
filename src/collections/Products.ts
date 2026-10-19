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
    components: {
      beforeListTable: ['/components/admin/ProductImport#ProductImport'],
    },
  },
  defaultSort: 'name',
  endpoints: [
    {
      // Product CSV import, step 1: read the file and show what would happen. Changes nothing.
      path: '/import/preview',
      method: 'post',
      handler: async (req) => {
        if (!req.user) return Response.json({ error: 'Please log in.' }, { status: 401 })
        const body = (await req.json?.().catch(() => null)) as { csv?: unknown } | null
        if (typeof body?.csv !== 'string' || !body.csv.trim()) {
          return Response.json({ error: 'The file is empty.' }, { status: 400 })
        }
        const { parseProductCsv } = await import('@/lib/product-import/parse')
        const { slugify } = await import('@/fields/slug')
        const { rows, fileError } = parseProductCsv(body.csv)
        if (fileError) return Response.json({ error: fileError }, { status: 400 })

        const current = await req.payload.find({
          collection: 'products',
          pagination: false,
          depth: 0,
          select: { sku: true, slug: true },
          req,
        })
        const skus = new Set(current.docs.map((d) => d.sku).filter(Boolean))
        const slugs = new Set(current.docs.map((d) => d.slug))
        return Response.json({
          rows: rows.map((r) => ({
            ...r,
            exists: r.product
              ? r.product.sku
                ? skus.has(r.product.sku)
                : slugs.has(slugify(r.product.name))
              : false,
          })),
        })
      },
    },
    {
      // Product CSV import, step 2: create or update one product (the admin screen sends them one by one).
      path: '/import/commit',
      method: 'post',
      handler: async (req) => {
        if (!req.user) return Response.json({ error: 'Please log in.' }, { status: 401 })
        const body = (await req.json?.().catch(() => null)) as {
          product?: Record<string, unknown>
          existing?: unknown
          defaultStock?: unknown
          confirmOTC?: unknown
        } | null
        if (body?.confirmOTC !== true) {
          return Response.json(
            { error: 'Confirm that every product is over-the-counter.' },
            { status: 400 },
          )
        }
        const p = body.product
        const valid =
          p &&
          typeof p.name === 'string' &&
          typeof p.summary === 'string' &&
          typeof p.price === 'number' &&
          typeof p.descriptionHtml === 'string' &&
          Array.isArray(p.imageUrls) &&
          p.imageUrls.length <= 6 &&
          p.imageUrls.every((u) => typeof u === 'string') &&
          (p.status === 'active' || p.status === 'hidden')
        if (!valid) return Response.json({ error: 'Invalid product data.' }, { status: 400 })

        const { importProduct } = await import('@/lib/product-import/commit')
        try {
          const outcome = await importProduct(req, p as unknown as Parameters<typeof importProduct>[1], {
            existing: body.existing === 'update' ? 'update' : 'skip',
            defaultStock: Math.max(0, Math.floor(Number(body.defaultStock) || 0)),
          })
          return Response.json(outcome)
        } catch (err) {
          req.payload.logger.error({ err, name: p.name }, 'Product import failed')
          const message = err instanceof Error ? err.message : 'Could not save this product.'
          return Response.json({ error: message }, { status: 400 })
        }
      },
    },
  ],
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
