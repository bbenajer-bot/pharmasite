import { convertHTMLToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import type { Payload, PayloadRequest, Where } from 'payload'

import { slugify } from '@/fields/slug'
import type { Product } from '@/payload-types'
import type { ImportProduct } from './parse'

export type ImportOptions = {
  /** What to do when a product with the same SKU (or name) already exists. */
  existing: 'skip' | 'update'
  /** Stock for new products when the file has no count. */
  defaultStock: number
}

export type ImportOutcome = {
  action: 'created' | 'updated' | 'skipped'
  id: number | null
  warnings: string[]
}

const IMAGE_TIMEOUT_MS = 10_000
const IMAGE_MAX_BYTES = 10 * 1024 * 1024

/** Old WordPress HTML often has no <p> tags (WordPress adds them when it shows the page). */
function prepareHtml(html: string): string {
  const cleaned = html.replace(/\[\/?[a-z_-]+[^\]]*\]/gi, '').trim() // shortcodes
  if (/<(p|ul|ol|h[1-6]|div|table|blockquote)\b/i.test(cleaned)) return cleaned
  return cleaned
    .split(/\n{2,}/)
    .map((para) => para.trim())
    .filter(Boolean)
    .map((para) => `<p>${para.replace(/\n/g, '<br>')}</p>`)
    .join('')
}

async function toRichText(payload: Payload, html: string): Promise<Product['description']> {
  const prepared = prepareHtml(html)
  if (!prepared) return null
  const { parseHTML } = await import('linkedom')
  // The converter only needs `new JSDOM(html).window.document`. linkedom is plain JavaScript; jsdom
  // reads extra files at runtime that Netlify's function bundle leaves out.
  class Dom {
    window: { document: Document }
    constructor(body: string) {
      const { document } = parseHTML(`<!doctype html><html><body>${body}</body></html>`)
      this.window = { document: document as unknown as Document }
    }
  }
  const editorConfig = await editorConfigFactory.default({ config: payload.config })
  return convertHTMLToLexical({
    editorConfig,
    html: prepared,
    JSDOM: Dom as unknown as Parameters<typeof convertHTMLToLexical>[0]['JSDOM'],
  }) as Product['description']
}

/** The import downloads images from the old site; never from this server's own network. */
function isPublicHttpUrl(raw: string): boolean {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return false
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false
  const host = url.hostname.toLowerCase()
  if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) return false
  if (/^(127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(host)) return false
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return false
  if (host.startsWith('[')) return false // IPv6 literals
  return true
}

async function importImage(
  req: PayloadRequest,
  url: string,
  alt: string,
): Promise<{ id: number } | { error: string }> {
  const existing = await req.payload.find({
    collection: 'media',
    where: { sourceUrl: { equals: url } },
    limit: 1,
    depth: 0,
    req,
  })
  if (existing.docs[0]) return { id: existing.docs[0].id }
  if (!isPublicHttpUrl(url)) return { error: `Skipped image (not a public web address): ${url}` }

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(IMAGE_TIMEOUT_MS),
      redirect: 'follow',
    })
    if (!res.ok) return { error: `Image not found (${res.status}): ${url}` }
    const mimetype = (res.headers.get('content-type') ?? '').split(';')[0].trim()
    if (!mimetype.startsWith('image/')) return { error: `Not an image: ${url}` }
    const data = Buffer.from(await res.arrayBuffer())
    if (data.length > IMAGE_MAX_BYTES) return { error: `Image larger than 10 MB skipped: ${url}` }

    const base = decodeURIComponent(new URL(url).pathname.split('/').pop() || 'image')
    const name = base.replace(/[^\w.-]+/g, '-').slice(-100) || 'image'
    const media = await req.payload.create({
      collection: 'media',
      data: { alt: alt.slice(0, 120), sourceUrl: url },
      file: { data, mimetype, name, size: data.length },
      req,
    })
    return { id: media.id }
  } catch (err) {
    req.payload.logger.warn({ err, url }, 'Product import: image download failed')
    // Show the reason in the import screen too: the server logs are hard to reach on Netlify.
    const reason =
      err instanceof Error ? err.message.replace(/\s+/g, ' ').slice(0, 300) : String(err)
    return { error: `Image could not be saved (${reason}): ${url}` }
  }
}

