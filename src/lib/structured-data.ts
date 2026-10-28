/**
 * schema.org JSON-LD for search engines: the pharmacy (home page), products and blog posts.
 * Render with `<JsonLd data={…} />` from `@/components/seo/JsonLd`.
 */
import type { PostDetail } from '@/lib/posts'
import type { ProductDetail } from '@/lib/products'
import type { SiteSettings } from '@/lib/site'
import { absoluteUrl, siteUrl } from '@/lib/url'

/** Stable id so products and posts can point at the pharmacy instead of repeating it. */
export const pharmacyId = () => `${siteUrl()}/#pharmacy`

export function pharmacySchema(site: SiteSettings) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Pharmacy',
    '@id': pharmacyId(),
    name: site.name,
    description: site.description,
    url: `${siteUrl()}/`,
    image: absoluteUrl('/opengraph-image'),
    logo: absoluteUrl('/apple-icon'),
    telephone: site.phone,
    email: site.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.address.street,
      addressLocality: site.address.city,
      addressRegion: site.address.state,
      postalCode: site.address.zip,
      addressCountry: 'US',
    },
    openingHoursSpecification: site.hours.flatMap((h) => {
      const spec = parseHours(h.days, h.time)
      return spec ? [{ '@type': 'OpeningHoursSpecification', ...spec }] : []
    }),
  }
}

export function productSchema(product: ProductDetail) {
  const url = absoluteUrl(`/shop/${product.slug}`)
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.summary,
    url,
    ...(product.sku && { sku: product.sku }),
    ...(product.brand && { brand: { '@type': 'Brand', name: product.brand } }),
    ...(product.images.length > 0 && { image: product.images.map((i) => absoluteUrl(i.url)) }),
    ...(product.category && { category: product.category.name }),
    // Options with different prices: a price range (AggregateOffer) instead of a single price.
    offers: product.priceVaries
      ? {
          '@type': 'AggregateOffer',
          url,
          lowPrice: product.price.toFixed(2),
          highPrice: Math.max(...product.options.map((o) => o.price)).toFixed(2),
          offerCount: product.options.length,
          priceCurrency: 'USD',
          availability: `https://schema.org/${product.stock > 0 ? 'InStock' : 'OutOfStock'}`,
          seller: { '@id': pharmacyId() },
        }
      : {
          '@type': 'Offer',
          url,
          price: product.price.toFixed(2),
          priceCurrency: 'USD',
          availability: `https://schema.org/${product.stock > 0 ? 'InStock' : 'OutOfStock'}`,
          seller: { '@id': pharmacyId() },
        },
  }
}

export function articleSchema(post: PostDetail, site: SiteSettings) {
  const url = absoluteUrl(`/blog/${post.slug}`)
  // Author is free text ("Our pharmacy team" or a person's name).
  const isTeam = /team|staff|pharmacy/i.test(post.author)
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    url,
    mainEntityOfPage: url,
    image: absoluteUrl(post.cover?.url ?? '/opengraph-image'),
    ...(post.publishedAt && { datePublished: post.publishedAt }),
    author: isTeam
      ? { '@type': 'Organization', name: post.author, url: `${siteUrl()}/` }
      : { '@type': 'Person', name: post.author },
    publisher: { '@type': 'Organization', '@id': pharmacyId(), name: site.name },
  }
}

/* ---------------------------------------------------------------------------------------------- */
/* Opening hours: the client types them as free text ("Monday – Friday", "9:00 AM – 7:00 PM").     */
/* Anything this can't read confidently is left out rather than published wrong.                    */
/* ---------------------------------------------------------------------------------------------- */

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const RANGE = /\s*(?:–|—|-|\bto\b|\bthrough\b|\bthru\b)\s*/i

function dayIndex(word: string): number {
  const w = word.trim().slice(0, 3).toLowerCase()
  return DAYS.findIndex((d) => d.slice(0, 3).toLowerCase() === w)
}

const DAY_GROUPS: Record<string, string[]> = {
  weekdays: DAYS.slice(0, 5),
  weekends: DAYS.slice(5),
  daily: DAYS,
  'every day': DAYS,
  '7 days': DAYS,
  'seven days': DAYS,
}

/** "Monday – Friday" → Monday…Friday; "Sat & Sun", "Monday, Wednesday", "Weekdays" also work. */
export function parseDays(text: string): string[] | null {
  const group =
    DAY_GROUPS[
      text
        .trim()
        .toLowerCase()
        .replace(/\s+a\s+week$/, '')
    ]
  if (group) return group
  const out: string[] = []
  for (const part of text.split(/\s*(?:,|&|\band\b)\s*/i).filter(Boolean)) {
    const [a, b, extra] = part.split(RANGE)
    if (extra !== undefined) return null
    const start = dayIndex(a)
    if (start < 0) return null
    if (b === undefined) {
      out.push(DAYS[start])
      continue
    }
    const end = dayIndex(b)
    if (end < 0) return null
    for (let i = start; ; i = (i + 1) % 7) {
      out.push(DAYS[i])
      if (i === end) break
    }
  }
  return out.length ? [...new Set(out)] : null
}

/** "9:00 AM" / "9am" / "17:30" → "09:00". */
export function parseTime(text: string): string | null {
  const m = text.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*([ap])?\.?\s*m?\.?$/i)
  if (!m) return null
  let h = Number(m[1])
  const min = Number(m[2] ?? 0)
  const ap = m[3]?.toLowerCase()
  if (min > 59 || h > 23 || (ap && (h < 1 || h > 12))) return null
  if (!ap && m[2] === undefined) return null // a bare "9" is ambiguous
  if (ap === 'p' && h !== 12) h += 12
  if (ap === 'a' && h === 12) h = 0
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

export function parseHours(
  days: string,
  time: string,
): { dayOfWeek: string[]; opens: string; closes: string } | null {
  const dayOfWeek = parseDays(days)
  if (!dayOfWeek) return null
  if (/24\s*h|24 hours|open 24/i.test(time)) return { dayOfWeek, opens: '00:00', closes: '23:59' }
  const parts = time.split(RANGE)
  if (parts.length !== 2) return null // "Closed", "By appointment", …
  const opens = parseTime(parts[0])
  const closes = parseTime(parts[1])
  return opens && closes ? { dayOfWeek, opens, closes } : null
}
