import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, FileText, Search } from 'lucide-react'

import { PageHeader } from '@/components/layout/PageHeader'
import { ProductCard } from '@/components/shop/ProductCard'
import { getCategories, getShopProducts } from '@/lib/products'
import { getSiteSettings } from '@/lib/settings'

export const metadata: Metadata = {
  title: 'Shop',
  description:
    'Shop vitamins, pain relief, first aid and everyday health essentials. Over-the-counter products only; pay securely by invoice.',
}

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() || undefined

function shopHref(params: { q?: string; category?: string; page?: number }) {
  const sp = new URLSearchParams()
  if (params.q) sp.set('q', params.q)
  if (params.category) sp.set('category', params.category)
  if (params.page && params.page > 1) sp.set('page', String(params.page))
  const qs = sp.toString()
  return qs ? `/shop?${qs}` : '/shop'
}

export default async function ShopPage({ searchParams }: Props) {
  const sp = await searchParams
  const q = first(sp.q)?.slice(0, 100)
  const category = first(sp.category)?.slice(0, 80)
  const page = Math.max(1, Number.parseInt(first(sp.page) ?? '1', 10) || 1)

  const [categories, result, site] = await Promise.all([
    getCategories(),
    getShopProducts({ q, category, page }),
    getSiteSettings(),
  ])
  const activeCategory = categories.find((c) => c.slug === category)
  const filtered = Boolean(q || category)

  return (
    <>
      <PageHeader eyebrow="Shop" title="Everyday health essentials">
        <p>
          Over-the-counter vitamins, pain relief, first aid and personal care. Place your order
          online and we&apos;ll email you how to pay. No card details are entered on this site.
        </p>
      </PageHeader>

      <section className="pb-20" aria-labelledby="results-heading">
        <div className="container-page">
          <div className="flex gap-3 rounded-xl border border-line bg-surface p-4 text-sm text-ink-soft">
            <FileText className="mt-0.5 size-5 shrink-0 text-brand-600" aria-hidden />
            <p>
              Looking for a prescription medicine? Those aren&apos;t sold online.{' '}
              <Link href="/prescriptions" className="font-semibold text-brand-600 hover:text-brand-700">
                Request a prescription
              </Link>{' '}
              and our doctor will review it.
            </p>
          </div>

          <form role="search" action="/shop" method="get" className="mt-8 flex gap-3">
            <label htmlFor="shop-search" className="sr-only">
              Search products
            </label>
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted"
                aria-hidden
              />
              <input
                id="shop-search"
                type="search"
                name="q"
                defaultValue={q}
                placeholder="Search products, e.g. vitamin D"
                maxLength={100}
                className="input pl-12"
              />
            </div>
            {category && <input type="hidden" name="category" value={category} />}
            <button type="submit" className="btn btn-primary">
              Search
            </button>
          </form>

          {categories.length > 0 && (
            <nav aria-label="Product categories" className="mt-6">
              <ul className="flex flex-wrap gap-2">
                {[{ name: 'All products', slug: undefined }, ...categories].map((c) => {
                  const active = c.slug === category
                  return (
                    <li key={c.slug ?? 'all'}>
                      <Link
                        href={shopHref({ q, category: c.slug })}
                        aria-current={active ? 'page' : undefined}
                        className={`inline-block rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                          active
                            ? 'border-brand-600 bg-brand-600 text-white'
                            : 'border-line bg-white text-ink-soft hover:border-brand-200 hover:bg-brand-50'
                        }`}
                      >
                        {c.name}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>
          )}

          <h2 id="results-heading" className="mt-10 text-xl font-bold" aria-live="polite">
            {q
              ? `${result.total} ${result.total === 1 ? 'result' : 'results'} for “${q}”`
              : activeCategory
                ? `${activeCategory.name} (${result.total})`
                : `All products (${result.total})`}
          </h2>

          {result.products.length > 0 ? (
            <ul className="mt-6 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {result.products.map((p) => (
                <li key={p.id}>
                  <ProductCard product={p} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-6 rounded-2xl border border-line p-8 text-center">
              <p className="font-semibold">
                {filtered ? 'No products match your search.' : 'Products are coming soon.'}
              </p>
              <p className="mt-2 text-ink-soft">
                We stock more than we list online. Call us at{' '}
                <a href={site.phoneHref} className="font-semibold text-brand-600 hover:text-brand-700">
                  {site.phone}
                </a>{' '}
                and we&apos;ll check for you.
              </p>
              {filtered && (
                <Link href="/shop" className="btn btn-secondary mt-6">
                  Show all products
                </Link>
              )}
            </div>
          )}

          {result.totalPages > 1 && (
            <nav aria-label="Pagination" className="mt-12 flex items-center justify-between gap-4">
              {result.page > 1 ? (
                <Link href={shopHref({ q, category, page: result.page - 1 })} className="btn btn-secondary">
                  <ArrowLeft className="size-4" aria-hidden /> Previous
                </Link>
              ) : (
                <span />
              )}
              <p className="text-sm text-muted">
                Page {result.page} of {result.totalPages}
              </p>
              {result.page < result.totalPages ? (
                <Link href={shopHref({ q, category, page: result.page + 1 })} className="btn btn-secondary">
                  Next <ArrowRight className="size-4" aria-hidden />
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </div>
      </section>
    </>
  )
}
