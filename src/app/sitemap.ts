import config from '@payload-config'
import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'

import { publicPostsWhere } from '@/collections/Posts'
import { publicProductsWhere } from '@/collections/Products'
import { absoluteUrl } from '@/lib/url'

// Rebuilt at most hourly, so new products and posts appear without a redeploy.
export const revalidate = 3600

/** Public pages worth finding in search. Cart, checkout, order and success pages are left out. */
const pages = [
  { path: '/', priority: 1 },
  { path: '/shop', priority: 0.9 },
  { path: '/prescriptions', priority: 0.9 },
  { path: '/prescriptions/refill', priority: 0.8 },
  { path: '/services', priority: 0.8 },
  { path: '/about', priority: 0.7 },
  { path: '/contact', priority: 0.7 },
  { path: '/blog', priority: 0.7 },
  { path: '/faq', priority: 0.6 },
  { path: '/privacy', priority: 0.2 },
  { path: '/terms', priority: 0.2 },
  { path: '/accessibility', priority: 0.2 },
  { path: '/hipaa-notice', priority: 0.2 },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = pages.map((p) => ({
    url: absoluteUrl(p.path),
    priority: p.priority,
  }))

  // If the database can't be reached (e.g. during a build), still return the fixed pages.
  try {
    const payload = await getPayload({ config })
    const [products, posts] = await Promise.all([
      payload.find({
        collection: 'products',
        where: publicProductsWhere,
        limit: 5000,
        depth: 1,
        select: { slug: true, updatedAt: true, images: true },
        overrideAccess: false,
      }),
      payload.find({
        collection: 'posts',
        where: publicPostsWhere,
        limit: 5000,
        depth: 0,
        select: { slug: true, updatedAt: true },
        overrideAccess: false,
      }),
    ])
    for (const p of products.docs) {
      const images = (p.images ?? []).flatMap((m) =>
        m && typeof m === 'object' && m.url ? [absoluteUrl(m.url)] : [],
      )
      entries.push({
        url: absoluteUrl(`/shop/${p.slug}`),
        lastModified: p.updatedAt,
        priority: 0.6,
        ...(images.length > 0 && { images }),
      })
    }
    for (const p of posts.docs) {
      entries.push({
        url: absoluteUrl(`/blog/${p.slug}`),
        lastModified: p.updatedAt,
        priority: 0.6,
      })
    }
  } catch (err) {
    console.error('Sitemap: could not list products and posts', err)
  }

  return entries
}
