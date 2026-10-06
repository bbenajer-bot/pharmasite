import type { GlobalConfig } from 'payload'
import { revalidatePath, revalidateTag } from 'next/cache'

import { siteDefaults as d } from '@/lib/site'

export const SITE_SETTINGS_TAG = 'site-settings'

/**
 * Business details the client can edit (name, phone, address, hours, license, doctor).
 * Pages read them with getSiteSettings() in src/lib/settings.ts. Defaults come from src/lib/site.ts.
 */
export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site Settings',
  admin: {
    group: 'Settings',
    description:
      'Business details shown across the website. Changes appear on the site within a few seconds of saving.',
  },
  access: {
    read: () => true,
    update: ({ req }) => Boolean(req.user),
  },
  hooks: {
    afterChange: [
      ({ doc }) => {
        // Refresh every page that shows these details. Throws outside a Next.js request
        // (e.g. CLI scripts), where there is nothing to refresh, so ignore that case.
        try {
          revalidateTag(SITE_SETTINGS_TAG, { expire: 0 })
          revalidatePath('/', 'layout')
        } catch {}
        return doc
      },
    ],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Business',
          fields: [
            {
              name: 'name',
              label: 'Pharmacy name',
              type: 'text',
              required: true,
              defaultValue: d.name,
            },
            {
              name: 'description',
              type: 'textarea',
              required: true,
              defaultValue: d.description,
              admin: {
                description: 'One or two sentences. Used in the footer and search results.',
              },
            },
            {
              name: 'deliveryArea',
              label: 'Delivery area',
              type: 'text',
              required: true,
              defaultValue: d.deliveryArea,
              admin: {
                description:
                  'Completes the sentence "We deliver …", e.g. "within 5 miles of the pharmacy".',
              },
            },
          ],
        },
        {
          label: 'Contact & hours',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'phone',
                  type: 'text',
                  required: true,
                  defaultValue: d.phone,
                  admin: { description: 'US number, e.g. (312) 555-0142' },
                },
                { name: 'email', type: 'email', required: true, defaultValue: d.email },
              ],
            },
            {
              name: 'address',
              type: 'group',
              fields: [
                { name: 'street', type: 'text', required: true, defaultValue: d.address.street },
                {
                  type: 'row',
                  fields: [
                    { name: 'city', type: 'text', required: true, defaultValue: d.address.city },
                    { name: 'state', type: 'text', required: true, defaultValue: d.address.state },
                    {
                      name: 'zip',
                      label: 'ZIP',
                      type: 'text',
                      required: true,
                      defaultValue: d.address.zip,
                    },
                  ],
                },
              ],
            },
            {
              name: 'hours',
              label: 'Opening hours',
              type: 'array',
              minRows: 1,
              defaultValue: d.hours,
              labels: { singular: 'Line', plural: 'Lines' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'days',
                      type: 'text',
                      required: true,
                      admin: { description: 'e.g. Monday – Friday' },
                    },
                    {
                      name: 'time',
                      type: 'text',
                      required: true,
                      admin: { description: 'e.g. 9:00 AM – 7:00 PM, or Closed' },
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'License & doctor',
          fields: [
            {
              name: 'license',
              type: 'group',
              admin: { description: 'Shown in the footer with a link to verify at IDFPR.' },
              fields: [
                {
                  name: 'number',
                  label: 'Illinois pharmacy license number',
                  type: 'text',
                  required: true,
                  defaultValue: d.license.number,
                },
                {
                  name: 'pharmacist',
                  label: 'Pharmacist-in-charge',
                  type: 'text',
                  required: true,
                  defaultValue: d.license.pharmacist,
                  admin: { description: 'Name and credentials, e.g. Jane Doe, PharmD' },
                },
              ],
            },
            {
              name: 'doctor',
              type: 'group',
              fields: [
                {
                  name: 'name',
                  type: 'text',
                  required: true,
                  defaultValue: d.doctor.name,
                  admin: { description: 'e.g. Dr. Alex Morgan, MD' },
                },
                { name: 'title', type: 'text', required: true, defaultValue: d.doctor.title },
              ],
            },
          ],
        },
      ],
    },
  ],
}
