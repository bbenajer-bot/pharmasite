import config from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload, type Where } from 'payload'

import { PRODUCTS_TAG, publicProductsWhere } from '@/collections/Products'
import type { Category, Media, Product } from '@/payload-types'

export const SHOP_PAGE_SIZE = 24

export type ProductImage = { url: string; alt: string; width: number | null; height: number | null }

export type ProductSummary = {
  id: number
  slug: string
  name: string
  brand: string | null
  summary: string
  price: number
  stock: number
  category: { name: string; slug: string } | null
  image: ProductImage | null
}

export type ProductDetail = ProductSummary & {
  sku: string | null
  images: ProductImage[]
  description: Product['description']
}

function toImage(m: number | Media | null | undefined): ProductImage | null {
  if (!m || typeof m === 'number' || !m.url) return null
  return { url: m.url, alt: m.alt, width: m.width ?? null, height: m.height ?? null }
}

function toSummary(p: Product): ProductSummary {
  const cat = p.category && typeof p.category === 'object' ? (p.category as Category) : null
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    brand: p.brand ?? null,
    summary: p.summary,
    price: p.price,
    stock: p.stock,
    category: cat ? { name: cat.name, slug: cat.slug } : null,
    image: toImage(p.images?.[0]),
  }
}

const opts = { tags: [PRODUCTS_TAG] }

/* All reads go through overrideAccess: false, so the public access rule applies (active OTC only). */

export const getCategories = unstable_cache(
  async (): Promise<{ name: string; slug: string }[]> => {
    const payload = await getPayload({ config })
    const res = await payload.find({
      collection: 'categories',
      sort: 'order',
      limit: 100,
      depth: 0,
      overrideAccess: false,
    })
    return res.docs.map((c) => ({ name: c.name, slug: c.slug }))
  },
  ['categories'],
  opts,
)

export const getShopProducts = unstable_cache(
  async ({ q, category, page }: { q?: string; category?: string; page: number }) => {
    const payload = await getPayload({ config })
    const and: Where[] = [publicProductsWhere]
    if (q) {
      and.push({ or: [{ name: { like: q } }, { brand: { like: q } }, { summary: { like: q } }] })
    }
    if (category) and.push({ 'category.slug': { equals: category } })

    const res = await payload.find({
      collection: 'products',
      where: { and },
      sort: 'name',
      limit: SHOP_PAGE_SIZE,
      page,
      depth: 1,
      overrideAccess: false,
    })
    return {
      products: res.docs.map(toSummary),
      total: res.totalDocs,
      page: res.page ?? 1,
      totalPages: res.totalPages,
    }
  },
  ['shop-products'],
  opts,
)

export const getProductBySlug = unstable_cache(
  async (slug: string): Promise<ProductDetail | null> => {
    const payload = await getPayload({ config })
    const res = await payload.find({
      collection: 'products',
      where: { and: [publicProductsWhere, { slug: { equals: slug } }] },
      limit: 1,
      depth: 1,
      overrideAccess: false,
    })
    const p = res.docs[0]
    if (!p) return null
    return {
      ...toSummary(p),
      sku: p.sku ?? null,
      images: (p.images ?? []).map(toImage).filter((i): i is ProductImage => i !== null),
      description: p.description,
    }
  },
  ['product-by-slug'],
  opts,
)

export const getFeaturedProducts = unstable_cache(
  async (limit: number): Promise<ProductSummary[]> => {
    const payload = await getPayload({ config })
    const res = await payload.find({
      collection: 'products',
      where: { and: [publicProductsWhere, { featured: { equals: true } }] },
      sort: 'name',
      limit,
      depth: 1,
      overrideAccess: false,
    })
    if (res.docs.length > 0) return res.docs.map(toSummary)

    // Nothing marked "featured" yet: show the newest products instead.
    const newest = await payload.find({
      collection: 'products',
      where: publicProductsWhere,
      sort: '-createdAt',
      limit,
      depth: 1,
      overrideAccess: false,
    })
    return newest.docs.map(toSummary)
  },
  ['featured-products'],
  opts,
)

/** Slugs to prerender at build time. Empty if the database isn't reachable during the build. */
export async function getAllProductSlugs(): Promise<string[]> {
  try {
    const payload = await getPayload({ config })
    const res = await payload.find({
      collection: 'products',
      where: publicProductsWhere,
      limit: 1000,
      depth: 0,
      select: { slug: true },
      overrideAccess: false,
    })
    return res.docs.map((p) => p.slug)
  } catch (err) {
    console.error('Products: could not list slugs for prerendering', err)
    return []
  }
}
