// NEXT_PUBLIC_SITE_URL 환경변수로 오버라이드 가능.
// Cloudflare Pages: Settings → Environment variables → NEXT_PUBLIC_SITE_URL=https://yourdomain.com
export const SITE_URL =
  (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cfdblog.cc').replace(/\/$/, '')

// GitHub repository (소스 보기·편집 링크에 사용). NEXT_PUBLIC_GITHUB_REPO로 오버라이드.
// 형식: 'owner/repo' (예: 'younglin90/my-tech-blog-web')
export const GITHUB_REPO =
  (process.env.NEXT_PUBLIC_GITHUB_REPO ?? 'younglin90/my-tech-blog-web').replace(/^\/+|\/+$/g, '')

export const GITHUB_REPO_URL = `https://github.com/${GITHUB_REPO}`
