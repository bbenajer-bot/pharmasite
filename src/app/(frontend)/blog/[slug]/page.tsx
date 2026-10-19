import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { ChevronRight, Info, Phone } from 'lucide-react'

import { PostCard } from '@/components/blog/PostCard'
import { formatPostDate, getAllPostSlugs, getLatestPosts, getPostBySlug } from '@/lib/posts'
import { getSiteSettings } from '@/lib/settings'

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return (await getAllPostSlugs()).map((slug) => ({ slug }))
}

// Posts published after the build render on first visit.
export const dynamicParams = true

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) return { title: 'Article not found' }
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.excerpt,
      publishedTime: post.publishedAt ?? undefined,
      authors: [post.author],
      images: post.cover ? [{ url: post.cover.url, alt: post.cover.alt }] : undefined,
    },
  }
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params
  const [post, site, latest] = await Promise.all([
    getPostBySlug(slug),
    getSiteSettings(),
    getLatestPosts(4),
  ])
  if (!post) notFound()
  const more = latest.filter((p) => p.id !== post.id).slice(0, 3)

  return (
    <>
      <article className="container-page py-10 md:py-14">
        <div className="mx-auto max-w-3xl">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1 text-sm text-muted">
              <li>
                <Link href="/blog" className="hover:text-brand-600">
                  Blog
                </Link>
              </li>
              {post.category && (
                <li className="flex items-center gap-1">
                  <ChevronRight className="size-4" aria-hidden />
                  <Link
                    href={`/blog?category=${post.category.slug}`}
                    className="hover:text-brand-600"
                  >
                    {post.category.name}
                  </Link>
                </li>
              )}
            </ol>
          </nav>

          <h1 className="mt-6 text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
            {post.title}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-soft">{post.excerpt}</p>
          <p className="mt-6 text-sm text-muted">
            By <span className="font-semibold text-ink">{post.author}</span>
            {post.publishedAt && (
              <>
                {' · '}
                <time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time>
              </>
            )}
          </p>
        </div>

        {post.cover && (
          <div className="relative mx-auto mt-10 aspect-[16/9] max-w-5xl overflow-hidden rounded-3xl bg-surface">
            <Image
              src={post.cover.url}
              alt={post.cover.alt}
              fill
              priority
              sizes="(min-width: 1024px) 64rem, 100vw"
              className="object-cover"
            />
          </div>
        )}

        <div className="mx-auto mt-10 max-w-3xl">
          <RichText data={post.content} className="rich-text text-lg" />

          <aside
            aria-label="About this article"
            className="mt-12 flex gap-3 rounded-xl border border-line bg-surface p-5 text-sm text-ink-soft"
          >
            <Info className="mt-0.5 size-5 shrink-0 text-brand-600" aria-hidden />
            <p>
              This article is general health information, not medical advice for you personally.
              Talk to your doctor or our pharmacist before starting, stopping or changing any
              medicine. Questions? Call us at{' '}
              <a
                href={site.phoneHref}
                className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:text-brand-700"
              >
                <Phone className="size-3.5" aria-hidden />
                {site.phone}
              </a>
              . <strong className="text-ink">In an emergency, call 911.</strong>
            </p>
          </aside>
        </div>
      </article>

      {more.length > 0 && (
        <section className="bg-surface py-16" aria-labelledby="more-heading">
          <div className="container-page">
            <h2 id="more-heading" className="text-2xl font-bold">
              More articles
            </h2>
            <ul className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {more.map((p) => (
                <li key={p.id}>
                  <PostCard post={p} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  )
}
