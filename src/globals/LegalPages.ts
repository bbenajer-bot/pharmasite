import type { Field, GlobalConfig } from 'payload'

import { refreshCache } from '@/lib/revalidate'
import { legalPages, legalTokens } from '@/lib/legal-pages'

export const LEGAL_PAGES_TAG = 'legal-pages'

const tokenHelp = `You can type these and the site fills them in: ${legalTokens
  .map((t) => `{${t.token}} (${t.label})`)
  .join(', ')}.`

const pageFields = (key: string): Field[] => [
  {
    name: 'lastUpdated',
    label: 'Last updated',
    type: 'date',
    admin: {
      date: { pickerAppearance: 'dayOnly', displayFormat: 'MMMM d, yyyy' },
      description: 'Shown at the top of the page. Change it whenever the text changes.',
    },
  },
  {
    name: 'content',
    type: 'richText',
    admin: {
      description:
        key === 'npp'
          ? `Paste your Notice of Privacy Practices here. While this is empty, the page tells visitors to ask the pharmacy for a copy. ${tokenHelp}`
          : `Draft text for your attorney to review. While this is empty, the page asks visitors to call for a copy. ${tokenHelp}`,
    },
  },
]

/**
 * Text of the legal pages (Privacy Policy, Terms of Use, Accessibility, Notice of Privacy Practices).
 * Editable in the admin so the client's attorney can revise them without a developer.
 * Starter drafts: `pnpm seed:legal`. Pages read it with getLegalPage() in src/lib/legal.ts.
 */
export const LegalPages: GlobalConfig = {
  slug: 'legal-pages',
  label: 'Legal Pages',
  admin: {
    group: 'Settings',
    description:
      'The text of your legal pages. The starting text is a draft: have your attorney review it before launch.',
  },
  access: {
    read: () => true,
    update: ({ req }) => Boolean(req.user),
  },
  hooks: {
    afterChange: [
      ({ doc }) => {
        refreshCache(
          [LEGAL_PAGES_TAG],
          legalPages.map((p) => p.path),
        )
        return doc
      },
    ],
  },
  fields: [
    {
      type: 'tabs',
      tabs: legalPages.map((p) => ({
        name: p.key,
        label: p.title,
        fields: pageFields(p.key),
      })),
    },
  ],
}
