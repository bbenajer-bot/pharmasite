import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

import { PageHeader } from '@/components/layout/PageHeader'
import { getServices } from '@/lib/services'
import { getSiteSettings } from '@/lib/settings'

export const metadata: Metadata = {
  title: 'Services',
  description:
    'Prescription refills and transfers, doctor-reviewed prescription requests, vaccinations, medication reviews, and local delivery.',
}

export default async function ServicesPage() {
  const site = await getSiteSettings()
  const services = getServices(site)

  return (
    <>
      <PageHeader eyebrow="Services" title="Care that goes beyond the counter">
        <p>
          Full pharmacy services with a physician on our team. Not sure what you need? Call us at{' '}
          <a href={site.phoneHref} className="font-semibold text-brand-600 hover:text-brand-700">
            {site.phone}
          </a>
          .
        </p>
      </PageHeader>

      <nav aria-label="Services on this page" className="border-y border-line bg-white">
        <ul className="container-page flex gap-2 overflow-x-auto py-3">
          {services.map((s) => (
            <li key={s.id} className="shrink-0">
              <a
                href={`#${s.id}`}
                className="block rounded-full px-4 py-2 text-sm font-medium text-ink-soft hover:bg-brand-50 hover:text-brand-700"
              >
                {s.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="container-page divide-y divide-line">
        {services.map(({ id, icon: Icon, title, details, points, cta }) => (
          <section
            key={id}
            id={id}
            aria-labelledby={`${id}-heading`}
            className="grid scroll-mt-24 gap-8 py-14 md:grid-cols-[auto_1fr_1fr]"
          >
            <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
              <Icon className="size-7" aria-hidden />
            </span>
            <div>
              <h2 id={`${id}-heading`} className="text-2xl font-bold">
                {title}
              </h2>
              <p className="mt-3 leading-relaxed text-ink-soft">{details}</p>
              {cta &&
                (cta.href.startsWith('/') ? (
                  <Link href={cta.href} className="btn btn-primary mt-6">
                    {cta.label} <ArrowRight className="size-4" aria-hidden />
                  </Link>
                ) : (
                  <a href={cta.href} className="btn btn-primary mt-6">
                    {cta.label}
                  </a>
                ))}
            </div>
            <ul className="space-y-3 self-start rounded-2xl bg-surface p-6">
              {points.map((point) => (
                <li key={point} className="flex items-start gap-2 text-sm text-ink">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-mint-700" aria-hidden />
                  {point}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <section className="bg-surface py-16">
        <div className="container-page text-center">
          <h2 className="text-2xl font-bold">Questions about a service?</h2>
          <p className="mt-2 text-ink-soft">
            Check our FAQ or get in touch, and a pharmacist will help.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/faq" className="btn btn-secondary">
              Read the FAQ
            </Link>
            <Link href="/contact" className="btn btn-primary">
              Contact us
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
