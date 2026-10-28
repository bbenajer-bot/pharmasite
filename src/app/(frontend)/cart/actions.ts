'use server'

import config from '@payload-config'
import { getPayload } from 'payload'

import { publicProductsWhere } from '@/collections/Products'
import type { Media } from '@/payload-types'

export type LiveProduct = {
  id: number
  slug: string
  name: string
  price: number
  stock: number
  image: string | null
  imageAlt: string
  /** Empty for products without options. */
  options: { id: string; label: string; price: number; stock: number }[]
}

/**
 * Current price, name and stock for the products in a visitor's cart. Products that were hidden,
 * deleted, or are no longer OTC are simply missing from the result.
 */
export async function getLiveProducts(ids: unknown): Promise<LiveProduct[]> {
  if (!Array.isArray(ids)) return []
  const clean = [
    ...new Set(ids.filter((id): id is number => Number.isInteger(id) && id > 0)),
  ].slice(0, 50)
  if (clean.length === 0) return []

  const payload = await getPayload({ config })
  const res = await payload.find({
    collection: 'products',
    where: { and: [publicProductsWhere, { id: { in: clean } }] },
    limit: clean.length,
    depth: 1,
    overrideAccess: false,
  })
  return res.docs.map((p) => {
    const img = p.images?.[0] as Media | number | undefined
    const media = img && typeof img === 'object' ? img : null
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      price: p.price,
      stock: p.stock,
      image: media?.url ?? null,
      imageAlt: media?.alt ?? '',
      options: (p.options ?? []).flatMap((o) =>
        o.id ? [{ id: o.id, label: o.label, price: o.price, stock: o.stock }] : [],
      ),
    }
  })
}
