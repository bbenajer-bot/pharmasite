import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

const config = withPayload(nextConfig, { devBundleServerPackages: false })
const payloadHeaders = config.headers

// Payload sends `Critical-CH: Sec-CH-Prefers-Color-Scheme` (+ Accept-CH, Vary) on every path so the admin can
// pick its light/dark theme. On public pages it makes Chrome repeat the first request (an extra round trip,
// ~600 ms on mobile) and splits the CDN cache, so keep those headers on the admin only.
export default {
  ...config,
  headers: async () =>
    ((await payloadHeaders?.()) ?? []).map((rule) =>
      rule.source === '/:path*' && rule.headers.some((h) => h.key === 'Critical-CH')
        ? { ...rule, source: '/admin/:path*' }
        : rule,
    ),
} satisfies NextConfig
