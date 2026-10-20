import config from '@payload-config'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

import { LEGAL_PAGES_TAG } from '@/globals/LegalPages'
import type { LegalPageKey } from './legal-pages'
import type { SiteSettings } from './site'

export type LegalPageContent = {
  lastUpdated: string | null
  content: SerializedEditorState | null
}

const loadLegalPages = unstable_cache(
  async () => {
    const payload = await getPayload({ config })
    return payload.findGlobal({ slug: 'legal-pages', depth: 0 })
  },
  [LEGAL_PAGES_TAG],
  { tags: [LEGAL_PAGES_TAG] },
)

/** True when the editor holds at least some text (an emptied editor still has one blank paragraph). */
function hasText(node: unknown): boolean {
  if (!node || typeof node !== 'object') return false
  const n = node as { text?: unknown; children?: unknown[]; root?: unknown }
  if (typeof n.text === 'string' && n.text.trim()) return true
  if (n.root) return hasText(n.root)
  return Array.isArray(n.children) && n.children.some(hasText)
}

/** Copy of the editor state with `{name}`, `{phone}`, `{email}`, `{address}` filled in. */
export function fillTokens<T>(node: T, site: SiteSettings): T {
  const values: Record<string, string> = {
    name: site.name,
    phone: site.phone,
    email: site.email,
    address: site.fullAddress,
  }
  const fill = (s: string) => s.replace(/\{(\w+)\}/g, (m, k: string) => values[k] ?? m)
  const walk = (v: unknown): unknown => {
    if (typeof v === 'string') return fill(v)
    if (Array.isArray(v)) return v.map(walk)
    if (v && typeof v === 'object') {
      return Object.fromEntries(Object.entries(v).map(([k, val]) => [k, walk(val)]))
    }
    return v
  }
  return walk(node) as T
}

/** One legal page's text from the admin. Never throws: returns empty content on a database error. */
export async function getLegalPage(key: LegalPageKey): Promise<LegalPageContent> {
  try {
    const page = (await loadLegalPages())[key]
    return {
      lastUpdated: page?.lastUpdated ?? null,
      content: hasText(page?.content) ? (page!.content as SerializedEditorState) : null,
    }
  } catch (err) {
    console.error(`Legal pages: could not read "${key}"`, err)
    return { lastUpdated: null, content: null }
  }
}
