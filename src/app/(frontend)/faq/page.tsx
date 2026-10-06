import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'

import { PageHeader } from '@/components/layout/PageHeader'
import { getSiteSettings } from '@/lib/settings'
import type { SiteSettings } from '@/lib/site'

export const metadata: Metadata = {
  title: 'FAQ',
  description:
    'Answers to common questions about insurance, prescription transfers, delivery, ordering, and payment.',
}

type QA = { q: string; a: React.ReactNode }

// TODO: confirm insurance, delivery, and payment answers with the client before launch.
const getGroups = (site: SiteSettings): { id: string; title: string; items: QA[] }[] => [
  {
    id: 'insurance',
    title: 'Insurance',
    items: [
      {
        q: 'Do you accept my insurance?',
        a: (
          <>
            We work with many insurance plans for prescriptions. Plans change often, so the quickest
            way to know is to call us at{' '}
            <a href={site.phoneHref} className="font-semibold text-brand-600 hover:underline">
              {site.phone}
            </a>{' '}
            with your insurance card handy.
          </>
        ),
      },
      {
        q: 'Can I use insurance in the online shop?',
        a: 'No. The online shop sells over-the-counter products only, and those orders are paid directly. Insurance applies to prescriptions filled at the pharmacy.',
      },
      {
        q: 'What if I don’t have insurance?',
        a: 'You can still fill prescriptions with us. Ask a pharmacist about the cash price and whether a lower-cost alternative is available.',
      },
    ],
  },
  {
    id: 'transfers',
    title: 'Prescriptions and transfers',
    items: [
      {
        q: 'How do I transfer a prescription to you?',
        a: 'Call us or stop by with the name of your current pharmacy and the medication. We contact them and handle the transfer for you.',
      },
      {
        q: 'How do I request a new prescription online?',
        a: (
          <>
            Fill out our{' '}
            <Link href="/prescriptions" className="font-semibold text-brand-600 hover:underline">
              prescription request form
            </Link>
            . Our doctor reviews every request and will contact you if more information is needed.
            Submitting a request does not guarantee a prescription.
          </>
        ),
      },
      {
        q: 'Can I use the online forms in an emergency?',
        a: (
          <strong className="text-ink">
            No. Our forms are not monitored around the clock. In an emergency, call 911.
          </strong>
        ),
      },
    ],
  },
  {
    id: 'delivery',
    title: 'Delivery and pickup',
    items: [
      {
        q: 'Do you deliver?',
        a: `Yes, we deliver prescriptions and shop orders ${site.deliveryArea}. Outside that area, shop orders can be shipped.`,
      },
      {
        q: 'Can I pick up my order in store?',
        a: 'Yes. Choose pickup at checkout, and we will let you know when your order is ready.',
      },
    ],
  },
  {
    id: 'ordering',
    title: 'Ordering online',
    items: [
      {
        q: 'What can I buy in the online shop?',
        a: 'Over-the-counter health products such as vitamins, first aid supplies, health devices, and personal care items. Prescription medicines are never sold through the shop.',
      },
      {
        q: 'How do I know my order went through?',
        a: 'You will get an email confirming we received your order, followed by payment instructions. We ship or prepare your order once payment is received.',
      },
    ],
  },
  {
    id: 'payment',
    title: 'Payment',
    items: [
      {
        q: 'How do I pay for an online order?',
        a: 'At checkout, choose how you would like to pay: PayPal, Venmo, Cash App, Zelle, Apple Pay, or a card invoice. We then email you instructions for that method. We never ask for card numbers on this website.',
      },
      {
        q: 'What happens if I don’t pay right away?',
        a: 'We send a reminder after 48 hours. Unpaid orders are cancelled after 7 days, and you can always place a new one.',
      },
    ],
  },
]

export default async function FaqPage() {
  const site = await getSiteSettings()
  const groups = getGroups(site)

  return (
    <>
      <PageHeader eyebrow="FAQ" title="Frequently asked questions">
        <p>
          Can&apos;t find your answer?{' '}
          <Link href="/contact" className="font-semibold text-brand-600 hover:text-brand-700">
            Send us a message
          </Link>{' '}
          or call{' '}
          <a href={site.phoneHref} className="font-semibold text-brand-600 hover:text-brand-700">
            {site.phone}
          </a>
          .
        </p>
      </PageHeader>

      <div className="container-page grid gap-12 py-12 lg:grid-cols-[14rem_1fr]">
        <nav aria-label="FAQ topics" className="lg:sticky lg:top-24 lg:self-start">
          <ul className="flex flex-wrap gap-2 lg:flex-col">
            {groups.map((g) => (
              <li key={g.id}>
                <a
                  href={`#${g.id}`}
                  className="block rounded-full px-4 py-2 text-sm font-medium text-ink-soft hover:bg-brand-50 hover:text-brand-700 lg:rounded-lg"
                >
                  {g.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-12">
          {groups.map((g) => (
            <section
              key={g.id}
              id={g.id}
              aria-labelledby={`${g.id}-heading`}
              className="scroll-mt-24"
            >
              <h2 id={`${g.id}-heading`} className="text-2xl font-bold">
                {g.title}
              </h2>
              <div className="mt-4 divide-y divide-line rounded-2xl border border-line">
                {g.items.map((item) => (
                  <details key={item.q} className="group">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-6 py-5 font-semibold text-ink hover:text-brand-700 [&::-webkit-details-marker]:hidden">
                      {item.q}
                      <ChevronDown
                        className="size-5 shrink-0 text-muted transition-transform group-open:rotate-180"
                        aria-hidden
                      />
                    </summary>
                    <div className="px-6 pb-6 leading-relaxed text-ink-soft">{item.a}</div>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </>
  )
}
