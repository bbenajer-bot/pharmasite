import Link from 'next/link'
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  MapPin,
  Package,
  Pill,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react'

import { PostCard } from '@/components/blog/PostCard'
import { ProductCard } from '@/components/shop/ProductCard'
import { getLatestPosts, type PostSummary } from '@/lib/posts'
import { getFeaturedProducts, type ProductSummary } from '@/lib/products'
import { getServices } from '@/lib/services'
import { getSiteSettings } from '@/lib/settings'

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 to-white">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 -top-40 size-[36rem] rounded-full bg-brand-100/60 blur-3xl"
      />
      <div className="container-page relative grid items-center gap-12 py-16 md:py-24 lg:grid-cols-2">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white px-3 py-1 text-xs font-semibold text-brand-700">
            <ShieldCheck className="size-4 text-mint-700" aria-hidden />
            Licensed Illinois pharmacy · Physician on staff
          </p>
          <h1 className="mt-6 text-4xl font-extrabold leading-[1.1] sm:text-5xl xl:text-6xl">
            Prescriptions, care, and everyday health in one place.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
            Request a prescription online and have it reviewed by our doctor, refill with ease, and
            shop trusted health products, with the personal service of your neighborhood pharmacy.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/prescriptions" className="btn btn-primary text-base">
              Request a prescription <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link href="/shop" className="btn btn-secondary text-base">
              Shop health products
            </Link>
          </div>
          <ul className="mt-10 grid gap-3 text-sm text-ink-soft sm:grid-cols-3">
            {[
              'Reviewed by a licensed physician',
              'Fast, friendly refills',
              'Local delivery available',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-mint-700" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <HeroVisual />
      </div>
    </section>
  )
}

