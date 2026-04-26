import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

export const dynamic = 'force-static'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // 일반 검색엔진 — 전부 허용 (admin/preview/read 제외)
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/preview', '/read'],
      },
      // AI 학습/검색 크롤러 — 명시적 허용
      // (CFD 기술 블로그라 AI 인덱싱은 발견성 측면에서 이득이 큼)
      // 차단을 원하면 disallow: ['/']로 변경
      { userAgent: 'GPTBot', allow: '/', disallow: ['/admin', '/preview', '/read'] },
      { userAgent: 'OAI-SearchBot', allow: '/', disallow: ['/admin', '/preview', '/read'] },
      { userAgent: 'ChatGPT-User', allow: '/', disallow: ['/admin', '/preview', '/read'] },
      { userAgent: 'ClaudeBot', allow: '/', disallow: ['/admin', '/preview', '/read'] },
      { userAgent: 'Claude-Web', allow: '/', disallow: ['/admin', '/preview', '/read'] },
      { userAgent: 'PerplexityBot', allow: '/', disallow: ['/admin', '/preview', '/read'] },
      { userAgent: 'Perplexity-User', allow: '/', disallow: ['/admin', '/preview', '/read'] },
      { userAgent: 'Google-Extended', allow: '/', disallow: ['/admin', '/preview', '/read'] },
      { userAgent: 'CCBot', allow: '/', disallow: ['/admin', '/preview', '/read'] },
      { userAgent: 'Bytespider', allow: '/', disallow: ['/admin', '/preview', '/read'] },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
