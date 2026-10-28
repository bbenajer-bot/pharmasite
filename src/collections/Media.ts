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
  hooks: {
    beforeChange: [
      // Admin uploads go from the browser straight to UploadThing. In Payload 3.90–3.92 the cloud-storage
      // plugin skips its upload step for those files, and that step is the only place the UploadThing
      // adapter saves the file's key, so the image would 404. Save the key here. Remove once fixed upstream.
      ({ data, req }) => {
        const context = (req.file as { clientUploadContext?: unknown } | undefined)
          ?.clientUploadContext
        if (
          context &&
          typeof context === 'object' &&
          'key' in context &&
          typeof context.key === 'string'
        ) {
          data._key = context.key
        }
        return data
      },
    ],
  },
}
