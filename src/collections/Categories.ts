import type { CollectionConfig } from 'payload'

import { slugField } from '@/fields/slug'
import { refreshCache } from '@/lib/revalidate'
import { PRODUCTS_TAG } from './Products'

/** Shop categories (e.g. Pain relief, Vitamins, First aid). Used for the shop filter. */
export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: { singular: 'Category', plural: 'Categories' },
  admin: {
    group: 'Shop',
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'order'],
  },
  defaultSort: 'order',
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  hooks: {
    afterChange: [() => refreshCache([PRODUCTS_TAG], ['/shop'])],
    afterDelete: [() => refreshCache([PRODUCTS_TAG], ['/shop'])],
  },
  fields: [
    { name: 'name', type: 'text', required: true, maxLength: 60 },
    slugField('name'),
    {
      name: 'order',
      label: 'Sort order',
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        description: 'Lower numbers appear first in the shop filter.',
      },
    },
  ],
}
