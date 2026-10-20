import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

// not-found.tsx's own metadata isn't applied when notFound() is called from a page, so set it here.
export const metadata: Metadata = { title: 'Page not found', robots: { index: false } }

/**
 * Catch-all for unknown URLs: notFound() renders (frontend)/not-found.tsx inside the site layout
 * (header, footer) with a 404 status. Real pages at any path take priority over this route.
 */
export default function CatchAll(): never {
  notFound()
}
