import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Hammer, Phone } from 'lucide-react'

import { getSiteSettings } from '@/lib/settings'

/**
 * Temporary "coming soon" pages for routes that are linked from the menu/footer but not built yet.
 * A real page at the same path (e.g. src/app/(frontend)/shop/page.tsx) automatically takes priority,
 * so remove each entry here once its page exists. When the list is empty, keep this file only as the
 * catch-all that sends unknown URLs to the custom 404 (or replace it with app/global-not-found.tsx).
 */
const upcoming: Record<string, { title: string; blurb: string }> = {
  prescriptions: {
    title: 'Prescription requests',
    blurb: 'Request a prescription online and have it reviewed by our doctor.',
  },
  privacy: { title: 'Privacy Policy', blurb: 'How we collect, use, and protect your information.' },
  'hipaa-notice': {
    title: 'Notice of Privacy Practices',
    blurb: 'How your health information may be used and your rights regarding it.',
  },
  terms: { title: 'Terms of Use', blurb: 'The terms that apply when you use this website.' },
  accessibility: {
    title: 'Accessibility',
    blurb: 'Our commitment to making this site usable for everyone.',
  },
}

type Props = { params: Promise<{ slug: string[] }> }

export function generateStaticParams() {
  return Object.keys(upcoming).map((key) => ({ slug: [key] }))
}

// Unknown URLs fall through to notFound(), which renders (frontend)/not-found.tsx inside the site layout.
export const dynamicParams = true

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const page = upcoming[slug.join('/')]
  return page ? { title: page.title, description: page.blurb } : {}
}

export default async function ComingSoonPage({ params }: Props) {
  const { slug } = await params
  const page = upcoming[slug.join('/')]
  if (!page) notFound()
  const site = await getSiteSettings()

  return (
    <section className="bg-gradient-to-b from-brand-50 to-white">
      <div className="container-page flex flex-col items-center py-24 text-center md:py-32">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-sm">
          <Hammer className="size-7" aria-hidden />
        </span>
        <p className="eyebrow mt-6">Coming soon</p>
        <h1 className="mt-3 text-4xl font-bold sm:text-5xl">{page.title}</h1>
        <p className="mt-4 max-w-xl text-lg text-ink-soft">{page.blurb}</p>
        <p className="mt-2 max-w-xl text-ink-soft">
          This page is being built. In the meantime, we&apos;re happy to help by phone.
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
