import type { MetadataRoute } from 'next'

import { absoluteUrl, isPreviewSite } from '@/lib/url'

export default function robots(): MetadataRoute.Robots {
  // Preview deploys have placeholder details: keep every crawler out.
  if (isPreviewSite) return { rules: { userAgent: '*', disallow: '/' } }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api/', '/cart', '/checkout', '/order/'],
    },
    sitemap: absoluteUrl('/sitemap.xml'),
  }
}
