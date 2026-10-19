import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Phone } from 'lucide-react'

import { PageHeader } from '@/components/layout/PageHeader'
import { REQUEST_RETENTION_DAYS } from '@/lib/prescriptions'
import { getSiteSettings } from '@/lib/settings'
import { EmergencyBanner } from '../EmergencyBanner'
import { RequestForm } from '../RequestForm'

export const metadata: Metadata = {
  title: 'Request a refill',
  description:
    'Request a refill of a prescription we already fill for you. We call when it’s ready.',
}

export default async function RefillPage() {
  const site = await getSiteSettings()

  return (
    <>
      <PageHeader eyebrow="Prescriptions" title="Request a refill">
        <p>
          For prescriptions we already fill for you. Enter the Rx number from your label and
          we&apos;ll call you when it&apos;s ready, or if we need anything from your prescriber.
        </p>
      </PageHeader>

      <div className="container-page grid gap-12 pb-20 lg:grid-cols-[1.6fr_1fr]">
        <section aria-labelledby="form-heading" className="space-y-8">
          <h2 id="form-heading" className="sr-only">
            Refill request form
          </h2>
          <EmergencyBanner />
          <RequestForm kind="refill" pharmacyName={site.name} deliveryArea={site.deliveryArea} />
        </section>

        <aside className="space-y-4" aria-label="More about refills">
          <div className="rounded-2xl bg-surface p-6">
            <h2 className="font-semibold">Need a new prescription?</h2>
            <p className="mt-1 text-sm text-ink-soft">
              For a medication we don&apos;t fill for you yet, our doctor can review a request.
            </p>
            <Link
              href="/prescriptions"
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              Request a prescription <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>

          <div className="rounded-2xl bg-surface p-6">
            <Phone className="size-6 text-brand-600" aria-hidden />
            <h2 className="mt-4 font-semibold">Prefer to call?</h2>
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
