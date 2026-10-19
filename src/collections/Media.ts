import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
    {
      // Where the product CSV import downloaded this image from, so a second import reuses it.
      name: 'sourceUrl',
      type: 'text',
      index: true,
      admin: { readOnly: true, condition: (data) => Boolean(data?.sourceUrl) },
    },
  ],
  upload: true,
}
