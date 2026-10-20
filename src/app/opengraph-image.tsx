import { ImageResponse } from 'next/og'

import { BrandCross } from '@/components/seo/BrandCross'
import { getSiteSettings } from '@/lib/settings'

// Default picture when a page is shared (Facebook, iMessage, Slack…). Pages with their own image
// (blog posts with a cover) override it. Name and city come from Site Settings.
export const alt = 'Pharmacy logo, name and location'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const revalidate = 3600

export default async function OpengraphImage() {
  const site = await getSiteSettings()

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 80,
        background: 'linear-gradient(135deg, #1f5fc4 0%, #0f2c5c 100%)',
        color: '#ffffff',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 120,
          height: 120,
          borderRadius: 32,
          background: '#ffffff',
        }}
      >
        <BrandCross size={76} color="#1f5fc4" />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 84, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>
          {site.name}
        </div>
        <div style={{ marginTop: 24, fontSize: 40, color: '#d9e8ff' }}>
          {`Licensed Illinois pharmacy · ${site.address.city}, ${site.address.state}`}
        </div>
      </div>
    </div>,
    size,
  )
}
