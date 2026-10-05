import type { Metadata } from 'next'
import { ArrowRight, CalendarCheck, Mail, MapPin, Phone } from 'lucide-react'

import { PageHeader } from '@/components/layout/PageHeader'
import { fullAddress, site } from '@/lib/site'
import { ContactForm } from './ContactForm'

export const metadata: Metadata = {
  title: 'Contact',
  description: `Contact ${site.name}: send a message, call ${site.phone}, or visit us at ${fullAddress}.`,
}

export default function ContactPage() {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`

  return (
    <>
      <PageHeader eyebrow="Contact" title="Get in touch">
        <p>
          Questions about an order, a service, or our hours? Send us a message and we&apos;ll get
          back to you, or call for a faster answer.
        </p>
      </PageHeader>

      <div className="container-page grid gap-12 pb-20 lg:grid-cols-[1.4fr_1fr]">
        <section aria-labelledby="form-heading">
          <h2 id="form-heading" className="sr-only">
            Send us a message
          </h2>
          <ContactForm />
        </section>

        <aside className="space-y-4" aria-label="Contact details">
          <div className="rounded-2xl bg-surface p-6">
            <Phone className="size-6 text-brand-600" aria-hidden />
            <h2 className="mt-4 font-semibold">Phone</h2>
            <a
              href={site.phoneHref}
              className="mt-1 block text-lg font-semibold text-brand-600 hover:text-brand-700"
            >
              {site.phone}
            </a>
            <p className="mt-1 text-sm text-ink-soft">The fastest way to reach a pharmacist.</p>
          </div>

          <div className="rounded-2xl bg-surface p-6">
            <Mail className="size-6 text-brand-600" aria-hidden />
            <h2 className="mt-4 font-semibold">Email</h2>
            <a
              href={`mailto:${site.email}`}
              className="mt-1 block text-brand-600 hover:text-brand-700"
            >
              {site.email}
            </a>
          </div>

          <div className="rounded-2xl bg-surface p-6">
            <MapPin className="size-6 text-brand-600" aria-hidden />
            <h2 className="mt-4 font-semibold">Address</h2>
            <p className="mt-1 text-sm text-ink-soft">{fullAddress}</p>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              Get directions <ArrowRight className="size-4" aria-hidden />
              <span className="sr-only">(opens Google Maps in a new tab)</span>
            </a>
          </div>

          <div className="rounded-2xl bg-surface p-6">
            <CalendarCheck className="size-6 text-brand-600" aria-hidden />
            <h2 className="mt-4 font-semibold">Hours</h2>
            <dl className="mt-1 space-y-1 text-sm">
              {site.hours.map((h) => (
                <div key={h.days} className="flex justify-between gap-4">
                  <dt className="text-ink-soft">{h.days}</dt>
                  <dd className="font-medium text-ink">{h.time}</dd>
                </div>
              ))}
            </dl>
          </div>
        </aside>
      </div>
    </>
  )
}
