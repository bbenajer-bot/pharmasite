/**
 * The legal pages and the {tokens} their text may contain. Shared by the Legal Pages global
 * (admin), the page routes, and the seed script. No server-only imports here.
 */

export type LegalPageKey = 'privacy' | 'terms' | 'accessibility' | 'npp'

export const legalPages: {
  key: LegalPageKey
  path: string
  title: string
  description: string
}[] = [
  {
    key: 'privacy',
    path: '/privacy',
    title: 'Privacy Policy',
    description: 'How we collect, use, and protect the information you share through this website.',
  },
  {
    key: 'terms',
    path: '/terms',
    title: 'Terms of Use',
    description:
      'The terms that apply when you use this website, shop online, or send us a request.',
  },
  {
    key: 'accessibility',
    path: '/accessibility',
    title: 'Accessibility',
    description:
      'Our commitment to making this website usable for everyone, and how to reach us if something doesn’t work for you.',
  },
  {
    key: 'npp',
    path: '/hipaa-notice',
    title: 'Notice of Privacy Practices',
    description:
      'How your health information may be used and shared, and your rights regarding it.',
  },
]

export const getLegalPageMeta = (key: LegalPageKey) => legalPages.find((p) => p.key === key)!

/** `{name}` in the admin text becomes the pharmacy name from Site Settings, and so on. */
export const legalTokens = [
  { token: 'name', label: 'pharmacy name' },
  { token: 'phone', label: 'phone' },
  { token: 'email', label: 'email' },
  { token: 'address', label: 'full address' },
] as const
