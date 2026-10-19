import Papa from 'papaparse'

/**
 * Reads a product CSV exported from WordPress / WooCommerce (Products → Export) into products for
 * this shop. Also accepts simpler spreadsheets (name, price, sku, description, category, stock, image).
 * Pure: no database access, so the preview and the import see exactly the same data.
 */

export const MAX_IMPORT_IMAGES = 6
const SUMMARY_MAX = 200
const NAME_MAX = 120
const SKU_MAX = 40

/** One product ready to be created or updated. Descriptions are still HTML here. */
export type ImportProduct = {
  name: string
  sku: string | null
  brand: string | null
  price: number
  /** null = the file has no stock count for this product. */
  stock: number | null
  summary: string
  descriptionHtml: string
  categoryName: string | null
  imageUrls: string[]
  status: 'active' | 'hidden'
  featured: boolean
}

export type ImportRow = {
  /** Line number in the CSV file (header is line 1). */
  line: number
  name: string
  /** Problems that stop this row from being imported. */
  error: string | null
  /** Things the admin should know; the row can still be imported. */
  warnings: string[]
  /** Suggested default for the "import this row" checkbox. */
  include: boolean
  product: ImportProduct | null
}

export type ParseResult = { rows: ImportRow[]; fileError: string | null }

// Header aliases (lower-case). The first entry is the WooCommerce export name.
const COLUMNS = {
  type: ['type'],
  id: ['id'],
  parent: ['parent'],
  name: ['name', 'title', 'product name', 'product', 'post_title'],
  sku: ['sku', 'upc', 'barcode'],
  published: ['published', 'status', 'post_status'],
  featured: ['is featured?', 'featured'],
  visibility: ['visibility in catalog', 'visibility'],
  short: ['short description', 'summary', 'excerpt', 'post_excerpt'],
  description: ['description', 'post_content', 'content', 'long description'],
  price: ['regular price', 'price', 'regular_price'],
  salePrice: ['sale price', 'sale_price'],
  inStock: ['in stock?', 'stock status', 'stock_status'],
  stock: ['stock', 'quantity', 'stock quantity', 'qty', 'inventory'],
  categories: ['categories', 'category', 'product categories', 'product_cat'],
  tags: ['tags', 'product tags'],
  images: ['images', 'image', 'image url', 'images url', 'image urls'],
  brand: ['brands', 'brand', 'manufacturer'],
} as const

type Column = keyof typeof COLUMNS
type CsvRecord = Record<string, string>

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  rsquo: '’',
  lsquo: '‘',
  rdquo: '”',
  ldquo: '“',
  ndash: '–',
  mdash: '—',
  hellip: '…',
  reg: '®',
  trade: '™',
  copy: '©',
  deg: '°',
  micro: 'µ',
  frac12: '½',
  frac14: '¼',
}

export function decodeEntities(text: string): string {
  return text.replace(/&(#x?[0-9a-f]+|[a-z0-9]+);/gi, (m, code: string) => {
    if (code[0] === '#') {
      const n =
        code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10)
      return Number.isFinite(n) ? String.fromCodePoint(n) : m
    }
    return ENTITIES[code.toLowerCase()] ?? m
  })
}

/** WooCommerce writes line breaks inside cells as a literal "\n". */
export function unescapeWoo(value: string): string {
  return value.replace(/\\r\\n|\\n/g, '\n').replace(/\\"/g, '"')
}

export function htmlToText(html: string): string {
  return decodeEntities(
    html
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<br\s*\/?>|<\/(p|div|li|h[1-6])>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\[\/?[a-z_-]+[^\]]*\]/gi, ' '), // WordPress shortcodes
  )
    .replace(/[ \t ]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim()
}

