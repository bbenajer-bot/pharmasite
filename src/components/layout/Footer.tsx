import Link from 'next/link'
import { Clock, Mail, MapPin, Phone, ShieldCheck } from 'lucide-react'

import { getSiteSettings } from '@/lib/settings'
import { nav } from '@/lib/site'
import { Logo } from './Logo'

const legal = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Notice of Privacy Practices', href: '/hipaa-notice' },
  { label: 'Terms of Use', href: '/terms' },
  { label: 'Accessibility', href: '/accessibility' },
]

export async function Footer() {
  const site = await getSiteSettings()

  return (
    <footer className="bg-brand-900 text-brand-100">
      <div className="container-page grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Logo name={site.name} inverted />
          <p className="max-w-xs text-sm leading-relaxed text-brand-100/80">{site.description}</p>
        </div>

        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
            Explore
          </h2>
          <ul className="space-y-2 text-sm">
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-white hover:underline">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
            Visit us
          </h2>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>{site.fullAddress}</span>
            </li>
            <li className="flex gap-2">
              <Phone className="mt-0.5 size-4 shrink-0" aria-hidden />
              <a href={site.phoneHref} className="hover:text-white hover:underline">
                {site.phone}
              </a>
            </li>
            <li className="flex gap-2">
              <Mail className="mt-0.5 size-4 shrink-0" aria-hidden />
              <a href={`mailto:${site.email}`} className="hover:text-white hover:underline">
                {site.email}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Hours</h2>
          <ul className="space-y-2 text-sm">
            {site.hours.map((h) => (
              <li key={h.days} className="flex gap-2">
                <Clock className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>
                  <span className="text-white">{h.days}</span>
                  <br />
                  {h.time}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-4 py-6 text-xs text-brand-100/80 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-2">
            <ShieldCheck className="size-4 shrink-0 text-mint-500" aria-hidden />
            <p>
              {site.license.pharmacy} · {site.license.pharmacistInCharge} ·{' '}
              <a
                href={site.license.verifyUrl}
                className="underline hover:text-white"
                target="_blank"
                rel="noopener noreferrer"
              >
                Verify with IDFPR
              </a>
            </p>
          </div>
          <ul className="flex flex-wrap gap-x-4 gap-y-1">
            {legal.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-white hover:underline">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <p className="container-page pb-6 text-xs text-brand-100/60">
          © {new Date().getFullYear()} {site.name}. Information on this site is not a substitute for
          professional medical advice. In an emergency, call 911.
        </p>
      </div>
    </footer>
  )
}
