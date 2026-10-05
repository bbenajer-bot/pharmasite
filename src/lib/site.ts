/**
 * Single source of truth for business details shown across the site.
 *
 * PLACEHOLDERS: every value marked TODO is invented for the demo and must be
 * replaced with the client's real details before launch (see docs/build-plan.md).
 */
export const site = {
  name: 'Meridian Pharmacy', // TODO: real pharmacy name
  shortName: 'Meridian',
  tagline: 'Your neighborhood pharmacy, now online.',
  description:
    'A licensed Illinois pharmacy offering prescription refills, doctor consultations, vaccinations, and everyday health products, in store and online.',

  phone: '(312) 555-0142', // TODO: real phone (555-01xx numbers are reserved fictional numbers)
  phoneHref: 'tel:+13125550142',
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

  // Shown in the footer so visitors can verify the pharmacy at IDFPR.
  license: {
    pharmacy: 'IL Pharmacy License #000.000000', // TODO: real license number
    pharmacistInCharge: 'Pharmacist-in-charge: Jane Doe, PharmD', // TODO
    verifyUrl: 'https://online-dfpr.micropact.com/lookup/licenselookup.aspx',
  },

  doctor: {
    name: 'Dr. Alex Morgan, MD', // TODO: real doctor name + credentials
    title: 'Founder & Supervising Physician',
  },
} as const

export const nav = [
  { label: 'Shop', href: '/shop' },
  { label: 'Services', href: '/services' },
  { label: 'Prescriptions', href: '/prescriptions' },
  { label: 'Blog', href: '/blog' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
] as const

export const fullAddress = `${site.address.street}, ${site.address.city}, ${site.address.state} ${site.address.zip}`