function clip(text: string, max: number): string {
  const flat = text.replace(/\s+/g, ' ').trim()
  if (flat.length <= max) return flat
  const cut = flat.slice(0, max - 1)
  const space = cut.lastIndexOf(' ')
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,.;:–-]+$/, '')}…`
}

function parsePrice(raw: string): number | null {
  const cleaned = raw.replace(/[$\s]/g, '').replace(/,(?=\d{3}(\D|$))/g, '')
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null
  return Math.round(Number(cleaned) * 100) / 100
}

function parseStock(raw: string): number | null {
  if (!raw.trim()) return null
  const n = Number(raw.trim())
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : null
}

const truthy = (v: string) =>
  /^(1|yes|true|y|x|publish|published|instock|in stock)$/i.test(v.trim())

/** "Health > Pain Relief, Vitamins" → "Pain Relief" (the most specific part of the first category). */
export function firstCategory(raw: string): string | null {
  const first = raw.split(/(?<!\\),/)[0] ?? ''
  const leaf = first.split('>').pop()?.replace(/\\,/g, ',').trim() ?? ''
  const name = decodeEntities(leaf)
  return name && !/^uncategori[sz]ed$/i.test(name) ? name : null
}

export function imageUrls(raw: string): string[] {
  return raw
    .split(/\s*[|,]\s*(?=https?:\/\/)|\s+(?=https?:\/\/)/i)
    .map((u) => u.trim())
    .filter((u) => /^https?:\/\/\S+$/i.test(u))
}

const RX_PATTERN = /\b(rx|rx[- ]only|prescription|prescription[- ]only)\b/i
function looksPrescription(...texts: string[]): boolean {
  return texts.some((t) =>
    RX_PATTERN.test(t.replace(/\bnon[- ]?prescription\b|\bno prescription\b/gi, '')),
  )
}

export function parseProductCsv(csv: string): ParseResult {
  const parsed = Papa.parse<CsvRecord>(csv.replace(/^﻿/, ''), {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.trim().toLowerCase(),
  })
  const headers = parsed.meta.fields ?? []

  const columnOf = {} as Record<Column, string | undefined>
  for (const key of Object.keys(COLUMNS) as Column[]) {
    columnOf[key] = COLUMNS[key].find((alias) => headers.includes(alias))
  }
  if (!columnOf.name || !columnOf.price) {
    return {
      rows: [],
      fileError:
        'This file has no "Name" and "Regular price" (or "Price") columns. In WordPress, export it from Products → Export.',
    }
  }

  const get = (r: CsvRecord, key: Column) => {
    const col = columnOf[key]
    return col ? unescapeWoo(r[col] ?? '').trim() : ''
  }

  // Variable products: the parent row holds the shared details; each variation is its own product here.
  const parents = new Map<string, CsvRecord>()
  for (const r of parsed.data) {
    if (get(r, 'type').toLowerCase().includes('variable')) {
      if (get(r, 'id')) parents.set(`id:${get(r, 'id')}`, r)
      if (get(r, 'sku')) parents.set(get(r, 'sku'), r)
    }
  }
  const variationCount = new Map<CsvRecord, number>()
  for (const r of parsed.data) {
    if (!get(r, 'type').toLowerCase().includes('variation')) continue
    const parent = parents.get(get(r, 'parent'))
    if (parent) variationCount.set(parent, (variationCount.get(parent) ?? 0) + 1)
  }

  const rows: ImportRow[] = parsed.data.map((r, i): ImportRow => {
    const line = i + 2
    const warnings: string[] = []
    const type = get(r, 'type').toLowerCase()
    const rawName = decodeEntities(get(r, 'name'))
    const fail = (error: string): ImportRow => ({
      line,
      name: rawName || '(no name)',
      error,
      warnings,
      include: false,
      product: null,
    })

    if (type.includes('variable')) {
      const n = variationCount.get(r) ?? 0
      return fail(
        `Product with options: its ${n} variation${n === 1 ? ' is' : 's are'} imported as separate products.`,
      )
    }
    if (type.includes('grouped')) {
      return fail('Grouped products can’t be imported; import the products in the group instead.')
    }
    if (type.includes('external')) return fail('External/affiliate products can’t be sold here.')

    const parent = type.includes('variation') ? parents.get(get(r, 'parent')) : undefined
    if (type.includes('variation') && !parent) {
      warnings.push('Its parent product isn’t in this file, so some details may be missing.')
    }
    // Variations inherit empty fields from their parent.
    const field = (key: Column) => get(r, key) || (parent ? get(parent, key) : '')

    if (!rawName) return fail('No product name.')
    let name = rawName
    if (name.length > NAME_MAX) {
      name = clip(name, NAME_MAX)
      warnings.push(`Name shortened to ${NAME_MAX} characters.`)
    }

    const rawPrice = get(r, 'price')
    const price = parsePrice(rawPrice)
    if (price == null) {
      return fail(rawPrice ? `Price "${rawPrice}" isn’t a number.` : 'No regular price.')
    }
    const sale = parsePrice(get(r, 'salePrice'))
    if (sale != null && sale < price) {
      warnings.push(`Sale price $${sale.toFixed(2)} ignored; the regular price is used.`)
    }

    let sku: string | null = get(r, 'sku') || null
    if (sku && sku.length > SKU_MAX) {
      warnings.push(`SKU longer than ${SKU_MAX} characters was dropped.`)
      sku = null
    }

    let stock = parseStock(get(r, 'stock'))
    const inStock = get(r, 'inStock')
    if (inStock && !truthy(inStock) && !/backorder/i.test(inStock)) stock = 0
    if (stock == null) warnings.push('No stock count in the file.')

    const descriptionHtml = field('description')
    const shortText = htmlToText(field('short'))
    let summary = clip(shortText || htmlToText(descriptionHtml), SUMMARY_MAX)
    if (!summary) {
      summary = name
      warnings.push('No description; the name is used as the card summary.')
    } else if (!shortText) {
      warnings.push('No short description; the summary was taken from the description.')
    } else if (shortText.replace(/\s+/g, ' ').length > SUMMARY_MAX) {
      warnings.push(`Short description shortened to ${SUMMARY_MAX} characters.`)
    }

    const categoriesRaw = field('categories')
    const allImages = imageUrls(field('images'))
    if (allImages.length > MAX_IMPORT_IMAGES) {
      warnings.push(`Only the first ${MAX_IMPORT_IMAGES} images are imported.`)
    }

    const published = field('published')
    const hiddenInCatalog = /hidden/i.test(field('visibility'))
    const status: ImportProduct['status'] =
      (published === '' || truthy(published)) && !hiddenInCatalog ? 'active' : 'hidden'
    if (status === 'hidden') warnings.push('Not published on the old site; imported as Hidden.')

    const rx = looksPrescription(rawName, categoriesRaw, field('tags'))
    if (rx) {
      warnings.push(
        'Mentions “Rx” or “prescription”. Prescription medicines must not be sold online; untick unless it’s really OTC.',
      )
    }

    return {
      line,
      name,
      error: null,
      warnings,
      include: !rx,
      product: {
        name,
        sku,
        brand:
          decodeEntities(
            field('brand')
              .split(/(?<!\\),/)[0]
              ?.trim() ?? '',
          ).slice(0, 60) || null,
        price,
        stock,
        summary,
        descriptionHtml,
        categoryName: firstCategory(categoriesRaw),
        imageUrls: allImages.slice(0, MAX_IMPORT_IMAGES),
        status,
        featured: truthy(get(r, 'featured')),
      },
    }
  })

  if (!rows.length) return { rows, fileError: 'The file has no product rows.' }
  return { rows, fileError: null }
}
