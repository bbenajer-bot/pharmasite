import type { Metadata } from 'next'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import React from 'react'

import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { getSiteSettings } from '@/lib/settings'
import './styles.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  weight: ['600', '700', '800'],
  display: 'swap',
})

// Set NEXT_PUBLIC_PREVIEW_MODE=true on preview deployments: shows a banner and keeps search engines out
// while the site still contains placeholder business details. Remove the variable at launch.
const isPreview = process.env.NEXT_PUBLIC_PREVIEW_MODE === 'true'

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteSettings()
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
    title: {
      default: `${site.name} | Licensed Illinois Pharmacy`,
      template: `%s | ${site.name}`,
    },
    description: site.description,
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
        {isPreview && (
          <div className="bg-amber-100 px-4 py-2 text-center text-sm font-medium text-amber-950">
            Preview site, work in progress. Names, contact details, and products shown are
            placeholders. Not open for orders or prescription requests yet.
          </div>
        )}
        <Header site={{ name: site.name, phone: site.phone, phoneHref: site.phoneHref }} />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
