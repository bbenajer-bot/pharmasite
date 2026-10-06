import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, HelpCircle, MessageSquare, Phone, Pill, ShoppingBag } from 'lucide-react'

import { getSiteSettings } from '@/lib/settings'

export const metadata: Metadata = {
  title: 'Page not found',
  description: 'The page you were looking for could not be found.',
}

const links = [
  { href: '/shop', label: 'Shop health products', icon: ShoppingBag },
  { href: '/prescriptions', label: 'Request a prescription', icon: Pill },
  { href: '/faq', label: 'Read the FAQ', icon: HelpCircle },
  { href: '/contact', label: 'Contact us', icon: MessageSquare },
]

export default async function NotFound() {
  const site = await getSiteSettings()

  return (
    <section className="bg-gradient-to-b from-brand-50 to-white">
      <div className="container-page flex flex-col items-center py-24 text-center md:py-32">
        <p className="eyebrow">Error 404</p>
        <h1 className="mt-3 text-4xl font-bold sm:text-5xl">We couldn&apos;t find that page</h1>
        <p className="mt-4 max-w-xl text-lg text-ink-soft">
          The link may be out of date, or the page may have moved. Here are some places to start.
        </p>

        <ul className="mt-10 grid w-full max-w-2xl gap-3 sm:grid-cols-2">
          {links.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4 text-left font-semibold text-ink transition-colors hover:border-brand-200 hover:text-brand-700"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon className="size-5" aria-hidden />
                </span>
                {label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
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
