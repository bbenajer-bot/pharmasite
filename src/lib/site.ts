/**
 * Business details: types, placeholder defaults, and helpers.
 *
 * The live values are edited by the client in the admin (Settings → Site Settings) and read with
 * `getSiteSettings()` from `@/lib/settings`. The defaults below are used to prefill that form and as a
 * fallback when the database can't be reached, so the site never breaks.
 *
 * PLACEHOLDERS: every value marked TODO is invented for the demo and must be replaced with the
 * client's real details before launch (in the admin; see docs/build-plan.md).
 */

/** What the client edits (stored in the `site-settings` global). */
export type SiteSettingsInput = {
  name: string
  description: string
  phone: string
  email: string
  address: { street: string; city: string; state: string; zip: string }
  hours: { days: string; time: string }[]
  license: { number: string; pharmacist: string }
  doctor: { name: string; title: string }
  deliveryArea: string
}

/** What pages use: the input plus derived display values. */
export type SiteSettings = SiteSettingsInput & {
  phoneHref: string
  fullAddress: string
  license: SiteSettingsInput['license'] & {
    pharmacy: string
    pharmacistInCharge: string
    verifyUrl: string
  }
}

export const siteDefaults: SiteSettingsInput = {
  name: 'Meridian Pharmacy', // TODO: real pharmacy name
  description:
    'A licensed Illinois pharmacy offering prescription refills, doctor consultations, vaccinations, and everyday health products, in store and online.',

  phone: '(312) 555-0142', // TODO: real phone (555-01xx numbers are reserved fictional numbers)
  email: 'hello@example.com', // TODO: business email once created

  address: {
    street: '123 Example Avenue', // TODO
    city: 'Chicago', // TODO
    state: 'IL',
    zip: '60601', // TODO
  },

  hours: [
    // TODO: real opening hours
    { days: 'Monday – Friday', time: '9:00 AM – 7:00 PM' },
    { days: 'Saturday', time: '9:00 AM – 3:00 PM' },
    { days: 'Sunday', time: 'Closed' },
  ],

  license: {
    number: '000.000000', // TODO: real Illinois pharmacy license number
    pharmacist: 'Jane Doe, PharmD', // TODO: real pharmacist-in-charge
  },

  doctor: {
    name: 'Dr. Alex Morgan, MD', // TODO: real doctor name + credentials
    title: 'Founder & Supervising Physician',
  },

  // TODO: confirm the real delivery radius and any fee with the client
  deliveryArea: 'within 5 miles of the pharmacy',
}

// Visitors can verify the pharmacy's license at IDFPR (shown in the footer and on About).
const IDFPR_LOOKUP_URL = 'https://online-dfpr.micropact.com/lookup/licenselookup.aspx'

/** `(312) 555-0142` → `tel:+13125550142` (assumes US numbers). */
export function phoneToHref(phone: string) {
  const digits = phone.replace(/\D/g, '')
  return `tel:+${digits.length === 10 ? `1${digits}` : digits}`
}

export function withDerived(input: SiteSettingsInput): SiteSettings {
  const { street, city, state, zip } = input.address
  return {
    ...input,
    phoneHref: phoneToHref(input.phone),
    fullAddress: `${street}, ${city}, ${state} ${zip}`,
    license: {
      ...input.license,
      pharmacy: `IL Pharmacy License #${input.license.number}`,
      pharmacistInCharge: `Pharmacist-in-charge: ${input.license.pharmacist}`,
      verifyUrl: IDFPR_LOOKUP_URL,
    },
  }
}

export const nav = [
  { label: 'Shop', href: '/shop' },
  { label: 'Services', href: '/services' },
  { label: 'Prescriptions', href: '/prescriptions' },
  { label: 'Blog', href: '/blog' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
] as const
