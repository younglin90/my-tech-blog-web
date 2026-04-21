import type { MetadataRoute } from 'next'

export const dynamic = 'force-static'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "영린's CFD Blog",
    short_name: "영린's CFD Blog",
    description: 'CFD 엔지니어를 위한 기술 저널 — 수식, 코드, 인터랙티브 시각화',
    start_url: '/',
    display: 'standalone',
    background_color: '#08111f',
    theme_color: '#08111f',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
