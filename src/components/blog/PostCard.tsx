import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, BookOpen } from 'lucide-react'

import { formatPostDate, type PostSummary } from '@/lib/posts'

export function PostCard({ post }: { post: PostSummary }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white transition-shadow hover:shadow-lg hover:shadow-brand-900/5"
    >
      <div className="relative flex aspect-[16/9] items-center justify-center bg-gradient-to-br from-brand-50 to-surface">
        {post.cover ? (
          <Image
            src={post.cover.url}
            alt=""
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <BookOpen className="size-10 text-brand-600/30" aria-hidden />
        )}
      </div>
      <div className="flex flex-1 flex-col p-6">
        {post.category && (
          <span className="w-fit rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            {post.category.name}
          </span>
        )}
        <h3 className="mt-4 text-lg font-semibold group-hover:text-brand-600">{post.title}</h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">{post.excerpt}</p>
        <div className="mt-6 flex items-center justify-between gap-4 text-sm">
          {post.publishedAt ? (
            <time dateTime={post.publishedAt} className="text-muted">
              {formatPostDate(post.publishedAt)}
            </time>
          ) : (
            <span />
          )}
          <span className="inline-flex items-center gap-1 font-semibold text-brand-600">
            Read <ArrowRight className="size-4" aria-hidden />
          </span>
        </div>
      </div>
    </Link>
  )
}
