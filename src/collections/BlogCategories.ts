import type { CollectionConfig } from 'payload'

import { slugField } from '@/fields/slug'
import { refreshCache } from '@/lib/revalidate'
import { POSTS_TAG } from './Posts'

/** Blog topics (e.g. Medication tips, Vaccines, Safety). Used for the blog filter. */
export const BlogCategories: CollectionConfig = {
  slug: 'blog-categories',
  labels: { singular: 'Blog category', plural: 'Blog categories' },
  admin: {
    group: 'Blog',
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
    afterChange: [() => refreshCache([POSTS_TAG], ['/', '/blog'])],
    afterDelete: [() => refreshCache([POSTS_TAG], ['/', '/blog'])],
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
        description: 'Lower numbers appear first in the blog filter.',
      },
    },
  ],
}