/** Illustrative UI cards instead of a stock photo. Purely decorative. */
function HeroVisual() {
  return (
    <div aria-hidden className="relative mx-auto w-full max-w-md lg:max-w-none">
      <div className="rounded-3xl border border-line bg-white p-6 pb-6 shadow-xl shadow-brand-900/5 sm:pb-20">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-ink">Prescription request</span>
          <span className="rounded-full bg-mint-50 px-2.5 py-1 text-xs font-semibold text-mint-700">
            Approved
          </span>
        </div>
        <div className="mt-5 space-y-3">
          {[
            ['Submitted', 'Today, 9:14 AM'],
            ['Reviewed by doctor', 'Today, 11:02 AM'],
            ['Ready for pickup', 'Today, 3:00 PM'],
          ].map(([label, time], i) => (
            <div key={label} className="flex items-center gap-3">
              <span
                className={`flex size-8 items-center justify-center rounded-full ${
                  i < 2 ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-600'
                }`}
              >
                <CheckCircle2 className="size-4" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium text-ink">{label}</p>
                <p className="text-xs text-muted">{time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute -bottom-8 -left-4 hidden w-56 rounded-2xl border border-line bg-white p-4 shadow-lg shadow-brand-900/5 sm:block">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-brand-50">
            <Pill className="size-5 text-brand-600" />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink">Refill reminder</p>
            <p className="text-xs text-muted">We&apos;ll text you when it&apos;s due</p>
          </div>
        </div>
      </div>

      <div className="absolute -right-3 -top-5 rounded-full border border-line bg-white px-4 py-2 shadow-md">
        <span className="flex items-center gap-2 text-sm font-semibold text-ink">
          <span className="size-2 rounded-full bg-mint-500" />
          Open today
        </span>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Services                                                            */
/* ------------------------------------------------------------------ */

export async function Services() {
  const services = getServices(await getSiteSettings())

  return (
    <section className="py-20" aria-labelledby="services-heading">
      <div className="container-page">
        <div className="max-w-2xl">
          <p className="eyebrow">What we do</p>
          <h2 id="services-heading" className="mt-3 text-3xl font-bold sm:text-4xl">
            Care that goes beyond the counter
          </h2>
          <p className="mt-4 text-lg text-ink-soft">
            Full pharmacy services with a physician on our team, so you get answers and care in one
            place.
          </p>
        </div>
        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map(({ id, icon: Icon, title, summary }) => (
            <li
              key={id}
              className="group rounded-2xl border border-line bg-white p-6 transition-shadow hover:shadow-lg hover:shadow-brand-900/5"
            >
              <span className="flex size-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                <Icon className="size-6" aria-hidden />
              </span>
              <h3 className="mt-5 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{summary}</p>
            </li>
          ))}
        </ul>
        <Link
          href="/services"
          className="mt-10 inline-flex items-center gap-2 font-semibold text-brand-600 hover:text-brand-700"
        >
          See all services <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* How prescription requests work                                      */
/* ------------------------------------------------------------------ */

const steps = [
  {
    icon: ClipboardList,
    title: 'Fill out a short form',
    body: 'Tell us what you need, your current medications, and any allergies. It takes about 3 minutes.',
  },
  {
    icon: Stethoscope,
    title: 'Our doctor reviews it',
    body: 'A licensed physician reviews your request and contacts you if they need more information.',
  },
  {
    icon: Package,
    title: 'Pick up or get it delivered',
    body: 'Once approved, we fill your prescription for pickup or local delivery.',
  },
]

export function HowItWorks() {
  return (
    <section className="bg-surface py-20" aria-labelledby="how-heading">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Prescription requests</p>
          <h2 id="how-heading" className="mt-3 text-3xl font-bold sm:text-4xl">
            How it works
          </h2>
        </div>
        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, body }, i) => (
            <li key={title} className="relative rounded-2xl bg-white p-6 shadow-sm">
              <span className="text-sm font-bold text-brand-600">Step {i + 1}</span>
              <Icon className="mt-4 size-8 text-brand-600" aria-hidden />
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-10 flex flex-col items-center gap-4">
          <Link href="/prescriptions" className="btn btn-primary text-base">
            Start a request <ArrowRight className="size-4" aria-hidden />
          </Link>
          <p className="max-w-xl text-center text-sm text-muted">
            Submitting a request does not guarantee a prescription. The doctor decides based on your
            health information. <strong className="text-ink">Not for emergencies: call 911.</strong>
          </p>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Featured products                                                   */
/* ------------------------------------------------------------------ */

export async function FeaturedProducts() {
  let products: ProductSummary[] = []
  try {
    products = await getFeaturedProducts(4)
  } catch (err) {
    // The home page must still render (and build) when the database is unreachable.
    console.error('Home: could not load featured products', err)
  }
  if (products.length === 0) return null

  return (
    <section className="py-20" aria-labelledby="products-heading">
      <div className="container-page">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">Shop online</p>
            <h2 id="products-heading" className="mt-3 text-3xl font-bold sm:text-4xl">
              Everyday health essentials
            </h2>
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 font-semibold text-brand-600 hover:text-brand-700"
          >
            Browse the shop <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <li key={p.id}>
              <ProductCard product={p} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* About teaser                                                        */
/* ------------------------------------------------------------------ */

export async function AboutTeaser() {
  const site = await getSiteSettings()
  const initials = site.doctor.name
    .replace(/^Dr\.?\s*/, '')
    .split(/[\s,]+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')

  return (
    <section className="bg-brand-900 py-20 text-white" aria-labelledby="about-heading">
      <div className="container-page grid items-center gap-12 lg:grid-cols-2">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-200">About us</p>
          <h2 id="about-heading" className="mt-3 text-3xl font-bold text-white sm:text-4xl">
            A pharmacy led by a doctor who knows your name
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-brand-100">
            {site.name} was founded to bring physician care and pharmacy service together under one
            roof. We take the time to answer your questions, review your medications, and make
            getting the care you need simple.
          </p>
          <Link href="/about" className="btn mt-8 bg-white text-brand-900 hover:bg-brand-50">
            Our story <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
        <figure className="rounded-3xl bg-white/5 p-8 ring-1 ring-white/10">
          <blockquote className="text-xl leading-relaxed text-white">
            &ldquo;Every patient deserves care that&apos;s personal, clear, and easy to reach.
            That&apos;s what we built here.&rdquo;
          </blockquote>
          <figcaption className="mt-6 flex items-center gap-4">
            <span className="flex size-14 items-center justify-center rounded-full bg-brand-500 font-display text-lg font-bold">
              {initials}
            </span>
            <span>
              <span className="block font-semibold">{site.doctor.name}</span>
              <span className="block text-sm text-brand-200">{site.doctor.title}</span>
            </span>
          </figcaption>
        </figure>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Blog teaser                                                         */
/* ------------------------------------------------------------------ */

export async function BlogTeaser() {
  let posts: PostSummary[] = []
  try {
    posts = await getLatestPosts(3)
  } catch (err) {
    console.error('Home: could not load blog posts', err)
  }
  if (posts.length === 0) return null

  return (
    <section className="py-20" aria-labelledby="blog-heading">
      <div className="container-page">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">Health library</p>
            <h2 id="blog-heading" className="mt-3 text-3xl font-bold sm:text-4xl">
              Advice from our pharmacy team
            </h2>
          </div>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 font-semibold text-brand-600 hover:text-brand-700"
          >
            Read the blog <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
        <ul className="mt-10 grid gap-6 md:grid-cols-3">
          {posts.map((post) => (
            <li key={post.id}>
              <PostCard post={post} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Visit us                                                            */
/* ------------------------------------------------------------------ */

export async function VisitUs() {
  const site = await getSiteSettings()
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.fullAddress)}`

  return (
    <section className="bg-surface py-20" aria-labelledby="visit-heading">
      <div className="container-page grid gap-10 lg:grid-cols-[1fr_1.3fr]">
        <div>
          <p className="eyebrow">Visit us</p>
          <h2 id="visit-heading" className="mt-3 text-3xl font-bold sm:text-4xl">
            Stop by or give us a call
          </h2>
          <p className="mt-4 text-lg text-ink-soft">
            Our pharmacists are happy to answer questions about your medications, in person or over
            the phone.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href={site.phoneHref} className="btn btn-primary">
              Call {site.phone}
            </a>
            <Link href="/contact" className="btn btn-secondary">
              Send a message
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <MapPin className="size-6 text-brand-600" aria-hidden />
            <h3 className="mt-4 font-semibold">Address</h3>
            <p className="mt-1 text-sm text-ink-soft">{site.fullAddress}</p>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              Get directions <ArrowRight className="size-4" aria-hidden />
            </a>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <CalendarCheck className="size-6 text-brand-600" aria-hidden />
            <h3 className="mt-4 font-semibold">Hours</h3>
            <dl className="mt-1 space-y-1 text-sm">
              {site.hours.map((h) => (
                <div key={h.days} className="flex justify-between gap-4">
                  <dt className="whitespace-nowrap text-ink-soft">{h.days}</dt>
                  <dd className="whitespace-nowrap font-medium text-ink">{h.time}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  )
}
