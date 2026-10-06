import config from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import { cache } from 'react'

import { SITE_SETTINGS_TAG } from '@/globals/SiteSettings'
import { siteDefaults, withDerived, type SiteSettings, type SiteSettingsInput } from './site'

// Cached across requests; the global's afterChange hook clears this tag when the client saves.
const loadSettings = unstable_cache(
  async (): Promise<SiteSettingsInput> => {
    const payload = await getPayload({ config })
    const g = await payload.findGlobal({ slug: 'site-settings', depth: 0 })
    // Fill any empty field from the defaults (e.g. before the client first saves the form).
    const pick = (v: string | null | undefined, fallback: string) => (v?.trim() ? v : fallback)
    return {
      name: pick(g.name, siteDefaults.name),
      description: pick(g.description, siteDefaults.description),
      phone: pick(g.phone, siteDefaults.phone),
      email: pick(g.email, siteDefaults.email),
      address: {
        street: pick(g.address?.street, siteDefaults.address.street),
        city: pick(g.address?.city, siteDefaults.address.city),
        state: pick(g.address?.state, siteDefaults.address.state),
        zip: pick(g.address?.zip, siteDefaults.address.zip),
      },
      hours: g.hours?.length
        ? g.hours.map((h) => ({ days: h.days, time: h.time }))
        : siteDefaults.hours,
      license: {
        number: pick(g.license?.number, siteDefaults.license.number),
        pharmacist: pick(g.license?.pharmacist, siteDefaults.license.pharmacist),
      },
      doctor: {
        name: pick(g.doctor?.name, siteDefaults.doctor.name),
        title: pick(g.doctor?.title, siteDefaults.doctor.title),
      },
      deliveryArea: pick(g.deliveryArea, siteDefaults.deliveryArea),
    }
  },
  [SITE_SETTINGS_TAG],
  { tags: [SITE_SETTINGS_TAG] },
)

/** Business details for the public site. Never throws: falls back to the defaults in site.ts. */
export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  try {
    return withDerived(await loadSettings())
  } catch (err) {
    console.error('Site settings: using defaults, could not read from the database', err)
    return withDerived(siteDefaults)
  }
})
