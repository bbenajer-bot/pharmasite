/**
 * Absolute site URL (no trailing slash) for metadata, the sitemap, structured data and email links.
 * NEXT_PUBLIC_SITE_URL wins; otherwise Netlify's own `URL` (the site's main address, set automatically
 * at build and run time), so links never point at localhost on a deploy.
 */
export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || process.env.URL || 'http://localhost:3000').replace(
    /\/+$/,
    '',
  )
}

/** `/shop/x` or an already absolute URL → absolute URL on this site. */
export function absoluteUrl(path: string): string {
  return new URL(path, `${siteUrl()}/`).toString()
}

/** The generated share picture (src/app/opengraph-image.tsx), for metadata `openGraph.images`. */
export const defaultShareImage = {
  url: '/opengraph-image',
  width: 1200,
  height: 630,
  alt: 'Pharmacy logo, name and location',
}

/**
 * NEXT_PUBLIC_PREVIEW_MODE=true on preview deployments: shows a banner and keeps search engines out
 * (noindex + robots.txt) while the site still has placeholder details. Remove the variable at launch.
 */
export const isPreviewSite = process.env.NEXT_PUBLIC_PREVIEW_MODE === 'true'
