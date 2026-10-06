import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, BadgeCheck, Clock, HandHeart, MessageCircle, ShieldCheck } from 'lucide-react'

import { PageHeader } from '@/components/layout/PageHeader'
import { getSiteSettings } from '@/lib/settings'

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteSettings()
  return {
    title: 'About us',
    description: `The story behind ${site.name}, a physician-led Illinois pharmacy, and the team who care for you.`,
  }
}

const initials = (name: string) =>
  name
    .replace(/^Dr\.?\s*/, '')
    .split(/[\s,]+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')

// TODO: replace with the client's own story and values.
const values = [
  {
    icon: HandHeart,
    title: 'Personal care',
    body: 'We learn your name, your medications, and your questions. You are never just a number in a queue.',
  },
  {
    icon: MessageCircle,
    title: 'Clear answers',
    body: 'We explain what you are taking and why, in plain language, and we take the time to do it.',
  },
  {
    icon: ShieldCheck,
    title: 'Safety first',
    body: 'Every prescription is checked by a pharmacist, and every prescription request is reviewed by our doctor.',
  },
  {
    icon: Clock,
    title: 'Easy to reach',
    body: 'Call, message, or stop by. Online requests and ordering mean less waiting for you.',
  },
]

export default async function AboutPage() {
  const site = await getSiteSettings()

  // TODO: replace with the real team (names, roles, short bios) once the client provides them.
  // Only list people who actually work here; no invented staff.
  const team = [
    { name: site.doctor.name, role: site.doctor.title },
    { name: site.license.pharmacist, role: 'Pharmacist-in-charge' },
  ]

  return (
    <>
      <PageHeader eyebrow="About us" title="A pharmacy led by a doctor who knows your name">
        <p>
          {site.name} brings physician care and pharmacy service together under one roof, so you can
          get answers, prescriptions, and everyday health products in one place.
        </p>
      </PageHeader>

      {/* Story — TODO: client's real story */}
      <section className="py-16" aria-labelledby="story-heading">
        <div className="container-page grid gap-12 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <h2 id="story-heading" className="text-3xl font-bold">
              Our story
            </h2>
            <div className="mt-6 space-y-4 text-lg leading-relaxed text-ink-soft">
              <p>
                {site.name} was founded by {site.doctor.name}, a physician who saw how often
                patients left an appointment with a prescription but no one to ask about it. We
                wanted a pharmacy where the doctor and the pharmacist work side by side.
              </p>
              <p>
                Today we fill prescriptions, review medications, give vaccines, and offer a doctor
                review for prescription requests, all with the attention of a neighborhood pharmacy.
              </p>
            </div>
          </div>

          <aside className="rounded-3xl bg-brand-900 p-8 text-white" aria-label="Licensing">
            <BadgeCheck className="size-8 text-brand-200" aria-hidden />
            <h3 className="mt-4 text-xl font-semibold text-white">Licensed in Illinois</h3>
            <p className="mt-3 text-brand-100">{site.license.pharmacy}</p>
            <p className="mt-1 text-brand-100">{site.license.pharmacistInCharge}</p>
            <a
              href={site.license.verifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-1 font-semibold text-white underline-offset-4 hover:underline"
            >
              Verify our license with IDFPR <ArrowRight className="size-4" aria-hidden />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </aside>
        </div>
      </section>

      {/* Doctor — TODO: real bio and photo */}
      <section className="bg-surface py-16" aria-labelledby="doctor-heading">
        <div className="container-page grid items-center gap-10 md:grid-cols-[auto_1fr]">
          <span
            aria-hidden
            className="flex size-40 items-center justify-center rounded-full bg-brand-600 font-display text-5xl font-bold text-white"
          >
            {initials(site.doctor.name)}
          </span>
          <div>
            <p className="eyebrow">Meet our physician</p>
            <h2 id="doctor-heading" className="mt-2 text-3xl font-bold">
              {site.doctor.name}
            </h2>
            <p className="mt-1 font-medium text-ink-soft">{site.doctor.title}</p>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft">
              {site.doctor.name.split(',')[0]} personally reviews every prescription request we
              receive and works with our pharmacists to make sure your medications are right for
              you. A full bio will appear here soon.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16" aria-labelledby="values-heading">
        <div className="container-page">
          <h2 id="values-heading" className="text-3xl font-bold">
            What we stand for
          </h2>
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map(({ icon: Icon, title, body }) => (
              <li key={title} className="rounded-2xl border border-line p-6">
                <Icon className="size-7 text-brand-600" aria-hidden />
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Team */}
      <section className="bg-surface py-16" aria-labelledby="team-heading">
        <div className="container-page">
          <h2 id="team-heading" className="text-3xl font-bold">
            Our team
          </h2>
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {team.map((person) => (
              <li
                key={person.name}
                className="flex items-center gap-4 rounded-2xl bg-white p-6 shadow-sm"
              >
                <span
                  aria-hidden
                  className="flex size-14 shrink-0 items-center justify-center rounded-full bg-brand-50 font-display text-lg font-bold text-brand-700"
                >
                  {initials(person.name)}
                </span>
                <span>
                  <span className="block font-semibold">{person.name}</span>
                  <span className="block text-sm text-ink-soft">{person.role}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="py-16">
        <div className="container-page flex flex-col items-start justify-between gap-6 rounded-3xl border border-line p-8 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-bold">Have a question for our team?</h2>
            <p className="mt-2 text-ink-soft">
              We&apos;re happy to help by phone, message, or in person.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a href={site.phoneHref} className="btn btn-primary">
              Call {site.phone}
            </a>
            <Link href="/contact" className="btn btn-secondary">
              Send a message
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
