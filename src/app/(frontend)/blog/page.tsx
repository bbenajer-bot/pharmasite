import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'

import { PostCard } from '@/components/blog/PostCard'
import { PageHeader } from '@/components/layout/PageHeader'
import { getBlogCategories, getPosts } from '@/lib/posts'

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Health tips and medication advice from our pharmacy team: how to take your medicines safely, vaccines, and everyday health.',
}

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

const first = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v[0] : v)?.trim() || undefined

function blogHref(params: { category?: string; page?: number }) {
  const sp = new URLSearchParams()
  if (params.category) sp.set('category', params.category)
  if (params.page && params.page > 1) sp.set('page', String(params.page))
  const qs = sp.toString()
  return qs ? `/blog?${qs}` : '/blog'
}

export default async function BlogPage({ searchParams }: Props) {
  const sp = await searchParams
  const category = first(sp.category)?.slice(0, 80)
  const page = Math.max(1, Number.parseInt(first(sp.page) ?? '1', 10) || 1)

  const [categories, result] = await Promise.all([
    getBlogCategories(),
    getPosts({ category, page }),
  ])
  const activeCategory = categories.find((c) => c.slug === category)

  return (
    <>
      <PageHeader eyebrow="Health library" title="Advice from our pharmacy team">
        <p>
          Practical tips on taking medicines safely, staying healthy, and getting the most from your
          pharmacy. General information only; for advice about your own health, talk to us.
        </p>
      </PageHeader>

      <section className="pb-20" aria-labelledby="posts-heading">
        <div className="container-page">
          {categories.length > 1 && (
            <nav aria-label="Blog topics">
              <ul className="flex flex-wrap gap-2">
                {[{ name: 'All articles', slug: undefined }, ...categories].map((c) => {
                  const active = c.slug === category
                  return (
                    <li key={c.slug ?? 'all'}>
                      <Link
                        href={blogHref({ category: c.slug })}
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

          <h2 id="posts-heading" className="mt-10 text-xl font-bold">
            {activeCategory ? activeCategory.name : 'Latest articles'}
          </h2>

          {result.posts.length > 0 ? (
            <ul className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {result.posts.map((post) => (
                <li key={post.id}>
                  <PostCard post={post} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-6 rounded-2xl border border-line p-8 text-center">
              <p className="font-semibold">
                {category ? 'No articles in this topic yet.' : 'Articles are coming soon.'}
              </p>
              {category && (
                <Link href="/blog" className="btn btn-secondary mt-6">
                  Show all articles
                </Link>
              )}
            </div>
          )}

          {result.totalPages > 1 && (
            <nav aria-label="Pagination" className="mt-12 flex items-center justify-between gap-4">
              {result.page > 1 ? (
                <Link
                  href={blogHref({ category, page: result.page - 1 })}
                  className="btn btn-secondary"
                >
                  <ArrowLeft className="size-4" aria-hidden /> Newer
                </Link>
              ) : (
                <span />
              )}
              <p className="text-sm text-muted">
                Page {result.page} of {result.totalPages}
              </p>
              {result.page < result.totalPages ? (
                <Link
                  href={blogHref({ category, page: result.page + 1 })}
                  className="btn btn-secondary"
                >
                  Older <ArrowRight className="size-4" aria-hidden />
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
