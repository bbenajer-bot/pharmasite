import type { CollectionConfig, Where } from 'payload'

import { slugField } from '@/fields/slug'
import { refreshCache } from '@/lib/revalidate'

export const POSTS_TAG = 'posts'

/** What visitors may see: published posts only. Drafts stay in the admin. */
export const publicPostsWhere: Where = { status: { equals: 'published' } }

/** Health articles for the blog. General information only, never personal medical advice. */
export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: { singular: 'Blog post', plural: 'Blog posts' },
  admin: {
    group: 'Blog',
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'status', 'publishedAt'],
    description:
      'General health information only, no personal medical advice. Have the doctor check medical content before publishing.',
  },
  defaultSort: '-publishedAt',
  access: {
    // Admins see drafts too; visitors only see published posts.
    read: ({ req }) => (req.user ? true : publicPostsWhere),
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  hooks: {
    beforeChange: [
      ({ data }) => {
        // First publish without a date: use now, so the post sorts to the top.
        if (data.status === 'published' && !data.publishedAt) {
          data.publishedAt = new Date().toISOString()
        }
        return data
      },
    ],
    afterChange: [
      ({ doc, previousDoc }) => {
        const paths = ['/', '/blog', `/blog/${doc.slug}`]
        if (previousDoc?.slug && previousDoc.slug !== doc.slug)
          paths.push(`/blog/${previousDoc.slug}`)
        refreshCache([POSTS_TAG], paths)
        return doc
      },
    ],
    afterDelete: [({ doc }) => refreshCache([POSTS_TAG], ['/', '/blog', `/blog/${doc.slug}`])],
  },
  fields: [
    { name: 'title', type: 'text', required: true, maxLength: 120 },
    {
      name: 'excerpt',
      type: 'textarea',
      required: true,
      maxLength: 220,
      admin: {
        description: 'One or two sentences shown on blog cards and in Google search results.',
      },
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Optional. Wide images (about 1600 × 900) look best.' },
    },
    { name: 'content', type: 'richText', required: true },
    // Sidebar
    slugField('title'),
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft (not on the website)', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'publishedAt',
      label: 'Publish date',
      type: 'date',
      index: true,
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayOnly', displayFormat: 'MMM d, yyyy' },
        description: 'Shown on the post. Filled in automatically when you first publish.',
      },
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'blog-categories',
      admin: { position: 'sidebar' },
    },
    {
      name: 'author',
      type: 'text',
      required: true,
      maxLength: 80,
      admin: {
        position: 'sidebar',
        description: 'Name shown on the post, e.g. "Dr. Alex Morgan" or "Our pharmacy team".',
      },
    },
  ],
}
