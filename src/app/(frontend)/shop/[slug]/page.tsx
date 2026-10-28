import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { ChevronRight, Info, Phone } from 'lucide-react'

import { JsonLd } from '@/components/seo/JsonLd'
import { AddToCart } from '@/components/shop/AddToCart'
import { ProductPhoto } from '@/components/shop/ProductCard'
import { formatUSD } from '@/lib/money'
import { getAllProductSlugs, getProductBySlug } from '@/lib/products'
import { getSiteSettings } from '@/lib/settings'
import { productSchema } from '@/lib/structured-data'

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return (await getAllProductSlugs()).map((slug) => ({ slug }))
}

// Products added after the build render on first visit.
export const dynamicParams = true

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) return { title: 'Product not found' }
  return { title: product.name, description: product.summary }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const [product, site] = await Promise.all([getProductBySlug(slug), getSiteSettings()])
  if (!product) notFound()

  const [main, ...more] = product.images
  const inStock = product.stock > 0

  return (
    <div className="container-page py-10 md:py-14">
      <JsonLd data={productSchema(product)} />
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1 text-sm text-muted">
          <li>
            <Link href="/shop" className="hover:text-brand-600">
              Shop
            </Link>
          </li>
          {product.category && (
            <li className="flex items-center gap-1">
              <ChevronRight className="size-4" aria-hidden />
              <Link
                href={`/shop?category=${product.category.slug}`}
                className="hover:text-brand-600"
              >
                {product.category.name}
              </Link>
            </li>
          )}
          <li className="flex items-center gap-1">
            <ChevronRight className="size-4" aria-hidden />
            <span aria-current="page" className="text-ink-soft">
              {product.name}
            </span>
          </li>
        </ol>
      </nav>

      <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <ProductPhoto image={main ?? null} sizes="(min-width: 1024px) 50vw, 100vw" priority />
          {more.length > 0 && (
            <ul className="mt-4 grid grid-cols-4 gap-3">
              {more.map((img) => (
                <li key={img.url}>
                  <ProductPhoto image={img} sizes="(min-width: 1024px) 12vw, 25vw" />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          {product.category && <p className="eyebrow">{product.category.name}</p>}
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{product.name}</h1>
          {product.brand && <p className="mt-2 text-ink-soft">by {product.brand}</p>}

          {/* With options, the picker below shows the chosen option's price and stock. */}
          <p className="mt-6 text-3xl font-bold">
            {product.priceVaries ? `From ${formatUSD(product.price)}` : formatUSD(product.price)}
          </p>
          {(!inStock || product.options.length === 0) && (
            <p className={`mt-2 text-sm font-semibold ${inStock ? 'text-mint-700' : 'text-muted'}`}>
              {inStock ? 'In stock' : 'Out of stock. Call us to check when it’s back.'}
            </p>
          )}

          <p className="mt-6 text-lg leading-relaxed text-ink-soft">{product.summary}</p>

          <AddToCart
            stock={product.stock}
            options={product.options}
            optionName={product.optionName}
            product={{
              id: product.id,
              slug: product.slug,
              name: product.name,
              price: product.price,
              image: main?.url ?? null,
              imageAlt: main?.alt ?? '',
            }}
          />

          <div className="mt-8 flex gap-3 rounded-xl border border-line bg-surface p-4 text-sm text-ink-soft">
            <Info className="mt-0.5 size-5 shrink-0 text-brand-600" aria-hidden />
            <p>
              Always read and follow the label. Questions about whether this product is right for
              you or how it mixes with your other medicines? Ask our pharmacist:{' '}
              <a
                href={site.phoneHref}
                className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:text-brand-700"
              >
                <Phone className="size-3.5" aria-hidden />
                {site.phone}
              </a>
            </p>
          </div>

          {product.sku && product.options.length === 0 && (
            <p className="mt-6 text-xs text-muted">SKU: {product.sku}</p>
          )}
        </div>
      </div>

      {product.description && (
        <section className="mt-16 max-w-3xl" aria-labelledby="details-heading">
          <h2 id="details-heading" className="text-2xl font-bold">
            Product details
          </h2>
          <RichText data={product.description} className="rich-text mt-4" />
        </section>
      )}
    </div>
  )
}
