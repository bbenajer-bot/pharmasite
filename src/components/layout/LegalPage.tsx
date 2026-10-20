import { RichText } from '@payloadcms/richtext-lexical/react'
import type { Metadata } from 'next'
import { Phone } from 'lucide-react'

import { PageHeader } from '@/components/layout/PageHeader'
import { fillTokens, getLegalPage } from '@/lib/legal'
import { getLegalPageMeta, type LegalPageKey } from '@/lib/legal-pages'
import { getSiteSettings } from '@/lib/settings'

export function legalMetadata(key: LegalPageKey): Metadata {
  const { title, description } = getLegalPageMeta(key)
  return { title, description }
}

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'America/Chicago' }).format(
    new Date(iso),
  )

/** A legal page whose text the client edits in /admin → Settings → Legal Pages. */
export async function LegalPage({ pageKey }: { pageKey: LegalPageKey }) {
  const meta = getLegalPageMeta(pageKey)
  const [site, page] = await Promise.all([getSiteSettings(), getLegalPage(pageKey)])

  return (
    <>
      <PageHeader eyebrow="Legal" title={meta.title}>
        {page.content && page.lastUpdated ? (
          <p className="text-base">Last updated {formatDate(page.lastUpdated)}</p>
        ) : null}
      </PageHeader>

      <div className="container-page pb-20">
        <div className="max-w-3xl">
          {page.content ? (
            <RichText data={fillTokens(page.content, site)} className="rich-text text-lg" />
          ) : (
            <div className="rounded-xl border border-line bg-surface p-6 text-lg text-ink-soft">
              <p>
                {pageKey === 'npp'
                  ? `You can get a copy of our ${meta.title} at the pharmacy, or ask us to mail or email one to you.`
                  : `We're updating this page. For a copy of our ${meta.title}, please contact us.`}
              </p>
              <a
                href={site.phoneHref}
                className="mt-4 inline-flex items-center gap-2 font-semibold text-brand-600 hover:text-brand-700"
              >
                <Phone className="size-4" aria-hidden /> {site.phone}
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