async function categoryId(req: PayloadRequest, name: string | null): Promise<number | null> {
  if (!name) return null
  const all = await req.payload.find({
    collection: 'categories',
    pagination: false,
    depth: 0,
    select: { name: true },
    req,
  })
  const found = all.docs.find((c) => c.name.trim().toLowerCase() === name.trim().toLowerCase())
  if (found) return found.id
  const created = await req.payload.create({
    collection: 'categories',
    data: { name: name.slice(0, 60), slug: slugify(name), order: all.docs.length },
    req,
  })
  return created.id
}

/** Existing product with the same SKU; without a SKU, the same name (slug). */
async function findExisting(req: PayloadRequest, p: ImportProduct): Promise<Product | null> {
  const where: Where = p.sku ? { sku: { equals: p.sku } } : { slug: { equals: slugify(p.name) } }
  const found = await req.payload.find({ collection: 'products', where, limit: 1, depth: 0, req })
  return found.docs[0] ?? null
}

async function freeSlug(req: PayloadRequest, name: string): Promise<string> {
  const base = slugify(name) || 'product'
  for (let n = 1; n < 50; n++) {
    const slug = n === 1 ? base : `${base.slice(0, 76)}-${n}`
    const taken = await req.payload.count({
      collection: 'products',
      where: { slug: { equals: slug } },
      req,
    })
    if (!taken.totalDocs) return slug
  }
  return `${base.slice(0, 66)}-${Date.now()}`
}

/** Create or update one product from the CSV. Throws only for validation errors on the product itself. */
export async function importProduct(
  req: PayloadRequest,
  p: ImportProduct,
  options: ImportOptions,
): Promise<ImportOutcome> {
  const warnings: string[] = []
  const existing = await findExisting(req, p)
  if (existing && options.existing === 'skip') {
    return {
      action: 'skipped',
      id: existing.id,
      warnings: ['Already in the shop; left unchanged.'],
    }
  }

  const imageIds: number[] = []
  const results = await Promise.all(p.imageUrls.map((url) => importImage(req, url, p.name)))
  for (const r of results) {
    if ('id' in r) imageIds.push(r.id)
    else warnings.push(r.error)
  }

  let description: Product['description'] = null
  if (p.descriptionHtml) {
    try {
      description = await toRichText(req.payload, p.descriptionHtml)
    } catch (err) {
      req.payload.logger.warn(
        { err, name: p.name },
        'Product import: description conversion failed',
      )
      const reason = err instanceof Error ? err.message.replace(/\s+/g, ' ').slice(0, 300) : String(err)
      warnings.push(`The description could not be converted (${reason}); add it by hand.`)
    }
  }

  const data = {
    name: p.name,
    brand: p.brand,
    summary: p.summary,
    price: p.price,
    sku: p.sku,
    status: p.status,
    featured: p.featured,
    // The admin confirmed in the import screen that every imported product is over-the-counter.
    isOTC: true,
    category: await categoryId(req, p.categoryName),
    ...(description ? { description } : {}),
    optionName: p.optionName,
  }

  // Options without a stock count keep the shop's current count (matched by SKU, else label), and
  // start at the default for new options. Price and total stock are recalculated by the product hook.
  const currentOptions = existing?.options ?? []
  const productOptions = p.options.map((o) => {
    const current = currentOptions.find((c) =>
      o.sku ? c.sku === o.sku : c.label.trim().toLowerCase() === o.label.trim().toLowerCase(),
    )
    return {
      ...(current?.id ? { id: current.id } : {}),
      label: o.label,
      price: o.price,
      sku: o.sku,
      stock: o.stock ?? current?.stock ?? options.defaultStock,
    }
  })

  if (existing) {
    const updated = await req.payload.update({
      collection: 'products',
      id: existing.id,
      data: {
        ...data,
        // Keep what the shop already has when the file has nothing.
        stock: p.stock ?? existing.stock,
        options: productOptions,
        ...(imageIds.length ? { images: imageIds } : {}),
      },
      req,
    })
    return { action: 'updated', id: updated.id, warnings }
  }

  const created = await req.payload.create({
    collection: 'products',
    data: {
      ...data,
      slug: await freeSlug(req, p.name),
      stock: p.stock ?? options.defaultStock,
      options: productOptions,
      images: imageIds,
    },
    req,
  })
  return { action: 'created', id: created.id, warnings }
}
