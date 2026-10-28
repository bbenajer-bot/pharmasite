import type { Metadata } from 'next'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import React from 'react'

import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { getSiteSettings } from '@/lib/settings'
import { defaultShareImage, isPreviewSite, siteUrl } from '@/lib/url'
import './styles.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  weight: ['600', '700', '800'],
  display: 'swap',
})

// Preview deployments (NEXT_PUBLIC_PREVIEW_MODE=true) keep search engines out.
const isPreview = isPreviewSite

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteSettings()
  return {
    metadataBase: new URL(siteUrl()),
    title: {
      default: `${site.name} | Licensed Illinois Pharmacy`,
      template: `%s | ${site.name}`,
    },
    description: site.description,
    // Pages fill in their own title/description. The image (src/app/opengraph-image.tsx) must be
    // listed here: this openGraph object replaces the file-based one instead of merging with it.
    openGraph: {
      type: 'website',
      siteName: site.name,
      locale: 'en_US',
      images: [defaultShareImage],
    },
    twitter: { card: 'summary_large_image' },
    ...(isPreview && { robots: { index: false, follow: false } }),
  }
}

export default async function FrontendLayout({ children }: { children: React.ReactNode }) {
  const site = await getSiteSettings()

  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable}`}>
      <body className="flex min-h-screen flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:shadow"
        >
          Skip to content
        </a>
        <Header site={{ name: site.name, phone: site.phone, phoneHref: site.phoneHref }} />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
