import type { MetadataRoute } from 'next'

export const dynamic = 'force-static'

export default function manifest(): MetadataRoute.Manifest {
  // PWA manifest는 앱 단위라 단일 언어로 통일 — 영어 기본.
  // 사용자 locale은 middleware가 redirect로 처리한다.
  return {
    name: "Younglin's CFD Blog",
    short_name: "CFD Blog",
    description: 'A technical journal for CFD engineers — equations, code, interactive visualizations',
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
