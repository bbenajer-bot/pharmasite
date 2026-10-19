import config from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload, type Where } from 'payload'

import { POSTS_TAG, publicPostsWhere } from '@/collections/Posts'
import type { ProductImage } from '@/lib/products'
import type { BlogCategory, Media, Post } from '@/payload-types'

export const BLOG_PAGE_SIZE = 9

export type PostSummary = {
  id: number
  slug: string
  title: string
  excerpt: string
  author: string
  publishedAt: string | null
  category: { name: string; slug: string } | null
  cover: ProductImage | null
}

export type PostDetail = PostSummary & { content: Post['content'] }

function toImage(m: number | Media | null | undefined): ProductImage | null {
  if (!m || typeof m === 'number' || !m.url) return null
  return { url: m.url, alt: m.alt, width: m.width ?? null, height: m.height ?? null }
}

function toSummary(p: Post): PostSummary {
  const cat = p.category && typeof p.category === 'object' ? (p.category as BlogCategory) : null
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    author: p.author,
    publishedAt: p.publishedAt ?? null,
    category: cat ? { name: cat.name, slug: cat.slug } : null,
    cover: toImage(p.coverImage),
  }
}

/** "October 19, 2026" (Illinois time, so a post dated late evening doesn't show the next day). */
export function formatPostDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'long',
    timeZone: 'America/Chicago',
  }).format(new Date(iso))
}

const opts = { tags: [POSTS_TAG] }
const sort = ['-publishedAt', '-createdAt']

/* All reads go through overrideAccess: false, so the public access rule applies (published only). */

/** Categories that have at least one published post. */
export const getBlogCategories = unstable_cache(
  async (): Promise<{ name: string; slug: string }[]> => {
    const payload = await getPayload({ config })
    const [cats, posts] = await Promise.all([
      payload.find({
        collection: 'blog-categories',
        sort: 'order',
        limit: 100,
        depth: 0,
        overrideAccess: false,
      }),
      payload.find({
        collection: 'posts',
        where: publicPostsWhere,
        pagination: false,
        depth: 0,
        select: { category: true },
        overrideAccess: false,
      }),
    ])
    const used = new Set(posts.docs.map((p) => p.category))
    return cats.docs.filter((c) => used.has(c.id)).map((c) => ({ name: c.name, slug: c.slug }))
  },
  ['blog-categories'],
  opts,
)

export const getPosts = unstable_cache(
  async ({ category, page }: { category?: string; page: number }) => {
    const payload = await getPayload({ config })
    const and: Where[] = [publicPostsWhere]
    if (category) and.push({ 'category.slug': { equals: category } })

    const res = await payload.find({
      collection: 'posts',
      where: { and },
      sort,
      limit: BLOG_PAGE_SIZE,
      page,
      depth: 1,
      overrideAccess: false,
    })
    return {
      posts: res.docs.map(toSummary),
      total: res.totalDocs,
      page: res.page ?? 1,
      totalPages: res.totalPages,
    }
  },
  ['blog-posts'],
  opts,
)

export const getLatestPosts = unstable_cache(
  async (limit: number): Promise<PostSummary[]> => {
    const payload = await getPayload({ config })
    const res = await payload.find({
      collection: 'posts',
      where: publicPostsWhere,
      sort,
      limit,
      depth: 1,
      overrideAccess: false,
    })
    return res.docs.map(toSummary)
  },
  ['latest-posts'],
  opts,
)

export const getPostBySlug = unstable_cache(
  async (slug: string): Promise<PostDetail | null> => {
    const payload = await getPayload({ config })
    const res = await payload.find({
      collection: 'posts',
      where: { and: [publicPostsWhere, { slug: { equals: slug } }] },
      limit: 1,
      depth: 1,
      overrideAccess: false,
    })
    const p = res.docs[0]
    return p ? { ...toSummary(p), content: p.content } : null
  },
  ['post-by-slug'],
  opts,
)

/** Slugs to prerender at build time. Empty if the database isn't reachable during the build. */
export async function getAllPostSlugs(): Promise<string[]> {
  try {
    const payload = await getPayload({ config })
    const res = await payload.find({
      collection: 'posts',
      where: publicPostsWhere,
      limit: 1000,
      depth: 0,
      select: { slug: true },
      overrideAccess: false,
    })
    return res.docs.map((p) => p.slug)
  } catch (err) {
    console.error('Posts: could not list slugs for prerendering', err)
    return []
  }
}
