import { ImageResponse } from 'next/og'

import { BrandCross } from '@/components/seo/BrandCross'

// Home-screen icon (iOS) and the logo in the structured data: the logo's cross on brand blue.
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1f5fc4',
      }}
    >
      <BrandCross size={112} color="#ffffff" />
    </div>,
    size,
  )
}
