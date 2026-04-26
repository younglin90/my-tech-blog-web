// NEXT_PUBLIC_SITE_URL 환경변수로 오버라이드 가능.
// Cloudflare Pages: Settings → Environment variables → NEXT_PUBLIC_SITE_URL=https://yourdomain.com
export const SITE_URL =
  (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tech-blog.dev').replace(/\/$/, '')
