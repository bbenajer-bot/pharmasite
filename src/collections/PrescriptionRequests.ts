import type { CollectionConfig, Condition } from 'payload'

import {
  FIRST_REQUEST_NUMBER,
  REQUEST_RETENTION_DAYS,
  requestFulfillment,
  requestKinds,
  requestStatuses,
} from '@/lib/prescriptions'

const isAdmin = ({ req }: { req: { user?: unknown } }) => Boolean(req.user)

const isNew: Condition = (data) => data?.kind !== 'refill'
const isRefill: Condition = (data) => data?.kind === 'refill'

/**
 * Prescription and refill requests from the public forms. Contains health information, so:
 * - Only logged-in staff can read, change or delete them. The public never touches the API: the
 *   forms' server action creates requests through the local API.
 * - Notification emails contain only the request number and an admin link (src/lib/email/prescriptions.ts).
 * - Deleted automatically REQUEST_RETENTION_DAYS after they arrive (src/lib/maintenance.ts).
 */
export const PrescriptionRequests: CollectionConfig = {
  slug: 'prescription-requests',
  labels: { singular: 'Prescription request', plural: 'Prescription requests' },
  admin: {
    group: 'Patients',
    useAsTitle: 'requestNumber',
    defaultColumns: ['requestNumber', 'kind', 'name', 'status', 'createdAt'],
    listSearchableFields: ['requestNumber', 'name', 'email', 'phone'],
    description: `Requests from the website. The doctor decides on each one; contact the patient by phone or email. Requests are deleted automatically ${REQUEST_RETENTION_DAYS} days after they arrive.`,
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
      async ({ data, operation, req }) => {
        if (operation !== 'create') return data
        const last = await req.payload.find({
          collection: 'prescription-requests',
          sort: '-requestNumber',
          limit: 1,
          depth: 0,
          select: { requestNumber: true },
          req,
        })
        data.requestNumber = Math.max(FIRST_REQUEST_NUMBER, (last.docs[0]?.requestNumber ?? 0) + 1)
        data.status = 'new'
        return data
      },
    ],
  },
  fields: [
    {
      name: 'requestNumber',
      label: 'Request #',
      type: 'number',
      unique: true,
      index: true,
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'kind',
      label: 'Type',
      type: 'select',
      required: true,
      defaultValue: 'new',
      options: [...requestKinds],
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'new',
      options: [...requestStatuses],
      admin: { position: 'sidebar' },
    },
    {
      name: 'doctorNotes',
      type: 'textarea',
      admin: {
        position: 'sidebar',
        description: 'For staff only. Never shown or sent to the patient.',
      },
    },
    {
      type: 'collapsible',
      label: 'Patient',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'name', type: 'text', required: true, maxLength: 100 },
            {
              name: 'dateOfBirth',
              label: 'Date of birth',
              type: 'text',
              required: true,
              admin: { description: 'YYYY-MM-DD' },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'phone', type: 'text', required: true, maxLength: 30 },
            { name: 'email', type: 'email' },
          ],
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Request',
      fields: [
        {
          name: 'rxNumber',
          label: 'Rx number',
          type: 'text',
          maxLength: 30,
          admin: { condition: isRefill },
        },
        {
          name: 'medication',
          label: 'Medication requested',
          type: 'text',
          maxLength: 200,
          admin: { description: 'For refills: optional, if the patient gave it.' },
        },
        {
          name: 'reason',
          label: 'Reason / symptoms',
          type: 'textarea',
          maxLength: 2000,
          admin: { condition: isNew },
        },
        {
          name: 'currentMedications',
          label: 'Current medications',
          type: 'textarea',
          maxLength: 1000,
          admin: { condition: isNew },
        },
        {
          name: 'allergies',
          type: 'textarea',
          maxLength: 500,
          admin: { condition: isNew },
        },
        {
          type: 'row',
          fields: [
            {
              name: 'fulfillment',
              label: 'Pickup or delivery',
              type: 'select',
              required: true,
              defaultValue: 'pickup',
              options: [...requestFulfillment],
            },
            {
              name: 'deliveryAddress',
              type: 'textarea',
              maxLength: 300,
              admin: { condition: (data) => data?.fulfillment === 'delivery' },
            },
          ],
        },
      ],
    },
    {
      name: 'consentAt',
      label: 'Consent given',
      type: 'date',
      required: true,
      admin: {
        readOnly: true,
        date: { pickerAppearance: 'dayAndTime' },
        description:
          'When the patient ticked the consent box (accurate information, OK to contact them, not for emergencies).',
      },
    },
  ],
}
