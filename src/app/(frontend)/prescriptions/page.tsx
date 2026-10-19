import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Phone, RefreshCw } from 'lucide-react'

import { PageHeader } from '@/components/layout/PageHeader'
import { REQUEST_RETENTION_DAYS } from '@/lib/prescriptions'
import { getSiteSettings } from '@/lib/settings'
import { EmergencyBanner } from './EmergencyBanner'
import { RequestForm } from './RequestForm'

export const metadata: Metadata = {
  title: 'Request a prescription',
  description:
    'Request a prescription online. Our doctor reviews every request and we contact you by phone.',
}

export default async function PrescriptionsPage() {
  const site = await getSiteSettings()
  const doctor = site.doctor.name.split(',')[0]

  return (
    <>
      <PageHeader eyebrow="Prescriptions" title="Request a prescription">
        <p>
          Tell us what you need and why. {doctor} reviews every request and decides whether a
          prescription is right for you. We&apos;ll call you either way.
        </p>
      </PageHeader>

      <div className="container-page grid gap-12 pb-20 lg:grid-cols-[1.6fr_1fr]">
        <section aria-labelledby="form-heading" className="space-y-8">
          <h2 id="form-heading" className="sr-only">
            Prescription request form
          </h2>
          <EmergencyBanner />
          <RequestForm kind="new" pharmacyName={site.name} deliveryArea={site.deliveryArea} />
        </section>

        <aside className="space-y-4" aria-label="More about prescription requests">
          <div className="rounded-2xl bg-surface p-6">
            <h2 className="font-semibold">What happens next</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-ink-soft">
              <li>The doctor reviews your request.</li>
              <li>We call you, and may ask a few more questions.</li>
              <li>
                If approved, we fill it for pickup or delivery. If not, we&apos;ll explain why and
                suggest next steps.
              </li>
            </ol>
          </div>

          <div className="rounded-2xl bg-surface p-6">
            <RefreshCw className="size-6 text-brand-600" aria-hidden />
            <h2 className="mt-4 font-semibold">Need a refill instead?</h2>
            <p className="mt-1 text-sm text-ink-soft">
              If we already fill this prescription for you, use the shorter refill form.
            </p>
            <Link
              href="/prescriptions/refill"
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              Request a refill <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>

          <div className="rounded-2xl bg-surface p-6">
            <Phone className="size-6 text-brand-600" aria-hidden />
            <h2 className="mt-4 font-semibold">Prefer to talk?</h2>
            <a
              href={site.phoneHref}
              className="mt-1 block text-lg font-semibold text-brand-600 hover:text-brand-700"
            >
              {site.phone}
            </a>
          </div>

          <p className="px-1 text-sm text-muted">
            Your request is seen only by our staff and is deleted from this website{' '}
            {REQUEST_RETENTION_DAYS} days after you send it.
          </p>
        </aside>
      </div>
    </>
  )
}
