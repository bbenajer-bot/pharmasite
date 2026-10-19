import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Phone } from 'lucide-react'

import { getSiteSettings } from '@/lib/settings'

export const metadata: Metadata = {
  title: 'Request received',
  description: 'Your request was received.',
  robots: { index: false },
}

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function SubmittedPage({ searchParams }: Props) {
  const sp = await searchParams
  const refill = sp.type === 'refill'
  // Only digits: the number is echoed on the page.
  const ref = typeof sp.ref === 'string' && /^\d{1,9}$/.test(sp.ref) ? sp.ref : undefined
  const site = await getSiteSettings()

  return (
    <section className="bg-gradient-to-b from-brand-50 to-white">
      <div className="container-page flex flex-col items-center py-24 text-center md:py-32">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-white text-mint-700 shadow-sm">
          <CheckCircle2 className="size-7" aria-hidden />
        </span>
        <p className="eyebrow mt-6">{refill ? 'Refill request' : 'Prescription request'}</p>
        <h1 className="mt-3 text-4xl font-bold sm:text-5xl">Thanks, we got your request</h1>
        {ref && (
          <p className="mt-4 text-lg font-semibold text-ink">
            Your request number is <span className="text-brand-600">#{ref}</span>
          </p>
        )}
        <p className="mt-4 max-w-xl text-lg text-ink-soft">
          {refill
            ? 'We’ll call you when your refill is ready, or if we need to check with your prescriber.'
            : 'Our doctor will review your request and we’ll call you. Submitting a request does not guarantee a prescription.'}
        </p>
        <p className="mt-2 max-w-xl text-ink-soft">
          Questions in the meantime? Call us and mention your request number.{' '}
          <strong>In an emergency, call 911.</strong>
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/" className="btn btn-secondary">
            <ArrowLeft className="size-4" aria-hidden /> Back to home
          </Link>
          <a href={site.phoneHref} className="btn btn-primary">
            <Phone className="size-4" aria-hidden /> Call {site.phone}
          </a>
        </div>
      </div>
    </section>
  )
}
